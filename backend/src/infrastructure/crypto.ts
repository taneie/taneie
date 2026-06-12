import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";
import { config } from "./config.js";

const PREFIX = "enc:v1:";

function key() {
  if (config.dataEncryptionKey) {
    const decoded = Buffer.from(config.dataEncryptionKey, "base64");
    if (decoded.length === 32) return decoded;
    return createHash("sha256").update(config.dataEncryptionKey).digest();
  }
  return createHash("sha256")
    .update("tryangle-local-development-encryption-key")
    .digest();
}

export function encryptText(value: string | null | undefined) {
  if (!value) return value || "";
  if (value.startsWith(PREFIX)) return value;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${Buffer.concat([iv, tag, encrypted]).toString("base64")}`;
}

export function decryptText(value: string | null | undefined) {
  if (!value) return value || "";
  if (!value.startsWith(PREFIX)) return value;
  const payload = Buffer.from(value.slice(PREFIX.length), "base64");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8",
  );
}

export function piiHash(value: string) {
  return createHmac("sha256", key())
    .update(value.trim().toLowerCase())
    .digest("hex");
}
