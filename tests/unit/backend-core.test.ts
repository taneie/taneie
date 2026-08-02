import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getKeyByValue,
  labelToApplicationStatus,
  labelToAvailabilityStatus,
  labelToMeetingStatus,
  labelToRemoteType,
  labelToStreamType,
} from "../../backend/src/domain/types";
import {
  decryptText,
  encryptText,
  piiHash,
} from "../../backend/src/infrastructure/crypto";
import {
  hashPassword,
  signToken,
  verifyPassword,
  verifyToken,
} from "../../backend/src/infrastructure/security";
import {
  mapApplication,
  mapFreelancer,
  mapJob,
  mapMessage,
  toApplicationStatusLabel,
  toAvailabilityLabel,
  toRemoteLabel,
  toStreamLabel,
} from "../../backend/src/application/mappers";

describe("domain label methods", () => {
  it("getKeyByValue returns Japanese label for stored values and passes through unknown values", () => {
    assert.equal(getKeyByValue(labelToRemoteType, "full_remote"), "フルリモート");
    assert.equal(getKeyByValue(labelToStreamType, "prime"), "1次請け");
    assert.equal(getKeyByValue(labelToAvailabilityStatus, "ready"), "即稼働可");
    assert.equal(getKeyByValue(labelToApplicationStatus, "contracted"), "成約");
    assert.equal(getKeyByValue(labelToMeetingStatus, "confirmed"), "確定");
    assert.equal(getKeyByValue(labelToRemoteType, "unknown"), "unknown");
  });
});

describe("crypto and security methods", () => {
  it("encryptText/decryptText round-trip normal, empty, and already encrypted values", () => {
    const encrypted = encryptText("個人情報");

    assert.notEqual(encrypted, "個人情報");
    assert.equal(decryptText(encrypted), "個人情報");
    assert.equal(encryptText(""), "");
    assert.equal(decryptText(""), "");
    assert.equal(encryptText(encrypted), encrypted);
    assert.equal(decryptText("plain-text"), "plain-text");
  });

  it("piiHash is normalized and deterministic", () => {
    assert.equal(piiHash("USER@example.com "), piiHash(" user@example.com"));
    assert.notEqual(piiHash("a@example.com"), piiHash("b@example.com"));
  });

  it("hashPassword/verifyPassword accept the original password and reject others", async () => {
    const hash = await hashPassword("correct-password");

    assert.equal(await verifyPassword("correct-password", hash), true);
    assert.equal(await verifyPassword("wrong-password", hash), false);
  });

  it("signToken/verifyToken round-trip auth context and reject malformed tokens", () => {
    const token = signToken({
      userId: "user-id",
      role: "freelancer",
      email: "freelancer@example.com",
    });
    const payload = verifyToken(token);

    assert.equal(payload.userId, "user-id");
    assert.equal(payload.role, "freelancer");
    assert.equal(payload.email, "freelancer@example.com");
    assert.throws(() => verifyToken("not-a-token"));
  });
});

