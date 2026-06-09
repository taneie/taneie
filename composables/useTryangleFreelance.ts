import { computed, ref } from "vue";

export type Role = "freelancer" | "sales";
export type ViewKey = "dashboard" | "profile" | "jobs" | "admin" | "scout" | "meeting" | "sheet";
export type AuthMode = "login" | "register";
export type ApplicationStatus = "選考中" | "面談待ち" | "成約" | "見送り";
export type IconName = "briefcase" | "user" | "search" | "chart" | "send" | "calendar" | "shield" | "plus" | "print";

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
  email: string;
  phone: string;
  role: string;
  languages: string;
  db: string;
  frameworks: string;
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
  from: string;
  to: string;
  body: string;
  at: string;
  channel: "sales" | "freelancer";
}

export interface MeetingRequest {
  id: string;
  freelancerId: string;
  candidate: string;
  status: "候補" | "確定" | "再調整";
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
  aliveChecks: AliveCheck[];
}

export interface JobFilters {
  keyword: string;
  skill: string;
  rate: string;
  remote: string;
  stream: string;
}

export interface ScoutFilters {
  skill: string;
  availability: string;
  remote: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  role: string;
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

const STORAGE_KEY = "tryangle-freelance-state-v1";

const navItems: NavItem[] = [
  { view: "dashboard", icon: "chart", label: "ダッシュボード", roles: ["sales"] },
  { view: "profile", icon: "user", label: "プロフィール", roles: ["freelancer"] },
  { view: "jobs", icon: "search", label: "案件検索", roles: ["freelancer"] },
  { view: "admin", icon: "briefcase", label: "営業管理", roles: ["sales"] },
  { view: "scout", icon: "send", label: "スカウト", roles: ["sales"] },
  { view: "meeting", icon: "calendar", label: "面談・チャット", roles: ["freelancer", "sales"] },
  { view: "sheet", icon: "shield", label: "匿名スキルシート", roles: ["freelancer"] }
];

const demoAccounts: Account[] = [
  {
    email: "freelancer@example.com",
    password: "freelance123",
    role: "freelancer",
    name: "山田 太郎",
    startView: "jobs",
    freelancerId: "fr-current"
  },
  {
    email: "sales@tryangle.jp",
    password: "sales123",
    role: "sales",
    name: "TRYANGLE 営業",
    startView: "dashboard"
  }
];

const defaultViewByRole: Record<Role, ViewKey> = {
  freelancer: "jobs",
  sales: "dashboard"
};

const statuses: ApplicationStatus[] = ["選考中", "面談待ち", "成約", "見送り"];
const flowOptions = ["エンド直", "1次請け", "2次請け", "その他"];
const remoteOptions = ["フルリモート", "一部リモート", "常駐"];
const availabilityOptions = ["即稼働可", "2026年7月から空き予定", "現在は案件停止中"];

const state = ref<TryangleState>(createSeedState());
const filters = ref<JobFilters>({ keyword: "", skill: "", rate: "", remote: "", stream: "" });
const scoutFilters = ref<ScoutFilters>({ skill: "", availability: "", remote: "" });
const hasUnsavedChanges = ref(false);
const toastMessage = ref("");
const toastVisible = ref(false);
const initialized = ref(false);
let toastTimer: ReturnType<typeof setTimeout> | undefined;

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
        resumeName: "職務経歴書_山田太郎.pdf"
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
        resumeName: "skill_sheet_sato.docx"
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
        resumeName: "resume_suzuki.pdf"
      }
    ],
    jobs: [
      {
        id: "job-001",
        title: "金融SaaSのバックエンド刷新",
        client: "FinTech事業会社",
        summary: "Java/Spring Bootで既存決済基盤を刷新。設計から実装、テストまで担当。",
        required: ["Java", "Spring Boot", "PostgreSQL", "API設計"],
        nice: ["AWS", "React"],
        rateMin: 80,
        rateMax: 100,
        marginRate: 12,
        stream: "エンド直",
        remote: "一部リモート",
        sortFlag: true,
        active: true
      },
      {
        id: "job-002",
        title: "人材マッチングサービスのフロント開発",
        client: "HRTechスタートアップ",
        summary: "React/TypeScriptで候補者・営業向け画面を改善。UI実装と状態管理が中心。",
        required: ["React", "TypeScript", "CSS"],
        nice: ["Next.js", "Figma"],
        rateMin: 70,
        rateMax: 90,
        marginRate: 10,
        stream: "1次請け",
        remote: "フルリモート",
        sortFlag: true,
        active: true
      },
      {
        id: "job-003",
        title: "製造業向けクラウド基盤構築",
        client: "大手SIer",
        summary: "AWS/Terraformで新規クラウド環境を設計。監視、権限、CI/CD整備を含む。",
        required: ["AWS", "Terraform", "Linux"],
        nice: ["Kubernetes", "Go"],
        rateMin: 75,
        rateMax: 95,
        marginRate: 15,
        stream: "2次請け",
        remote: "一部リモート",
        sortFlag: false,
        active: true
      }
    ],
    applications: [
      { id: "app-001", jobId: "job-001", freelancerId: "fr-001", status: "面談待ち", appliedAt: "2026-06-04" },
      { id: "app-002", jobId: "job-002", freelancerId: "fr-002", status: "選考中", appliedAt: "2026-06-03" }
    ],
    messages: [
      { id: "msg-001", from: "営業", to: "山田 太郎", body: "金融SaaS案件について、初回面談候補を確認しました。", at: "2026-06-04 11:20", channel: "sales" },
      { id: "msg-002", from: "山田 太郎", to: "営業", body: "6月10日午前で調整可能です。職務経歴書も更新しました。", at: "2026-06-04 11:36", channel: "freelancer" }
    ],
    meetingRequests: [
      { id: "meet-001", freelancerId: "fr-001", candidate: "2026-06-10 10:00", status: "候補" },
      { id: "meet-002", freelancerId: "fr-001", candidate: "2026-06-11 15:00", status: "候補" }
    ],
    aliveChecks: []
  };
}

