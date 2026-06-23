import dotenv from "dotenv";

dotenv.config();

function readEnv(name: string, fallback: string) {
  return process.env[name] || fallback;
}

export const config = {
  apiPort: Number(process.env.PORT || readEnv("API_PORT", "8787")),
  jwtSecret: readEnv("JWT_SECRET", "local-development-secret-change-me"),
  jwtExpiresIn: readEnv("JWT_EXPIRES_IN", "7d"),
  corsOrigins: readEnv(
    "CORS_ORIGIN",
    "http://127.0.0.1:5173,http://localhost:5173",
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  privacyPolicyVersion: readEnv("PRIVACY_POLICY_VERSION", "2026-06-10"),
  webPushPublicKey: readEnv("WEB_PUSH_PUBLIC_KEY", ""),
  webPushPrivateKey: readEnv("WEB_PUSH_PRIVATE_KEY", ""),
  webPushSubject: readEnv("WEB_PUSH_SUBJECT", "mailto:admin@example.com"),
  dataEncryptionKey: readEnv("DATA_ENCRYPTION_KEY", ""),
  blobReadWriteToken: readEnv("BLOB_READ_WRITE_TOKEN", ""),
  blobUploadCallbackUrl: readEnv("BLOB_UPLOAD_CALLBACK_URL", ""),
  resumeUploadMaxBytes: Number(
    readEnv("RESUME_UPLOAD_MAX_BYTES", String(10 * 1024 * 1024)),
  ),
};

export function hasValidBlobReadWriteToken() {
  const token = config.blobReadWriteToken.trim();

  return Boolean(token) && !/x{5,}|dummy|placeholder/i.test(token);
}
