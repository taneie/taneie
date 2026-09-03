<template>
  <PageHead
    title="営業オペレーション"
    kicker="案件・人材・応募・面談を一画面で把握します。"
  />

  <section :class="$style.overviewBand">
    <div :class="$style.overviewCopy">
      <span :class="$style.eyebrow">営業サマリー</span>
      <h2>{{ dashboardHeadline }}</h2>
      <p>
        {{ selectedSummaryMonthLabel }}の連絡、面談、応募を上から確認できます。
      </p>
      <div :class="$style.monthToolbar" aria-label="営業サマリーの対象月">
        <BaseButton variant="secondary" @click="moveSummaryMonth(-1)">
          前月
        </BaseButton>
        <span :class="$style.monthLabel">{{ selectedSummaryMonthLabel }}</span>
        <BaseButton
          variant="secondary"
          :disabled="isCurrentSummaryMonth"
          @click="moveSummaryMonth(1)"
        >
          翌月
        </BaseButton>
        <BaseButton
          v-if="!isCurrentSummaryMonth"
          variant="ghost"
          @click="resetSummaryMonth"
        >
          今月へ
        </BaseButton>
      </div>
    </div>
    <div :class="$style.focusGrid">
      <button
        v-for="item in dashboardFocusItems"
        :key="item.id"
        type="button"
        :class="[$style.focusCard, $style[`focus${item.tone}`]]"
        @click="item.onClick"
      >
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.caption }}</small>
      </button>
    </div>
  </section>

  <section :class="$style.metricRow">
    <MetricCard
      label="登録ユーザー"
      :value="registeredUsers"
      caption="全期間"
    />
    <MetricCard
      label="掲載案件"
      :value="state.jobs.length"
      caption="全期間"
    />
    <MetricCard
      label="即稼働人材"
      :value="readyFreelancers"
      caption="全期間"
    />
    <MetricCard
      label="選考中応募"
      :value="activeApplications"
      caption="対象月"
    />
    <MetricCard label="面談候補" :value="pendingMeetings" caption="対象月" />
  </section>

  <div :class="[$style.grid, $style.two]">
    <details :class="$style.panel" open>
      <summary :class="$style.panelHeader">
        <div :class="$style.panelHeaderText">
          <h2 :class="$style.panelTitle">優先案件</h2>
          <span :class="$style.panelNote">{{ filteredPriorityJobs.length }}件</span>
        </div>
        <div :class="$style.headerActions">
          <BaseButton variant="ghost" icon="search" @click.stop="setView('jobs')"
            >案件を見る</BaseButton
          >
        </div>
      </summary>
      <div :class="[$style.panelBody, $style.cardList]">
        <input
          v-model="prioritySearch"
          :class="$style.control"
          type="search"
          placeholder="案件名、顧客、スキルで検索"
        />
        <JobCard
          v-for="job in visiblePriorityJobs"
          :key="job.id"
          :job="job"
          :role="currentRole"
          :applied="hasApplied(job.id)"
          @apply="applyJob"
          @open-admin="setView('admin')"
        />
        <div v-if="!visiblePriorityJobs.length" :class="$style.empty">
          <p>条件に合う優先案件はありません。</p>
          <div :class="$style.emptyActions">
            <BaseButton
              v-if="prioritySearch"
              variant="secondary"
              @click="clearPrioritySearch"
            >
              条件をクリア
            </BaseButton>
            <BaseButton v-else variant="secondary" @click="setView('admin')">
              案件管理へ
            </BaseButton>
          </div>
        </div>
        <div
          ref="prioritySentinel"
          :class="$style.sentinel"
          aria-hidden="true"
        />
      </div>
    </details>

    <details :class="$style.panel" open>
      <summary :class="$style.panelHeader">
        <div :class="$style.panelHeaderText">
          <h2 :class="$style.panelTitle">提案前チェック</h2>
          <span :class="$style.panelNote">
            応募 {{ filteredApplications.length }}件
          </span>
        </div>
        <div :class="$style.headerActions">
          <BaseButton variant="ghost" icon="send" @click.stop="aliveCheck"
            >稼働状況を確認</BaseButton
          >
        </div>
      </summary>
      <div :class="$style.panelBody">
        <div :class="[$style.grid, $style.three]">
          <CoverageCard
            title="基本導線"
            body="登録、案件検索、応募、案件管理、応募管理が利用可能"
            tone="teal"
          />
          <CoverageCard
            title="案件候補"
            :body="`優先案件 ${priorityJobs.length}件 / 稼働ステータス`"
            tone="blue"
          />
          <CoverageCard
            title="提案資料"
            body="チャット履歴、匿名スキルシートを確認"
            tone="amber"
          />
        </div>
        <div :class="[$style.grid, $style.three, $style.stackSm]">
          <CoverageCard
            title="単価診断"
            :body="`${state.profile.role} / 推奨 ${diagnosis.min}-${diagnosis.max}万円`"
            tone="rose"
          />
          <CoverageCard
            title="稼働状況確認"
            :body="`${summaryAliveChecks.length}回確認 / 最新 ${latestAliveCheckAt || '未実施'}`"
            tone="blue"
          />
        </div>
        <div :class="[$style.stackMd, $style.cardList]">
          <input
            v-model="applicationSearch"
            :class="$style.control"
            type="search"
            placeholder="応募者、案件、ステータスで検索"
          />
          <DashboardApplicationCard
            v-for="application in visibleApplications"
            :key="application.id"
            :freelancer-name="getFreelancer(application.freelancerId)?.name || '不明'"
            :job-title="getJob(application.jobId)?.title || '不明な案件'"
            :status="application.status"
            :applied-at="application.appliedAt"
            @open-admin="setView('admin')"
          />
          <div v-if="!visibleApplications.length" :class="$style.empty">
            <p>条件に合う応募はありません。</p>
            <div :class="$style.emptyActions">
              <BaseButton
                v-if="applicationSearch"
                variant="secondary"
                @click="clearApplicationSearch"
              >
                条件をクリア
              </BaseButton>
              <BaseButton v-else variant="secondary" @click="setView('admin')">
                応募管理へ
              </BaseButton>
            </div>
          </div>
          <div
            ref="applicationSentinel"
            :class="$style.sentinel"
            aria-hidden="true"
          />
        </div>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useFrichyRuntime } from "~/composables/frichy/useFrichyRuntime";

