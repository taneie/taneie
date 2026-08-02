import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applySchema,
  changeApplicationStatusSchema,
  createMeetingSchema,
  updateMeetingStatusSchema,
} from "../backend/src/interfaces/http/schemas";
import { expectInvalid, expectValid } from "./helpers/schema";

const uuid = "11111111-1111-4111-8111-111111111111";

describe("応募API入力スキーマ", () => {
  /**
   * @testData 正常系はUUID形式のjobId、異常系はUUIDではない文字列。
   * @expected UUID形式のjobIdだけが受理され、不正なjobIdはvalidation errorになる。
   */
  it("applySchema requires a uuid jobId", () => {
    expectValid(applySchema, { jobId: uuid });
    expectInvalid(applySchema, { jobId: "not-uuid" });
  });

  /**
   * @testData 日本語ラベルの「面談待ち」、保存値の`contracted`、未定義ラベルの「不明」。
   * @expected 日本語ラベルと保存値は保存用statusへ正規化され、不明なstatusは拒否される。
   */
  it("changeApplicationStatusSchema accepts labels and stored values", () => {
    assert.equal(
      expectValid(changeApplicationStatusSchema, { status: "面談待ち" }).status,
      "meeting_pending",
    );
    assert.equal(
      expectValid(changeApplicationStatusSchema, { status: "contracted" }).status,
      "contracted",
    );
    expectInvalid(changeApplicationStatusSchema, { status: "不明" });
  });
});

describe("面談API入力スキーマ", () => {
  /**
   * @testData 求職者ID、応募ID、timezone付き日時、timezoneなし日時、不正UUID。
   * @expected timezone付き日時とUUIDは受理され、timezoneなし日時と不正UUIDは拒否される。
   */
  it("createMeetingSchema requires timezone-aware datetime", () => {
    expectValid(createMeetingSchema, {
      freelancerProfileId: uuid,
      applicationId: uuid,
      candidateAt: "2026-08-20T10:00:00+09:00",
    });
    expectInvalid(createMeetingSchema, {
      candidateAt: "2026-08-20T10:00",
    });
    expectInvalid(createMeetingSchema, {
      freelancerProfileId: "not-uuid",
      candidateAt: "2026-08-20T10:00:00+09:00",
    });
  });

  /**
   * @testData 日本語ラベルの「候補」、保存値の`confirmed`、未定義ラベルの「不明」。
   * @expected 既知の面談statusだけが保存値へ正規化され、不明なstatusはvalidation errorになる。
   */
  it("updateMeetingStatusSchema accepts labels and stored values", () => {
    assert.equal(expectValid(updateMeetingStatusSchema, { status: "候補" }).status, "candidate");
    assert.equal(
      expectValid(updateMeetingStatusSchema, { status: "confirmed" }).status,
      "confirmed",
    );
    expectInvalid(updateMeetingStatusSchema, { status: "不明" });
  });
});
