import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  availabilityClass,
  availabilityRank,
  categorizeSkills,
  clone,
  formatJstDateTime,
  maskName,
  profileSkillList,
  splitCsv,
  streamTone,
  toApiDateTime,
  uid,
} from "../Frontend/composables/frichy/utils";
import {
  freelancerFixture,
  profileFixture,
} from "../tests/helpers/fixtures";

describe("フロントエンド共通ユーティリティ", () => {
  /**
   * @testData nested objectを持つsource object。
   * @expected clone後のnested値を変更してもsource objectは変更されない。
   */
  it("clone returns a deep copy without sharing nested references", () => {
    const source = { nested: { value: 1 } };
    const copied = clone(source);

    copied.nested.value = 2;

    assert.equal(source.nested.value, 1);
    assert.equal(copied.nested.value, 2);
  });

  /**
   * @testData 即稼働可、予定あり、停止中、空文字の稼働状況ラベル。
   * @expected 稼働状況ラベルがready/soon/pauseのCSS class用値へ分類される。
   */
  it("availabilityClass maps known and unknown values", () => {
    assert.equal(availabilityClass("即稼働可"), "ready");
    assert.equal(availabilityClass("稼働可能開始日"), "soon");
    assert.equal(availabilityClass("現在は案件停止中"), "pause");
    assert.equal(availabilityClass(""), "pause");
  });

  /**
   * @testData エンド直、1次請け、その他の商流ラベル。
   * @expected 商流ラベルがteal/blue/amberのtoneへ変換される。
   */
  it("streamTone maps direct, prime, and fallback streams", () => {
    assert.equal(streamTone("エンド直"), "teal");
    assert.equal(streamTone("1次請け"), "blue");
    assert.equal(streamTone("その他"), "amber");
  });

  /**
   * @testData 即稼働可、予定あり、停止中の求職者fixture。
   * @expected 稼働状況の優先度が即稼働可 > 予定あり > 停止中のrankになる。
   */
  it("availabilityRank sorts ready users above scheduled and paused users", () => {
    assert.equal(availabilityRank(freelancerFixture({ availability: "即稼働可" })), 3);
    assert.equal(
      availabilityRank(freelancerFixture({ availability: "稼働可能開始日" })),
      2,
    );
    assert.equal(
      availabilityRank(freelancerFixture({ availability: "現在は案件停止中" })),
      1,
    );
  });

  /**
   * @testData 半角カンマ、読点、改行を含む文字列、数値、null、区切り文字だけの文字列。
   * @expected 入力はtrim済み配列へ分割され、nullや空要素だけの入力は空配列になる。
   */
  it("splitCsv accepts comma, Japanese comma, newline, numbers, null, and empty values", () => {
    assert.deepEqual(splitCsv("Java, TypeScript、Go\nReact"), [
      "Java",
      "TypeScript",
      "Go",
      "React",
    ]);
    assert.deepEqual(splitCsv(123), ["123"]);
    assert.deepEqual(splitCsv(null), []);
    assert.deepEqual(splitCsv(" , \n、"), []);
  });

  /**
   * @testData languages/frameworks/db/cloud/otherSkillsを持つprofile fixture。
   * @expected プロフィールのスキルは表示順に1つの配列へ結合される。
   */
  it("profileSkillList combines all skill buckets in display order", () => {
    const skills = profileSkillList(
      profileFixture({
        languages: "TypeScript",
        frameworks: "React",
        db: "PostgreSQL",
        cloud: "GCP",
        otherSkills: "GraphQL",
      }),
    );

    assert.deepEqual(skills, [
      "TypeScript",
      "React",
      "PostgreSQL",
      "GCP",
      "GraphQL",
    ]);
  });

  /**
   * @testData TypeScript、PostgreSQL、React、GCP、GraphQLのスキル配列。
   * @expected 既知スキルは各カテゴリへ分類され、未知スキルはotherへ入る。
   */
  it("categorizeSkills places known skills into their buckets and unknown skills into other", () => {
    assert.deepEqual(
      categorizeSkills(["TypeScript", "PostgreSQL", "React", "GCP", "GraphQL"]),
      {
        languages: ["TypeScript"],
        db: ["PostgreSQL"],
        frameworks: ["React"],
        cloud: ["GCP"],
        other: ["GraphQL"],
      },
    );
  });

  /**
   * @testData 姓名、単一名、空白のみの氏名。
   * @expected 氏名は頭文字マスクされ、空白のみの場合は匿名表示になる。
   */
  it("maskName handles full names, single names, and blanks", () => {
    assert.equal(maskName("山田 太郎"), "山.太.");
    assert.equal(maskName("山田"), "山.");
    assert.equal(maskName("  "), "匿名");
  });

  /**
   * @testData 空白区切り日時、datetime-local、timezone付き日時、UTC日時、空白文字列。
   * @expected timezoneなし日時はJST付きISO風文字列へ補完され、timezone付き値と空文字は意図通り保持される。
   */
  it("toApiDateTime normalizes datetime-local values and preserves timezone-aware values", () => {
    assert.equal(toApiDateTime("2026-08-20 10:00"), "2026-08-20T10:00:00+09:00");
    assert.equal(toApiDateTime("2026-08-20T10:00"), "2026-08-20T10:00:00+09:00");
    assert.equal(
      toApiDateTime("2026-08-20T10:00:00+09:00"),
      "2026-08-20T10:00:00+09:00",
    );
    assert.equal(toApiDateTime("2026-08-20T01:00:00.000Z"), "2026-08-20T01:00:00.000Z");
    assert.equal(toApiDateTime("   "), "");
  });

  /**
   * @testData UTC日時、JST offset付き日時、timezoneなし日時、不正な日時文字列、空白文字列。
   * @expected timezone付き日時はJSTのYYYY-MM-DD HH:mmへ変換され、timezoneなし値と不正値は安全に表示用文字列へ整形される。
   */
  it("formatJstDateTime converts timezone-aware values to JST display time", () => {
    assert.equal(formatJstDateTime("2026-08-20T01:00:00.000Z"), "2026-08-20 10:00");
    assert.equal(
      formatJstDateTime("2026-08-20T10:00:00+09:00"),
      "2026-08-20 10:00",
    );
    assert.equal(formatJstDateTime("2026-08-20T10:00"), "2026-08-20 10:00");
    assert.equal(formatJstDateTime("invalid-value"), "invalid-value");
    assert.equal(formatJstDateTime("   "), "");
  });

  /**
   * @testData `job` prefix。
   * @expected 生成IDは指定prefixから始まる一意ID形式になる。
   */
  it("uid prefixes generated ids", () => {
    assert.match(uid("job"), /^job-[a-zA-Z0-9-]+$/);
  });
});
