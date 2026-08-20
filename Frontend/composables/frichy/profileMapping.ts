import { blankProfile } from "./state";
import type { Freelancer, Profile } from "./types";
import { categorizeSkills, profileSkillList } from "./utils";
import { normalizeProfilePhoneNumber } from "./profileValidation";

export type ProfileApiPayload = {
  name?: string;
  nameKana?: string;
  phone?: string;
  roleTitle?: string;
  yearsExperience?: number;
  desiredRate?: number;
  startDate?: string;
  workRate?: string;
  remoteType?: string;
  availabilityStatus?: string;
  availabilityNote?: string;
  pledgeAccepted?: boolean;
  skills: string[];
  skillExperiences: Array<{
    name: string;
    yearsExperience?: number;
  }>;
};

export function freelancerToProfile(
  freelancer: Freelancer & {
    nameKana?: string;
    email?: string;
    phone?: string | null;
    yearsExperience?: number;
    startDate?: string;
    pledgedAt?: string;
  },
  fallbackEmail = "",
): Profile {
  const categorizedSkills = categorizeSkills(freelancer.skills || []);
  return {
    ...blankProfile(freelancer.id),
    name: freelancer.name || "",
    nameKana: freelancer.nameKana || "",
    email: freelancer.email || fallbackEmail,
    phone: freelancer.phone || "",
    role: freelancer.role || "",
    languages: categorizedSkills.languages.join(", "),
    db: categorizedSkills.db.join(", "),
    frameworks: categorizedSkills.frameworks.join(", "),
    operatingSystems: categorizedSkills.operatingSystems.join(", "),
    industries: categorizedSkills.industries.join(", "),
    otherSkills: categorizedSkills.other.join(", "),
    years: freelancer.yearsExperience ? String(freelancer.yearsExperience) : "",
    skillExperiences: Object.fromEntries(
      (freelancer.skillExperiences || []).map((item) => [
        item.name,
        item.yearsExperience ? String(item.yearsExperience) : "",
      ]),
    ),
    desiredRate: normalizeDesiredRate(freelancer.desiredRate),
    startDate: freelancer.startDate || "",
    workRate: freelancer.workRate || "",
    remote: freelancer.remote,
    availability: freelancer.availability || "",
    resumeId: freelancer.resumeId || "",
    resumeName: freelancer.resumeName || "",
    pledgeAccepted: Boolean(freelancer.pledgedAt),
    pledgedAt: freelancer.pledgedAt || "",
    initialMeetingCompleted: Boolean(freelancer.initialMeetingCompleted),
    initialMeetingCompletedAt: freelancer.initialMeetingCompletedAt || "",
    lastUpdated: freelancer.lastUpdated || "",
  };
}

export function profileToApi(profile: Profile): ProfileApiPayload {
  const skills = profileSkillList(profile);
  return {
    name: nonEmpty(profile.name),
    nameKana: nonEmpty(profile.nameKana),
    phone: nonEmpty(normalizeProfilePhoneNumber(profile.phone)),
    roleTitle: nonEmpty(profile.role),
    yearsExperience: optionalNumber(profile.years),
    desiredRate: optionalDesiredRate(profile.desiredRate),
    startDate: nonEmpty(profile.startDate),
    workRate: nonEmpty(profile.workRate),
    remoteType: nonEmpty(profile.remote),
    availabilityStatus: nonEmpty(profile.availability),
    availabilityNote: nonEmpty(profile.availability),
    pledgeAccepted:
      profile.pledgeAccepted || Boolean(profile.pledgedAt) || undefined,
    skills,
    skillExperiences: skills.map((name) => {
      const yearsExperience = profile.skillExperiences[name];
      return {
        name,
        yearsExperience: yearsExperience
          ? Number(yearsExperience)
          : undefined,
      };
    }),
  };
}

function nonEmpty(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function optionalNumber(value: string) {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : undefined;
}

function optionalDesiredRate(value: string) {
  const normalized = normalizeDesiredRate(value);
  return normalized ? Number(normalized) : undefined;
}

function normalizeDesiredRate(value: string | number | undefined) {
  if (value === undefined || value === "") return "";
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return String(number >= 10_000 ? number / 10_000 : number);
}
