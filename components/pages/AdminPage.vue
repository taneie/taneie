<template>
  <PageHead
    title="営業管理"
    kicker="案件登録、応募者一覧、選考ステータス、レジュメ確認を管理します。"
  />

  <section :class="$style.metricRow">
    <MetricCard label="案件" :value="state.jobs.length" caption="登録済み" />
    <MetricCard
      label="応募"
      :value="state.applications.length"
      caption="全体"
    />
    <MetricCard label="成約" :value="closedApplications" caption="確定" />
    <MetricCard label="見送り" :value="rejectedApplications" caption="終了" />
  </section>

  <div :class="[$style.grid, $style.two]">
    <section :class="$style.panel">
      <div :class="$style.panelHeader">
        <h2 :class="$style.panelTitle">案件登録</h2>
      </div>
      <div :class="$style.panelBody">
        <form :class="$style.formGrid" @submit.prevent="submitJob">
          <FormInput
            v-model="jobForm.title"
            label="案件概要"
            name="title"
            @update:model-value="markDirty"
          />
          <FormInput
            v-model="jobForm.client"
            label="顧客名"
            name="client"
            @update:model-value="markDirty"
          />
          <FormInput
            v-model="jobForm.rateMin"
            label="単価下限（万円）"
            name="rateMin"
            type="number"
            @update:model-value="markDirty"
          />
          <FormInput
            v-model="jobForm.rateMax"
            label="単価上限（万円）"
            name="rateMax"
            type="number"
            @update:model-value="markDirty"
          />
          <FormInput
            v-model="jobForm.marginRate"
            label="マージン率（%）"
            name="marginRate"
            type="number"
            @update:model-value="markDirty"
          />
          <FormSelect
            v-model="jobForm.stream"
            label="商流"
            name="stream"
            :options="flowOptions"
            @update:model-value="markDirty"
          />
          <FormSelect
            v-model="jobForm.remote"
            label="リモート"
            name="remote"
            :options="remoteOptions"
            @update:model-value="markDirty"
          />
          <FormInput
            v-model="jobForm.required"
            label="必須スキル"
            name="required"
            @update:model-value="markDirty"
          />
          <FormInput
            v-model="jobForm.nice"
            label="尚可スキル"
            name="nice"
            @update:model-value="markDirty"
          />
          <label :class="[$style.field, $style.full]"
            >詳細
            <textarea
              :class="$style.control"
              v-model="jobForm.summary"
              @input="markDirty"
            ></textarea>
          </label>
          <label :class="$style.checkboxField"
            ><input
              v-model="jobForm.sortFlag"
              type="checkbox"
              @change="markDirty"
            />
            並び替え上位に固定</label
          >
          <div :class="$style.actions">
            <BaseButton type="submit" icon="plus">案件を追加</BaseButton>
          </div>
        </form>
      </div>
    </section>

    <section :class="$style.panel">
      <div :class="$style.panelHeader">
        <h2 :class="$style.panelTitle">応募ステータス</h2>
      </div>
      <div :class="$style.panelBody">
        <SelectionKanban />
      </div>
    </section>
  </div>

  <section :class="[$style.panel, $style.stackMd]">
    <div :class="$style.panelHeader">
      <h2 :class="$style.panelTitle">応募者一覧・レジュメ</h2>
    </div>
    <div :class="[$style.panelBody, $style.tableWrap]">
      <ApplicationsTable with-resume />
    </div>
  </section>

  <div :class="[$style.grid, $style.two, $style.stackMd]">
    <section :class="$style.panel">
      <div :class="$style.panelHeader">
        <div :class="$style.panelHeaderText">
          <h2 :class="$style.panelTitle">マッチ案件一覧</h2>
          <p v-if="adminMatchTarget" :class="$style.panelNote">
            対象: {{ adminMatchTarget.name }} / {{ adminMatchSkillText }}
          </p>
        </div>
      </div>
      <div :class="[$style.panelBody, $style.tableWrap]">
        <JobsAdminTable
          :jobs="adminMatchedJobsForTable"
          :loading="adminMatchedJobsLoading"
        />
      </div>
    </section>
    <section :class="$style.panel">
      <div :class="$style.panelHeader">
        <h2 :class="$style.panelTitle">レジュメプレビュー</h2>
      </div>
      <div :class="$style.panelBody"><ResumePreview /></div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { useTryangleFreelance } from "~/composables/useTryangleFreelance";
import type { JobInput } from "~/composables/tryangle/types";

const {
  state,
  flowOptions,
  remoteOptions,
  adminMatchedJobs,
  adminMatchedJobsLoading,
  createJob,
  markDirty,
  clearUnsavedChanges,
  loadAdminMatchedJobs,
  getFreelancer,
  getJob,
} = useTryangleFreelance();

const initialJobForm = (): JobInput => ({
  title: "",
  client: "",
  rateMin: "70",
  rateMax: "90",
  marginRate: "12",
  stream: "エンド直",
  remote: "フルリモート",
  required: "",
  nice: "",
  summary: "",
  sortFlag: false,
});

const jobForm = reactive<JobInput>(initialJobForm());

const closedApplications = computed(
  () =>
    state.value.applications.filter(
      (application) => application.status === "成約",
    ).length,
);
const rejectedApplications = computed(
  () =>
    state.value.applications.filter(
      (application) => application.status === "見送り",
    ).length,
);
const adminMatchTarget = computed(() => {
  const preview = getFreelancer(state.value.previewFreelancerId);
  if (preview) return preview;

  const selected = getFreelancer(state.value.selectedFreelancerId);
  if (selected) return selected;

  return state.value.freelancers[0];
});
const adminMatchSkillText = computed(
  () => adminMatchTarget.value?.skills.join(" / ") || "スキル未登録",
);
const adminMatchedJobsForTable = computed(() =>
  adminMatchedJobs.value.map((job) => getJob(job.id) || job),
);

watch(
  () => adminMatchTarget.value?.id || "",
  (freelancerId) => {
    if (freelancerId) void loadAdminMatchedJobs(freelancerId);
  },
  { immediate: true },
);

async function submitJob() {
  if (await createJob(jobForm)) {
    Object.assign(jobForm, initialJobForm());
    clearUnsavedChanges();
  }
}
</script>

<style module>
.grid {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.grid > *,
.formGrid > *,
.metricRow > * {
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

.panelHeaderText {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.panelNote {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.panelBody {
  min-width: 0;
  max-width: 100%;
  padding: 16px;
}

.formGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
  color: #263f63;
  font-size: 13px;
  font-weight: 700;
}

.full {
  grid-column: 1 / -1;
}

.control {
  width: 100%;
  min-height: 94px;
  border: 1px solid #c6d5e8;
  border-radius: 6px;
  padding: 10px 11px;
  background: #fff;
  color: var(--ink);
  outline: none;
  resize: vertical;
}

.control:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(29, 95, 211, 0.14);
}

.checkboxField {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #263f63;
  font-size: 13px;
  font-weight: 700;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 14px;
}

.metricRow {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.tableWrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  min-width: 0;
  max-width: 100%;
}

.stackMd {
  margin-top: 16px;
}

@media (max-width: 1180px) {
  .two {
    grid-template-columns: 1fr;
  }

  .metricRow {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .metricRow {
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

  .formGrid {
    grid-template-columns: 1fr;
  }

  .actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .actions button {
    width: 100%;
  }

  .tableWrap {
    overflow: visible;
  }
}
</style>
