<template>
  <section :class="$style.panel">
    <div :class="$style.panelHeader">
      <h2 :class="$style.panelTitle">候補者 {{ freelancers.length }}名</h2>
    </div>
    <div :class="[$style.panelBody, $style.cardList]">
      <FreelancerCard
        v-for="freelancer in freelancers"
        :key="freelancer.id"
        :freelancer="freelancer"
        @scout="emit('scout', $event)"
        @preview="emit('preview', $event)"
      />
      <div v-if="freelancers.length === 0" :class="$style.empty">
        <p>該当する候補者がいません。</p>
        <div :class="$style.emptyActions">
          <BaseButton variant="secondary" @click="emit('clear')">
            条件をクリア
          </BaseButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Freelancer } from "~/composables/frichy/types";

defineProps<{
  freelancers: Freelancer[];
}>();

const emit = defineEmits<{
  scout: [freelancerId: string];
  preview: [freelancerId: string];
  clear: [];
}>();
</script>

<style module>
.panel {
  min-width: 0;
  max-width: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
}

.panelHeader {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
}

.panelTitle {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  color: #10294f;
  font-size: 16px;
}

.panelBody {
  min-width: 0;
  max-width: 100%;
  padding: 16px;
}

.cardList {
  display: grid;
  gap: 12px;
}

.cardList > * {
  min-width: 0;
}

.empty {
  padding: 24px;
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
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}

@media (max-width: 620px) {
  .panelHeader,
  .panelBody {
    padding: 12px;
  }

  .panelHeader {
    align-items: stretch;
  }

  .emptyActions,
  .emptyActions button {
    width: 100%;
  }
}
</style>
