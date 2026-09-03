<template>
  <form :class="$style.form" @submit.prevent="submit">
    <label :class="$style.field">
      連絡内容
      <textarea
        v-model="body"
        :class="[$style.control, $style.textarea]"
        placeholder="ステータス変更の補足や見送り理由など"
      ></textarea>
    </label>
    <BaseButton variant="secondary" icon="send" type="submit">
      チャット送信
    </BaseButton>
  </form>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  applicationId: string;
}>();

const emit = defineEmits<{
  submit: [
    payload: {
      applicationId: string;
      body: string;
      reset: () => void;
    },
  ];
}>();

const body = ref("");

function reset() {
  body.value = "";
}

function submit() {
  emit("submit", {
    applicationId: props.applicationId,
    body: body.value,
    reset,
  });
}
</script>

<style module>
.form {
  display: grid;
  gap: 10px;
  margin-top: 12px;
  border-top: 1px solid var(--line);
  padding-top: 12px;
}

.field {
  display: grid;
  gap: 6px;
  color: #263f63;
  font-size: 12px;
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

.control:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(29, 95, 211, 0.14);
}

.textarea {
  min-height: 82px;
  resize: vertical;
}
</style>
