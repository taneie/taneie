import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { blankProfile, createSeedState } from "../Frontend/composables/frichy/state";

describe("フロントエンド初期状態", () => {
  it("blankProfile returns a safe empty profile", () => {
    const profile = blankProfile("fr-empty");

    assert.equal(profile.id, "fr-empty");
    assert.equal(profile.name, "");
    assert.deepEqual(profile.meetingCandidates, []);
    assert.equal(profile.pledgeAccepted, false);
  });

  it("createSeedState does not expose initial unread chat badges", () => {
    const state = createSeedState();
    const unread = state.messages.filter((message) => !message.readAt);

    assert.equal(unread.length, 0);
  });
});
