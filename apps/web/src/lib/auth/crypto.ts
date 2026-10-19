import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;
const KEY_LENGTH_BYTES = 32;
const ENVELOPE_PREFIX = "v1";

export function parseEncryptionKey(rawBase64?: string): Buffer {
  const keyString = (rawBase64 ?? process.env.SESSION_ENCRYPTION_KEY ?? "").trim();
  if (!keyString) {
    throw new Error("SESSION_ENCRYPTION_KEY is not configured.");
  }

  const keyBuffer = Buffer.from(keyString, "base64");
  if (keyBuffer.byteLength !== KEY_LENGTH_BYTES) {
    throw new Error(
      `SESSION_ENCRYPTION_KEY must decode to exactly ${KEY_LENGTH_BYTES} bytes (256 bits); got ${keyBuffer.byteLength} bytes.`,
    );
  }

  return keyBuffer;
}

export function generateSecureId(bytes = 32): string {
  if (bytes < 32) {
    throw new Error("Session/security identifiers must be at least 32 bytes (256 bits).");
  }
  return randomBytes(bytes).toString("base64url");
}

export function encryptString(plaintext: string, keyBase64?: string): string {
  const key = parseEncryptionKey(keyBase64);
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  });

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    ENVELOPE_PREFIX,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptString(envelope: string, keyBase64?: string): string {
  const key = parseEncryptionKey(keyBase64);
  const parts = envelope.split(":");
  if (parts.length !== 4 || parts[0] !== ENVELOPE_PREFIX) {
    throw new Error("Invalid encrypted session envelope format.");
  }

  const [, ivB64, tagB64, dataB64] = parts;
  if (!ivB64 || !tagB64 || dataB64 === undefined) {
    throw new Error("Malformed encrypted session envelope.");
  }

  const iv = Buffer.from(ivB64, "base64url");
  const authTag = Buffer.from(tagB64, "base64url");
  const ciphertext = Buffer.from(dataB64, "base64url");

  if (iv.byteLength !== IV_LENGTH_BYTES) {
    throw new Error("Invalid initialization vector length.");
  }
  if (authTag.byteLength !== AUTH_TAG_LENGTH_BYTES) {
    throw new Error("Invalid authentication tag length.");
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}

export function encryptJson<T>(payload: T, keyBase64?: string): string {
  return encryptString(JSON.stringify(payload), keyBase64);
}

export function decryptJson<T>(envelope: string, keyBase64?: string): T {
  const json = decryptString(envelope, keyBase64);
  return JSON.parse(json) as T;
}
