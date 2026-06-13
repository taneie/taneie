<template>
  <FieldLabel :label="label">
    <AppInput
      :name="name"
      :type="type"
      :model-value="modelValue"
      :autocomplete="autocomplete"
      :required="required"
      :readonly="readonly"
      :placeholder="placeholder"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </FieldLabel>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    name: string;
    modelValue: string | number;
    type?: string;
    autocomplete?: string;
    placeholder?: string;
    required?: boolean;
    readonly?: boolean;
  }>(),
  {
    type: "text",
    autocomplete: undefined,
    placeholder: undefined,
    required: false,
    readonly: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>
