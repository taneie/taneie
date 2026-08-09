import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getKeyByValue,
  labelToApplicationStatus,
  labelToAvailabilityStatus,
  labelToMeetingStatus,
  labelToRemoteType,
  labelToStreamType,
} from "../backend/src/domain/types";

describe("ドメインの表示ラベル変換", () => {
  /**
   * @testData remote、stream、availability、application、meetingの保存値と、辞書にないunknown値。
   * @expected 既知の保存値は日本語ラベルへ変換され、未知の値は入力値のまま返る。
   */
  it("getKeyByValue returns Japanese label for stored values and passes through unknown values", () => {
    assert.equal(getKeyByValue(labelToRemoteType, "full_remote"), "フルリモート");
    assert.equal(getKeyByValue(labelToStreamType, "prime"), "1次請け");
    assert.equal(getKeyByValue(labelToAvailabilityStatus, "ready"), "即稼働可");
    assert.equal(
      getKeyByValue(labelToAvailabilityStatus, "scheduled"),
      "稼働可能開始日",
    );
    assert.equal(getKeyByValue(labelToApplicationStatus, "contracted"), "成約");
    assert.equal(getKeyByValue(labelToMeetingStatus, "confirmed"), "確定");
    assert.equal(getKeyByValue(labelToRemoteType, "unknown"), "unknown");
  });
});
