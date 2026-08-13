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

  /**
   * @testData ProfileWizardのスキルごとの経験年数fieldsetと、選択スキル増加時のgrid/scroll制御。
   * @expected 経験年数欄はフォーム全幅で可変列表示になり、高さ上限を持ってフォーム全体を伸ばしすぎない。
   */
  it("profile skill experience inputs keep a bounded responsive grid", () => {
    const source = read("Frontend/components/organisms/ProfileWizard.vue");

    assert.match(source, /\.skillExperienceGroup\s*\{[\s\S]*grid-column:\s*1 \/ -1/);
    assert.match(source, /\.skillExperienceGroup\s*\{[\s\S]*repeat\(auto-fit,\s*minmax\(180px,\s*1fr\)\)/);
    assert.match(source, /\.skillExperienceGroup\s*\{[\s\S]*max-height:\s*360px/);
    assert.match(source, /\.skillExperienceGroup\s*\{[\s\S]*overflow-y:\s*auto/);
  });

  /**
   * @testData ProfileWizardの各入力ステップ、ヘッダー操作内の共通登録ボタン、フォーム同期watch、一括保存ランタイム。
   * @expected 各ステップでは保存submitを持たず、初期状態に戻すボタンの右にある共通登録ボタンだけで一括保存し、ステップ移動で入力内容を再同期しない。
   */
  it("プロフィール入力は共通の登録ボタンだけで保存する", () => {
    const source = read("Frontend/components/organisms/ProfileWizard.vue");
    const runtime = read("Frontend/composables/frichy/useFrichyRuntime.ts");
    const resetButton = source.indexOf('@click="resetProfileForm"');
    const registerButton = source.indexOf('@click="registerProfile"');

    assert.doesNotMatch(source, /保存して次へ|登録完了/);
    assert.doesNotMatch(source, /@submit\.prevent="save/);
    assert.match(source, />登録する<\/BaseButton\s*>/);
    assert.ok(registerButton > resetButton);
    assert.match(source, /\$style\.headerActions/);
    assert.doesNotMatch(source, /\$style\.stepActions/);
    assert.match(source, /function buildProfileRegistrationInput\(\)/);
    assert.match(
      source,
      /async function registerProfile\(\)[\s\S]*applyProfileRegistrationDraft\(input\)[\s\S]*validateProfileRegistrationInput\(input[\s\S]*saveProfileRegistration\(input\)/,
    );
    assert.match(source, /watch\(\(\) => state\.value\.profile\.id, hydrateForms/);
    assert.doesNotMatch(source, /state\.value\.profile\.id,\s*state\.value\.wizardStep/);
    assert.match(
      runtime,
      /async function saveProfileRegistration\(values: ProfileRegistrationInput\)/,
    );
    assert.match(runtime, /validateProfileRegistration\(values, candidates\)/);
    assert.match(runtime, /function applyProfileRegistrationDraft\(/);
    assert.match(runtime, /label: "面談候補"[\s\S]*done: Boolean\(p\.meetingCandidates\.length\)/);
    assert.doesNotMatch(runtime, /label: "面談候補"[\s\S]*meetingRequests\.some/);
    assert.match(source, /validateProfileRegistrationInput\(input/);
    assert.match(source, /:error="validationErrors\.nameKana"/);
    assert.match(source, /:error="validationErrors\.email"/);
    assert.match(source, /:error="validationErrors\.phone"/);
    assert.match(source, /\$style\.invalidControl/);
    assert.match(source, /\$style\.errorText/);
  });

  /**
   * @testData TagBadgeの商流/スキル表示、狭いカード幅、長いタグ文字列。
   * @expected バッジは1行で省略され、折り返しで楕円形に崩れない。
   */
  it("tag badges stay single-line to prevent distorted pills", () => {
    const source = read("Frontend/components/atoms/TagBadge.vue");

    assert.match(source, /\.tag\s*\{[\s\S]*white-space:\s*nowrap/);
    assert.match(source, /\.tag\s*\{[\s\S]*overflow:\s*hidden/);
    assert.match(source, /\.tag\s*\{[\s\S]*text-overflow:\s*ellipsis/);
    assert.doesNotMatch(source, /white-space:\s*normal/);
  });

  /**
   * @testData StreamBadgeの固定寸法、商流表示を持つ主要component。
   * @expected 商流は画面やエリアに依存せず、固定正円の専用バッジで表示される。
   */
  it("stream values use a fixed circular badge in every stream display area", () => {
    const streamBadge = read("Frontend/components/atoms/StreamBadge.vue");
    const jobCard = read("Frontend/components/molecules/JobCard.vue");
    const applicationsTable = read("Frontend/components/organisms/ApplicationsTable.vue");
    const jobsAdminTable = read("Frontend/components/organisms/JobsAdminTable.vue");
    const scoutPage = read("Frontend/components/pages/ScoutPage.vue");
    const loginPanel = read("Frontend/components/organisms/LoginPanel.vue");

    assert.match(streamBadge, /width:\s*52px/);
    assert.match(streamBadge, /height:\s*52px/);
    assert.match(streamBadge, /border-radius:\s*50%/);
    assert.match(jobCard, /<StreamBadge :value="job\.stream" \/>/);
    assert.match(applicationsTable, /<StreamBadge :value="getJob\(application\.jobId\)\?\.stream \|\| ''" \/>/);
    assert.match(jobsAdminTable, /<StreamBadge :value="job\.stream" \/>/);
    assert.match(scoutPage, /<StreamBadge :value="job\.stream" \/>/);
    assert.match(loginPanel, /<StreamBadge :value="project\.stream" \/>/);
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
   * @testData ResumePreviewのdocx preview分岐、docx-previewのdynamic import、Microsoft Office Viewer URL。
   * @expected docxは外部Office iframeに渡さず、Frichy内で`docx-preview`により描画する。
   */
  it("resume preview renders docx inside Frichy without Office Viewer iframe", () => {
    const source = read("Frontend/components/organisms/ResumePreview.vue");

    assert.match(source, /preview\.previewKind === 'docx'/);
    assert.match(source, /import\("docx-preview"\)/);
    assert.match(source, /renderAsync\(blob,\s*container/);
    assert.doesNotMatch(source, /view\.officeapps\.live\.com/);
    assert.doesNotMatch(source, /allow="unload \*"/);
  });

  /**
   * @testData LoginPanelの主要anchor/CTAと、AppShellの主要画面component切り替え。
   * @expected ナビゲーション文言とCTAが行動可能な表記で維持され、主要画面の表示条件が残っている。
   */
  it("core navigation and CTA labels remain actionable and predictable", () => {
    const loginPanel = read("Frontend/components/organisms/LoginPanel.vue");
    const appShell = read("Frontend/components/templates/AppShell.vue");

    assert.match(loginPanel, /href="#features"[\s\S]*@click="handleLandingAnchorClick\(\$event, 'features'\)"/);
    assert.match(loginPanel, /href="#projects"[\s\S]*@click="handleLandingAnchorClick\(\$event, 'projects'\)"/);
    assert.match(loginPanel, /href="#flow"[\s\S]*@click="handleLandingAnchorClick\(\$event, 'flow'\)"/);
    assert.match(loginPanel, /function smoothScrollToSection/);
    assert.match(loginPanel, /function scrollToRegister\(\)[\s\S]*closeLoginPopover\(\)/);
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
   * @testData ResumePreviewの明示preview action、PDF iframe、docx-preview、download action、旧HTML文字列preview。
   * @expected PDFだけiframeへ渡し、docxは内部viewerで描画し、`v-html`による文字列プレビューに戻らない。
   */
  it("resume preview uses viewer iframe instead of HTML string conversion", () => {
    const resumePreview = read("Frontend/components/organisms/ResumePreview.vue");

    assert.match(resumePreview, /"プレビュー"/);
    assert.match(resumePreview, /@click="loadPreview"/);
    assert.match(resumePreview, /selectPreview\(freelancer\.value\.id\)/);
    assert.match(resumePreview, /preview\.previewKind === 'pdf'/);
    assert.match(resumePreview, /:src="preview\.previewUrl"/);
    assert.match(resumePreview, /preview\.previewKind === 'docx'/);
    assert.match(resumePreview, /別タブで開く/);
    assert.match(resumePreview, /downloadResumePreview/);
    assert.match(resumePreview, /variant\?: "panel" \| "fullscreen"/);
    assert.doesNotMatch(resumePreview, /v-html/);
    assert.doesNotMatch(resumePreview, /documentPreview/);
  });

  /**
   * @testData MeetingChatのmessage本文描画、改行を含む通常メッセージ、scriptタグを含む悪意ある入力。
   * @expected 本文はVueの通常テキストバインディングでエスケープされ、改行はCSSで保持される。
   */
  it("meeting chat keeps line breaks without enabling HTML execution", () => {
    const meetingChat = read("Frontend/components/organisms/MeetingChat.vue");

    assert.match(meetingChat, /<div :class="\$style\.messageBody">\{\{ message\.body \}\}<\/div>/);
    assert.match(meetingChat, /\.messageBody\s*\{[\s\S]*white-space:\s*pre-wrap/);
    assert.doesNotMatch(meetingChat, /v-html/);
  });

  /**
   * @testData PDF出力ブロックのタイトル、ファイル名、作成日、旧匿名提案資料文言。
   * @expected 提出用の職務経歴書として出力され、Frichy表記・補足/備考・旧ファイル名はPDF出力ブロックに含まれない。
   */
  it("anonymous sheet PDF output is formatted as a resume document", () => {
    const runtime = read("Frontend/composables/frichy/useFrichyRuntime.ts");
    const start = runtime.indexOf("function downloadSheetPdf");
    const end = runtime.indexOf("function drawPdfRow");
    const pdfBlock = runtime.slice(start, end);

    assert.match(pdfBlock, /link\.download = buildResumeSheetFilename/);
    assert.match(pdfBlock, /職務経歴書/);
    assert.match(pdfBlock, /作成日/);
    assert.match(pdfBlock, /function buildCandidateInitials/);
    assert.doesNotMatch(pdfBlock, /Frichy/);
    assert.doesNotMatch(pdfBlock, /匿名スキルシート/);
    assert.doesNotMatch(pdfBlock, /Public ID/);
    assert.doesNotMatch(pdfBlock, /補足|備考/);
    assert.doesNotMatch(pdfBlock, /anonymous-skill-sheet/);
  });

  /**
   * @testData AppHeaderのmeeting/contact nav、未読チャット数、status=newの問い合わせ。
   * @expected 面談・問い合わせナビには件数バッジが表示され、問い合わせは未回答分を数える。
   */
  it("app header shows numeric badges for unread chats and unanswered inquiries", () => {
    const appHeader = read("Frontend/components/organisms/AppHeader.vue");

    assert.match(appHeader, /const navBadgeCounts = computed/);
    assert.match(appHeader, /meeting:\s*currentUnreadChatCount\.value/);
    assert.match(appHeader, /contact:\s*state\.value\.contactInquiries\.filter/);
    assert.match(appHeader, /inquiry\.status === "new"/);
    assert.match(appHeader, /function navBadgeCount\(view: ViewKey\)/);
    assert.match(appHeader, /v-if="navBadgeCount\(item\.view\)"/);
    assert.match(appHeader, /formatBadgeCount/);
    assert.match(appHeader, /\$style\.navBadge/);
    assert.doesNotMatch(appHeader, /currentRole === 'freelancer'/);
  });

  /**
   * @testData MeetingChatのmounted/watch処理、runtime側の明示既読化関数。
   * @expected チャット画面componentは表示更新だけ行い、未読の既読化はruntimeの画面遷移/対象選択に集約する。
   */
  it("meeting chat does not auto-clear unread badges from component watches", () => {
    const meetingChat = read("Frontend/components/organisms/MeetingChat.vue");

    assert.doesNotMatch(meetingChat, /markActiveChatAsRead/);
    assert.match(meetingChat, /void scrollChatToBottom\(\)/);
  });

  /**
   * @testData MeetingChatの営業ロール、初回面談候補0件、応募案件ありの求職者。
   * @expected 本人の初回候補がない場合は営業側でも初回面談フォームが表示され、候補登録後もリスケ表示にはならない。
   */
  it("sales can create initial meeting candidates when the freelancer has no wishes", () => {
    const meetingChat = read("Frontend/components/organisms/MeetingChat.vue");

    assert.match(meetingChat, /const activeInitialMeetingRequests = computed/);
    assert.match(meetingChat, /const canSalesCreateInitialMeeting = computed/);
    assert.match(meetingChat, /currentRole\.value === "sales"/);
    assert.match(meetingChat, /meetingThreadMode\.value === "initial"/);
    assert.match(meetingChat, /!activeInitialMeetingRequests\.value\.length/);
    assert.match(meetingChat, /Boolean\(rescheduleMeetingId\.value\) \|\| canSalesCreateInitialMeeting\.value/);
    assert.match(meetingChat, /function hasInitialMeetingCandidateForActiveFreelancer/);
    assert.match(meetingChat, /setMeetingThreadMode\("initial"\)/);
    assert.match(meetingChat, /rescheduleMeetingId\.value\s*\?\s*"リスケ候補日時"\s*:\s*"候補日時"/);
  });

  /**
   * @testData AdminPageの応募者一覧、成約/見送りステータス、ApplicationsTableへの入力。
   * @expected 進行中応募と成約・見送り応募が別カードに分かれて表示される。
   */
  it("admin applications are split into active and completed cards", () => {
    const adminPage = read("Frontend/components/pages/AdminPage.vue");

    assert.match(adminPage, /const completedApplicationStatuses: ApplicationStatus\[\] = \["成約", "見送り"\]/);
    assert.match(adminPage, /const activeFilteredApplications = computed/);
    assert.match(adminPage, /const completedFilteredApplications = computed/);
    assert.match(adminPage, /<SelectionKanban :applications="activeFilteredApplications" \/>/);
    assert.match(adminPage, /<ApplicationsTable :applications="activeFilteredApplications" with-resume \/>/);
    assert.match(adminPage, /<h2 :class="\$style\.panelTitle">成約・見送り求職者<\/h2>/);
    assert.match(adminPage, /<ApplicationsTable :applications="completedFilteredApplications" with-resume \/>/);
  });

  /**
   * @testData ContactPageの回答済み問い合わせ、追加メッセージ入力、クローズ操作、runtime/API route。
   * @expected 回答後の問い合わせに追加メッセージ送信とクローズ操作が表示され、API連携関数も存在する。
   */
  it("contact inquiries can be followed up and closed from the UI", () => {
    const contactPage = read("Frontend/components/pages/ContactPage.vue");
    const runtime = read("Frontend/composables/frichy/useFrichyRuntime.ts");
    const routes = read("backend/src/interfaces/http/routes/contact.routes.ts");

    assert.match(contactPage, /sendAdditionalMessage\(inquiry\.id\)/);
    assert.match(contactPage, /closeInquiry\(inquiry\.id\)/);
    assert.match(contactPage, /function canReplyToInquiry/);
    assert.match(contactPage, /status === "closed"/);
    assert.match(contactPage, /追加メッセージを送信/);
    assert.match(runtime, /async function sendContactInquiryMessage/);
    assert.match(runtime, /async function closeContactInquiry/);
    assert.match(runtime, /\/contact-inquiries\/\$\{id\}\/messages/);
    assert.match(runtime, /\/contact-inquiries\/\$\{id\}\/close/);
    assert.match(routes, /"\/api\/contact-inquiries\/:id\/messages"/);
    assert.match(routes, /"\/api\/contact-inquiries\/:id\/close"/);
  });
});
