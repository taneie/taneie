import { computed, ref } from "vue";

export type Role = "freelancer" | "sales";
export type ViewKey =
  | "dashboard"
  | "profile"
  | "jobs"
  | "admin"
  | "scout"
  | "meeting"
  | "sheet"
  | "contact";
export type AuthMode = "login" | "register";
export type ApplicationStatus = "選考中" | "面談待ち" | "成約" | "見送り";
export type IconName =
  | "briefcase"
  | "user"
  | "search"
  | "chart"
  | "send"
  | "calendar"
  | "shield"
  | "plus"
  | "print";

export interface NavItem {
  view: ViewKey;
  icon: IconName;
  label: string;
  roles: Role[];
}

export interface Account {
  email: string;
  password: string;
  role: Role;
  name: string;
  startView: ViewKey;
  freelancerId?: string;
}

export interface AuthUser {
  email: string;
  role: Role;
  name: string;
  freelancerId?: string;
  loggedInAt: string;
}

export interface Profile {
  id: string;
  name: string;
  nameKana: string;
  email: string;
  phone: string;
  role: string;
  languages: string;
  db: string;
  frameworks: string;
  cloud: string;
  otherSkills: string;
  years: string;
  desiredRate: string;
  startDate: string;
  workRate: string;
  remote: string;
  availability: string;
  resumeName: string;
  resumeType: string;
  resumeSize: string;
  meetingCandidates: string[];
  pledgeAccepted: boolean;
  pledgedAt: string;
  lastUpdated: string;
}

export interface Freelancer {
  id: string;
  name: string;
  role: string;
  skills: string[];
  desiredRate: number;
  workRate: string;
  remote: string;
  availability: string;
  lastUpdated: string;
  resumeName: string;
  pledgedAt?: string;
}

export interface Job {
  id: string;
  title: string;
  client: string;
  summary: string;
  required: string[];
  nice: string[];
  rateMin: number;
  rateMax: number;
  marginRate: number;
  stream: string;
  remote: string;
  sortFlag: boolean;
  active: boolean;
}

export interface Application {
  id: string;
  jobId: string;
  freelancerId: string;
  status: ApplicationStatus;
  appliedAt: string;
}

export interface Message {
  id: string;
  freelancerId: string;
  from: string;
  to: string;
  body: string;
  at: string;
  readAt?: string;
  channel: "sales" | "freelancer";
}

export interface MeetingRequest {
  id: string;
  freelancerId: string;
  candidate: string;
  status: "候補" | "確定" | "再調整";
}

export interface ContactInquiry {
  id: string;
  inquiryType: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
  answerBody: string;
  answeredAt: string;
  answererName: string;
}

export interface AliveCheck {
  id: string;
  count: number;
  at: string;
}

export interface TryangleState {
  auth: AuthUser | null;
  authMode: AuthMode;
  accounts: Account[];
  activeView: ViewKey;
  wizardStep: number;
  selectedFreelancerId: string;
  previewFreelancerId: string;
  profile: Profile;
  freelancers: Freelancer[];
  jobs: Job[];
  applications: Application[];
  messages: Message[];
  meetingRequests: MeetingRequest[];
  contactInquiries: ContactInquiry[];
  aliveChecks: AliveCheck[];
}

export interface JobFilters {
  keyword: string;
  skill: string;
  rate: string;
  remote: string;
  stream: string;
}

export interface JobListResponse {
  items: Job[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface JobPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ScoutFilters {
  skill: string;
  availability: string;
  remote: string;
}

export interface RegisterInput {
  email: string;
  role?: string;
  password: string;
  passwordConfirm: string;
}

export interface ProfileTermsInput {
  desiredRate: string;
  startDate: string;
  workRate: string;
  remote: string;
  availability: string;
  resume?: File | null;
}

export interface JobInput {
  title: string;
  client: string;
  summary: string;
  required: string;
  nice: string;
  rateMin: string | number;
  rateMax: string | number;
  marginRate: string | number;
  stream: string;
  remote: string;
  sortFlag: boolean;
}

export interface ContactInquiryInput {
  inquiryType: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  body: string;
}

type ApiRequestOptions = RequestInit & {
  silent?: boolean;
};

const STORAGE_KEY = "tryangle-freelance-state-v1";
const TOKEN_KEY = "tryangle-freelance-token";
const API_BASE_FALLBACK = "http://127.0.0.1:8787/api";

function getApiBase() {
  const runtimeConfig = useRuntimeConfig();

  return String(runtimeConfig.public.apiBase || API_BASE_FALLBACK).replace(/\/$/, "");
}

const navItems: NavItem[] = [
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
  { view: "jobs", icon: "search", label: "案件検索", roles: ["freelancer"] },
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

const demoAccounts: Account[] = [
  {
    email: "freelancer@example.com",
    password: "freelance123",
    role: "freelancer",
    name: "山田 太郎",
    startView: "jobs",
    freelancerId: "fr-current",
  },
  {
    email: "sales@tryangle.jp",
    password: "sales123",
    role: "sales",
    name: "TRYANGLE 営業",
    startView: "dashboard",
  },
];

const defaultViewByRole: Record<Role, ViewKey> = {
  freelancer: "jobs",
  sales: "dashboard",
};

const statuses: ApplicationStatus[] = ["選考中", "面談待ち", "成約", "見送り"];
const flowOptions = ["エンド直", "1次請け", "2次請け", "その他"];
const remoteOptions = ["フルリモート", "一部リモート", "常駐"];
const availabilityOptions = [
  "即稼働可",
  "2026年7月から空き予定",
  "現在は案件停止中",
];
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

const state = ref<TryangleState>(createSeedState());
const JOB_PAGE_SIZE = 10;

const filters = ref<JobFilters>({
  keyword: "",
  skill: "",
  rate: "",
  remote: "",
  stream: "",
});
const jobPagination = ref<JobPagination>({
  total: 0,
  limit: JOB_PAGE_SIZE,
  offset: 0,
  hasMore: false,
});
const jobsLoading = ref(false);
const scoutFilters = ref<ScoutFilters>({
  skill: "",
  availability: "",
  remote: "",
});
const hasUnsavedChanges = ref(false);
const toastMessage = ref("");
const toastVisible = ref(false);
const unsavedConfirmVisible = ref(false);
const loadingCount = ref(0);
const loadingVisible = ref(false);
const chatBannerVisible = ref(false);
const chatBannerTitle = ref("");
const chatBannerBody = ref("");
const chatBannerFreelancerId = ref("");
const initialized = ref(false);
let accessToken = "";
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let chatBannerTimer: ReturnType<typeof setTimeout> | undefined;
let chatPollingTimer: ReturnType<typeof setInterval> | undefined;
let loadingShowTimer: ReturnType<typeof setTimeout> | undefined;
let loadingHideTimer: ReturnType<typeof setTimeout> | undefined;
let loadingShownAt = 0;
let knownMessageIds = new Set<string>();
let pushRegistrationStarted = false;
let unsavedConfirmResolver: ((value: boolean) => void) | undefined;

const isLoading = computed(() => loadingVisible.value);

function beginLoading() {
  loadingCount.value += 1;
  if (loadingHideTimer) clearTimeout(loadingHideTimer);
  if (!loadingVisible.value && !loadingShowTimer) {
    loadingShowTimer = setTimeout(() => {
      if (loadingCount.value <= 0) return;
      loadingVisible.value = true;
      loadingShownAt = Date.now();
      loadingShowTimer = undefined;
    }, 120);
  }
  let finished = false;

  return () => {
    if (finished) return;
    finished = true;
    loadingCount.value = Math.max(0, loadingCount.value - 1);
    if (loadingCount.value > 0) return;
    if (loadingShowTimer) {
      clearTimeout(loadingShowTimer);
      loadingShowTimer = undefined;
    }
    if (!loadingVisible.value) return;
    const remaining = Math.max(0, 260 - (Date.now() - loadingShownAt));
    loadingHideTimer = setTimeout(() => {
      if (loadingCount.value === 0) loadingVisible.value = false;
      loadingHideTimer = undefined;
    }, remaining);
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function scrollToPageTop() {
  if (!import.meta.client) return;
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createSeedState(): TryangleState {
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
        desiredRate: 85,
        workRate: "週5",
        remote: "フルリモート",
        availability: "2026年7月から空き予定",
        lastUpdated: "2026-06-04",
        resumeName: "職務経歴書_山田太郎.pdf",
      },
      {
        id: "fr-002",
        name: "佐藤 美咲",
        role: "フロントエンドエンジニア",
        skills: ["React", "Vue", "TypeScript", "Figma"],
        desiredRate: 78,
        workRate: "週4",
        remote: "フルリモート",
        availability: "即稼働可",
        lastUpdated: "2026-06-03",
        resumeName: "skill_sheet_sato.docx",
      },
      {
        id: "fr-003",
        name: "鈴木 健",
        role: "インフラ・SRE",
        skills: ["AWS", "Terraform", "Kubernetes", "Go"],
        desiredRate: 92,
        workRate: "週5",
        remote: "一部リモート",
        availability: "即稼働可",
        lastUpdated: "2026-05-12",
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
        marginRate: 12,
        stream: "エンド直",
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
        marginRate: 10,
        stream: "1次請け",
        remote: "フルリモート",
        sortFlag: true,
        active: true,
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
        marginRate: 15,
        stream: "2次請け",
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
        appliedAt: "2026-06-04",
      },
      {
        id: "app-002",
        jobId: "job-002",
        freelancerId: "fr-002",
        status: "選考中",
        appliedAt: "2026-06-03",
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
        channel: "sales",
      },
      {
        id: "msg-002",
        freelancerId: "fr-001",
        from: "山田 太郎",
        to: "営業",
        body: "6月10日午前で調整可能です。職務経歴書も更新しました。",
        at: "2026-06-04 11:36",
        channel: "freelancer",
      },
    ],
    meetingRequests: [
      {
        id: "meet-001",
        freelancerId: "fr-001",
        candidate: "2026-06-10 10:00",
        status: "候補",
      },
      {
        id: "meet-002",
        freelancerId: "fr-001",
        candidate: "2026-06-11 15:00",
        status: "候補",
      },
    ],
    contactInquiries: [],
    aliveChecks: [],
  };
}

function blankProfile(id = "fr-current"): Profile {
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
    cloud: "",
    otherSkills: "",
    years: "",
    desiredRate: "",
    startDate: "",
    workRate: "",
    remote: "",
    availability: "",
    resumeName: "",
    resumeType: "",
    resumeSize: "",
    meetingCandidates: [],
    pledgeAccepted: false,
    pledgedAt: "",
    lastUpdated: "",
  };
}

function init() {
  if (initialized.value || !import.meta.client) return;

  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "null",
    ) as Partial<TryangleState> | null;
    state.value = saved
      ? normalizeLoadedState(mergeState(createSeedState(), saved))
      : createSeedState();
    accessToken = localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    state.value = createSeedState();
  }

