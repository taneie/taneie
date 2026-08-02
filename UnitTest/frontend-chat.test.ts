import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isIncomingMessageForRole,
  isMessageInChatScope,
  isUnreadIncomingMessageForScope,
} from "../Frontend/composables/frichy/chat";
import { messageFixture } from "../tests/helpers/fixtures";

describe("チャット未読判定", () => {
  it("isIncomingMessageForRole treats opposite-channel messages as incoming", () => {
    assert.equal(
      isIncomingMessageForRole(messageFixture({ channel: "sales" }), "freelancer"),
      true,
    );
    assert.equal(
      isIncomingMessageForRole(messageFixture({ channel: "freelancer" }), "sales"),
      true,
    );
    assert.equal(
      isIncomingMessageForRole(messageFixture({ channel: "sales" }), "sales"),
      false,
    );
  });

  it("isMessageInChatScope limits freelancer unread checks to the current freelancer", () => {
    assert.equal(
      isMessageInChatScope(messageFixture({ freelancerId: "fr-test" }), {
        role: "freelancer",
        freelancerId: "fr-test",
      }),
      true,
    );
    assert.equal(
      isMessageInChatScope(messageFixture({ freelancerId: "other" }), {
        role: "freelancer",
        freelancerId: "fr-test",
      }),
      false,
    );
    assert.equal(
      isMessageInChatScope(messageFixture({ freelancerId: "other" }), {
        role: "sales",
      }),
      true,
    );
  });

  it("isUnreadIncomingMessageForScope requires current scope, incoming channel, and missing readAt", () => {
    const scope = { role: "freelancer" as const, freelancerId: "fr-test" };

    assert.equal(
      isUnreadIncomingMessageForScope(
        messageFixture({ channel: "sales", readAt: "" }),
        scope,
      ),
      true,
    );
    assert.equal(
      isUnreadIncomingMessageForScope(
        messageFixture({ channel: "sales", readAt: "2026-08-01T10:00:00.000Z" }),
        scope,
      ),
      false,
    );
    assert.equal(
      isUnreadIncomingMessageForScope(
        messageFixture({ channel: "freelancer", readAt: "" }),
        scope,
      ),
      false,
    );
    assert.equal(
      isUnreadIncomingMessageForScope(
        messageFixture({ freelancerId: "other", channel: "sales", readAt: "" }),
        scope,
      ),
      false,
    );
  });
});
