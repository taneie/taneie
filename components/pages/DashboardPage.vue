<template>
  <PageHead title="営業オペレーション" kicker="案件・人材・応募・面談を一画面で把握します。" />

  <section :class="$style.metricRow">
    <MetricCard label="登録ユーザー" :value="registeredUsers" caption="アカウント数" />
    <MetricCard label="掲載案件" :value="state.jobs.length" caption="商流付き" />
    <MetricCard label="即稼働人材" :value="readyFreelancers" caption="検索上位対象" />
    <MetricCard label="選考中応募" :value="activeApplications" caption="ステータス管理" />
    <MetricCard label="面談候補" :value="pendingMeetings" caption="未確定" />
  </section>

  <div :class="[$style.grid, $style.two]">
    <section :class="$style.panel">
      <div :class="$style.panelHeader">
        <h2 :class="$style.panelTitle">優先案件</h2>
        <BaseButton variant="ghost" icon="search" @click="setView('jobs')">案件を見る</BaseButton>
      </div>
      <div :class="[$style.panelBody, $style.cardList]">
        <JobCard
          v-for="job in priorityJobs"
          :key="job.id"
          :job="job"
          :role="currentRole"
          :applied="hasApplied(job.id)"
          @apply="applyJob"
          @open-admin="setView('admin')"
        />
      </div>
    </section>

    <section :class="$style.panel">
      <div :class="$style.panelHeader">
        <h2 :class="$style.panelTitle">営業チェック</h2>
        <BaseButton variant="ghost" icon="send" @click="aliveCheck">生存確認</BaseButton>
      </div>
      <div :class="$style.panelBody">
        <div :class="[$style.grid, $style.three]">
          <CoverageCard title="MVP" body="登録・案件検索・応募・案件管理・応募管理" tone="teal" />
          <CoverageCard title="営業効率化" :body="`商流フィルタ ${endDirectJobs}件 / 稼働ステータス`" tone="blue" />
          <CoverageCard title="差別化" body="チャット・匿名化・共有用URL" tone="amber" />
        </div>
        <div :class="[$style.grid, $style.three, $style.stackSm]">
          <CoverageCard title="単価診断" :body="`${state.profile.role} / 推奨 ${diagnosis.min}-${diagnosis.max}万円`" tone="rose" />
          <CoverageCard title="マージン率" body="案件カードと営業管理一覧で明記" tone="teal" />
          <CoverageCard title="生存確認" :body="`${state.aliveChecks.length}回送信 / 最新 ${state.aliveChecks.at(-1)?.at || '未送信'}`" tone="blue" />
        </div>
        <div :class="[$style.tableWrap, $style.stackMd]">
          <ApplicationsTable />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTryangleFreelance } from "~/composables/useTryangleFreelance";

const {
  state,
  demoAccounts,
  currentRole,
  setView,
  hasApplied,
  applyJob,
  aliveCheck,
  estimateRate
} = useTryangleFreelance();

const registeredUsers = computed(() => demoAccounts.length + state.value.accounts.length);
const readyFreelancers = computed(() => state.value.freelancers.filter((freelancer) => freelancer.availability === "即稼働可").length);
const endDirectJobs = computed(() => state.value.jobs.filter((job) => job.stream === "エンド直").length);
const activeApplications = computed(() => state.value.applications.filter((application) => application.status !== "成約" && application.status !== "見送り").length);
const pendingMeetings = computed(() => state.value.meetingRequests.filter((meeting) => meeting.status !== "確定").length);
const priorityJobs = computed(() => state.value.jobs.filter((job) => job.sortFlag));
const diagnosis = computed(() => estimateRate());
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
  grid-template-columns: minmax(300px, 0.9fr) minmax(0, 1.4fr);
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
}

.panelHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
}

.panelTitle {
  margin: 0;
  color: #10294f;
  font-size: 16px;
}

.panelBody {
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

  .tableWrap {
    overflow: visible;
  }
}
</style>
