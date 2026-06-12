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
        <BaseButton variant="secondary" @click="resetProfile"
          >初期状態に戻す</BaseButton
        >
      </div>

      <div :class="$style.panelBody">
        <form
          v-if="state.wizardStep === 1"
          :class="$style.formGrid"
          @submit.prevent="saveBasic"
        >
          <FormInput
            v-model="basic.name"
            label="氏名"
            name="name"
            @update:model-value="markDirty"
          />
          <FormInput
            v-model="basic.email"
            label="メール"
            name="email"
            type="email"
            @update:model-value="markDirty"
          />
          <FormInput
            v-model="basic.phone"
            label="電話番号"
            name="phone"
            @update:model-value="markDirty"
          />
          <FormInput
            v-model="basic.role"
            label="職種"
            name="role"
            @update:model-value="markDirty"
          />
          <div :class="$style.actions">
            <BaseButton type="submit" icon="user">保存して次へ</BaseButton>
          </div>
        </form>

        <form
          v-else-if="state.wizardStep === 2"
          :class="$style.formGrid"
          @submit.prevent="saveSkills"
        >
          <fieldset :class="$style.skillGroup">
            <legend>開発言語</legend>
            <label
              v-for="option in languageOptions"
              :key="option"
              :class="$style.checkboxPill"
            >
              <input
                v-model="skills.languages"
                type="checkbox"
                :value="option"
                @change="markDirty"
              />
              <span>{{ option }}</span>
            </label>
          </fieldset>
          <fieldset :class="$style.skillGroup">
            <legend>DB</legend>
            <label
              v-for="option in dbOptions"
              :key="option"
              :class="$style.checkboxPill"
            >
              <input
                v-model="skills.db"
                type="checkbox"
                :value="option"
                @change="markDirty"
              />
              <span>{{ option }}</span>
            </label>
          </fieldset>
          <fieldset :class="$style.skillGroup">
            <legend>フレームワーク</legend>
            <label
              v-for="option in frameworkOptions"
              :key="option"
              :class="$style.checkboxPill"
            >
              <input
                v-model="skills.frameworks"
                type="checkbox"
                :value="option"
                @change="markDirty"
              />
              <span>{{ option }}</span>
            </label>
          </fieldset>
          <fieldset :class="$style.skillGroup">
            <legend>クラウド</legend>
            <label
              v-for="option in cloudOptions"
              :key="option"
              :class="$style.checkboxPill"
            >
              <input
                v-model="skills.cloud"
                type="checkbox"
                :value="option"
                @change="markDirty"
              />
              <span>{{ option }}</span>
            </label>
          </fieldset>
          <label :class="[$style.field, $style.full]"
            >その他
            <textarea
              v-model="skills.other"
              :class="$style.control"
              placeholder="Docker, Kubernetes, GitHub Actions など"
              @input="markDirty"
            ></textarea>
          </label>
          <FormInput
            v-model="skills.years"
            label="経験年数"
            name="years"
            type="number"
            @update:model-value="markDirty"
          />
          <div :class="$style.actions">
            <BaseButton type="submit" icon="user">保存して次へ</BaseButton>
          </div>
        </form>

        <form
          v-else-if="state.wizardStep === 3"
          :class="$style.formGrid"
          @submit.prevent="saveTerms"
        >
          <FormInput
            v-model="terms.desiredRate"
            label="希望単価（万円）"
            name="desiredRate"
            type="number"
            @update:model-value="markDirty"
          />
          <FormInput
            v-model="terms.startDate"
            label="稼働開始可能日"
            name="startDate"
            type="date"
            @update:model-value="markDirty"
          />
          <FormSelect
            v-model="terms.workRate"
            label="稼働率"
            name="workRate"
            :options="['', '週3', '週4', '週5']"
            @update:model-value="markDirty"
          />
          <FormSelect
            v-model="terms.remote"
            label="リモート可否"
            name="remote"
            :options="['', ...remoteOptions]"
            @update:model-value="markDirty"
          />
          <FormSelect
            v-model="terms.availability"
            label="提案可能ステータス"
            name="availability"
            :options="['', ...availabilityOptions]"
            @update:model-value="markDirty"
          />
          <label :class="$style.field"
            >レジュメ（PDF / Word）
            <input
              :class="$style.control"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              @change="onResumeChange"
            />
          </label>
          <div :class="[$style.card, $style.full]">
            <strong>登録済みレジュメ</strong>
            <p>
              {{ profile.resumeName || "未登録"
              }}{{ profile.resumeSize ? ` / ${profile.resumeSize}` : "" }}
            </p>
          </div>
          <div :class="$style.actions">
            <BaseButton type="submit" icon="user">保存して次へ</BaseButton>
          </div>
        </form>

        <form
          v-else
          :class="[$style.formGrid, $style.one]"
          @submit.prevent="saveMeeting"
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
                  :class="$style.control"
                  type="datetime-local"
                  @input="markDirty"
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
            <BaseButton
              variant="secondary"
              icon="plus"
              @click="addMeetingCandidate"
              >候補日を追加</BaseButton
            >
          </div>
          <div :class="$style.pledgeBox">
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
                @change="markDirty"
              />
              <span>上記の誓約条件を確認し、同意します。</span>
            </label>
          </div>
          <div :class="$style.actions">
            <BaseButton type="submit" icon="calendar">登録完了</BaseButton>
            <BaseButton variant="ghost" icon="search" @click="setView('jobs')"
              >案件検索へ</BaseButton
            >
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
  markDirty,
  languageSkillOptions,
  dbSkillOptions,
  frameworkSkillOptions,
  cloudSkillOptions,
} = useTryangleFreelance();

