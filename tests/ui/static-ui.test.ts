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
  it("landing FEATURES section keeps the exact approved copy and component structure", () => {
    const source = read("Frontend/components/molecules/LandingFeatureSection.vue");

    assert.match(source, /<span>FEATURES<\/span>/);
    assert.match(source, /const featureHeading = "最短1分で応募まで。";/);
    assert.match(source, /const featureLead = "Frichyが案件探しを自動化。";/);
    assert.match(source, /:class="\$style\.featureTitle"/);
    assert.match(source, /:class="\$style\.featureLead"/);
    assert.doesNotMatch(source, /登録から面談調整まで/);
  });

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
  it("Vue components do not use viewport-scaled font-size clamp", () => {
    const offenders = vueFiles(join(frontendRoot, "components")).filter((file) =>
      /font-size:\s*clamp\([^;]*vw/i.test(read(file)),
    );

    assert.deepEqual(offenders, []);
  });

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
  it("loading overlay and toast expose polite status announcements", () => {
    const loading = read("Frontend/components/atoms/AppLoadingOverlay.vue");
    const toast = read("Frontend/components/atoms/ToastMessage.vue");

    assert.match(loading, /role="status"/);
    assert.match(loading, /aria-live="polite"/);
    assert.match(toast, /role="status"/);
    assert.match(toast, /aria-live="polite"/);
  });

  it("toast display is delayed while the loading overlay is visible", () => {
    const runtime = read("Frontend/composables/frichy/useFrichyRuntime.ts");

    assert.match(runtime, /pendingToastMessage/);
    assert.match(runtime, /function shouldDelayToast/);
    assert.match(runtime, /function flushPendingToast/);
    assert.match(runtime, /if \(shouldDelayToast\(\)\)/);
  });

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
});
