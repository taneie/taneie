<template>
  <FieldLabel :label="label">
    <AppSelect
      :name="name"
      :options="options"
      :model-value="modelValue"
      :placeholder="placeholder"
      :error="Boolean(error)"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <p v-if="error" :class="$style.error">{{ error }}</p>
  </FieldLabel>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  name: string;
  options: readonly string[];
  modelValue: string;
  placeholder?: string;
  error?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<style module>
.error {
  margin: 6px 0 0;
  color: #b8202d;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.45;
}
</style>
