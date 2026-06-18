<template>
  <Teleport to="body">
    <div
      v-if="unsavedConfirmVisible"
      :class="$style.backdrop"
      role="presentation"
    >
      <section
        :class="$style.dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unsaved-title"
        aria-describedby="unsaved-description"
      >
        <div :class="$style.iconWrap" aria-hidden="true">
          <AppIcon name="shield" />
        </div>
        <div :class="$style.content">
          <h2 id="unsaved-title">保存していない入力があります</h2>
          <p id="unsaved-description">
            このまま移動すると、現在の入力内容は破棄されます。
          </p>
        </div>
        <div :class="$style.actions">
          <BaseButton variant="secondary" @click="resolveUnsavedConfirm(false)"
            >入力を続ける</BaseButton
          >
          <BaseButton variant="warning" @click="resolveUnsavedConfirm(true)"
            >破棄して移動</BaseButton
          >
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useTryangleRuntime } from "~/composables/tryangle/useTryangleRuntime";

const { unsavedConfirmVisible, resolveUnsavedConfirm } = useTryangleRuntime();
</script>

<style module>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(9, 24, 44, 0.48);
  backdrop-filter: blur(8px);
}

.dialog {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px;
  width: min(460px, 100%);
  padding: 20px;
  border: 1px solid rgba(173, 193, 221, 0.7);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 24px 80px rgba(9, 24, 44, 0.24);
}

.iconWrap {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: var(--primary-weak);
  color: var(--primary);
}

.iconWrap svg {
  width: 22px;
  height: 22px;
}

.content {
  min-width: 0;
}

.content h2 {
  margin: 0;
  color: #10294f;
  font-size: 18px;
  line-height: 1.35;
}

.content p {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.7;
}

.actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 6px;
}

@media (max-width: 520px) {
  .dialog {
    grid-template-columns: 1fr;
    padding: 18px;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
