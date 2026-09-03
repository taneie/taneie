<template>
  <PageHead
    title="匿名スキルシート"
    kicker="プロフィールから提案用の匿名Webシートを生成します。"
  >
    <template #actions>
      <div :class="$style.actions">
        <BaseButton
          variant="secondary"
          icon="print"
          @click="downloadSheetPdf(mainSkills)"
          >PDF出力</BaseButton
        >
      </div>
    </template>
  </PageHead>

  <div :class="[$style.grid, $style.two]">
    <section :class="$style.panel">
      <div :class="$style.panelBody">
        <article id="anonymous-sheet" :class="$style.sheet">
          <h2>匿名スキルシート</h2>
          <p>
            氏名・連絡先・固有社名を伏せた、クライアント提案用プロフィールです。
          </p>
          <div :class="$style.sheetGrid">
            <div>氏名</div>
            <div>{{ candidateInitials || "未登録" }}（イニシャル表記）</div>
            <div>職種</div>
            <div>{{ profile.role }}</div>
            <div>経験年数</div>
            <div>{{ profile.years }}年</div>
            <div>主要スキル</div>
            <div>{{ mainSkills }}</div>
            <div>希望単価</div>
            <div>{{ profile.desiredRate }}万円</div>
            <div>稼働</div>
            <div>
              {{ profile.startDate }}開始 / {{ profile.workRate }} /
              {{ profile.remote }}
            </div>
            <div>稼働開始可能日</div>
            <div>{{ profile.availability }}</div>
            <div>ステータス</div>
            <div>初回面談調整中</div>
          </div>
        </article>
      </div>
    </section>

    <section :class="$style.panel">
      <div :class="$style.panelHeader">
        <h2 :class="$style.panelTitle">PDF出力情報</h2>
      </div>
      <div :class="$style.panelBody">
        <div :class="[$style.card, $style.stackSm]">
          <strong>匿名化対象</strong>
          <p>
            氏名: {{ candidateInitials || "未登録" }} / メール: ******** / 電話:
            ********
          </p>
          <p>
            レジュメ:
            {{ profile.resumeName || "未登録" }} は営業管理画面で確認できます。
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useFrichyRuntime } from "~/composables/frichy/useFrichyRuntime";
import { buildKanaInitials } from "~/composables/frichy/utils";
import { computed } from "vue";
const { state, splitCsv, downloadSheetPdf } =
  useFrichyRuntime();

const profile = computed(() => state.value.profile);
const candidateInitials = computed(() =>
  buildKanaInitials(profile.value.nameKana),
);
const mainSkills = computed(() =>
  [
    profile.value.languages,
    profile.value.frameworks,
    profile.value.db,
    profile.value.operatingSystems,
    profile.value.industries,
    profile.value.otherSkills,
  ]
    .filter(Boolean)
    .join(" / "),
);
</script>

<style module>
.grid {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.grid > * {
  min-width: 0;
}

.two {
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.4fr);
}

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: var(--shadow);
  min-width: 0;
  max-width: 100%;
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
}

.panelTitle {
  min-width: 0;
  margin: 0;
  color: #10294f;
  font-size: 16px;
  overflow-wrap: anywhere;
}

.panelBody {
  min-width: 0;
  max-width: 100%;
  padding: 16px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 14px;
}

.sheet {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 22px;
  line-height: 1.65;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.sheet h2 {
  margin: 0 0 10px;
  color: #10294f;
}

.sheet p,
.card p {
  color: var(--muted);
  line-height: 1.6;
}

.sheetGrid {
  display: grid;
  grid-template-columns: 160px 1fr;
  border-top: 1px solid var(--line);
  border-left: 1px solid var(--line);
  margin-top: 14px;
}

.sheetGrid div {
  padding: 10px;
  border-right: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.sheetGrid div:nth-child(odd) {
  background: var(--primary-soft);
  color: #18365f;
  font-weight: 800;
}

.card {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 8px;
  padding: 14px;
  min-width: 0;
}

.stackSm {
  margin-top: 14px;
}

@media (max-width: 1180px) {
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

  .actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .actions button {
    width: 100%;
  }

  .sheet {
    padding: 14px;
  }

  .sheetGrid {
    grid-template-columns: 1fr;
  }
}
</style>
