import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  answerContactInquirySchema,
  applySchema,
  changeApplicationStatusSchema,
  createContactInquirySchema,
  createJobSchema,
  createMeetingSchema,
  listJobsQuerySchema,
  listScoutableJobsQuerySchema,
  loginSchema,
  markMessagesReadSchema,
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  pushSubscriptionSchema,
  registerSchema,
  resumeMetadataSchema,
  resumeUploadCompleteSchema,
  resumeUploadIntentSchema,
  sendMessageSchema,
  updateInitialMeetingSchema,
  updateJobFlagsSchema,
  updateMeetingStatusSchema,
  updateProfileSchema,
} from "../../backend/src/interfaces/http/schemas";

const uuid = "11111111-1111-4111-8111-111111111111";

function expectValid<T>(schema: { safeParse: (value: unknown) => { success: boolean; data?: T } }, value: unknown) {
  const result = schema.safeParse(value);
  assert.equal(result.success, true, JSON.stringify(result));
  return result.data as T;
}

function expectInvalid(schema: { safeParse: (value: unknown) => { success: boolean } }, value: unknown) {
  const result = schema.safeParse(value);
  assert.equal(result.success, false, JSON.stringify(result));
}

describe("auth schemas", () => {
  it("registerSchema accepts valid input and rejects invalid email/password/consent", () => {
    expectValid(registerSchema, {
      email: "user@example.com",
      password: "password123",
      privacyPolicyAccepted: true,
    });
    expectInvalid(registerSchema, {
      email: "invalid",
      password: "password123",
      privacyPolicyAccepted: true,
    });
    expectInvalid(registerSchema, {
      email: "user@example.com",
      password: "short",
      privacyPolicyAccepted: true,
    });
    expectInvalid(registerSchema, {
      email: "user@example.com",
      password: "password123",
      privacyPolicyAccepted: false,
    });
  });

  it("loginSchema accepts valid credentials and rejects malformed email/blank password", () => {
    expectValid(loginSchema, { email: "user@example.com", password: "x" });
    expectInvalid(loginSchema, { email: "invalid", password: "x" });
    expectInvalid(loginSchema, { email: "user@example.com", password: "" });
  });

  it("password reset schemas validate request and confirm inputs", () => {
    expectValid(passwordResetRequestSchema, { email: "user@example.com" });
    expectInvalid(passwordResetRequestSchema, { email: "invalid" });
    expectValid(passwordResetConfirmSchema, {
      token: "a".repeat(32),
      password: "password123",
    });
    expectInvalid(passwordResetConfirmSchema, {
      token: "short",
      password: "password123",
    });
    expectInvalid(passwordResetConfirmSchema, {
      token: "a".repeat(32),
      password: "short",
    });
  });
});

describe("job schemas", () => {
  it("listJobsQuerySchema coerces numeric query params and rejects invalid pagination", () => {
    const parsed = expectValid(listJobsQuerySchema, {
      keyword: " Java ",
      rate: "800000",
      limit: "10",
      offset: "0",
    });
    assert.equal(parsed.keyword, "Java");
    assert.equal(parsed.rate, 800000);
    assert.equal(parsed.limit, 10);
    expectInvalid(listJobsQuerySchema, { limit: "0" });
    expectInvalid(listJobsQuerySchema, { limit: "51" });
    expectInvalid(listJobsQuerySchema, { offset: "-1" });
  });

  it("listScoutableJobsQuerySchema trims optional keyword", () => {
    const parsed = expectValid(listScoutableJobsQuerySchema, {
      keyword: " TypeScript ",
    });
    assert.equal(parsed.keyword, "TypeScript");
  });

  it("createJobSchema accepts Japanese labels and rejects invalid ranges", () => {
    const parsed = expectValid(createJobSchema, {
      title: "案件",
      client: "Client",
      summary: "概要",
      required: ["TypeScript"],
      nice: ["GCP"],
      rateMin: "700000",
      rateMax: "900000",
      marginRate: "12.5",
      streamType: "エンド直",
      remoteType: "フルリモート",
      isPinned: true,
    });
    assert.equal(parsed.streamType, "end_direct");
    assert.equal(parsed.remoteType, "full_remote");
    assert.equal(parsed.rateMin, 700000);
    expectInvalid(createJobSchema, {
      title: "案件",
      rateMin: 900000,
      rateMax: 700000,
      marginRate: 10,
      streamType: "end_direct",
      remoteType: "full_remote",
    });
    expectInvalid(createJobSchema, {
      title: "",
      rateMin: 700000,
      rateMax: 900000,
      marginRate: 10,
      streamType: "end_direct",
      remoteType: "full_remote",
    });
  });

  it("updateJobFlagsSchema accepts partial flags and rejects non-booleans", () => {
    expectValid(updateJobFlagsSchema, { isPinned: true });
    expectValid(updateJobFlagsSchema, { isActive: false });
    expectInvalid(updateJobFlagsSchema, { isPinned: "yes" });
  });
});

