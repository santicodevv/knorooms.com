import { isInternalTenantPath } from "@/lib/tenancy/host";

const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/;

/**
 * Validates that a `returnTo` parameter is a safe relative path within the current host.
 * Rejects absolute URLs, protocol-relative URLs (`//...`), backslashes, control chars,
 * and direct internal tenant paths (`/platform`, `/school`).
 */
export function sanitizeReturnTo(raw: string | null | undefined, fallback = "/"): string {
  if (!raw || typeof raw !== "string") {
    return fallback;
  }

  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 1024) {
    return fallback;
  }

  if (CONTROL_CHARS_REGEX.test(trimmed)) {
    return fallback;
  }

  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return fallback;
  }

  try {
    const base = new URL("http://localhost");
    const parsed = new URL(trimmed, base);

    if (parsed.origin !== base.origin) {
      return fallback;
    }

    if (isInternalTenantPath(parsed.pathname)) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
