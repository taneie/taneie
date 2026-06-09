<template>
  <div :class="$style.authTabs" role="tablist" aria-label="認証メニュー">
    <button :class="{ [$style.active]: mode === 'login' }" type="button" @click="$emit('change', 'login')">
      ログイン
    </button>
    <button :class="{ [$style.active]: mode === 'register' }" type="button" @click="$emit('change', 'register')">
      新規会員登録
    </button>
  </div>
</template>

<script setup lang="ts">
import type { AuthMode } from "~/composables/useTryangleFreelance";

defineProps<{
  mode: AuthMode;
}>();

defineEmits<{
  change: [mode: AuthMode];
}>();
</script>

<style module>
.authTabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  padding: 5px;
  margin-bottom: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--primary-soft);
}

.authTabs button {
  min-height: 38px;
  border-radius: 6px;
  background: transparent;
  color: var(--muted);
  font-weight: 800;
}

.authTabs button.active {
  background: #fff;
  color: var(--primary);
  box-shadow: 0 1px 8px rgba(29, 78, 137, 0.12);
}

@media (max-width: 620px) {
  .authTabs {
    grid-template-columns: 1fr;
  }
}
</style>
