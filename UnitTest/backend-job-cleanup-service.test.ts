import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { JobService } from "../backend/src/application/services/job.service";

describe("案件期限切れ削除サービス", () => {
  /**
   * @testData 2026-08-20T12:00:00Zを基準日時にした削除実行。
   * @expected 案件は30日で削除、通常応募は3か月で非表示・5か月で削除、成約応募は365日で削除になる。
   */
  it("cleanupExpiredJobs hides and deletes applications by source job age", async () => {
    const calls: Array<{
      action: string;
      table: string;
      where: unknown;
      data?: unknown;
    }> = [];
    const counts = [3, 1, 2];
    const db = {
      application: {
        updateMany: async ({ where, data }: { where: unknown; data: unknown }) => {
          calls.push({ action: "updateMany", table: "application", where, data });
          return { count: counts.shift() };
        },
        deleteMany: async ({ where }: { where: unknown }) => {
          calls.push({ action: "deleteMany", table: "application", where });
          return { count: counts.shift() };
        },
      },
      job: {
        deleteMany: async ({ where }: { where: unknown }) => {
          calls.push({ action: "deleteMany", table: "job", where });
          return { count: 4 };
        },
      },
      $transaction: async (
        callback: (tx: unknown) => Promise<unknown>,
      ) => callback(db),
    };

    const result = await new JobService(db as never).cleanupExpiredJobs(
      new Date("2026-08-20T12:00:00.000Z"),
    );

    assert.deepEqual(result, {
      cutoff: "2026-07-21T12:00:00.000Z",
      retentionDays: 30,
      applicationVisibilityCutoff: "2026-05-20T12:00:00.000Z",
      applicationVisibilityMonths: 3,
      applicationCutoff: "2026-03-20T12:00:00.000Z",
      applicationRetentionMonths: 5,
      contractedApplicationCutoff: "2025-08-20T12:00:00.000Z",
      contractedApplicationRetentionDays: 365,
      hiddenApplications: 2,
      deletedApplications: 4,
      deletedExpiredApplications: 3,
      deletedContractedApplications: 1,
      deletedJobs: 4,
    });
    assert.deepEqual(calls, [
      {
        action: "deleteMany",
        table: "application",
        where: {
          status: { not: "contracted" },
          OR: [
            {
              jobSnapshot: {
                is: { sourceCreatedAt: { lt: new Date("2026-03-20T12:00:00.000Z") } },
              },
            },
            {
              job: {
                is: { createdAt: { lt: new Date("2026-03-20T12:00:00.000Z") } },
              },
            },
          ],
        },
      },
      {
        action: "deleteMany",
        table: "application",
        where: {
          status: "contracted",
          OR: [
            {
              jobSnapshot: {
                is: { sourceCreatedAt: { lt: new Date("2025-08-20T12:00:00.000Z") } },
              },
            },
            {
              job: {
                is: { createdAt: { lt: new Date("2025-08-20T12:00:00.000Z") } },
              },
            },
          ],
        },
      },
      {
        action: "updateMany",
        table: "application",
        where: {
          status: { not: "contracted" },
          isHiddenByExpiration: false,
          OR: [
            {
              jobSnapshot: {
                is: { sourceCreatedAt: { lt: new Date("2026-05-20T12:00:00.000Z") } },
              },
            },
            {
              job: {
                is: { createdAt: { lt: new Date("2026-05-20T12:00:00.000Z") } },
              },
            },
          ],
        },
        data: {
          isHiddenByExpiration: true,
          hiddenAt: new Date("2026-08-20T12:00:00.000Z"),
        },
      },
      {
        action: "deleteMany",
        table: "job",
        where: { createdAt: { lt: new Date("2026-07-21T12:00:00.000Z") } },
      },
    ]);
  });
});
