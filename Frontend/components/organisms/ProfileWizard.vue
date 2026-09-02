<template>
  <div :class="[$style.grid, $style.two]">
    <aside :class="$style.panel">
      <div :class="$style.panelHeader">
        <h2 :class="$style.panelTitle">入力ステップ</h2>
      </div>
      <div :class="$style.panelBody">
        <div
          :class="[
            $style.progressSummary,
            { [$style.progressReady]: draftCanApply },
          ]"
        >
          <span :class="$style.progressKicker">
            {{ progressKickerText }}
          </span>
          <strong>
            {{ progressTitle }}
          </strong>
          <p>
            {{ progressDescription }}
          </p>
          <div
            :class="$style.progressTrack"
            role="progressbar"
            :aria-valuenow="progressPercent"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <span :style="{ width: `${progressPercent}%` }" />
          </div>
          <BaseButton
            v-if="canOpenJobsFromCurrentInput"
            type="button"
            icon="search"
            @click="goToJobs"
          >
            案件を探す
          </BaseButton>
          <button
            v-else-if="!draftCanApply && firstPendingRequirement"
            type="button"
            :class="$style.nextAction"
            @click="moveStep(firstPendingRequirement.step)"
          >
            次に入力: {{ firstPendingRequirement.label }}
          </button>
        </div>

        <div :class="$style.stepper">
          <button
            v-for="(label, index) in steps"
            :key="label"
            type="button"
            :class="[
              $style.step,
              {
                [$style.active]: state.wizardStep === index + 1,
                [$style.completed]: isStepComplete(index + 1),
                [$style.nextStep]: isNextStep(index + 1),
              },
            ]"
            @click="moveStep(index + 1)"
          >
            <span :class="$style.stepIndex">{{ index + 1 }}</span>
            <span :class="$style.stepMain">
              <span>{{ label }}</span>
              <small>{{ stepGuide(index + 1).summary }}</small>
            </span>
            <span :class="$style.stepStatus">
              {{ stepStatusLabel(index + 1) }}
            </span>
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
        <div :class="$style.stepGuide">
          <div>
            <span>STEP {{ state.wizardStep }} / {{ steps.length }}</span>
            <h3>{{ activeStepGuide.title }}</h3>
            <p>{{ activeStepGuide.description }}</p>
          </div>
          <ul :class="$style.stepChecklist">
            <li
              v-for="item in currentStepRequirements"
              :key="item.label"
              :class="item.done ? $style.checkDone : $style.checkPending"
            >
              <span>{{ item.done ? "完了" : "未入力" }}</span>
              {{ item.label }}
            </li>
          </ul>
        </div>

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
            :model-value="registeredEmail"
            label="メールアドレス"
            name="email"
            type="email"
            autocomplete="email"
            readonly
            :error="validationErrors.email"
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
            <legend>言語</legend>
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
            <legend>OS</legend>
            <AppCheckboxPill
              v-for="option in osOptions"
              :key="option"
              v-model="skills.operatingSystems"
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
            <legend>業種</legend>
            <AppCheckboxPill
              v-for="option in industryOptions"
              :key="option"
              v-model="skills.industries"
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
              placeholder="その他のスキルを入力してください"
              @update:model-value="markProfileFieldDirty('skills')"
            />
          </FieldLabel>
          <p
            v-if="validationErrors.skills"
            :class="[$style.errorText, $style.full]"
          >
            {{ validationErrors.skills }}
          </p>
          <div :class="$style.compactField">
            <FormInput
              v-model="skills.years"
              label="経験年数"
              name="years"
              type="number"
              :min="0"
              :max="MAX_PROFILE_EXPERIENCE_YEARS"
              :error="validationErrors.years"
              @update:model-value="markProfileFieldDirty('years')"
            />
          </div>
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
              :min="0"
              :max="MAX_PROFILE_EXPERIENCE_YEARS"
              @update:model-value="markProfileFieldDirty('years')"
            />
          </fieldset>
        </div>

        <div
          v-else-if="state.wizardStep === 3"
          :class="$style.formGrid"
        >
          <div
            :class="[
              $style.field,
              { [$style.invalidField]: validationErrors.desiredRate },
            ]"
          >
            <span>希望単価（万円）</span>
            <input
              v-model="terms.desiredRate"
              :class="[
                $style.control,
                { [$style.invalidControl]: validationErrors.desiredRate },
              ]"
              name="desiredRate"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="3"
              placeholder="例: 80"
              @input="onDesiredRateInput"
            />
            <p :class="$style.helpText">
              30〜300万円の範囲で、万円単位の整数を入力してください。
            </p>
            <p v-if="validationErrors.desiredRate" :class="$style.errorText">
              {{ validationErrors.desiredRate }}
            </p>
          </div>
          <div
            :class="[
              $style.field,
              { [$style.invalidField]: validationErrors.startDate },
            ]"
          >
            <span>最短稼働開始日</span>
            <input
              v-model="terms.startDate"
              :class="[
                $style.control,
                { [$style.invalidControl]: validationErrors.startDate },
              ]"
              name="startDate"
              type="date"
              :min="minimumStartDate"
              @input="markProfileFieldDirty('startDate')"
            />
            <p :class="$style.helpText">
              最短で案件に参画できる日を入力してください。
            </p>
            <p v-if="validationErrors.startDate" :class="$style.errorText">
              {{ validationErrors.startDate }}
            </p>
          </div>
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
          <div
            :class="[
              $style.field,
              { [$style.invalidField]: validationErrors.availability },
            ]"
          >
            <span>案件提案の受付状況</span>
            <AppSelect
              v-model="terms.availability"
              name="availability"
              :options="['', ...availabilityOptions]"
              :error="Boolean(validationErrors.availability)"
              @update:model-value="markProfileFieldDirty('availability')"
            />
            <p :class="$style.helpText">
              現在、案件紹介を受けられる状態かを選択してください。
            </p>
            <dl :class="$style.optionGuide">
              <div>
                <dt>即稼働可</dt>
                <dd>すぐに案件提案・参画調整を進められる状態</dd>
              </div>
              <div>
                <dt>稼働可能開始日</dt>
                <dd>上の最短稼働開始日以降であれば提案可能な状態</dd>
              </div>
              <div>
                <dt>営業停止中</dt>
                <dd>今は案件提案を受けない状態</dd>
              </div>
            </dl>
            <p v-if="validationErrors.availability" :class="$style.errorText">
              {{ validationErrors.availability }}
            </p>
          </div>
          <div
            :class="[
              $style.field,
              { [$style.invalidField]: validationErrors.resume },
            ]"
          >
            <span>レジュメ（職務経歴書・スキルシート）</span>
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
            <p :class="$style.helpText">
              職務経歴書、スキルシートなど、案件提案に使える経歴資料を添付してください。PDF / Word / Excelに対応しています。
            </p>
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
            <p :class="$style.helpText">
              営業担当との初回面談が可能な、現在以降の日時を入力してください。
            </p>
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
                  :min="minimumMeetingCandidateDateTime"
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
  MAX_PROFILE_DESIRED_RATE,
  MAX_PROFILE_EXPERIENCE_YEARS,
  MIN_PROFILE_DESIRED_RATE,
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
  osSkillOptions,
  industrySkillOptions,
  roleTitleOptions,
  canViewJobs,
  setView,
} = useFrichyRuntime();

