import type { ProfileRegistrationInput } from "./types";
import { splitCsv } from "./utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HIRAGANA_PATTERN = /^[ぁ-ゖー\s　]+$/u;
const PHONE_INPUT_PATTERN = /^\d{2,4}-?\d{2,4}-?\d{3,4}$/;

export const MAX_PROFILE_EXPERIENCE_YEARS = 50;
export const MIN_PROFILE_DESIRED_RATE = 30;
export const MAX_PROFILE_DESIRED_RATE = 300;

export const profileRegistrationErrorKeys = [
  "name",
  "nameKana",
  "email",
  "phone",
  "role",
  "skills",
  "years",
  "desiredRate",
  "startDate",
  "workRate",
  "remote",
  "availability",
  "resume",
  "meetingCandidates",
  "pledgeAccepted",
] as const;

export type ProfileRegistrationErrorKey =
  (typeof profileRegistrationErrorKeys)[number];

export type ProfileRegistrationValidationErrors = Partial<
  Record<ProfileRegistrationErrorKey, string>
>;

export const profileRegistrationErrorSteps: Record<
  ProfileRegistrationErrorKey,
  number
> = {
  name: 1,
  nameKana: 1,
  email: 1,
  phone: 1,
  role: 1,
  skills: 2,
  years: 2,
  desiredRate: 3,
  startDate: 3,
  workRate: 3,
  remote: 3,
  availability: 3,
  resume: 3,
  meetingCandidates: 4,
  pledgeAccepted: 4,
};

export function validateProfileRegistrationInput(
  values: ProfileRegistrationInput,
  options: {
    hasExistingResume?: boolean;
    initialMeetingCompleted?: boolean;
  } = {},
): ProfileRegistrationValidationErrors {
  const errors: ProfileRegistrationValidationErrors = {};
  if (!values.basic.name.trim()) errors.name = "お名前を入力してください。";
  if (!values.basic.nameKana.trim())
    errors.nameKana = "お名前（ふりがな）を入力してください。";
  else if (!isValidProfileNameKana(values.basic.nameKana))
    errors.nameKana = "お名前（ふりがな）はひらがなで入力してください。";
  if (!values.basic.email.trim())
    errors.email = "メールアドレスを入力してください。";
  else if (!isValidProfileEmail(values.basic.email))
    errors.email = "メールアドレスの形式で入力してください。";
  if (!values.basic.phone.trim()) errors.phone = "電話番号を入力してください。";
  else if (!isValidProfilePhoneNumber(values.basic.phone))
    errors.phone = "電話番号は10〜11桁の数字で入力してください（ハイフン可）。";
  if (!values.basic.role.trim()) errors.role = "職種を選択してください。";
  if (
    ![
      values.skills.languages,
      values.skills.db,
      values.skills.frameworks,
      values.skills.operatingSystems,
      values.skills.industries,
      values.skills.otherSkills,
    ].some((value) => splitCsv(value).length)
  ) {
    errors.skills = "スキルまたは業種を1つ以上選択してください。";
  }
  if (!String(values.skills.years || "").trim()) {
    errors.years = "経験年数を入力してください。";
  } else if (
    !isNumberInRange(
      values.skills.years,
      0,
      MAX_PROFILE_EXPERIENCE_YEARS,
    )
  ) {
    errors.years = `経験年数は0〜${MAX_PROFILE_EXPERIENCE_YEARS}年で入力してください。`;
  } else if (
    Object.values(values.skills.skillExperiences).some(
      (years) =>
        years.trim() &&
        !isNumberInRange(years, 0, MAX_PROFILE_EXPERIENCE_YEARS),
    )
  ) {
    errors.years = `スキルごとの経験年数は0〜${MAX_PROFILE_EXPERIENCE_YEARS}年で入力してください。`;
  }
  if (!values.terms.desiredRate.trim()) {
    errors.desiredRate = "希望単価を入力してください。";
  } else if (!isValidProfileDesiredRate(values.terms.desiredRate)) {
    errors.desiredRate = `希望単価は${MIN_PROFILE_DESIRED_RATE}〜${MAX_PROFILE_DESIRED_RATE}万円で入力してください。`;
  }
  if (!values.terms.startDate.trim())
    errors.startDate = "最短稼働開始日を入力してください。";
  if (!values.terms.workRate.trim())
    errors.workRate = "稼働率を選択してください。";
  if (!values.terms.remote.trim())
    errors.remote = "リモート可否を選択してください。";
  if (!values.terms.availability.trim())
    errors.availability = "案件提案の受付状況を選択してください。";
  if (!options.hasExistingResume && !values.terms.resume?.name)
    errors.resume = "レジュメを登録してください。";
  const candidates = profileRegistrationCandidates(values);
  if (!options.initialMeetingCompleted && !candidates.length)
    errors.meetingCandidates =
      "初回面談の候補日を1つ以上入力してください。";
  else if (
    !options.initialMeetingCompleted &&
    candidates.some((candidate) => !isFutureProfileMeetingCandidate(candidate))
  )
    errors.meetingCandidates =
      "初回面談の候補日は現在以降の日時を入力してください。";
  if (!values.pledgeAccepted)
    errors.pledgeAccepted = "誓約条件を確認し、同意してください。";

  return errors;
}

export function hasProfileRegistrationValidationErrors(
  errors: ProfileRegistrationValidationErrors,
) {
  return profileRegistrationErrorKeys.some((key) => Boolean(errors[key]));
}

export function firstProfileRegistrationErrorKey(
  errors: ProfileRegistrationValidationErrors,
) {
  return profileRegistrationErrorKeys.find((key) => Boolean(errors[key]));
}

export function isValidProfileEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

export function isValidProfileNameKana(value: string) {
  return HIRAGANA_PATTERN.test(value.trim());
}

export function normalizeProfilePhoneNumber(value: string) {
  return value.trim().replace(/-/g, "");
}

export function isValidProfilePhoneNumber(value: string) {
  const trimmed = value.trim();
  const normalized = normalizeProfilePhoneNumber(trimmed);

  return (
    PHONE_INPUT_PATTERN.test(trimmed) &&
    /^\d+$/.test(normalized) &&
    (normalized.length === 10 || normalized.length === 11)
  );
}

export function isValidProfileDesiredRate(value: string) {
  const trimmed = value.trim();
  if (!/^\d{1,3}$/.test(trimmed)) return false;
  return isIntegerInRange(
    trimmed,
    MIN_PROFILE_DESIRED_RATE,
    MAX_PROFILE_DESIRED_RATE,
  );
}

export function isFutureProfileMeetingCandidate(
  value: string,
  now = new Date(),
) {
  const date = parseProfileDateTime(value);
  if (!date) return false;

  const currentMinute = new Date(now);
  currentMinute.setSeconds(0, 0);
  return date.getTime() >= currentMinute.getTime();
}

function isNumberInRange(value: string, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max;
}

function isIntegerInRange(value: string, min: number, max: number) {
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max;
}

function parseProfileDateTime(value: string) {
  const normalized = value.trim().replace(" ", "T");
  if (!normalized) return null;

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function profileRegistrationCandidates(values: ProfileRegistrationInput) {
  const source = Array.isArray(values.meetingCandidates)
    ? values.meetingCandidates
    : values.meetingCandidates.split("\n");

  return source.filter((candidate) => candidate.trim());
}
