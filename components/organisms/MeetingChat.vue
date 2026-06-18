<template>
  <div
    :class="[$style.grid, currentRole === 'sales' ? $style.three : $style.two]"
  >
    <section v-if="currentRole === 'sales'" :class="$style.panel">
      <div :class="$style.panelHeader">
        <h2 :class="$style.panelTitle">チャット対象</h2>
        <TagBadge tone="blue">{{ chatFreelancers.length }}名</TagBadge>
      </div>
      <div :class="$style.panelBody">
        <div :class="[$style.cardList, $style.chatUserList]">
          <button
            v-for="freelancer in chatFreelancers"
            :key="freelancer.id"
            type="button"
            :class="[
              $style.chatUserCard,
              freelancer.id === activeChatFreelancerId
                ? $style.activeChatUser
                : '',
            ]"
            @click="selectChatFreelancer(freelancer.id)"
          >
            <span :class="$style.chatUserHead">
              <strong>{{ freelancer.name }}</strong>
              <span :class="$style.chatUserBadges">
                <TagBadge v-if="freelancer.unreadCount" tone="amber"
                  >未読 {{ freelancer.unreadCount }}</TagBadge
                >
                <TagBadge
                  :tone="
                    freelancer.availability === '即稼働可' ? 'teal' : 'amber'
                  "
                  >{{ freelancer.availability }}</TagBadge
                >
              </span>
            </span>
            <span :class="$style.chatUserMeta"
              >{{ freelancer.role }} / {{ freelancer.desiredRate }}万円〜</span
            >
            <span :class="$style.chatPreview">{{
              freelancer.lastMessage?.body || "まだメッセージはありません"
            }}</span>
          </button>
        </div>
      </div>
    </section>

    <section :class="$style.panel">
      <div :class="$style.panelHeader">
        <h2 :class="$style.panelTitle">面談候補</h2>
        <TagBadge :tone="meetingThreadMode === 'job' ? 'amber' : 'teal'">
          {{ meetingThreadMode === "job" ? "案件面談" : "初回面談" }}
        </TagBadge>
      </div>
      <div :class="$style.panelBody">
        <div
          v-if="meetingThreadMode === 'job'"
          :class="[$style.formGrid, $style.one, $style.stackSm]"
        >
          <label :class="$style.field">
            案件
            <select
              :class="$style.control"
              :value="activeMeetingApplicationId"
              @change="onApplicationChange"
            >
              <option
                v-for="application in activeFreelancerApplications"
                :key="application.id"
                :value="application.id"
              >
                {{ jobTitle(application.jobId) }} / {{ application.status }}
              </option>
            </select>
          </label>
          <div v-if="!activeFreelancerApplications.length" :class="$style.emptyState">
            応募済み案件がないため、案件面談は作成できません。
          </div>
        </div>

        <div v-if="!canUseJobMeeting" :class="$style.notice">
          初回面談が完了すると、案件ごとの面談候補とチャットを利用できます。
        </div>

        <form
          v-if="canShowMeetingForm"
          :class="$style.formGrid"
          @submit.prevent="submitMeeting"
        >
          <div :class="$style.field">
            <span>{{ meetingFormLabel }}</span>
            <div :class="$style.dateRows">
              <div
                v-for="(_, index) in candidates"
                :key="index"
                :class="$style.dateRow"
              >
                <input
                  :class="$style.control"
                  v-model="candidates[index]"
                  type="datetime-local"
                />
                <BaseButton
                  v-if="candidates.length > 1"
                  variant="ghost"
                  @click="removeCandidate(index)"
                  >削除</BaseButton
                >
              </div>
            </div>
          </div>
          <div :class="$style.actions">
            <BaseButton variant="secondary" icon="plus" @click="addCandidate"
              >候補日を追加</BaseButton
            >
            <BaseButton type="submit" icon="calendar">候補を登録</BaseButton>
          </div>
        </form>

        <div :class="[$style.cardList, $style.stackSm]">
          <div
            v-for="meeting in activeMeetingRequests"
            :key="meeting.id"
            :class="$style.card"
          >
            <div :class="$style.cardHead">
              <strong>{{ displayDateTime(meeting.candidate) }}</strong>
              <TagBadge :tone="meeting.status === '確定' ? 'teal' : 'blue'">{{
                meeting.status
              }}</TagBadge>
            </div>
            <div v-if="currentRole === 'sales'" :class="$style.actions">
              <BaseButton
                variant="secondary"
                @click="confirmMeeting(meeting.id)"
                >確定</BaseButton
              >
              <BaseButton
                variant="secondary"
                @click="startReschedule(meeting.id)"
                >リスケ</BaseButton
              >
            </div>
          </div>
          <div v-if="!activeMeetingRequests.length" :class="$style.emptyState">
            {{ emptyMeetingText }}
          </div>
        </div>
      </div>
    </section>

    <section :class="$style.panel">
      <div :class="$style.panelHeader">
        <h2 :class="$style.panelTitle">
          {{ meetingThreadMode === "job" ? "案件面談チャット" : "初回面談チャット" }}
        </h2>
        <TagBadge tone="teal">{{ selectedFreelancer.name }}</TagBadge>
      </div>
      <div :class="$style.panelBody">
        <div v-if="meetingThreadMode === 'job'" :class="$style.notice">
          {{ selectedJobTitle }}
        </div>
        <div :class="[$style.messageList, $style.conversation]">
          <div
            v-for="message in activeChatMessages"
            :key="message.id"
            :class="[
              $style.messageRow,
              isOwnMessage(message) ? $style.own : $style.other,
            ]"
          >
            <div :class="$style.messageMeta">
              <span :class="$style.messageAuthor">{{
                isOwnMessage(message) ? "あなた" : message.from
              }}</span>
              <span :class="$style.messageTime">{{
                displayDateTime(message.at)
              }}</span>
              <span
                v-if="isOwnMessage(message) && message.readAt"
                :class="$style.readStatus"
                >既読</span
              >
            </div>
            <div :class="$style.messageBubble">
              <div :class="$style.messageBody">{{ message.body }}</div>
            </div>
          </div>
          <div v-if="!activeChatMessages.length" :class="$style.emptyState">
            {{ emptyChatText }}
          </div>
        </div>

        <form
          :class="[$style.formGrid, $style.one, $style.stackSm]"
          @submit.prevent="submitMessage"
        >
          <label :class="$style.field"
            >送信内容<textarea
              :class="$style.control"
              v-model="body"
              @input="markDirty"
            ></textarea>
          </label>
          <div :class="$style.actions">
            <BaseButton type="submit" icon="send">送信</BaseButton>
          </div>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useTryangleFreelance } from "~/composables/useTryangleFreelance";
