<template>
  <PageHead
    :title="pageTitle"
    :kicker="pageKicker"
  />

  <section
    v-if="currentRole === 'freelancer' && !canViewJobs"
    :class="$style.lockPanel"
  >
    <div>
      <h2>案件閲覧にはプロフィール登録と誓約同意が必要です</h2>
      <p>
        案件情報にはクライアント情報や営業上の機密情報が含まれるため、以下の条件を満たすまで閲覧できません。
      </p>
    </div>
    <ul :class="$style.requirementList">
      <li
        v-for="item in profileRequirementItems"
        :key="item.label"
        :class="item.done ? $style.done : $style.pending"
      >
        <span>{{ item.done ? "完了" : "未完了" }}</span>
        <strong>{{ item.label }}</strong>
        <button
          v-if="!item.done"
          type="button"
          :class="$style.requirementAction"
          @click="openProfileStep(item.step)"
        >
          入力する
        </button>
      </li>
    </ul>
    <BaseButton icon="user" @click="openProfileStep(firstPendingProfileStep)"
      >プロフィールを入力する</BaseButton
    >
  </section>

  <template v-else>
    <section
      v-if="currentRole === 'freelancer'"
      :class="[$style.panel, $style.appliedPanel]"
    >
      <div :class="$style.panelHeader">
        <h2 :class="$style.panelTitle">応募済み案件</h2>
        <span :class="$style.resultCount">{{ appliedJobCards.length }}件</span>
      </div>
      <div :class="[$style.panelBody, $style.cardList]">
        <div
          v-for="item in appliedJobCards"
          :key="item.application.id"
          :class="$style.appliedItem"
        >
          <div :class="$style.applicationMeta">
            <TagBadge :tone="applicationStatusTone(item.application.status)">
              {{ applicationDisplayStatus(item.application.status) }}
            </TagBadge>
            <span>{{ item.application.appliedAt }} 応募</span>
          </div>
          <div :class="$style.applicationProgress">
            <ol>
              <li
                v-for="step in applicationFlowSteps(item.application.status)"
                :key="step.label"
                :class="[
                  step.done ? $style.flowDone : '',
                  step.current ? $style.flowCurrent : '',
                ]"
              >
                <span>{{ step.label }}</span>
              </li>
            </ol>
            <p>{{ applicationFlowNote(item.application.status) }}</p>
          </div>
          <JobCard
            :job="item.job"
            :role="currentRole"
            applied
            can-apply-more
            :selected="selectedJobId === item.job.id"
            @select="selectJob"
            @apply="applyJob"
            @open-admin="setView('admin')"
          />
        </div>
        <div v-if="appliedJobCards.length === 0" :class="$style.empty">
          <p>応募済み案件はまだありません。</p>
        </div>
      </div>
    </section>

    <div :class="[$style.grid, $style.two]">
      <section :class="$style.panel">
        <div :class="$style.panelHeader">
          <h2 :class="$style.panelTitle">{{ filterTitle }}</h2>
        </div>
        <div :class="$style.panelBody">
          <form :class="[$style.formGrid, $style.one]" @submit.prevent="searchJobs">
            <FormInput
              v-model="filters.keyword"
              label="キーワード"
              name="keyword"
            />
            <FormInput v-model="filters.skill" label="スキル" name="skill" />
            <FormInput
              v-model="filters.rate"
              label="下限単価（万円）"
              name="rate"
              type="number"
            />
            <FormSelect
              v-model="filters.remote"
              label="リモート"
              name="remote"
              :options="['', ...remoteOptions]"
            />
            <div :class="$style.actions">
              <BaseButton type="submit" icon="search">検索</BaseButton>
              <BaseButton variant="secondary" @click="clearJobFilter"
                >クリア</BaseButton
              >
            </div>
          </form>
        </div>
      </section>

      <section :class="$style.panel">
        <div :class="$style.panelHeader">
          <h2 :class="$style.panelTitle">案件一覧 {{ jobPagination.total }}件</h2>
          <span v-if="filteredJobs.length" :class="$style.resultCount">
            {{ filteredJobs.length }}件表示中
          </span>
        </div>
        <div :class="[$style.panelBody, $style.cardList]">
          <JobCard
            v-for="job in filteredJobs"
            :key="job.id"
            :job="job"
            :role="currentRole"
            :applied="hasApplied(job.id)"
            :can-apply-more="canApplyMoreJobs"
            :selected="selectedJobId === job.id"
            @select="selectJob"
            @apply="applyJob"
            @open-admin="setView('admin')"
          />
          <div v-if="filteredJobs.length === 0 && !jobsLoading" :class="$style.empty">
            <p>条件に合う案件がありません。</p>
            <div :class="$style.emptyActions">
              <BaseButton variant="secondary" @click="clearJobFilter">
                条件をクリア
              </BaseButton>
            </div>
          </div>
          <div ref="loadMoreTrigger" :class="$style.loadMoreSentinel" aria-hidden="true" />
          <div v-if="jobsLoading" :class="$style.loadingMore">
            案件を読み込んでいます...
          </div>
          <BaseButton
            v-else-if="jobPagination.hasMore"
            :class="$style.loadMoreButton"
            variant="secondary"
            @click="loadMoreJobs"
          >
            さらに10件表示
          </BaseButton>
        </div>
      </section>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useFrichyRuntime } from "~/composables/frichy/useFrichyRuntime";

