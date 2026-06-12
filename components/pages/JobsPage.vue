<template>
  <PageHead title="案件検索・応募" kicker="キーワード、スキル、単価、リモート、商流で絞り込みます。" />

  <section v-if="currentRole === 'freelancer' && !canViewJobs" :class="$style.lockPanel">
    <div>
      <h2>案件閲覧にはプロフィール登録と誓約同意が必要です</h2>
      <p>案件情報にはクライアント情報や営業上の機密情報が含まれるため、以下の条件を満たすまで閲覧できません。</p>
    </div>
    <ul :class="$style.requirementList">
      <li v-for="item in profileRequirementItems" :key="item.label" :class="item.done ? $style.done : $style.pending">
        <span>{{ item.done ? '完了' : '未完了' }}</span>{{ item.label }}
      </li>
    </ul>
    <BaseButton icon="user" @click="setView('profile')">プロフィールを入力する</BaseButton>
  </section>

  <div v-else :class="[$style.grid, $style.two]">
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
  canViewJobs,
  profileRequirementItems,
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
  gap: 10px;
  align-items: center;
  color: #263f63;
}

.requirementList span {
  min-width: 56px;
  border-radius: 999px;
  padding: 3px 8px;
  text-align: center;
  font-size: 12px;
  font-weight: 800;
}

.done span {
  background: #d7f4ea;
  color: #08705d;
}

.pending span {
  background: #fff0d5;
  color: #8a5a00;
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

  .panelHeader {
    align-items: stretch;
  }

  .panelHeader button {
    width: 100%;
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
