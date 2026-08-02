import type { Freelancer, Message, Profile } from "../../Frontend/composables/frichy/types";
import { blankProfile } from "../../Frontend/composables/frichy/state";

export function freelancerFixture(
  overrides: Partial<Freelancer> = {},
): Freelancer {
  return {
    id: "fr-test",
    name: "山田 太郎",
    role: "フルスタックエンジニア",
    skills: ["TypeScript", "React"],
    yearsExperience: 5,
    desiredRate: 80,
    workRate: "週5",
    remote: "フルリモート",
    availability: "即稼働可",
    lastUpdated: "2026-08-01",
    resumeName: "resume.pdf",
    ...overrides,
  };
}

export function profileFixture(overrides: Partial<Profile> = {}): Profile {
  return {
    ...blankProfile("fr-test"),
    name: "山田 太郎",
    nameKana: "やまだ たろう",
    email: "freelancer@example.com",
    phone: "090-1111-2222",
    role: "フルスタックエンジニア",
    languages: "TypeScript, Go",
    frameworks: "React",
    db: "PostgreSQL",
    cloud: "GCP",
    otherSkills: "GraphQL",
    years: "6",
    skillExperiences: {
      TypeScript: "5",
      Go: "3",
      React: "4",
      PostgreSQL: "5",
      GCP: "2",
      GraphQL: "2",
    },
    desiredRate: "850000",
    startDate: "2026-09-01",
    workRate: "週5",
    remote: "フルリモート",
    availability: "即稼働可",
    ...overrides,
  };
}

export function messageFixture(overrides: Partial<Message> = {}): Message {
  return {
    id: "msg-test",
    freelancerId: "fr-test",
    from: "営業",
    to: "山田 太郎",
    body: "確認お願いします。",
    at: "2026-08-01T10:00:00.000Z",
    channel: "sales",
    readAt: "",
    ...overrides,
  };
}
