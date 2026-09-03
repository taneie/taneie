import type { Profile, FrichyState } from "./types";

export function createSeedState(): FrichyState {
  const recentApplicationDate = dateFromNow({ months: -1 });
  const expiredApplicationDate = dateFromNow({ months: -4 });
  const hiddenAt = dateFromNow(0);
  const meetingCandidateA = dateTimeFromNow({ years: 3 }, "10:00");
  const meetingCandidateB = dateTimeFromNow({ years: 3, days: 1 }, "15:00");
  const initialMeetingCompletedAt = dateTimeFromNow({ days: -7 }, "11:00");

  return {
    auth: null,
    authMode: "login",
    accounts: [],
    activeView: "dashboard",
    wizardStep: 1,
    selectedFreelancerId: "fr-current",
    previewFreelancerId: "",
    profile: blankProfile("fr-current"),
    freelancers: [
      {
        id: "fr-001",
        name: "山田 太郎",
        role: "バックエンドエンジニア",
        skills: ["Java", "TypeScript", "Spring Boot", "React", "PostgreSQL"],
        yearsExperience: 6,
        desiredRate: 85,
        workRate: "週5",
        remote: "フルリモート",
        availability: "稼働可能開始日",
        lastUpdated: "2026-06-04",
        resumeId: "resume-demo-yamada",
        resumeName: "職務経歴書_山田太郎.pdf",
        initialMeetingCompleted: true,
        initialMeetingCompletedAt,
      },
      {
        id: "fr-002",
        name: "佐藤 美咲",
        role: "フロントエンドエンジニア",
        skills: ["React", "Vue", "TypeScript", "Figma"],
        yearsExperience: 4,
        desiredRate: 78,
        workRate: "週4",
        remote: "フルリモート",
        availability: "即稼働可",
        lastUpdated: "2026-06-03",
        resumeId: "resume-demo-sato",
        resumeName: "skill_sheet_sato.docx",
      },
      {
        id: "fr-003",
        name: "鈴木 健",
        role: "インフラ・SRE",
        skills: ["AWS", "Terraform", "Kubernetes", "Go"],
        yearsExperience: 8,
        desiredRate: 92,
        workRate: "週5",
        remote: "一部リモート",
        availability: "即稼働可",
        lastUpdated: "2026-05-12",
        resumeId: "resume-demo-suzuki",
        resumeName: "resume_suzuki.pdf",
      },
    ],
    jobs: [
      {
        id: "job-001",
        title: "金融SaaSのバックエンド刷新",
        client: "FinTech事業会社",
        summary:
          "Java/Spring Bootで既存決済基盤を刷新。設計から実装、テストまで担当。",
        required: ["Java", "Spring Boot", "PostgreSQL", "API設計"],
        nice: ["AWS", "React"],
        rateMin: 80,
        rateMax: 100,
        unitPrice: "80〜100万円",
        settlementLower: "",
        settlementUpper: "",
        location: "",
        startPeriod: "",
        remoteRatio: "一部リモート",
        foreignerAvailability: "",
        ageLimit: "",
        receivedAt: null,
        receivedAtMs: null,
        remote: "一部リモート",
        sortFlag: true,
        active: true,
      },
      {
        id: "job-002",
        title: "人材マッチングサービスのフロント開発",
        client: "HRTechスタートアップ",
        summary:
          "React/TypeScriptで候補者・営業向け画面を改善。UI実装と状態管理が中心。",
        required: ["React", "TypeScript", "CSS"],
        nice: ["Next.js", "Figma"],
        rateMin: 70,
        rateMax: 90,
        unitPrice: "70〜90万円",
        settlementLower: "",
        settlementUpper: "",
        location: "",
        startPeriod: "",
        remoteRatio: "フルリモート",
        foreignerAvailability: "",
        ageLimit: "",
        receivedAt: null,
        receivedAtMs: null,
        remote: "フルリモート",
        sortFlag: true,
        active: false,
      },
      {
        id: "job-003",
        title: "製造業向けクラウド基盤構築",
        client: "大手SIer",
        summary:
          "AWS/Terraformで新規クラウド環境を設計。監視、権限、CI/CD整備を含む。",
        required: ["AWS", "Terraform", "Linux"],
        nice: ["Kubernetes", "Go"],
        rateMin: 75,
        rateMax: 95,
        unitPrice: "75〜95万円",
        settlementLower: "",
        settlementUpper: "",
        location: "",
        startPeriod: "",
        remoteRatio: "一部リモート",
        foreignerAvailability: "",
        ageLimit: "",
        receivedAt: null,
        receivedAtMs: null,
        remote: "一部リモート",
        sortFlag: false,
        active: true,
      },
    ],
    applications: [
      {
        id: "app-001",
        jobId: "job-001",
        freelancerId: "fr-001",
        status: "面談待ち",
        appliedAt: recentApplicationDate,
        isHiddenByExpiration: false,
        hiddenAt: "",
        hiddenReason: "",
      },
      {
        id: "app-002",
        jobId: "job-002",
        freelancerId: "fr-001",
        status: "選考中",
        appliedAt: expiredApplicationDate,
        isHiddenByExpiration: true,
        hiddenAt,
        hiddenReason: "掲載から3か月経過したため閲覧できません。",
      },
    ],
    messages: [
      {
        id: "msg-001",
        freelancerId: "fr-001",
        from: "営業",
        to: "山田 太郎",
        body: "金融SaaS案件について、初回面談候補を確認しました。",
        at: "2026-06-04 11:20",
        readAt: "2026-06-04 11:20",
        channel: "sales",
      },
      {
        id: "msg-002",
        freelancerId: "fr-001",
        from: "山田 太郎",
        to: "営業",
        body: "3年後の面談候補日午前で調整可能です。職務経歴書も更新しました。",
        at: "2026-06-04 11:36",
        readAt: "2026-06-04 11:36",
        channel: "freelancer",
      },
    ],
    meetingRequests: [
      {
        id: "meet-001",
        freelancerId: "fr-001",
        applicationId: "app-001",
        jobId: "job-001",
        candidate: meetingCandidateA,
        status: "候補",
      },
      {
        id: "meet-002",
        freelancerId: "fr-001",
        applicationId: "app-001",
        jobId: "job-001",
        candidate: meetingCandidateB,
        status: "候補",
      },
    ],
    contactInquiries: [],
    aliveChecks: [],
  };
}

