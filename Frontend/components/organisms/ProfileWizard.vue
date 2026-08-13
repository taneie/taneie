<template>
  <div :class="[$style.grid, $style.two]">
    <aside :class="$style.panel">
      <div :class="$style.panelHeader">
        <h2 :class="$style.panelTitle">入力ステップ</h2>
      </div>
      <div :class="$style.panelBody">
        <div :class="$style.stepper">
          <button
            v-for="(label, index) in steps"
            :key="label"
            type="button"
            :class="[
              $style.step,
              { [$style.active]: state.wizardStep === index + 1 },
            ]"
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
          <p>
            {{ profile.role || "職種未入力" }} /
            {{ profile.workRate || "稼働率未入力" }} /
            {{ profile.remote || "リモート未入力" }}
          </p>
          <div :class="$style.tags">
            <TagBadge v-for="skill in visibleProfileSkills" :key="skill">{{
              skill
            }}</TagBadge>
          </div>
        </div>
      </div>
    </aside>

    <section :class="$style.panel">
      <div :class="$style.panelHeader">
        <h2 :class="$style.panelTitle">{{ steps[state.wizardStep - 1] }}</h2>
        <div :class="$style.headerActions">
          <BaseButton variant="secondary" @click="resetProfileForm"
            >初期状態に戻す</BaseButton
          >
          <BaseButton type="button" icon="calendar" @click="registerProfile"
            >登録する</BaseButton
          >
        </div>
      </div>

      <div :class="$style.panelBody">
        <div
          v-if="state.wizardStep === 1"
          :class="$style.formGrid"
        >
          <FormInput
            v-model="basic.name"
            label="お名前"
            name="name"
            autocomplete="given-name"
            :error="validationErrors.name"
            @update:model-value="markProfileFieldDirty('name')"
          />
          <FormInput
            v-model="basic.nameKana"
            label="お名前（ふりがな）"
            name="nameKana"
            :error="validationErrors.nameKana"
            @update:model-value="markProfileFieldDirty('nameKana')"
          />
          <FormInput
            v-model="basic.email"
            label="メール"
            name="email"
            type="email"
            :error="validationErrors.email"
            @update:model-value="markProfileFieldDirty('email')"
          />
          <FormInput
            v-model="basic.phone"
            label="電話番号"
            name="phone"
            :error="validationErrors.phone"
            @update:model-value="markProfileFieldDirty('phone')"
          />
          <FormSelect
            v-model="basic.role"
            label="職種"
            name="role"
            :options="roleTitleOptions"
            placeholder="職種を選択してください"
            :error="validationErrors.role"
            @update:model-value="markProfileFieldDirty('role')"
          />
        </div>

        <div
          v-else-if="state.wizardStep === 2"
          :class="$style.formGrid"
        >
          <fieldset
            :class="[
              $style.skillGroup,
              { [$style.invalidBox]: validationErrors.skills },
            ]"
          >
            <legend>開発言語</legend>
            <AppCheckboxPill
              v-for="option in languageOptions"
              :key="option"
              v-model="skills.languages"
              :value="option"
              @change="markProfileFieldDirty('skills')"
            >
              {{ option }}
            </AppCheckboxPill>
          </fieldset>
          <fieldset
            :class="[
              $style.skillGroup,
              { [$style.invalidBox]: validationErrors.skills },
            ]"
          >
            <legend>DB</legend>
            <AppCheckboxPill
              v-for="option in dbOptions"
              :key="option"
              v-model="skills.db"
              :value="option"
              @change="markProfileFieldDirty('skills')"
            >
              {{ option }}
            </AppCheckboxPill>
          </fieldset>
          <fieldset
            :class="[
              $style.skillGroup,
              { [$style.invalidBox]: validationErrors.skills },
            ]"
          >
            <legend>フレームワーク</legend>
            <AppCheckboxPill
              v-for="option in frameworkOptions"
              :key="option"
              v-model="skills.frameworks"
              :value="option"
              @change="markProfileFieldDirty('skills')"
            >
              {{ option }}
            </AppCheckboxPill>
          </fieldset>
          <fieldset
            :class="[
              $style.skillGroup,
              { [$style.invalidBox]: validationErrors.skills },
            ]"
          >
            <legend>クラウド</legend>
            <AppCheckboxPill
              v-for="option in cloudOptions"
              :key="option"
              v-model="skills.cloud"
              :value="option"
              @change="markProfileFieldDirty('skills')"
            >
              {{ option }}
            </AppCheckboxPill>
          </fieldset>
          <FieldLabel label="その他" full>
            <AppTextarea
              v-model="skills.other"
              name="otherSkills"
              placeholder="Docker, Kubernetes, GitHub Actions など"
              @update:model-value="markProfileFieldDirty('skills')"
            />
          </FieldLabel>
          <p
            v-if="validationErrors.skills"
            :class="[$style.errorText, $style.full]"
          >
            {{ validationErrors.skills }}
          </p>
          <FormInput
            v-model="skills.years"
            label="経験年数"
            name="years"
            type="number"
            :error="validationErrors.years"
            @update:model-value="markProfileFieldDirty('years')"
          />
          <fieldset
            v-if="selectedSkillNames.length"
            :class="[$style.skillGroup, $style.skillExperienceGroup]"
          >
            <legend>スキルごとの経験年数</legend>
            <FormInput
              v-for="skillName in selectedSkillNames"
              :key="skillName"
              v-model="skills.skillExperiences[skillName]"
              :label="skillName"
              :name="`skillExperience-${skillName}`"
              type="number"
              @update:model-value="markDirty"
            />
          </fieldset>
        </div>

        <div
          v-else-if="state.wizardStep === 3"
          :class="$style.formGrid"
        >
          <FormInput
            v-model="terms.desiredRate"
            label="希望単価（万円）"
            name="desiredRate"
            type="number"
            :error="validationErrors.desiredRate"
            @update:model-value="markProfileFieldDirty('desiredRate')"
          />
          <FormInput
            v-model="terms.startDate"
            label="稼働開始可能日"
            name="startDate"
            type="date"
            :error="validationErrors.startDate"
            @update:model-value="markProfileFieldDirty('startDate')"
          />
          <FormSelect
            v-model="terms.workRate"
            label="稼働率"
            name="workRate"
            :options="['', '週3', '週4', '週5']"
            :error="validationErrors.workRate"
            @update:model-value="markProfileFieldDirty('workRate')"
          />
          <FormSelect
            v-model="terms.remote"
            label="リモート可否"
            name="remote"
            :options="['', ...remoteOptions]"
            :error="validationErrors.remote"
            @update:model-value="markProfileFieldDirty('remote')"
          />
          <FormSelect
            v-model="terms.availability"
            label="提案可能ステータス"
            name="availability"
            :options="['', ...availabilityOptions]"
            :error="validationErrors.availability"
            @update:model-value="markProfileFieldDirty('availability')"
          />
          <div
            :class="[
              $style.field,
              { [$style.invalidField]: validationErrors.resume },
            ]"
          >
            <span>レジュメ（PDF / Word / Excel）</span>
            <div :class="$style.filePicker">
              <BaseButton
                type="button"
                variant="secondary"
                icon="plus"
                @click="openResumeFilePicker"
              >
                ファイルを選択
              </BaseButton>
              <span :class="$style.fileName">{{ selectedResumeFileLabel }}</span>
            </div>
            <input
              ref="resumeInput"
              :class="$style.fileInput"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              @change="onResumeChange"
            />
            <p v-if="validationErrors.resume" :class="$style.errorText">
              {{ validationErrors.resume }}
            </p>
          </div>
          <div
            :class="[
              $style.card,
              $style.full,
              { [$style.invalidField]: validationErrors.resume },
            ]"
          >
            <strong>登録済みレジュメ</strong>
            <p v-if="pendingDeletedResume" :class="$style.deletedResume">
              削除予定:
              {{ pendingDeletedResume.name
              }}{{ pendingDeletedResume.size ? ` / ${pendingDeletedResume.size}` : "" }}
            </p>
            <p v-else>
              {{ profile.resumeName || "未登録"
              }}{{ profile.resumeSize ? ` / ${profile.resumeSize}` : "" }}
            </p>
            <div
              v-if="profile.resumeName || pendingDeletedResume"
              :class="$style.resumeActions"
            >
              <BaseButton
                v-if="profile.resumeName && !pendingDeletedResume"
                type="button"
                variant="secondary"
                @click="requestResumeDeletion"
              >
                削除
              </BaseButton>
              <BaseButton
                v-if="pendingDeletedResume"
                type="button"
                variant="secondary"
                @click="cancelResumeDeletion"
              >
                削除を取り消す
              </BaseButton>
            </div>
          </div>
        </div>

        <div
          v-else
          :class="[$style.formGrid, $style.one]"
        >
          <div :class="$style.field">
            <span>初回面談の候補日</span>
            <div :class="$style.dateRows">
              <div
                v-for="(_, index) in meetingCandidates"
                :key="index"
                :class="$style.dateRow"
              >
                <input
                  v-model="meetingCandidates[index]"
                  :class="[
                    $style.control,
                    {
                      [$style.invalidControl]:
                        validationErrors.meetingCandidates,
                    },
                  ]"
                  type="datetime-local"
                  @input="markProfileFieldDirty('meetingCandidates')"
                />
                <BaseButton
                  v-if="meetingCandidates.length > 1"
                  variant="ghost"
                  @click="removeMeetingCandidate(index)"
                >
                  削除
                </BaseButton>
              </div>
            </div>
            <p
              v-if="validationErrors.meetingCandidates"
              :class="$style.errorText"
            >
              {{ validationErrors.meetingCandidates }}
            </p>
            <BaseButton
              variant="secondary"
              icon="plus"
              @click="addMeetingCandidate"
              >候補日を追加</BaseButton
            >
          </div>
          <div
            :class="[
              $style.pledgeBox,
              { [$style.invalidBox]: validationErrors.pledgeAccepted },
            ]"
          >
            <h3>案件閲覧前の誓約条件</h3>
            <ul>
              <li>
                案件情報、クライアント情報、個人情報、営業上知り得た情報を第三者へ開示・漏えいしません。
              </li>
              <li>
                職務経歴、スキル、稼働条件、連絡先など登録情報に虚偽がないことを誓約します。
              </li>
              <li>
                参画後は連絡、勤怠、成果物提出、報告相談を滞りなく行い、業務遂行に支障が出る場合は速やかに連絡します。
              </li>
              <li>
                契約、秘密保持、情報セキュリティ、個人情報保護に関する指示を遵守します。
              </li>
            </ul>
            <label :class="$style.checkLine">
              <input
                v-model="pledgeAccepted"
                type="checkbox"
                @change="markProfileFieldDirty('pledgeAccepted')"
              />
              <span>上記の誓約条件を確認し、同意します。</span>
            </label>
            <p v-if="validationErrors.pledgeAccepted" :class="$style.errorText">
              {{ validationErrors.pledgeAccepted }}
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useFrichyRuntime } from "~/composables/frichy/useFrichyRuntime";
import {
  firstProfileRegistrationErrorKey,
  hasProfileRegistrationValidationErrors,
  profileRegistrationErrorKeys,
  profileRegistrationErrorSteps,
  validateProfileRegistrationInput,
  type ProfileRegistrationErrorKey,
  type ProfileRegistrationValidationErrors,
} from "~/composables/frichy/profileValidation";
import type {
  ProfileRegistrationInput,
  ProfileTermsInput,
} from "~/composables/frichy/types";

