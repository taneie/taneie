<template>
  <div :class="[$style.grid, $style.two]">
    <aside :class="$style.panel">
      <div :class="$style.panelHeader"><h2 :class="$style.panelTitle">入力ステップ</h2></div>
      <div :class="$style.panelBody">
        <div :class="$style.stepper">
          <button
            v-for="(label, index) in steps"
            :key="label"
            type="button"
            :class="[$style.step, { [$style.active]: state.wizardStep === index + 1 }]"
            @click="moveStep(index + 1)"
          >
            <span :class="$style.stepIndex">{{ index + 1 }}</span>
            <span>{{ label }}</span>
          </button>
        </div>

        <div :class="[$style.card, $style.stackSm]">
          <div :class="$style.cardHead">
            <h3>{{ profile.name || "未入力" }}</h3>
            <StatusBadge :value="profile.availability" />
          </div>
          <p>{{ profile.role || "職種未入力" }} / {{ profile.workRate || "稼働率未入力" }} / {{ profile.remote || "リモート未入力" }}</p>
          <div :class="$style.tags">
            <TagBadge v-for="skill in visibleProfileSkills" :key="skill">{{ skill }}</TagBadge>
          </div>
        </div>
      </div>
    </aside>

    <section :class="$style.panel">
      <div :class="$style.panelHeader">
        <h2 :class="$style.panelTitle">{{ steps[state.wizardStep - 1] }}</h2>
        <BaseButton variant="secondary" @click="resetProfile">初期状態に戻す</BaseButton>
      </div>

      <div :class="$style.panelBody">
        <form v-if="state.wizardStep === 1" :class="$style.formGrid" @submit.prevent="saveBasic">
          <FormInput v-model="basic.name" label="氏名" name="name" @update:model-value="markDirty" />
          <FormInput v-model="basic.email" label="メール" name="email" type="email" @update:model-value="markDirty" />
          <FormInput v-model="basic.phone" label="電話番号" name="phone" @update:model-value="markDirty" />
          <FormInput v-model="basic.role" label="職種" name="role" @update:model-value="markDirty" />
          <div :class="$style.actions"><BaseButton type="submit" icon="user">保存して次へ</BaseButton></div>
        </form>

        <form v-else-if="state.wizardStep === 2" :class="$style.formGrid" @submit.prevent="saveSkills">
          <FormInput v-model="skills.languages" label="開発言語" name="languages" @update:model-value="markDirty" />
          <FormInput v-model="skills.db" label="DB" name="db" @update:model-value="markDirty" />
          <FormInput v-model="skills.frameworks" label="フレームワーク" name="frameworks" @update:model-value="markDirty" />
          <FormInput v-model="skills.years" label="経験年数" name="years" type="number" @update:model-value="markDirty" />
          <div :class="$style.actions"><BaseButton type="submit" icon="user">保存して次へ</BaseButton></div>
        </form>

        <form v-else-if="state.wizardStep === 3" :class="$style.formGrid" @submit.prevent="saveTerms">
          <FormInput v-model="terms.desiredRate" label="希望単価（万円）" name="desiredRate" type="number" @update:model-value="markDirty" />
          <FormInput v-model="terms.startDate" label="稼働開始可能日" name="startDate" type="date" @update:model-value="markDirty" />
          <FormSelect v-model="terms.workRate" label="稼働率" name="workRate" :options="['', '週3', '週4', '週5']" @update:model-value="markDirty" />
          <FormSelect v-model="terms.remote" label="リモート可否" name="remote" :options="['', ...remoteOptions]" @update:model-value="markDirty" />
          <FormSelect v-model="terms.availability" label="提案可能ステータス" name="availability" :options="['', ...availabilityOptions]" @update:model-value="markDirty" />
          <label :class="$style.field">レジュメ（PDF / Word）
            <input :class="$style.control" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" @change="onResumeChange" />
          </label>
          <div :class="[$style.card, $style.full]">
            <strong>登録済みレジュメ</strong>
            <p>{{ profile.resumeName || "未登録" }}{{ profile.resumeSize ? ` / ${profile.resumeSize}` : "" }}</p>
          </div>
          <div :class="$style.actions"><BaseButton type="submit" icon="user">保存して次へ</BaseButton></div>
        </form>

        <form v-else :class="[$style.formGrid, $style.one]" @submit.prevent="saveMeeting">
          <label :class="$style.field">初回面談の候補日
            <textarea :class="$style.control" v-model="meetingCandidates" @input="markDirty"></textarea>
          </label>
          <div :class="$style.actions">
            <BaseButton type="submit" icon="calendar">登録完了</BaseButton>
            <BaseButton variant="ghost" icon="search" @click="setView('jobs')">案件検索へ</BaseButton>
          </div>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useTryangleFreelance } from "~/composables/useTryangleFreelance";
