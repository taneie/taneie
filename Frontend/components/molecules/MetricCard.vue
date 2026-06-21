<template>
  <div :class="$style.metric">
    <strong>{{ value }}</strong>
    <span>{{ label }} / {{ caption }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  caption: string;
}>();
</script>

<style module>
.metric {
  min-width: 0;
  max-width: 100%;
  background: linear-gradient(180deg, #ffffff, #f7fbff);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 13px;
  box-shadow: 0 8px 22px rgba(29, 78, 137, 0.07);
}

.metric strong {
  display: block;
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--primary-strong);
  font-size: 24px;
  line-height: 1.1;
}

.metric span {
  display: block;
  min-width: 0;
  color: var(--muted);
  overflow-wrap: anywhere;
  font-size: 12px;
}

@media (max-width: 620px) {
  .metric strong {
    font-size: 22px;
  }
}
</style>
