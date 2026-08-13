import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createDefaultScoutFilters,
  filterAndSortFreelancers,
} from "../Frontend/composables/frichy/scoutFilters";
import { freelancerFixture } from "../tests/helpers/fixtures";

describe("スカウト対象の絞り込み・並び替え", () => {
  /**
   * @testData フィルタ未指定の初期状態。
   * @expected skill/availability/remoteは空、sortは「稼働状況順」で初期化される。
   */
  it("createDefaultScoutFilters returns the default sort and empty filters", () => {
    assert.deepEqual(createDefaultScoutFilters(), {
      skill: "",
      availability: "",
      remote: "",
      sort: "稼働状況順",
    });
  });

  /**
   * @testData TypeScript/フルリモートの求職者とGo/常駐の求職者、skill/availability/remote条件。
   * @expected 条件に一致する求職者だけが絞り込み結果に残る。
   */
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

  /**
   * @testData 希望単価、経験年数、稼働状況、最終更新日が異なる3名の求職者。
   * @expected 各sort条件で期待順に並び替わり、入力配列の元順は破壊されない。
   */
  it("filterAndSortFreelancers sorts by rate, experience, update date, and availability without mutating source order", () => {
    const freelancers = [
      freelancerFixture({
        id: "a",
        desiredRate: 70,
        yearsExperience: 3,
        availability: "営業停止中",
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
        availability: "稼働可能開始日",
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
