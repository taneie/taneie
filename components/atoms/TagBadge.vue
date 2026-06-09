<template>
  <span :class="[$style.tag, toneClass]"><slot /></span>
</template>

<script setup lang="ts">
import { computed, useCssModule } from "vue";

const props = withDefaults(defineProps<{
  tone?: "teal" | "blue" | "amber" | "rose" | "";
}>(), {
  tone: ""
});

const css = useCssModule();
const toneClass = computed(() => props.tone ? css[props.tone] : "");
</script>

<style module>
.tag {
  display: inline-flex;
  align-items: center;
  min-height: 25px;
  padding: 0 8px;
  border-radius: 999px;
  background: #edf3fa;
  color: #38506f;
  font-size: 12px;
  font-weight: 700;
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
