<template>
  <select
    :class="$style.control"
    :name="name"
    :value="modelValue"
    @change="onChange"
  >
    <option v-if="placeholder" value="" disabled>
      {{ placeholder }}
    </option>
    <option v-for="option in options" :key="option" :value="option">
      {{ option }}
    </option>
  </select>
</template>

<script setup lang="ts">
defineProps<{
  name: string;
  options: string[];
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

function onChange(event: Event) {
  emit("update:modelValue", (event.target as HTMLSelectElement).value);
}
</script>

<style module>
.control {
  width: 100%;
  border: 1px solid #c6d5e8;
  border-radius: 6px;
  min-height: 42px;
  padding: 10px 36px 10px 12px;
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
</style>
