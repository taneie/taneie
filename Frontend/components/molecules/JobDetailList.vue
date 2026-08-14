<template>
  <dl v-if="details.length" :class="$style.details">
    <div v-for="detail in details" :key="detail.label" :class="$style.item">
      <dt>{{ detail.label }}</dt>
      <dd>{{ detail.value }}</dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Job } from "~/composables/frichy/types";

const props = defineProps<{ job: Job; compact?: boolean }>();

const details = computed(() => {
  const settlement = [props.job.settlementLower, props.job.settlementUpper]
    .filter(Boolean)
    .join("〜");
  const receivedAt = props.job.receivedAt
    ? new Intl.DateTimeFormat("ja-JP", {
        dateStyle: "medium",
        timeStyle: props.compact ? undefined : "short",
        timeZone: "Asia/Tokyo",
      }).format(new Date(props.job.receivedAt))
    : "";

  return [
    { label: "単価", value: props.job.unitPrice || `${props.job.rateMin}-${props.job.rateMax}万円` },
    { label: "精算幅", value: settlement },
    { label: "勤務地", value: props.job.location },
    { label: "開始時期", value: props.job.startPeriod },
    { label: "リモート", value: props.job.remoteRatio || props.job.remote },
    { label: "外国籍", value: props.job.foreignerAvailability },
    { label: "年齢制限", value: props.job.ageLimit },
    { label: "受信日時", value: receivedAt },
  ].filter((detail) => detail.value);
});
</script>

<style module>
.details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 16px;
  margin: 10px 0;
}

.item {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 8px;
  font-size: 13px;
  line-height: 1.55;
}

.item dt {
  color: var(--muted);
  font-weight: 700;
}

.item dd {
  margin: 0;
  color: var(--text);
  overflow-wrap: anywhere;
}

@media (max-width: 620px) {
  .details {
    grid-template-columns: 1fr;
  }
}
</style>
