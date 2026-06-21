<template>
  <PageHead
    title="案件検索・応募"
    kicker="キーワード、スキル、単価、リモート、商流で絞り込みます。"
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
        <span>{{ item.done ? "完了" : "未完了" }}</span
        >{{ item.label }}
      </li>
    </ul>
    <BaseButton icon="user" @click="setView('profile')"
      >プロフィールを入力する</BaseButton
    >
  </section>

  <div v-else :class="[$style.grid, $style.two]">
    <section :class="$style.panel">
      <div :class="$style.panelHeader">
        <h2 :class="$style.panelTitle">検索条件</h2>
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
          <FormSelect
            v-model="filters.stream"
            label="商流"
            name="stream"
            :options="['', ...flowOptions]"
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
          @apply="applyJob"
          @open-admin="setView('admin')"
        />
        <div v-if="filteredJobs.length === 0 && !jobsLoading" :class="$style.empty">
          条件に合う案件がありません。
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

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useTryangleRuntime } from "~/composables/tryangle/useTryangleRuntime";

const {
  filters,
  filteredJobs,
  jobPagination,
  jobsLoading,
  currentRole,
  canViewJobs,
  profileRequirementItems,
  flowOptions,
  remoteOptions,
  clearJobFilter,
  searchJobs,
  loadMoreJobs,
  hasApplied,
  canApplyMoreJobs,
  applyJob,
  setView,
} = useTryangleRuntime();

const loadMoreTrigger = ref<HTMLElement | null>(null);
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
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid var(--line);
  color: #263f63;
  font-weight: 800;
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
}
</style>