const {
  state,
  filters,
  filteredJobs,
  appliedJobCards,
  jobPagination,
  jobsLoading,
  selectedJobId,
  currentRole,
  canViewJobs,
  profileRequirementItems,
  remoteOptions,
  clearJobFilter,
  searchJobs,
  loadMoreJobs,
  selectJob,
  hasApplied,
  canApplyMoreJobs,
  applyJob,
  setView,
  openProfileStep,
} = useFrichyRuntime();

const loadMoreTrigger = ref<HTMLElement | null>(null);
const firstPendingProfileStep = computed(
  () => profileRequirementItems.value.find((item) => !item.done)?.step || 1,
);
const pageTitle = computed(() =>
  currentRole.value === "sales" ? "案件情報" : "案件検索・応募",
);
const pageKicker = computed(() =>
  currentRole.value === "sales"
    ? "登録済み案件の条件、単価、スキル要件を確認します。"
    : "キーワード、スキル、単価、リモートで絞り込みます。",
);
const filterTitle = computed(() =>
  currentRole.value === "sales" ? "案件情報の絞り込み" : "検索条件",
);
const applicationFlowLabels = [
  "初回面談",
  "案件選考",
  "案件面談",
  "結果",
] as const;
type StatusTone = "" | "teal" | "blue" | "amber" | "rose";
let observer: IntersectionObserver | null = null;

onMounted(() => {
  if (typeof IntersectionObserver === "undefined") return;

  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting && jobPagination.value.hasMore && !jobsLoading.value) {
        void loadMoreJobs();
      }
    },
    { rootMargin: "240px 0px" },
  );

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value);
  }
});

onBeforeUnmount(() => {
  observer?.disconnect();
});

function applicationDisplayStatus(status: string) {
  if (
    currentRole.value === "freelancer" &&
    !state.value.profile.initialMeetingCompleted
  ) {
    return "初回面談待ち";
  }

  return isBeforeInitialMeetingStatus(status) ? "初回面談待ち" : status;
}

function applicationStatusTone(status: string): StatusTone {
  const displayStatus = applicationDisplayStatus(status);
  if (displayStatus === "成約") return "teal";
  if (displayStatus === "見送り") return "rose";
  if (displayStatus === "初回面談待ち") return "amber";
  return "blue";
}

function applicationFlowSteps(status: string) {
  const index = applicationFlowIndex(status);
  return applicationFlowLabels.map((label, stepIndex) => ({
    label,
    done:
      stepIndex < index ||
      (stepIndex === index && isFinalApplicationStatus(status)),
    current: stepIndex === index && !isFinalApplicationStatus(status),
  }));
}

function applicationFlowIndex(status: string) {
  const displayStatus = applicationDisplayStatus(status);
  if (displayStatus === "初回面談待ち") return 0;
  if (displayStatus === "選考中") return 1;
  if (displayStatus === "面談待ち") return 2;
  return 3;
}