describe("mapper methods", () => {
  it("label helper methods map stored enum values and notes", () => {
    assert.equal(toRemoteLabel("full_remote"), "フルリモート");
    assert.equal(toStreamLabel("end_direct"), "エンド直");
    assert.equal(toAvailabilityLabel("ready"), "即稼働可");
    assert.equal(toAvailabilityLabel("ready", "個別メモ"), "個別メモ");
    assert.equal(toApplicationStatusLabel("meeting_pending"), "面談待ち");
  });

  it("mapJob maps relations, enum labels, and default client names", () => {
    const job = mapJob({
      id: "job-id",
      clientId: "client-id",
      title: "案件",
      summary: "概要",
      rateMin: 700000,
      rateMax: 900000,
      marginRate: "12.5",
      streamType: "end_direct",
      remoteType: "full_remote",
      isPinned: true,
      isActive: true,
      createdBy: "sales-id",
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      updatedAt: new Date("2026-08-01T00:00:00.000Z"),
      client: null,
      skills: [
        {
          id: "required-id",
          jobId: "job-id",
          skillId: "skill-1",
          requirementType: "required",
          skill: {
            id: "skill-1",
            name: "TypeScript",
            category: "language",
            createdAt: new Date("2026-08-01T00:00:00.000Z"),
          },
        },
        {
          id: "nice-id",
          jobId: "job-id",
          skillId: "skill-2",
          requirementType: "nice",
          skill: {
            id: "skill-2",
            name: "GCP",
            category: "cloud",
            createdAt: new Date("2026-08-01T00:00:00.000Z"),
          },
        },
      ],
    } as never);

    assert.equal(job.client, "未設定");
    assert.deepEqual(job.required, ["TypeScript"]);
    assert.deepEqual(job.nice, ["GCP"]);
    assert.equal(job.marginRate, 12.5);
    assert.equal(job.stream, "エンド直");
    assert.equal(job.remote, "フルリモート");
  });

  it("mapFreelancer decrypts PII and includes per-skill years", () => {
    const freelancer = mapFreelancer({
      id: "profile-id",
      userId: "user-id",
      publicCode: "tf-test",
      roleTitle: "フルスタックエンジニア",
      yearsExperience: "6",
      desiredRate: 850000,
      startDate: new Date("2026-09-01T00:00:00.000Z"),
      workRate: "週5",
      remoteType: "full_remote",
      availabilityStatus: "ready",
      availabilityNote: null,
      pledgedAt: new Date("2026-08-01T00:00:00.000Z"),
      initialMeetingCompleted: true,
      initialMeetingCompletedAt: new Date("2026-08-02T00:00:00.000Z"),
      lastUpdatedOn: new Date("2026-08-01T00:00:00.000Z"),
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      updatedAt: new Date("2026-08-01T00:00:00.000Z"),
      user: {
        id: "user-id",
        name: encryptText("山田 太郎"),
        nameKana: encryptText("やまだ たろう"),
        email: encryptText("freelancer@example.com"),
        emailHash: "hash",
        passwordHash: "password",
        phone: encryptText("090-1111-2222"),
        role: "freelancer",
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date("2026-08-01T00:00:00.000Z"),
        updatedAt: new Date("2026-08-01T00:00:00.000Z"),
      },
      skills: [
        {
          id: "profile-skill-id",
          freelancerProfileId: "profile-id",
          skillId: "skill-id",
          yearsExperience: "5",
          skill: {
            id: "skill-id",
            name: "TypeScript",
            category: "language",
            createdAt: new Date("2026-08-01T00:00:00.000Z"),
          },
        },
      ],
      resumes: [
        {
          id: "resume-id",
          freelancerProfileId: "profile-id",
          originalFilename: encryptText("resume.pdf"),
          mimeType: "application/pdf",
          fileSizeBytes: 100,
          storageKey: "resumes/resume.pdf",
          blobUrl: null,
          blobPath: null,
          storageProvider: "gcs",
          isLatest: true,
          uploadedAt: new Date("2026-08-01T00:00:00.000Z"),
        },
      ],
    } as never);

    assert.equal(freelancer.name, "山田 太郎");
    assert.equal(freelancer.email, "freelancer@example.com");
    assert.equal(freelancer.resumeName, "resume.pdf");
    assert.deepEqual(freelancer.skillExperiences, [
      { name: "TypeScript", yearsExperience: 5 },
    ]);
  });

  it("mapApplication and mapMessage map relations to UI-friendly labels", () => {
    const application = mapApplication({
      id: "application-id",
      jobId: "job-id",
      freelancerProfileId: "profile-id",
      status: "meeting_pending",
      appliedAt: new Date("2026-08-01T00:00:00.000Z"),
      updatedAt: new Date("2026-08-02T00:00:00.000Z"),
      job: {
        id: "job-id",
        clientId: "client-id",
        title: "案件",
        summary: "",
        rateMin: 700000,
        rateMax: 900000,
        marginRate: "10",
        streamType: "prime",
        remoteType: "hybrid",
        isPinned: false,
        isActive: true,
        createdBy: "sales-id",
        createdAt: new Date("2026-08-01T00:00:00.000Z"),
        updatedAt: new Date("2026-08-01T00:00:00.000Z"),
        client: { id: "client-id", name: "Client", createdAt: new Date() },
        skills: [],
      },
      freelancerProfile: {
        id: "profile-id",
        userId: "user-id",
        publicCode: "tf-test",
        roleTitle: "フルスタックエンジニア",
        yearsExperience: "6",
        desiredRate: 850000,
        startDate: null,
        workRate: "週5",
        remoteType: "full_remote",
        availabilityStatus: "ready",
        availabilityNote: null,
        pledgedAt: null,
        initialMeetingCompleted: false,
        initialMeetingCompletedAt: null,
        lastUpdatedOn: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: "user-id",
          name: encryptText("山田 太郎"),
          nameKana: null,
          email: encryptText("freelancer@example.com"),
          emailHash: "hash",
          passwordHash: "password",
          phone: null,
          role: "freelancer",
          isActive: true,
          lastLoginAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        skills: [],
        resumes: [],
      },
    } as never);

    assert.equal(application.status, "面談待ち");
    assert.equal(application.job.title, "案件");
    assert.equal(application.freelancer.name, "山田 太郎");

    const message = mapMessage({
      id: "message-id",
      senderUserId: "sales-id",
      receiverUserId: "user-id",
      freelancerProfileId: "profile-id",
      jobId: "job-id",
      messageType: "chat",
      body: encryptText("本文"),
      sentAt: new Date("2026-08-01T10:00:00.000Z"),
      readAt: null,
      sender: {
        id: "sales-id",
        name: encryptText("営業"),
        nameKana: null,
        email: encryptText("sales@frichy.jp"),
        emailHash: "hash-sales",
        passwordHash: "password",
        phone: null,
        role: "sales",
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      receiver: null,
    } as never);

    assert.equal(message.from, "営業");
    assert.equal(message.body, "本文");
    assert.equal(message.channel, "sales");
    assert.equal(message.readAt, "");
  });
});