  syncProfileToFreelancer();
  ensureActiveView();
  initialized.value = true;
  if (accessToken) void restoreSession();
}

function mergeState(
  base: TryangleState,
  saved: Partial<TryangleState>,
): TryangleState {
  return {
    ...clone(base),
    ...saved,
    profile: { ...base.profile, ...(saved.profile || {}) },
    accounts: saved.accounts || base.accounts,
    freelancers: saved.freelancers || base.freelancers,
    jobs: saved.jobs || base.jobs,
    applications: saved.applications || base.applications,
    messages: saved.messages
      ? normalizeMessages(saved.messages, base)
      : base.messages,
    meetingRequests: saved.meetingRequests || base.meetingRequests,
    contactInquiries: saved.contactInquiries || base.contactInquiries,
    aliveChecks: saved.aliveChecks || base.aliveChecks,
    previewFreelancerId: saved.previewFreelancerId || "",
  };
}

function normalizeLoadedState(loadedState: TryangleState): TryangleState {
  if (isLegacySampleProfile(loadedState.profile)) {
    loadedState.profile = blankProfile("fr-current");
    loadedState.selectedFreelancerId = "fr-current";
    loadedState.wizardStep = 1;
  }
  return loadedState;
}

function isLegacySampleProfile(profile: Profile) {
  return (
    profile?.id === "fr-001" &&
    profile?.name === "山田 太郎" &&
    profile?.email === "taro@example.com" &&
    profile?.languages === "Java, TypeScript, Python"
  );
}

function normalizeMessages(
  messages: Message[],
  base: TryangleState,
): Message[] {
  return messages.map((message) => ({
    ...message,
    freelancerId:
      message.freelancerId || inferMessageFreelancerId(message, base),
  }));
}

function inferMessageFreelancerId(message: Message, base: TryangleState) {
  const names = [message.from, message.to];
  const matchedFreelancer = base.freelancers.find((freelancer) =>
    names.includes(freelancer.name),
  );
  if (matchedFreelancer) return matchedFreelancer.id;

  const profileName = base.profile.name;
  if (profileName && names.includes(profileName)) return base.profile.id;

  return message.channel === "freelancer"
    ? base.profile.id
    : base.freelancers[0]?.id || base.profile.id;
}

function persist() {
  if (!import.meta.client) return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      auth: state.value.auth,
      activeView: state.value.activeView,
      wizardStep: state.value.wizardStep,
      selectedFreelancerId: state.value.selectedFreelancerId,
      previewFreelancerId: state.value.previewFreelancerId,
    }),
  );
}

async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { silent = false, ...requestOptions } = options;
  const finishLoading = silent ? undefined : beginLoading();
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  try {
    const response = await fetch(`${getApiBase()}${path}`, {
      ...requestOptions,
      headers,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.error?.message || "API通信に失敗しました。");
    }
    return data as T;
  } finally {
    finishLoading?.();
  }
}

function setAuth(
  token: string,
  user: { email: string; role: Role; name: string; freelancerId?: string },
) {
  accessToken = token;
  localStorage.setItem(TOKEN_KEY, token);
  state.value.auth = {
    email: user.email,
    role: user.role,
    name: user.name,
    freelancerId: user.freelancerId,
    loggedInAt: nowLabel(),
  };
  state.value.activeView = defaultViewByRole[user.role];
  persist();
}

