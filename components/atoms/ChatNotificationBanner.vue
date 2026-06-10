<template>
  <div
    :class="[$style.banner, { [$style.show]: chatBannerVisible }]"
    role="status"
    aria-live="polite"
  >
    <button :class="$style.content" type="button" @click="openChatBanner">
      <span :class="$style.kicker">新着チャット</span>
      <strong>{{ chatBannerTitle }}</strong>
      <span>{{ chatBannerBody }}</span>
    </button>
    <button :class="$style.close" type="button" aria-label="通知を閉じる" @click="dismissChatBanner">×</button>
  </div>
</template>

<script setup lang="ts">
import { useTryangleFreelance } from "~/composables/useTryangleFreelance";

const {
  chatBannerVisible,
  chatBannerTitle,
  chatBannerBody,
  openChatBanner,
  dismissChatBanner
} = useTryangleFreelance();
</script>

<style module>
.banner {
  position: fixed;
  top: 72px;
  right: clamp(12px, 1.4vw, 24px);
  z-index: 40;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  width: min(440px, calc(100vw - 24px));
  border: 1px solid #b8d0f3;
  border-radius: 8px;
  background: #f8fbff;
  box-shadow: 0 18px 44px rgba(16, 41, 79, 0.18);
  opacity: 0;
  transform: translateY(-12px);
  pointer-events: none;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.show {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.content {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 13px 0 13px 14px;
  color: #10294f;
  text-align: left;
}

.content strong,
.content span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kicker {
  color: var(--primary);
  font-size: 12px;
  font-weight: 800;
}

.close {
  align-self: start;
  width: 34px;
  height: 34px;
  margin: 7px 7px 0 0;
  border-radius: 999px;
  color: #49627f;
  font-size: 20px;
  line-height: 1;
}

.close:hover {
  background: #e7effb;
}

@media (max-width: 620px) {
  .banner {
    top: 12px;
    left: 12px;
    right: 12px;
    width: auto;
  }
}
</style>
