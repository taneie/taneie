<template>
  <Teleport to="body">
    <div
      v-if="jobAccessAlertVisible"
      :class="$style.backdrop"
      role="presentation"
      @click.self="closeJobAccessAlert"
    >
      <section
        ref="dialogRef"
        :class="$style.dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="job-access-alert-title"
        aria-describedby="job-access-alert-description"
        tabindex="-1"
      >
        <div :class="$style.iconWrap" aria-hidden="true">
          <AppIcon name="shield" />
        </div>
        <div :class="$style.content">
          <h2 id="job-access-alert-title">
            案件閲覧にはプロフィール詳細の入力と誓約同意が必要です
          </h2>
          <p id="job-access-alert-description">
            未完了の項目を登録してください。すべての条件を満たすと案件を検索・閲覧できます。
          </p>
        </div>
        <div :class="$style.actions">
          <BaseButton type="button" @click="closeJobAccessAlert">
            確認しました
          </BaseButton>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useBodyScrollLock } from "~/composables/frichy/useBodyScrollLock";
import { useModalA11y } from "~/composables/frichy/useModalA11y";
import { useFrichyRuntime } from "~/composables/frichy/useFrichyRuntime";

const { jobAccessAlertVisible, closeJobAccessAlert } = useFrichyRuntime();

useBodyScrollLock(jobAccessAlertVisible);
const dialogRef = useModalA11y(jobAccessAlertVisible, closeJobAccessAlert);
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
  width: min(520px, 100%);
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
  background: #fff4dc;
  color: #a95f00;
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
  line-height: 1.5;
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