import { computed, onMounted, ref, watch } from "vue";
import type { Message } from "~/composables/useTryangleFreelance";

const {
  currentRole,
  selectedFreelancer,
  activeChatFreelancerId,
  meetingThreadMode,
  activeMeetingApplicationId,
  activeFreelancerApplications,
  canUseJobMeeting,
  activeMeetingApplication,
  activeMeetingJobId,
  chatFreelancers,
  activeChatMessages,
  activeMeetingRequests,
  selectChatFreelancer,
  setMeetingThreadMode,
  selectMeetingApplication,
  addMeeting,
  updateMeetingStatus,
  updateInitialMeetingCompleted,
  sendMessage,
  markActiveChatAsRead,
  markDirty,
  clearUnsavedChanges,
  getJob,
} = useTryangleFreelance();

const candidates = ref<string[]>([""]);
const body = ref("");
const rescheduleMeetingId = ref("");
const selectedJobTitle = computed(() =>
  meetingThreadMode.value === "job" && activeMeetingApplication.value
    ? jobTitle(activeMeetingApplication.value.jobId)
    : "",
);
const emptyMeetingText = computed(() =>
  meetingThreadMode.value === "job"
    ? "この案件の面談候補はまだありません。"
    : "この求職者の初回面談候補はまだありません。",
);
const emptyChatText = computed(() =>
  meetingThreadMode.value === "job"
    ? "この案件面談のメッセージはまだありません。"
    : "初回面談のメッセージはまだありません。",
);
const canShowMeetingForm = computed(
  () =>
    (currentRole.value === "sales" && Boolean(rescheduleMeetingId.value)) ||
    (currentRole.value !== "sales" && meetingThreadMode.value === "job"),
);
const meetingFormLabel = computed(() =>
  currentRole.value === "sales" ? "リスケ候補日時" : "候補日時",
);

