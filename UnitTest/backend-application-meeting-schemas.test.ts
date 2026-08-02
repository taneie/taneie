import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applySchema,
  changeApplicationStatusSchema,
  createMeetingSchema,
  updateMeetingStatusSchema,
} from "../backend/src/interfaces/http/schemas";
import { expectInvalid, expectValid } from "./helpers/schema";

const uuid = "11111111-1111-4111-8111-111111111111";

describe("application schemas", () => {
  it("applySchema requires a uuid jobId", () => {
    expectValid(applySchema, { jobId: uuid });
    expectInvalid(applySchema, { jobId: "not-uuid" });
  });

  it("changeApplicationStatusSchema accepts labels and stored values", () => {
    assert.equal(
      expectValid(changeApplicationStatusSchema, { status: "面談待ち" }).status,
      "meeting_pending",
    );
    assert.equal(
      expectValid(changeApplicationStatusSchema, { status: "contracted" }).status,
      "contracted",
    );
    expectInvalid(changeApplicationStatusSchema, { status: "不明" });
  });
});

describe("meeting schemas", () => {
  it("createMeetingSchema requires timezone-aware datetime", () => {
    expectValid(createMeetingSchema, {
      freelancerProfileId: uuid,
      applicationId: uuid,
      candidateAt: "2026-08-20T10:00:00+09:00",
    });
    expectInvalid(createMeetingSchema, {
      candidateAt: "2026-08-20T10:00",
    });
    expectInvalid(createMeetingSchema, {
      freelancerProfileId: "not-uuid",
      candidateAt: "2026-08-20T10:00:00+09:00",
    });
  });

  it("updateMeetingStatusSchema accepts labels and stored values", () => {
    assert.equal(expectValid(updateMeetingStatusSchema, { status: "候補" }).status, "candidate");
    assert.equal(
      expectValid(updateMeetingStatusSchema, { status: "confirmed" }).status,
      "confirmed",
    );
    expectInvalid(updateMeetingStatusSchema, { status: "不明" });
  });
});
