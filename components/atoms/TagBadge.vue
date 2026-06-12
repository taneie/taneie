<template>
  <span :class="[$style.tag, toneClass]"><slot /></span>
</template>

<script setup lang="ts">
import { computed, useCssModule } from "vue";

const props = withDefaults(
  defineProps<{
    tone?: "teal" | "blue" | "amber" | "rose" | "";
  }>(),
  {
    tone: "",
  },
);

const css = useCssModule();
const toneClass = computed(() => (props.tone ? css[props.tone] : ""));
</script>

<style module>
.tag {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-width: 0;
  min-height: 25px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #edf3fa;
  color: #38506f;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
  white-space: normal;
  overflow-wrap: anywhere;
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
