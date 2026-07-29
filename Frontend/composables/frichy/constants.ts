import type { Account, ApplicationStatus, NavItem, Role, ViewKey } from "./types";

export const STORAGE_KEY = "frichy-state-v1";
export const TOKEN_KEY = "frichy-token";
export const API_BASE_FALLBACK = "http://127.0.0.1:8787/api";
export const JOB_PAGE_SIZE = 10;
export const JOB_APPLICATION_LIMIT = 5;

export const navItems: NavItem[] = [
  {
    view: "dashboard",
    icon: "chart",
    label: "ダッシュボード",
    roles: ["sales"],
  },
  {
    view: "profile",
    icon: "user",
    label: "プロフィール",
    roles: ["freelancer"],
  },
  {
    view: "jobs",
    icon: "search",
    label: "案件検索",
    roles: ["freelancer", "sales"],
  },
  { view: "admin", icon: "briefcase", label: "営業管理", roles: ["sales"] },
  { view: "scout", icon: "send", label: "スカウト", roles: ["sales"] },
  {
    view: "meeting",
    icon: "calendar",
    label: "面談・チャット",
    roles: ["freelancer", "sales"],
  },
  {
    view: "sheet",
    icon: "shield",
    label: "匿名スキルシート",
    roles: ["freelancer"],
  },
  {
    view: "contact",
    icon: "send",
    label: "問い合わせ",
    roles: ["freelancer", "sales"],
  },
];

export const demoAccounts: Account[] = [
  {
    email: "freelancer@example.com",
    password: "freelance123",
    role: "freelancer",
    name: "山田 太郎",
    startView: "jobs",
    freelancerId: "fr-current",
  },
  {
    email: "sales@frichy.jp",
    password: "sales123",
    role: "sales",
    name: "営業",
    startView: "dashboard",
  },
];

export const defaultViewByRole: Record<Role, ViewKey> = {
  freelancer: "jobs",
  sales: "dashboard",
};

export const statuses: ApplicationStatus[] = [
  "選考中",
  "面談待ち",
  "成約",
  "見送り",
];
export const flowOptions = ["エンド直", "1次請け", "2次請け", "その他"];
export const remoteOptions = ["フルリモート", "一部リモート", "常駐"];
export const availabilityOptions = [
  "即稼働可",
  "2026年7月から空き予定",
  "現在は案件停止中",
];
export const roleTitleOptions = [
  "フロントエンドエンジニア",
  "バックエンドエンジニア",
  "フルスタックエンジニア",
  "モバイルエンジニア",
  "インフラ・SRE",
  "クラウドエンジニア",
  "DevOpsエンジニア",
  "データエンジニア",
  "機械学習エンジニア",
  "QAエンジニア",
  "セキュリティエンジニア",
  "組み込みエンジニア",
  "テックリード",
  "PM/PL",
];
export const languageSkillOptions = [
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
export const dbSkillOptions = [
  "PostgreSQL",
  "MySQL",
  "Oracle",
  "SQL Server",
  "MongoDB",
  "Redis",
  "DynamoDB",
];
export const frameworkSkillOptions = [
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
export const cloudSkillOptions = [
  "AWS",
  "GCP",
  "Azure",
  "Firebase",
  "Cloudflare",
  "Vercel",
  "Heroku",
];
