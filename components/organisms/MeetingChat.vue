<template>
  <div :class="[$style.grid, currentRole === 'sales' ? $style.three : $style.two]">
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
            :class="[$style.chatUserCard, freelancer.id === activeChatFreelancerId ? $style.activeChatUser : '']"
            @click="selectChatFreelancer(freelancer.id)"
          >
            <span :class="$style.chatUserHead">
              <strong>{{ freelancer.name }}</strong>
              <TagBadge :tone="freelancer.availability === '即稼働可' ? 'teal' : 'amber'">{{ freelancer.availability }}</TagBadge>
            </span>
            <span :class="$style.chatUserMeta">{{ freelancer.role }} / {{ freelancer.desiredRate }}万円〜</span>
            <span :class="$style.chatPreview">{{ freelancer.lastMessage?.body || 'まだメッセージはありません' }}</span>
          </button>
        </div>
      </div>
    </section>

    <section :class="$style.panel">
      <div :class="$style.panelHeader"><h2 :class="$style.panelTitle">面談候補</h2></div>
      <div :class="$style.panelBody">
        <form :class="$style.formGrid" @submit.prevent="submitMeeting">
          <label :class="$style.field">候補日時<input :class="$style.control" v-model="candidate" type="datetime-local" /></label>
          <div :class="$style.actions"><BaseButton type="submit" icon="calendar">候補を追加</BaseButton></div>
        </form>

        <div :class="[$style.cardList, $style.stackSm]">
          <div v-for="meeting in activeMeetingRequests" :key="meeting.id" :class="$style.card">
            <div :class="$style.cardHead">
              <strong>{{ displayDateTime(meeting.candidate) }}</strong>
              <TagBadge :tone="meeting.status === '確定' ? 'teal' : 'blue'">{{ meeting.status }}</TagBadge>
            </div>
            <div v-if="currentRole === 'sales'" :class="$style.actions">
              <BaseButton variant="secondary" @click="updateMeetingStatus(meeting.id, '確定')">確定</BaseButton>
              <BaseButton variant="secondary" @click="updateMeetingStatus(meeting.id, '再調整')">再調整</BaseButton>
            </div>
          </div>
          <div v-if="!activeMeetingRequests.length" :class="$style.emptyState">この求職者の面談候補はまだありません。</div>
        </div>
      </div>
    </section>

    <section :class="$style.panel">
      <div :class="$style.panelHeader">
        <h2 :class="$style.panelTitle">チャット</h2>
        <TagBadge tone="teal">{{ selectedFreelancer.name }}</TagBadge>
      </div>
      <div :class="$style.panelBody">
        <div :class="[$style.messageList, $style.conversation]">
          <div
            v-for="message in activeChatMessages"
            :key="message.id"
            :class="[$style.messageRow, isOwnMessage(message) ? $style.own : $style.other]"
          >
            <div :class="$style.messageMeta">
              <span :class="$style.messageAuthor">{{ isOwnMessage(message) ? 'あなた' : message.from }}</span>
              <span :class="$style.messageTime">{{ displayDateTime(message.at) }}</span>
            </div>
            <div :class="$style.messageBubble">
              <div :class="$style.messageBody">{{ message.body }}</div>
            </div>
          </div>
          <div v-if="!activeChatMessages.length" :class="$style.emptyState">この相手とのメッセージはまだありません。</div>
        </div>

        <form :class="[$style.formGrid, $style.one, $style.stackSm]" @submit.prevent="submitMessage">
          <label :class="$style.field">送信内容<textarea :class="$style.control" v-model="body" @input="markDirty"></textarea></label>
          <div :class="$style.actions"><BaseButton type="submit" icon="send">送信</BaseButton></div>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useTryangleFreelance } from "~/composables/useTryangleFreelance";
import { ref } from "vue";
import type { Message } from "~/composables/useTryangleFreelance";

const {
  currentRole,
  selectedFreelancer,
  activeChatFreelancerId,
  chatFreelancers,
  activeChatMessages,
  activeMeetingRequests,
  selectChatFreelancer,
  addMeeting,
  updateMeetingStatus,
  sendMessage,
  markDirty,
  clearUnsavedChanges
} = useTryangleFreelance();

const candidate = ref("");
const body = ref("");

function isOwnMessage(message: Message) {
  if (currentRole.value === "sales") return message.channel === "sales";
  return message.channel === "freelancer";
}

function displayDateTime(value = "") {
  if (!value) return "";
  const normalized = value.replace("T", " ");
  return normalized.slice(0, 16);
}

async function submitMeeting() {
  await addMeeting(candidate.value);
  candidate.value = "";
}

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
  grid-template-columns: minmax(280px, 0.8fr) minmax(0, 1.4fr);
}

.three {
  grid-template-columns: minmax(240px, 0.75fr) minmax(280px, 0.85fr) minmax(0, 1.4fr);
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
  gap: 10px;
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
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.chatUserCard:hover,
.activeChatUser {
  border-color: var(--primary);
  box-shadow: 0 8px 18px rgba(29, 78, 137, 0.12);
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
