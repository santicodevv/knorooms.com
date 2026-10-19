import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decryptJson, encryptJson, generateSecureId, parseEncryptionKey } from "@/lib/auth/crypto";

describe("AES-256-GCM session encryption", () => {
  const validKey = randomBytes(32).toString("base64");

  it("encrypts and decrypts structured session payloads with AES-256-GCM", () => {
    const payload = {
      sessionId: generateSecureId(32),
      user: { sub: "user-123", name: "Ana Pérez", email: "ana@colegio.edu.do" },
      tokens: {
        accessToken: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.secret",
        refreshToken: "refresh-secret-token",
      },
    };

    const ciphertext = encryptJson(payload, validKey);
    expect(ciphertext.startsWith("v1:")).toBe(true);
    expect(ciphertext).not.toContain("refresh-secret-token");

    const decrypted = decryptJson<typeof payload>(ciphertext, validKey);
    expect(decrypted).toEqual(payload);
  });

  it("produces distinct ciphertexts for identical plaintexts (random IV)", () => {
    const first = encryptJson({ a: 1 }, validKey);
    const second = encryptJson({ a: 1 }, validKey);
    expect(first).not.toBe(second);
  });

  it("fails authentication when ciphertext or authTag is tampered with", () => {
    const encrypted = encryptJson({ role: "Member" }, validKey);
    const parts = encrypted.split(":");
    const tamperedCiphertext = `${parts[0]}:${parts[1]}:${parts[2]}:AAAA${parts[3]}`;

    expect(() => decryptJson(tamperedCiphertext, validKey)).toThrow();
  });

  it("rejects keys that do not decode to exactly 32 bytes", () => {
    const shortKey = randomBytes(16).toString("base64");
    expect(() => parseEncryptionKey(shortKey)).toThrow(/32 bytes/);
    expect(() => parseEncryptionKey("")).toThrow();
  });
});
