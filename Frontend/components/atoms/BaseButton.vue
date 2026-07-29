<template>
  <button
    :type="type"
    :class="[$style.button, variantClass]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <AppIcon v-if="icon" :name="icon" />
    <span :class="$style.label"><slot /></span>
  </button>
</template>

<script setup lang="ts">
import { computed, useCssModule } from "vue";
import type { IconName } from "~/composables/frichy/types";

const props = withDefaults(
  defineProps<{
    type?: "button" | "submit" | "reset";
    variant?: "primary" | "secondary" | "ghost" | "warning";
    icon?: IconName;
    disabled?: boolean;
  }>(),
  {
    type: "button",
    variant: "primary",
    icon: undefined,
    disabled: false,
  },
);

defineEmits<{
  click: [event: MouseEvent];
}>();

const css = useCssModule();

const variantClass = computed(() => ({
  [css.secondary]: props.variant === "secondary",
  [css.ghost]: props.variant === "ghost",
  [css.warning]: props.variant === "warning",
}));
</script>

<style module>
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  max-width: 100%;
  min-width: 0;
  min-height: 40px;
  padding: 9px 14px;
  border-radius: 6px;
  background: linear-gradient(180deg, var(--primary), var(--primary-strong));
  color: white;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.35;
  text-align: center;
  box-shadow: 0 8px 18px rgba(29, 95, 211, 0.18);
}

.button svg {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}

.label {
  min-width: 0;
  overflow-wrap: anywhere;
}

.secondary {
  background: #e9f1fc;
  color: #18365f;
  box-shadow: none;
}

.ghost {
  background: transparent;
  color: var(--primary);
  border: 1px solid #a9c5ed;
  box-shadow: none;
}

.warning {
  background: var(--amber);
  box-shadow: none;
}
</style>
