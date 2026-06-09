<template>
  <div v-if="freelancer" :class="$style.sheet">
    <h2>{{ freelancer.resumeName || "レジュメ未登録" }}</h2>
    <p>{{ freelancer.name }} / {{ freelancer.role }} / {{ freelancer.availability }}</p>
    <div :class="$style.sheetGrid">
      <div>スキル</div><div>{{ freelancer.skills.join(" / ") }}</div>
      <div>希望単価</div><div>{{ freelancer.desiredRate }}万円</div>
      <div>稼働率</div><div>{{ freelancer.workRate }}</div>
      <div>リモート</div><div>{{ freelancer.remote }}</div>
      <div>更新日</div><div>{{ freelancer.lastUpdated }}</div>
    </div>
  </div>
  <div v-else :class="$style.empty">応募者一覧からレジュメを選択してください。</div>
</template>

<script setup lang="ts">
import { useTryangleFreelance } from "~/composables/useTryangleFreelance";
import { computed } from "vue";
const { state, currentPreviewFreelancer } = useTryangleFreelance();

const freelancer = computed(() => {
  state.value.previewFreelancerId;
  state.value.freelancers;
  return currentPreviewFreelancer();
});
</script>

<style module>
.sheet {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 22px;
  line-height: 1.65;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.sheet h2 {
  margin: 0 0 10px;
  color: #10294f;
}

.sheet p {
  color: var(--muted);
}

.sheetGrid {
  display: grid;
  grid-template-columns: 160px 1fr;
  border-top: 1px solid var(--line);
  border-left: 1px solid var(--line);
  margin-top: 14px;
}

.sheetGrid div {
  padding: 10px;
  border-right: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.sheetGrid div:nth-child(odd) {
  background: var(--primary-soft);
  color: #18365f;
  font-weight: 800;
}

.empty {
  padding: 24px;
  color: var(--muted);
  border: 1px dashed #b7c9df;
  border-radius: 8px;
  background: #fbfdff;
  text-align: center;
}

@media (max-width: 620px) {
  .sheet {
    padding: 14px;
  }

  .sheetGrid {
    grid-template-columns: 1fr;
  }
}
</style>
