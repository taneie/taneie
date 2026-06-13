<template>
  <textarea
    :class="$style.control"
    :name="name"
    :value="modelValue"
    :placeholder="placeholder"
    :required="required"
    :readonly="readonly"
    @input="onInput"
  ></textarea>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string;
    modelValue: string;
    placeholder?: string;
    required?: boolean;
    readonly?: boolean;
  }>(),
  {
    placeholder: undefined,
    required: false,
    readonly: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

function onInput(event: Event) {
  emit("update:modelValue", (event.target as HTMLTextAreaElement).value);
}
</script>

<style module>
.control {
  width: 100%;
  min-height: 94px;
  border: 1px solid #c6d5e8;
  border-radius: 6px;
  padding: 10px 11px;
  background: #fff;
  color: var(--ink);
  outline: none;
  resize: vertical;
}

.control:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(29, 95, 211, 0.14);
}
</style>
