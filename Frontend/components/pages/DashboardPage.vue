<template>
  <PageHead
    title="営業オペレーション"
    kicker="案件・人材・応募・面談を一画面で把握します。"
  />

  <section :class="$style.overviewBand">
    <div :class="$style.overviewCopy">
      <span :class="$style.eyebrow">営業サマリー</span>
      <h2>{{ dashboardHeadline }}</h2>
      <p>対応優先度の高い連絡、面談、応募を上から確認できます。</p>
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
      caption="アカウント数"
    />
    <MetricCard
      label="掲載案件"
      :value="state.jobs.length"
      caption="商流付き"
    />
    <MetricCard
      label="即稼働人材"
      :value="readyFreelancers"
      caption="検索上位対象"
    />
    <MetricCard
      label="選考中応募"
      :value="activeApplications"
      caption="ステータス管理"
    />
    <MetricCard label="面談候補" :value="pendingMeetings" caption="未確定" />
  </section>

  <details :class="$style.panel" open>
    <summary :class="$style.panelHeader">
      <div :class="$style.panelHeaderText">
        <h2 :class="$style.panelTitle">次のアクション</h2>
        <span :class="$style.panelNote">{{ salesNextActions.length }}件</span>
      </div>
    </summary>
    <div :class="[$style.panelBody, $style.actionList]">
      <div
        v-for="action in salesNextActions"
        :key="action.id"
        :class="$style.actionItem"
      >
        <div :class="$style.actionText">
          <span :class="$style.actionCount">{{ action.count }}</span>
          <div>
            <h3>{{ action.title }}</h3>
            <p>{{ action.body }}</p>
          </div>
        </div>
        <BaseButton
          variant="secondary"
          :icon="action.icon"
          @click="action.onClick"
        >
          {{ action.label }}
        </BaseButton>
      </div>
    </div>
  </details>

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
            :body="`商流フィルタ ${endDirectJobs}件 / 稼働ステータス`"
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
            title="マージン率"
            body="案件カードと営業管理一覧で明記"
            tone="teal"
          />
          <CoverageCard
            title="稼働状況確認"
            :body="`${state.aliveChecks.length}回確認 / 最新 ${state.aliveChecks.at(-1)?.at || '未実施'}`"
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
import type { IconName } from "~/composables/frichy/types";

const {
  state,
  currentRole,
  setView,
  selectChatFreelancer,
  hasApplied,
  applyJob,
  aliveCheck,
  estimateRate,
  getFreelancer,
  getJob,
  currentUnreadChatCount,
} = useFrichyRuntime();

const prioritySearch = ref("");
const applicationSearch = ref("");
const priorityLimit = ref(5);
const applicationLimit = ref(5);
const prioritySentinel = ref<HTMLElement | null>(null);
const applicationSentinel = ref<HTMLElement | null>(null);
let priorityObserver: IntersectionObserver | null = null;
let applicationObserver: IntersectionObserver | null = null;

interface SalesNextAction {
  id: string;
  title: string;
  body: string;
  count: string;
  label: string;
  icon: IconName;
  onClick: () => void;
}

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
const endDirectJobs = computed(
  () => state.value.jobs.filter((job) => job.stream === "エンド直").length,
);
const activeApplications = computed(
  () =>
    state.value.applications.filter(
      (application) =>
        application.status !== "成約" && application.status !== "見送り",
    ).length,
);
const pendingMeetings = computed(
  () =>
    state.value.meetingRequests.filter((meeting) => meeting.status !== "確定")
      .length,
);
const firstUnreadFreelancerId = computed(
  () =>
    state.value.messages.find(
      (message) =>
        message.channel === "freelancer" && !message.readAt && message.freelancerId,
    )?.freelancerId || "",
);
const latestAliveCheckAt = computed(() => state.value.aliveChecks.at(-1)?.at || "");
const dashboardHeadline = computed(() => {
  if (currentUnreadChatCount.value > 0) {
    return `未読チャット ${currentUnreadChatCount.value}件を確認してください`;
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
    value: `${currentUnreadChatCount.value}件`,
    caption: "求職者返信",
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
    caption: "未確定",
    tone: "Amber",
    onClick: () => void setView("meeting"),
  },
  {
    id: "applications",
    label: "選考中応募",
    value: `${activeApplications.value}件`,
    caption: "要ステータス管理",
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
const salesNextActions = computed<SalesNextAction[]>(() => {
  const actions: SalesNextAction[] = [];

  if (currentUnreadChatCount.value > 0) {
    actions.push({
      id: "unread-chat",
      title: "未読チャットの確認",
      body: "求職者からの返信を確認して、次の連絡を進めます。",
      count: `${currentUnreadChatCount.value}件`,
      label: "チャットへ",
      icon: "send",
      onClick: () => {
        if (firstUnreadFreelancerId.value) {
          selectChatFreelancer(firstUnreadFreelancerId.value);
          return;
        }
        void setView("meeting");
      },
    });
  }

  if (pendingMeetings.value > 0) {
    actions.push({
      id: "pending-meetings",
      title: "面談候補日の調整",
      body: "候補または再調整の面談を確認して、確定まで進めます。",
      count: `${pendingMeetings.value}件`,
      label: "面談へ",
      icon: "calendar",
      onClick: () => void setView("meeting"),
    });
  }

  if (activeApplications.value > 0) {
    actions.push({
      id: "active-applications",
      title: "選考中応募の更新",
      body: "応募状況を更新し、必要なフォロー連絡を行います。",
      count: `${activeApplications.value}件`,
      label: "応募管理へ",
      icon: "briefcase",
      onClick: () => void setView("admin"),
    });
  }

  actions.push({
    id: "alive-check",
    title: "稼働状況の確認",
    body: `即稼働人材へ確認を送信します。最新 ${latestAliveCheckAt.value || "未実施"}`,
    count: `${readyFreelancers.value}名`,
    label: "確認を送る",
    icon: "send",
    onClick: () => void aliveCheck(),
  });

  return actions;
});
const priorityJobs = computed(() => state.value.jobs.filter((job) => job.sortFlag));
const filteredPriorityJobs = computed(() => {
  const keyword = prioritySearch.value.trim().toLowerCase();
  if (!keyword) return priorityJobs.value;
  return priorityJobs.value.filter((job) =>
    [job.title, job.client, job.summary, job.stream, job.remote, ...job.required, ...job.nice]
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
  if (!keyword) return state.value.applications;
  return state.value.applications.filter((application) =>
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

watch(prioritySearch, () => {
  priorityLimit.value = 5;
});

watch(applicationSearch, () => {
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

.actionList {
  display: grid;
  gap: 10px;
}

.actionItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
}

.actionText {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.actionText h3 {
  margin: 0;
  color: #10294f;
  font-size: 15px;
}

.actionText p {
  margin: 3px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.actionCount {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  min-height: 40px;
  flex: 0 0 auto;
  border-radius: 6px;
  background: #e9f1fc;
  color: var(--primary-strong);
  font-size: 14px;
  font-weight: 800;
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

  .actionItem,
  .actionText {
    align-items: stretch;
    flex-direction: column;
  }

  .actionItem button {
    width: 100%;
  }

  .actionCount {
    width: 100%;
  }

  .emptyActions,
  .emptyActions button {
    width: 100%;
  }
}
</style>
