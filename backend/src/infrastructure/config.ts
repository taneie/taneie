import dotenv from "dotenv";

dotenv.config();

function readEnv(name: string, fallback: string) {
  return process.env[name] || fallback;
}

export const config = {
  apiPort: Number(readEnv("API_PORT", "8787")),
  jwtSecret: readEnv("JWT_SECRET", "local-development-secret-change-me"),
  jwtExpiresIn: readEnv("JWT_EXPIRES_IN", "7d"),
  corsOrigins: readEnv("CORS_ORIGIN", "http://127.0.0.1:5173,http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  privacyPolicyVersion: readEnv("PRIVACY_POLICY_VERSION", "2026-06-10"),
  webPushPublicKey: readEnv("WEB_PUSH_PUBLIC_KEY", ""),
  webPushPrivateKey: readEnv("WEB_PUSH_PRIVATE_KEY", ""),
  webPushSubject: readEnv("WEB_PUSH_SUBJECT", "mailto:admin@example.com"),
  dataEncryptionKey: readEnv("DATA_ENCRYPTION_KEY", "")
};