const {
  state,
  salesVisibleApplications,
  currentRole,
  setView,
  selectChatFreelancer,
  hasApplied,
  applyJob,
  aliveCheck,
  estimateRate,
  getFreelancer,
  getJob,
} = useFrichyRuntime();

const prioritySearch = ref("");
const applicationSearch = ref("");
const priorityLimit = ref(5);
const applicationLimit = ref(5);
const currentSummaryMonth = getMonthKey(new Date());
const selectedSummaryMonth = ref(currentSummaryMonth);
const prioritySentinel = ref<HTMLElement | null>(null);
const applicationSentinel = ref<HTMLElement | null>(null);
let priorityObserver: IntersectionObserver | null = null;
let applicationObserver: IntersectionObserver | null = null;

interface DashboardFocusItem {
  id: string;
  label: string;
  value: string;
  caption: string;
  tone: "Blue" | "Teal" | "Amber" | "Rose";
  onClick: () => void;
}

const registeredUsers = computed(
  () => state.value.freelancers.length
);
const readyFreelancers = computed(
  () =>
    state.value.freelancers.filter(
      (freelancer) => freelancer.availability === "即稼働可",
    ).length,
);
const selectedSummaryMonthLabel = computed(() =>
  formatMonthLabel(selectedSummaryMonth.value),
);
const isCurrentSummaryMonth = computed(
  () => selectedSummaryMonth.value === currentSummaryMonth,
);
const summaryApplications = computed(() =>
  salesVisibleApplications.value.filter((application) =>
    isInSelectedSummaryMonth(application.appliedAt),
  ),
);
const summaryMessages = computed(() =>
  state.value.messages.filter((message) => isInSelectedSummaryMonth(message.at)),
);
const summaryMeetingRequests = computed(() =>
  state.value.meetingRequests.filter((meeting) =>
    isInSelectedSummaryMonth(meeting.candidate),
  ),
);
const summaryAliveChecks = computed(() =>
  state.value.aliveChecks.filter((check) => isInSelectedSummaryMonth(check.at)),
);
const activeApplications = computed(
  () =>
    summaryApplications.value.filter(
      (application) =>
        application.status !== "成約" && application.status !== "見送り",
    ).length,
);
const pendingMeetings = computed(
  () =>
    summaryMeetingRequests.value.filter((meeting) => meeting.status !== "確定")
      .length,
);
const firstUnreadFreelancerId = computed(
  () =>
    summaryMessages.value.find(
      (message) =>
        message.channel === "freelancer" && !message.readAt && message.freelancerId,
    )?.freelancerId || "",
);
const monthlyUnreadChatCount = computed(
  () =>
    summaryMessages.value.filter(
      (message) =>
        message.channel === "freelancer" && !message.readAt && message.freelancerId,
    ).length,
);
const latestAliveCheckAt = computed(() => summaryAliveChecks.value.at(-1)?.at || "");
const dashboardHeadline = computed(() => {
  if (monthlyUnreadChatCount.value > 0) {
    return `未読チャット ${monthlyUnreadChatCount.value}件を確認してください`;
  }
  if (pendingMeetings.value > 0) {
    return `未確定の面談候補が ${pendingMeetings.value}件あります`;
  }
  if (activeApplications.value > 0) {
    return `選考中応募 ${activeApplications.value}件を更新できます`;
  }
  return "営業状況は落ち着いています";
});
const dashboardFocusItems = computed<DashboardFocusItem[]>(() => [
  {
    id: "unread",
    label: "未読チャット",
    value: `${monthlyUnreadChatCount.value}件`,
    caption: "対象月",
    tone: "Blue",
    onClick: () => {
      if (firstUnreadFreelancerId.value) {
        selectChatFreelancer(firstUnreadFreelancerId.value);
        return;
      }
      void setView("meeting");
    },
  },
  {
    id: "meeting",
    label: "面談候補",
    value: `${pendingMeetings.value}件`,
    caption: "対象月",
    tone: "Amber",
    onClick: () => void setView("meeting"),
  },
  {
    id: "applications",
    label: "選考中応募",
    value: `${activeApplications.value}件`,
    caption: "対象月",
    tone: "Rose",
    onClick: () => void setView("admin"),
  },
  {
    id: "ready",
    label: "即稼働人材",
    value: `${readyFreelancers.value}名`,
    caption: "スカウト候補",
    tone: "Teal",
    onClick: () => void setView("scout"),
  },
]);
const priorityJobs = computed(() => state.value.jobs.filter((job) => job.sortFlag));
const filteredPriorityJobs = computed(() => {
  const keyword = prioritySearch.value.trim().toLowerCase();
  if (!keyword) return priorityJobs.value;
  return priorityJobs.value.filter((job) =>
    [job.title, job.client, job.summary, job.remote, ...job.required, ...job.nice]
      .join(" ")
      .toLowerCase()
      .includes(keyword),
  );
});
const visiblePriorityJobs = computed(() =>
  filteredPriorityJobs.value.slice(0, priorityLimit.value),
);
const diagnosis = computed(() => estimateRate());
const filteredApplications = computed(() => {
  const keyword = applicationSearch.value.trim().toLowerCase();
  if (!keyword) return summaryApplications.value;
  return summaryApplications.value.filter((application) =>
    [
      application.status,
      application.appliedAt,
      getFreelancer(application.freelancerId)?.name || "",
      getFreelancer(application.freelancerId)?.role || "",
      getJob(application.jobId)?.title || "",
      getJob(application.jobId)?.client || "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(keyword),
  );
});
const visibleApplications = computed(() =>
  filteredApplications.value.slice(0, applicationLimit.value),
);

function clearPrioritySearch() {
  prioritySearch.value = "";
}

function clearApplicationSearch() {
  applicationSearch.value = "";
}

function moveSummaryMonth(amount: number) {
  selectedSummaryMonth.value = addMonths(selectedSummaryMonth.value, amount);
}

function resetSummaryMonth() {
  selectedSummaryMonth.value = currentSummaryMonth;
}

function isInSelectedSummaryMonth(value: string) {
  return getMonthKey(value) === selectedSummaryMonth.value;
}

function getMonthKey(value: Date | string) {
  if (value instanceof Date) {
    return `${value.getFullYear()}-${padMonth(value.getMonth() + 1)}`;
  }
  return String(value || "").trim().slice(0, 7);
}

function addMonths(monthKey: string, amount: number) {
  const [year = "0", month = "1"] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1 + amount, 1);
  return getMonthKey(date);
}

