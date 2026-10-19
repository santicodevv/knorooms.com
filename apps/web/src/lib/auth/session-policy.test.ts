import { describe, expect, it } from "vitest";
import { evaluateSessionLifetime, shouldRefreshAccessToken } from "@/lib/auth/session-policy";

describe("evaluateSessionLifetime & token refresh threshold", () => {
  const baseTime = 1_700_000_000_000;
  const policy = {
    idleTimeoutMinutes: 30,
    absoluteTimeoutMinutes: 480,
  };

  it("accepts an active session within both idle and absolute windows", () => {
    const tenMinutesLater = baseTime + 10 * 60 * 1000;
    const result = evaluateSessionLifetime(
      { createdAt: baseTime, lastActivityAt: baseTime },
      tenMinutesLater,
      policy,
    );

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.effectiveExpiresAt).toBe(tenMinutesLater + 30 * 60 * 1000);
      expect(result.remainingSeconds).toBe(1800);
    }
  });

  it("expires session when idle timeout is exceeded", () => {
    const thirtyOneMinutesLater = baseTime + 31 * 60 * 1000;
    const result = evaluateSessionLifetime(
      { createdAt: baseTime, lastActivityAt: baseTime },
      thirtyOneMinutesLater,
      policy,
    );

    expect(result).toEqual({
      valid: false,
      reason: "idle_timeout",
    });
  });

  it("expires session when absolute timeout is reached even if recently active", () => {
    const eightHoursLater = baseTime + 480 * 60 * 1000;
    const recentActivity = eightHoursLater - 2 * 60 * 1000;

    const result = evaluateSessionLifetime(
      { createdAt: baseTime, lastActivityAt: recentActivity },
      eightHoursLater,
      policy,
    );

    expect(result).toEqual({
      valid: false,
      reason: "absolute_timeout",
    });
  });

  it("caps effectiveExpiresAt at absoluteExpiresAt when nearing absolute limit", () => {
    const nearEnd = baseTime + 470 * 60 * 1000;
    const result = evaluateSessionLifetime(
      { createdAt: baseTime, lastActivityAt: nearEnd - 5 * 60 * 1000 },
      nearEnd,
      policy,
    );

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.effectiveExpiresAt).toBe(baseTime + 480 * 60 * 1000);
      expect(result.remainingSeconds).toBe(600);
    }
  });

  it("triggers access token refresh when <60 seconds remain before expiration", () => {
    expect(shouldRefreshAccessToken(baseTime + 45_000, baseTime, 60)).toBe(true);
    expect(shouldRefreshAccessToken(baseTime - 5_000, baseTime, 60)).toBe(true);
    expect(shouldRefreshAccessToken(baseTime + 120_000, baseTime, 60)).toBe(false);
    expect(shouldRefreshAccessToken(undefined, baseTime, 60)).toBe(false);
  });
});