function applicationFlowNote(status: string) {
  const displayStatus = applicationDisplayStatus(status);
  if (displayStatus === "初回面談待ち")
    return "まず営業担当との初回面談を行い、希望条件を確認したあと案件選考へ進みます。";
  if (displayStatus === "選考中")
    return "営業担当が案件との条件一致を確認しています。次に案件面談の調整へ進みます。";
  if (displayStatus === "面談待ち")
    return "案件面談の日程調整または面談実施待ちです。";
  if (displayStatus === "成約")
    return "参画が決定した案件です。";
  if (displayStatus === "見送り")
    return "今回は見送りとなった案件です。";
  return "営業担当が状況を確認しています。";
}

function isFinalApplicationStatus(status: string) {
  const displayStatus = applicationDisplayStatus(status);
  return displayStatus === "成約" || displayStatus === "見送り";
}

function isBeforeInitialMeetingStatus(status: string) {
  return status === "初回面談前" || status === "初回面談待ち";
}
</script>

<style module>
.grid {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.grid > *,
.formGrid > *,
.cardList > * {
  min-width: 0;
}

.two {
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.4fr);
}

.appliedPanel {
  margin-bottom: 16px;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
  min-width: 0;
  max-width: 100%;
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

.resultCount {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary-strong);
  font-size: 12px;
  font-weight: 900;
}

.panelBody {
  min-width: 0;
  max-width: 100%;
  padding: 16px;
}

.formGrid,
.cardList {
  display: grid;
  gap: 12px;
}

.appliedItem {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.applicationMeta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
}

.applicationProgress {
  display: grid;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #d2e0f1;
  border-radius: 8px;
  background: #f8fbff;
}

.applicationProgress ol {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.applicationProgress li {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 30px;
  border: 1px solid #c6d5e8;
  border-radius: 6px;
  padding: 4px 6px;
  background: #fff;
  color: #53657d;
  font-size: 12px;
  font-weight: 800;
  text-align: center;
  overflow-wrap: anywhere;
}

.flowDone {
  border-color: #b9ddc6;
  background: #f1fbf5;
  color: #236044;
}

.flowCurrent {
  border-color: #e8c36e;
  background: #fff9ed;
  color: #80560d;
}

.applicationProgress p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.6;
}

.one {
  grid-template-columns: 1fr;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 14px;
}

.empty {
  padding: 24px;
  color: var(--muted);
  border: 1px dashed #b7c9df;
  border-radius: 8px;
  background: #fbfdff;
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

.loadMoreSentinel {
  width: 100%;
  height: 1px;
  pointer-events: none;
}

.loadingMore {
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fbfdff;
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
  text-align: center;
}

.loadMoreButton {
  justify-self: center;
  min-width: min(240px, 100%);
}

@media (max-width: 620px) {
  .applicationProgress ol {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.lockPanel {
  display: grid;
  gap: 16px;
  max-width: 760px;
  border: 1px solid #b9cae2;
  border-radius: 8px;
  background: #f8fbff;
  box-shadow: var(--shadow);
  padding: 20px;
}

.lockPanel h2 {
  margin: 0 0 8px;
  color: #10294f;
  font-size: 20px;
}

.lockPanel p {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
}

.requirementList {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.requirementList li {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid var(--line);
  color: #263f63;
  font-weight: 800;
}

.requirementList strong {
  flex: 1 1 160px;
  min-width: 0;
}

.requirementList span {
  min-width: 58px;
  text-align: center;
  padding: 3px 7px;
  border-radius: 999px;
  color: #fff;
  font-size: 11px;
}

.done span {
  background: #1b8754;
}

.pending span {
  background: #c1741f;
}

.requirementAction {
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid #a9c5ed;
  border-radius: 6px;
  background: #fff;
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
}

@media (max-width: 980px) {
  .two {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .panelHeader,
  .panelBody,
  .lockPanel {
    padding: 14px;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .actions button,
  .loadMoreButton {
    width: 100%;
  }

  .emptyActions,
  .emptyActions button {
    width: 100%;
  }
}
</style>
