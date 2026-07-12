import { computed, nextTick, ref } from "vue";
import {
  API_BASE_FALLBACK,
  JOB_APPLICATION_LIMIT,
  JOB_PAGE_SIZE,
  STORAGE_KEY,
  TOKEN_KEY,
  availabilityOptions,
  cloudSkillOptions,
  dbSkillOptions,
  defaultViewByRole,
  demoAccounts,
  flowOptions,
  frameworkSkillOptions,
  languageSkillOptions,
  navItems,
  remoteOptions,
  roleTitleOptions,
  statuses,
} from "./constants";
import { blankProfile, createSeedState } from "./state";
import type {
  Account,
  ApiRequestOptions,
  Application,
  ApplicationStatus,
  AuthMode,
  ContactInquiry,
  ContactInquiryInput,
  Freelancer,
  Job,
  JobFilters,
  JobInput,
  JobListResponse,
  JobPagination,
  MeetingRequest,
  Message,
  Profile,
  ProfileTermsInput,
  RegisterInput,
  ResumePreviewFile,
  ResumeUploadIntent,
  Role,
  ScoutFilters,
  ScoutJobPickerState,
  FrichyState,
  ViewKey,
} from "./types";
import {
  availabilityClass,
  availabilityRank,
  categorizeSkills,
  clone,
  maskName,
  nowLabel,
  profileSkillList,
  sleep,
  splitCsv,
  streamTone,
  today,
  toApiDateTime,
} from "./utils";

function getApiBase() {
  const runtimeConfig = useRuntimeConfig();

  return String(runtimeConfig.public.apiBase || API_BASE_FALLBACK).replace(/\/$/, "");
}

const state = ref<FrichyState>(createSeedState());

const RESUME_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const RESUME_EXTENSION_MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

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
const selectedJobId = ref("");
const scoutFilters = ref<ScoutFilters>({
  skill: "",
  availability: "",
  remote: "",
});
const scoutJobPicker = ref<ScoutJobPickerState>({
  open: false,
  freelancerId: "",
  freelancerName: "",
  keyword: "",
  jobs: [],
  selectedJobId: "",
  loading: false,
});
const adminMatchedJobs = ref<Job[]>([]);
const adminMatchedJobsLoading = ref(false);
const adminMatchedFreelancerId = ref("");
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
const resumePreview = ref<ResumePreviewFile | null>(null);
const resumePreviewLoading = ref(false);
const resumePreviewError = ref("");
const meetingThreadMode = ref<"initial" | "job">("initial");
const activeMeetingApplicationId = ref("");
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

function scrollToPageTop() {
  if (!import.meta.client) return;
  const reset = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  reset();
  void nextTick(() => {
    reset();
    requestAnimationFrame(reset);
  });
}

