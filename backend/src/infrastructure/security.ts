import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { AuthContext, TokenPayload } from "../domain/types.js";
import { config } from "./config.js";

const resumePreviewTokenPurpose = "resume-preview";

export interface ResumePreviewTokenPayload extends AuthContext {
  purpose: typeof resumePreviewTokenPurpose;
  freelancerProfileId: string;
  resumeId: string;
  iat?: number;
  exp?: number;
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signToken(context: AuthContext) {
  const options: SignOptions = {
    expiresIn: config.jwtExpiresIn as SignOptions["expiresIn"],
  };
  return jwt.sign(context, config.jwtSecret, options);
}

export function verifyToken(token: string) {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}

export function signResumePreviewToken(
  context: AuthContext & { freelancerProfileId: string; resumeId: string },
) {
  const payload: Omit<ResumePreviewTokenPayload, "iat" | "exp"> = {
    ...context,
    purpose: resumePreviewTokenPurpose,
  };

  return jwt.sign(payload, config.jwtSecret, { expiresIn: "10m" });
}

export function verifyResumePreviewToken(token: string) {
  const payload = jwt.verify(
    token,
    config.jwtSecret,
  ) as ResumePreviewTokenPayload;
  if (
    payload.purpose !== resumePreviewTokenPurpose ||
    !payload.freelancerProfileId ||
    !payload.resumeId
  ) {
    throw new Error("Invalid resume preview token");
  }

  return payload;
}
