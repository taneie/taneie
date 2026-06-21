<template>
  <PageHead
    title="営業オペレーション"
    kicker="案件・人材・応募・面談を一画面で把握します。"
  />

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
          条件に合う優先案件はありません。
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
            body="チャット履歴、匿名スキルシート、共有用URLを確認"
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
            条件に合う応募はありません。
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
import { useTryangleRuntime } from "~/composables/tryangle/useTryangleRuntime";

const {
  state,
  currentRole,
  setView,
  hasApplied,
  applyJob,
  aliveCheck,
  estimateRate,
  getFreelancer,
  getJob,
} = useTryangleRuntime();

const prioritySearch = ref("");
const applicationSearch = ref("");
const priorityLimit = ref(5);
const applicationLimit = ref(5);
const prioritySentinel = ref<HTMLElement | null>(null);
const applicationSentinel = ref<HTMLElement | null>(null);
let priorityObserver: IntersectionObserver | null = null;
let applicationObserver: IntersectionObserver | null = null;

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
  .two {
    grid-template-columns: 1fr;
  }

  .three,
  .metricRow {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .three,
  .metricRow {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
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
}
</style>