function formatMonthLabel(monthKey: string) {
  const [year = "", month = ""] = monthKey.split("-");
  return `${year}年${Number(month)}月`;
}

function padMonth(value: number) {
  return String(value).padStart(2, "0");
}

watch(prioritySearch, () => {
  priorityLimit.value = 5;
});

watch(applicationSearch, () => {
  applicationLimit.value = 5;
});

watch(selectedSummaryMonth, () => {
  applicationLimit.value = 5;
});

onMounted(() => {
  if (typeof IntersectionObserver === "undefined") return;

  priorityObserver = new IntersectionObserver(([entry]) => {
    if (
      entry?.isIntersecting &&
      priorityLimit.value < filteredPriorityJobs.value.length
    ) {
      priorityLimit.value += 5;
    }
  });
  applicationObserver = new IntersectionObserver(([entry]) => {
    if (
      entry?.isIntersecting &&
      applicationLimit.value < filteredApplications.value.length
    ) {
      applicationLimit.value += 5;
    }
  });

  if (prioritySentinel.value) priorityObserver.observe(prioritySentinel.value);
  if (applicationSentinel.value)
    applicationObserver.observe(applicationSentinel.value);
});

onBeforeUnmount(() => {
  priorityObserver?.disconnect();
  applicationObserver?.disconnect();
});
</script>