function blankProfile(id = "fr-current"): Profile {
  return {
    id,
    name: "",
    email: "",
    phone: "",
    role: "",
    languages: "",
    db: "",
    frameworks: "",
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
    lastUpdated: ""
  };
}

function init() {
  if (initialized.value || !import.meta.client) return;

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as Partial<TryangleState> | null;
    state.value = saved ? normalizeLoadedState(mergeState(createSeedState(), saved)) : createSeedState();
  } catch {
    state.value = createSeedState();
  }

  syncProfileToFreelancer();
  ensureActiveView();
  initialized.value = true;
}

function mergeState(base: TryangleState, saved: Partial<TryangleState>): TryangleState {
  return {
    ...clone(base),
    ...saved,
    profile: { ...base.profile, ...(saved.profile || {}) },
    accounts: saved.accounts || base.accounts,
    freelancers: saved.freelancers || base.freelancers,
    jobs: saved.jobs || base.jobs,
    applications: saved.applications || base.applications,
    messages: saved.messages || base.messages,
    meetingRequests: saved.meetingRequests || base.meetingRequests,
    aliveChecks: saved.aliveChecks || base.aliveChecks,
    previewFreelancerId: saved.previewFreelancerId || ""
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
  return profile?.id === "fr-001"
    && profile?.name === "山田 太郎"
    && profile?.email === "taro@example.com"
    && profile?.languages === "Java, TypeScript, Python";
}

function persist() {
  if (!import.meta.client) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value));
}

const authAccounts = computed(() => [...demoAccounts, ...(state.value.accounts || [])]);
const currentUser = computed(() => state.value.auth);
const currentRole = computed<Role | null>(() => currentUser.value?.role || null);
const availableNavItems = computed(() => {
  const role = currentRole.value;
  return role ? navItems.filter((item) => item.roles.includes(role)) : [];
});

