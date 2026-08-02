import type { Freelancer, ScoutFilters } from "./types";
import { availabilityRank } from "./utils";

export const scoutSortOptions = [
  "稼働状況順",
  "希望単価が高い順",
  "希望単価が低い順",
  "経験年数が多い順",
  "最終更新が新しい順",
] as const;

export const DEFAULT_SCOUT_SORT = scoutSortOptions[0];

export function createDefaultScoutFilters(): ScoutFilters {
  return {
    skill: "",
    availability: "",
    remote: "",
    sort: DEFAULT_SCOUT_SORT,
  };
}

export function filterAndSortFreelancers(
  freelancers: Freelancer[],
  filters: ScoutFilters,
) {
  return [...freelancers]
    .filter(
      (freelancer) =>
        !filters.skill ||
        freelancer.skills
          .join(" ")
          .toLowerCase()
          .includes(filters.skill.toLowerCase()),
    )
    .filter(
      (freelancer) =>
        !filters.availability ||
        freelancer.availability === filters.availability,
    )
    .filter(
      (freelancer) => !filters.remote || freelancer.remote === filters.remote,
    )
    .sort((a, b) => compareScoutFreelancers(a, b, filters.sort));
}

function compareScoutFreelancers(
  a: Freelancer,
  b: Freelancer,
  sort: ScoutFilters["sort"],
) {
  switch (sort) {
    case "希望単価が高い順":
      return b.desiredRate - a.desiredRate;
    case "希望単価が低い順":
      return a.desiredRate - b.desiredRate;
    case "経験年数が多い順":
      return (b.yearsExperience || 0) - (a.yearsExperience || 0);
    case "最終更新が新しい順":
      return (
        new Date(b.lastUpdated || 0).getTime() -
        new Date(a.lastUpdated || 0).getTime()
      );
    default:
      return availabilityRank(b) - availabilityRank(a);
  }
}
