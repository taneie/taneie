import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateJobMatchScore,
  MINIMUM_MATCH_SCORE,
} from "../backend/src/application/services/job.service";

const profile = {
  roleTitle: "バックエンドエンジニア",
  desiredRate: 850_000,
  remoteType: "full_remote",
  skills: [{ skill: { name: "TypeScript" } }],
};

function job(overrides: Record<string, unknown> = {}) {
  return {
    title: "無関係な案件",
    summary: "",
    rateMin: 700_000,
    rateMax: 900_000,
    remoteType: "full_remote",
    skills: [],
    ...overrides,
  } as never;
}

describe("案件マッチング", () => {
  it("必須スキルの表記揺れは単独でも候補に含める", () => {
    const score = calculateJobMatchScore(
      job({
        rateMax: 500_000,
        remoteType: "onsite",
        skills: [{ requirementType: "required", skill: { name: "TypeScriptを用いた開発" } }],
      }),
      profile,
    );
    assert.ok(score >= MINIMUM_MATCH_SCORE);
  });

  it("尚可スキルは単価とリモートのOR加点で候補に含める", () => {
    const score = calculateJobMatchScore(
      job({ skills: [{ requirementType: "nice", skill: { name: "TypeScript" } }] }),
      profile,
    );
    assert.equal(score, MINIMUM_MATCH_SCORE);
  });

  it("単価とリモートだけが一致する無関係案件は除外する", () => {
    const score = calculateJobMatchScore(job(), profile);
    assert.ok(score < MINIMUM_MATCH_SCORE);
  });

  it("JavaをJavaScriptへ誤って部分一致させない", () => {
    const javaProfile = { ...profile, skills: [{ skill: { name: "Java" } }] };
    const score = calculateJobMatchScore(
      job({
        rateMin: 0,
        rateMax: 0,
        remoteType: "onsite",
        skills: [{ requirementType: "required", skill: { name: "JavaScriptを用いた開発" } }],
      }),
      javaProfile,
    );
    assert.equal(score, 0);
  });

  it("円と万円の単価表記を同じ尺度で比較する", () => {
    const score = calculateJobMatchScore(
      job({
        rateMin: 70,
        rateMax: 90,
        remoteType: "onsite",
        skills: [{ requirementType: "nice", skill: { name: "TypeScript" } }],
      }),
      profile,
    );
    assert.equal(score, 3);
  });
});