const filteredJobs = computed(() => {
  const keyword = filters.value.keyword.toLowerCase();
  const skill = filters.value.skill.toLowerCase();

  return state.value.jobs
    .filter((job) => job.active)
    .filter((job) => !keyword || [job.title, job.client, job.summary].join(" ").toLowerCase().includes(keyword))
    .filter((job) => !skill || [...job.required, ...job.nice].join(" ").toLowerCase().includes(skill))
    .filter((job) => !filters.value.rate || job.rateMax >= Number(filters.value.rate))
    .filter((job) => !filters.value.remote || job.remote === filters.value.remote)
    .filter((job) => !filters.value.stream || job.stream === filters.value.stream)
    .sort((a, b) => Number(b.sortFlag) - Number(a.sortFlag));
});

const filteredFreelancers = computed(() => {
  return state.value.freelancers
    .filter((fr) => !scoutFilters.value.skill || fr.skills.join(" ").toLowerCase().includes(scoutFilters.value.skill.toLowerCase()))
    .filter((fr) => !scoutFilters.value.availability || fr.availability === scoutFilters.value.availability)
    .filter((fr) => !scoutFilters.value.remote || fr.remote === scoutFilters.value.remote)
    .sort((a, b) => availabilityRank(b) - availabilityRank(a));
});

const selectedFreelancer = computed<Freelancer>(() => {
  const found = state.value.freelancers.find((item) => item.id === state.value.selectedFreelancerId);
  if (found) return found;

  if (currentRole.value === "freelancer") {
    const profile = state.value.profile;
    return {
      id: profile.id,
      name: profile.name || "未登録プロフィール",
      role: profile.role || "",
      skills: [...splitCsv(profile.languages), ...splitCsv(profile.frameworks), ...splitCsv(profile.db)],
      desiredRate: Number(profile.desiredRate || 0),
      workRate: profile.workRate,
      remote: profile.remote,
      availability: profile.availability,
      lastUpdated: profile.lastUpdated,
      resumeName: profile.resumeName
    };
  }

  return state.value.freelancers[0];
});

function canAccess(view: ViewKey) {
  const role = currentRole.value;
  if (!role) return false;
  return navItems.some((item) => item.view === view && item.roles.includes(role));
}

function ensureActiveView() {
  const role = currentRole.value;
  if (!role) return;
  if (!canAccess(state.value.activeView)) {
    state.value.activeView = defaultViewByRole[role];
    persist();
  }
}

function setAuthMode(mode: AuthMode) {
  if (state.value.authMode !== mode && !confirmDiscardChanges()) return;
  state.value.authMode = mode;
  persist();
}

function setView(view: ViewKey) {
  if (!canAccess(view)) {
    showToast("この画面は現在の権限では表示できません。");
    return;
  }

  if (state.value.activeView !== view && !confirmDiscardChanges()) return;
  state.value.activeView = view;
  persist();
}

function login(email: string, password: string) {
  const account = authAccounts.value.find((item) => item.email === email.trim() && item.password === password);
  if (!account) {
    showToast("メールアドレスまたはパスワードが違います。");
    return;
  }
  loginWithAccount(account);
}

function loginWithDemo(role: Role) {
  if (!confirmDiscardChanges()) return;
  const account = demoAccounts.find((item) => item.role === role);
  if (account) loginWithAccount(account);
}

function loginWithAccount(account: Account) {
  clearUnsavedChanges();
  state.value.auth = {
    email: account.email,
    role: account.role,
    name: account.name,
    freelancerId: account.freelancerId,
    loggedInAt: nowLabel()
  };
  state.value.activeView = account.startView || defaultViewByRole[account.role];
  persist();
  showToast(`${roleLabel(account.role)}としてログインしました。`);
}