async function restoreSession() {
  try {
    const user = await apiRequest<{
      email: string;
      role: Role;
      name: string;
      freelancerId?: string;
    }>("/auth/me");
    state.value.auth = { ...user, loggedInAt: nowLabel() };
    ensureActiveView();
    await loadWorkspace();
    startChatPolling();
  } catch {
    accessToken = "";
    localStorage.removeItem(TOKEN_KEY);
    state.value.auth = null;
    stopChatPolling();
    persist();
  }
}

async function loadWorkspace() {
  if (!state.value.auth) return;
  const [applications, meetings, messages] = await Promise.all([
    apiRequest<Application[]>("/applications"),
    apiRequest<MeetingRequest[]>("/meeting-requests"),
    apiRequest<Message[]>("/messages"),
  ]);

  state.value.applications = applications;
  state.value.meetingRequests = meetings;
  state.value.messages = messages;
  knownMessageIds = new Set(messages.map((message) => message.id));

  if (state.value.auth.role === "sales") {
    const [jobs, freelancers, contactInquiries] = await Promise.all([
      apiRequest<Job[]>("/jobs").catch(() => []),
      apiRequest<Freelancer[]>("/freelancers"),
      apiRequest<ContactInquiry[]>("/contact-inquiries").catch(() => []),
    ]);

    state.value.jobs = jobs;
    jobPagination.value = {
      total: jobs.length,
      limit: jobs.length || JOB_PAGE_SIZE,
      offset: 0,
      hasMore: false,
    };
    state.value.freelancers = freelancers;
    state.value.contactInquiries = contactInquiries;
  } else {
    const [profile, contactInquiries] = await Promise.all([
      apiRequest<
        Freelancer & {
          email?: string;
          phone?: string;
          yearsExperience?: number;
          startDate?: string;
        }
      >("/profile/me"),
      apiRequest<ContactInquiry[]>("/contact-inquiries").catch(() => []),
    ]);

    state.value.profile = {
      ...freelancerToProfile(profile),
      meetingCandidates: meetingCandidatesForProfile(profile.id),
    };
    state.value.freelancers = [profile];
    state.value.contactInquiries = contactInquiries;
    await fetchJobsPage({ reset: true });
  }

  ensureChatSelection();
  if (state.value.activeView === "meeting") void markActiveChatAsRead();
  persist();
}


async function refreshMessagesWithNotification() {
  if (!state.value.auth || !accessToken) return;
  try {
    const messages = await apiRequest<Message[]>("/messages", {
      silent: true,
    });
    const incoming = messages.filter(
      (message) =>
        !knownMessageIds.has(message.id) && isIncomingMessage(message),
    );
    state.value.messages = messages;
    knownMessageIds = new Set(messages.map((message) => message.id));
    if (incoming.length) showChatBanner(incoming.at(-1)!);
    if (incoming.length && state.value.activeView === "meeting") {
      void markActiveChatAsRead();
    }
  } catch {
    stopChatPolling();
  }
}

function startChatPolling() {
  if (!import.meta.client || chatPollingTimer) return;
  void refreshMessagesWithNotification();
  chatPollingTimer = setInterval(() => {
    void refreshMessagesWithNotification();
  }, 10000);
}

function stopChatPolling() {
  if (!chatPollingTimer) return;
  clearInterval(chatPollingTimer);
  chatPollingTimer = undefined;
}

function isIncomingMessage(message: Message) {
  return currentRole.value === "sales"
    ? message.channel === "freelancer"
    : message.channel === "sales";
}

function showChatBanner(message: Message) {
  const freelancer =
    getFreelancer(message.freelancerId || "") || selectedFreelancer.value;
  chatBannerTitle.value = `${message.from || "相手"}さんから新着メッセージ`;
  chatBannerBody.value = message.body;
  chatBannerFreelancerId.value = message.freelancerId || freelancer?.id || "";
  chatBannerVisible.value = true;

  if (chatBannerTimer) clearTimeout(chatBannerTimer);
  chatBannerTimer = setTimeout(() => {
    chatBannerVisible.value = false;
  }, 7000);

  showBrowserChatNotification(message);
}

function openChatBanner() {
  if (chatBannerFreelancerId.value && currentRole.value === "sales") {
    selectChatFreelancer(chatBannerFreelancerId.value);
  } else {
    void setView("meeting");
  }
  chatBannerVisible.value = false;
}

function dismissChatBanner() {
  chatBannerVisible.value = false;
}

async function requestBrowserNotificationPermission() {
  if (!import.meta.client || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission().catch(() => undefined);
  }
  if (Notification.permission === "granted") {
    await registerPushSubscription();
  }
}

function showBrowserChatNotification(message: Message) {
  if (
    !import.meta.client ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  )
    return;
  const notification = new Notification("TRYANGLE FREELANCE", {
    body: `${message.from || "相手"}: ${message.body}`,
    tag: `tryangle-chat-${message.id}`,
  });
  notification.onclick = () => {
    window.focus();
    openChatBanner();
    notification.close();
  };
}

async function registerPushSubscription() {
  if (
    pushRegistrationStarted ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  )
    return;
  pushRegistrationStarted = true;
  try {
    const { publicKey } = await apiRequest<{ publicKey: string }>(
      "/push/public-key",
      { silent: true },
    );
    if (!publicKey) return;
    const registration = await navigator.serviceWorker.register("/push-sw.js");
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));
    await apiRequest("/push/subscriptions", {
      method: "POST",
      body: JSON.stringify(subscription.toJSON()),
      silent: true,
    });
  } catch {
    pushRegistrationStarted = false;
  }
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function freelancerToProfile(
  freelancer: Freelancer & {
    nameKana?: string;
    email?: string;
    phone?: string | null;
    yearsExperience?: number;
    startDate?: string;
    pledgedAt?: string;
  },
): Profile {
  const categorizedSkills = categorizeSkills(freelancer.skills || []);
  return {
    ...blankProfile(freelancer.id),
    name: freelancer.name || "",
    nameKana: freelancer.nameKana || "",
    email: freelancer.email || state.value.auth?.email || "",
    phone: freelancer.phone || "",
    role: freelancer.role || "",
    languages: categorizedSkills.languages.join(", "),
    db: categorizedSkills.db.join(", "),
    frameworks: categorizedSkills.frameworks.join(", "),
    cloud: categorizedSkills.cloud.join(", "),
    otherSkills: categorizedSkills.other.join(", "),
    years: freelancer.yearsExperience ? String(freelancer.yearsExperience) : "",
    desiredRate: freelancer.desiredRate ? String(freelancer.desiredRate) : "",
    startDate: freelancer.startDate || "",
    workRate: freelancer.workRate || "",
    remote: freelancer.remote,
    availability: freelancer.availability || "",
    resumeName: freelancer.resumeName || "",
    pledgeAccepted: Boolean(freelancer.pledgedAt),
    pledgedAt: freelancer.pledgedAt || "",
    lastUpdated: freelancer.lastUpdated || "",
  };
}

