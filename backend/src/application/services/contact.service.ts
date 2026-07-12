import type { ContactInquiry, PrismaClient, User } from "@prisma/client";
import { AppError, type AuthContext } from "../../domain/types.js";
import { decryptText, encryptText } from "../../infrastructure/crypto.js";
import { notifyUser } from "../../infrastructure/push.js";

type ContactInquiryWithAnswerer = ContactInquiry & {
  answerer?: User | null;
};

export class ContactService {
  constructor(private readonly db: PrismaClient) {}

  async listInquiries(context: AuthContext) {
    const inquiries = await this.db.contactInquiry.findMany({
      where: context.role === "sales" ? undefined : { userId: context.userId },
      include: { answerer: true },
      orderBy: { createdAt: "desc" },
    });
    return inquiries.map(mapContactInquiry);
  }

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

    await this.notifySalesUsers(input.subject, inquiry.id);

    return {
      id: inquiry.id,
      createdAt: inquiry.createdAt.toISOString(),
    };
  }

  async answerInquiry(
    context: AuthContext,
    id: string,
    input: { answerBody: string },
  ) {
    this.assertSales(context);
    const inquiry = await this.db.contactInquiry.update({
      where: { id },
      data: {
        answerBody: encryptText(input.answerBody),
        answeredBy: context.userId,
        answeredAt: new Date(),
        status: "answered",
      },
      include: { answerer: true },
    });

    if (inquiry.userId) {
      await notifyUser(this.db, inquiry.userId, {
        title: "Frichy",
        body: `問い合わせに回答が届きました: ${decryptText(inquiry.subject)}`,
        url: "/",
        tag: `frichy-contact-answer-${inquiry.id}`,
      });
    }

    return mapContactInquiry(inquiry);
  }

  private assertSales(context: AuthContext) {
    if (context.role !== "sales") {
      throw new AppError(403, "この操作を行う権限がありません。", "FORBIDDEN");
    }
  }

  private async notifySalesUsers(subject: string, inquiryId: string) {
    const salesUsers = await this.db.user.findMany({
      where: { role: "sales", isActive: true },
      select: { id: true },
    });

    await Promise.all(
      salesUsers.map((user) =>
        notifyUser(this.db, user.id, {
          title: "Frichy",
          body: `新しい問い合わせ: ${subject}`,
          url: "/",
          tag: `frichy-contact-${inquiryId}`,
        }),
      ),
    );
  }
}

function mapContactInquiry(inquiry: ContactInquiryWithAnswerer) {
  return {
    id: inquiry.id,
    inquiryType: inquiry.inquiryType,
    name: decryptText(inquiry.name),
    email: decryptText(inquiry.email),
    phone: decryptText(inquiry.phone),
    subject: decryptText(inquiry.subject),
    body: decryptText(inquiry.body),
    status: inquiry.status,
    createdAt: inquiry.createdAt.toISOString(),
    answerBody: decryptText(inquiry.answerBody),
    answeredAt: inquiry.answeredAt?.toISOString() || "",
    answererName: decryptText(inquiry.answerer?.name),
  };
}
