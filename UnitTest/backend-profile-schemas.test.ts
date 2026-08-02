import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  updateInitialMeetingSchema,
  updateProfileSchema,
} from "../backend/src/interfaces/http/schemas";
import { expectInvalid, expectValid } from "./helpers/schema";

describe("プロフィールAPI入力スキーマ", () => {
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

  it("updateProfileSchema rejects out-of-range experience and empty skills", () => {
    expectInvalid(updateProfileSchema, { yearsExperience: 100 });
    expectInvalid(updateProfileSchema, {
      skillExperiences: [{ name: "", yearsExperience: 1 }],
    });
    expectInvalid(updateProfileSchema, { roleTitle: "不明な職種" });
  });

  it("updateInitialMeetingSchema requires a boolean", () => {
    expectValid(updateInitialMeetingSchema, { completed: true });
    expectInvalid(updateInitialMeetingSchema, { completed: "true" });
  });
});
