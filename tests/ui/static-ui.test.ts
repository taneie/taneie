import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const frontendRoot = "Frontend";

function read(path: string) {
  return readFileSync(path, "utf8");
}

function vueFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return vueFiles(path);
    return path.endsWith(".vue") ? [path] : [];
  });
}

describe("UI文言・ブランド表記", () => {
  /**
   * @testData `LandingFeatureSection.vue` のFEATURES見出し、承認済みfeatureHeading/featureLead、旧差し替え文言。
   * @expected FEATURES表記と承認済み文言/クラス構造が維持され、誤って差し替えた文言は含まれない。
   */
  it("landing FEATURES section keeps the exact approved copy and component structure", () => {
    const source = read("Frontend/components/molecules/LandingFeatureSection.vue");

    assert.match(source, /<span>FEATURES<\/span>/);
    assert.match(source, /const featureHeading = "最短1分で応募まで。";/);
    assert.match(source, /const featureLead = "Frichyが案件探しを自動化。";/);
    assert.match(source, /:class="\$style\.featureTitle"/);
    assert.match(source, /:class="\$style\.featureLead"/);
    assert.doesNotMatch(source, /登録から面談調整まで/);
  });

  /**
   * @testData Frontend主要ディレクトリ、backend/src、backend/prisma内のUI/設定/コード系ファイル。
   * @expected 旧ブランド名`Freelink`の大小文字混在表記が主要ソース内に残っていない。
   */
  it("main source files do not contain old Freelink branding", () => {
    const targets = [
      "Frontend/components",
      "Frontend/composables",
      "Frontend/pages",
      "Frontend/public",
      "backend/src",
      "backend/prisma",
    ];
    const files = targets.flatMap((target) => {
      const collect = (dir: string): string[] =>
        readdirSync(dir).flatMap((entry) => {
          const path = join(dir, entry);
          const stat = statSync(path);
          if (stat.isDirectory()) return collect(path);
          return /\.(css|html|js|json|md|prisma|svg|ts|vue)$/.test(path)
            ? [path]
            : [];
        });
      return collect(target);
    });

    const offenders = files.filter((file) => /freelink/i.test(read(file)));
    assert.deepEqual(offenders, []);
  });
});

