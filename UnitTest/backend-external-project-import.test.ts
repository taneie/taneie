import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mapExternalProjectToJobInput,
  resolveRemoteType,
  splitProjectSkills,
} from "../backend/src/application/services/external-project-import.service";

describe("外部案件API取り込み変換", () => {
  /**
   * @testData 個人情報を除外した案件取得APIの全フィールド。
   * @expected 概要へ連結せず、案件条件と必須・尚可スキルが個別フィールドへ変換される。
   */
  it("maps external project fields into structured job fields", () => {
    const mapped = mapExternalProjectToJobInput({
      id: "doc-001",
      dedupeKey: "dedupe-001",
      receivedAt: "2026-06-25T10:00:00+09:00",
      receivedAtMs: 1_750_810_800_000,
      projectName: "Nuxt移行支援",
      requiredSkills: "TypeScript、Nuxt.js / GCP\nPostgreSQL",
      preferredSkills: "Figma、Firebase",
      unitPrice: "70〜85万円",
      settlementLower: 140,
      settlementUpper: 180,
      location: "東京",
      startPeriod: "2026-08月〜",
      remoteRatio: "週3リモート",
      foreignerAvailability: "可",
      ageLimit: "45歳まで",
      createdAt: { _seconds: 1_750_810_860, _nanoseconds: 0 },
      updatedAt: { _seconds: 1_750_810_920, _nanoseconds: 0 },
    });

    assert.ok(mapped);
    assert.equal(mapped.externalSource, "simpleprj");
    assert.equal(mapped.externalId, "doc-001");
    assert.equal(mapped.input.title, "Nuxt移行支援");
    assert.equal(mapped.input.summary, "");
    assert.equal(mapped.input.rateMin, 70);
    assert.equal(mapped.input.rateMax, 85);
    assert.equal(mapped.input.remoteType, "hybrid");
    assert.deepEqual(mapped.input.required, [
      "TypeScript",
      "Nuxt.js",
      "GCP",
      "PostgreSQL",
    ]);
    assert.deepEqual(mapped.input.nice, ["Figma", "Firebase"]);
    assert.deepEqual(
      {
        dedupeKey: mapped.externalFields.externalDedupeKey,
        unitPrice: mapped.externalFields.unitPrice,
        settlementLower: mapped.externalFields.settlementLower,
        settlementUpper: mapped.externalFields.settlementUpper,
        location: mapped.externalFields.location,
        startPeriod: mapped.externalFields.startPeriod,
        remoteRatio: mapped.externalFields.remoteRatio,
        foreignerAvailability: mapped.externalFields.foreignerAvailability,
        ageLimit: mapped.externalFields.ageLimit,
      },
      {
        dedupeKey: "dedupe-001",
        unitPrice: "70〜85万円",
        settlementLower: "140",
        settlementUpper: "180",
        location: "東京",
        startPeriod: "2026-08月〜",
        remoteRatio: "週3リモート",
        foreignerAvailability: "可",
        ageLimit: "45歳まで",
      },
    );
    assert.equal(
      mapped.externalFields.externalReceivedAt?.toISOString(),
      "2026-06-25T01:00:00.000Z",
    );
    assert.equal(mapped.externalFields.externalReceivedAtMs, 1_750_810_800_000n);
    assert.equal(
      mapped.externalFields.externalCreatedAt?.getTime(),
      1_750_810_860_000,
    );
  });

  it("skips projects without an external id", () => {
    assert.equal(mapExternalProjectToJobInput({ projectName: "IDなし案件" }), null);
  });

  it("resolves remote ratio text to Frichy remote type", () => {
    assert.equal(resolveRemoteType("フルリモート"), "full_remote");
    assert.equal(resolveRemoteType("週3リモート"), "hybrid");
    assert.equal(resolveRemoteType("東京常駐"), "onsite");
  });

  it("splits project skill text into reusable skill names", () => {
    assert.deepEqual(splitProjectSkills("必須: Java、Spring Boot / Java"), [
      "Java",
      "Spring Boot",
    ]);
  });
});
