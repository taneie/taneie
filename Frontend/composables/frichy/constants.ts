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
export const remoteOptions = ["フルリモート", "一部リモート", "常駐"];
export const availabilityOptions = [
  "即稼働可",
  "稼働可能開始日",
  "営業停止中",
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
  "JavaScript",
  "Java",
  "Python",
  "SQL",
  "PHP",
  "TypeScript",
  "C#",
  "Go",
  "PowerShell",
  "Perl",
];
export const dbSkillOptions = [
  "MySQL",
  "Oracle",
  "PostgreSQL",
  "SQL Server",
  "PL/SQL",
  "MongoDB",
  "DynamoDB",
  "BigQuery",
  "Firebase",
  "SQLServer",
];
export const frameworkSkillOptions = [
  "Spring Boot",
  "React",
  "Laravel",
  "Vue.js",
  "Next.js",
  "Angular",
  "Node.js",
  "FastAPI",
  "Spring",
  "jQuery",
];
export const osSkillOptions = [
  "Linux",
  "Windows",
  "Windows Server",
  "Android",
  "iOS",
  "Windows 10",
  "CentOS",
  "Windows 11",
  "Solaris",
  "macOS",
];
export const industrySkillOptions = [
  "金融",
  "IT・ソフトウェア開発",
  "ゲーム",
  "通信",
  "製造業",
  "IT・SaaS",
  "医療",
  "情報通信業",
  "IT・情報通信",
];
