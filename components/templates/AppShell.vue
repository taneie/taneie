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
import { useTryangleFreelance } from "~/composables/useTryangleFreelance";
import { watch } from "vue";
const { state, currentRole, ensureActiveView, setView } =
  useTryangleFreelance();

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
  grid-template-rows: auto 1fr;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
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
  .workspace {
    padding: 14px 10px 28px;
  }

  .panelBody {
    padding: 12px;
  }
}
</style>
