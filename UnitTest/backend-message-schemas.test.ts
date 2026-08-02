import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  markMessagesReadSchema,
  sendMessageSchema,
} from "../backend/src/interfaces/http/schemas";
import { expectInvalid, expectValid } from "./helpers/schema";

const uuid = "11111111-1111-4111-8111-111111111111";

describe("メッセージAPI入力スキーマ", () => {
  /**
   * @testData freelancerProfileIdと前後空白を含むbodyのみのチャット入力。
   * @expected bodyはtrimされ、messageType未指定時は`chat`として受理される。
   */
  it("sendMessageSchema accepts chat messages and defaults messageType", () => {
    const parsed = expectValid(sendMessageSchema, {
      freelancerProfileId: uuid,
      body: " 本文 ",
    });
    assert.equal(parsed.body, "本文");
    assert.equal(parsed.messageType, "chat");
  });

  /**
   * @testData scout messageType、freelancerProfileId、jobIdあり/なし、空白body。
   * @expected scoutはjobId必須として受理/拒否され、空白bodyはmessageTypeに関係なく拒否される。
   */
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

  /**
   * @testData 空object、有効なfreelancerProfileId、不正なfreelancerProfileId。
   * @expected freelancerProfileIdは任意だが、指定する場合はUUID形式だけが受理される。
   */
  it("markMessagesReadSchema accepts optional freelancerProfileId", () => {
    expectValid(markMessagesReadSchema, {});
    expectValid(markMessagesReadSchema, { freelancerProfileId: uuid });
    expectInvalid(markMessagesReadSchema, { freelancerProfileId: "bad" });
  });
});
