export const DEFAULT_IDLE_TIMEOUT_MINUTES = 30;
export const DEFAULT_ABSOLUTE_TIMEOUT_MINUTES = 480;
export const ACCESS_TOKEN_REFRESH_THRESHOLD_SECONDS = 60;

export interface SessionPolicyConfig {
  idleTimeoutMinutes: number;
  absoluteTimeoutMinutes: number;
}

export interface SessionTimestamps {
  createdAt: number;
  lastActivityAt: number;
}

export type SessionLifetimeEvaluation =
  | {
      valid: true;
      idleExpiresAt: number;
      absoluteExpiresAt: number;
      effectiveExpiresAt: number;
      remainingSeconds: number;
    }
  | {
      valid: false;
      reason: "idle_timeout" | "absolute_timeout" | "invalid_timestamps";
    };

export function resolveSessionPolicy(
  overrides?: Partial<SessionPolicyConfig>,
): SessionPolicyConfig {
  const envIdle = Number(process.env.SESSION_IDLE_TIMEOUT_MINUTES);
  const envAbsolute = Number(process.env.SESSION_ABSOLUTE_TIMEOUT_MINUTES);

  const idleTimeoutMinutes =
    overrides?.idleTimeoutMinutes ??
    (Number.isFinite(envIdle) && envIdle > 0 ? envIdle : DEFAULT_IDLE_TIMEOUT_MINUTES);

  const absoluteTimeoutMinutes =
    overrides?.absoluteTimeoutMinutes ??
    (Number.isFinite(envAbsolute) && envAbsolute > 0
      ? envAbsolute
      : DEFAULT_ABSOLUTE_TIMEOUT_MINUTES);

  return {
    idleTimeoutMinutes,
    absoluteTimeoutMinutes,
  };
}

export function evaluateSessionLifetime(
  timestamps: SessionTimestamps,
  nowMs: number,
  policyOverrides?: Partial<SessionPolicyConfig>,
): SessionLifetimeEvaluation {
  if (
    !Number.isFinite(timestamps.createdAt) ||
    !Number.isFinite(timestamps.lastActivityAt) ||
    timestamps.createdAt <= 0 ||
    timestamps.lastActivityAt <= 0
  ) {
    return { valid: false, reason: "invalid_timestamps" };
  }

  const policy = resolveSessionPolicy(policyOverrides);
  const idleMs = policy.idleTimeoutMinutes * 60 * 1000;
  const absoluteMs = policy.absoluteTimeoutMinutes * 60 * 1000;

  const absoluteExpiresAt = timestamps.createdAt + absoluteMs;
  if (nowMs >= absoluteExpiresAt) {
    return { valid: false, reason: "absolute_timeout" };
  }

  const idleExpiresAt = timestamps.lastActivityAt + idleMs;
  if (nowMs >= idleExpiresAt) {
    return { valid: false, reason: "idle_timeout" };
  }

  // When activity is refreshed at `nowMs`, the next idle expiration is `nowMs + idleMs`,
  // capped by the session's hard `absoluteExpiresAt`.
  const nextIdleExpiresAt = nowMs + idleMs;
  const effectiveExpiresAt = Math.min(nextIdleExpiresAt, absoluteExpiresAt);
  const remainingSeconds = Math.max(1, Math.floor((effectiveExpiresAt - nowMs) / 1000));

  return {
    valid: true,
    idleExpiresAt: nextIdleExpiresAt,
    absoluteExpiresAt,
    effectiveExpiresAt,
    remainingSeconds,
  };
}

export function shouldRefreshAccessToken(
  accessTokenExpiresAtMs: number | undefined,
  nowMs: number,
  thresholdSeconds = ACCESS_TOKEN_REFRESH_THRESHOLD_SECONDS,
): boolean {
  if (accessTokenExpiresAtMs === undefined || !Number.isFinite(accessTokenExpiresAtMs)) {
    return false;
  }
  return accessTokenExpiresAtMs - nowMs < thresholdSeconds * 1000;
}
