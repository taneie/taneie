import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AppError } from "../backend/src/domain/types";
import {
  buildAliveCheckEmail,
  ResendEmailSender,
} from "../backend/src/infrastructure/email";

describe("メール送信基盤", () => {
  /**
   * @testData API key/fromが空のResendEmailSender。
   * @expected メール送信設定未完了として503 `EMAIL_NOT_CONFIGURED` を投げる。
   */
  it("ResendEmailSender rejects sending when required config is missing", () => {
    const sender = new ResendEmailSender({ apiKey: "", from: "" });

    assert.throws(
      () => sender.assertReady(),
      (error) =>
        error instanceof AppError &&
        error.statusCode === 503 &&
        error.code === "EMAIL_NOT_CONFIGURED",
    );
  });

  /**
   * @testData Resend API key/from/replyTo、送信先、件名、本文、HTML。
   * @expected Resend HTTP APIへAuthorization付きでfrom/to/subject/text/html/reply_toをPOSTする。
   */
  it("ResendEmailSender posts email payload to Resend API", async () => {
    let request: {
      input: string;
      body: Record<string, unknown>;
      headers: Record<string, string>;
    } | null = null;
    const sender = new ResendEmailSender({
      apiKey: "resend-key",
      from: "Frichy <noreply@example.com>",
      replyTo: "sales@example.com",
      fetchFn: async (input, init) => {
        request = {
          input,
          body: JSON.parse(init.body),
          headers: init.headers,
        };
        return {
          ok: true,
          status: 200,
          text: async () => "",
        };
      },
    });

    await sender.send({
      to: "freelancer@example.com",
      subject: "subject",
      text: "text",
      html: "<p>html</p>",
    });

    assert.ok(request);
    assert.equal(request.input, "https://api.resend.com/emails");
    assert.equal(request.headers.Authorization, "Bearer resend-key");
    assert.equal(request.body.from, "Frichy <noreply@example.com>");
    assert.equal(request.body.to, "freelancer@example.com");
    assert.equal(request.body.reply_to, "sales@example.com");
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
