<template>
  <header ref="topbarRef" :class="$style.topbar" data-print-hidden="true">
    <div :class="$style.topbarInner">
      <button
        type="button"
        :class="$style.brand"
        aria-label="トップページへ移動"
        @click="goRoleHome"
      >
        <BrandMark />
      </button>

      <nav :class="$style.nav" aria-label="メイン">
        <button
          v-for="item in availableNavItems"
          :key="item.view"
          type="button"
          :class="[
            $style.navButton,
            { [$style.active]: state.activeView === item.view },
          ]"
          @click="setView(item.view)"
        >
          <AppIcon :name="item.icon" />
          <span>{{ item.label }}</span>
          <span
            v-if="
              item.view === 'meeting' &&
              currentRole === 'freelancer' &&
              currentUnreadChatCount
            "
            :class="$style.unreadBadge"
            aria-label="未読あり"
          />
        </button>
      </nav>

      <div :class="$style.accountBar">
        <span :class="$style.accountPill">{{
          roleLabel(state.auth?.role)
        }}</span>
        <span :class="$style.accountName">{{ state.auth?.name }}</span>
        <BaseButton
          variant="secondary"
          :class="$style.logoutButton"
          @click="logout"
        >
          ログアウト
        </BaseButton>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { useFrichyRuntime } from "~/composables/freelink/useFrichyRuntime";

const {
  state,
  currentRole,
  availableNavItems,
  currentUnreadChatCount,
  setView,
  logout,
  roleLabel,
} = useFrichyRuntime();

const topbarRef = ref<HTMLElement | null>(null);
let headerObserver: ResizeObserver | undefined;

function goRoleHome() {
  void setView(currentRole.value === "sales" ? "dashboard" : "jobs");
}

function syncHeaderHeight() {
  if (!import.meta.client || !topbarRef.value) return;
  document.documentElement.style.setProperty(
    "--app-header-height",
    `${Math.ceil(topbarRef.value.getBoundingClientRect().height)}px`,
  );
}

onMounted(async () => {
  await nextTick();
  syncHeaderHeight();
  headerObserver = new ResizeObserver(syncHeaderHeight);
  if (topbarRef.value) headerObserver.observe(topbarRef.value);
  window.addEventListener("resize", syncHeaderHeight);
});

onBeforeUnmount(() => {
  headerObserver?.disconnect();
  if (import.meta.client) {
    window.removeEventListener("resize", syncHeaderHeight);
    document.documentElement.style.removeProperty("--app-header-height");
  }
});
</script>

<style module>
.topbar {
  position: fixed;
  top: var(--safe-top);
  left: 0;
  right: 0;
  z-index: 60;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(14px);
  max-height: min(46dvh, 260px);
  overflow-y: auto;
}

.topbarInner {
  display: flex;
  align-items: center;
  gap: 18px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin: 0;
  padding: 13px max(var(--page-inline), var(--safe-right)) 13px max(var(--page-inline), var(--safe-left));
}

.brand {
  display: flex;
  align-items: center;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  line-height: 0;
  padding: 0;
  background: transparent;
  border: 0;
  cursor: pointer;
  appearance: none;
}

.brand:focus-visible {
  outline: 3px solid rgba(29, 78, 137, 0.24);
  outline-offset: 4px;
  border-radius: 8px;
}

.nav {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%;
  gap: 6px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.nav::-webkit-scrollbar {
  display: none;
}

.navButton {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 7px;
  min-height: 38px;
  padding: 0 12px;
  background: transparent;
  color: var(--muted);
  border-radius: 6px;
  font-size: 14px;
  line-height: 1;
  white-space: nowrap;
}

.navButton svg {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}

.active {
  color: var(--primary);
  background: var(--primary-weak);
  font-weight: 700;
}

.unreadBadge {
  display: inline-block;
  width: 9px;
  min-width: 9px;
  height: 9px;
  padding: 0;
  border-radius: 999px;
  background: #d92d20;
}

.accountBar {
  display: flex;
  align-items: center;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  gap: 8px;
  margin-left: auto;
  white-space: nowrap;
}

.accountPill {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  min-height: 26px;
  padding: 0 9px;
  border-radius: 999px;
  background: var(--primary-weak);
  color: var(--primary-strong);
  font-size: 12px;
  font-weight: 800;
}

.accountName {
  min-width: 0;
  overflow: hidden;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
}

.logoutButton {
  flex: 0 0 auto;
}

@media (max-width: 1180px) {
  .topbarInner {
    flex-wrap: wrap;
    gap: 10px 14px;
  }

  .brand {
    flex: 0 1 auto;
  }

  .nav {
    order: 3;
    flex-basis: 100%;
    padding-bottom: 2px;
  }

  .accountBar {
    margin-left: auto;
    justify-content: flex-end;
  }
}

@media (max-width: 980px) {
  .topbarInner {
    align-items: center;
    flex-direction: row;
  }

  .brand {
    width: auto;
  }

  .accountBar {
    flex-wrap: wrap;
    margin-left: auto;
  }
}

@media (max-width: 620px) {
  .topbar {
    position: fixed;
  }

  .topbarInner {
    align-items: center;
    flex-flow: row wrap;
    padding: 11px max(12px, var(--safe-right)) 11px max(12px, var(--safe-left));
  }

  .accountBar {
    justify-content: space-between;
    width: 100%;
    margin-left: 0;
  }

  .nav {
    order: 3;
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: max-content;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    gap: 5px;
    margin-inline: 0;
    padding-inline: 0;
  }

  .navButton {
    min-height: 42px;
    padding: 0 10px;
  }

  .navButton span {
    font-size: 13px;
  }

  .accountBar {
    order: 2;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    width: 100%;
    gap: 8px;
    white-space: nowrap;
  }

  .accountPill {
    grid-column: 1;
    min-height: 24px;
    padding: 0 8px;
    font-size: 11px;
  }

  .accountName {
    grid-column: 2;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .logoutButton {
    grid-column: 3;
    width: auto;
    min-width: 0;
    min-height: 30px;
    padding: 0 10px;
    border-radius: 999px;
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;
  }
}

@media (max-width: 360px) {
  .accountBar {
    gap: 6px;
  }

  .accountPill {
    padding: 0 7px;
  }

  .accountName {
    font-size: 12px;
  }

  .logoutButton {
    padding: 0 8px;
    font-size: 11px;
  }
}
</style>
