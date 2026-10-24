import "server-only";
import { cookies } from "next/headers";
import { refreshBackendTokens, type SessionUser } from "@/lib/auth/backend-auth";
import { decryptJson, encryptJson, generateSecureId } from "@/lib/auth/crypto";
import { getRedisClient } from "@/lib/auth/redis";
import {
  evaluateSessionLifetime,
  resolveSessionPolicy,
  shouldRefreshAccessToken,
} from "@/lib/auth/session-policy";

export type { SessionUser };

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt?: number;
}

export interface StoredSessionRecord {
  sessionId: string;
  user: SessionUser;
  tokens: SessionTokens;
  csrfToken: string;
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
  host: string;
}

export interface PublicSessionView {
  authenticated: boolean;
  user: SessionUser | null;
  csrfToken: string | null;
  expiresAt: string | null;
}

export function isSessionCookieSecure(): boolean {
  const raw = (process.env.SESSION_COOKIE_SECURE ?? "true").trim().toLowerCase();
  return raw !== "false" && raw !== "0";
}

export function getSessionCookieName(): string {
  return isSessionCookieSecure() ? "__Host-knorooms_session" : "knorooms_session";
}

function sessionRedisKey(sessionId: string): string {
  return `session:${sessionId}`;
}

function userSessionsIndexKey(sub: string): string {
  return `user-sessions:${sub}`;
}

export async function createSession(params: {
  user: SessionUser;
  tokens: SessionTokens;
  host: string;
}): Promise<StoredSessionRecord> {
  const redis = getRedisClient();
  const now = Date.now();
  const sessionId = generateSecureId(32);
  const csrfToken = generateSecureId(32);

  const lifetime = evaluateSessionLifetime({ createdAt: now, lastActivityAt: now }, now);
  if (!lifetime.valid) {
    throw new Error("Invalid session policy configuration.");
  }

  const record: StoredSessionRecord = {
    sessionId,
    user: params.user,
    tokens: params.tokens,
    csrfToken,
    createdAt: now,
    lastActivityAt: now,
    expiresAt: lifetime.effectiveExpiresAt,
    host: params.host,
  };

  const encrypted = encryptJson(record);
  const policy = resolveSessionPolicy();
  const absoluteTtlSeconds = policy.absoluteTimeoutMinutes * 60;

  const results = await redis
    .multi()
    .set(sessionRedisKey(sessionId), encrypted, "EX", lifetime.remainingSeconds)
    .sadd(userSessionsIndexKey(params.user.sub), sessionId)
    .expire(userSessionsIndexKey(params.user.sub), absoluteTtlSeconds)
    .exec();

  if (!results || results.some(([error]) => error !== null)) {
    throw new Error("Session persistence failed");
  }

  return record;
}

export async function revokeSession(sessionId: string): Promise<void> {
  if (!sessionId) {
    return;
  }

  const redis = getRedisClient();
  const key = sessionRedisKey(sessionId);

  try {
    const encrypted = await redis.get(key);
    if (encrypted) {
      try {
        const parsed = decryptJson<StoredSessionRecord>(encrypted);
        if (parsed.user?.sub) {
          await redis.srem(userSessionsIndexKey(parsed.user.sub), sessionId);
        }
      } catch {
        // Ignore decryption failure on revocation
      }
    }
    await redis.del(key);
  } catch {
    // Best-effort cleanup
  }
}

export async function revokeAllUserSessions(sub: string): Promise<number> {
  if (!sub) {
    return 0;
  }

  const redis = getRedisClient();
  const indexKey = userSessionsIndexKey(sub);
  const sessionIds = await redis.smembers(indexKey);

  if (sessionIds.length === 0) {
    await redis.del(indexKey);
    return 0;
  }

  const pipeline = redis.multi();
  for (const sessionId of sessionIds) {
    pipeline.del(sessionRedisKey(sessionId));
  }
  pipeline.del(indexKey);
  await pipeline.exec();

  return sessionIds.length;
}

export async function getValidSessionById(
  sessionId: string | undefined | null,
): Promise<StoredSessionRecord | null> {
  if (!sessionId) {
    return null;
  }

  const redis = getRedisClient();
  const key = sessionRedisKey(sessionId);

  let encrypted: string | null = null;
  try {
    encrypted = await redis.get(key);
  } catch {
    return null;
  }

  if (!encrypted) {
    return null;
  }

  let session: StoredSessionRecord;
  try {
    session = decryptJson<StoredSessionRecord>(encrypted);
  } catch {
    await revokeSession(sessionId);
    return null;
  }

  const now = Date.now();
  const evaluation = evaluateSessionLifetime(
    { createdAt: session.createdAt, lastActivityAt: session.lastActivityAt },
    now,
  );

  if (!evaluation.valid) {
    await revokeSession(sessionId);
    return null;
  }

  // Refresh access token if <60s remaining and refresh_token is available
  if (shouldRefreshAccessToken(session.tokens.accessTokenExpiresAt, now)) {
    if (!session.tokens.refreshToken) {
      await revokeSession(sessionId);
      return null;
    }

    try {
      const refreshed = await refreshBackendTokens(session.tokens.refreshToken);
      if (!refreshed) {
        await revokeSession(sessionId);
        return null;
      }

      session.tokens = {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        accessTokenExpiresAt: new Date(refreshed.accessTokenExpiresAtUtc).getTime(),
      };
    } catch {
      await revokeSession(sessionId);
      return null;
    }
  }

  // Update sliding idle window
  session.lastActivityAt = now;
  session.expiresAt = evaluation.effectiveExpiresAt;

  try {
    const updatedEncrypted = encryptJson(session);
    await redis.set(key, updatedEncrypted, "EX", evaluation.remainingSeconds);
  } catch {
    // Non-fatal if sliding update fails
  }

  return session;
}

export async function getServerSession(): Promise<StoredSessionRecord | null> {
  const cookieStore = await cookies();
  const cookieName = getSessionCookieName();
  const sessionId = cookieStore.get(cookieName)?.value;
  return getValidSessionById(sessionId);
}

export function toPublicSessionView(session: StoredSessionRecord | null): PublicSessionView {
  if (!session) {
    return {
      authenticated: false,
      user: null,
      csrfToken: null,
      expiresAt: null,
    };
  }

  return {
    authenticated: true,
    user: {
      sub: session.user.sub,
      name: session.user.name,
      email: session.user.email,
    },
    csrfToken: session.csrfToken,
    expiresAt: new Date(session.expiresAt).toISOString(),
  };
}

export function buildSessionCookieOptions(maxAgeSeconds?: number) {
  const policy = resolveSessionPolicy();
  return {
    httpOnly: true,
    secure: isSessionCookieSecure(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds ?? policy.absoluteTimeoutMinutes * 60,
  };
}
