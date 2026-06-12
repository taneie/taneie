<template>
  <div :class="$style.card">
    <div :class="$style.tags">
      <TagBadge :tone="tone">{{ title }}</TagBadge>
    </div>
    <p>{{ body }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  body: string;
  tone: "teal" | "blue" | "amber" | "rose";
}>();
</script>

<style module>
.card {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 8px;
  padding: 14px;
  min-width: 0;
  box-shadow: 0 8px 22px rgba(29, 78, 137, 0.05);
}

.card p {
  margin: 8px 0;
  overflow-wrap: anywhere;
  color: var(--muted);
  line-height: 1.6;
}

.tags {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
