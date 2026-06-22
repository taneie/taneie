import type { PrismaClient } from "@prisma/client";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  hashPassword,
  signToken,
  verifyPassword,
} from "../../infrastructure/security.js";
import { decryptText, encryptText, piiHash } from "../../infrastructure/crypto.js";
import { AppError } from "../../domain/types.js";
import { findUserByEmailForAuth, toAuthUser } from "./shared.js";

export class AuthService {
  constructor(private readonly db: PrismaClient) {}

  async register(input: {
    email: string;
    password: string;
    policyVersion: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const existingUser = await findUserByEmailForAuth(this.db, input.email);
    if (existingUser) {
      throw new AppError(
        409,
        "このメールアドレスはすでに登録されています。",
        "EMAIL_ALREADY_EXISTS",
      );
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.db.user.create({
      data: {
        name: encryptText(""),
        nameKana: null,
        phone: null,
        role: "freelancer",
        email: encryptText(input.email),
        emailHash: piiHash(input.email),
        passwordHash,
        freelancerProfile: {
          create: {
            roleTitle: null,
            publicCode: `tf-${randomUUID().slice(0, 8)}`,
            lastUpdatedOn: new Date(),
          },
        },
        privacyConsents: {
          create: {
            policyVersion: input.policyVersion,
            ipAddress: input.ipAddress ? encryptText(input.ipAddress) : null,
            userAgent: input.userAgent ? encryptText(input.userAgent) : null,
          },
        },
      },
      include: { freelancerProfile: true },
    });

    const token = signToken({
      userId: user.id,
      role: user.role,
      email: input.email,
    });
    return { token, user: toAuthUser(user) };
  }

  async login(email: string, password: string) {
    const user = await findUserByEmailForAuth(this.db, email);
    if (!user || !user.isActive) return null;

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return null;

    await this.db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signToken({ userId: user.id, role: user.role, email });
    return { token, user: toAuthUser(user) };
  }

  async requestPasswordReset(email: string) {
    const user = await findUserByEmailForAuth(this.db, email);
    if (!user || !user.isActive) {
      return { issued: false };
    }

    const token = randomBytes(32)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
    const tokenHash = hashResetToken(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await this.db.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    await this.db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return { issued: true, token, expiresAt };
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = hashResetToken(token);
    const resetToken = await this.db.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt.getTime() < Date.now() ||
      !resetToken.user.isActive
    ) {
      throw new AppError(
        400,
        "リセットリンクが無効または期限切れです。",
        "INVALID_PASSWORD_RESET_TOKEN",
      );
    }

    const passwordHash = await hashPassword(password);
    await this.db.$transaction([
      this.db.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);
  }

  async getCurrentUser(userId: string) {
    const user = await this.db.user.findUniqueOrThrow({
      where: { id: userId },
      include: { freelancerProfile: true },
    });
    return {
      id: user.id,
      email: decryptText(user.email),
      role: user.role,
      name: decryptText(user.name),
      freelancerId: user.freelancerProfile?.id,
    };
  }
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