function isOwnMessage(message: Message) {
  if (currentRole.value === "sales") return message.channel === "sales";
  return message.channel === "freelancer";
}

function displayDateTime(value = "") {
  if (!value) return "";
  const normalized = value.replace("T", " ");
  return normalized.slice(0, 16);
}

function jobTitle(jobId: string) {
  return getJob(jobId)?.title || "案件未選択";
}

function onApplicationChange(event: Event) {
  selectMeetingApplication((event.target as HTMLSelectElement).value);
}

async function confirmMeeting(meetingId: string) {
  await updateMeetingStatus(meetingId, "確定");
  if (
    currentRole.value === "sales" &&
    meetingThreadMode.value === "initial" &&
    activeChatFreelancerId.value
  ) {
    await updateInitialMeetingCompleted(activeChatFreelancerId.value, true);
  }
  if (rescheduleMeetingId.value === meetingId) rescheduleMeetingId.value = "";
}

async function startReschedule(meetingId: string) {
  await updateMeetingStatus(meetingId, "再調整");
  rescheduleMeetingId.value = meetingId;
  candidates.value = [""];
}

async function submitMeeting() {
  const values = candidates.value
    .map((candidate) => candidate.trim())
    .filter(Boolean);
  if (!values.length) {
    await addMeeting("");
    return;
  }
  await Promise.all(values.map((candidate) => addMeeting(candidate)));
  candidates.value = [""];
  rescheduleMeetingId.value = "";
}

function addCandidate() {
  candidates.value.push("");
}

function removeCandidate(index: number) {
  candidates.value.splice(index, 1);
  if (!candidates.value.length) candidates.value.push("");
}

onMounted(() => {
  void markActiveChatAsRead();
});

watch(
  () => [
    activeChatFreelancerId.value,
    activeChatMessages.value.length,
    meetingThreadMode.value,
    activeMeetingJobId.value,
  ],
  () => {
    void markActiveChatAsRead();
  },
);

watch(
  () => [
    activeChatFreelancerId.value,
    canUseJobMeeting.value,
    activeFreelancerApplications.value.length,
  ],
  () => {
    rescheduleMeetingId.value = "";
    if (!canUseJobMeeting.value || !activeFreelancerApplications.value.length) {
      setMeetingThreadMode("initial");
      return;
    }
    if (!activeMeetingApplicationId.value && activeFreelancerApplications.value[0]) {
      selectMeetingApplication(activeFreelancerApplications.value[0].id);
      return;
    }
    setMeetingThreadMode("job");
  },
  { immediate: true },
);

async function submitMessage() {
  if (await sendMessage(body.value)) {
    body.value = "";
    clearUnsavedChanges();
  }
}
</script>

<style module>
.grid {
  display: grid;
  gap: 16px;
  min-width: 0;
  align-items: start;
}

.grid > *,
.formGrid > *,
.cardList > *,
.panelBody > * {
  min-width: 0;
}

.two {
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.4fr);
}