const steps = ["基本情報", "スキル", "条件・レジュメ", "面談候補"];
const stepGuides = [
  {
    title: "連絡できる基本情報を入力",
    summary: "氏名・連絡先・職種",
    description:
      "営業担当が本人確認と案件提案に使う情報です。メールアドレスは登録時の値を使います。",
  },
  {
    title: "得意分野と経験年数を選択",
    summary: "スキル・経験年数",
    description:
      "案件とのマッチングに使う情報です。該当するスキルを選び、経験年数を入力してください。",
  },
  {
    title: "希望条件とレジュメを登録",
    summary: "単価・稼働条件・レジュメ",
    description:
      "希望単価、最短稼働開始日、案件提案の受付状況、レジュメをそろえると提案精度が上がります。",
  },
  {
    title: "初回面談候補と誓約同意",
    summary: "候補日・誓約同意",
    description:
      "候補日と誓約同意までそろうと、案件検索・応募に進めます。",
  },
];
const profile = computed(() => state.value.profile);
const registeredEmail = computed(
  () => state.value.auth?.email || profile.value.email || "",
);

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
  operatingSystems: [] as string[],
  industries: [] as string[],
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
const osOptions = osSkillOptions;
const industryOptions = industrySkillOptions;

const visibleProfileSkills = computed(() => {
  return splitCsv(profile.value.languages)
    .concat(
      splitCsv(profile.value.frameworks),
      splitCsv(profile.value.db),
      splitCsv(profile.value.operatingSystems),
      splitCsv(profile.value.industries),
      splitCsv(profile.value.otherSkills),
    )
    .slice(0, 7);
});

