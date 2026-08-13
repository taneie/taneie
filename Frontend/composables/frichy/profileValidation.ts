import type { ProfileRegistrationInput } from "./types";
import { splitCsv } from "./utils";

export const profileRegistrationErrorKeys = [
  "name",
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
  options: { hasExistingResume?: boolean } = {},
): ProfileRegistrationValidationErrors {
  const errors: ProfileRegistrationValidationErrors = {};
  if (!values.basic.name.trim()) errors.name = "お名前を入力してください。";
  if (!values.basic.email.trim())
    errors.email = "メールアドレスを入力してください。";
  if (!values.basic.phone.trim()) errors.phone = "電話番号を入力してください。";
  if (!values.basic.role.trim()) errors.role = "職種を選択してください。";
  if (
    ![
      values.skills.languages,
      values.skills.db,
      values.skills.frameworks,
      values.skills.cloud,
      values.skills.otherSkills,
    ].some((value) => splitCsv(value).length)
  ) {
    errors.skills =
      "スキルはチェックまたはその他を1つ以上入力してください。";
  }
  if (!String(values.skills.years || "").trim())
    errors.years = "経験年数を入力してください。";
  if (!values.terms.desiredRate.trim())
    errors.desiredRate = "希望単価を入力してください。";
  if (!values.terms.startDate.trim())
    errors.startDate = "稼働開始可能日を入力してください。";
  if (!values.terms.workRate.trim())
    errors.workRate = "稼働率を選択してください。";
  if (!values.terms.remote.trim())
    errors.remote = "リモート可否を選択してください。";
  if (!values.terms.availability.trim())
    errors.availability = "提案可能ステータスを選択してください。";
  if (!options.hasExistingResume && !values.terms.resume?.name)
    errors.resume = "レジュメを登録してください。";
  if (!profileRegistrationCandidates(values).length)
    errors.meetingCandidates =
      "初回面談の候補日を1つ以上入力してください。";
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

function profileRegistrationCandidates(values: ProfileRegistrationInput) {
  const source = Array.isArray(values.meetingCandidates)
    ? values.meetingCandidates
    : values.meetingCandidates.split("\n");

  return source.filter((candidate) => candidate.trim());
}