.three {
  grid-template-columns: minmax(0, 0.75fr) minmax(0, 0.85fr) minmax(0, 1.4fr);
}

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
  min-width: 0;
  overflow: hidden;
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
  min-width: 0;
}

.panelTitle {
  margin: 0;
  color: #10294f;
  font-size: 16px;
  min-width: 0;
}

.panelBody {
  padding: 16px;
  min-width: 0;
}

.formGrid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

.notice {
  border: 1px solid #c6d5e8;
  border-radius: 8px;
  padding: 10px 12px;
  background: #f8fbff;
  color: #263f63;
  font-size: 13px;
  line-height: 1.6;
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

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 4px;
}

.cardList {
  display: grid;
  gap: 10px;
}

.chatUserList {
  max-height: 520px;
  overflow: auto;
  padding-right: 4px;
}

.chatUserCard {
  display: grid;
  gap: 6px;
  width: 100%;
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.16s ease;
}

.chatUserCard:hover,
.activeChatUser {
  border-color: var(--primary);
  box-shadow: 0 8px 18px rgba(29, 78, 137, 0.12);
}

.chatUserCard:hover {
  transform: translateY(-1px);
}

.chatUserHead {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}

.chatUserHead strong {
  min-width: 0;
  overflow-wrap: anywhere;
}

.chatUserBadges {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 5px;
}

.chatUserMeta,
.chatPreview {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.chatPreview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  min-width: 0;
  flex-wrap: wrap;
}

.cardHead strong {
  min-width: 0;
  overflow-wrap: anywhere;
}

.messageList {
  display: grid;
  gap: 12px;
  min-height: 340px;
  max-height: min(54vh, 560px);
  overflow: auto;
  padding: 8px 10px;
  border: 1px solid #dbe6f4;
  border-radius: 8px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.conversation {
  align-content: start;
}

.messageRow {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: min(78%, 620px);
  min-width: 0;
}

.other {
  align-items: flex-start;
  justify-self: start;
}

.own {
  align-items: flex-end;
  justify-self: end;
}

.messageMeta {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  color: var(--muted);
  font-size: 11px;
  max-width: 100%;
}

.messageAuthor {
  font-weight: 800;
}

.messageTime {
  opacity: 0.9;
  overflow-wrap: anywhere;
}

.readStatus {
  color: var(--primary);
  font-weight: 800;
}

.messageBubble {
  box-sizing: border-box;
  width: 100%;
  padding: 10px 14px;
  border-radius: 18px;
  border: 1px solid var(--line);
  box-shadow: 0 3px 10px rgba(29, 78, 137, 0.06);
}

.messageBody {
  color: var(--ink);
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.other .messageBubble {
  position: relative;
  background: #f3f7fc;
  border-top-left-radius: 6px;
}

.other .messageBubble::after {
  content: "";
  position: absolute;
  left: -7px;
  top: 12px;
  width: 12px;
  height: 12px;
  background: #f3f7fc;
  border-left: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  transform: rotate(45deg);
}

.own .messageBubble {
  position: relative;
  background: var(--primary-weak);
  border-color: #b8d0f3;
  border-top-right-radius: 6px;
}

.own .messageBubble::after {
  content: "";
  position: absolute;
  right: -7px;
  top: 12px;
  width: 12px;
  height: 12px;
  background: var(--primary-weak);
  border-right: 1px solid #b8d0f3;
  border-bottom: 1px solid #b8d0f3;
  transform: rotate(-45deg);
}

.emptyState {
  border: 1px dashed #c6d5e8;
  border-radius: 8px;
  padding: 14px;
  color: var(--muted);
  background: #f8fbff;
  font-size: 13px;
  text-align: center;
}

.stackSm {
  margin-top: 14px;
}

@media (max-width: 1100px) {
  .three,
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

  .messageRow {
    max-width: 94%;
  }

  .messageList {
    min-height: 300px;
    max-height: 48vh;
    padding: 8px;
  }
}
</style>
