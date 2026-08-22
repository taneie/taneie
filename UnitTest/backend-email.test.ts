import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppError } from "../backend/src/domain/types";
import {
  buildAliveCheckEmail,
  SmtpEmailSender,
} from "../backend/src/infrastructure/email";

describe("メール送信基盤", () => {
  /**
   * @testData SMTP接続情報/fromが空のSmtpEmailSender。
   * @expected メール送信設定未完了として503 `EMAIL_NOT_CONFIGURED` を投げる。
   */
  it("SmtpEmailSender rejects sending when required config is missing", () => {
    const sender = new SmtpEmailSender({
      host: "",
      port: 587,
      user: "",
      password: "",
      from: "",
    });

    assert.throws(
      () => sender.assertReady(),
      (error) =>
        error instanceof AppError &&
        error.statusCode === 503 &&
        error.code === "EMAIL_NOT_CONFIGURED",
    );
  });

  /**
   * @testData SMTP接続情報/from/replyTo、送信先、件名、本文、HTML。
   * @expected SMTP transportへfrom/to/subject/text/html/replyToを渡す。
   */
  it("SmtpEmailSender sends email payload through SMTP transport", async () => {
    let sent: {
      from: string;
      to: string;
      subject: string;
      text: string;
      html?: string;
      replyTo?: string;
    } | null = null;
    const sender = new SmtpEmailSender({
      host: "example.sakura.ne.jp",
      port: 587,
      secure: false,
      user: "noreply@example.com",
      password: "mail-password",
      from: "Frichy <noreply@example.com>",
      replyTo: "sales@example.com",
      transporter: {
        sendMail: async (message) => {
          sent = message;
          return {};
        },
      },
    });

    await sender.send({
      to: "freelancer@example.com",
      subject: "subject",
      text: "text",
      html: "<p>html</p>",
    });

    assert.ok(sent);
    assert.equal(sent.from, "Frichy <noreply@example.com>");
    assert.equal(sent.to, "freelancer@example.com");
    assert.equal(sent.subject, "subject");
    assert.equal(sent.text, "text");
    assert.equal(sent.html, "<p>html</p>");
    assert.equal(sent.replyTo, "sales@example.com");
  });

  /**
   * @testData 求職者名とFrichy公開URL。
   * @expected 生存確認メールの件名/本文/HTMLにログインURLと稼働状況確認の案内が含まれる。
   */
  it("buildAliveCheckEmail creates a clear availability confirmation email", () => {
    const email = buildAliveCheckEmail({
      recipientName: "山田 太郎",
      appUrl: "https://frichy.example.com",
    });

    assert.match(email.subject, /稼働状況/);
    assert.match(email.text, /山田 太郎/);
    assert.match(email.text, /https:\/\/frichy\.example\.com/);
    assert.match(email.html, /Frichyへログイン/);
  });
});
