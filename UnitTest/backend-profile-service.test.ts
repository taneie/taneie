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

  /**
   * @testData 初回面談完了にするプロフィールID、選考中の応募、更新者の営業ユーザーID。
   * @expected 選考中の応募が初回面談完了へ自動更新され、ステータス履歴も残る。
   */
  it("updateInitialMeetingCompleted moves screening applications to initial meeting completed", async () => {
    const {
      service,
      getApplicationUpdateManyArgs,
      getStatusHistoryCreateManyArgs,
    } = createProfileService();

    await service.updateInitialMeetingCompleted(
      "profile-test",
      true,
      "sales-test",
    );

    assert.equal(
      getApplicationUpdateManyArgs().data.status,
      "initial_meeting_completed",
    );
    assert.deepEqual(getStatusHistoryCreateManyArgs().data, [
      {
        applicationId: "application-test",
        fromStatus: "screening",
        toStatus: "initial_meeting_completed",
        changedBy: "sales-test",
        note: "初回面談完了に伴う自動更新",
      },
    ]);
  });
});

function createProfileService() {
  let upsertArgs: any;
  let applicationUpdateManyArgs: any;
  let statusHistoryCreateManyArgs: any;
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
      update: async (args: any) => ({
        ...profileRecord,
        initialMeetingCompleted: args.data.initialMeetingCompleted,
        initialMeetingCompletedAt: args.data.initialMeetingCompletedAt,
      }),
    },
    user: {
      update: async () => ({}),
    },
    application: {
      findMany: async () => [{ id: "application-test", status: "screening" }],
      updateMany: async (args: any) => {
        applicationUpdateManyArgs = args;
        return { count: 1 };
      },
    },
    applicationStatusHistory: {
      createMany: async (args: any) => {
        statusHistoryCreateManyArgs = args;
        return { count: args.data.length };
      },
    },
  };

  return {
    service: new ProfileService(db as never),
    getUpsertArgs: () => upsertArgs,
    getApplicationUpdateManyArgs: () => applicationUpdateManyArgs,
    getStatusHistoryCreateManyArgs: () => statusHistoryCreateManyArgs,
  };
}
