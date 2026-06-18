<template>
  <div :class="$style.groupList">
    <details
      v-for="group in applicationGroups"
      :key="group.freelancerId"
      :class="$style.group"
      open
    >
      <summary :class="$style.groupSummary">
        <span>
          <strong>担当者: {{ group.name }}</strong>
          <small>{{ group.role }}</small>
        </span>
        <TagBadge tone="blue">{{ group.applications.length }}件</TagBadge>
      </summary>
      <div :class="$style.cardList">
        <div
          v-for="application in group.applications"
          :key="application.id"
          :class="$style.card"
        >
          <p>{{ getJob(application.jobId)?.title || "不明な案件" }}</p>
          <select
            :class="$style.control"
            :value="application.status"
            @change="onStatusChange(application.id, $event)"
          >
            <option v-for="option in statuses" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
          <div :class="$style.followForm">
            <label :class="$style.field">
              紹介したい案件
              <select
                :class="$style.control"
                :value="followupForm(application.id).jobId"
                @change="onFollowupJobChange(application.id, $event)"
              >
                <option value="">選択なし</option>
                <option
                  v-for="job in followupJobs(application.jobId)"
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
                :class="[$style.control, $style.textarea]"
                :value="followupForm(application.id).body"
                placeholder="ステータス変更の補足、見送り理由、次に紹介したい案件の案内など"
                @input="onFollowupBodyInput(application.id, $event)"
              ></textarea>
            </label>
            <BaseButton
              variant="secondary"
              icon="send"
              @click="sendFollowup(application.id)"
            >
              チャット送信
            </BaseButton>
          </div>
        </div>
      </div>
    </details>
    <div v-if="!applicationGroups.length" :class="$style.empty">該当なし</div>
  </div>
</template>

<script setup lang="ts">
import { useTryangleRuntime } from "~/composables/tryangle/useTryangleRuntime";
import { computed, reactive } from "vue";
import type { Application } from "~/composables/tryangle/types";

const {
  state,
  statuses,
  getFreelancer,
  getJob,
  changeApplicationStatus,
  sendApplicationFollowup,
} = useTryangleRuntime();

const props = defineProps<{
  applications?: Application[];
}>();

const applications = computed(() => props.applications || state.value.applications);
const followups = reactive<Record<string, { jobId: string; body: string }>>({});

const applicationGroups = computed(() =>
  applications.value.reduce<
    Array<{
      freelancerId: string;
      name: string;
      role: string;
      applications: Application[];
    }>
  >((groups, application) => {
    const freelancer = getFreelancer(application.freelancerId);
    const groupId = application.freelancerId || "unknown";
    let group = groups.find((item) => item.freelancerId === groupId);
    if (!group) {
      group = {
        freelancerId: groupId,
        name: freelancer?.name || "不明",
        role: freelancer?.role || "役割未設定",
        applications: [],
      };
      groups.push(group);
    }
    group.applications.push(application);
    return groups;
  }, []),
);

function onStatusChange(applicationId: string, event: Event) {
  changeApplicationStatus(applicationId, (event.target as HTMLSelectElement).value);
}

function followupForm(applicationId: string) {
  followups[applicationId] ||= { jobId: "", body: "" };
  return followups[applicationId];
}

function followupJobs(currentJobId: string) {
  return state.value.jobs.filter((job) => job.active && job.id !== currentJobId);
}

function onFollowupJobChange(applicationId: string, event: Event) {
  followupForm(applicationId).jobId = (event.target as HTMLSelectElement).value;
}

function onFollowupBodyInput(applicationId: string, event: Event) {
  followupForm(applicationId).body = (event.target as HTMLTextAreaElement).value;
}

async function sendFollowup(applicationId: string) {
  const form = followupForm(applicationId);
  if (await sendApplicationFollowup(applicationId, form.jobId, form.body)) {
    followups[applicationId] = { jobId: "", body: "" };
  }
}
</script>

<style module>
.groupList {
  display: grid;
  gap: 12px;
  max-width: 100%;
  min-width: 0;
}

.group {
  background: var(--primary-soft);
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}

.groupSummary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px;
  cursor: pointer;
}

.groupSummary span {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.groupSummary strong,
.groupSummary small {
  min-width: 0;
  overflow-wrap: anywhere;
}

.groupSummary small {
  color: var(--muted);
}

.cardList {
  display: grid;
  gap: 10px;
  padding: 10px;
  padding-top: 0;
}

.card {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 8px;
  padding: 14px;
  min-width: 0;
}

.card p {
  margin: 8px 0;
  color: var(--muted);
  line-height: 1.6;
}

.followForm {
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

.textarea {
  min-height: 82px;
  resize: vertical;
}

.control:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(29, 95, 211, 0.14);
}

.empty {
  padding: 24px;
  color: var(--muted);
  border: 1px dashed #b7c9df;
  border-radius: 8px;
  background: #fbfdff;
  text-align: center;
}

@media (max-width: 620px) {
  .groupSummary {
    align-items: stretch;
  }
}
</style>