import type { ProfileTermsInput } from "~/composables/useTryangleFreelance";

const {
  state,
  remoteOptions,
  availabilityOptions,
  setView,
  saveProfileBasic,
  saveProfileSkills,
  saveProfileTerms,
  saveProfileMeeting,
  resetProfile,
  confirmDiscardChanges,
  persist,
  splitCsv,
  markDirty
} = useTryangleFreelance();

const steps = ["基本情報", "スキル", "条件・レジュメ", "面談候補"];
const profile = computed(() => state.value.profile);

const basic = reactive({ name: "", email: "", phone: "", role: "" });
const skills = reactive({ languages: "", db: "", frameworks: "", years: "" });
const terms = reactive<ProfileTermsInput>({ desiredRate: "", startDate: "", workRate: "", remote: "", availability: "", resume: null });
const meetingCandidates = ref("");

const visibleProfileSkills = computed(() => {
  return splitCsv(profile.value.languages).concat(splitCsv(profile.value.frameworks)).slice(0, 7);
});

watch(
  () => [state.value.profile.id, state.value.wizardStep],
  hydrateForms,
  { immediate: true }
);

function hydrateForms() {
  const p = state.value.profile;
  Object.assign(basic, { name: p.name, email: p.email, phone: p.phone, role: p.role });
  Object.assign(skills, { languages: p.languages, db: p.db, frameworks: p.frameworks, years: p.years });
  Object.assign(terms, {
    desiredRate: p.desiredRate,
    startDate: p.startDate,
    workRate: p.workRate,
    remote: p.remote,
    availability: p.availability,
    resume: null
  });
  meetingCandidates.value = (p.meetingCandidates || []).join("\n");
}

function moveStep(step: number) {
  if (state.value.wizardStep !== step && !confirmDiscardChanges()) return;
  state.value.wizardStep = step;
  persist();
}

function onResumeChange(event: Event) {
  const [file] = Array.from((event.target as HTMLInputElement).files || []);
  terms.resume = file || null;
  markDirty();
}

function saveBasic() {
  saveProfileBasic(basic);
}

function saveSkills() {
  saveProfileSkills(skills);
}

function saveTerms() {
  saveProfileTerms(terms);
}

function saveMeeting() {
  saveProfileMeeting(meetingCandidates.value);
}
</script>

<style module>
.grid {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.grid > *,
.formGrid > * {
  min-width: 0;
}

.two {
  grid-template-columns: minmax(300px, 0.9fr) minmax(0, 1.4fr);
}

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
  min-width: 0;
}

.panelHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
}

.panelTitle {
  margin: 0;
  color: #10294f;
  font-size: 16px;
}

.panelBody {
  padding: 16px;
}

.formGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.one {
  grid-template-columns: 1fr;
}

.field {
  display: grid;
  gap: 6px;
  color: #263f63;
  font-size: 13px;
  font-weight: 700;
}

.control {
  width: 100%;
  border: 1px solid #c6d5e8;
  border-radius: 6px;
  padding: 10px 11px;
  background: #fff;
  color: var(--ink);
  outline: none;
}

textarea.control {
  min-height: 94px;
  resize: vertical;
}

.control:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(29, 95, 211, 0.14);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 14px;
}

.stepper {
  display: grid;
  gap: 8px;
}

.step {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 6px;
  background: var(--primary-soft);
  border: 1px solid transparent;
  color: var(--muted);
}

.active {
  border-color: #9bbcec;
  color: var(--primary);
  background: var(--primary-weak);
  font-weight: 800;
}

.stepIndex {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #dfe9f7;
  color: #18365f;
  font-size: 12px;
}

.active .stepIndex {
  background: var(--primary);
  color: #fff;
}

.card {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 8px;
  padding: 14px;
  min-width: 0;
}

.cardHead {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
}

.card h3 {
  margin: 0;
  color: #10294f;
  font-size: 17px;
}

.card p {
  margin: 8px 0;
  color: var(--muted);
  line-height: 1.6;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.stackSm {
  margin-top: 14px;
}

.full {
  grid-column: 1 / -1;
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

  .cardHead {
    display: grid;
  }
}
</style>
