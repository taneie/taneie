import { describe, it } from "node:test";
import {
  answerContactInquirySchema,
  createContactInquirySchema,
  pushSubscriptionSchema,
  resumeMetadataSchema,
  resumeUploadCompleteSchema,
  resumeUploadIntentSchema,
} from "../backend/src/interfaces/http/schemas";
import { expectInvalid, expectValid } from "./helpers/schema";

const uuid = "11111111-1111-4111-8111-111111111111";

describe("問い合わせAPI入力スキーマ", () => {
  /**
   * @testData 問い合わせ種別、氏名、email、電話番号、件名、本文、空種別、不正email、空回答。
   * @expected 必須項目とemail形式を満たす問い合わせ/回答だけが受理され、空欄や不正emailは拒否される。
   */
  it("createContactInquirySchema and answerContactInquirySchema validate required fields", () => {
    expectValid(createContactInquirySchema, {
      inquiryType: "案件相談",
      name: "山田 太郎",
      email: "user@example.com",
      phone: "090-1111-2222",
      subject: "相談",
      body: "本文",
    });
    expectInvalid(createContactInquirySchema, {
      inquiryType: "",
      name: "山田 太郎",
      email: "user@example.com",
      subject: "相談",
      body: "本文",
    });
    expectInvalid(createContactInquirySchema, {
      inquiryType: "案件相談",
      name: "山田 太郎",
      email: "invalid",
      subject: "相談",
      body: "本文",
    });
    expectValid(answerContactInquirySchema, { answerBody: "回答" });
    expectInvalid(answerContactInquirySchema, { answerBody: " " });
  });
});

describe("レジュメAPI入力スキーマ", () => {
  /**
   * @testData PDFファイル名、MIME type、file size、storage key、applicationId、空ファイル名、size 0、空blobPath。
   * @expected metadata、upload intent、upload completeの必須項目とsize制約が検証され、不正値は拒否される。
   */
  it("resume schemas validate metadata, intent, and completion", () => {
    expectValid(resumeMetadataSchema, {
      originalFilename: "resume.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: "100",
      storageKey: "resumes/resume.pdf",
    });
    expectInvalid(resumeMetadataSchema, {
      originalFilename: "",
      storageKey: "resumes/resume.pdf",
    });
    expectValid(resumeUploadIntentSchema, {
      originalFilename: "resume.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 100,
      applicationId: uuid,
    });
    expectInvalid(resumeUploadIntentSchema, {
      originalFilename: "resume.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 0,
    });
    expectValid(resumeUploadCompleteSchema, {
      originalFilename: "resume.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 100,
      blobPath: "resumes/resume.pdf",
      blobUrl: "https://example.com/resume.pdf",
    });
    expectInvalid(resumeUploadCompleteSchema, {
      originalFilename: "resume.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 100,
      blobPath: "",
    });
  });
});

describe("プッシュ通知API入力スキーマ", () => {
  /**
   * @testData URL形式endpoint、p256dh/auth key、不正URL、空p256dh。
   * @expected endpointがURLでkeysが揃うsubscriptionだけが受理され、不正URLや空keyは拒否される。
   */
  it("pushSubscriptionSchema validates endpoint and required keys", () => {
    expectValid(pushSubscriptionSchema, {
      endpoint: "https://example.com/push",
      keys: { p256dh: "p256dh", auth: "auth" },
    });
    expectInvalid(pushSubscriptionSchema, {
      endpoint: "not-url",
      keys: { p256dh: "p256dh", auth: "auth" },
    });
    expectInvalid(pushSubscriptionSchema, {
      endpoint: "https://example.com/push",
      keys: { p256dh: "", auth: "auth" },
    });
  });
});
