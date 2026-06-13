<template>
  <label :class="$style.checkboxPill">
    <input
      type="checkbox"
      :checked="checked"
      :value="value"
      @change="onChange"
    />
    <span><slot>{{ value }}</slot></span>
  </label>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  modelValue: string[];
  value: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string[]];
  change: [];
}>();

const checked = computed(() => props.modelValue.includes(props.value));

function onChange(event: Event) {
  const isChecked = (event.target as HTMLInputElement).checked;
  const values = isChecked
    ? [...props.modelValue, props.value]
    : props.modelValue.filter((item) => item !== props.value);

  emit("update:modelValue", [...new Set(values)]);
  emit("change");
}
</script>

<style module>
.checkboxPill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid #bfd0e6;
  border-radius: 999px;
  background: #fff;
  color: #263f63;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.checkboxPill input {
  width: 15px;
  height: 15px;
  accent-color: var(--primary);
}
</style>
