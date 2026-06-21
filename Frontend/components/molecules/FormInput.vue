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
      :error="Boolean(error)"
      @update:model-value="emit('update:modelValue', $event)"
    />
    <p v-if="error" :class="$style.error">{{ error }}</p>
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
    error?: string;
  }>(),
  {
    type: "text",
    autocomplete: undefined,
    placeholder: undefined,
    required: false,
    readonly: false,
    error: "",
  },
);

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
