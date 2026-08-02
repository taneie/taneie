import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { blankProfile, createSeedState } from "../Frontend/composables/frichy/state";

describe("フロントエンド初期状態", () => {
  /**
   * @testData 任意IDを指定した空プロフィール生成。
   * @expected IDは指定値になり、入力項目、面談候補、規約同意状態は安全な初期値になる。
   */
  it("blankProfile returns a safe empty profile", () => {
    const profile = blankProfile("fr-empty");

    assert.equal(profile.id, "fr-empty");
    assert.equal(profile.name, "");
    assert.deepEqual(profile.meetingCandidates, []);
    assert.equal(profile.pledgeAccepted, false);
  });

  /**
   * @testData seed stateに含まれる初期メッセージ一覧。
   * @expected デモログイン直後に未読バッジが出ないよう、未読messageは0件になる。
   */
  it("createSeedState does not expose initial unread chat badges", () => {
    const state = createSeedState();
    const unread = state.messages.filter((message) => !message.readAt);

    assert.equal(unread.length, 0);
  });
});
