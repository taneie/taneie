<template>
  <div
    :class="[$style.toast, { [$style.show]: toastVisible }]"
    role="status"
    aria-live="polite"
  >
    {{ toastMessage }}
  </div>
</template>

<script setup lang="ts">
import { useFrichyRuntime } from "~/composables/frichy/useFrichyRuntime";
const { toastMessage, toastVisible } = useFrichyRuntime();
</script>

<style module>
.toast {
  position: fixed;
  right: max(18px, var(--safe-right));
  bottom: max(18px, var(--safe-bottom));
  z-index: 30;
  max-width: min(420px, calc(100vw - 36px - var(--safe-left) - var(--safe-right)));
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