function profileToApi(profile: Profile) {
  return {
    name: profile.name,
    nameKana: profile.nameKana,
    phone: profile.phone,
    roleTitle: profile.role,
    yearsExperience: Number(profile.years || 0),
    desiredRate: Number(profile.desiredRate || 0),
    startDate: profile.startDate || undefined,
    workRate: profile.workRate,
    remoteType: profile.remote,
    availabilityStatus: profile.availability,
    availabilityNote: profile.availability,
    pledgeAccepted:
      profile.pledgeAccepted || Boolean(profile.pledgedAt) || undefined,
    skills: profileSkillList(profile),
  };
}

const authAccounts = computed(() => [
  ...demoAccounts,
  ...(state.value.accounts || []),
]);
const currentUser = computed(() => state.value.auth);
const currentRole = computed<Role | null>(
  () => currentUser.value?.role || null,
);
const availableNavItems = computed(() => {
  const role = currentRole.value;
  return role ? navItems.filter((item) => item.roles.includes(role)) : [];
});

const filteredJobs = computed(() => {
  if (currentRole.value === "freelancer" && !canViewJobs.value) return [];
  return state.value.jobs;
});

const profileRequirementItems = computed(() => {
  const p = state.value.profile;
  return [
    {
      label: "基本情報",
      done: Boolean(p.name && p.email && p.phone && p.role),
    },
    {
      label: "スキル詳細",
      done: Boolean(p.languages && p.db && p.frameworks && p.years),
    },
    {
      label: "稼働条件",
      done: Boolean(
        p.desiredRate &&
          p.startDate &&
          p.workRate &&
          p.remote &&
          p.availability,
      ),
    },
    { label: "レジュメ", done: Boolean(p.resumeName) },
    {
      label: "面談候補",
      done:
        state.value.meetingRequests.some(
          (meeting) => meeting.freelancerId === p.id,
        ) || Boolean(p.meetingCandidates.length),
    },
    { label: "誓約同意", done: Boolean(p.pledgeAccepted || p.pledgedAt) },
  ];
});

const canViewJobs = computed(
  () =>
    currentRole.value !== "freelancer" ||
    profileRequirementItems.value.every((item) => item.done),
);

const filteredFreelancers = computed(() => {
  return state.value.freelancers
    .filter(
      (fr) =>
        !scoutFilters.value.skill ||
        fr.skills
          .join(" ")
          .toLowerCase()
          .includes(scoutFilters.value.skill.toLowerCase()),
    )
    .filter(
      (fr) =>
        !scoutFilters.value.availability ||
        fr.availability === scoutFilters.value.availability,
    )
    .filter(
      (fr) =>
        !scoutFilters.value.remote || fr.remote === scoutFilters.value.remote,
    )
    .sort((a, b) => availabilityRank(b) - availabilityRank(a));
});

const selectedFreelancer = computed<Freelancer>(() => {
  const found = state.value.freelancers.find(
    (item) => item.id === state.value.selectedFreelancerId,
  );
  if (found) return found;

  if (currentRole.value === "freelancer") {
    const profile = state.value.profile;
    return {
      id: profile.id,
      name: profile.name || "未登録プロフィール",
      role: profile.role || "",
      skills: profileSkillList(profile),
      desiredRate: Number(profile.desiredRate || 0),
      workRate: profile.workRate,
      remote: profile.remote,
      availability: profile.availability,
      lastUpdated: profile.lastUpdated,
      resumeName: profile.resumeName,
    };
  }

  return state.value.freelancers[0];
});

const currentFreelancerId = computed(
  () => currentUser.value?.freelancerId || state.value.profile.id,
);

const currentFreelancerApplicationCount = computed(() => {
  const freelancerId = currentFreelancerId.value;
  return state.value.applications.filter(
    (application) => application.freelancerId === freelancerId,
  ).length;
});

const canApplyMoreJobs = computed(
  () =>
    currentRole.value !== "freelancer" ||
    currentFreelancerApplicationCount.value < 5,
);

const activeChatFreelancerId = computed(() => {
  if (currentRole.value === "freelancer") return currentFreelancerId.value;
  return (
    state.value.selectedFreelancerId || state.value.freelancers[0]?.id || ""
  );
});

const chatFreelancers = computed(() => {
  return state.value.freelancers.map((freelancer) => {
    const lastMessage = [...state.value.messages]
      .filter((message) => message.freelancerId === freelancer.id)
      .sort((a, b) => b.at.localeCompare(a.at))[0];
    const unreadCount = state.value.messages.filter(
      (message) =>
        message.freelancerId === freelancer.id &&
        isIncomingMessage(message) &&
        !message.readAt,
    ).length;

    return {
      ...freelancer,
      lastMessage,
      unreadCount,
    };
  });
});

const activeChatMessages = computed(() => {
  const freelancerId = activeChatFreelancerId.value;
  if (!freelancerId) return [];

  return state.value.messages
    .filter((message) => message.freelancerId === freelancerId)
    .sort((a, b) => a.at.localeCompare(b.at));
});

const activeMeetingRequests = computed(() => {
  const freelancerId = activeChatFreelancerId.value;
  if (!freelancerId) return [];
  return state.value.meetingRequests.filter(
    (meeting) => meeting.freelancerId === freelancerId,
  );
});

function canAccess(view: ViewKey) {
  const role = currentRole.value;
  if (!role) return false;
  return navItems.some(
    (item) => item.view === view && item.roles.includes(role),
  );
}

function ensureActiveView() {
  const role = currentRole.value;
  if (!role) return;
  if (!canAccess(state.value.activeView)) {
    state.value.activeView = defaultViewByRole[role];
    persist();
  }
}

async function setAuthMode(mode: AuthMode) {
  if (state.value.authMode !== mode && !(await confirmDiscardChanges())) return;
  state.value.authMode = mode;
  persist();
}

async function setView(view: ViewKey) {
  if (!canAccess(view)) {
    showToast("この画面は現在の権限では表示できません。");
    return;
  }

  if (state.value.activeView !== view && !(await confirmDiscardChanges()))
    return;
  if (state.value.activeView === view) return;

  const finishLoading = beginLoading();
  try {
    if (
      view === "jobs" &&
      currentRole.value === "freelancer" &&
      !canViewJobs.value
    ) {
      state.value.activeView = "jobs";
      showToast("案件閲覧にはプロフィール詳細の入力と誓約同意が必要です。");
      persist();
      scrollToPageTop();
      await sleep(180);
      return;
    }

    state.value.activeView = view;
    if (view === "profile") {
      state.value.wizardStep = 1;
    }
    if (view === "meeting") {
      ensureChatSelection();
      void markActiveChatAsRead();
    }
    persist();
    scrollToPageTop();
    await sleep(180);
  } finally {
    finishLoading();
  }
}

function ensureChatSelection() {
  if (currentRole.value === "freelancer") {
    state.value.selectedFreelancerId = currentFreelancerId.value;
    return;
  }

  const selectedExists = state.value.freelancers.some(
    (freelancer) => freelancer.id === state.value.selectedFreelancerId,
  );
  if (!selectedExists) {
    state.value.selectedFreelancerId = state.value.freelancers[0]?.id || "";
  }
}

function selectChatFreelancer(freelancerId: string) {
  if (currentRole.value !== "sales") {
    state.value.selectedFreelancerId = currentFreelancerId.value;
    return;
  }

  const freelancer = getFreelancer(freelancerId);
  if (!freelancer) return;

  state.value.selectedFreelancerId = freelancer.id;
  void setView("meeting");
  void markActiveChatAsRead();
  persist();
}