const {
  state,
  remoteOptions,
  availabilityOptions,
  applyProfileRegistrationDraft,
  saveProfileRegistration,
  resetProfile,
  persist,
  splitCsv,
  markDirty,
  languageSkillOptions,
  dbSkillOptions,
  frameworkSkillOptions,
  cloudSkillOptions,
  roleTitleOptions,
} = useFrichyRuntime();

const steps = ["基本情報", "スキル", "条件・レジュメ", "面談候補"];
const profile = computed(() => state.value.profile);

const basic = reactive({
  name: "",
  nameKana: "",
  email: "",
  phone: "",
  role: "",
});
const skills = reactive({
  languages: [] as string[],
  db: [] as string[],
  frameworks: [] as string[],
  cloud: [] as string[],
  other: "",
  years: "",
  skillExperiences: {} as Record<string, string>,
});
const terms = reactive<ProfileTermsInput>({
  desiredRate: "",
  startDate: "",
  workRate: "",
  remote: "",
  availability: "",
  resume: null,
});
const meetingCandidates = ref<string[]>([""]);
const pledgeAccepted = ref(false);
const resumeInput = ref<HTMLInputElement | null>(null);
const pendingDeletedResume = ref<{
  id: string;
  name: string;
  type: string;
  size: string;
} | null>(null);
const validationErrors = reactive<ProfileRegistrationValidationErrors>({});
const languageOptions = languageSkillOptions;
const dbOptions = dbSkillOptions;
const frameworkOptions = frameworkSkillOptions;
const cloudOptions = cloudSkillOptions;

