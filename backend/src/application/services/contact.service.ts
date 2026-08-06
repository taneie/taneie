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
    const existing = await this.findInquiryForContext(context, id);
    this.assertInquiryOpen(existing);
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

  async addInquiryMessage(
    context: AuthContext,
    id: string,
    input: { body: string },
  ) {
    const existing = await this.findInquiryForContext(context, id);
    this.assertInquiryOpen(existing);

    const currentAnswerBody = decryptText(existing.answerBody);
    const nextAnswerBody = [
      currentAnswerBody,
      formatInquiryMessageEntry(context.role, input.body),
    ]
      .filter(Boolean)
      .join("\n\n---\n\n");

    const inquiry = await this.db.contactInquiry.update({
      where: { id },
      data: {
        answerBody: encryptText(nextAnswerBody),
        answeredBy:
          context.role === "sales" ? context.userId : existing.answeredBy,
        answeredAt:
          context.role === "sales" ? new Date() : existing.answeredAt,
        status: context.role === "sales" ? "answered" : "new",
      },
      include: { answerer: true },
    });

    const subject = decryptText(inquiry.subject);
    if (context.role === "sales" && inquiry.userId) {
      await notifyUser(this.db, inquiry.userId, {
        title: "Frichy",
        body: `問い合わせに追加返信が届きました: ${subject}`,
        url: "/",
        tag: `frichy-contact-message-${inquiry.id}`,
      });
    } else if (context.role !== "sales") {
      await this.notifySalesUsers(`追加メッセージ: ${subject}`, inquiry.id);
    }

    return mapContactInquiry(inquiry);
  }

  async closeInquiry(context: AuthContext, id: string) {
    const existing = await this.findInquiryForContext(context, id);
    if (existing.status === "closed") {
      return mapContactInquiry(existing);
    }

    const inquiry = await this.db.contactInquiry.update({
      where: { id },
      data: { status: "closed" },
      include: { answerer: true },
    });

    return mapContactInquiry(inquiry);
  }

  private assertSales(context: AuthContext) {
    if (context.role !== "sales") {
      throw new AppError(403, "この操作を行う権限がありません。", "FORBIDDEN");
    }
  }

  private async findInquiryForContext(context: AuthContext, id: string) {
    const inquiry = await this.db.contactInquiry.findFirst({
      where: {
        id,
        ...(context.role === "sales" ? {} : { userId: context.userId }),
      },
      include: { answerer: true },
    });
    if (!inquiry) {
      throw new AppError(404, "問い合わせが見つかりません。", "NOT_FOUND");
    }
    return inquiry;
  }

  private assertInquiryOpen(inquiry: ContactInquiry) {
    if (inquiry.status === "closed") {
      throw new AppError(
        409,
        "クローズ済みの問い合わせには返信できません。",
        "CONTACT_CLOSED",
      );
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

function formatInquiryMessageEntry(role: AuthContext["role"], body: string) {
  const sender = role === "sales" ? "営業" : "求職者";
  return `${sender}（${formatInquiryMessageTime(new Date())}）\n${body}`;
}

function formatInquiryMessageTime(date: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
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
