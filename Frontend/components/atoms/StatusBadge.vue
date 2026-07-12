<template>
  <span :class="[$style.status, toneClass]">{{ value || "未設定" }}</span>
</template>

<script setup lang="ts">
import { computed, useCssModule } from "vue";
import { useFrichyRuntime } from "~/composables/freelink/useFrichyRuntime";
const props = defineProps<{
  value: string;
}>();

const { availabilityClass } = useFrichyRuntime();
const css = useCssModule();
const toneClass = computed(
  () => css[availabilityClass(props.value)] || css.pause,
);
</script>

<style module>
.status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  min-width: 0;
  border-radius: 999px;
  padding: 6px 9px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.35;
  text-align: center;
  white-space: normal;
  overflow-wrap: anywhere;
}

.ready {
  background: var(--green-weak);
  color: var(--green);
}

.soon {
  background: var(--amber-weak);
  color: var(--amber);
}

.pause {
  background: #e9eef6;
  color: #5a6673;
}
</style>
