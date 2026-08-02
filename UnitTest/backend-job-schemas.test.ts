import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createJobSchema,
  listJobsQuerySchema,
  listScoutableJobsQuerySchema,
  updateJobFlagsSchema,
} from "../backend/src/interfaces/http/schemas";
import { expectInvalid, expectValid } from "./helpers/schema";

describe("案件API入力スキーマ", () => {
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

  it("listScoutableJobsQuerySchema trims optional keyword", () => {
    const parsed = expectValid(listScoutableJobsQuerySchema, {
      keyword: " TypeScript ",
    });
    assert.equal(parsed.keyword, "TypeScript");
  });

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
      streamType: "エンド直",
      remoteType: "フルリモート",
      isPinned: true,
    });
    assert.equal(parsed.streamType, "end_direct");
    assert.equal(parsed.remoteType, "full_remote");
    assert.equal(parsed.rateMin, 700000);
    expectInvalid(createJobSchema, {
      title: "案件",
      rateMin: 900000,
      rateMax: 700000,
      marginRate: 10,
      streamType: "end_direct",
      remoteType: "full_remote",
    });
    expectInvalid(createJobSchema, {
      title: "",
      rateMin: 700000,
      rateMax: 900000,
      marginRate: 10,
      streamType: "end_direct",
      remoteType: "full_remote",
    });
  });

  it("updateJobFlagsSchema accepts partial flags and rejects non-booleans", () => {
    expectValid(updateJobFlagsSchema, { isPinned: true });
    expectValid(updateJobFlagsSchema, { isActive: false });
    expectInvalid(updateJobFlagsSchema, { isPinned: "yes" });
  });
});
