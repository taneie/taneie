import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mapExternalProjectToJobInput,
  resolveRemoteType,
  splitProjectSkills,
} from "../backend/src/application/services/external-project-import.service";

describe("外部案件API取り込み変換", () => {
  /**
   * @testData SimplePrj形式の案件、外部ID、案件名、必須スキル、単価、勤務地、開始時期、リモート比率、受信日時。
   * @expected Frichy案件登録用の入力に変換され、外部ID、単価、リモート種別、summary、必須スキルが保持される。
   */
  it("maps external project fields into Frichy job input", () => {
    const mapped = mapExternalProjectToJobInput({
      id: "doc-001",
      projectName: "Nuxt移行支援",
      requiredSkills: "TypeScript、Nuxt.js / GCP\nPostgreSQL",
      unitPrice: 70,
      location: "東京",
      startPeriod: "2026-08月〜",
      remoteRatio: "週3リモート",
      receivedAt: "2026-06-25T10:00:00+09:00",
      note: "商談1回",
    });

    assert.ok(mapped);
    assert.equal(mapped.externalSource, "simpleprj");
    assert.equal(mapped.externalId, "doc-001");
    assert.equal(mapped.input.title, "Nuxt移行支援");
    assert.equal(mapped.input.rateMin, 70);
    assert.equal(mapped.input.rateMax, 70);
    assert.equal(mapped.input.remoteType, "hybrid");
    assert.deepEqual(mapped.input.required, [
      "TypeScript",
      "Nuxt.js",
      "GCP",
      "PostgreSQL",
    ]);
    assert.match(mapped.input.summary || "", /外部案件ID: doc-001/);
    assert.match(mapped.input.summary || "", /開始時期: 2026-08月〜/);
    assert.match(mapped.input.summary || "", /note: 商談1回/);
  });

  /**
   * @testData 空IDの外部案件。
   * @expected 重複判定に必要な外部IDがない案件は取り込み対象外になる。
   */
  it("skips projects without an external id", () => {
    assert.equal(mapExternalProjectToJobInput({ projectName: "IDなし案件" }), null);
  });

  /**
   * @testData フルリモート、週3リモート、常駐のリモート比率文字列。
   * @expected FrichyのremoteType enumへ分類される。
   */
  it("resolves remote ratio text to Frichy remote type", () => {
    assert.equal(resolveRemoteType("フルリモート"), "full_remote");
    assert.equal(resolveRemoteType("週3リモート"), "hybrid");
    assert.equal(resolveRemoteType("東京常駐"), "onsite");
  });

  /**
   * @testData 区切り文字と重複を含む必須スキル文字列。
   * @expected スキルはtrim済みのユニーク配列になる。
   */
  it("splits required skill text into reusable skill names", () => {
    assert.deepEqual(splitProjectSkills("必須: Java、Spring Boot / Java"), [
      "Java",
      "Spring Boot",
    ]);
  });
});
