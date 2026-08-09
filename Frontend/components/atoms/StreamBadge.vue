<template>
  <span :class="[$style.badge, toneClass]">{{ value }}</span>
</template>

<script setup lang="ts">
import { computed, useCssModule } from "vue";
import { streamTone } from "~/composables/frichy/utils";

const props = defineProps<{
  value: string;
}>();

const css = useCssModule();
const toneClass = computed(() => css[streamTone(props.value)] || "");
</script>

<style module>
.badge {
  display: inline-grid;
  place-items: center;
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  padding: 5px;
  border-radius: 50%;
  background: #edf3fa;
  color: #38506f;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.15;
  text-align: center;
  white-space: normal;
  word-break: keep-all;
  overflow-wrap: normal;
}

.teal {
  background: var(--cyan-weak);
  color: var(--cyan);
}

.blue {
  background: var(--primary-weak);
  color: var(--primary);
}

.amber {
  background: var(--amber-weak);
  color: var(--amber);
}

.rose {
  background: var(--rose-weak);
  color: var(--rose);
}
</style>
