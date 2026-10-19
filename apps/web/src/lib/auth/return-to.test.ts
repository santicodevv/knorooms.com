import { describe, expect, it } from "vitest";
import { sanitizeReturnTo } from "@/lib/auth/return-to";

describe("sanitizeReturnTo", () => {
  it("preserves safe relative paths with query parameters and hashes", () => {
    expect(sanitizeReturnTo("/")).toBe("/");
    expect(sanitizeReturnTo("/members?status=Active#top")).toBe("/members?status=Active#top");
    expect(sanitizeReturnTo("/support-access")).toBe("/support-access");
  });

  it("rejects absolute URLs, protocol-relative URLs, and schemes", () => {
    expect(sanitizeReturnTo("https://evil.example.com/phish")).toBe("/");
    expect(sanitizeReturnTo("http://localhost:3000/members")).toBe("/");
    expect(sanitizeReturnTo("//evil.example.com/path")).toBe("/");
    expect(sanitizeReturnTo("javascript:alert(1)")).toBe("/");
  });

  it("rejects backslashes and control characters", () => {
    expect(sanitizeReturnTo("/\\evil.example.com")).toBe("/");
    expect(sanitizeReturnTo("/members\u0000")).toBe("/");
    expect(sanitizeReturnTo("/members\r\nSet-Cookie: hacked=1")).toBe("/");
  });

  it("rejects direct internal tenant paths (/platform and /school)", () => {
    expect(sanitizeReturnTo("/platform")).toBe("/");
    expect(sanitizeReturnTo("/school/members")).toBe("/");
  });
});
