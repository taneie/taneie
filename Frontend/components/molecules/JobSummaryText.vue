<template>
  <div
    v-if="summaryDisplay.fullText"
    :class="[$style.summary, compact ? $style.compact : '']"
  >
    <p :class="$style.text">{{ summaryDisplay.text }}</p>
    <button
      v-if="summaryDisplay.isCollapsible"
      type="button"
      :class="$style.toggle"
      :aria-expanded="summaryExpanded"
      @click.stop="toggleSummary"
      @keydown.enter.stop
      @keydown.space.stop
    >
      {{ summaryExpanded ? "折りたたむ" : "詳細を見る" }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { toJobSummaryDisplay } from "~/composables/frichy/utils";

const props = withDefaults(
  defineProps<{
    summary: string;
    resetKey?: string;
    compact?: boolean;
  }>(),
  {
    resetKey: "",
    compact: false,
  },
);

const summaryExpanded = ref(false);
const summaryDisplay = computed(() =>
  toJobSummaryDisplay(props.summary, summaryExpanded.value),
);

watch(
  () => props.resetKey,
  () => {
    summaryExpanded.value = false;
  },
);

function toggleSummary() {
  summaryExpanded.value = !summaryExpanded.value;
}
</script>

<style module>
.summary {
  display: grid;
  gap: 8px;
  min-width: 0;
  margin: 10px 0;
}

.summary.compact {
  margin: 0;
}

.text {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.75;
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.compact .text {
  font-size: 13px;
  line-height: 1.65;
}

.toggle {
  justify-self: start;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--primary);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.4;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.toggle:focus-visible {
  outline: 3px solid rgba(29, 95, 211, 0.22);
  outline-offset: 3px;
  border-radius: 4px;
}
</style>