const selectedSkillNames = computed(() => {
  return [...new Set([
    ...skills.languages,
    ...skills.db,
    ...skills.frameworks,
    ...skills.operatingSystems,
    ...skills.industries,
    ...splitCsv(skills.other),
  ])];
});

const selectedResumeFileLabel = computed(() => {
  if (!terms.resume) return "未選択";

  return `${terms.resume.name} / ${formatFileSize(terms.resume.size)}`;
});
const hasExistingResumeForDraft = computed(() =>
  Boolean(profile.value.resumeName && !pendingDeletedResume.value),
);
const draftValidationErrors = computed(() =>
  validateProfileRegistrationInput(buildProfileRegistrationInput(), {
    hasExistingResume: hasExistingResumeForDraft.value,
  }),
);
const draftRequirementItems = computed(() => {
  const errors = draftValidationErrors.value;
  return [
    {
      label: "基本情報",
      step: 1,
      done: !errors.name && !errors.nameKana && !errors.email && !errors.phone && !errors.role,
    },
    {
      label: "スキル詳細",
      step: 2,
      done: !errors.skills && !errors.years,
    },
    {
      label: "稼働条件",
      step: 3,
      done:
        !errors.desiredRate &&
        !errors.startDate &&
        !errors.workRate &&
        !errors.remote &&
        !errors.availability,
    },
    { label: "レジュメ", step: 3, done: !errors.resume },
    { label: "面談候補", step: 4, done: !errors.meetingCandidates },
    { label: "誓約同意", step: 4, done: !errors.pledgeAccepted },
  ];
});
const totalRequirementCount = computed(() => draftRequirementItems.value.length);
const completedRequirementCount = computed(
  () => draftRequirementItems.value.filter((item) => item.done).length,
);
const pendingRequirementCount = computed(
  () => totalRequirementCount.value - completedRequirementCount.value,
);
const draftCanApply = computed(() =>
  draftRequirementItems.value.every((item) => item.done),
);
const canOpenJobsFromCurrentInput = computed(
  () => canViewJobs.value && draftCanApply.value,
);
const progressPercent = computed(() =>
  totalRequirementCount.value
    ? Math.round(
        (completedRequirementCount.value / totalRequirementCount.value) * 100,
      )
    : 0,
);
const firstPendingRequirement = computed(() =>
  draftRequirementItems.value.find((item) => !item.done),
);
const progressKickerText = computed(() => {
  if (canOpenJobsFromCurrentInput.value) return "案件応募できます";
  if (draftCanApply.value) return "登録すると応募できます";
  return `案件応募まであと${pendingRequirementCount.value}項目`;
});
const progressTitle = computed(() => {
  if (canOpenJobsFromCurrentInput.value) return "入力条件がそろいました";
  if (draftCanApply.value) return "最後に登録するだけです";
  return "順番に入力すると応募可能になります";
});
const progressDescription = computed(() => {
  if (canOpenJobsFromCurrentInput.value)
    return "案件検索画面から、気になる案件へ応募できます。";
  if (draftCanApply.value)
    return "右上の「登録する」を押すと、案件検索・応募に進めます。";
  return `${completedRequirementCount.value}/${totalRequirementCount.value}項目が入力済みです。`;
});
const activeStepGuide = computed(() => stepGuide(state.value.wizardStep));
const currentStepRequirements = computed(() =>
  draftRequirementItems.value.filter(
    (item) => item.step === state.value.wizardStep,
  ),
);
const minimumStartDate = currentDateInputValue();
const minimumMeetingCandidateDateTime = currentDateTimeInputValue();

