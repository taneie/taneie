<template>
  <form :class="$style.form" @submit.prevent="submit">
    <label :class="$style.field">
      紹介したい案件
      <select v-model="jobId" :class="$style.control">
        <option value="">選択なし</option>
        <option
          v-for="job in availableJobs"
          :key="job.id"
          :value="job.id"
        >
          {{ job.title }}
        </option>
      </select>
    </label>
    <label :class="$style.field">
      連絡内容
      <textarea
        v-model="body"
        :class="[$style.control, $style.textarea]"
        placeholder="ステータス変更の補足、見送り理由、次に紹介したい案件の案内など"
      ></textarea>
    </label>
    <BaseButton variant="secondary" icon="send" type="submit">
      チャット送信
    </BaseButton>
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { Job } from "~/composables/frichy/types";

const props = defineProps<{
  applicationId: string;
  currentJobId: string;
  jobs: Job[];
}>();

const emit = defineEmits<{
  submit: [
    payload: {
      applicationId: string;
      jobId: string;
      body: string;
      reset: () => void;
    },
  ];
}>();

const jobId = ref("");
const body = ref("");
const availableJobs = computed(() =>
  props.jobs.filter((job) => job.active && job.id !== props.currentJobId),
);

function reset() {
  jobId.value = "";
  body.value = "";
}

function submit() {
  emit("submit", {
    applicationId: props.applicationId,
    jobId: jobId.value,
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
