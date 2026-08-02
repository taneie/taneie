import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  availabilityClass,
  availabilityRank,
  categorizeSkills,
  clone,
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

describe("frontend utility methods", () => {
  it("clone returns a deep copy without sharing nested references", () => {
    const source = { nested: { value: 1 } };
    const copied = clone(source);

    copied.nested.value = 2;

    assert.equal(source.nested.value, 1);
    assert.equal(copied.nested.value, 2);
  });

  it("availabilityClass maps known and unknown values", () => {
    assert.equal(availabilityClass("即稼働可"), "ready");
    assert.equal(availabilityClass("2026年7月から空き予定"), "soon");
    assert.equal(availabilityClass("現在は案件停止中"), "pause");
    assert.equal(availabilityClass(""), "pause");
  });

  it("streamTone maps direct, prime, and fallback streams", () => {
    assert.equal(streamTone("エンド直"), "teal");
    assert.equal(streamTone("1次請け"), "blue");
    assert.equal(streamTone("その他"), "amber");
  });

  it("availabilityRank sorts ready users above scheduled and paused users", () => {
    assert.equal(availabilityRank(freelancerFixture({ availability: "即稼働可" })), 3);
    assert.equal(
      availabilityRank(
        freelancerFixture({ availability: "2026年7月から空き予定" }),
      ),
      2,
    );
    assert.equal(
      availabilityRank(freelancerFixture({ availability: "現在は案件停止中" })),
      1,
    );
  });

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

  it("maskName handles full names, single names, and blanks", () => {
    assert.equal(maskName("山田 太郎"), "山.太.");
    assert.equal(maskName("山田"), "山.");
    assert.equal(maskName("  "), "匿名");
  });

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

  it("uid prefixes generated ids", () => {
    assert.match(uid("job"), /^job-[a-zA-Z0-9-]+$/);
  });
});
