<template>
  <PageHead
    title="問い合わせ"
    :kicker="
      currentRole === 'sales'
        ? '問い合わせを確認し、回答します。'
        : 'サービス利用中の確認事項やサポート依頼を送信します。'
    "
  />

  <section v-if="currentRole === 'sales'" :class="$style.panel">
    <div :class="$style.panelHeader">
      <h2 :class="$style.panelTitle">問い合わせ一覧</h2>
    </div>
    <div :class="$style.panelBody">
      <p v-if="!state.contactInquiries.length" :class="$style.empty">
        問い合わせはまだありません。
      </p>
      <div v-else :class="$style.inquiryList">
        <article
          v-for="inquiry in state.contactInquiries"
          :key="inquiry.id"
          :class="$style.inquiryCard"
        >
          <button
            type="button"
            :class="$style.inquiryHeader"
            :aria-expanded="isInquiryOpen(inquiry.id)"
            @click="toggleInquiry(inquiry.id)"
          >
            <div :class="$style.inquiryTitleGroup">
              <span :class="$style.inquiryType">{{ inquiry.inquiryType }}</span>
              <h3 :class="$style.inquiryTitle">{{ inquiry.subject }}</h3>
              <span :class="$style.inquiryDate">問い合わせ日時：{{
                formatDateTime(inquiry.createdAt)
              }}</span>
            </div>
            <span :class="$style.headerRight">
              <span :class="[$style.status, statusClass(inquiry.status)]">
                {{ statusLabel(inquiry.status) }}
              </span>
              <span :class="$style.toggleText">
                {{ isInquiryOpen(inquiry.id) ? "閉じる" : "開く" }}
              </span>
            </span>
          </button>

          <div v-if="isInquiryOpen(inquiry.id)" :class="$style.inquiryDetail">
            <dl :class="$style.metaGrid">
              <div>
                <dt>氏名</dt>
                <dd>{{ inquiry.name }}</dd>
              </div>
              <div>
                <dt>メール</dt>
                <dd>{{ inquiry.email }}</dd>
              </div>
              <div>
                <dt>電話番号</dt>
                <dd>{{ inquiry.phone || "未入力" }}</dd>
              </div>
              <div>
                <dt>受付日時</dt>
                <dd>{{ formatDateTime(inquiry.createdAt) }}</dd>
              </div>
            </dl>

            <p :class="$style.bodyText">{{ inquiry.body }}</p>

            <div v-if="inquiry.answerBody" :class="$style.answerBox">
              <div :class="$style.answerMeta">
                <span>回答済み</span>
                <span>{{ formatDateTime(inquiry.answeredAt) }}</span>
                <span v-if="inquiry.answererName">{{ inquiry.answererName }}</span>
              </div>
              <p>{{ inquiry.answerBody }}</p>
            </div>

            <form :class="$style.answerForm" @submit.prevent="answer(inquiry.id)">
              <FieldLabel label="回答内容" full>
                <AppTextarea
                  v-model="answerForms[inquiry.id]"
                  name="answerBody"
                  :placeholder="
                    inquiry.answerBody
                      ? '回答を更新する場合は入力してください'
                      : '回答を入力してください'
                  "
                />
              </FieldLabel>
              <div :class="$style.actions">
                <BaseButton type="submit" icon="send">
                  {{ inquiry.answerBody ? "回答を更新" : "回答する" }}
                </BaseButton>
              </div>
            </form>
          </div>
        </article>
      </div>
    </div>
  </section>

  <template v-else>
    <section :class="$style.panel">
      <div :class="$style.panelHeader">
        <h2 :class="$style.panelTitle">問い合わせ内容</h2>
      </div>
      <div :class="$style.panelBody">
        <form :class="$style.formGrid" @submit.prevent="submit">
          <FormSelect
            v-model="form.inquiryType"
            label="問い合わせ種別"
            name="inquiryType"
            :options="inquiryTypeOptions"
            @update:model-value="markDirty"
          />
          <FormInput
            v-model="form.subject"
            label="件名"
            name="subject"
            @update:model-value="markDirty"
          />
          <FormInput
            v-model="form.name"
            label="氏名"
            name="name"
            autocomplete="name"
            @update:model-value="markDirty"
          />
          <FormInput
            v-model="form.email"
            label="メールアドレス"
            name="email"
            type="email"
            autocomplete="email"
            @update:model-value="markDirty"
          />
          <FormInput
            v-model="form.phone"
            label="電話番号"
            name="phone"
            autocomplete="tel"
            @update:model-value="markDirty"
          />
          <FieldLabel label="本文" full>
            <AppTextarea
              v-model="form.body"
              name="body"
              @update:model-value="markDirty"
            />
          </FieldLabel>
          <div :class="$style.actions">
            <BaseButton type="submit" icon="send">送信</BaseButton>
          </div>
        </form>
      </div>
    </section>

    <section :class="[$style.panel, $style.historyPanel]">
      <div :class="$style.panelHeader">
        <h2 :class="$style.panelTitle">問い合わせ履歴</h2>
      </div>
      <div :class="$style.panelBody">
        <p v-if="!state.contactInquiries.length" :class="$style.empty">
          送信済みの問い合わせはまだありません。
        </p>
        <div v-else :class="$style.inquiryList">
          <article
            v-for="inquiry in state.contactInquiries"
            :key="inquiry.id"
            :class="$style.inquiryCard"
          >
            <div :class="$style.inquiryHeader">
              <div :class="$style.inquiryTitleGroup">
                <span :class="$style.inquiryType">{{ inquiry.inquiryType }}</span>
                <h3 :class="$style.inquiryTitle">{{ inquiry.subject }}</h3>
              </div>
              <span :class="[$style.status, statusClass(inquiry.status)]">
                {{ statusLabel(inquiry.status) }}
              </span>
            </div>
            <dl :class="$style.metaGrid">
              <div>
                <dt>送信日時</dt>
                <dd>{{ formatDateTime(inquiry.createdAt) }}</dd>
              </div>
            </dl>
            <p :class="$style.bodyText">{{ inquiry.body }}</p>
            <div v-if="inquiry.answerBody" :class="$style.answerBox">
              <div :class="$style.answerMeta">
                <span>営業からの回答</span>
                <span>{{ formatDateTime(inquiry.answeredAt) }}</span>
              </div>
              <p>{{ inquiry.answerBody }}</p>
            </div>
            <p v-else :class="$style.pendingText">
              営業からの回答をお待ちください。
            </p>
          </article>
        </div>
      </div>
    </section>
  </template>
