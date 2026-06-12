<template>
  <article :class="$style.card">
    <div :class="$style.cardHead">
      <div>
        <h3>{{ job.title }}</h3>
        <p>
          {{ job.client }} / {{ job.rateMin }}-{{ job.rateMax }}万円 /
          マージン{{ job.marginRate ?? 12 }}% / {{ job.remote }}
        </p>
      </div>
      <TagBadge :tone="streamTone(job.stream)">{{ job.stream }}</TagBadge>
    </div>

    <p>{{ job.summary }}</p>

    <div :class="$style.tags">
      <TagBadge
        v-for="skill in job.required"
        :key="`required-${job.id}-${skill}`"
        >{{ skill }}</TagBadge
      >
      <TagBadge
        v-for="skill in job.nice"
        :key="`nice-${job.id}-${skill}`"
        tone="rose"
        >{{ skill }}</TagBadge
      >
    </div>

    <div :class="$style.actions">
      <BaseButton
        v-if="role === 'freelancer'"
        icon="send"
        :disabled="applied"
        @click="$emit('apply', job.id)"
      >
        {{ applied ? "応募済み" : "応募する" }}
      </BaseButton>
      <BaseButton
        v-else
        variant="secondary"
        icon="briefcase"
        @click="$emit('openAdmin')"
      >
        営業管理で確認
      </BaseButton>
    </div>
  </article>
</template>

<script setup lang="ts">
import { useTryangleFreelance } from "~/composables/useTryangleFreelance";
import type { Job, Role } from "~/composables/useTryangleFreelance";

defineProps<{
  job: Job;
  role: Role | null;
  applied: boolean;
}>();

defineEmits<{
  apply: [jobId: string];
  openAdmin: [];
}>();

const { streamTone } = useTryangleFreelance();
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