async function login(email: string, password: string) {
  try {
    const result = await apiRequest<{
      token: string;
      user: { email: string; role: Role; name: string; freelancerId?: string };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password }),
    });
    clearUnsavedChanges();
    setAuth(result.token, result.user);
    await loadWorkspace();
    startChatPolling();
    void requestBrowserNotificationPermission();
    showToast(`${roleLabel(result.user.role)}としてログインしました。`);
  } catch (error) {
    showToast(
      error instanceof Error
        ? error.message
        : "メールアドレスまたはパスワードが違います。",
    );
  }
}

async function loginWithDemo(role: Role) {
  if (!(await confirmDiscardChanges())) return;
  const account = demoAccounts.find((item) => item.role === role);
  if (account) void login(account.email, account.password);
}

function loginWithAccount(account: Account) {
  clearUnsavedChanges();
  state.value.auth = {
    email: account.email,
    role: account.role,
    name: account.name,
    freelancerId: account.freelancerId,
    loggedInAt: nowLabel(),
  };
  state.value.activeView = account.startView || defaultViewByRole[account.role];
  persist();
  showToast(`${roleLabel(account.role)}としてログインしました。`);
}

async function register(values: RegisterInput) {
  const email = values.email.trim();
  if (!email || !values.password) {
    showToast("メールアドレス、パスワードを入力してください。");
    return;
  }
  if (values.password !== values.passwordConfirm) {
    showToast("確認用パスワードが一致しません。");
    return;
  }
  try {
    const result = await apiRequest<{
      token: string;
      user: { email: string; role: Role; name: string; freelancerId?: string };
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password: values.password,
        privacyPolicyAccepted: true,
      }),
    });
    clearUnsavedChanges();
    setAuth(result.token, result.user);
    state.value.activeView = "profile";
    state.value.wizardStep = 1;
    await loadWorkspace();
    startChatPolling();
    void requestBrowserNotificationPermission();
    showToast("会員登録が完了しました。続けてプロフィールを入力してください。");
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "会員登録に失敗しました。",
    );
  }
}

async function logout() {
  if (!(await confirmDiscardChanges())) return;
  const previousRole = currentRole.value;
  accessToken = "";
  localStorage.removeItem(TOKEN_KEY);
  stopChatPolling();
  state.value.auth = null;
  state.value.activeView = previousRole
    ? defaultViewByRole[previousRole]
    : "jobs";
  persist();
  showToast("ログアウトしました。");
}

async function saveProfileBasic(
  values: Pick<Profile, "name" | "nameKana" | "email" | "phone" | "role">,
) {
  Object.assign(state.value.profile, values, { lastUpdated: today() });
  state.value.wizardStep = 2;
  await saveProfileToApi("簡易プロフィールを保存しました。");
}

async function saveProfileSkills(
  values: Pick<
    Profile,
    "languages" | "db" | "frameworks" | "cloud" | "otherSkills" | "years"
  >,
) {
  Object.assign(state.value.profile, values, { lastUpdated: today() });
  state.value.wizardStep = 3;
  await saveProfileToApi("スキル情報を保存しました。");
}

async function saveProfileTerms(values: ProfileTermsInput) {
  Object.assign(state.value.profile, {
    desiredRate: values.desiredRate,
    startDate: values.startDate,
    workRate: values.workRate,
    remote: values.remote,
    availability: values.availability,
    lastUpdated: today(),
  });

  if (values.resume?.name) {
    state.value.profile.resumeName = values.resume.name;
    state.value.profile.resumeType =
      values.resume.type || "application/octet-stream";
    state.value.profile.resumeSize = `${Math.ceil(values.resume.size / 1024)}KB`;
    await apiRequest("/resumes", {
      method: "POST",
      body: JSON.stringify({
        originalFilename: values.resume.name,
        mimeType: values.resume.type || "application/octet-stream",
        fileSizeBytes: values.resume.size,
        storageKey: `local/${Date.now()}-${values.resume.name}`,
      }),
    }).catch((error) =>
      showToast(
        error instanceof Error ? error.message : "レジュメ保存に失敗しました。",
      ),
    );
  }

  state.value.wizardStep = 4;
  await saveProfileToApi("稼働条件とレジュメを保存しました。");
}

async function saveProfileMeeting(
  meetingCandidateValues: string[] | string,
  pledgeAccepted = false,
) {
  if (!pledgeAccepted) {
    showToast("案件閲覧には誓約条件への同意が必要です。");
    return;
  }
  const candidates = (
    Array.isArray(meetingCandidateValues)
      ? meetingCandidateValues
      : meetingCandidateValues.split("\n")
  )
    .map((candidate) => candidate.trim())
    .filter(Boolean);
  if (!candidates.length) {
    showToast("初回面談の候補日を1つ以上入力してください。");
    return;
  }
  state.value.profile.meetingCandidates = candidates;
  state.value.profile.pledgeAccepted = true;
  if (!state.value.profile.pledgedAt)
    state.value.profile.pledgedAt = new Date().toISOString();
  state.value.profile.lastUpdated = today();
  try {
    await saveProfileToApi("");
    await Promise.all(
      candidates.map((candidate) =>
        apiRequest("/meeting-requests", {
          method: "POST",
          body: JSON.stringify({ candidateAt: toApiDateTime(candidate) }),
        }),
      ),
    );
    await loadWorkspace();
    clearUnsavedChanges();
    state.value.profile.pledgeAccepted = true;
    if (!state.value.profile.pledgedAt)
      state.value.profile.pledgedAt = new Date().toISOString();
    await setView("jobs");
    showToast("登録が完了しました。");
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "面談候補の保存に失敗しました。",
    );
  }
}

async function resetProfile() {
  if (!(await confirmDiscardChanges())) return;
  const profileId =
    currentUser.value?.freelancerId || state.value.profile.id || "fr-current";
  state.value.profile = blankProfile(profileId);
  state.value.selectedFreelancerId = profileId;
  state.value.wizardStep = 1;
  state.value.activeView = "profile";
  state.value.freelancers = state.value.freelancers.filter(
    (freelancer) => freelancer.id !== profileId,
  );
  state.value.meetingRequests = state.value.meetingRequests.filter(
    (meeting) => meeting.freelancerId !== profileId,
  );
  persist();
  showToast("プロフィールを初期状態に戻しました。");
}

async function createJob(values: JobInput) {
  const rateMin = Number(values.rateMin || 0);
  const rateMax = Number(values.rateMax || 0);
  const marginRate = Number(values.marginRate || 0);
  if (!String(values.title || "").trim()) {
    showToast("案件概要を入力してください。");
    return false;
  }
  if (!String(values.client || "").trim()) {
    showToast("顧客名を入力してください。");
    return false;
  }
  if (!splitCsv(values.required).length) {
    showToast("必須スキルを1つ以上入力してください。");
    return false;
  }
  if (!rateMin || !rateMax || rateMax < rateMin) {
    showToast("単価は下限・上限を入力し、上限が下限以上になるようにしてください。");
    return false;
  }
  if (marginRate < 0 || marginRate > 100) {
    showToast("マージン率は0〜100の範囲で入力してください。");
    return false;
  }

  try {
    const job = await apiRequest<Job>("/jobs", {
      method: "POST",
      body: JSON.stringify({
        title: String(values.title).trim(),
        client: String(values.client).trim(),
        summary: values.summary || "",
        required: splitCsv(values.required),
        nice: splitCsv(values.nice),
        rateMin,
        rateMax,
        marginRate,
        streamType: values.stream,
        remoteType: values.remote,
        isPinned: values.sortFlag,
      }),
    });
    state.value.jobs.unshift(job);
    saveAndNotify("案件を登録しました。");
    return true;
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "案件登録に失敗しました。",
    );
    return false;
  }
}

