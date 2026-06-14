<template>
  <ClientOnly>
    <LoginPanel v-if="!state.auth" />
    <AppShell v-else />
    <UnsavedChangesModal />
    <AppLoadingOverlay :visible="isLoading" />

    <template #fallback>
      <div :class="$style.loginShell">
        <section :class="[$style.loginPanel, $style.panel]">
          <div :class="$style.loginBrand">
            <BrandMark />
            <div>
              <p>読み込み中です。</p>
            </div>
          </div>
        </section>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useTryangleFreelance } from "~/composables/useTryangleFreelance";
import { onMounted } from "vue";
const { state, isLoading, init } = useTryangleFreelance();

onMounted(() => {
  init();
});
</script>

<style module>
.loginShell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    linear-gradient(135deg, rgba(29, 95, 211, 0.16), rgba(15, 140, 168, 0.09)),
    #edf5ff;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
  min-width: 0;
}

.loginPanel {
  width: min(620px, 100%);
  padding: 22px;
}

.loginBrand {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.loginBrand h1 {
  margin: 0;
  color: #0d2749;
  font-size: 26px;
  line-height: 1.1;
}

.loginBrand p {
  margin: 6px 0 0;
  color: var(--muted);
  line-height: 1.6;
}
</style>
