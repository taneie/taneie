<template>
  <Transition name="fade">
    <div v-if="visible" :class="$style.overlay" role="status" aria-live="polite">
      <div :class="$style.spinner" aria-hidden="true"></div>
      <span :class="$style.label">{{ label }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    visible: boolean;
    label?: string;
  }>(),
  {
    label: "読み込み中",
  },
);
</script>

<style module>
.overlay {
  position: fixed;
  inset: var(--safe-top) var(--safe-right) var(--safe-bottom) var(--safe-left);
  z-index: 1000;
  display: grid;
  place-items: center;
  gap: 12px;
  background: rgba(237, 245, 255, 0.64);
  backdrop-filter: blur(3px);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(29, 95, 211, 0.16);
  border-top-color: var(--primary);
  border-radius: 999px;
  animation: spin 0.78s linear infinite;
}

.label {
  color: #10294f;
  font-size: 13px;
  font-weight: 800;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.16s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