describe("UI可読性・レスポンシブスタイル", () => {
  /**
   * @testData Frontend components配下の全Vue component。
   * @expected viewport幅に依存する`font-size: clamp(...vw...)`が残っていない。
   */
  it("Vue components do not use viewport-scaled font-size clamp", () => {
    const offenders = vueFiles(join(frontendRoot, "components")).filter((file) =>
      /font-size:\s*clamp\([^;]*vw/i.test(read(file)),
    );

    assert.deepEqual(offenders, []);
  });

  /**
   * @testData Frontend components配下の全Vue componentの`letter-spacing`宣言。
   * @expected 全ての`letter-spacing`は可読性方針どおり`0`に統一されている。
   */
  it("Vue component letter-spacing declarations are fixed at zero", () => {
    const offenders = vueFiles(join(frontendRoot, "components")).flatMap(
      (file) => {
        const matches = [...read(file).matchAll(/letter-spacing:\s*([^;]+);/g)];
        return matches
          .filter((match) => match[1].trim() !== "0")
          .map((match) => `${file}: ${match[0]}`);
      },
    );

    assert.deepEqual(offenders, []);
  });

  /**
   * @testData `LandingFeatureSection.vue` のFEATURES grid、card高さ、本文strong、mobile media query。
   * @expected desktopは3列grid、cardは安定高さ、強調本文は17px、mobileは1列に切り替わる。
   */
  it("FEATURES cards keep stable grid dimensions and readable text sizes", () => {
    const source = read("Frontend/components/molecules/LandingFeatureSection.vue");

    assert.match(source, /\.featureGrid\s*\{/);
    assert.match(source, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
    assert.match(source, /min-height:\s*104px/);
    assert.match(source, /\.featureBody strong\s*\{[\s\S]*font-size:\s*17px/);
    assert.match(source, /@media \(max-width:\s*980px\)[\s\S]*grid-template-columns:\s*1fr/);
  });
});

describe("UIアクセシビリティ・ローディング体験", () => {
  /**
   * @testData loading overlay componentとtoast componentのstatus announcement属性。
   * @expected どちらも`role="status"`と`aria-live="polite"`を持ち、支援技術へ穏やかに通知できる。
   */
  it("loading overlay and toast expose polite status announcements", () => {
    const loading = read("Frontend/components/atoms/AppLoadingOverlay.vue");
    const toast = read("Frontend/components/atoms/ToastMessage.vue");

    assert.match(loading, /role="status"/);
    assert.match(loading, /aria-live="polite"/);
    assert.match(toast, /role="status"/);
    assert.match(toast, /aria-live="polite"/);
  });

  /**
   * @testData runtime composable内のpending toast制御関数とloading中のtoast遅延分岐。
   * @expected loading overlay表示中はtoastを即時表示せず、pendingとして保持して後からflushできる。
   */
  it("toast display is delayed while the loading overlay is visible", () => {
    const runtime = read("Frontend/composables/frichy/useFrichyRuntime.ts");

    assert.match(runtime, /pendingToastMessage/);
    assert.match(runtime, /function shouldDelayToast/);
    assert.match(runtime, /function flushPendingToast/);
    assert.match(runtime, /if \(shouldDelayToast\(\)\)/);
  });

  /**
   * @testData LoginPanel、PrivacyPolicyModal、UnsavedChangesModalのdialog/close control。
   * @expected modal/dialogはroleとaria-modalを持ち、close操作には日本語のaria-labelが設定されている。
   */
  it("modal and popover close controls have accessible labels", () => {
    const loginPanel = read("Frontend/components/organisms/LoginPanel.vue");
    const privacyModal = read("Frontend/components/organisms/PrivacyPolicyModal.vue");
    const unsavedModal = read("Frontend/components/organisms/UnsavedChangesModal.vue");

    assert.match(loginPanel, /aria-label="ログインを閉じる"/);
    assert.match(privacyModal, /role="dialog"/);
    assert.match(privacyModal, /aria-modal="true"/);
    assert.match(privacyModal, /aria-label="プライバシーポリシーを閉じる"/);
    assert.match(unsavedModal, /role="dialog"/);
    assert.match(unsavedModal, /aria-modal="true"/);
  });

  /**
   * @testData LoginPanelの主要anchor/CTAと、AppShellの主要画面component切り替え。
   * @expected ナビゲーション文言とCTAが行動可能な表記で維持され、主要画面の表示条件が残っている。
   */
  it("core navigation and CTA labels remain actionable and predictable", () => {
    const loginPanel = read("Frontend/components/organisms/LoginPanel.vue");
    const appShell = read("Frontend/components/templates/AppShell.vue");

    assert.match(loginPanel, /<a href="#features">特徴<\/a>/);
    assert.match(loginPanel, /<a href="#projects">案件例<\/a>/);
    assert.match(loginPanel, /<a href="#flow">ご利用の流れ<\/a>/);
    assert.match(loginPanel, />\s*無料登録\s*</);
    assert.match(appShell, /<DashboardPage v-if="state\.activeView === 'dashboard'"/);
    assert.match(appShell, /<ProfilePage v-else-if="state\.activeView === 'profile'"/);
    assert.match(appShell, /<MeetingPage v-else-if="state\.activeView === 'meeting'"/);
  });

  /**
   * @testData ProfileWizardのレジュメ選択UI、hidden file input、明示ボタン、クリックハンドラ。
   * @expected native file inputを直接押させず、`ファイルを選択`ボタンからfile inputを開ける構造になっている。
   */
  it("resume file selection is triggered by an explicit button", () => {
    const profileWizard = read("Frontend/components/organisms/ProfileWizard.vue");

    assert.match(profileWizard, /ファイルを選択/);
    assert.match(profileWizard, /ref="resumeInput"/);
    assert.match(profileWizard, /@click="openResumeFilePicker"/);
    assert.match(profileWizard, /resumeInput\.value\.click\(\)/);
    assert.match(profileWizard, /\.fileInput\s*\{[\s\S]*position:\s*absolute/);
  });

  /**
   * @testData ScoutPageのレジュメpreview event、dialog状態、ResumePreview fullscreen配置、旧scroll誘導。
   * @expected スカウト画面のレジュメボタン押下後はdialogで候補者だけ選択し、下部へスクロールしない。
   */
  it("scout page renders resume preview in a dialog", () => {
    const scoutPage = read("Frontend/components/pages/ScoutPage.vue");

    assert.match(scoutPage, /@preview="openResumePreview"/);
    assert.match(scoutPage, /resumePreviewDialogOpen/);
    assert.match(scoutPage, /ref="resumePreviewModalRef"/);
    assert.match(scoutPage, /aria-labelledby="resume-preview-title"/);
    assert.match(scoutPage, /aria-label="レジュメ確認を閉じる"/);
    assert.match(scoutPage, /<ResumePreview variant="fullscreen" \/>/);
    assert.match(scoutPage, /useBodyScrollLock\(anyModalOpen\)/);
    assert.match(scoutPage, /selectPreviewTarget\(freelancerId\)/);
    assert.doesNotMatch(scoutPage, /await selectPreview\(freelancerId\)/);
    assert.doesNotMatch(scoutPage, /previewPanelRef/);
    assert.doesNotMatch(scoutPage, /scrollIntoView/);
  });

  /**
   * @testData ResumePreviewの明示preview action、iframe preview、download action、旧HTML文字列preview。
   * @expected プレビューbutton押下後だけPDF/OfficeのpreviewUrlをiframeへ渡し、`v-html`による文字列プレビューに戻らない。
   */
  it("resume preview uses viewer iframe instead of HTML string conversion", () => {
    const resumePreview = read("Frontend/components/organisms/ResumePreview.vue");

    assert.match(resumePreview, /"プレビュー"/);
    assert.match(resumePreview, /@click="loadPreview"/);
    assert.match(resumePreview, /selectPreview\(freelancer\.value\.id\)/);
    assert.match(resumePreview, /<iframe[\s\S]*:src="preview\.previewUrl"/);
    assert.match(resumePreview, /別タブで開く/);
    assert.match(resumePreview, /downloadResumePreview/);
    assert.match(resumePreview, /variant\?: "panel" \| "fullscreen"/);
    assert.doesNotMatch(resumePreview, /v-html/);
    assert.doesNotMatch(resumePreview, /documentPreview/);
  });
});
