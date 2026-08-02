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
} from "../../Frontend/composables/frichy/utils";
import { blankProfile, createSeedState } from "../../Frontend/composables/frichy/state";
import { freelancerToProfile, profileToApi } from "../../Frontend/composables/frichy/profileMapping";
import {
  createDefaultScoutFilters,
  filterAndSortFreelancers,
} from "../../Frontend/composables/frichy/scoutFilters";
import {
  isIncomingMessageForRole,
  isMessageInChatScope,
  isUnreadIncomingMessageForScope,
} from "../../Frontend/composables/frichy/chat";
import {
  freelancerFixture,
  messageFixture,
  profileFixture,
} from "../helpers/fixtures";

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

describe("frontend state and mapping methods", () => {
  it("blankProfile returns a safe empty profile", () => {
    const profile = blankProfile("fr-empty");

    assert.equal(profile.id, "fr-empty");
    assert.equal(profile.name, "");
    assert.deepEqual(profile.meetingCandidates, []);
    assert.equal(profile.pledgeAccepted, false);
  });

  it("createSeedState does not expose initial unread chat badges", () => {
    const state = createSeedState();
    const unread = state.messages.filter((message) => !message.readAt);

    assert.equal(unread.length, 0);
  });

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
    assert.equal(profile.pledgeAccepted, true);
  });

  it("freelancerToProfile uses fallback email when API email is absent", () => {
    const profile = freelancerToProfile(
      freelancerFixture({ email: undefined }),
      "fallback@example.com",
    );

    assert.equal(profile.email, "fallback@example.com");
  });

  it("profileToApi converts form strings into API payload numbers and skill experiences", () => {
    const payload = profileToApi(profileFixture());

    assert.equal(payload.name, "山田 太郎");
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
});

describe("scout filter methods", () => {
  it("createDefaultScoutFilters returns the default sort and empty filters", () => {
    assert.deepEqual(createDefaultScoutFilters(), {
      skill: "",
      availability: "",
      remote: "",
      sort: "稼働状況順",
    });
  });

  it("filterAndSortFreelancers filters by skill, availability, and remote", () => {
    const result = filterAndSortFreelancers(
      [
        freelancerFixture({ id: "a", skills: ["TypeScript"], remote: "フルリモート" }),
        freelancerFixture({ id: "b", skills: ["Go"], remote: "常駐" }),
      ],
      {
        skill: "type",
        availability: "即稼働可",
        remote: "フルリモート",
        sort: "稼働状況順",
      },
    );

    assert.deepEqual(result.map((freelancer) => freelancer.id), ["a"]);
  });

  it("filterAndSortFreelancers sorts by rate, experience, update date, and availability without mutating source order", () => {
    const freelancers = [
      freelancerFixture({
        id: "a",
        desiredRate: 70,
        yearsExperience: 3,
        availability: "現在は案件停止中",
        lastUpdated: "2026-07-01",
      }),
      freelancerFixture({
        id: "b",
        desiredRate: 90,
        yearsExperience: 8,
        availability: "即稼働可",
        lastUpdated: "2026-08-01",
      }),
      freelancerFixture({
        id: "c",
        desiredRate: 80,
        yearsExperience: 5,
        availability: "2026年7月から空き予定",
        lastUpdated: "2026-07-20",
      }),
    ];

    assert.deepEqual(
      filterAndSortFreelancers(freelancers, {
        ...createDefaultScoutFilters(),
        sort: "希望単価が高い順",
      }).map((freelancer) => freelancer.id),
      ["b", "c", "a"],
    );
    assert.deepEqual(
      filterAndSortFreelancers(freelancers, {
        ...createDefaultScoutFilters(),
        sort: "希望単価が低い順",
      }).map((freelancer) => freelancer.id),
      ["a", "c", "b"],
    );
    assert.deepEqual(
      filterAndSortFreelancers(freelancers, {
        ...createDefaultScoutFilters(),
        sort: "経験年数が多い順",
      }).map((freelancer) => freelancer.id),
      ["b", "c", "a"],
    );
    assert.deepEqual(
      filterAndSortFreelancers(freelancers, {
        ...createDefaultScoutFilters(),
        sort: "最終更新が新しい順",
      }).map((freelancer) => freelancer.id),
      ["b", "c", "a"],
    );
    assert.deepEqual(
      filterAndSortFreelancers(freelancers, createDefaultScoutFilters()).map(
        (freelancer) => freelancer.id,
      ),
      ["b", "c", "a"],
    );
    assert.deepEqual(
      freelancers.map((freelancer) => freelancer.id),
      ["a", "b", "c"],
    );
  });
});

describe("chat unread methods", () => {
  it("isIncomingMessageForRole treats opposite-channel messages as incoming", () => {
    assert.equal(
      isIncomingMessageForRole(messageFixture({ channel: "sales" }), "freelancer"),
      true,
    );
    assert.equal(
      isIncomingMessageForRole(messageFixture({ channel: "freelancer" }), "sales"),
      true,
    );
    assert.equal(
      isIncomingMessageForRole(messageFixture({ channel: "sales" }), "sales"),
      false,
    );
  });

  it("isMessageInChatScope limits freelancer unread checks to the current freelancer", () => {
    assert.equal(
      isMessageInChatScope(messageFixture({ freelancerId: "fr-test" }), {
        role: "freelancer",
        freelancerId: "fr-test",
      }),
      true,
    );
    assert.equal(
      isMessageInChatScope(messageFixture({ freelancerId: "other" }), {
        role: "freelancer",
        freelancerId: "fr-test",
      }),
      false,
    );
    assert.equal(
      isMessageInChatScope(messageFixture({ freelancerId: "other" }), {
        role: "sales",
      }),
      true,
    );
  });

  it("isUnreadIncomingMessageForScope requires current scope, incoming channel, and missing readAt", () => {
    const scope = { role: "freelancer" as const, freelancerId: "fr-test" };

    assert.equal(
      isUnreadIncomingMessageForScope(
        messageFixture({ channel: "sales", readAt: "" }),
        scope,
      ),
      true,
    );
    assert.equal(
      isUnreadIncomingMessageForScope(
        messageFixture({ channel: "sales", readAt: "2026-08-01T10:00:00.000Z" }),
        scope,
      ),
      false,
    );
    assert.equal(
      isUnreadIncomingMessageForScope(
        messageFixture({ channel: "freelancer", readAt: "" }),
        scope,
      ),
      false,
    );
    assert.equal(
      isUnreadIncomingMessageForScope(
        messageFixture({ freelancerId: "other", channel: "sales", readAt: "" }),
        scope,
      ),
      false,
    );
  });
});
