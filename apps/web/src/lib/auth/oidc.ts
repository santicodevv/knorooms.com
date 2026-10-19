import "server-only";
import * as oidc from "openid-client";

export interface OidcEnvConfig {
  issuerUrl: URL;
  clientId: string;
  clientSecret?: string;
  scopes: string;
  postLogoutRedirectPath: string;
}

export function getOidcEnvConfig(): OidcEnvConfig {
  const rawIssuer = (process.env.OIDC_ISSUER ?? "").trim();
  const clientId = (process.env.OIDC_CLIENT_ID ?? "").trim();
  const clientSecret = (process.env.OIDC_CLIENT_SECRET ?? "").trim() || undefined;
  const scopes =
    (process.env.OIDC_SCOPES ?? "openid profile email offline_access").trim() ||
    "openid profile email offline_access";
  const postLogoutRedirectPath = (process.env.OIDC_POST_LOGOUT_REDIRECT_PATH ?? "/").trim() || "/";

  if (!rawIssuer) {
    throw new Error("OIDC_ISSUER is not configured.");
  }
  if (!clientId) {
    throw new Error("OIDC_CLIENT_ID is not configured.");
  }

  return {
    issuerUrl: new URL(rawIssuer),
    clientId,
    clientSecret,
    scopes,
    postLogoutRedirectPath,
  };
}

let cachedConfiguration: {
  issuerKey: string;
  config: oidc.Configuration;
  expiresAt: number;
} | null = null;

export async function getOidcConfiguration(): Promise<oidc.Configuration> {
  const env = getOidcEnvConfig();
  const issuerKey = `${env.issuerUrl.href}|${env.clientId}`;
  const now = Date.now();

  if (
    cachedConfiguration &&
    cachedConfiguration.issuerKey === issuerKey &&
    cachedConfiguration.expiresAt > now
  ) {
    return cachedConfiguration.config;
  }

  const isHttpLocal = env.issuerUrl.protocol === "http:";
  const clientAuth = env.clientSecret ? oidc.ClientSecretPost(env.clientSecret) : oidc.None();

  const config = await oidc.discovery(
    env.issuerUrl,
    env.clientId,
    env.clientSecret ? { client_secret: env.clientSecret } : undefined,
    clientAuth,
    isHttpLocal
      ? {
          execute: [oidc.allowInsecureRequests],
        }
      : undefined,
  );

  cachedConfiguration = {
    issuerKey,
    config,
    expiresAt: now + 5 * 60 * 1000,
  };

  return config;
}

export interface AuthorizationRequestBuildResult {
  authorizationUrl: URL;
  state: string;
  nonce: string;
  codeVerifier: string;
}

export async function createAuthorizationRequest(
  redirectUri: string,
): Promise<AuthorizationRequestBuildResult> {
  const config = await getOidcConfiguration();
  const env = getOidcEnvConfig();

  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
  const state = oidc.randomState();
  const nonce = oidc.randomNonce();

  const authorizationUrl = oidc.buildAuthorizationUrl(config, {
    redirect_uri: redirectUri,
    scope: env.scopes,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    nonce,
  });

  return {
    authorizationUrl,
    state,
    nonce,
    codeVerifier,
  };
}

export interface ExchangedOidcResult {
  user: {
    sub: string;
    name: string;
    email: string;
  };
  tokens: {
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    accessTokenExpiresAt?: number;
  };
}

export async function exchangeAuthorizationCode(params: {
  currentUrl: URL;
  expectedState: string;
  expectedNonce: string;
  codeVerifier: string;
}): Promise<ExchangedOidcResult> {
  const config = await getOidcConfiguration();
  const tokenResponse = await oidc.authorizationCodeGrant(config, params.currentUrl, {
    pkceCodeVerifier: params.codeVerifier,
    expectedState: params.expectedState,
    expectedNonce: params.expectedNonce,
    idTokenExpected: true,
  });

  const claims = tokenResponse.claims();
  if (!claims || typeof claims.sub !== "string" || !claims.sub) {
    throw new Error("OIDC ID Token is missing a valid 'sub' claim.");
  }

  const emailClaim = typeof claims.email === "string" ? claims.email : "";
  const nameClaim =
    typeof claims.name === "string" && claims.name.trim()
      ? claims.name.trim()
      : typeof claims.preferred_username === "string" && claims.preferred_username.trim()
        ? claims.preferred_username.trim()
        : emailClaim || claims.sub;

  const expiresInSeconds = tokenResponse.expiresIn();
  const accessTokenExpiresAt =
    typeof expiresInSeconds === "number" && Number.isFinite(expiresInSeconds)
      ? Date.now() + expiresInSeconds * 1000
      : undefined;

  return {
    user: {
      sub: claims.sub,
      name: nameClaim,
      email: emailClaim,
    },
    tokens: {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      idToken: tokenResponse.id_token,
      accessTokenExpiresAt,
    },
  };
}

export interface RefreshedTokensResult {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  accessTokenExpiresAt?: number;
}

export async function refreshOidcTokens(refreshToken: string): Promise<RefreshedTokensResult> {
  const config = await getOidcConfiguration();
  const tokenResponse = await oidc.refreshTokenGrant(config, refreshToken);

  const expiresInSeconds = tokenResponse.expiresIn();
  const accessTokenExpiresAt =
    typeof expiresInSeconds === "number" && Number.isFinite(expiresInSeconds)
      ? Date.now() + expiresInSeconds * 1000
      : undefined;

  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token ?? refreshToken,
    idToken: tokenResponse.id_token,
    accessTokenExpiresAt,
  };
}

export async function buildOidcLogoutUrl(params: {
  origin: string;
  idTokenHint?: string;
}): Promise<string> {
  const env = getOidcEnvConfig();
  const fallbackUrl = new URL(env.postLogoutRedirectPath, params.origin).toString();

  try {
    const config = await getOidcConfiguration();
    const serverMeta = config.serverMetadata();
    if (!serverMeta.end_session_endpoint) {
      return fallbackUrl;
    }

    const endSessionParams: Record<string, string> = {
      post_logout_redirect_uri: fallbackUrl,
    };
    if (params.idTokenHint) {
      endSessionParams.id_token_hint = params.idTokenHint;
    }

    return oidc.buildEndSessionUrl(config, endSessionParams).toString();
  } catch {
    return fallbackUrl;
  }
}

export function deriveRequestOrigin(request: Request): {
  proto: string;
  host: string;
  origin: string;
} {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const hostHeader = request.headers.get("host")?.split(",")[0]?.trim();
  const reqUrl = new URL(request.url);

  const host = forwardedHost || hostHeader || reqUrl.host;
  const proto = forwardedProto || reqUrl.protocol.replace(":", "") || "http";

  return {
    proto,
    host,
    origin: `${proto}://${host}`,
  };
}
