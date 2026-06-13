import type { PrismaClient } from "@prisma/client";
import { encryptText } from "../../infrastructure/crypto.js";
import type { AuthContext } from "../../domain/types.js";

export class ContactService {
  constructor(private readonly db: PrismaClient) {}

  async createInquiry(
    context: AuthContext,
    input: {
      inquiryType: string;
      name: string;
      email: string;
      phone?: string;
      subject: string;
      body: string;
    },
  ) {
    const inquiry = await this.db.contactInquiry.create({
      data: {
        userId: context.userId,
        role: context.role,
        inquiryType: input.inquiryType,
        name: encryptText(input.name),
        email: encryptText(input.email),
        phone: input.phone ? encryptText(input.phone) : null,
        subject: encryptText(input.subject),
        body: encryptText(input.body),
      },
    });

    return {
      id: inquiry.id,
      createdAt: inquiry.createdAt.toISOString(),
    };
  }
}
