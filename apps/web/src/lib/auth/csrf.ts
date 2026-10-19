import { timingSafeEqual } from "node:crypto";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isMutatingMethod(method: string): boolean {
  return MUTATING_METHODS.has(method.toUpperCase());
}

export function constantTimeTokenEquals(
  provided: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  if (!provided || !expected) {
    return false;
  }

  const providedBuf = Buffer.from(provided, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");

  if (providedBuf.byteLength !== expectedBuf.byteLength) {
    return false;
  }

  return timingSafeEqual(providedBuf, expectedBuf);
}

export function normalizeHostHeader(rawHost: string | null | undefined): string {
  if (!rawHost) {
    return "";
  }
  return rawHost.split(",")[0]?.trim().toLowerCase() ?? "";
}

export function validateOriginMatchesHost(
  originHeader: string | null | undefined,
  expectedRawHost: string | null | undefined,
): { ok: true } | { ok: false; reason: "missing_origin" | "origin_mismatch" } {
  const expectedHost = normalizeHostHeader(expectedRawHost);
  if (!originHeader || !originHeader.trim()) {
    return { ok: false, reason: "missing_origin" };
  }

  if (!expectedHost) {
    return { ok: false, reason: "origin_mismatch" };
  }

  try {
    const parsedOrigin = new URL(originHeader.trim());
    const originHost = parsedOrigin.host.toLowerCase();
    if (!constantTimeTokenEquals(originHost, expectedHost)) {
      return { ok: false, reason: "origin_mismatch" };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "origin_mismatch" };
  }
}

export interface CsrfVerificationInput {
  method: string;
  headerToken: string | null | undefined;
  sessionToken: string | null | undefined;
  originHeader: string | null | undefined;
  expectedHost: string | null | undefined;
}

export type CsrfVerificationResult =
  | { ok: true }
  | {
      ok: false;
      reason: "missing_csrf_token" | "invalid_csrf_token" | "missing_origin" | "origin_mismatch";
    };

export function verifyCsrfProtection(input: CsrfVerificationInput): CsrfVerificationResult {
  if (!isMutatingMethod(input.method)) {
    return { ok: true };
  }

  const originCheck = validateOriginMatchesHost(input.originHeader, input.expectedHost);
  if (!originCheck.ok) {
    return originCheck;
  }

  if (!input.headerToken || !input.headerToken.trim()) {
    return { ok: false, reason: "missing_csrf_token" };
  }

  if (!constantTimeTokenEquals(input.headerToken.trim(), input.sessionToken)) {
    return { ok: false, reason: "invalid_csrf_token" };
  }

  return { ok: true };
}