async function clearJobFilter() {
  filters.value = { keyword: "", skill: "", rate: "", remote: "", stream: "" };
  await fetchJobsPage({ reset: true });
}

async function searchJobs() {
  await fetchJobsPage({ reset: true });
}

async function loadMoreJobs() {
  if (jobsLoading.value || !jobPagination.value.hasMore) return;
  await fetchJobsPage({ reset: false });
}

async function fetchJobsPage({ reset }: { reset: boolean }) {
  if (currentRole.value === "freelancer" && !canViewJobs.value) {
    state.value.jobs = [];
    jobPagination.value = {
      total: 0,
      limit: JOB_PAGE_SIZE,
      offset: 0,
      hasMore: false,
    };
    return;
  }

  const offset = reset ? 0 : state.value.jobs.length;
  jobsLoading.value = true;
  try {
    const query = buildJobQuery(offset);
    const result = await apiRequest<JobListResponse>(`/jobs?${query}`);
    state.value.jobs = reset ? result.items : [...state.value.jobs, ...result.items];
    jobPagination.value = {
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    };
  } catch (error) {
    if (reset) {
      state.value.jobs = [];
      jobPagination.value = {
        total: 0,
        limit: JOB_PAGE_SIZE,
        offset: 0,
        hasMore: false,
      };
    }
    showToast(error instanceof Error ? error.message : "案件一覧の取得に失敗しました。");
  } finally {
    jobsLoading.value = false;
  }
}

function buildJobQuery(offset: number) {
  const params = new URLSearchParams();
  params.set("limit", String(JOB_PAGE_SIZE));
  params.set("offset", String(offset));

  const values = filters.value;
  if (values.keyword.trim()) params.set("keyword", values.keyword.trim());
  if (values.skill.trim()) params.set("skill", values.skill.trim());
  if (values.rate) params.set("rate", values.rate);
  if (values.remote) params.set("remote", values.remote);
  if (values.stream) params.set("stream", values.stream);

  return params.toString();
}

function clearScoutFilter() {
  scoutFilters.value = { skill: "", availability: "", remote: "" };
}

async function applyJob(jobId: string) {
  if (currentRole.value !== "freelancer") {
    showToast("応募は求職者アカウントで利用できます。");
    return;
  }
  if (hasApplied(jobId)) return;
  if (!canApplyMoreJobs.value) {
    showToast("応募できる案件は5件までです。");
    return;
  }

  try {
    const application = await apiRequest<Application>("/applications", {
      method: "POST",
      body: JSON.stringify({ jobId }),
    });
    state.value.applications.unshift(application);
    persist();
    showToast("応募しました。");
  } catch (error) {
    showToast(error instanceof Error ? error.message : "応募に失敗しました。");
  }
}

async function sendScout(freelancerId: string, jobId?: string) {
  if (currentRole.value !== "sales") {
    showToast("スカウトは営業アカウントで利用できます。");
    return;
  }

  const freelancer = getFreelancer(freelancerId);
  if (!freelancer) return;
  const job = jobId ? getJob(jobId) : undefined;

  try {
    const message = await apiRequest<Message>("/messages", {
      method: "POST",
      body: JSON.stringify({
        freelancerProfileId: freelancer.id,
        jobId: job?.id,
        body: job
          ? `「${job.title}」をご紹介したいです。${freelancer.role}のご経験と親和性が高いため、稼働状況の確認をお願いします。`
          : `${freelancer.role}向けの案件をご紹介したいです。稼働状況の確認をお願いします。`,
        messageType: "scout",
      }),
    });
    state.value.messages.push(message);
    knownMessageIds.add(message.id);
    state.value.selectedFreelancerId = freelancer.id;
    persist();
    showToast(`${freelancer.name}さんへスカウトを送信しました。`);
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "スカウト送信に失敗しました。",
    );
  }
}

function selectPreview(freelancerId: string) {
  const freelancer = getFreelancer(freelancerId);
  state.value.previewFreelancerId = freelancer?.id || "";
  persist();
  showToast(
    `${freelancer?.resumeName || "レジュメ未登録"} を管理プレビューで確認中です。`,
  );
}

async function toggleJobSort(jobId: string) {
  const job = getJob(jobId);
  if (!job) return;
  try {
    const updated = await apiRequest<Job>(`/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ isPinned: !job.sortFlag }),
    });
    Object.assign(job, updated);
    persist();
    showToast("並び替えフラグを更新しました。");
  } catch (error) {
    showToast(error instanceof Error ? error.message : "更新に失敗しました。");
  }
}

async function toggleJobActive(jobId: string) {
  const job = getJob(jobId);
  if (!job) return;
  try {
    const updated = await apiRequest<Job>(`/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !job.active }),
    });
    Object.assign(job, updated);
    persist();
    showToast("公開ステータスを更新しました。");
  } catch (error) {
    showToast(error instanceof Error ? error.message : "更新に失敗しました。");
  }
}

