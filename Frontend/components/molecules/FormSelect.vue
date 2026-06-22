<template>
  <FieldLabel :label="label">
    <AppSelect
      :name="name"
      :options="options"
      :model-value="modelValue"
      :placeholder="placeholder"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </FieldLabel>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  name: string;
  options: string[];
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>
