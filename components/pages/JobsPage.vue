<template>
  <PageHead title="案件検索・応募" kicker="キーワード、スキル、単価、リモート、商流で絞り込みます。" />

  <div :class="[$style.grid, $style.two]">
    <section :class="$style.panel">
      <div :class="$style.panelHeader"><h2 :class="$style.panelTitle">検索条件</h2></div>
      <div :class="$style.panelBody">
        <form :class="[$style.formGrid, $style.one]" @submit.prevent>
          <FormInput v-model="filters.keyword" label="キーワード" name="keyword" />
          <FormInput v-model="filters.skill" label="スキル" name="skill" />
          <FormInput v-model="filters.rate" label="下限単価（万円）" name="rate" type="number" />
          <FormSelect v-model="filters.remote" label="リモート" name="remote" :options="['', ...remoteOptions]" />
          <FormSelect v-model="filters.stream" label="商流" name="stream" :options="['', ...flowOptions]" />
          <div :class="$style.actions">
            <BaseButton type="submit" icon="search">検索</BaseButton>
            <BaseButton variant="secondary" @click="clearJobFilter">クリア</BaseButton>
          </div>
        </form>
      </div>
    </section>

    <section :class="$style.panel">
      <div :class="$style.panelHeader">
        <h2 :class="$style.panelTitle">案件一覧 {{ filteredJobs.length }}件</h2>
      </div>
      <div :class="[$style.panelBody, $style.cardList]">
        <JobCard
          v-for="job in filteredJobs"
          :key="job.id"
          :job="job"
          :role="currentRole"
          :applied="hasApplied(job.id)"
          @apply="applyJob"
          @open-admin="setView('admin')"
        />
        <div v-if="filteredJobs.length === 0" :class="$style.empty">条件に合う案件がありません。</div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useTryangleFreelance } from "~/composables/useTryangleFreelance";
const {
  filters,
  filteredJobs,
  currentRole,
  flowOptions,
  remoteOptions,
  clearJobFilter,
  hasApplied,
  applyJob,
  setView
} = useTryangleFreelance();
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
  grid-template-columns: minmax(300px, 0.9fr) minmax(0, 1.4fr);
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

@media (max-width: 1180px) {
  .two {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .panelBody,
  .panelHeader {
    padding: 12px;
  }

  .formGrid,
  .actions {
    grid-template-columns: 1fr;
  }

  .actions {
    display: grid;
  }

  .actions button {
    width: 100%;
  }
}
</style>