async function changeApplicationStatus(applicationId: string, status: string) {
  if (currentRole.value !== "sales") {
    showToast("選考ステータスの更新は営業アカウントで利用できます。");
    return;
  }

  const item = state.value.applications.find(
    (application) => application.id === applicationId,
  );
  if (!item || !statuses.includes(status as ApplicationStatus)) return;
  try {
    const updated = await apiRequest<Application>(
      `/applications/${applicationId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
      },
    );
    Object.assign(item, updated);
    persist();
    showToast("選考ステータスを更新しました。");
  } catch (error) {
    showToast(error instanceof Error ? error.message : "更新に失敗しました。");
  }
}

async function addMeeting(candidateValue: string) {
  if (!candidateValue) {
    showToast("候補日時を入力してください。");
    return;
  }

  try {
    const meeting = await apiRequest<{
      id: string;
      freelancerProfileId: string;
      candidateAt: string;
      status: string;
    }>("/meeting-requests", {
      method: "POST",
      body: JSON.stringify({
        freelancerProfileId:
          currentRole.value === "sales"
            ? activeChatFreelancerId.value
            : undefined,
        candidateAt: toApiDateTime(candidateValue),
      }),
    });
    const candidateLabel = meeting.candidateAt.replace("T", " ").slice(0, 16);
    state.value.meetingRequests.push({
      id: meeting.id,
      freelancerId: meeting.freelancerProfileId,
      candidate: candidateLabel,
      status: "候補",
    });
    if (
      meeting.freelancerProfileId === state.value.profile.id &&
      !state.value.profile.meetingCandidates.includes(candidateLabel)
    ) {
      state.value.profile.meetingCandidates.push(candidateLabel);
    }
    saveAndNotify("面談候補を追加しました。");
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "面談候補の追加に失敗しました。",
    );
  }
}

async function updateMeetingStatus(
  meetingId: string,
  status: "確定" | "再調整",
) {
  const item = state.value.meetingRequests.find(
    (meeting) => meeting.id === meetingId,
  );
  if (!item) return;
  try {
    await apiRequest(`/meeting-requests/${meetingId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    item.status = status;
    persist();
    showToast("面談ステータスを更新しました。");
  } catch (error) {
    showToast(error instanceof Error ? error.message : "更新に失敗しました。");
  }
}

async function sendMessage(body: string) {
  const trimmedBody = body.trim();
  if (!trimmedBody) {
    showToast("送信内容を入力してください。");
    return false;
  }

  const isSales = currentRole.value === "sales";
  const freelancerId = activeChatFreelancerId.value;
  const freelancer = isSales
    ? getFreelancer(freelancerId)
    : selectedFreelancer.value;

  if (!freelancerId || !freelancer) {
    showToast("チャット対象の求職者を選択してください。");
    return false;
  }

  try {
    const message = await apiRequest<Message>("/messages", {
      method: "POST",
      body: JSON.stringify({
        freelancerProfileId: isSales ? freelancerId : undefined,
        body: trimmedBody,
        messageType: "chat",
      }),
    });
    state.value.messages.push(message);
    knownMessageIds.add(message.id);
    persist();
    void markActiveChatAsRead();
    showToast("メッセージを送信しました。");
    return true;
  } catch (error) {
    showToast(error instanceof Error ? error.message : "送信に失敗しました。");
    return false;
  }
}

async function submitContactInquiry(values: ContactInquiryInput) {
  if (
    !values.inquiryType ||
    !values.name ||
    !values.email ||
    !values.subject ||
    !values.body
  ) {
    showToast("問い合わせ種別、氏名、メールアドレス、件名、本文を入力してください。");
    return false;
  }

  try {
    await apiRequest<{ id: string; createdAt: string }>("/contact-inquiries", {
      method: "POST",
      body: JSON.stringify({
        inquiryType: values.inquiryType,
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        subject: values.subject,
        body: values.body,
      }),
    });
    clearUnsavedChanges();
    await loadContactInquiries();
    showToast("問い合わせを送信しました。");
    return true;
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "問い合わせ送信に失敗しました。",
    );
    return false;
  }
}

async function loadContactInquiries() {
  if (!currentRole.value) return;
  state.value.contactInquiries =
    await apiRequest<ContactInquiry[]>("/contact-inquiries");
  persist();
}

async function answerContactInquiry(id: string, answerBody: string) {
  if (!answerBody.trim()) {
    showToast("回答内容を入力してください。");
    return false;
  }

  try {
    const inquiry = await apiRequest<ContactInquiry>(
      `/contact-inquiries/${id}/answer`,
      {
        method: "PATCH",
        body: JSON.stringify({ answerBody }),
      },
    );
    state.value.contactInquiries = state.value.contactInquiries.map((item) =>
      item.id === inquiry.id ? inquiry : item,
    );
    showToast("問い合わせに回答しました。");
    persist();
    return true;
  } catch (error) {
    showToast(error instanceof Error ? error.message : "回答に失敗しました。");
    return false;
  }
}

function mergeMessages(messages: Message[]) {
  const messageById = new Map(messages.map((message) => [message.id, message]));
  state.value.messages = state.value.messages.map(
    (message) => messageById.get(message.id) || message,
  );
  for (const message of messages) {
    if (!state.value.messages.some((item) => item.id === message.id)) {
      state.value.messages.push(message);
    }
  }
}

async function markActiveChatAsRead() {
  if (!state.value.auth || state.value.activeView !== "meeting") return;
  const freelancerId = activeChatFreelancerId.value;
  if (!freelancerId) return;

  const unreadIds = activeChatMessages.value
    .filter((message) => isIncomingMessage(message) && !message.readAt)
    .map((message) => message.id);
  if (!unreadIds.length) return;

  const readAt = new Date().toISOString();
  state.value.messages = state.value.messages.map((message) =>
    unreadIds.includes(message.id) ? { ...message, readAt } : message,
  );
  persist();

  try {
    const messages = await apiRequest<Message[]>("/messages/read", {
      method: "PATCH",
      body: JSON.stringify({
        freelancerProfileId:
          currentRole.value === "sales" ? freelancerId : undefined,
      }),
      silent: true,
    });
    mergeMessages(messages);
    persist();
  } catch {
    state.value.messages = state.value.messages.map((message) =>
      unreadIds.includes(message.id) ? { ...message, readAt: "" } : message,
    );
    persist();
  }
}

async function aliveCheck() {
  if (currentRole.value !== "sales") {
    showToast("生存確認は営業アカウントで利用できます。");
    return;
  }

  try {
    const batch = await apiRequest<{
      id: string;
      targetCount: number;
      executedAt: string;
    }>("/alive-checks", { method: "POST" });
    state.value.aliveChecks.push({
      id: batch.id,
      count: batch.targetCount,
      at: batch.executedAt,
    });
    persist();
    showToast(`${batch.targetCount}名に生存確認メールを送信しました。`);
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "生存確認に失敗しました。",
    );
  }
}

function copyText(text: string) {
  navigator.clipboard?.writeText(text || location.href);
  showToast("共有用URLをコピーしました。");
}

function printSheet() {
  if (!import.meta.client) return;
  const previousTitle = document.title;
  document.title = "TRYANGLE FREELANCE 匿名スキルシート";
  document.body.classList.add("printing-anonymous-sheet");
  window.print();
  setTimeout(() => {
    document.title = previousTitle;
    document.body.classList.remove("printing-anonymous-sheet");
  }, 300);
}

function syncProfileToFreelancer() {
  const profile = state.value.profile;
  if (!hasProfileContent(profile)) return;

  const item: Freelancer = {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    skills: profileSkillList(profile),
    desiredRate: Number(profile.desiredRate || 0),
    workRate: profile.workRate,
    remote: profile.remote,
    availability: profile.availability,
    lastUpdated: profile.lastUpdated || today(),
    resumeName: profile.resumeName,
  };

  const index = state.value.freelancers.findIndex(
    (freelancer) => freelancer.id === profile.id,
  );
  if (index >= 0) state.value.freelancers[index] = item;
  else state.value.freelancers.unshift(item);
}

async function saveProfileToApi(message: string) {
  try {
    const profile = await apiRequest<
      Freelancer & {
        nameKana?: string;
        email?: string;
        phone?: string | null;
        yearsExperience?: number;
        startDate?: string;
        pledgedAt?: string;
      }
    >("/profile/me", {
      method: "PUT",
      body: JSON.stringify(profileToApi(state.value.profile)),
    });
    const previousProfile = state.value.profile;
    const nextProfile = freelancerToProfile(profile);
    state.value.profile = {
      ...nextProfile,
      resumeName: previousProfile.resumeName,
      meetingCandidates: previousProfile.meetingCandidates,
      pledgeAccepted:
        nextProfile.pledgeAccepted || previousProfile.pledgeAccepted,
      pledgedAt: nextProfile.pledgedAt || previousProfile.pledgedAt,
    };
    syncProfileToFreelancer();
    clearUnsavedChanges();
    persist();
    if (message) showToast(message);
  } catch (error) {
    showToast(
      error instanceof Error
        ? error.message
        : "プロフィール保存に失敗しました。",
    );
  }
}

