export const TENANT_SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/;

export const RESERVED_SUBDOMAINS = new Set<string>([
  "www",
  "admin",
  "api",
  "app",
  "auth",
  "static",
  "mail",
]);

export type HostResolution =
  | {
      kind: "public";
      hostname: string;
      rawHost: string;
    }
  | {
      kind: "platform";
      hostname: string;
      rawHost: string;
      subdomain: string;
    }
  | {
      kind: "tenant";
      hostname: string;
      rawHost: string;
      slug: string;
    }
  | {
      kind: "invalid";
      hostname: string;
      rawHost: string;
      reason:
        | "empty_host"
        | "unknown_domain"
        | "nested_subdomain"
        | "reserved_subdomain"
        | "invalid_slug";
      subdomain?: string;
    };

export interface HostResolutionOptions {
  baseDomain?: string;
  platformSubdomain?: string;
}

export function normalizeBaseDomain(baseDomain?: string): string {
  const raw = (baseDomain ?? process.env.APP_BASE_DOMAIN ?? "localhost").trim().toLowerCase();
  const withoutPort = raw.split(":")[0] ?? "localhost";
  return withoutPort.replace(/\.$/, "") || "localhost";
}

export function normalizePlatformSubdomain(platformSubdomain?: string): string {
  const raw = (platformSubdomain ?? process.env.PLATFORM_SUBDOMAIN ?? "admin").trim().toLowerCase();
  return raw || "admin";
}

export function extractHostname(rawHost: string | null | undefined): string {
  if (!rawHost) {
    return "";
  }
  const firstHost = rawHost.split(",")[0]?.trim().toLowerCase() ?? "";
  if (!firstHost) {
    return "";
  }
  // Ignore IPv6 bracket notation edge cases if not used, or strip port after colon
  const colonIndex = firstHost.indexOf(":");
  const hostOnly = colonIndex >= 0 ? firstHost.slice(0, colonIndex) : firstHost;
  return hostOnly.replace(/\.$/, "");
}

export function isValidTenantSlug(slug: string): boolean {
  if (!slug) {
    return false;
  }
  if (RESERVED_SUBDOMAINS.has(slug.toLowerCase())) {
    return false;
  }
  return TENANT_SLUG_REGEX.test(slug);
}

export function resolveHost(
  rawHost: string | null | undefined,
  options?: HostResolutionOptions,
): HostResolution {
  const normalizedRaw = (rawHost ?? "").split(",")[0]?.trim().toLowerCase() ?? "";
  const hostname = extractHostname(normalizedRaw);

  if (!hostname) {
    return {
      kind: "invalid",
      hostname: "",
      rawHost: normalizedRaw,
      reason: "empty_host",
    };
  }

  const baseDomain = normalizeBaseDomain(options?.baseDomain);
  const platformSubdomain = normalizePlatformSubdomain(options?.platformSubdomain);

  if (hostname === baseDomain) {
    return {
      kind: "public",
      hostname,
      rawHost: normalizedRaw,
    };
  }

  const suffix = `.${baseDomain}`;
  if (!hostname.endsWith(suffix)) {
    return {
      kind: "invalid",
      hostname,
      rawHost: normalizedRaw,
      reason: "unknown_domain",
    };
  }

  const subdomain = hostname.slice(0, -suffix.length);
  if (!subdomain || subdomain.includes(".")) {
    return {
      kind: "invalid",
      hostname,
      rawHost: normalizedRaw,
      reason: "nested_subdomain",
      subdomain,
    };
  }

  if (subdomain === platformSubdomain) {
    return {
      kind: "platform",
      hostname,
      rawHost: normalizedRaw,
      subdomain,
    };
  }

  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    return {
      kind: "invalid",
      hostname,
      rawHost: normalizedRaw,
      reason: "reserved_subdomain",
      subdomain,
    };
  }

  if (!TENANT_SLUG_REGEX.test(subdomain)) {
    return {
      kind: "invalid",
      hostname,
      rawHost: normalizedRaw,
      reason: "invalid_slug",
      subdomain,
    };
  }

  return {
    kind: "tenant",
    hostname,
    rawHost: normalizedRaw,
    slug: subdomain,
  };
}

export type ProxyRoutingDecision =
  | { type: "next"; resolution: HostResolution }
  | { type: "rewrite"; targetPathname: string; resolution: HostResolution }
  | { type: "not-found"; resolution: HostResolution; reason: string };

export function isInternalTenantPath(pathname: string): boolean {
  return (
    pathname === "/platform" ||
    pathname.startsWith("/platform/") ||
    pathname === "/school" ||
    pathname.startsWith("/school/")
  );
}

export function resolveProxyRouting(
  rawHost: string | null | undefined,
  pathname: string,
  options?: HostResolutionOptions,
): ProxyRoutingDecision {
  const resolution = resolveHost(rawHost, options);

  // Never allow direct external access to internal route trees (/platform/* or /school/*)
  if (isInternalTenantPath(pathname)) {
    return {
      type: "not-found",
      resolution,
      reason: "direct_internal_path_forbidden",
    };
  }

  // API routes are handled directly by their route handlers (which validate host/session as needed)
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    if (resolution.kind === "invalid") {
      return {
        type: "not-found",
        resolution,
        reason: resolution.reason,
      };
    }
    return {
      type: "next",
      resolution,
    };
  }

  if (resolution.kind === "invalid") {
    return {
      type: "not-found",
      resolution,
      reason: resolution.reason,
    };
  }

  if (resolution.kind === "public") {
    return {
      type: "next",
      resolution,
    };
  }

  if (resolution.kind === "platform") {
    const suffix = pathname === "/" ? "" : pathname;
    return {
      type: "rewrite",
      targetPathname: `/platform${suffix}`,
      resolution,
    };
  }

  const suffix = pathname === "/" ? "" : pathname;
  return {
    type: "rewrite",
    targetPathname: `/school${suffix}`,
    resolution,
  };
}