describe("profile schemas", () => {
  it("updateProfileSchema accepts labels, numbers, and skill experiences", () => {
    const parsed = expectValid(updateProfileSchema, {
      name: " 山田 太郎 ",
      nameKana: "やまだ たろう",
      phone: "090-1111-2222",
      roleTitle: "フルスタックエンジニア",
      yearsExperience: "6",
      desiredRate: "850000",
      startDate: "2026-09-01",
      workRate: "週5",
      remoteType: "フルリモート",
      availabilityStatus: "即稼働可",
      availabilityNote: "即稼働できます",
      pledgeAccepted: true,
      skills: ["TypeScript"],
      skillExperiences: [{ name: "TypeScript", yearsExperience: "5" }],
    });

    assert.equal(parsed.name, "山田 太郎");
    assert.equal(parsed.remoteType, "full_remote");
    assert.equal(parsed.availabilityStatus, "ready");
    assert.equal(parsed.yearsExperience, 6);
    assert.equal(parsed.skillExperiences?.[0].yearsExperience, 5);
  });

  it("updateProfileSchema rejects out-of-range experience and empty skills", () => {
    expectInvalid(updateProfileSchema, { yearsExperience: 100 });
    expectInvalid(updateProfileSchema, {
      skillExperiences: [{ name: "", yearsExperience: 1 }],
    });
    expectInvalid(updateProfileSchema, { roleTitle: "不明な職種" });
  });

  it("updateInitialMeetingSchema requires a boolean", () => {
    expectValid(updateInitialMeetingSchema, { completed: true });
    expectInvalid(updateInitialMeetingSchema, { completed: "true" });
  });
});

describe("application and meeting schemas", () => {
  it("applySchema requires a uuid jobId", () => {
    expectValid(applySchema, { jobId: uuid });
    expectInvalid(applySchema, { jobId: "not-uuid" });
  });

  it("changeApplicationStatusSchema accepts labels and stored values", () => {
    assert.equal(
      expectValid(changeApplicationStatusSchema, { status: "面談待ち" }).status,
      "meeting_pending",
    );
    assert.equal(
      expectValid(changeApplicationStatusSchema, { status: "contracted" }).status,
      "contracted",
    );
    expectInvalid(changeApplicationStatusSchema, { status: "不明" });
  });

  it("createMeetingSchema requires timezone-aware datetime", () => {
    expectValid(createMeetingSchema, {
      freelancerProfileId: uuid,
      applicationId: uuid,
      candidateAt: "2026-08-20T10:00:00+09:00",
    });
    expectInvalid(createMeetingSchema, {
      candidateAt: "2026-08-20T10:00",
    });
    expectInvalid(createMeetingSchema, {
      freelancerProfileId: "not-uuid",
      candidateAt: "2026-08-20T10:00:00+09:00",
    });
  });

  it("updateMeetingStatusSchema accepts labels and stored values", () => {
    assert.equal(expectValid(updateMeetingStatusSchema, { status: "候補" }).status, "candidate");
    assert.equal(
      expectValid(updateMeetingStatusSchema, { status: "confirmed" }).status,
      "confirmed",
    );
    expectInvalid(updateMeetingStatusSchema, { status: "不明" });
  });
});

describe("message schemas", () => {
  it("sendMessageSchema accepts chat messages and defaults messageType", () => {
    const parsed = expectValid(sendMessageSchema, {
      freelancerProfileId: uuid,
      body: " 本文 ",
    });
    assert.equal(parsed.body, "本文");
    assert.equal(parsed.messageType, "chat");
  });

  it("sendMessageSchema requires jobId for scout and rejects blank body", () => {
    expectValid(sendMessageSchema, {
      freelancerProfileId: uuid,
      jobId: uuid,
      body: "スカウト",
      messageType: "scout",
    });
    expectInvalid(sendMessageSchema, {
      freelancerProfileId: uuid,
      body: "スカウト",
      messageType: "scout",
    });
    expectInvalid(sendMessageSchema, {
      freelancerProfileId: uuid,
      body: " ",
    });
  });

  it("markMessagesReadSchema accepts optional freelancerProfileId", () => {
    expectValid(markMessagesReadSchema, {});
    expectValid(markMessagesReadSchema, { freelancerProfileId: uuid });
    expectInvalid(markMessagesReadSchema, { freelancerProfileId: "bad" });
  });
});

describe("contact, resume, and push schemas", () => {
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