function hasProfileContent(profile: Profile) {
  return Boolean(
    profile?.name ||
      profile?.email ||
      profile?.phone ||
      profile?.role ||
      profile?.languages ||
      profile?.db ||
      profile?.frameworks ||
      profile?.cloud ||
      profile?.otherSkills ||
      profile?.years ||
      profile?.desiredRate ||
      profile?.startDate ||
      profile?.resumeName ||
      profile?.meetingCandidates?.length,
  );
}

function hasApplied(jobId: string) {
  return state.value.applications.some(
    (application) =>
      application.jobId === jobId &&
      application.freelancerId === state.value.profile.id,
  );
}

function getFreelancer(id = "") {
  return state.value.freelancers.find((freelancer) => freelancer.id === id);
}

function getJob(id = "") {
  return state.value.jobs.find((job) => job.id === id);
}

function meetingCandidatesForProfile(profileId: string) {
  return state.value.meetingRequests
    .filter((meeting) => meeting.freelancerId === profileId)
    .map((meeting) => meeting.candidate)
    .filter(Boolean);
}

function currentPreviewFreelancer() {
  return (
    getFreelancer(state.value.previewFreelancerId) ||
    getFreelancer(state.value.profile.id)
  );
}

function estimateRate() {
  const years = Number(state.value.profile.years || 0);
  const skills = [
    state.value.profile.languages,
    state.value.profile.frameworks,
    state.value.profile.db,
    state.value.profile.cloud,
    state.value.profile.otherSkills,
  ].join(" ");
  const premium =
    ["AWS", "Kubernetes", "Go", "Spring Boot", "React"].filter((skill) =>
      skills.includes(skill),
    ).length * 4;
  const base = 48 + years * 5 + premium;
  return { min: Math.max(45, base - 8), max: base + 12 };
}

function roleLabel(role = currentRole.value) {
  return role === "sales" ? "営業" : "求職者";
}

function availabilityClass(value = "") {
  if (value === "即稼働可") return "ready";
  if (value.includes("空き予定")) return "soon";
  return "pause";
}

function streamTone(value = "") {
  if (value === "エンド直") return "teal";
  if (value === "1次請け") return "blue";
  return "amber";
}

function availabilityRank(freelancer: Freelancer) {
  if (freelancer.availability === "即稼働可") return 3;
  if (freelancer.availability?.includes("空き予定")) return 2;
  return 1;
}

function splitCsv(value: string | number | null | undefined) {
  return String(value || "")
    .split(/[,、\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function profileSkillList(
  profile: Pick<
    Profile,
    "languages" | "db" | "frameworks" | "cloud" | "otherSkills"
  >,
) {
  return [
    ...splitCsv(profile.languages),
    ...splitCsv(profile.frameworks),
    ...splitCsv(profile.db),
    ...splitCsv(profile.cloud),
    ...splitCsv(profile.otherSkills),
  ];
}

function categorizeSkills(skills: string[]) {
  const result = {
    languages: [] as string[],
    db: [] as string[],
    frameworks: [] as string[],
    cloud: [] as string[],
    other: [] as string[],
  };
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

function maskName(name: string) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "匿名";
  return `${parts.map((part) => part[0]).join(".")}.`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowLabel() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toApiDateTime(value: string) {
  const normalized = value.trim().replace(" ", "T");
  if (/Z$|[+-]\d\d:\d\d$/.test(normalized)) return normalized;
  return normalized.length === 16
    ? `${normalized}:00+09:00`
    : `${normalized}+09:00`;
}

function uid(prefix: string) {
  const random =
    globalThis.crypto?.randomUUID?.().slice(0, 8) ||
    Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

function markDirty() {
  hasUnsavedChanges.value = true;
}

function clearUnsavedChanges() {
  hasUnsavedChanges.value = false;
}

function confirmDiscardChanges() {
  if (!hasUnsavedChanges.value) return Promise.resolve(true);
  unsavedConfirmVisible.value = true;
  return new Promise<boolean>((resolve) => {
    unsavedConfirmResolver = resolve;
  });
}

function resolveUnsavedConfirm(discard: boolean) {
  unsavedConfirmVisible.value = false;
  if (discard) clearUnsavedChanges();
  unsavedConfirmResolver?.(discard);
  unsavedConfirmResolver = undefined;
}

function showToast(message: string) {
  toastMessage.value = message;
  toastVisible.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastVisible.value = false;
  }, 2600);
}

function saveAndNotify(message: string) {
  clearUnsavedChanges();
  persist();
  showToast(message);
}

export function useTryangleFreelance() {
  return {
    state,
    filters,
    scoutFilters,
    jobPagination,
    jobsLoading,
    hasUnsavedChanges,
    isLoading,
    toastMessage,
    toastVisible,
    unsavedConfirmVisible,
    chatBannerVisible,
    chatBannerTitle,
    chatBannerBody,
    navItems,
    demoAccounts,
    statuses,
    flowOptions,
    remoteOptions,
    availabilityOptions,
    languageSkillOptions,
    dbSkillOptions,
    frameworkSkillOptions,
    cloudSkillOptions,
    authAccounts,
    currentUser,
    currentRole,
    availableNavItems,
    filteredJobs,
    profileRequirementItems,
    canViewJobs,
    filteredFreelancers,
    selectedFreelancer,
    currentFreelancerId,
    currentFreelancerApplicationCount,
    canApplyMoreJobs,
    activeChatFreelancerId,
    chatFreelancers,
    activeChatMessages,
    activeMeetingRequests,
    init,
    persist,
    canAccess,
    ensureActiveView,
    setAuthMode,
    setView,
    selectChatFreelancer,
    login,
    loginWithDemo,
    register,
    logout,
    saveProfileBasic,
    saveProfileSkills,
    saveProfileTerms,
    saveProfileMeeting,
    resetProfile,
    createJob,
    clearJobFilter,
    searchJobs,
    loadMoreJobs,
    clearScoutFilter,
    applyJob,
    sendScout,
    selectPreview,
    toggleJobSort,
    toggleJobActive,
    changeApplicationStatus,
    addMeeting,
    updateMeetingStatus,
    sendMessage,
    submitContactInquiry,
    loadContactInquiries,
    answerContactInquiry,
    markActiveChatAsRead,
    aliveCheck,
    copyText,
    printSheet,
    syncProfileToFreelancer,
    hasApplied,
    getFreelancer,
    getJob,
    currentPreviewFreelancer,
    estimateRate,
    roleLabel,
    availabilityClass,
    streamTone,
    splitCsv,
    maskName,
    markDirty,
    clearUnsavedChanges,
    confirmDiscardChanges,
    resolveUnsavedConfirm,
    showToast,
    openChatBanner,
    dismissChatBanner,
    requestBrowserNotificationPermission,
    today,
  };
}
