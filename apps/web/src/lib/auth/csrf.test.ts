import { describe, expect, it } from "vitest";
import { verifyCsrfProtection } from "@/lib/auth/csrf";

describe("verifyCsrfProtection", () => {
  const sessionToken = "csrf-secret-token-256-bits-example-value";

  it("allows safe non-mutating methods (GET, HEAD)", () => {
    const res = verifyCsrfProtection({
      method: "GET",
      headerToken: null,
      sessionToken,
      originHeader: null,
      expectedHost: "admin.localhost:3000",
    });
    expect(res).toEqual({ ok: true });
  });

  it("accepts mutating requests when Origin matches host and X-CSRF-Token matches session", () => {
    const res = verifyCsrfProtection({
      method: "POST",
      headerToken: sessionToken,
      sessionToken,
      originHeader: "http://colegio-a.localhost:3000",
      expectedHost: "colegio-a.localhost:3000",
    });
    expect(res).toEqual({ ok: true });
  });

  it("rejects mutating requests with missing or mismatched Origin header", () => {
    expect(
      verifyCsrfProtection({
        method: "POST",
        headerToken: sessionToken,
        sessionToken,
        originHeader: null,
        expectedHost: "colegio-a.localhost:3000",
      }),
    ).toEqual({ ok: false, reason: "missing_origin" });

    expect(
      verifyCsrfProtection({
        method: "POST",
        headerToken: sessionToken,
        sessionToken,
        originHeader: "http://colegio-b.localhost:3000",
        expectedHost: "colegio-a.localhost:3000",
      }),
    ).toEqual({ ok: false, reason: "origin_mismatch" });
  });

  it("rejects mutating requests with missing or invalid X-CSRF-Token", () => {
    expect(
      verifyCsrfProtection({
        method: "DELETE",
        headerToken: "",
        sessionToken,
        originHeader: "http://admin.localhost:3000",
        expectedHost: "admin.localhost:3000",
      }),
    ).toEqual({ ok: false, reason: "missing_csrf_token" });

    expect(
      verifyCsrfProtection({
        method: "PATCH",
        headerToken: "wrong-csrf-token",
        sessionToken,
        originHeader: "http://admin.localhost:3000",
        expectedHost: "admin.localhost:3000",
      }),
    ).toEqual({ ok: false, reason: "invalid_csrf_token" });
  });
});
