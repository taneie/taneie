<template>
  <PageHead
    title="簡易スカウト"
    kicker="スキル・稼働状況・リモート条件で人材を検索し、直接アプローチします。"
  />

  <div :class="[$style.grid, $style.two]">
    <section :class="$style.panel">
      <div :class="$style.panelHeader">
        <h2 :class="$style.panelTitle">人材検索</h2>
      </div>
      <div :class="$style.panelBody">
        <form :class="[$style.formGrid, $style.one]" @submit.prevent>
          <FormInput v-model="scoutFilters.skill" label="スキル" name="skill" />
          <FormSelect
            v-model="scoutFilters.availability"
            label="提案可能ステータス"
            name="availability"
            :options="['', ...availabilityOptions]"
          />
          <FormSelect
            v-model="scoutFilters.remote"
            label="リモート"
            name="remote"
            :options="['', ...remoteOptions]"
          />
          <FormSelect
            v-model="scoutFilters.sort"
            label="並び順"
            name="scoutSort"
            :options="scoutSortOptions"
          />
          <div :class="$style.actions">
            <BaseButton type="submit" icon="search">検索</BaseButton>
            <BaseButton variant="secondary" @click="clearScoutFilter"
              >クリア</BaseButton
            >
          </div>
        </form>
      </div>
    </section>

    <ScoutFreelancerList
      :freelancers="filteredFreelancers"
      @scout="openScoutJobPicker"
      @preview="openResumePreview"
      @clear="clearScoutFilter"
    />
  </div>

  <div
    v-if="scoutJobPicker.open"
    :class="$style.modalBackdrop"
    role="presentation"
    @click.self="closeScoutJobPicker"
  >
    <section
      ref="scoutModalRef"
      :class="$style.modalPanel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scout-job-picker-title"
      tabindex="-1"
    >
      <div :class="$style.modalHeader">
        <div>
          <span :class="$style.modalKicker">SCOUT JOB</span>
          <h2 id="scout-job-picker-title">
            {{ scoutJobPicker.freelancerName }}さんに紐づける案件
          </h2>
          <p>
            候補者のスキル・希望単価・リモート条件に合う案件のみ表示しています。
          </p>
        </div>
        <button
          type="button"
          :class="$style.modalClose"
          aria-label="案件選択を閉じる"
          @click="closeScoutJobPicker"
        >
          ×
        </button>
      </div>

      <form :class="$style.jobSearch" @submit.prevent="searchScoutableJobs">
        <FormInput
          v-model="scoutJobPicker.keyword"
          label="案件キーワード"
          name="scoutJobKeyword"
          placeholder="案件名・概要・顧客名で検索"
        />
        <BaseButton type="submit" icon="search">案件を検索</BaseButton>
      </form>

      <div :class="$style.jobList">
        <article
          v-for="job in scoutJobPicker.jobs"
          :key="job.id"
          role="button"
          tabindex="0"
          :aria-pressed="scoutJobPicker.selectedJobId === job.id"
          :class="[
            $style.jobOption,
            { [$style.jobOptionSelected]: scoutJobPicker.selectedJobId === job.id },
          ]"
          @click="selectScoutJob(job.id)"
          @keydown.enter.prevent="selectScoutJob(job.id)"
          @keydown.space.prevent="selectScoutJob(job.id)"
        >
          <span :class="$style.jobOptionHead">
            <strong>{{ job.title }}</strong>
          </span>
          <JobSummaryText :summary="job.summary" :reset-key="job.id" compact />
          <JobDetailList :job="job" compact />
          <span :class="$style.jobOptionMeta">
            {{ job.client }} / {{ job.rateMin }}-{{ job.rateMax }}万円 / {{ job.remote }}
          </span>
          <span :class="$style.jobOptionTags">
            <TagBadge
              v-for="skill in job.required"
              :key="`scout-required-${job.id}-${skill}`"
              >{{ skill }}</TagBadge
            >
            <TagBadge
              v-for="skill in job.nice"
              :key="`scout-nice-${job.id}-${skill}`"
              tone="rose"
              >{{ skill }}</TagBadge
            >
          </span>
        </article>

        <div
          v-if="!scoutJobPicker.loading && scoutJobPicker.jobs.length === 0"
          :class="$style.empty"
        >
          <p>この候補者にスカウト可能な案件がありません。</p>
          <div :class="$style.emptyActions">
            <BaseButton variant="secondary" @click="clearScoutJobKeyword">
              条件をクリア
            </BaseButton>
          </div>
        </div>
        <div v-if="scoutJobPicker.loading" :class="$style.empty">
          案件を検索しています。
        </div>
      </div>

      <div :class="$style.modalActions">
        <BaseButton variant="secondary" @click="closeScoutJobPicker">
          キャンセル
        </BaseButton>
        <BaseButton
          icon="send"
          :disabled="!scoutJobPicker.selectedJobId"
          @click="sendSelectedScout"
        >
          選択した案件でスカウト
        </BaseButton>
      </div>
    </section>
  </div>

  <div
    v-if="resumePreviewDialogOpen"
    :class="$style.modalBackdrop"
    role="presentation"
    @click.self="closeResumePreviewDialog"
  >
    <section
      ref="resumePreviewModalRef"
      :class="[$style.modalPanel, $style.previewModalPanel]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-preview-title"
      tabindex="-1"
    >
      <div :class="$style.modalHeader">
        <div>
          <span :class="$style.modalKicker">RESUME</span>
          <h2 id="resume-preview-title">レジュメ確認</h2>
        </div>
        <button
          type="button"
          :class="$style.modalClose"
          aria-label="レジュメ確認を閉じる"
          @click="closeResumePreviewDialog"
        >
          ×
        </button>
      </div>

      <div :class="$style.previewModalBody">
        <ResumePreview variant="fullscreen" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useBodyScrollLock } from "~/composables/frichy/useBodyScrollLock";
