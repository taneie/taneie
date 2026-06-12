<template>
  <svg
    :class="className"
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <template v-if="name === 'briefcase'">
      <path
        d="M16 6V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v1m-5 5h18m-18-5h18v14H3z"
      />
    </template>
    <template v-else-if="name === 'user'">
      <path d="M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0" />
    </template>
    <template v-else-if="name === 'search'">
      <path d="m21 21-4.3-4.3m1.3-5.2a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0" />
    </template>
    <template v-else-if="name === 'chart'">
      <path d="M4 19V5m0 14h17M8 16V9m5 7V4m5 12v-6" />
    </template>
    <template v-else-if="name === 'send'">
      <path d="M22 2 11 13m11-11-7 20-4-9-9-4z" />
    </template>
    <template v-else-if="name === 'calendar'">
      <path
        d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v16H3V6a2 2 0 0 1 2-2"
      />
    </template>
    <template v-else-if="name === 'shield'">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </template>
    <template v-else-if="name === 'plus'">
      <path d="M12 5v14M5 12h14" />
    </template>
    <template v-else-if="name === 'print'">
      <path
        d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h20a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"
      />
    </template>
  </svg>
</template>

<script setup lang="ts">
import type { IconName } from "~/composables/useTryangleFreelance";

withDefaults(
  defineProps<{
    name: IconName;
    className?: string;
  }>(),
  {
    className: "",
  },
);
</script>
