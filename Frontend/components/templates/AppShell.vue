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
import { watch } from "vue";
const { state, currentRole, ensureActiveView, setView } =
  useFreelinkRuntime();

watch(
  () => [state.value.auth?.role, state.value.activeView],
  ensureActiveView,
  { immediate: true },
);
</script>

<style module>
.appShell {
  min-height: 100vh;
  display: grid;
  grid-template-rows: 1fr;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
  padding-top: calc(var(--app-header-height, 72px) + var(--app-header-gap, 14px));
}

.workspace {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin: 0;
  padding: 22px clamp(14px, 1.4vw, 24px) 42px;
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
    padding-top: calc(var(--app-header-height, 132px) + var(--app-header-gap, 12px));
    margin-bottom: 40px;
  }

  .workspace {
    padding: 14px 10px 28px;
  }

  .panelBody {
    padding: 12px;
  }

}
</style>
