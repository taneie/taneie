import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { freelancerToProfile, profileToApi } from "../Frontend/composables/frichy/profileMapping";
import {
  freelancerFixture,
  profileFixture,
} from "../tests/helpers/fixtures";

describe("フロントエンドのプロフィール変換", () => {
  /**
   * @testData email、複数カテゴリのskills、skillExperiences、pledgedAtを持つfreelancer fixture。
   * @expected APIの求職者情報がプロフィール編集フォームのカテゴリ別スキル、経験年数、規約同意状態へ変換される。
   */
  it("freelancerToProfile maps API freelancer data to editable form state", () => {
    const profile = freelancerToProfile(
      freelancerFixture({
        email: "mapped@example.com",
        skills: ["TypeScript", "React", "PostgreSQL", "GCP", "GraphQL"],
        skillExperiences: [
          { name: "TypeScript", yearsExperience: 5 },
          { name: "React", yearsExperience: 4 },
        ],
        pledgedAt: "2026-08-01T00:00:00.000Z",
      }),
      "fallback@example.com",
    );

    assert.equal(profile.email, "mapped@example.com");
    assert.equal(profile.languages, "TypeScript");
    assert.equal(profile.frameworks, "React");
    assert.equal(profile.db, "PostgreSQL");
    assert.equal(profile.cloud, "GCP");
    assert.equal(profile.otherSkills, "GraphQL");
    assert.equal(profile.skillExperiences.TypeScript, "5");
    assert.equal(profile.resumeId, "resume-test");
    assert.equal(profile.pledgeAccepted, true);
  });

  /**
   * @testData API側emailが未設定のfreelancer fixtureとfallback email。
   * @expected API emailがない場合はfallback emailがプロフィールフォームに設定される。
   */
  it("freelancerToProfile uses fallback email when API email is absent", () => {
    const profile = freelancerToProfile(
      freelancerFixture({ email: undefined }),
      "fallback@example.com",
    );

    assert.equal(profile.email, "fallback@example.com");
  });

  /**
   * @testData 文字列の経験年数/希望単価/開始日とカテゴリ別スキルを持つprofile fixture。
   * @expected フォーム値はAPI payloadの数値、日付、skills配列、skillExperiences配列へ変換される。
   */
  it("profileToApi converts form strings into API payload numbers and skill experiences", () => {
    const payload = profileToApi(profileFixture());

    assert.equal(payload.name, "山田 太郎");
    assert.equal(payload.phone, "09011112222");
    assert.equal(payload.yearsExperience, 6);
    assert.equal(payload.desiredRate, 850000);
    assert.equal(payload.startDate, "2026-09-01");
    assert.deepEqual(payload.skills, [
      "TypeScript",
      "Go",
      "React",
      "PostgreSQL",
      "GCP",
      "GraphQL",
    ]);
    assert.deepEqual(payload.skillExperiences[0], {
      name: "TypeScript",
      yearsExperience: 5,
    });
  });

  /**
   * @testData 基本情報だけ入力済みで、経験年数/希望単価/リモート/提案可能ステータスが空欄のprofile fixture。
   * @expected 空欄のoptional項目はAPI payloadから未指定として送られ、enum validationの対象にならない。
   */
  it("profileToApi omits blank optional fields during partial profile save", () => {
    const payload = profileToApi(
      profileFixture({
        years: "",
        desiredRate: "",
        startDate: "",
        workRate: "",
        remote: "",
        availability: "",
      }),
    );

    assert.equal(payload.name, "山田 太郎");
    assert.equal(payload.yearsExperience, undefined);
    assert.equal(payload.desiredRate, undefined);
    assert.equal(payload.startDate, undefined);
    assert.equal(payload.workRate, undefined);
    assert.equal(payload.remoteType, undefined);
    assert.equal(payload.availabilityStatus, undefined);
  });
});