const visibleProfileSkills = computed(() => {
  return splitCsv(profile.value.languages)
    .concat(
      splitCsv(profile.value.frameworks),
      splitCsv(profile.value.db),
      splitCsv(profile.value.cloud),
      splitCsv(profile.value.otherSkills),
    )
    .slice(0, 7);
});

const selectedSkillNames = computed(() => {
  return [...new Set([
    ...skills.languages,
    ...skills.db,
    ...skills.frameworks,
    ...skills.cloud,
    ...splitCsv(skills.other),
  ])];
});

const selectedResumeFileLabel = computed(() => {
  if (!terms.resume) return "未選択";

  return `${terms.resume.name} / ${formatFileSize(terms.resume.size)}`;
});

watch(() => state.value.profile.id, hydrateForms, {
  immediate: true,
});

function hydrateForms() {
  const p = state.value.profile;
  Object.assign(basic, {
    name: p.name,
    nameKana: p.nameKana,
    email: p.email,
    phone: p.phone,
    role: p.role,
  });
  const savedLanguages = splitCsv(p.languages);
  const savedDb = splitCsv(p.db);
  const savedFrameworks = splitCsv(p.frameworks);
  const savedCloud = splitCsv(p.cloud);
  const savedOther = splitCsv(p.otherSkills);
  Object.assign(skills, {
    languages: savedLanguages.filter((skill) =>
      languageOptions.includes(skill),
    ),
    db: savedDb.filter((skill) => dbOptions.includes(skill)),
    frameworks: savedFrameworks.filter((skill) =>
      frameworkOptions.includes(skill),
    ),
    cloud: savedCloud.filter((skill) => cloudOptions.includes(skill)),
    other: [
      ...savedLanguages.filter((skill) => !languageOptions.includes(skill)),
      ...savedDb.filter((skill) => !dbOptions.includes(skill)),
      ...savedFrameworks.filter((skill) => !frameworkOptions.includes(skill)),
      ...savedCloud.filter((skill) => !cloudOptions.includes(skill)),
      ...savedOther,
    ].join(", "),
    years: p.years,
    skillExperiences: { ...p.skillExperiences },
  });
  Object.assign(terms, {
    desiredRate: p.desiredRate,
    startDate: p.startDate,
    workRate: p.workRate,
    remote: p.remote,
    availability: p.availability,
    resume: null,
  });
  pendingDeletedResume.value = null;
  const candidates = (p.meetingCandidates || [])
    .map(toDateTimeLocal)
    .filter(Boolean);
  meetingCandidates.value = candidates.length ? candidates : [""];
  pledgeAccepted.value = Boolean(p.pledgeAccepted || p.pledgedAt);
}

