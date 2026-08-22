import nodemailer from "nodemailer";
import { AppError } from "../domain/types.js";
import { config } from "./config.js";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailSender {
  assertReady(): void;
  send(message: EmailMessage): Promise<void>;
}

type MailPayload = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

type MailTransporter = {
  sendMail(message: MailPayload): Promise<unknown>;
};

interface SmtpEmailSenderOptions {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  password?: string;
  from?: string;
  replyTo?: string;
  transporter?: MailTransporter;
}

export class SmtpEmailSender implements EmailSender {
  private readonly host: string;
  private readonly port: number;
  private readonly secure: boolean;
  private readonly user: string;
  private readonly password: string;
  private readonly from: string;
  private readonly replyTo: string;
  private readonly transporter: MailTransporter;

  constructor(options: SmtpEmailSenderOptions = {}) {
    this.host = (options.host ?? config.smtpHost).trim();
    this.port = options.port ?? config.smtpPort;
    this.secure = options.secure ?? config.smtpSecure ?? this.port === 465;
    this.user = (options.user ?? config.smtpUser).trim();
    this.password = (options.password ?? config.smtpPassword).trim();
    this.from = (options.from ?? config.emailFrom).trim();
    this.replyTo = (options.replyTo ?? config.emailReplyTo).trim();
    this.transporter =
      options.transporter ??
      nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.secure,
        requireTLS: !this.secure,
        auth: {
          user: this.user,
          pass: this.password,
        },
      });
  }

  assertReady() {
    if (
      this.host &&
      Number.isFinite(this.port) &&
      this.port > 0 &&
      this.user &&
      this.password &&
      this.from
    )
      return;

    throw new AppError(
      503,
      "メール送信設定が未設定です。SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD / EMAIL_FROM を設定してください。",
      "EMAIL_NOT_CONFIGURED",
    );
  }

  async send(message: EmailMessage) {
    this.assertReady();

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        ...(this.replyTo ? { replyTo: this.replyTo } : {}),
      });

      return;
    } catch (error) {
      console.error("Email delivery failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new AppError(
        502,
        "メール送信に失敗しました。SMTP設定を確認してください。",
        "EMAIL_DELIVERY_FAILED",
      );
    }
  }
}

export function createEmailSender(): EmailSender {
  return new SmtpEmailSender();
}

export function buildAliveCheckEmail(input: {
  recipientName: string;
  appUrl: string;
}) {
  const name = input.recipientName.trim() || "フリーランス";
  const appUrl = input.appUrl.trim() || "https://frichy-322534405950.asia-northeast1.run.app";
  const subject = "【Frichy】現在の稼働状況をご確認ください";
  const text = [
    `${name} 様`,
    "",
    "Frichyチームです。",
    "現在の稼働状況や案件へのご希望に変更がないか確認しています。",
    "",
    "以下のURLからFrichyへログインし、プロフィールまたはチャットで現在の状況をお知らせください。",
    appUrl,
    "",
    "すでに営業担当へ連絡済みの場合は、このメールへの対応は不要です。",
  ].join("\n");
  const html = `
    <p>${escapeHtml(name)} 様</p>
    <p>Frichyチームです。</p>
    <p>現在の稼働状況や案件へのご希望に変更がないか確認しています。</p>
    <p>
      <a href="${escapeHtml(appUrl)}">Frichyへログイン</a>し、
      プロフィールまたはチャットで現在の状況をお知らせください。
    </p>
    <p>すでに営業担当へ連絡済みの場合は、このメールへの対応は不要です。</p>
  `.trim();

  return { subject, text, html };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
