<template>
  <PageHead
    title="問い合わせ"
    kicker="サービス利用中の確認事項やサポート依頼を送信します。"
  />

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
</template>

<script setup lang="ts">
import { onMounted, reactive } from "vue";
import {
  useTryangleFreelance,
  type ContactInquiryInput,
} from "~/composables/useTryangleFreelance";

const {
  state,
  currentUser,
  submitContactInquiry,
  markDirty,
  clearUnsavedChanges,
} = useTryangleFreelance();

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

onMounted(() => {
  hydrateForm();
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
}
</style>
