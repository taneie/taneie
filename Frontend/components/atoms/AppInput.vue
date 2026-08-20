<template>
  <input
    :class="[$style.control, { [$style.invalid]: error }]"
    :name="name"
    :type="type"
    :value="modelValue"
    :autocomplete="autocomplete"
    :required="required"
    :readonly="readonly"
    :min="min"
    :max="max"
    :placeholder="placeholder"
    @input="onInput"
  />
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string;
    modelValue: string | number;
    type?: string;
    autocomplete?: string;
    placeholder?: string;
    required?: boolean;
    readonly?: boolean;
    min?: number;
    max?: number;
    error?: boolean;
  }>(),
  {
    type: "text",
    autocomplete: undefined,
    placeholder: undefined,
    required: false,
    readonly: false,
    min: undefined,
    max: undefined,
    error: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

function onInput(event: Event) {
  emit("update:modelValue", (event.target as HTMLInputElement).value);
}
</script>

<style module>
.control {
  width: 100%;
  border: 1px solid #c6d5e8;
  border-radius: 6px;
  min-height: 42px;
  padding: 10px 12px;
  background: #fff;
  color: var(--ink);
  font-size: 16px;
  line-height: 1.45;
  outline: none;
}

.control:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(29, 95, 211, 0.14);
}

.control:read-only {
  background: #f1f5f9;
  color: var(--muted);
  cursor: default;
}

.invalid {
  border-color: #d83f4b;
  background: #fff7f7;
}

.invalid:focus {
  border-color: #d83f4b;
  box-shadow: 0 0 0 3px rgba(216, 63, 75, 0.16);
}
</style>
