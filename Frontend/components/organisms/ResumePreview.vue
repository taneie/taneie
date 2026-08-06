<template>
  <div
    v-if="freelancer"
    :class="[
      $style.sheet,
      { [$style.fullscreen]: props.variant === 'fullscreen' },
    ]"
  >
    <div :class="$style.header">
      <div>
        <h2>{{ freelancer.resumeName || "レジュメ未登録" }}</h2>
        <p>
          {{ freelancer.name }} / {{ freelancer.role }} /
          {{ freelancer.availability }}
        </p>
      </div>
      <div v-if="freelancer.resumeName" :class="$style.headerActions">
        <button
          v-if="!preview?.previewUrl || resumePreviewError"
          type="button"
          :class="$style.primaryAction"
          :disabled="resumePreviewLoading"
          @click="loadPreview"
        >
          {{ resumePreviewError ? "再読み込み" : "プレビュー" }}
        </button>
        <button
          v-if="preview?.previewUrl"
          type="button"
          :class="$style.linkAction"
          @click="openPreview"
        >
          別タブで開く
        </button>
        <button
          v-if="preview"
          type="button"
          :class="$style.linkAction"
          @click="downloadResumePreview"
        >
          ダウンロード
        </button>
      </div>
    </div>

    <div v-if="resumePreviewLoading" :class="$style.empty">
      レジュメを読み込んでいます。
    </div>
    <div v-else-if="resumePreviewError" :class="$style.empty">
      {{ resumePreviewError }}
    </div>
    <iframe
      v-else-if="preview?.previewUrl"
      :class="$style.viewer"
      :src="preview.previewUrl"
      allow="unload"
      title="レジュメプレビュー"
    />
    <div v-else-if="preview" :class="$style.officePreview">
      <strong>{{ preview.fileName }}</strong>
      <p>
        プレビューURLを取得できませんでした。ダウンロードして確認してください。
      </p>
      <button
        type="button"
        :class="$style.linkAction"
        @click="downloadResumePreview"
      >
        ダウンロードして開く
      </button>
    </div>
    <div v-else-if="!freelancer.resumeName" :class="$style.empty">
      レジュメが登録されていません。
    </div>
    <div v-else :class="$style.sheetGrid">
      <div>スキル</div>
      <div>{{ freelancer.skills.join(" / ") }}</div>
      <div>希望単価</div>
      <div>{{ freelancer.desiredRate }}万円</div>
      <div>稼働率</div>
      <div>{{ freelancer.workRate }}</div>
      <div>リモート</div>
      <div>{{ freelancer.remote }}</div>
      <div>更新日</div>
      <div>{{ freelancer.lastUpdated }}</div>
    </div>
  </div>
  <div v-else :class="$style.empty">
    応募者一覧からレジュメを選択してください。
  </div>
</template>

<script setup lang="ts">
import { useFrichyRuntime } from "~/composables/frichy/useFrichyRuntime";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    variant?: "panel" | "fullscreen";
  }>(),
  {
    variant: "panel",
  },
);

const {
  state,
  currentPreviewFreelancer,
  resumePreview,
  resumePreviewLoading,
  resumePreviewError,
  selectPreview,
  downloadResumePreview,
} = useFrichyRuntime();

const freelancer = computed(() => {
  state.value.previewFreelancerId;
  state.value.freelancers;
  return currentPreviewFreelancer();
});

const preview = computed(() => resumePreview.value);

function openPreview() {
  if (!preview.value?.previewUrl) return;
  window.open(preview.value.previewUrl, "_blank", "noopener");
}

function loadPreview() {
  if (!freelancer.value?.id) return;
  void selectPreview(freelancer.value.id);
}
</script>

<style module>
.sheet {
  display: grid;
  grid-template-rows: auto minmax(0, auto);
  gap: 14px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 22px;
  line-height: 1.65;
  min-height: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.fullscreen {
  height: 100%;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 12px;
  border: 0;
  border-radius: 0;
  background: transparent;
  padding: 0;
}

.sheet h2 {
  margin: 0 0 10px;
  color: #10294f;
}

.sheet p {
  color: var(--muted);
}

.header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.headerActions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.viewer {
  width: 100%;
  height: 100%;
  min-height: 640px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #f8fbff;
}

.officePreview {
  display: grid;
  gap: 12px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #f8fbff;
}

.linkAction {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-height: 40px;
  padding: 9px 14px;
  border: 0;
  border-radius: 6px;
  background: #e9f1fc;
  color: #18365f;
  font-size: 14px;
  font-weight: 800;
  font-family: inherit;
  text-decoration: none;
  cursor: pointer;
}

.primaryAction {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-height: 40px;
  padding: 9px 14px;
  border: 0;
  border-radius: 6px;
  background: linear-gradient(180deg, var(--primary), var(--primary-strong));
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(29, 95, 211, 0.18);
}

.primaryAction:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.sheetGrid {
  display: grid;
  grid-template-columns: 160px 1fr;
  border-top: 1px solid var(--line);
  border-left: 1px solid var(--line);
  margin-top: 14px;
}

.sheetGrid div {
  padding: 10px;
  border-right: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.sheetGrid div:nth-child(odd) {
  background: var(--primary-soft);
  color: #18365f;
  font-weight: 800;
}

.empty {
  padding: 24px;
  color: var(--muted);
  border: 1px dashed #b7c9df;
  border-radius: 8px;
  background: #fbfdff;
  text-align: center;
}

@media (max-width: 620px) {
  .sheet {
    padding: 14px;
  }

  .fullscreen {
    padding: 0;
  }

  .header {
    display: grid;
  }

  .headerActions,
  .headerActions button {
    width: 100%;
  }

  .viewer {
    min-height: 520px;
  }

  .sheetGrid {
    grid-template-columns: 1fr;
  }
}
</style>