<style module>
.grid {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.grid > *,
.metricRow > *,
.cardList > * {
  min-width: 0;
}

.overviewBand {
  display: grid;
  grid-template-columns: minmax(260px, 0.8fr) minmax(0, 1.2fr);
  gap: 16px;
  align-items: stretch;
  margin-bottom: 16px;
  padding: 18px;
  border: 1px solid #cfe0f4;
  border-radius: 8px;
  background: linear-gradient(135deg, #f7fbff 0%, #eef6ff 100%);
  box-shadow: var(--shadow);
}

.overviewCopy {
  display: grid;
  align-content: center;
  gap: 8px;
  min-width: 0;
}

.eyebrow {
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
}

.overviewCopy h2 {
  margin: 0;
  color: #10294f;
  font-size: 22px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.overviewCopy p {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}

.monthToolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.monthLabel {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid #b9cfee;
  border-radius: 6px;
  background: #fff;
  color: #10294f;
  font-size: 14px;
  font-weight: 900;
}

.focusGrid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  min-width: 0;
}

.focusCard {
  display: grid;
  gap: 5px;
  min-width: 0;
  padding: 12px;
  text-align: left;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(29, 78, 137, 0.06);
}

.focusCard span,
.focusCard small {
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.focusCard strong {
  color: #10294f;
  font-size: 20px;
  line-height: 1.2;
}

.focusCard:hover,
.focusCard:focus-visible {
  border-color: var(--primary);
  outline: none;
  box-shadow:
    0 0 0 3px rgba(29, 78, 137, 0.14),
    0 10px 22px rgba(29, 78, 137, 0.12);
}

.focusBlue {
  border-top: 4px solid #1d5fd3;
}

.focusTeal {
  border-top: 4px solid #0f8f7e;
}

.focusAmber {
  border-top: 4px solid #c87900;
}

.focusRose {
  border-top: 4px solid #c2415b;
}

.two {
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.4fr);
}

.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
  min-width: 0;
  max-width: 100%;
}

.panel > summary {
  cursor: pointer;
  list-style: none;
}

.panel > summary::-webkit-details-marker {
  display: none;
}

.panel > summary::after {
  content: "";
  width: 9px;
  height: 9px;
  flex: 0 0 auto;
  border-right: 2px solid #46627f;
  border-bottom: 2px solid #46627f;
  transform: rotate(45deg);
  transition: transform 0.16s ease;
}

.panel[open] > summary::after {
  transform: rotate(225deg);
}

.panelHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
}

.panelTitle {
  min-width: 0;
  margin: 0;
  color: #10294f;
  font-size: 16px;
  overflow-wrap: anywhere;
}

.panelHeaderText {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.panelNote {
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
}

.headerActions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: auto;
}

.panelBody {
  min-width: 0;
  max-width: 100%;
  padding: 16px;
}

.metricRow,
.cardList {
  display: grid;
  gap: 10px;
}

.metricRow {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  margin-bottom: 16px;
}

.tableWrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  min-width: 0;
  max-width: 100%;
}

.control {
  width: 100%;
  border: 1px solid #c6d5e8;
  border-radius: 6px;
  padding: 10px 11px;
  background: #fff;
  color: var(--ink);
  outline: none;
}

.control:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(29, 95, 211, 0.14);
}

.empty {
  padding: 18px;
  border: 1px dashed #b7c9df;
  border-radius: 8px;
  background: #fbfdff;
  color: var(--muted);
  text-align: center;
}

.empty p {
  margin: 0;
}

.emptyActions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.sentinel {
  width: 100%;
  height: 1px;
}

.stackSm {
  margin-top: 12px;
}

.stackMd {
  margin-top: 16px;
}

@media (max-width: 1180px) {
  .overviewBand {
    grid-template-columns: 1fr;
  }

  .two {
    grid-template-columns: 1fr;
  }

  .three,
  .metricRow,
  .focusGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .three,
  .metricRow,
  .focusGrid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .overviewBand {
    padding: 12px;
  }

  .monthToolbar,
  .monthToolbar button,
  .monthLabel {
    width: 100%;
  }

  .panelBody,
  .panelHeader {
    padding: 12px;
  }

  .panelHeader {
    align-items: stretch;
  }

  .panelHeader button {
    width: 100%;
  }

  .tableWrap {
    overflow: visible;
  }

  .headerActions,
  .headerActions button {
    width: 100%;
  }

  .emptyActions,
  .emptyActions button {
    width: 100%;
  }
}
</style>
