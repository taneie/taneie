<template>
  <div :class="$style.appShell">
    <AppHeader />
    <main :class="$style.workspace">
      <DashboardPage v-if="state.activeView === 'dashboard'" />
      <ProfilePage v-else-if="state.activeView === 'profile'" />
      <JobsPage v-else-if="state.activeView === 'jobs'" />
      <AdminPage v-else-if="state.activeView === 'admin'" />
      <ScoutPage v-else-if="state.activeView === 'scout'" />
      <MeetingPage v-else-if="state.activeView === 'meeting'" />
      <SheetPage v-else-if="state.activeView === 'sheet'" />
      <ContactPage v-else-if="state.activeView === 'contact'" />
      <section v-else :class="$style.panel">
        <div :class="$style.panelBody">
          <BaseButton
            @click="setView(currentRole === 'sales' ? 'dashboard' : 'jobs')"
            >戻る</BaseButton
          >
        </div>
      </section>
    </main>
    <ChatNotificationBanner />
    <ToastMessage />
  </div>
</template>

<script setup lang="ts">
import { useFreelinkRuntime } from "~/composables/freelink/useFreelinkRuntime";
import { nextTick, watch } from "vue";
const { state, currentRole, ensureActiveView, setView } =
  useFreelinkRuntime();

watch(
  () => [state.value.auth?.role, state.value.activeView],
  ensureActiveView,
  { immediate: true },
);

watch(
  () => state.value.activeView,
  async () => {
    if (!import.meta.client) return;
    await nextTick();
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  },
);
</script>

<style module>
.appShell {
  min-height: 100dvh;
  display: grid;
  grid-template-rows: 1fr;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
  padding-top: calc(var(--safe-top) + var(--app-header-height, 72px) + var(--app-header-gap, 14px));
  padding-inline: var(--safe-left) var(--safe-right);
}

.workspace {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin: 0;
  padding: 22px var(--page-inline) calc(42px + var(--safe-bottom));
}

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
  min-width: 0;
}

.panelBody {
  padding: 16px;
}

@media (max-width: 620px) {
  .appShell {
    padding-top: calc(var(--safe-top) + var(--app-header-height, 132px) + var(--app-header-gap, 12px));
    margin-bottom: 40px;
  }

  .workspace {
    padding: 14px var(--page-inline) calc(28px + var(--safe-bottom));
  }

  .panelBody {
    padding: 12px;
  }

}
</style>
