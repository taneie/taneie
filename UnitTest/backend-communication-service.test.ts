import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CommunicationService } from "../backend/src/application/services/communication.service";
import type {
  EmailMessage,
  EmailSender,
} from "../backend/src/infrastructure/email";

describe("コミュニケーションサービス", () => {
  /**
   * @testData 生存確認対象の求職者1名、fake EmailSender、AliveCheckTarget更新mock。
   * @expected 生存確認batch/targetを作成し、対象者へメール送信後にtarget statusを`sent`へ更新する。
   */
  it("createAliveCheck sends availability confirmation email to targets", async () => {
    const sentMessages: EmailMessage[] = [];
    const updates: Array<{ where: { id: string }; data: Record<string, unknown> }> =
      [];
    let createArgs: any;
    const db = {
      freelancerProfile: {
        findMany: async () => [
          {
            id: "profile-1",
            user: {
              name: "山田 太郎",
              email: "freelancer@example.com",
            },
          },
        ],
      },
      aliveCheckBatch: {
        create: async (args: any) => {
          createArgs = args;
          return {
            id: "batch-1",
            executedBy: args.data.executedBy,
            targetCount: args.data.targetCount,
            executedAt: new Date("2026-08-01T00:00:00.000Z"),
            targets: args.data.targets.create.map(
              (target: { freelancerProfileId: string }, index: number) => ({
                id: `target-${index + 1}`,
                batchId: "batch-1",
                freelancerProfileId: target.freelancerProfileId,
                status: "pending",
                sentAt: new Date("2026-08-01T00:00:00.000Z"),
                respondedAt: null,
              }),
            ),
          };
        },
      },
      aliveCheckTarget: {
        update: async (args: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => {
          updates.push(args);
          return {};
        },
      },
    };
    const emailSender: EmailSender = {
      assertReady: () => {},
      send: async (message) => {
        sentMessages.push(message);
      },
    };
    const service = new CommunicationService(db as never, emailSender);

    const result = await service.createAliveCheck("sales-1");

    assert.equal(createArgs.data.executedBy, "sales-1");
    assert.equal(createArgs.data.targetCount, 1);
    assert.equal(createArgs.data.targets.create[0].status, "pending");
    assert.equal(sentMessages.length, 1);
    assert.equal(sentMessages[0].to, "freelancer@example.com");
    assert.match(sentMessages[0].subject, /稼働状況/);
    assert.equal(updates[0].where.id, "target-1");
    assert.equal(updates[0].data.status, "sent");
    assert.equal(result.mailSentCount, 1);
    assert.equal(result.mailFailedCount, 0);
  });

  /**
   * @testData 生存確認対象者なし、assertReadyが呼ばれると失敗するfake EmailSender。
   * @expected 対象者0名の場合はメール設定を要求せず、送信件数0としてbatchを作成する。
   */
  it("createAliveCheck does not require email config when there are no targets", async () => {
    const db = {
      freelancerProfile: {
        findMany: async () => [],
      },
      aliveCheckBatch: {
        create: async (args: any) => ({
          id: "batch-empty",
          executedBy: args.data.executedBy,
          targetCount: args.data.targetCount,
          executedAt: new Date("2026-08-01T00:00:00.000Z"),
          targets: [],
        }),
      },
      aliveCheckTarget: {
        update: async () => ({}),
      },
    };
    const emailSender: EmailSender = {
      assertReady: () => {
        throw new Error("should not require email sender");
      },
      send: async () => {
        throw new Error("should not send email");
      },
    };
    const service = new CommunicationService(db as never, emailSender);

    const result = await service.createAliveCheck("sales-1");

    assert.equal(result.targetCount, 0);
    assert.equal(result.mailSentCount, 0);
    assert.equal(result.mailFailedCount, 0);
  });
});