function moveStep(step: number) {
  state.value.wizardStep = step;
  persist();
}

async function resetProfileForm() {
  if (await resetProfile()) hydrateForms();
}

function onResumeChange(event: Event) {
  const [file] = Array.from((event.target as HTMLInputElement).files || []);
  terms.resume = file || null;
  markProfileFieldDirty("resume");
}

function requestResumeDeletion() {
  if (!profile.value.resumeName) return;
  pendingDeletedResume.value = {
    id: profile.value.resumeId,
    name: profile.value.resumeName,
    type: profile.value.resumeType,
    size: profile.value.resumeSize,
  };
  markProfileFieldDirty("resume");
}

function cancelResumeDeletion() {
  pendingDeletedResume.value = null;
  markProfileFieldDirty("resume");
}

function openResumeFilePicker() {
  if (!resumeInput.value) return;
  resumeInput.value.value = "";
  resumeInput.value.click();
}

function addMeetingCandidate() {
  meetingCandidates.value.push("");
  markDirty();
}

function removeMeetingCandidate(index: number) {
  meetingCandidates.value.splice(index, 1);
  if (!meetingCandidates.value.length) meetingCandidates.value.push("");
  markDirty();
}

function buildProfileRegistrationInput(): ProfileRegistrationInput {
  const otherSkills = splitCsv(skills.other);

  return {
    basic: {
      name: basic.name,
      nameKana: basic.nameKana,
      email: basic.email,
      phone: basic.phone,
      role: basic.role,
    },
    skills: {
      languages: skills.languages.join(", "),
      db: skills.db.join(", "),
      frameworks: skills.frameworks.join(", "),
      cloud: skills.cloud.join(", "),
      otherSkills: otherSkills.join(", "),
      years: skills.years,
      skillExperiences: Object.fromEntries(
        selectedSkillNames.value.map((skillName) => [
          skillName,
          skills.skillExperiences[skillName] || "",
        ]),
      ),
    },
    terms: {
      ...terms,
      deleteExistingResume: Boolean(pendingDeletedResume.value),
      deleteExistingResumeId: pendingDeletedResume.value?.id || "",
    },
    meetingCandidates: meetingCandidates.value,
    pledgeAccepted: pledgeAccepted.value,
  };
}