const steps = ["基本情報", "スキル", "条件・レジュメ", "面談候補"];
const profile = computed(() => state.value.profile);

const basic = reactive({ name: "", email: "", phone: "", role: "" });
const skills = reactive({
  languages: [] as string[],
  db: [] as string[],
  frameworks: [] as string[],
  cloud: [] as string[],
  other: "",
  years: "",
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

watch(() => [state.value.profile.id, state.value.wizardStep], hydrateForms, {
  immediate: true,
});

function hydrateForms() {
  const p = state.value.profile;
  Object.assign(basic, {
    name: p.name,
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
  });
  Object.assign(terms, {
    desiredRate: p.desiredRate,
    startDate: p.startDate,
    workRate: p.workRate,
    remote: p.remote,
    availability: p.availability,
    resume: null,
  });
  const candidates = (p.meetingCandidates || [])
    .map(toDateTimeLocal)
    .filter(Boolean);
  meetingCandidates.value = candidates.length ? candidates : [""];
  pledgeAccepted.value = Boolean(p.pledgeAccepted || p.pledgedAt);
}

async function moveStep(step: number) {
  if (state.value.wizardStep !== step && !(await confirmDiscardChanges()))
    return;
  state.value.wizardStep = step;
  persist();
}

function onResumeChange(event: Event) {
  const [file] = Array.from((event.target as HTMLInputElement).files || []);
  terms.resume = file || null;
  markDirty();
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

function saveBasic() {
  saveProfileBasic(basic);
}

function saveSkills() {
  const otherSkills = splitCsv(skills.other);
  saveProfileSkills({
    languages: skills.languages.join(", "),
    db: skills.db.join(", "),
    frameworks: skills.frameworks.join(", "),
    cloud: skills.cloud.join(", "),
    otherSkills: otherSkills.join(", "),
    years: skills.years,
  });
}

function saveTerms() {
  saveProfileTerms(terms);
}

function saveMeeting() {
  saveProfileMeeting(meetingCandidates.value, pledgeAccepted.value);
}

function toDateTimeLocal(value = "") {
  if (!value) return "";
  return value.trim().replace(" ", "T").slice(0, 16);
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
