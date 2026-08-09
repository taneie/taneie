import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  mapExternalProjectToJobInput,
  resolveRemoteType,
  sanitizeExternalProjectText,
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
   * @testData 外部APIのnotesに含まれるメール挨拶、送信者自己紹介、提案依頼文、案件本文。
   * @expected 取り込みsummaryにはメール定型文を保存せず、案件名・概要・必須スキルなどの本文は保持される。
   */
  it("removes email boilerplate while keeping project details", () => {
    const mapped = mapExternalProjectToJobInput({
      id: "doc-mail-001",
      projectName: "QA支援",
      requiredSkills: "テスト設計",
      notes: [
        "株式会社TryAngle ご担当者 様",
        "",
        "いつもお世話になっております。",
        "",
        "3LINKS株式会社の中村です。",
        "",
        "見合う要員様がいましたらご紹介いただけますと幸いです。",
        "",
        "■案件名",
        "QA支援",
        "■概要",
        "モバイルアプリの外部結合テストを担当します。",
        "■必須スキル",
        "テスト設計経験",
        "",
        "どうぞよろしくお願いいたします。",
      ].join("\n"),
      subject: "案件のご紹介",
      dedupeKey: "mail-key",
      salesRep: "株式会社サンプル 営業部",
      sourceBody: "お世話になっております。\n重複するメール本文",
    });

    assert.ok(mapped);
    assert.doesNotMatch(mapped.input.summary || "", /お世話になっております/);
    assert.doesNotMatch(mapped.input.summary || "", /3LINKS株式会社の中村です/);
    assert.doesNotMatch(mapped.input.summary || "", /見合う要員様/);
    assert.doesNotMatch(mapped.input.summary || "", /よろしくお願いいたします/);
    assert.doesNotMatch(mapped.input.summary || "", /subject:/);
    assert.doesNotMatch(mapped.input.summary || "", /dedupeKey:/);
    assert.doesNotMatch(mapped.input.summary || "", /salesRep:/);
    assert.doesNotMatch(mapped.input.summary || "", /sourceBody:/);
    assert.doesNotMatch(mapped.input.summary || "", /重複するメール本文/);
    assert.match(mapped.input.summary || "", /■案件名\nQA支援/);
    assert.match(mapped.input.summary || "", /モバイルアプリの外部結合テスト/);
  });

  /**
   * @testData label付きsummary行、メールアドレス、案件担当、提案時のお願い、案件本文。
   * @expected label付きのメール定型行も除外され、案件本文だけが残る。
   */
  it("sanitizeExternalProjectText removes labeled email boilerplate lines", () => {
    const cleaned = sanitizeExternalProjectText(
      [
        "notes: 協力会社様 各位",
        "ICDの浪川でございます。",
        "株式会社サンプル",
        "salesRep: 株式会社サンプル 営業部",
        "email: partner@example.com",
        "TEL: 03-1234-5678 FAX:03-1234-5679",
        "https://example.com",
        "住所: 東京都渋谷区渋谷1-1-1",
        "〒150-0002 東京都渋谷区渋谷1-1-1",
        "＜案件担当＞",
        "担当：浪川 080-0000-0000",
        "ご提案時のお願い",
        "■作業内容：生成AI活用Webアプリ開発",
        "■単価：80万",
        "sourceBody: お世話になっております。",
        "sourceBody側の重複本文",
      ].join("\n"),
    );

    assert.equal(
      cleaned,
      ["■作業内容：生成AI活用Webアプリ開発", "■単価：80万"].join("\n"),
    );
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
