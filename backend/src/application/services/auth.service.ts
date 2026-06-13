import type { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
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
    name: string;
    email: string;
    password: string;
    phone?: string;
    roleTitle?: string;
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
        role: "freelancer",
        name: encryptText(input.name),
        email: encryptText(input.email),
        emailHash: piiHash(input.email),
        passwordHash,
        phone: input.phone ? encryptText(input.phone) : null,
        freelancerProfile: {
          create: {
            publicCode: `tf-${randomUUID().slice(0, 8)}`,
            roleTitle: input.roleTitle || null,
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
