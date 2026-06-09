<template>
  <div :class="$style.pageHead">
    <div>
      <h1 :class="$style.pageTitle">{{ title }}</h1>
      <p :class="$style.pageKicker">{{ kicker }}</p>
    </div>
    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  kicker: string;
}>();
</script>

<style module>
.pageHead {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.pageTitle {
  margin: 0;
  color: #0d2749;
  font-size: clamp(22px, 2vw, 30px);
  line-height: 1.15;
}

.pageKicker {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 14px;
}

@media (max-width: 980px) {
  .pageHead {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
