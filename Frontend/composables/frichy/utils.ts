import type { Freelancer, Profile } from "./types";

export const JOB_SUMMARY_PREVIEW_LIMIT = 200;

const HIDDEN_JOB_SUMMARY_KEYS = new Set([
  "id",
  "externalid",
  "external_id",
  "documentid",
  "document_id",
  "created",
  "createdat",
  "created_at",
  "updated",
  "updatedat",
  "updated_at",
  "receivedat",
  "received_at",
  "receivedatms",
  "received_at_ms",
  "timestamp",
]);

const HIDDEN_JOB_SUMMARY_LABELS = new Set([
  "外部案件ID",
  "ドキュメントID",
  "案件ID",
  "作成日時",
  "更新日時",
  "登録日時",
  "取得日時",
  "受信日時",
]);

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function availabilityClass(value = "") {
  if (value === "即稼働可") return "ready";
  if (value === "稼働可能開始日" || value.includes("空き予定")) return "soon";
  return "pause";
}

export function availabilityRank(freelancer: Freelancer) {
  if (freelancer.availability === "即稼働可") return 3;
  if (
    freelancer.availability === "稼働可能開始日" ||
    freelancer.availability.includes("空き予定")
  )
    return 2;
  return 1;
}

export function splitCsv(value: string | number | null | undefined) {
  return String(value || "")
    .split(/[,、\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function sanitizeJobSummary(value = "") {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => !isHiddenJobSummaryLine(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function toJobSummaryDisplay(
  value = "",
  expanded = false,
  limit = JOB_SUMMARY_PREVIEW_LIMIT,
) {
  const fullText = sanitizeJobSummary(value);
  const isCollapsible = fullText.length > limit;
  const previewText = isCollapsible
    ? `${fullText.slice(0, limit).trimEnd()}...`
    : fullText;

  return {
    fullText,
    previewText,
    text: expanded ? fullText : previewText,
    isCollapsible,
  };
}

function isHiddenJobSummaryLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return false;

  const separatorIndex = trimmed.search(/[:：]/);
  if (separatorIndex < 0) return false;

  const label = trimmed.slice(0, separatorIndex).trim();
  const normalizedLabel = label.replace(/[\s_-]/g, "").toLowerCase();
  return (
    HIDDEN_JOB_SUMMARY_LABELS.has(label) ||
    HIDDEN_JOB_SUMMARY_KEYS.has(label.toLowerCase()) ||
    HIDDEN_JOB_SUMMARY_KEYS.has(normalizedLabel)
  );
}

export function profileSkillList(profile: Pick<
  Profile,
  "languages" | "frameworks" | "db" | "cloud" | "otherSkills"
>) {
  return [
    ...splitCsv(profile.languages),
    ...splitCsv(profile.frameworks),
    ...splitCsv(profile.db),
    ...splitCsv(profile.cloud),
    ...splitCsv(profile.otherSkills),
  ];
}

export function categorizeSkills(skills: string[]) {
  const result = {
    languages: [] as string[],
    db: [] as string[],
    frameworks: [] as string[],
    cloud: [] as string[],
    other: [] as string[],
  };
  const languageSkillOptions = [
    "Java",
    "TypeScript",
    "JavaScript",
    "Python",
    "PHP",
    "Ruby",
    "Go",
    "C#",
    "Kotlin",
    "Swift",
  ];
  const dbSkillOptions = [
    "PostgreSQL",
    "MySQL",
    "Oracle",
    "SQL Server",
    "MongoDB",
    "Redis",
    "DynamoDB",
  ];
  const frameworkSkillOptions = [
    "Spring Boot",
    "React",
    "Vue.js",
    "Nuxt.js",
    "Next.js",
    "Laravel",
    "Ruby on Rails",
    "Django",
    "Express",
  ];
  const cloudSkillOptions = [
    "AWS",
    "GCP",
    "Azure",
    "Firebase",
    "Cloudflare",
    "Vercel",
    "Heroku",
  ];

  skills.forEach((skill) => {
    if (languageSkillOptions.includes(skill)) result.languages.push(skill);
    else if (dbSkillOptions.includes(skill)) result.db.push(skill);
    else if (frameworkSkillOptions.includes(skill))
      result.frameworks.push(skill);
    else if (cloudSkillOptions.includes(skill)) result.cloud.push(skill);
    else result.other.push(skill);
  });
  return result;
}

export function maskName(name: string) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "匿名";
  return `${parts.map((part) => part[0]).join(".")}.`;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function nowLabel() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatJstDateTime(value = "") {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const fallback = trimmed.replace("T", " ").slice(0, 16);
  if (!/(?:Z|[+-]\d\d:\d\d)$/.test(trimmed)) return fallback;

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return fallback;

  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(jst.getUTCDate())} ${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`;
}

export function toApiDateTime(value: string) {
  const normalized = value.trim().replace(" ", "T");
  if (!normalized) return "";
  if (/Z$|[+-]\d\d:\d\d$/.test(normalized)) return normalized;
  return normalized.length === 16
    ? `${normalized}:00+09:00`
    : `${normalized}+09:00`;
}

export function normalizeMeetingCandidateKey(value = "") {
  return formatJstDateTime(toApiDateTime(value));
}

export function uniqueMeetingCandidates(values: string[]) {
  const seen = new Set<string>();
  return values.map((value) => value.trim()).filter((value) => {
    const key = normalizeMeetingCandidateKey(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function filterNewMeetingCandidates(
  candidates: string[],
  existingCandidates: string[],
) {
  const existingKeys = new Set(
    existingCandidates.map(normalizeMeetingCandidateKey).filter(Boolean),
  );
  return uniqueMeetingCandidates(candidates).filter(
    (candidate) => !existingKeys.has(normalizeMeetingCandidateKey(candidate)),
  );
}

export function uid(prefix: string) {
  const random =
    globalThis.crypto?.randomUUID?.().slice(0, 8) ||
    Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}