function register(values: RegisterInput) {
  const email = values.email.trim();
  if (!values.name || !email || !values.password) {
    showToast("氏名、メールアドレス、パスワードを入力してください。");
    return;
  }
  if (values.password !== values.passwordConfirm) {
    showToast("確認用パスワードが一致しません。");
    return;
  }
  if (authAccounts.value.some((account) => account.email === email)) {
    showToast("このメールアドレスは登録済みです。");
    return;
  }

  const freelancerId = uid("fr");
  const account: Account = {
    email,
    password: values.password,
    role: "freelancer",
    name: values.name,
    startView: "profile",
    freelancerId
  };

  state.value.accounts = [...(state.value.accounts || []), account];
  state.value.profile = {
    ...blankProfile(freelancerId),
    name: values.name,
    email,
    phone: values.phone || "",
    role: values.role || "",
    lastUpdated: today()
  };
  state.value.wizardStep = 2;
  state.value.selectedFreelancerId = freelancerId;
  syncProfileToFreelancer();
  clearUnsavedChanges();
  loginWithAccount(account);
  showToast("会員登録が完了しました。続けてプロフィールを入力してください。");
}

function logout() {
  if (!confirmDiscardChanges()) return;
  const previousRole = currentRole.value;
  state.value.auth = null;
  state.value.activeView = previousRole ? defaultViewByRole[previousRole] : "jobs";
  persist();
  showToast("ログアウトしました。");
}

function saveProfileBasic(values: Pick<Profile, "name" | "email" | "phone" | "role">) {
  Object.assign(state.value.profile, values, { lastUpdated: today() });
  state.value.wizardStep = 2;
  syncProfileToFreelancer();
  saveAndNotify("簡易プロフィールを保存しました。");
}

function saveProfileSkills(values: Pick<Profile, "languages" | "db" | "frameworks" | "years">) {
  Object.assign(state.value.profile, values, { lastUpdated: today() });
  state.value.wizardStep = 3;
  syncProfileToFreelancer();
  saveAndNotify("スキル情報を保存しました。");
}

function saveProfileTerms(values: ProfileTermsInput) {
  Object.assign(state.value.profile, {
    desiredRate: values.desiredRate,
    startDate: values.startDate,
    workRate: values.workRate,
    remote: values.remote,
    availability: values.availability,
    lastUpdated: today()
  });

  if (values.resume?.name) {
    state.value.profile.resumeName = values.resume.name;
    state.value.profile.resumeType = values.resume.type || "application/octet-stream";
    state.value.profile.resumeSize = `${Math.ceil(values.resume.size / 1024)}KB`;
  }

  state.value.wizardStep = 4;
  syncProfileToFreelancer();
  saveAndNotify("稼働条件とレジュメを保存しました。");
}

function saveProfileMeeting(meetingCandidatesText: string) {
  const candidates = meetingCandidatesText.split("\n").map((candidate) => candidate.trim()).filter(Boolean);
  state.value.profile.meetingCandidates = candidates;
  state.value.profile.lastUpdated = today();
  state.value.meetingRequests = candidates.map((candidate, index) => ({
    id: state.value.meetingRequests[index]?.id || uid("meet"),
    freelancerId: state.value.profile.id,
    candidate,
    status: state.value.meetingRequests[index]?.status || "候補"
  }));
  syncProfileToFreelancer();
  clearUnsavedChanges();
  persist();
  setView("jobs");
  showToast("登録が完了しました。");
}

function resetProfile() {
  if (!confirmDiscardChanges()) return;
  const profileId = currentUser.value?.freelancerId || state.value.profile.id || "fr-current";
  state.value.profile = blankProfile(profileId);
  state.value.selectedFreelancerId = profileId;
  state.value.wizardStep = 1;
  state.value.activeView = "profile";
  state.value.freelancers = state.value.freelancers.filter((freelancer) => freelancer.id !== profileId);
  state.value.meetingRequests = state.value.meetingRequests.filter((meeting) => meeting.freelancerId !== profileId);
  persist();
  showToast("プロフィールを初期状態に戻しました。");
}