import { useModalA11y } from "~/composables/frichy/useModalA11y";
import { useFrichyRuntime } from "~/composables/frichy/useFrichyRuntime";
const {
  scoutFilters,
  scoutJobPicker,
  filteredFreelancers,
  availabilityOptions,
  remoteOptions,
  scoutSortOptions,
  clearScoutFilter,
  openScoutJobPicker,
  closeScoutJobPicker,
  searchScoutableJobs,
  selectScoutJob,
  sendSelectedScout,
  selectPreviewTarget,
} = useFrichyRuntime();

const resumePreviewDialogOpen = ref(false);
const anyModalOpen = computed(
  () => scoutJobPicker.value.open || resumePreviewDialogOpen.value,
);
useBodyScrollLock(anyModalOpen);
const scoutModalRef = useModalA11y(
  computed(() => scoutJobPicker.value.open),
  closeScoutJobPicker,
);
const resumePreviewModalRef = useModalA11y(
  resumePreviewDialogOpen,
  closeResumePreviewDialog,
);

function clearScoutJobKeyword() {
  scoutJobPicker.value.keyword = "";
  void searchScoutableJobs();
}

function openResumePreview(freelancerId: string) {
  resumePreviewDialogOpen.value = true;
  selectPreviewTarget(freelancerId);
}

function closeResumePreviewDialog() {
  resumePreviewDialogOpen.value = false;
}
</script>

<style module>
.grid {
  display: grid;
  gap: 16px;
  min-width: 0;
  margin-bottom: 16px;
}

.grid > *,
.formGrid > * {
  min-width: 0;
}

.two {
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.4fr);
}

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
  min-width: 0;
  max-width: 100%;
}

.panelHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
}

.panelTitle {
  min-width: 0;
  margin: 0;
  color: #10294f;
  font-size: 16px;
  overflow-wrap: anywhere;
}

.panelBody {
  min-width: 0;
  max-width: 100%;
  padding: 16px;
}

.formGrid {
  display: grid;
  gap: 12px;
}

.one {
  grid-template-columns: 1fr;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 14px;
}

.empty {
  padding: 24px;
  color: var(--muted);
  border: 1px dashed #b7c9df;
  border-radius: 8px;
  background: #fbfdff;
  text-align: center;
}

.empty p {
  margin: 0;
}

.emptyActions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.modalBackdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(10, 37, 68, 0.42);
  backdrop-filter: blur(6px);
}

.modalPanel {
  width: min(860px, 100%);
  max-height: min(760px, calc(100dvh - 40px));
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  overflow: hidden;
  border: 1px solid rgba(185, 207, 235, 0.95);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 24px 60px rgba(10, 37, 68, 0.22);
}

.previewModalPanel {
  width: min(1180px, calc(100dvw - 24px));
  height: min(860px, calc(100dvh - 24px));
  max-height: calc(100dvh - 24px);
  grid-template-rows: auto minmax(0, 1fr);
}

.modalHeader {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--line);
  background: linear-gradient(180deg, #ffffff, #f6faff);
}

.modalHeader h2 {
  margin: 4px 0 0;
  color: #10294f;
  font-size: 20px;
  line-height: 1.35;
}

.modalHeader p {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.modalKicker {
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
}

.modalClose {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary-strong);
  font-size: 22px;
  font-weight: 900;
  line-height: 1;
}

.previewModalBody {
  min-height: 0;
  overflow: auto;
  padding: 16px 20px;
  background: #f8fbff;
}

.jobSearch {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: end;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
}

.jobList {
  display: grid;
  gap: 10px;
  min-height: 0;
  overflow: auto;
  padding: 16px 20px;
}

.jobOption {
  display: grid;
  gap: 8px;
  width: 100%;
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  outline: none;
  text-align: left;
  box-shadow: 0 8px 22px rgba(29, 78, 137, 0.05);
}

.jobOption:focus-visible {
  border-color: var(--primary);
  box-shadow:
    0 0 0 3px rgba(29, 78, 137, 0.16),
    0 12px 28px rgba(29, 95, 211, 0.12);
}

.jobOptionSelected {
  border-color: var(--primary);
  background: linear-gradient(180deg, #ffffff, #f4f8fe);
  box-shadow: 0 12px 28px rgba(29, 95, 211, 0.12);
}

.jobOptionHead {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #10294f;
}

.jobOptionMeta {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.jobOptionTags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.modalActions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--line);
}

@media (max-width: 1180px) {
  .two {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 620px) {
  .panelBody,
  .panelHeader {
    padding: 12px;
  }

  .panelHeader {
    align-items: stretch;
  }

  .panelHeader button {
    width: 100%;
  }

  .actions,
  .modalActions,
  .jobSearch {
    display: grid;
    grid-template-columns: 1fr;
  }

  .actions button,
  .modalActions button,
  .jobSearch button {
    width: 100%;
  }

  .emptyActions,
  .emptyActions button {
    width: 100%;
  }

  .modalBackdrop {
    padding: 10px;
  }

  .modalPanel {
    max-height: calc(100dvh - 20px);
  }

  .modalHeader,
  .jobSearch,
  .jobList,
  .previewModalBody,
  .modalActions {
    padding: 14px;
  }
}
</style>
