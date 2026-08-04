import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ProfileService } from "../backend/src/application/services/profile.service";

describe("プロフィールサービス", () => {
  /**
   * @testData startDateを含まないプロフィール途中保存input。
   * @expected DB更新時にstartDateをundefinedにし、既存の稼働開始日をnullで上書きしない。
   */
  it("updateCurrent keeps startDate untouched when partial input omits it", async () => {
    const { service, getUpsertArgs } = createProfileService();

    await service.updateCurrent("user-test", {
      roleTitle: "フルスタックエンジニア",
    });

    assert.equal(getUpsertArgs().update.startDate, undefined);
  });

  /**
   * @testData startDateを含むプロフィール条件保存input。
   * @expected DB更新時にstartDateをDateへ変換して保存する。
   */
  it("updateCurrent converts provided startDate to Date", async () => {
    const { service, getUpsertArgs } = createProfileService();

    await service.updateCurrent("user-test", {
      startDate: "2026-09-01",
    });

    assert.equal(
      getUpsertArgs().update.startDate.toISOString().slice(0, 10),
      "2026-09-01",
    );
  });
});

function createProfileService() {
  let upsertArgs: any;
  const profileRecord = {
    id: "profile-test",
    userId: "user-test",
    publicCode: "tf-test",
    roleTitle: "フルスタックエンジニア",
    yearsExperience: null,
    desiredRate: null,
    startDate: new Date("2026-09-01T00:00:00.000Z"),
    workRate: null,
    remoteType: null,
    availabilityStatus: null,
    availabilityNote: null,
    pledgedAt: null,
    initialMeetingCompleted: false,
    initialMeetingCompletedAt: null,
    lastUpdatedOn: null,
    createdAt: new Date("2026-08-01T00:00:00.000Z"),
    updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    user: {
      id: "user-test",
      role: "freelancer",
      name: "山田 太郎",
      nameKana: "やまだ たろう",
      email: "freelancer@example.com",
      emailHash: "hash",
      passwordHash: "hash",
      phone: "090-1111-2222",
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    },
    skills: [],
    resumes: [],
  };
  const db = {
    freelancerProfile: {
      upsert: async (args: any) => {
        upsertArgs = args;
        return profileRecord;
      },
      findUniqueOrThrow: async () => profileRecord,
    },
    user: {
      update: async () => ({}),
    },
  };

  return {
    service: new ProfileService(db as never),
    getUpsertArgs: () => upsertArgs,
  };
}