function createJob(values: JobInput) {
  state.value.jobs.unshift({
    id: uid("job"),
    title: values.title || "新規案件",
    client: values.client || "未設定",
    summary: values.summary || "",
    required: splitCsv(values.required),
    nice: splitCsv(values.nice),
    rateMin: Number(values.rateMin || 0),
    rateMax: Number(values.rateMax || 0),
    marginRate: Number(values.marginRate || 0),
    stream: values.stream,
    remote: values.remote,
    sortFlag: values.sortFlag,
    active: true
  });
  saveAndNotify("案件を登録しました。");
}

function clearJobFilter() {
  filters.value = { keyword: "", skill: "", rate: "", remote: "", stream: "" };
}

function clearScoutFilter() {
  scoutFilters.value = { skill: "", availability: "", remote: "" };
}

function applyJob(jobId: string) {
  if (currentRole.value !== "freelancer") {
    showToast("応募は求職者アカウントで利用できます。");
    return;
  }
  if (hasApplied(jobId)) return;

  state.value.applications.unshift({
    id: uid("app"),
    jobId,
    freelancerId: state.value.profile.id,
    status: "選考中",
    appliedAt: today()
  });
  persist();
  showToast("応募しました。営業管理に反映されています。");
}

function sendScout(freelancerId: string) {
  if (currentRole.value !== "sales") {
    showToast("スカウトは営業アカウントで利用できます。");
    return;
  }

  const freelancer = getFreelancer(freelancerId);
  if (!freelancer) return;

  state.value.messages.push({
    id: uid("msg"),
    from: "営業",
    to: freelancer.name,
    body: `${freelancer.role}向けの案件をご紹介したいです。稼働状況の確認をお願いします。`,
    at: nowLabel(),
    channel: "sales"
  });
  persist();
  showToast(`${freelancer.name}さんへスカウトを送信しました。`);
}

function selectPreview(freelancerId: string) {
  const freelancer = getFreelancer(freelancerId);
  state.value.previewFreelancerId = freelancer?.id || "";
  persist();
  showToast(`${freelancer?.resumeName || "レジュメ未登録"} を管理プレビューで確認中です。`);
}

function toggleJobSort(jobId: string) {
  const job = getJob(jobId);
  if (!job) return;
  job.sortFlag = !job.sortFlag;
  persist();
  showToast("並び替えフラグを更新しました。");
}

function toggleJobActive(jobId: string) {
  const job = getJob(jobId);
  if (!job) return;
  job.active = !job.active;
  persist();
  showToast("公開ステータスを更新しました。");
}

function changeApplicationStatus(applicationId: string, status: string) {
  if (currentRole.value !== "sales") {
    showToast("選考ステータスの更新は営業アカウントで利用できます。");
    return;
  }

  const item = state.value.applications.find((application) => application.id === applicationId);
  if (!item || !statuses.includes(status as ApplicationStatus)) return;
  item.status = status as ApplicationStatus;
  persist();
  showToast("選考ステータスを更新しました。");
}

function addMeeting(candidateValue: string) {
  if (!candidateValue) {
    showToast("候補日時を入力してください。");
    return;
  }

  state.value.meetingRequests.push({
    id: uid("meet"),
    freelancerId: state.value.profile.id,
    candidate: candidateValue.replace("T", " "),
    status: "候補"
  });
  saveAndNotify("面談候補を追加しました。");
}

function updateMeetingStatus(meetingId: string, status: "確定" | "再調整") {
  const item = state.value.meetingRequests.find((meeting) => meeting.id === meetingId);
  if (!item) return;
  item.status = status;
  persist();
  showToast("面談ステータスを更新しました。");
}

function sendMessage(body: string) {
  const trimmedBody = body.trim();
  if (!trimmedBody) {
    showToast("送信内容を入力してください。");
    return false;
  }

  const isSales = currentRole.value === "sales";
  state.value.messages.push({
    id: uid("msg"),
    from: isSales ? "営業" : state.value.profile.name,
    to: isSales ? state.value.profile.name : "営業",
    body: trimmedBody,
    at: nowLabel(),
    channel: isSales ? "sales" : "freelancer"
  });
  persist();
  showToast("メッセージを送信しました。");
  return true;
}

