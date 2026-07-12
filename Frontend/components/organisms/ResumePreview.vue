<template>
  <div v-if="freelancer" :class="$style.sheet">
    <div :class="$style.header">
      <div>
        <h2>{{ freelancer.resumeName || "レジュメ未登録" }}</h2>
        <p>
          {{ freelancer.name }} / {{ freelancer.role }} /
          {{ freelancer.availability }}
        </p>
      </div>
      <button
        v-if="preview"
        type="button"
        :class="$style.linkAction"
        @click="isPdf ? openPdfPreview() : downloadResumePreview()"
      >
        {{ isPdf ? "開く" : "ダウンロード" }}
      </button>
    </div>

    <div v-if="resumePreviewLoading" :class="$style.empty">
      レジュメを読み込んでいます。
    </div>
    <div v-else-if="resumePreviewError" :class="$style.empty">
      {{ resumePreviewError }}
    </div>
    <iframe
      v-else-if="isPdf && preview?.previewUrl"
      :class="$style.viewer"
      :src="preview.previewUrl"
      title="レジュメプレビュー"
    />
    <div
      v-else-if="isHtmlPreview"
      :class="$style.documentPreview"
      v-html="preview?.html"
    />
    <div v-else-if="preview" :class="$style.officePreview">
      <strong>{{ preview.fileName }}</strong>
      <p>
        この形式はブラウザ内プレビューに対応していないため、ダウンロードして確認してください。
      </p>
      <button
        type="button"
        :class="$style.linkAction"
        @click="downloadResumePreview"
      >
        ダウンロードして開く
      </button>
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
import { useFrichyRuntime } from "~/composables/freelink/useFrichyRuntime";
import { computed } from "vue";
const {
  state,
  currentPreviewFreelancer,
  resumePreview,
  resumePreviewLoading,
  resumePreviewError,
  downloadResumePreview,
} = useFrichyRuntime();

const freelancer = computed(() => {
  state.value.previewFreelancerId;
  state.value.freelancers;
  return currentPreviewFreelancer();
});

const preview = computed(() => resumePreview.value);

const isPdf = computed(() => preview.value?.mimeType === "application/pdf");

const isHtmlPreview = computed(
  () => preview.value?.previewKind === "html" && Boolean(preview.value.html),
);

function openPdfPreview() {
  if (!preview.value?.previewUrl) return;
  window.open(preview.value.previewUrl, "_blank", "noopener");
}
</script>

<style module>
.sheet {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 22px;
  line-height: 1.65;
  max-width: 100%;
  overflow-wrap: anywhere;
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
  margin-bottom: 14px;
}

.viewer {
  width: 100%;
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

.documentPreview {
  max-height: 680px;
  overflow: auto;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  color: #10294f;
}

.documentPreview :global(table) {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.documentPreview :global(th),
.documentPreview :global(td) {
  padding: 8px 10px;
  border: 1px solid #d7e2f0;
  vertical-align: top;
}

.documentPreview :global(th) {
  background: #eef5ff;
  font-weight: 800;
}

.documentPreview :global(p) {
  margin: 0 0 10px;
  color: #10294f;
}

.documentPreview :global(h1),
.documentPreview :global(h2),
.documentPreview :global(h3) {
  margin: 16px 0 8px;
  color: #10294f;
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

  .header {
    display: grid;
  }

  .viewer {
    min-height: 520px;
  }

  .sheetGrid {
    grid-template-columns: 1fr;
  }
}
</style>
