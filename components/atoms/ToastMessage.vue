<template>
  <div :class="[$style.toast, { [$style.show]: toastVisible }]" role="status" aria-live="polite">
    {{ toastMessage }}
  </div>
</template>

<script setup lang="ts">
import { useTryangleFreelance } from "~/composables/useTryangleFreelance";
const { toastMessage, toastVisible } = useTryangleFreelance();
</script>

<style module>
.toast {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 30;
  max-width: min(420px, calc(100vw - 36px));
  background: #102033;
  color: #fff;
  border-radius: 8px;
  padding: 12px 14px;
  box-shadow: var(--shadow);
  opacity: 0;
  transform: translateY(14px);
  pointer-events: none;
  transition: 0.2s ease;
}

.show {
  opacity: 1;
  transform: translateY(0);
}
</style>