watch(() => state.value.profile.id, hydrateForms, {
  immediate: true,
});

function hydrateForms() {
  const p = state.value.profile;
  Object.assign(basic, {
    name: p.name,
    nameKana: p.nameKana,
    email: registeredEmail.value,
    phone: p.phone,
    role: p.role,
  });
  const legacyProfile = p as typeof p & { cloud?: string };
  const savedSkills = [
    p.languages,
    p.db,
    p.frameworks,
    p.operatingSystems,
    p.industries,
    legacyProfile.cloud,
    p.otherSkills,
  ].flatMap(splitCsv);
  Object.assign(skills, {
    languages: savedSkills.filter((skill) => languageOptions.includes(skill)),
    db: savedSkills.filter((skill) => dbOptions.includes(skill)),
    frameworks: savedSkills.filter((skill) =>
      frameworkOptions.includes(skill),
    ),
    operatingSystems: savedSkills.filter((skill) => osOptions.includes(skill)),
    industries: savedSkills.filter((skill) => industryOptions.includes(skill)),
    other: savedSkills
      .filter(
        (skill) =>
          !languageOptions.includes(skill) &&
          !dbOptions.includes(skill) &&
          !frameworkOptions.includes(skill) &&
          !osOptions.includes(skill) &&
          !industryOptions.includes(skill),
      )
      .join(", "),
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

async function goToJobs() {
  await setView("jobs");
}

async function resetProfileForm() {
  if (await resetProfile()) hydrateForms();
}

function onResumeChange(event: Event) {
  const [file] = Array.from((event.target as HTMLInputElement).files || []);
  terms.resume = file || null;
  markProfileFieldDirty("resume");
}

function onDesiredRateInput(event: Event) {
  terms.desiredRate = (event.target as HTMLInputElement).value
    .replace(/\D/g, "")
    .slice(0, 3);
  markProfileFieldDirty("desiredRate");
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
      email: registeredEmail.value,
      phone: basic.phone,
      role: basic.role,
    },
    skills: {
      languages: skills.languages.join(", "),
      db: skills.db.join(", "),
      frameworks: skills.frameworks.join(", "),
      operatingSystems: skills.operatingSystems.join(", "),
      industries: skills.industries.join(", "),
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

function currentDateInputValue(date = new Date()) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function currentDateTimeInputValue() {
  const date = new Date();
  return `${currentDateInputValue(date)}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function stepGuide(step: number) {
  return stepGuides[step - 1] || stepGuides[0];
}

function requirementsForStep(step: number) {
  return draftRequirementItems.value.filter((item) => item.step === step);
}

function isStepComplete(step: number) {
  const requirements = requirementsForStep(step);
  return Boolean(requirements.length) && requirements.every((item) => item.done);
}

function isNextStep(step: number) {
  return !draftCanApply.value && firstPendingRequirement.value?.step === step;
}

function stepStatusLabel(step: number) {
  if (state.value.wizardStep === step) return "入力中";
  if (isStepComplete(step)) return "完了";
  if (isNextStep(step)) return "次に入力";
  return "未入力あり";
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

.compactField {
  align-self: start;
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
  font-size: 16px;
  line-height: 1.45;
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

.helpText {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.55;
}

.optionGuide {
  display: grid;
  gap: 6px;
  margin: 4px 0 0;
}

.optionGuide div {
  display: grid;
  grid-template-columns: minmax(92px, 0.36fr) minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}

.optionGuide dt,
.optionGuide dd {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
}

.optionGuide dt {
  color: #10294f;
  font-weight: 900;
}

.optionGuide dd {
  color: var(--muted);
  font-weight: 700;
  overflow-wrap: anywhere;
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

.progressSummary {
  display: grid;
  gap: 8px;
  margin-bottom: 14px;
  padding: 14px;
  border: 1px solid #bfd3ec;
  border-left: 4px solid var(--primary);
  border-radius: 8px;
  background: #f6faff;
}

.progressReady {
  border-color: #a9d9be;
  border-left-color: #23a065;
  background: #f4fbf7;
}

.progressKicker {
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
}

.progressReady .progressKicker {
  color: #147348;
}

.progressSummary strong {
  color: #10294f;
  font-size: 16px;
  line-height: 1.45;
}

.progressSummary p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.6;
}

.progressSummary button {
  width: fit-content;
}

.progressTrack {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #dbe7f5;
}

.progressTrack span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--primary), #23a065);
  transition: width 0.2s ease;
}

.nextAction {
  justify-self: start;
  min-height: 36px;
  border: 1px solid #bfd3ec;
  border-radius: 6px;
  padding: 0 12px;
  background: #fff;
  color: var(--primary);
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
}

.nextAction:focus-visible {
  outline: 3px solid rgba(29, 95, 211, 0.18);
  outline-offset: 2px;
}

.stepper {
  display: grid;
  gap: 8px;
}

.step {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 58px;
  padding: 10px;
  border-radius: 6px;
  background: var(--primary-soft);
  border: 1px solid transparent;
  color: var(--muted);
  text-align: left;
  cursor: pointer;
}

.active {
  border-color: #9bbcec;
  color: var(--primary);
  background: var(--primary-weak);
  font-weight: 800;
}

.completed:not(.active) {
  border-color: #c9dfd1;
  background: #f5fbf7;
  color: #236044;
}

.nextStep:not(.active) {
  border-color: #e4bd63;
  background: #fff8e9;
  color: #80560d;
}

.stepIndex {
  flex: 0 0 auto;
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

.completed:not(.active) .stepIndex {
  background: #23a065;
  color: #fff;
}

.nextStep:not(.active) .stepIndex {
  background: #f1b944;
  color: #10294f;
}

.stepMain {
  display: grid;
  gap: 2px;
  min-width: 0;
  flex: 1 1 auto;
}

.stepMain span {
  overflow-wrap: anywhere;
}

.stepMain small {
  color: currentColor;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.35;
  opacity: 0.78;
}

.stepStatus {
  flex: 0 0 auto;
  min-width: 62px;
  border: 1px solid rgba(38, 63, 99, 0.16);
  border-radius: 999px;
  padding: 4px 7px;
  background: rgba(255, 255, 255, 0.78);
  color: currentColor;
  font-size: 11px;
  font-weight: 900;
  text-align: center;
}

.stepGuide {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 0.7fr);
  gap: 14px;
  align-items: start;
  margin-bottom: 16px;
  padding: 14px;
  border: 1px solid #d2e0f1;
  border-radius: 8px;
  background: #f8fbff;
}

.stepGuide span {
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
}

.stepGuide h3 {
  margin: 4px 0 6px;
  color: #10294f;
  font-size: 16px;
}

.stepGuide p {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.6;
}

.stepChecklist {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.stepChecklist li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  max-width: 100%;
  border: 1px solid #d2e0f1;
  border-radius: 6px;
  padding: 4px 8px;
  background: #fff;
  color: #263f63;
  font-size: 12px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.stepChecklist li span {
  flex: 0 0 auto;
  color: inherit;
  font-size: 11px;
}

.checkDone {
  border-color: #b9ddc6;
  background: #f1fbf5;
  color: #236044;
}

.checkPending {
  border-color: #e8c36e;
  background: #fff9ed;
  color: #80560d;
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
  .grid {
    padding-bottom: calc(150px + env(safe-area-inset-bottom));
  }

  .panelBody,
  .panelHeader {
    padding: 12px;
  }

  .panelHeader {
    align-items: stretch;
  }

  .headerActions {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 40;
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
    border-top: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 -10px 28px rgba(16, 41, 79, 0.12);
  }

  .headerActions button {
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

  .progressSummary button,
  .nextAction {
    width: 100%;
  }

  .step {
    align-items: flex-start;
  }

  .stepStatus {
    min-width: 58px;
  }

  .stepGuide {
    grid-template-columns: 1fr;
  }

  .optionGuide div {
    grid-template-columns: 1fr;
    gap: 2px;
  }

  .dateRow {
    grid-template-columns: 1fr;
  }

  .cardHead {
    display: grid;
  }
}
</style>
