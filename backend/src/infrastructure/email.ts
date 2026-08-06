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

type FetchLike = (
  input: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
  },
) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

interface ResendEmailSenderOptions {
  apiKey?: string;
  from?: string;
  replyTo?: string;
  fetchFn?: FetchLike;
}

export class ResendEmailSender implements EmailSender {
  private readonly apiKey: string;
  private readonly from: string;
  private readonly replyTo: string;
  private readonly fetchFn: FetchLike;

  constructor(options: ResendEmailSenderOptions = {}) {
    this.apiKey = (options.apiKey ?? config.resendApiKey).trim();
    this.from = (options.from ?? config.emailFrom).trim();
    this.replyTo = (options.replyTo ?? config.emailReplyTo).trim();
    this.fetchFn = options.fetchFn ?? fetch;
  }

  assertReady() {
    if (this.apiKey && this.from) return;
    throw new AppError(
      503,
      "メール送信設定が未設定です。RESEND_API_KEY と EMAIL_FROM を設定してください。",
      "EMAIL_NOT_CONFIGURED",
    );
  }

  async send(message: EmailMessage) {
    this.assertReady();

    const response = await this.fetchFn("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        ...(this.replyTo ? { reply_to: this.replyTo } : {}),
      }),
    });

    if (response.ok) return;

    const body = await response.text().catch(() => "");
    console.error("Email delivery failed", {
      status: response.status,
      body: body.slice(0, 500),
    });
    throw new AppError(
      502,
      "メール送信に失敗しました。送信サービスの設定を確認してください。",
      "EMAIL_DELIVERY_FAILED",
    );
  }
}

export function createEmailSender(): EmailSender {
  return new ResendEmailSender();
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
    "Frichy営業チームです。",
    "現在の稼働状況や案件へのご希望に変更がないか確認しています。",
    "",
    "以下のURLからFrichyへログインし、プロフィールまたはチャットで現在の状況をお知らせください。",
    appUrl,
    "",
    "すでに営業担当へ連絡済みの場合は、このメールへの対応は不要です。",
  ].join("\n");
  const html = `
    <p>${escapeHtml(name)} 様</p>
    <p>Frichy営業チームです。</p>
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
