<template>
  <article :class="$style.card">
    <div :class="$style.cardHead">
      <div>
        <h3>{{ freelancer.name }}</h3>
        <p>
          {{ freelancer.role }} / {{ freelancer.desiredRate }}万円 /
          {{ freelancer.workRate }} / {{ freelancer.remote }}
        </p>
      </div>
      <StatusBadge :value="freelancer.availability" />
    </div>

    <div :class="$style.tags">
      <TagBadge
        v-for="skill in freelancer.skills"
        :key="`${freelancer.id}-${skill}`"
        >{{ skill }}</TagBadge
      >
    </div>

    <p>
      最終更新 {{ freelancer.lastUpdated
      }}{{ daysOld >= 14 ? " / 更新確認対象" : "" }}
    </p>

    <div :class="$style.actions">
      <BaseButton icon="send" @click="$emit('scout', freelancer.id)"
        >スカウト</BaseButton
      >
      <BaseButton
        variant="secondary"
        icon="search"
        @click="$emit('preview', freelancer.id)"
        >レジュメ</BaseButton
      >
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTryangleFreelance } from "~/composables/useTryangleFreelance";
import type { Freelancer } from "~/composables/useTryangleFreelance";

const props = defineProps<{
  freelancer: Freelancer;
}>();

defineEmits<{
  scout: [freelancerId: string];
  preview: [freelancerId: string];
}>();

const { today } = useTryangleFreelance();

const daysOld = computed(() => {
  return Math.floor(
    (new Date(today()).getTime() -
      new Date(props.freelancer.lastUpdated).getTime()) /
      86400000,
  );
});
</script>

<style module>
.card {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 8px;
  padding: 14px;
  min-width: 0;
  box-shadow: 0 8px 22px rgba(29, 78, 137, 0.05);
}

.cardHead {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.card h3 {
  min-width: 0;
  margin: 0;
  color: #10294f;
  font-size: 17px;
}

.card p {
  margin: 8px 0;
  overflow-wrap: anywhere;
  color: var(--muted);
  line-height: 1.6;
}

.tags {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 6px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 14px;
}

@media (max-width: 620px) {
  .cardHead {
    display: grid;
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
