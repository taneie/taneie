<template>
  <header :class="$style.topbar">
    <div :class="$style.topbarInner">
      <div :class="$style.brand">
        <BrandMark />
        <span>TRYANGLE FREELANCE</span>
      </div>

      <nav :class="$style.nav" aria-label="メイン">
        <button
          v-for="item in availableNavItems"
          :key="item.view"
          type="button"
          :class="[$style.navButton, { [$style.active]: state.activeView === item.view }]"
          @click="setView(item.view)"
        >
          <AppIcon :name="item.icon" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div :class="$style.accountBar">
        <span :class="$style.accountPill">{{ roleLabel(state.auth?.role) }}</span>
        <span :class="$style.accountName">{{ state.auth?.name }}</span>
        <BaseButton variant="secondary" @click="logout">ログアウト</BaseButton>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useTryangleFreelance } from "~/composables/useTryangleFreelance";
const { state, availableNavItems, setView, logout, roleLabel } = useTryangleFreelance();
</script>

<style module>
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(14px);
}

.topbarInner {
  display: flex;
  align-items: center;
  gap: 18px;
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
  padding: 13px 20px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 230px;
  color: var(--ink);
  font-weight: 800;
  letter-spacing: 0;
}

.nav {
  display: flex;
  flex: 1 1 auto;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.nav::-webkit-scrollbar {
  display: none;
}

.navButton {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 38px;
  padding: 0 12px;
  background: transparent;
  color: var(--muted);
  border-radius: 6px;
  white-space: nowrap;
}

.navButton svg {
  width: 18px;
  height: 18px;
}

.active {
  color: var(--primary);
  background: var(--primary-weak);
  font-weight: 700;
}

.accountBar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  white-space: nowrap;
}

.accountPill {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 9px;
  border-radius: 999px;
  background: var(--primary-weak);
  color: var(--primary-strong);
  font-size: 12px;
  font-weight: 800;
}

.accountName {
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}

@media (max-width: 1180px) {
  .topbarInner {
    flex-wrap: wrap;
    gap: 10px 14px;
  }

  .brand {
    min-width: 0;
    flex: 1 1 auto;
  }

  .nav {
    order: 3;
    flex-basis: 100%;
    padding-bottom: 2px;
  }

  .accountBar {
    margin-left: 0;
  }
}

@media (max-width: 980px) {
  .topbarInner {
    align-items: stretch;
    flex-direction: column;
  }

  .accountBar {
    flex-wrap: wrap;
  }
}

@media (max-width: 620px) {
  .topbar {
    position: static;
  }

  .topbarInner {
    padding: 11px 12px;
  }

  .brand span {
    font-size: 14px;
  }

  .nav {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: max-content;
    gap: 5px;
    margin-inline: -12px;
    padding-inline: 12px;
  }

  .navButton {
    height: 42px;
    padding: 0 10px;
  }

  .navButton span {
    font-size: 13px;
  }

  .accountBar {
    display: grid;
    grid-template-columns: auto 1fr;
    width: 100%;
    white-space: normal;
  }

  .accountBar button {
    grid-column: 1 / -1;
    width: 100%;
  }

  .accountName {
    overflow-wrap: anywhere;
  }
}
</style>
