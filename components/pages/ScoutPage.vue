<template>
  <PageHead title="簡易スカウト" kicker="スキル・稼働状況・リモート条件で人材を検索し、サイト内メッセージで直接アプローチします。" />

  <div :class="[$style.grid, $style.two]">
    <section :class="$style.panel">
      <div :class="$style.panelHeader"><h2 :class="$style.panelTitle">人材検索</h2></div>
      <div :class="$style.panelBody">
        <form :class="[$style.formGrid, $style.one]" @submit.prevent>
          <FormInput v-model="scoutFilters.skill" label="スキル" name="skill" />
          <FormSelect v-model="scoutFilters.availability" label="提案可能ステータス" name="availability" :options="['', ...availabilityOptions]" />
          <FormSelect v-model="scoutFilters.remote" label="リモート" name="remote" :options="['', ...remoteOptions]" />
          <div :class="$style.actions">
            <BaseButton type="submit" icon="search">検索</BaseButton>
            <BaseButton variant="secondary" @click="clearScoutFilter">クリア</BaseButton>
          </div>
        </form>
      </div>
    </section>

    <section :class="$style.panel">
      <div :class="$style.panelHeader"><h2 :class="$style.panelTitle">候補者 {{ filteredFreelancers.length }}名</h2></div>
      <div :class="[$style.panelBody, $style.cardList]">
        <FreelancerCard
          v-for="freelancer in filteredFreelancers"
          :key="freelancer.id"
          :freelancer="freelancer"
          @scout="sendScout"
          @preview="selectPreview"
        />
        <div v-if="filteredFreelancers.length === 0" :class="$style.empty">該当する候補者がいません。</div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useTryangleFreelance } from "~/composables/useTryangleFreelance";
const {
  scoutFilters,
  filteredFreelancers,
  availabilityOptions,
  remoteOptions,
  clearScoutFilter,
  sendScout,
  selectPreview
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

  .actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .actions button {
    width: 100%;
  }
}
</style>