function dateFromNow(
  offset: number | { months?: number; days?: number },
) {
  const date = new Date();
  if (typeof offset === "number") {
    date.setDate(date.getDate() + offset);
  } else {
    const day = date.getDate();
    date.setDate(1);
    date.setMonth(date.getMonth() + (offset.months || 0));
    const lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();
    date.setDate(Math.min(day, lastDay));
    date.setDate(date.getDate() + (offset.days || 0));
  }
  return formatDate(date);
}

function dateTimeFromNow(
  offset: { years?: number; days?: number },
  time: string,
) {
  const date = new Date();
  date.setFullYear(date.getFullYear() + (offset.years || 0));
  date.setDate(date.getDate() + (offset.days || 0));
  return `${formatDate(date)} ${time}`;
}

function formatDate(date: Date) {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join("-");
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

export function blankProfile(id = "fr-current"): Profile {
  return {
    id,
    name: "",
    nameKana: "",
    email: "",
    phone: "",
    role: "",
    languages: "",
    db: "",
    frameworks: "",
    operatingSystems: "",
    industries: "",
    otherSkills: "",
    years: "",
    skillExperiences: {},
    desiredRate: "",
    startDate: "",
    workRate: "",
    remote: "",
    availability: "",
    resumeId: "",
    resumeName: "",
    resumeType: "",
    resumeSize: "",
    meetingCandidates: [],
    pledgeAccepted: false,
    pledgedAt: "",
    initialMeetingCompleted: false,
    initialMeetingCompletedAt: "",
    lastUpdated: "",
  };
}
