<template>
  <label :class="[$style.field, { [$style.full]: full }]">
    {{ label }}
    <slot />
  </label>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    full?: boolean;
  }>(),
  {
    full: false,
  },
);
</script>

<style module>
.field {
  display: grid;
  gap: 6px;
  color: #263f63;
  font-size: 13px;
  font-weight: 700;
}

.full {
  grid-column: 1 / -1;
}
</style>
