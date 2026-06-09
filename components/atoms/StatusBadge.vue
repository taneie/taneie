<template>
  <span :class="[$style.status, toneClass]">{{ value || "未設定" }}</span>
</template>

<script setup lang="ts">
import { computed, useCssModule } from "vue";
import { useTryangleFreelance } from "~/composables/useTryangleFreelance";
const props = defineProps<{
  value: string;
}>();

const { availabilityClass } = useTryangleFreelance();
const css = useCssModule();
const toneClass = computed(() => css[availabilityClass(props.value)] || css.pause);
</script>

<style module>
.status {
  min-width: 112px;
  text-align: center;
  border-radius: 999px;
  padding: 6px 9px;
  font-size: 12px;
  font-weight: 800;
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
