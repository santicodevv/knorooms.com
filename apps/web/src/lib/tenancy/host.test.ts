import { describe, expect, it } from "vitest";
import { isValidTenantSlug, resolveHost, resolveProxyRouting } from "@/lib/tenancy/host";

describe("resolveHost & multi-tenant subdomain routing", () => {
  const options = {
    baseDomain: "knorooms.com",
    platformSubdomain: "admin",
  };

  it("resolves root domain as public host", () => {
    const res = resolveHost("knorooms.com", options);
    expect(res).toEqual({
      kind: "public",
      hostname: "knorooms.com",
      rawHost: "knorooms.com",
    });
  });

  it("strips port when resolving localhost root domain", () => {
    const res = resolveHost("localhost:3000", {
      baseDomain: "localhost",
      platformSubdomain: "admin",
    });
    expect(res.kind).toBe("public");
    expect(res.hostname).toBe("localhost");
  });

  it("resolves admin subdomain as platform host", () => {
    const res = resolveHost("admin.knorooms.com", options);
    expect(res).toEqual({
      kind: "platform",
      hostname: "admin.knorooms.com",
      rawHost: "admin.knorooms.com",
      subdomain: "admin",
    });
  });

  it("resolves valid school slug as tenant host", () => {
    const res = resolveHost("colegio-san-judas.knorooms.com:3000", options);
    expect(res).toEqual({
      kind: "tenant",
      hostname: "colegio-san-judas.knorooms.com",
      rawHost: "colegio-san-judas.knorooms.com:3000",
      slug: "colegio-san-judas",
    });
  });

  it("rejects reserved subdomains as invalid tenant slugs", () => {
    for (const reserved of ["www", "api", "app", "auth", "static", "mail"]) {
      const res = resolveHost(`${reserved}.knorooms.com`, options);
      expect(res.kind).toBe("invalid");
      if (res.kind === "invalid") {
        expect(res.reason).toBe("reserved_subdomain");
      }
      expect(isValidTenantSlug(reserved)).toBe(false);
    }
  });

  it("rejects malformed slugs (leading/trailing hyphens, 2-char, or nested dots)", () => {
    expect(resolveHost("-colegio.knorooms.com", options).kind).toBe("invalid");
    expect(resolveHost("colegio-.knorooms.com", options).kind).toBe("invalid");
    expect(resolveHost("ab.knorooms.com", options).kind).toBe("invalid");
    expect(resolveHost("sub.colegio-a.knorooms.com", options).kind).toBe("invalid");
  });

  it("rewrites platform host paths to /platform/* and tenant host paths to /school/*", () => {
    const platformDecision = resolveProxyRouting("admin.localhost:3000", "/", {
      baseDomain: "localhost",
      platformSubdomain: "admin",
    });
    expect(platformDecision.type).toBe("rewrite");
    if (platformDecision.type === "rewrite") {
      expect(platformDecision.targetPathname).toBe("/platform");
    }

    const tenantDecision = resolveProxyRouting("colegio-a.localhost:3000", "/members", {
      baseDomain: "localhost",
      platformSubdomain: "admin",
    });
    expect(tenantDecision.type).toBe("rewrite");
    if (tenantDecision.type === "rewrite") {
      expect(tenantDecision.targetPathname).toBe("/school/members");
    }
  });

  it("returns not-found (404) on direct access to /platform or /school from any host", () => {
    for (const host of ["localhost:3000", "admin.localhost:3000", "colegio-a.localhost:3000"]) {
      expect(resolveProxyRouting(host, "/platform", { baseDomain: "localhost" }).type).toBe(
        "not-found",
      );
      expect(resolveProxyRouting(host, "/school/members", { baseDomain: "localhost" }).type).toBe(
        "not-found",
      );
    }
  });
});
