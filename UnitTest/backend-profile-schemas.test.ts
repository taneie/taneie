import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  updateInitialMeetingSchema,
  updateProfileSchema,
} from "../backend/src/interfaces/http/schemas";
import { expectInvalid, expectValid } from "./helpers/schema";

describe("プロフィールAPI入力スキーマ", () => {
  /**
   * @testData 氏名/かな/電話、職種、経験年数、希望単価、開始日、リモート/稼働ラベル、スキル別経験年数。
   * @expected 文字列はtrimされ、ラベルと数値文字列は保存値/数値へ正規化される。
   */
  it("updateProfileSchema accepts labels, numbers, and skill experiences", () => {
    const parsed = expectValid(updateProfileSchema, {
      name: " 山田 太郎 ",
      nameKana: "やまだ たろう",
      phone: "090-1111-2222",
      roleTitle: "フルスタックエンジニア",
      yearsExperience: "6",
      desiredRate: "850000",
      startDate: "2026-09-01",
      workRate: "週5",
      remoteType: "フルリモート",
      availabilityStatus: "即稼働可",
      availabilityNote: "即稼働できます",
      pledgeAccepted: true,
      skills: ["TypeScript"],
      skillExperiences: [{ name: "TypeScript", yearsExperience: "5" }],
    });

    assert.equal(parsed.name, "山田 太郎");
    assert.equal(parsed.remoteType, "full_remote");
    assert.equal(parsed.availabilityStatus, "ready");
    assert.equal(parsed.yearsExperience, 6);
    assert.equal(parsed.skillExperiences?.[0].yearsExperience, 5);
  });

  /**
   * @testData 範囲外の経験年数、空スキル名を含むskillExperiences、未定義の職種。
   * @expected 経験年数範囲、スキル名必須、職種enumの制約に反する入力は拒否される。
   */
  it("updateProfileSchema rejects out-of-range experience and empty skills", () => {
    expectInvalid(updateProfileSchema, { yearsExperience: 100 });
    expectInvalid(updateProfileSchema, {
      skillExperiences: [{ name: "", yearsExperience: 1 }],
    });
    expectInvalid(updateProfileSchema, { roleTitle: "不明な職種" });
  });

  /**
   * @testData booleanのcompletedと、文字列の`"true"`。
   * @expected 初回面談完了状態はbooleanだけが受理され、文字列はvalidation errorになる。
   */
  it("updateInitialMeetingSchema requires a boolean", () => {
    expectValid(updateInitialMeetingSchema, { completed: true });
    expectInvalid(updateInitialMeetingSchema, { completed: "true" });
  });
});
