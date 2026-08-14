import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createJobSchema,
  importExternalJobsQuerySchema,
  listJobsQuerySchema,
  listScoutableJobsQuerySchema,
  updateJobFlagsSchema,
} from "../backend/src/interfaces/http/schemas";
import { expectInvalid, expectValid } from "./helpers/schema";

describe("案件API入力スキーマ", () => {
  /**
   * @testData keyword/rate/limit/offsetの文字列query、範囲外limit、負数offset。
   * @expected query文字列はtrimと数値変換され、pagination範囲外の値は拒否される。
   */
  it("listJobsQuerySchema coerces numeric query params and rejects invalid pagination", () => {
    const parsed = expectValid(listJobsQuerySchema, {
      keyword: " Java ",
      rate: "800000",
      limit: "10",
      offset: "0",
    });
    assert.equal(parsed.keyword, "Java");
    assert.equal(parsed.rate, 800000);
    assert.equal(parsed.limit, 10);
    expectInvalid(listJobsQuerySchema, { limit: "0" });
    expectInvalid(listJobsQuerySchema, { limit: "51" });
    expectInvalid(listJobsQuerySchema, { offset: "-1" });
  });

  /**
   * @testData 前後に空白があるkeyword。
   * @expected scoutable案件検索のkeywordはtrimされて保持される。
   */
  it("listScoutableJobsQuerySchema trims optional keyword", () => {
    const parsed = expectValid(listScoutableJobsQuerySchema, {
      keyword: " TypeScript ",
    });
    assert.equal(parsed.keyword, "TypeScript");
  });

  it("importExternalJobsQuerySchema accepts a bounded import limit", () => {
    const parsed = expectValid(importExternalJobsQuerySchema, { limit: "10", onlyNew: "true" });
    assert.equal(parsed.limit, 10);
    assert.equal(parsed.onlyNew, true);
    expectInvalid(importExternalJobsQuerySchema, { limit: "0" });
    expectInvalid(importExternalJobsQuerySchema, { limit: "101" });
  });

  /**
   * @testData 日本語ラベルのリモート種別、単価範囲、必須/尚可スキル、逆転した単価範囲、空title。
   * @expected 日本語ラベルと数値文字列は保存値へ正規化され、単価逆転や空titleは拒否される。
   */
  it("createJobSchema accepts Japanese labels and rejects invalid ranges", () => {
    const parsed = expectValid(createJobSchema, {
      title: "案件",
      client: "Client",
      summary: "概要",
      required: ["TypeScript"],
      nice: ["GCP"],
      rateMin: "700000",
      rateMax: "900000",
      marginRate: "12.5",
      remoteType: "フルリモート",
      isPinned: true,
    });
    assert.equal(parsed.remoteType, "full_remote");
    assert.equal(parsed.rateMin, 700000);
    assert.equal(parsed.marginRate, 12.5);
    const withoutMargin = expectValid(createJobSchema, {
      title: "案件",
      rateMin: 700000,
      rateMax: 900000,
      remoteType: "full_remote",
    });
    assert.equal(withoutMargin.marginRate, 0);
    expectInvalid(createJobSchema, {
      title: "案件",
      rateMin: 900000,
      rateMax: 700000,
      marginRate: 10,
      remoteType: "full_remote",
    });
    expectInvalid(createJobSchema, {
      title: "",
      rateMin: 700000,
      rateMax: 900000,
      marginRate: 10,
      remoteType: "full_remote",
    });
  });

  /**
   * @testData `isPinned`または`isActive`だけを含むpartial objectと、文字列のboolean風値。
   * @expected booleanの部分更新だけが受理され、boolean以外の値はvalidation errorになる。
   */
  it("updateJobFlagsSchema accepts partial flags and rejects non-booleans", () => {
    expectValid(updateJobFlagsSchema, { isPinned: true });
    expectValid(updateJobFlagsSchema, { isActive: false });
    expectInvalid(updateJobFlagsSchema, { isPinned: "yes" });
  });
});
