import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  markMessagesReadSchema,
  sendMessageSchema,
} from "../backend/src/interfaces/http/schemas";
import { expectInvalid, expectValid } from "./helpers/schema";

const uuid = "11111111-1111-4111-8111-111111111111";

describe("メッセージAPI入力スキーマ", () => {
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