function init() {
  if (initialized.value || !import.meta.client) return;

  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "null",
    ) as Partial<FrichyState> | null;
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
  base: FrichyState,
  saved: Partial<FrichyState>,
): FrichyState {
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

function normalizeLoadedState(loadedState: FrichyState): FrichyState {
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
  base: FrichyState,
): Message[] {
  return messages.map((message) => ({
    ...message,
    freelancerId:
      message.freelancerId || inferMessageFreelancerId(message, base),
  }));
}

function inferMessageFreelancerId(message: Message, base: FrichyState) {
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

async function rawApiRequest(path: string, options: ApiRequestOptions = {}) {
  const { silent = false, ...requestOptions } = options;
  const finishLoading = silent ? undefined : beginLoading();
  const headers = new Headers(options.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  try {
    const response = await fetch(`${getApiBase()}${path}`, {
      ...requestOptions,
      headers,
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error?.message || "API通信に失敗しました。");
    }
    return response;
  } finally {
    finishLoading?.();
  }
}

function getResumeUploadMaxBytes() {
  const runtimeConfig = useRuntimeConfig();
  const configured = Number(runtimeConfig.public.resumeUploadMaxBytes);

  return Number.isFinite(configured) && configured > 0
    ? configured
    : 10 * 1024 * 1024;
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${Math.ceil(bytes / 1024 / 1024)}MB`;

  return `${Math.ceil(bytes / 1024)}KB`;
}

function resolveResumeMimeType(file: File) {
  const extension = file.name.trim().toLowerCase().match(/\.[^.]+$/)?.[0] || "";

  return file.type || RESUME_EXTENSION_MIME_TYPES[extension] || "";
}

async function uploadResumeFile(file: File) {
  const maxBytes = getResumeUploadMaxBytes();
  const mimeType = resolveResumeMimeType(file);
  if (!RESUME_ALLOWED_MIME_TYPES.includes(mimeType)) {
    showToast("PDF、Word、Excelファイルのみアップロードできます。");
    return false;
  }
  if (file.size > maxBytes) {
    showToast(`ファイルサイズは${formatFileSize(maxBytes)}以内にしてください。`);
    return false;
  }

  const intent = await apiRequest<ResumeUploadIntent>("/resumes/upload-intent", {
    method: "POST",
    body: JSON.stringify({
      originalFilename: file.name,
      mimeType,
      fileSizeBytes: file.size,
    }),
  });
  const { upload } = await import("@vercel/blob/client");
  const multipart = file.size > 5 * 1024 * 1024;
  await rawApiRequest("/resumes/blob-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "blob.generate-client-token",
      payload: {
        pathname: intent.pathname,
        clientPayload: intent.clientPayload,
        multipart,
      },
    }),
  });
  const blob = await upload(intent.pathname, file, {
    access: "private",
    handleUploadUrl: `${getApiBase()}/resumes/blob-upload`,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    clientPayload: intent.clientPayload,
    contentType: mimeType,
    multipart,
  });
  await apiRequest("/resumes/complete", {
    method: "POST",
    body: JSON.stringify({
      originalFilename: file.name,
      mimeType,
      fileSizeBytes: file.size,
      blobPath: blob.pathname,
      blobUrl: blob.url,
    }),
  });

  return true;
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
  scrollToPageTop();
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
    const jobs = await apiRequest<Job[]>("/jobs").catch(() => []);
    state.value.jobs = jobs;
    jobPagination.value = {
      total: jobs.length,
      limit: jobs.length || JOB_PAGE_SIZE,
      offset: 0,
      hasMore: false,
    };
    const [freelancers, contactInquiries] = await Promise.all([
      apiRequest<Freelancer[]>("/freelancers"),
      apiRequest<ContactInquiry[]>("/contact-inquiries").catch(() => []),
    ]);
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
  const notification = new Notification("Frichy", {
    body: `${message.from || "相手"}: ${message.body}`,
    tag: `frichy-chat-${message.id}`,
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
    initialMeetingCompleted: Boolean(freelancer.initialMeetingCompleted),
    initialMeetingCompletedAt: freelancer.initialMeetingCompletedAt || "",
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
      step: 1,
      done: Boolean(p.name && p.email && p.phone && p.role),
    },
    {
      label: "スキル詳細",
      step: 2,
      done: Boolean(
        [
          p.languages,
          p.db,
          p.frameworks,
          p.cloud,
          p.otherSkills,
        ].some((value) => splitCsv(value).length) && p.years,
      ),
    },
    {
      label: "稼働条件",
      step: 3,
      done: Boolean(
        p.desiredRate &&
          p.startDate &&
          p.workRate &&
          p.remote &&
          p.availability,
      ),
    },
    { label: "レジュメ", step: 3, done: Boolean(p.resumeName) },
    {
      label: "面談候補",
      step: 4,
      done:
        state.value.meetingRequests.some(
          (meeting) => meeting.freelancerId === p.id,
        ) || Boolean(p.meetingCandidates.length),
    },
    { label: "誓約同意", step: 4, done: Boolean(p.pledgeAccepted || p.pledgedAt) },
  ];
});

const canViewJobs = computed(
  () =>
    currentRole.value !== "freelancer" ||
    profileRequirementItems.value.every((item) => item.done),
);

const appliedJobCount = computed(() => state.value.applications.length);

const canApplyMoreJobs = computed(
  () => appliedJobCount.value < JOB_APPLICATION_LIMIT,
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
      pledgedAt: profile.pledgedAt,
      initialMeetingCompleted: profile.initialMeetingCompleted,
      initialMeetingCompletedAt: profile.initialMeetingCompletedAt,
    };
  }

  return state.value.freelancers[0];
});

const currentFreelancerId = computed(
  () => currentUser.value?.freelancerId || state.value.profile.id,
);

const activeChatFreelancerId = computed(() => {
  if (currentRole.value === "freelancer") return currentFreelancerId.value;
  return (
    state.value.selectedFreelancerId || state.value.freelancers[0]?.id || ""
  );
});

const activeFreelancerApplications = computed(() =>
  state.value.applications.filter(
    (application) => application.freelancerId === activeChatFreelancerId.value,
  ),
);

const canUseJobMeeting = computed(() =>
  Boolean(selectedFreelancer.value?.initialMeetingCompleted),
);

const activeMeetingApplication = computed(() => {
  if (!activeFreelancerApplications.value.length) return undefined;
  return (
    activeFreelancerApplications.value.find(
      (application) => application.id === activeMeetingApplicationId.value,
    ) || activeFreelancerApplications.value[0]
  );
});

const activeMeetingJobId = computed(() =>
  meetingThreadMode.value === "job"
    ? activeMeetingApplication.value?.jobId || ""
    : "",
);

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

const currentUnreadChatCount = computed(
  () =>
    state.value.messages.filter(
      (message) => isIncomingMessage(message) && !message.readAt,
    ).length,
);

const activeMeetingRequests = computed(() => {
  const freelancerId = activeChatFreelancerId.value;
  if (!freelancerId) return [];
  return state.value.meetingRequests.filter((meeting) => {
    if (meeting.freelancerId !== freelancerId) return false;
    if (meetingThreadMode.value === "job") {
      return Boolean(activeMeetingJobId.value) && meeting.jobId === activeMeetingJobId.value;
    }
    return !meeting.applicationId;
  });
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
    scrollToPageTop();
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

async function openProfileStep(step: number) {
  if (!canAccess("profile")) {
    showToast("プロフィール画面は現在の権限では表示できません。");
    return;
  }

  if (state.value.activeView !== "profile" && !(await confirmDiscardChanges()))
    return;

  state.value.activeView = "profile";
  state.value.wizardStep = Math.min(Math.max(step, 1), 4);
  persist();
  scrollToPageTop();
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
  activeMeetingApplicationId.value =
    state.value.applications.find(
      (application) => application.freelancerId === freelancer.id,
    )?.id || "";
  void setView("meeting");
  void markActiveChatAsRead();
  persist();
}

function setMeetingThreadMode(mode: "initial" | "job") {
  if (mode === "job" && !activeFreelancerApplications.value.length) {
    meetingThreadMode.value = "initial";
    showToast("応募済み案件がないため案件チャットはまだ利用できません。");
    return;
  }
  meetingThreadMode.value = mode;
  if (mode === "job" && !activeMeetingApplicationId.value) {
    activeMeetingApplicationId.value =
      activeFreelancerApplications.value[0]?.id || "";
  }
  void markActiveChatAsRead();
}

function selectMeetingApplication(applicationId: string) {
  const exists = activeFreelancerApplications.value.some(
    (application) => application.id === applicationId,
  );
  if (!exists) return;
  activeMeetingApplicationId.value = applicationId;
  meetingThreadMode.value = "job";
  void markActiveChatAsRead();
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
    showToast(`${roleLabel(result.user.role)}ログインしました。`);
  } catch (error) {
    showToast(
      error instanceof Error
        ? error.message
        : "メールアドレスまたはパスワードが違います。",
    );
  }
}

async function requestPasswordReset(email: string) {
  try {
    const result = await apiRequest<{
      message: string;
      resetToken?: string;
      expiresAt?: string;
    }>("/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    showToast(result.message);
    return result;
  } catch (error) {
    showToast(
      error instanceof Error
        ? error.message
        : "パスワード再設定の申請に失敗しました。",
    );
    return null;
  }
}

async function confirmPasswordReset(token: string, password: string) {
  try {
    const result = await apiRequest<{ message: string }>(
      "/auth/password-reset/confirm",
      {
        method: "POST",
        body: JSON.stringify({ token, password }),
      },
    );
    showToast(result.message);
    return true;
  } catch (error) {
    showToast(
      error instanceof Error
        ? error.message
        : "パスワードの再設定に失敗しました。",
    );
    return false;
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
  scrollToPageTop();
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
        roleTitle: values.role,
        privacyPolicyAccepted: true,
      }),
    });
    clearUnsavedChanges();
    setAuth(result.token, result.user);
    state.value.activeView = "profile";
    state.value.wizardStep = 1;
    scrollToPageTop();
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
  scrollToPageTop();
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
  const hasSkill = [
    values.languages,
    values.db,
    values.frameworks,
    values.cloud,
    values.otherSkills,
  ].some((value) => splitCsv(value).length);

  if (!hasSkill) {
    showToast("スキルはチェックまたはその他を1つ以上入力してください。");
    return;
  }
  if (!String(values.years || "").trim()) {
    showToast("経験年数を入力してください。");
    return;
  }

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
    try {
      const uploaded = await uploadResumeFile(values.resume);
      if (!uploaded) return;
      state.value.profile.resumeName = values.resume.name;
      state.value.profile.resumeType =
        values.resume.type || "application/octet-stream";
      state.value.profile.resumeSize = formatFileSize(values.resume.size);
    } catch (error) {
      showToast(
        error instanceof Error
          ? `レジュメ保存に失敗しました。${error.message}`
          : "レジュメ保存に失敗しました。",
      );
      return;
    }
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
  scrollToPageTop();
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

  try {
    const application = await apiRequest<Application>("/applications", {
      method: "POST",
      body: JSON.stringify({ jobId }),
    });
    state.value.applications.unshift(application);
    persist();
    showToast("応募しました。営業管理に反映されています。");
  } catch (error) {
    showToast(error instanceof Error ? error.message : "応募に失敗しました。");
  }
}

async function openScoutJobPicker(freelancerId: string) {
  if (currentRole.value !== "sales") {
    showToast("スカウトは営業アカウントで利用できます。");
    return;
  }

  const freelancer = getFreelancer(freelancerId);
  if (!freelancer) return;

  scoutJobPicker.value = {
    open: true,
    freelancerId: freelancer.id,
    freelancerName: freelancer.name,
    keyword: "",
    jobs: [],
    selectedJobId: "",
    loading: false,
  };
  await searchScoutableJobs();
}

function closeScoutJobPicker() {
  scoutJobPicker.value = {
    open: false,
    freelancerId: "",
    freelancerName: "",
    keyword: "",
    jobs: [],
    selectedJobId: "",
    loading: false,
  };
}

async function searchScoutableJobs() {
  const picker = scoutJobPicker.value;
  if (!picker.freelancerId) return;

  picker.loading = true;
  try {
    const params = new URLSearchParams();
    const keyword = picker.keyword.trim();
    if (keyword) params.set("keyword", keyword);
    const query = params.toString();
    const jobs = await apiRequest<Job[]>(
      `/jobs/scoutable/${picker.freelancerId}${query ? `?${query}` : ""}`,
    );
    picker.jobs = jobs;
    picker.selectedJobId = jobs.some((job) => job.id === picker.selectedJobId)
      ? picker.selectedJobId
      : jobs[0]?.id || "";
  } catch (error) {
    picker.jobs = [];
    picker.selectedJobId = "";
    showToast(
      error instanceof Error
        ? error.message
        : "スカウト可能な案件の取得に失敗しました。",
    );
  } finally {
    picker.loading = false;
  }
}

async function loadAdminMatchedJobs(freelancerId = "") {
  if (currentRole.value !== "sales") return;

  const target = getFreelancer(freelancerId);
  if (!target) {
    adminMatchedFreelancerId.value = "";
    adminMatchedJobs.value = [];
    return;
  }

  adminMatchedFreelancerId.value = target.id;
  adminMatchedJobsLoading.value = true;
  try {
    const jobs = await apiRequest<Job[]>(`/jobs/scoutable/${target.id}`);
    adminMatchedJobs.value = jobs;
  } catch (error) {
    adminMatchedJobs.value = [];
    showToast(
      error instanceof Error
        ? error.message
        : "マッチ案件の取得に失敗しました。",
    );
  } finally {
    adminMatchedJobsLoading.value = false;
  }
}

function selectScoutJob(jobId: string) {
  scoutJobPicker.value.selectedJobId = jobId;
}

async function sendSelectedScout() {
  const { freelancerId, selectedJobId } = scoutJobPicker.value;
  if (!selectedJobId) {
    showToast("スカウトには案件の紐づけが必要です。");
    return;
  }

  await sendScout(freelancerId, selectedJobId);
}

async function sendScout(freelancerId: string, jobId: string) {
  if (currentRole.value !== "sales") {
    showToast("スカウトは営業アカウントで利用できます。");
    return;
  }

  const freelancer = getFreelancer(freelancerId);
  if (!freelancer) return;
  const job = getJob(jobId) || scoutJobPicker.value.jobs.find((item) => item.id === jobId);

  if (!job) {
    showToast("スカウトに紐づける案件を選択してください。");
    return;
  }

  try {
    const message = await apiRequest<Message>("/messages", {
      method: "POST",
      body: JSON.stringify({
        freelancerProfileId: freelancer.id,
        jobId: job.id,
        body: `「${job.title}」をご紹介したいです。${freelancer.role}のご経験と親和性が高いため、稼働状況の確認をお願いします。`,
        messageType: "scout",
      }),
    });
    state.value.messages.push(message);
    knownMessageIds.add(message.id);
    state.value.selectedFreelancerId = freelancer.id;
    if (!state.value.jobs.some((item) => item.id === job.id)) {
      state.value.jobs.push(job);
    }
    closeScoutJobPicker();
    persist();
    showToast(`${freelancer.name}さんへスカウトを送信しました。`);
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "スカウト送信に失敗しました。",
    );
  }
}

async function selectPreview(freelancerId: string) {
  const freelancer = getFreelancer(freelancerId);
  state.value.previewFreelancerId = freelancer?.id || "";
  resumePreview.value = null;
  resumePreviewError.value = "";
  persist();
  if (!freelancer?.id) return;
  if (!freelancer.resumeName) {
    resumePreviewError.value = "レジュメが登録されていません。";
    showToast("レジュメが登録されていません。");
    return;
  }
  resumePreviewLoading.value = true;
  try {
    resumePreview.value = await apiRequest<ResumePreviewFile>(
      `/resumes/freelancers/${freelancer.id}/preview`,
    );
    showToast(`${freelancer.resumeName} を管理プレビューで確認中です。`);
  } catch (error) {
    resumePreviewError.value =
      error instanceof Error
        ? error.message
        : "レジュメプレビューを取得できませんでした。";
    showToast(resumePreviewError.value);
  } finally {
    resumePreviewLoading.value = false;
  }
}

async function downloadResumePreview() {
  const freelancerId = state.value.previewFreelancerId;
  const fileName = resumePreview.value?.fileName || "resume";
  if (!freelancerId) return;
  try {
    const response = await rawApiRequest(
      `/resumes/freelancers/${freelancerId}/download`,
    );
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "レジュメをダウンロードできませんでした。",
    );
  }
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

async function sendApplicationFollowup(
  applicationId: string,
  introductionJobId: string,
  body: string,
) {
  if (currentRole.value !== "sales") {
    showToast("応募者への連絡は営業アカウントで利用できます。");
    return false;
  }

  const application = state.value.applications.find(
    (item) => item.id === applicationId,
  );
  if (!application) return false;

  const trimmedBody = body.trim();
  const sourceJob = getJob(application.jobId);
  const introductionJob = introductionJobId ? getJob(introductionJobId) : undefined;
  if (!trimmedBody && !introductionJob) {
    showToast("紹介案件または連絡内容を入力してください。");
    return false;
  }

  const messageBody = [
    `${sourceJob?.title || "応募案件"}の選考ステータスは「${application.status}」です。`,
    introductionJob
      ? `別途ご紹介したい案件: ${introductionJob.title} / ${introductionJob.rateMin}〜${introductionJob.rateMax}万円 / ${introductionJob.remote}`
      : "",
    trimmedBody,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const message = await apiRequest<Message>("/messages", {
      method: "POST",
      body: JSON.stringify({
        freelancerProfileId: application.freelancerId,
        body: messageBody,
        messageType: "chat",
      }),
    });
    state.value.messages.push(message);
    knownMessageIds.add(message.id);
    persist();
    showToast("応募者へチャット連絡を送信しました。");
    return true;
  } catch (error) {
    showToast(error instanceof Error ? error.message : "送信に失敗しました。");
    return false;
  }
}

async function addMeeting(candidateValue: string) {
  if (!candidateValue) {
    showToast("候補日時を入力してください。");
    return;
  }

  if (meetingThreadMode.value === "job") {
    if (!canUseJobMeeting.value) {
      showToast("案件面談は初回面談の完了後に利用できます。");
      return;
    }
    if (!activeMeetingApplication.value) {
      showToast("案件面談に紐づける応募案件を選択してください。");
      return;
    }
  }

  try {
    const meeting = await apiRequest<{
      id: string;
      freelancerProfileId: string;
      applicationId?: string;
      jobId?: string;
      candidateAt: string;
      status: string;
    }>("/meeting-requests", {
      method: "POST",
      body: JSON.stringify({
        freelancerProfileId:
          currentRole.value === "sales"
            ? activeChatFreelancerId.value
            : undefined,
        applicationId:
          meetingThreadMode.value === "job"
            ? activeMeetingApplication.value?.id
            : undefined,
        candidateAt: toApiDateTime(candidateValue),
      }),
    });
    const candidateLabel = meeting.candidateAt.replace("T", " ").slice(0, 16);
    state.value.meetingRequests.push({
      id: meeting.id,
      freelancerId: meeting.freelancerProfileId,
      applicationId: meeting.applicationId,
      jobId: meeting.jobId,
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
  if (!item) return false;
  try {
    await apiRequest(`/meeting-requests/${meetingId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    item.status = status;
    persist();
    showToast("面談ステータスを更新しました。");
    return true;
  } catch (error) {
    showToast(error instanceof Error ? error.message : "更新に失敗しました。");
    return false;
  }
}

async function updateInitialMeetingCompleted(
  freelancerId: string,
  completed: boolean,
) {
  if (currentRole.value !== "sales") {
    showToast("初回面談完了の更新は営業アカウントで利用できます。");
    return false;
  }

  try {
    const freelancer = await apiRequest<Freelancer>(
      `/freelancers/${freelancerId}/initial-meeting`,
      {
        method: "PATCH",
        body: JSON.stringify({ completed }),
      },
    );
    const index = state.value.freelancers.findIndex(
      (item) => item.id === freelancer.id,
    );
    if (index >= 0) state.value.freelancers[index] = freelancer;
    else state.value.freelancers.unshift(freelancer);

    if (state.value.profile.id === freelancer.id) {
      state.value.profile.initialMeetingCompleted =
        Boolean(freelancer.initialMeetingCompleted);
      state.value.profile.initialMeetingCompletedAt =
        freelancer.initialMeetingCompletedAt || "";
    }
    if (!freelancer.initialMeetingCompleted) {
      meetingThreadMode.value = "initial";
    }
    persist();
    showToast(
      freelancer.initialMeetingCompleted
        ? "初回面談を完了にしました。"
        : "初回面談の完了を解除しました。",
    );
    return true;
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "初回面談の更新に失敗しました。",
    );
    return false;
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

function downloadSheetPdf(publicId: string, mainSkills: string) {
  if (!import.meta.client) return;
  const canvas = renderAnonymousSheetCanvas(
    state.value.profile,
    publicId,
    mainSkills,
  );
  const jpeg = canvas.toDataURL("image/jpeg", 0.92);
  const imageBytes = base64ToBytes(jpeg.split(",")[1] || "");
  const pdf = createPdfFromJpeg(imageBytes, canvas.width, canvas.height);
  const url = URL.createObjectURL(pdf);
  const link = document.createElement("a");
  link.href = url;
  link.download = `anonymous-skill-sheet-${publicId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("匿名スキルシートPDFを出力しました。");
}

function renderAnonymousSheetCanvas(
  profile: Profile,
  publicId: string,
  mainSkills: string,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("PDF出力の準備に失敗しました。");

  const page = { width: canvas.width, height: canvas.height };
  const margin = 86;
  const labelWidth = 230;
  const bodyWidth = page.width - margin * 2;
  const valueWidth = bodyWidth - labelWidth;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, page.width, page.height);
  ctx.fillStyle = "#f1f6fd";
  ctx.fillRect(0, 0, page.width, 250);

  ctx.fillStyle = "#1d5fd3";
  ctx.font = '700 30px "Hiragino Sans", "Yu Gothic", sans-serif';
  ctx.fillText("Frichy", margin, 92);
  ctx.fillStyle = "#10294f";
  ctx.font = '700 54px "Hiragino Sans", "Yu Gothic", sans-serif';
  ctx.fillText("匿名スキルシート", margin, 164);
  ctx.fillStyle = "#49617d";
  ctx.font = '400 25px "Hiragino Sans", "Yu Gothic", sans-serif';
  ctx.fillText(`Public ID: ${publicId}`, margin, 214);

  let y = 322;
  ctx.fillStyle = "#10294f";
  ctx.font = '700 32px "Hiragino Sans", "Yu Gothic", sans-serif';
  ctx.fillText("候補者サマリー", margin, y);
  y += 36;
  ctx.strokeStyle = "#d6e2f0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, y);
  ctx.lineTo(page.width - margin, y);
  ctx.stroke();
  y += 28;

  const rows: Array<{ label: string; value: string }> = [
    { label: "職種", value: profile.role || "未登録" },
    { label: "経験年数", value: `${profile.years || "未登録"}年` },
    { label: "主要スキル", value: mainSkills || "未登録" },
    {
      label: "希望単価",
      value: profile.desiredRate ? `${profile.desiredRate}万円` : "未登録",
    },
    {
      label: "稼働条件",
      value: `${profile.startDate || "未登録"}開始 / ${profile.workRate || "未登録"} / ${profile.remote || "未登録"}`,
    },
    { label: "ステータス", value: profile.availability || "未登録" },
    { label: "人物確認", value: "Frichy営業による初回面談調整中" },
    {
      label: "匿名化",
      value: "氏名・メール・電話・固有社名は非表示。提案先へ共有しやすい内容に整形しています。",
    },
    {
      label: "レジュメ",
      value: profile.resumeName
        ? `${profile.resumeName} は営業管理画面で確認できます。`
        : "未登録",
    },
  ];

  rows.forEach((row, index) => {
    y = drawPdfRow(ctx, {
      x: margin,
      y,
      width: bodyWidth,
      labelWidth,
      valueWidth,
      label: row.label,
      value: row.value,
      alternate: index % 2 === 1,
    });
  });

  y += 54;
  ctx.fillStyle = "#10294f";
  ctx.font = '700 30px "Hiragino Sans", "Yu Gothic", sans-serif';
  ctx.fillText("補足", margin, y);
  y += 42;
  ctx.fillStyle = "#49617d";
  ctx.font = '400 24px "Hiragino Sans", "Yu Gothic", sans-serif';
  drawWrappedText(
    ctx,
    "本資料はクライアント提案用の匿名プロフィールです。詳細な職務経歴書、連絡先、本人確認情報はFrichy営業管理画面で確認してください。",
    margin,
    y,
    bodyWidth,
    38,
  );

  ctx.fillStyle = "#7a8ca3";
  ctx.font = '400 20px "Hiragino Sans", "Yu Gothic", sans-serif';
  ctx.fillText(`Generated: ${today()}`, margin, page.height - 72);
  ctx.fillText(
    "Frichy Confidential",
    page.width - 420,
    page.height - 72,
  );

  return canvas;
}

function drawPdfRow(
  ctx: CanvasRenderingContext2D,
  input: {
    x: number;
    y: number;
    width: number;
    labelWidth: number;
    valueWidth: number;
    label: string;
    value: string;
    alternate: boolean;
  },
) {
  ctx.font = '400 25px "Hiragino Sans", "Yu Gothic", sans-serif';
  const lines = wrapCanvasText(ctx, input.value, input.valueWidth - 48);
  const rowHeight = Math.max(82, lines.length * 34 + 40);

  ctx.fillStyle = input.alternate ? "#fbfdff" : "#ffffff";
  ctx.fillRect(input.x, input.y, input.width, rowHeight);
  ctx.fillStyle = "#eaf2fb";
  ctx.fillRect(input.x, input.y, input.labelWidth, rowHeight);

  ctx.strokeStyle = "#d6e2f0";
  ctx.lineWidth = 2;
  ctx.strokeRect(input.x, input.y, input.width, rowHeight);
  ctx.beginPath();
  ctx.moveTo(input.x + input.labelWidth, input.y);
  ctx.lineTo(input.x + input.labelWidth, input.y + rowHeight);
  ctx.stroke();

  ctx.fillStyle = "#18365f";
  ctx.font = '700 24px "Hiragino Sans", "Yu Gothic", sans-serif';
  ctx.fillText(input.label, input.x + 28, input.y + 50);

  ctx.fillStyle = "#10294f";
  ctx.font = '400 25px "Hiragino Sans", "Yu Gothic", sans-serif';
  lines.forEach((line, index) => {
    ctx.fillText(
      line,
      input.x + input.labelWidth + 24,
      input.y + 50 + index * 34,
    );
  });

  return input.y + rowHeight;
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  wrapCanvasText(ctx, text, maxWidth).forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const lines: string[] = [];
  text.split("\n").forEach((segment) => {
    let line = "";
    Array.from(segment).forEach((char) => {
      const candidate = line + char;
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = char;
        return;
      }
      line = candidate;
    });
    if (line) lines.push(line);
  });
  return lines;
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function createPdfFromJpeg(
  jpegBytes: Uint8Array,
  imageWidth: number,
  imageHeight: number,
) {
  const encoder = new TextEncoder();
  const chunks: BlobPart[] = [];
  const offsets: number[] = [];
  let length = 0;

  function appendText(text: string) {
    const bytes = encoder.encode(text);
    chunks.push(toArrayBuffer(bytes));
    length += bytes.length;
  }

  function appendBytes(bytes: Uint8Array) {
    chunks.push(toArrayBuffer(bytes));
    length += bytes.length;
  }

  function startObject(id: number) {
    offsets[id] = length;
    appendText(`${id} 0 obj\n`);
  }

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const content = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`;

  appendText("%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n");
  startObject(1);
  appendText("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  startObject(2);
  appendText("<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  startObject(3);
  appendText(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>\nendobj\n`,
  );
  startObject(4);
  appendText(`<< /Length ${encoder.encode(content).length} >>\nstream\n`);
  appendText(content);
  appendText("endstream\nendobj\n");
  startObject(5);
  appendText(
    `<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
  );
  appendBytes(jpegBytes);
  appendText("\nendstream\nendobj\n");

  const xrefOffset = length;
  appendText("xref\n0 6\n0000000000 65535 f \n");
  for (let id = 1; id <= 5; id += 1) {
    appendText(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  }
  appendText(
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  );

  return new Blob(chunks, { type: "application/pdf" });
}

function toArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
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
    pledgedAt: profile.pledgedAt,
    initialMeetingCompleted: profile.initialMeetingCompleted,
    initialMeetingCompletedAt: profile.initialMeetingCompletedAt,
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
      resumeType: previousProfile.resumeType,
      resumeSize: previousProfile.resumeSize,
      meetingCandidates: previousProfile.meetingCandidates,
      pledgeAccepted:
        nextProfile.pledgeAccepted || previousProfile.pledgeAccepted,
      pledgedAt: nextProfile.pledgedAt || previousProfile.pledgedAt,
    };
    syncProfileToFreelancer();
    clearUnsavedChanges();
    persist();
    if (currentRole.value === "freelancer") await fetchJobsPage({ reset: true });
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
  return (
    state.value.jobs.find((job) => job.id === id) ||
    state.value.applications.find((application) => application.jobId === id)
      ?.job
  );
}

function selectJob(jobId: string) {
  selectedJobId.value = jobId;
}

function upsertJobToTop(job: Job) {
  state.value.jobs = [
    job,
    ...state.value.jobs.filter((item) => item.id !== job.id),
  ];
}

async function openScoutJob(jobId: string) {
  if (!jobId) return;
  if (currentRole.value === "freelancer" && !canViewJobs.value) {
    await setView("jobs");
    return;
  }

  try {
    const job = getJob(jobId) || (await apiRequest<Job>(`/jobs/${jobId}`));
    upsertJobToTop(job);
    selectJob(job.id);
    const previousView = state.value.activeView;
    await setView("jobs");
    if (previousView === "jobs" || state.value.activeView === "jobs") {
      persist();
      scrollToPageTop();
      showToast("スカウトに紐づく案件を表示しました。");
    }
  } catch (error) {
    showToast(
      error instanceof Error
        ? error.message
        : "スカウト案件の取得に失敗しました。",
    );
  }
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

export function useFrichyRuntime() {
  return {
    state,
    filters,
    scoutFilters,
    scoutJobPicker,
    adminMatchedJobs,
    adminMatchedJobsLoading,
    adminMatchedFreelancerId,
    jobPagination,
    jobsLoading,
    selectedJobId,
    hasUnsavedChanges,
    isLoading,
    toastMessage,
    toastVisible,
    unsavedConfirmVisible,
    chatBannerVisible,
    chatBannerTitle,
    chatBannerBody,
    resumePreview,
    resumePreviewLoading,
    resumePreviewError,
    meetingThreadMode,
    activeMeetingApplicationId,
    navItems,
    demoAccounts,
    statuses,
    flowOptions,
    remoteOptions,
    availabilityOptions,
    roleTitleOptions,
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
    activeChatFreelancerId,
    activeFreelancerApplications,
    canUseJobMeeting,
    activeMeetingApplication,
    activeMeetingJobId,
    currentUnreadChatCount,
    chatFreelancers,
    activeChatMessages,
    activeMeetingRequests,
    init,
    persist,
    canAccess,
    ensureActiveView,
    setAuthMode,
    setView,
    openProfileStep,
    selectChatFreelancer,
    setMeetingThreadMode,
    selectMeetingApplication,
    login,
    requestPasswordReset,
    confirmPasswordReset,
    loginWithDemo,
    register,
    logout,
    saveProfileBasic,
    saveProfileSkills,
    saveProfileTerms,
    saveProfileMeeting,
    resetProfile,
    createJob,
    selectJob,
    clearJobFilter,
    searchJobs,
    loadMoreJobs,
    clearScoutFilter,
    applyJob,
    openScoutJobPicker,
    closeScoutJobPicker,
    searchScoutableJobs,
    loadAdminMatchedJobs,
    selectScoutJob,
    sendSelectedScout,
    sendScout,
    openScoutJob,
    selectPreview,
    downloadResumePreview,
    toggleJobSort,
    toggleJobActive,
    changeApplicationStatus,
    sendApplicationFollowup,
    addMeeting,
    updateMeetingStatus,
    updateInitialMeetingCompleted,
    sendMessage,
    submitContactInquiry,
    loadContactInquiries,
    answerContactInquiry,
    markActiveChatAsRead,
    aliveCheck,
    downloadSheetPdf,
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
    JOB_APPLICATION_LIMIT,
    appliedJobCount,
    canApplyMoreJobs,
  };
}