</template>

<script setup lang="ts">
import { onMounted, reactive, useCssModule } from "vue";
import {
  useTryangleFreelance,
  type ContactInquiryInput,
} from "~/composables/useTryangleFreelance";

const {
  state,
  currentUser,
  currentRole,
  submitContactInquiry,
  loadContactInquiries,
  answerContactInquiry,
  markDirty,
  clearUnsavedChanges,
} = useTryangleFreelance();
const styles = useCssModule();

const inquiryTypeOptions = [
  "",
  "案件について",
  "プロフィール・レジュメについて",
  "面談・チャットについて",
  "契約・稼働について",
  "不具合・操作方法について",
  "その他",
];

const form = reactive<ContactInquiryInput>({
  inquiryType: "",
  name: "",
  email: "",
  phone: "",
  subject: "",
  body: "",
});
const answerForms = reactive<Record<string, string>>({});
const openInquiries = reactive<Record<string, boolean>>({});

onMounted(() => {
  if (currentRole.value === "sales") {
    void loadContactInquiries();
  } else {
    hydrateForm();
    void loadContactInquiries();
  }
});

function hydrateForm() {
  form.name = state.value.profile.name || currentUser.value?.name || "";
  form.email = state.value.profile.email || currentUser.value?.email || "";
  form.phone = state.value.profile.phone || "";
}

async function submit() {
  if (await submitContactInquiry(form)) {
    const nextName = form.name;
    const nextEmail = form.email;
    const nextPhone = form.phone;
    Object.assign(form, {
      inquiryType: "",
      name: nextName,
      email: nextEmail,
      phone: nextPhone,
      subject: "",
      body: "",
    });
    clearUnsavedChanges();
  }
}

async function answer(id: string) {
  if (await answerContactInquiry(id, answerForms[id] || "")) {
    answerForms[id] = "";
  }
}

function statusLabel(status: string) {
  return status === "answered" ? "回答済み" : "未回答";
}

function statusClass(status: string) {
  return status === "answered" ? styles.statusAnswered : styles.statusNew;
}

function isInquiryOpen(id: string) {
  return Boolean(openInquiries[id]);
}

function toggleInquiry(id: string) {
  openInquiries[id] = !openInquiries[id];
}

function formatDateTime(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
</script>

<style module>
.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
  min-width: 0;
  max-width: 100%;
}

.historyPanel {
  margin-top: 16px;
}

.panelHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
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

.formGrid > * {
  min-width: 0;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 8px;
}

.empty {
  margin: 0;
  color: var(--muted);
}

.inquiryList {
  display: grid;
  gap: 14px;
}

.inquiryCard {
  min-width: 0;
  border: 1px solid #d8e4f7;
  border-radius: 8px;
  background: #ffffff;
  overflow: hidden;
}

.inquiryHeader {
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  background: #fff;
  color: inherit;
  text-align: left;
}

.inquiryHeader:hover {
  background: #f6f9fe;
}

.inquiryDetail {
  padding: 0 16px 16px;
}

.inquiryTitleGroup {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.inquiryType {
  color: #1d5aa6;
  font-size: 12px;
  font-weight: 700;
}

.inquiryTitle {
  margin: 0;
  color: #10294f;
  font-size: 17px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.inquiryDate {
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
}

.headerRight {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.toggleText {
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
}

.status {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 700;
}

.statusNew {
  background: #fff4dd;
  color: #955b00;
}

.statusAnswered {
  background: #e6f5ef;
  color: #13704f;
}

.metaGrid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 0 0 14px;
}

.metaGrid div {
  min-width: 0;
}

.metaGrid dt {
  color: var(--muted);
  font-size: 12px;
}

.metaGrid dd {
  margin: 3px 0 0;
  color: #10294f;
  font-size: 13px;
  overflow-wrap: anywhere;
}

.bodyText {
  margin: 0 0 14px;
  color: #263a58;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.answerBox {
  display: grid;
  gap: 8px;
  margin: 0 0 14px;
  border-left: 3px solid #2f74d0;
  background: #f3f7fd;
  padding: 12px;
}

.answerBox p {
  margin: 0;
  color: #10294f;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.answerMeta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--muted);
  font-size: 12px;
}

.answerForm {
  display: grid;
  gap: 10px;
}

.pendingText {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
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
  }

  .actions button {
    width: 100%;
  }

  .inquiryHeader {
    display: grid;
  }

  .metaGrid {
    grid-template-columns: 1fr;
  }
}
</style>