function aliveCheck() {
  if (currentRole.value !== "sales") {
    showToast("生存確認は営業アカウントで利用できます。");
    return;
  }

  const targets = state.value.freelancers.filter((freelancer) => {
    const daysOld = Math.floor((new Date(today()).getTime() - new Date(freelancer.lastUpdated).getTime()) / 86400000);
    return daysOld >= 14 || freelancer.availability !== "即稼働可";
  });
  state.value.aliveChecks.push({ id: uid("alive"), count: targets.length, at: nowLabel() });
  persist();
  showToast(`${targets.length}名に生存確認メールを送信しました。`);
}

function copyText(text: string) {
  navigator.clipboard?.writeText(text || location.href);
  showToast("共有用URLをコピーしました。");
}

function printSheet() {
  window.print();
}

function syncProfileToFreelancer() {
  const profile = state.value.profile;
  if (!hasProfileContent(profile)) return;

  const item: Freelancer = {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    skills: [...splitCsv(profile.languages), ...splitCsv(profile.frameworks), ...splitCsv(profile.db)],
    desiredRate: Number(profile.desiredRate || 0),
    workRate: profile.workRate,
    remote: profile.remote,
    availability: profile.availability,
    lastUpdated: profile.lastUpdated || today(),
    resumeName: profile.resumeName
  };

  const index = state.value.freelancers.findIndex((freelancer) => freelancer.id === profile.id);
  if (index >= 0) state.value.freelancers[index] = item;
  else state.value.freelancers.unshift(item);
}

function hasProfileContent(profile: Profile) {
  return Boolean(
    profile?.name
    || profile?.email
    || profile?.phone
    || profile?.role
    || profile?.languages
    || profile?.db
    || profile?.frameworks
    || profile?.years
    || profile?.desiredRate
    || profile?.startDate
    || profile?.resumeName
    || profile?.meetingCandidates?.length
  );
}

function hasApplied(jobId: string) {
  return state.value.applications.some((application) => application.jobId === jobId && application.freelancerId === state.value.profile.id);
}

function getFreelancer(id = "") {
  return state.value.freelancers.find((freelancer) => freelancer.id === id);
}

function getJob(id = "") {
  return state.value.jobs.find((job) => job.id === id);
}

function currentPreviewFreelancer() {
  return getFreelancer(state.value.previewFreelancerId) || getFreelancer(state.value.profile.id);
}

function estimateRate() {
  const years = Number(state.value.profile.years || 0);
  const skills = [state.value.profile.languages, state.value.profile.frameworks, state.value.profile.db].join(" ");
  const premium = ["AWS", "Kubernetes", "Go", "Spring Boot", "React"].filter((skill) => skills.includes(skill)).length * 4;
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

function maskName(name: string) {
  const text = String(name || "");
  return text ? `${text[0]}氏` : "匿名";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowLabel() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function uid(prefix: string) {
  const random = globalThis.crypto?.randomUUID?.().slice(0, 8) || Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

function markDirty() {
  hasUnsavedChanges.value = true;
}

function clearUnsavedChanges() {
  hasUnsavedChanges.value = false;
}

function confirmDiscardChanges() {
  if (!hasUnsavedChanges.value) return true;
  const shouldDiscard = window.confirm("保存していない入力内容があります。保存せずに移動すると入力内容が失われます。移動しますか？");
  if (shouldDiscard) clearUnsavedChanges();
  return shouldDiscard;
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
    hasUnsavedChanges,
    toastMessage,
    toastVisible,
    navItems,
    demoAccounts,
    statuses,
    flowOptions,
    remoteOptions,
    availabilityOptions,
    authAccounts,
    currentUser,
    currentRole,
    availableNavItems,
    filteredJobs,
    filteredFreelancers,
    selectedFreelancer,
    init,
    persist,
    canAccess,
    ensureActiveView,
    setAuthMode,
    setView,
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
    showToast,
    today
  };
}
