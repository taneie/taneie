import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { JobService } from "../backend/src/application/services/job.service";

describe("案件期限切れ削除サービス", () => {
  /**
   * @testData 2026-08-20T12:00:00Zを基準日時にした削除実行。
   * @expected 応募はappliedAt、案件はcreatedAtが30日より前のrecordだけ削除対象になる。
   */
  it("cleanupExpiredJobs deletes applications and jobs older than 30 days", async () => {
    const calls: Array<{ table: string; where: unknown }> = [];
    const db = {
      application: {
        deleteMany: async ({ where }: { where: unknown }) => {
          calls.push({ table: "application", where });
          return { count: 2 };
        },
      },
      job: {
        deleteMany: async ({ where }: { where: unknown }) => {
          calls.push({ table: "job", where });
          return { count: 3 };
        },
      },
      $transaction: async (operations: Array<Promise<{ count: number }>>) =>
        Promise.all(operations),
    };

    const result = await new JobService(db as never).cleanupExpiredJobs(
      new Date("2026-08-20T12:00:00.000Z"),
    );

    assert.deepEqual(result, {
      cutoff: "2026-07-21T12:00:00.000Z",
      retentionDays: 30,
      deletedApplications: 2,
      deletedJobs: 3,
    });
    assert.deepEqual(calls, [
      {
        table: "application",
        where: { appliedAt: { lt: new Date("2026-07-21T12:00:00.000Z") } },
      },
      {
        table: "job",
        where: { createdAt: { lt: new Date("2026-07-21T12:00:00.000Z") } },
      },
    ]);
  });
});
