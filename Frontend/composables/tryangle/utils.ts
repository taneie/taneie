import type { Freelancer, Profile } from "./types";

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function availabilityClass(value = "") {
  if (value === "即稼働可") return "ready";
  if (value.includes("空き予定")) return "soon";
  return "pause";
}

export function streamTone(value = "") {
  if (value === "エンド直") return "teal";
  if (value === "1次請け") return "blue";
  return "amber";
}

export function availabilityRank(freelancer: Freelancer) {
  if (freelancer.availability === "即稼働可") return 3;
  if (freelancer.availability.includes("空き予定")) return 2;
  return 1;
}

export function splitCsv(value: string | number | null | undefined) {
  return String(value || "")
    .split(/[,、\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
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

export function toApiDateTime(value: string) {
  const normalized = value.trim().replace(" ", "T");
  if (/Z$|[+-]\d\d:\d\d$/.test(normalized)) return normalized;
  return normalized.length === 16
    ? `${normalized}:00+09:00`
    : `${normalized}+09:00`;
}

export function uid(prefix: string) {
  const random =
    globalThis.crypto?.randomUUID?.().slice(0, 8) ||
    Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}