async function registerProfile() {
  const input = buildProfileRegistrationInput();
  applyProfileRegistrationDraft(input);
  const errors = validateProfileRegistrationInput(input, {
    hasExistingResume: Boolean(
      profile.value.resumeName && !pendingDeletedResume.value,
    ),
  });
  setValidationErrors(errors);
  if (hasProfileRegistrationValidationErrors(errors)) {
    const firstError = firstProfileRegistrationErrorKey(errors);
    if (firstError) moveStep(profileRegistrationErrorSteps[firstError]);
    return;
  }

  const saved = await saveProfileRegistration(input);
  if (saved) pendingDeletedResume.value = null;
}

function markProfileFieldDirty(...keys: ProfileRegistrationErrorKey[]) {
  keys.forEach((key) => delete validationErrors[key]);
  markDirty();
}

function setValidationErrors(errors: ProfileRegistrationValidationErrors) {
  profileRegistrationErrorKeys.forEach((key) => {
    if (errors[key]) validationErrors[key] = errors[key];
    else delete validationErrors[key];
  });
}

function toDateTimeLocal(value = "") {
  if (!value) return "";
  return value.trim().replace(" ", "T").slice(0, 16);
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${Math.ceil(bytes / 1024 / 1024)}MB`;

  return `${Math.ceil(bytes / 1024)}KB`;
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

.headerActions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
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

.invalidControl {
  border-color: #d83f4b;
  background: #fff7f7;
}

.invalidControl:focus {
  border-color: #d83f4b;
  box-shadow: 0 0 0 3px rgba(216, 63, 75, 0.16);
}

.filePicker {
  position: relative;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.fileInput {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  border: 0;
  opacity: 0;
  pointer-events: none;
}

.fileName {
  min-width: 0;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.deletedResume {
  color: #b8202d;
  font-weight: 800;
}

.resumeActions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.dateRows {
  display: grid;
  gap: 8px;
}

.dateRow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.skillGroup {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 8px;
  min-width: 0;
  margin: 0;
  padding: 12px;
  border: 1px solid #c6d5e8;
  border-radius: 8px;
  background: #f8fbff;
}

.skillGroup legend {
  padding: 0 4px;
  color: #263f63;
  font-size: 13px;
  font-weight: 800;
}

.invalidBox {
  border-color: #d83f4b;
  background: #fff7f7;
}

.invalidField {
  border: 1px solid #d83f4b;
  border-radius: 8px;
  padding: 10px;
  background: #fff7f7;
}

.errorText {
  margin: 0;
  color: #b8202d;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.45;
}

.skillExperienceGroup {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  align-items: start;
  max-height: 360px;
  overflow-y: auto;
}

.skillExperienceGroup legend {
  grid-column: 1 / -1;
}

.checkboxPill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 0 10px;
  border: 1px solid #bfd0e6;
  border-radius: 999px;
  background: #fff;
  color: #263f63;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.checkboxPill input {
  width: 15px;
  height: 15px;
  accent-color: var(--primary);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 14px;
}

.pledgeBox {
  border: 1px solid #b9cae2;
  border-radius: 8px;
  background: #f8fbff;
  padding: 14px;
  color: #263f63;
  line-height: 1.7;
}

.pledgeBox h3 {
  margin: 0 0 8px;
  color: #10294f;
  font-size: 15px;
}

.pledgeBox ul {
  margin: 0;
  padding-left: 18px;
}

.checkLine {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  margin-top: 12px;
  font-weight: 800;
}

.checkLine input {
  margin-top: 5px;
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

  .dateRow {
    grid-template-columns: 1fr;
  }

  .cardHead {
    display: grid;
  }
}
</style>
