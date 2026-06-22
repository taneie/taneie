<template>
  <div :class="$style.landingShell">
    <header ref="landingHeaderRef" :class="$style.landingHeader">
      <div :class="$style.headerInner">
        <div :class="$style.brand">
          <BrandMark />
        </div>

        <nav :class="$style.headerNav" aria-label="トップページ">
          <a href="#features">特徴</a>
          <a href="#projects">案件例</a>
          <a href="#flow">ご利用の流れ</a>
        </nav>

        <div :class="$style.headerActions">
          <button type="button" :class="$style.loginTrigger" @click="showLogin = !showLogin">
            ログイン
          </button>
          <button type="button" :class="$style.headerCta" @click="scrollToRegister">
            無料登録
          </button>
        </div>

        <div v-if="showLogin" :class="$style.loginPopover">
          <div :class="$style.popoverHead">
            <strong>ログイン</strong>
            <button type="button" aria-label="ログインを閉じる" @click="showLogin = false">×</button>
          </div>

          <form :class="[$style.formGrid, $style.one]" @submit.prevent="submitLogin">
            <FormInput
              v-model="loginForm.email"
              label="メールアドレス"
              name="email"
              type="email"
              autocomplete="email"
            />
            <FormInput
              v-model="loginForm.password"
              label="パスワード"
              name="password"
              type="password"
              autocomplete="current-password"
            />
            <BaseButton type="submit" icon="user">ログイン</BaseButton>
          </form>

          <!-- 本番運用時に削除する -->
          <div :class="$style.demoList">
            <button type="button" @click="startDemoLogin('freelancer')">
              <strong>求職者デモ</strong>
              <span>freelancer@example.com</span>
            </button>
            <button type="button" @click="startDemoLogin('sales')">
              <strong>営業デモ</strong>
              <span>sales@freelink.jp</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main :class="$style.landingMain">
      <div :class="$style.landingLayout">
        <div :class="$style.contentColumn">
          <section :class="$style.heroSection">
            <div :class="$style.heroContent">
              <p :class="$style.eyebrow">フリーランスエンジニア向け案件マッチング</p>
              <h1>マージン開示で高単価。</h1><h1>あなたのスキルに最適な条件を最速提案。</h1>
              <!-- <p :class="$style.heroLead">
                マージン開示で高単価。あなたのスキルに最適な条件を最速提案。
              </p> -->

              <div :class="$style.heroActions">
                <button type="button" :class="$style.primaryCta" @click="scrollToRegister">
                  無料で登録する
                </button>
                <a href="#projects" :class="$style.secondaryCta">案件例を見る</a>
              </div>

              <dl :class="$style.stats">
                <div>
                  <dt>3step</dt>
                  <dd>登録から案件応募まで</dd>
                </div>
                <div>
                  <dt>80-100万</dt>
                  <dd>高単価案件例</dd>
                </div>
                <div>
                  <dt>1画面</dt>
                  <dd>面談・チャット管理</dd>
                </div>
              </dl>
            </div>

            <figure :class="$style.heroVisual">
              <img
                :src="heroImageSrc"
                alt="案件提案とチャットを管理するフリーランス向け画面のイメージ"
              />
              <figcaption>
                <span>Profile</span>
                <span>Job matching</span>
                <span>Meeting chat</span>
              </figcaption>
            </figure>
          </section>

          <section id="features" :class="$style.infoSection">
            <div :class="$style.sectionHead">
              <span>FEATURES</span>
              <!-- 本番運用までに、h2の羅列を治す -->
              <h2>最短1分で応募まで。</h2><h2>Freelinkが案件探しを自動化。</h2>
            </div>

            <!-- p要素はPCだと表示するでOK -->
            <div :class="$style.featureGrid">
              <article>
                <span :class="$style.featureIcon" aria-hidden="true">⌕</span>
                <div :class="$style.featureBody">
                  <strong>案件探しの時間を1/3に</strong>
                  <!-- <p>単価・スキルなどで素早く絞り込み</p> -->
                </div>
              </article>
              <article>
                <span :class="$style.featureIcon" aria-hidden="true">↔</span>
                <div :class="$style.featureBody">
                  <strong>応募後の調整がスムーズに進む</strong>
                  <!-- <p>チャットと面談調整を1画面で管理</p> -->
                </div>
              </article>
              <article>
                <span :class="$style.featureIcon" aria-hidden="true">✓</span>
                <div :class="$style.featureBody">
                  <strong>提案準備が自動で整う</strong>
                  <!-- <p>スキル・稼働条件を段階的に登録</p> -->
                </div>
              </article>
            </div>
          </section>

          <section :class="$style.visualSection">
            <img
              :src="flowImageSrc"
              alt="プロフィール登録、案件推薦、オンライン面談へ進む流れのイメージ"
            />
            <div :class="$style.visualText">
              <span>ONE PLATFORM</span>
              <h2>登録から面談調整まで、情報が散らばらない。</h2>
              <p>
                応募状況、営業担当とのチャット、面談候補を同じ流れで扱えるため、案件ごとの確認事項を見失いにくくなります。
              </p>
            </div>
          </section>

          <section id="projects" :class="$style.projectsSection">
            <div :class="$style.sectionHead">
              <span>PROJECTS</span>
              <h2>案件のご紹介例</h2>
            </div>

            <div :class="$style.projectGrid">
              <article v-for="project in projects" :key="project.title">
                <div :class="$style.projectMeta">
                  <span>{{ project.remote }}</span>
                  <span>{{ project.stream }}</span>
                </div>
                <h3>{{ project.title }}</h3>
                <p>{{ project.summary }}</p>
                <div :class="$style.projectFoot">
                  <span>月額</span><strong>{{ project.rate }}</strong>
                  <div :class="$style.skillBadges" aria-label="スキルセット">
                    <span v-for="skill in project.skills" :key="skill">
                      {{ skill }}
                    </span>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section id="flow" :class="$style.flowSection">
            <div :class="$style.sectionHead">
              <span>FLOW</span>
              <h2>登録後の流れ</h2>
            </div>

            <ol :class="$style.flowList">
              <li>
                <strong>プロフィール入力</strong>
                <p>基本情報・希望条件などを登録。</p>
              </li>
              <li>
                <strong>案件検索・応募</strong>
                <p>条件に合う案件へ応募。</p>
              </li>
              <li>
                <strong>面談調整</strong>
                <p>候補日を設定、チャットで調整。</p>
              </li>
            </ol>
          </section>
        </div>

        <aside id="register-panel" :class="$style.registerPanel" aria-label="新規登録フォーム">
          <div :class="$style.registerHead">
            <span>30秒で開始</span>
            <h2>無料会員登録</h2>
            <p>登録後、プロフィール入力画面へ進みます。</p>
            <p>30秒で完了。登録後も費用は一切かかりません。</p>
          </div>

          <form
            :class="[$style.formGrid, $style.registerGrid]"
            novalidate
            @submit.prevent="submitRegister"
          >
            <FormInput
              v-model="registerForm.email"
              label="メールアドレス"
              name="email"
              type="email"
              autocomplete="email"
              required
              :error="registerErrors.email"
              @update:model-value="markDirty"
            />
            <FormInput
              v-model="registerForm.password"
              label="パスワード"
              name="password"
              type="password"
              autocomplete="new-password"
              required
              :error="registerErrors.password"
              @update:model-value="markDirty"
            />
            <FormInput
              v-model="registerForm.passwordConfirm"
              label="パスワード確認"
              name="passwordConfirm"
              type="password"
              autocomplete="new-password"
              required
              :error="registerErrors.passwordConfirm"
              @update:model-value="markDirty"
            />
            <label
              :class="[
                $style.privacyConsent,
                { [$style.privacyConsentError]: registerErrors.privacyAccepted },
              ]"
            >
              <input v-model="privacyAccepted" type="checkbox" required @change="markDirty" />
              <span>
                <button type="button" @click="showPrivacyPolicy = true">プライバシーポリシー</button>
                に同意します
              </span>
              <small v-if="registerErrors.privacyAccepted">
                {{ registerErrors.privacyAccepted }}
              </small>
            </label>
            <BaseButton :class="$style.sendButton" type="submit" icon="user">会員登録して始める</BaseButton>
          </form>

        </aside>
      </div>
    </main>

    <footer :class="$style.landingFooter">
      <span>© 2026 Freelink. All rights reserved.</span>
      <button type="button" @click="showPrivacyPolicy = true">プライバシーポリシー</button>
    </footer>

    <PrivacyPolicyModal :open="showPrivacyPolicy" @close="showPrivacyPolicy = false" />
    <ToastMessage />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useFreelinkRuntime } from "~/composables/freelink/useFreelinkRuntime";
import type { RegisterInput } from "~/composables/freelink/types";

const {
  login,
  loginWithDemo,
  register,
  markDirty,
  confirmDiscardChanges,
  requestBrowserNotificationPermission,
} = useFreelinkRuntime();

const heroImageSrc = "/images/lp-hero-engineer.png";
const flowImageSrc = "/images/lp-flow-visual.png";

const showLogin = ref(false);
const showPrivacyPolicy = ref(false);
const privacyAccepted = ref(false);
const landingHeaderRef = ref<HTMLElement | null>(null);
const registerErrors = reactive<Record<string, string>>({});
let landingHeaderObserver: ResizeObserver | undefined;

const loginForm = reactive({
  email: "",
  password: ""
});

const registerForm = reactive({
  email: "",
  role: "",
  password: "",
  passwordConfirm: ""
})

const projects = [
  {
    title: "金融SaaSのバックエンド刷新",
    summary: "Java/Spring Bootで決済基盤を刷新。設計から実装、テストまで担当。",
    rate: "80-100万円",
    skills: ["Java", "Spring Boot", "PostgreSQL"],
    remote: "一部リモート",
    stream: "エンド直"
  },
  {
    title: "人材マッチングサービスのフロント開発",
    summary: "React/TypeScriptで候補者・営業向け画面を改善。UI実装と状態管理が中心。",
    rate: "70-90万円",
    skills: ["React", "TypeScript", "CSS"],
    remote: "フルリモート",
    stream: "1次請け"
  },
  {
    title: "製造業向けクラウド基盤構築",
    summary: "AWS/Terraformで新規クラウド環境を設計。監視、権限、CI/CD整備を含む。",
    rate: "75-95万円",
    skills: ["AWS", "Terraform", "Linux"],
    remote: "一部リモート",
    stream: "2次請け"
  }
];

async function submitLogin() {
  if (!(await confirmDiscardChanges())) return;
  void requestBrowserNotificationPermission();
  login(loginForm.email, loginForm.password);
}

function startDemoLogin(role: "freelancer" | "sales") {
  void requestBrowserNotificationPermission();
  loginWithDemo(role);
}

function submitRegister() {
  if (!validateRegisterForm()) {
    return;
  }
  void requestBrowserNotificationPermission();

  register({
    email: registerForm.email,
    role: registerForm.role,
    password: registerForm.password,
    passwordConfirm: registerForm.passwordConfirm
  });
}

function validateRegisterForm() {
  Object.keys(registerErrors).forEach((key) => {
    delete registerErrors[key];
  });

  if (!registerForm.email.trim()) {
    registerErrors.email = "メールアドレスを入力してください。";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email.trim())) {
    registerErrors.email = "メールアドレスの形式で入力してください。";
  }
  if (!registerForm.password) {
    registerErrors.password = "パスワードを入力してください。";
  } else if (registerForm.password.length < 8) {
    registerErrors.password = "パスワードは8文字以上で入力してください。";
  }
  if (!registerForm.passwordConfirm) {
    registerErrors.passwordConfirm = "確認用パスワードを入力してください。";
  } else if (registerForm.password !== registerForm.passwordConfirm) {
    registerErrors.passwordConfirm = "確認用パスワードが一致しません。";
  }
  if (!privacyAccepted.value) {
    registerErrors.privacyAccepted = "登録にはプライバシーポリシーへの同意が必要です。";
    showPrivacyPolicy.value = true;
  }

  return !Object.keys(registerErrors).length;
}

function scrollToRegister() {
  document.getElementById("register-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function syncLandingHeaderHeight() {
  if (!import.meta.client || !landingHeaderRef.value) return;
  document.documentElement.style.setProperty(
    "--landing-header-height",
    `${Math.ceil(landingHeaderRef.value.getBoundingClientRect().height)}px`,
  );
}

onMounted(async () => {
  await nextTick();
  syncLandingHeaderHeight();
  landingHeaderObserver = new ResizeObserver(syncLandingHeaderHeight);
  if (landingHeaderRef.value) {
    landingHeaderObserver.observe(landingHeaderRef.value);
  }
  window.addEventListener("resize", syncLandingHeaderHeight);
});

onBeforeUnmount(() => {
  landingHeaderObserver?.disconnect();
  if (import.meta.client) {
    window.removeEventListener("resize", syncLandingHeaderHeight);
    document.documentElement.style.removeProperty("--landing-header-height");
  }
});
</script>

<style module>
.landingShell {
  min-height: 100dvh;
  --landing-scroll-offset: calc(var(--safe-top) + var(--landing-header-height, 72px) + 16px);
  padding-top: calc(var(--safe-top) + var(--landing-header-height, 72px));
  padding-inline: var(--safe-left) var(--safe-right);
  background:
    radial-gradient(circle at top left, rgba(29, 95, 211, 0.14), transparent 34%),
    linear-gradient(180deg, #eef6ff 0%, #f7faff 42%, #f4f7fb 100%);
}

:global(#features),
:global(#projects),
:global(#flow),
:global(#register-panel) {
  scroll-margin-top: var(--landing-scroll-offset);
}

.landingHeader {
  position: fixed;
  top: var(--safe-top);
  left: 0;
  right: 0;
  z-index: 60;
  border-bottom: 1px solid rgba(215, 224, 236, 0.78);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(16px);
}

.headerInner {
  position: relative;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  min-width: 0;
  padding: 14px max(20px, var(--safe-right)) 14px max(20px, var(--safe-left));
  display: flex;
  align-items: center;
  gap: 18px;
}

.brand {
  display: inline-flex;
  align-items: center;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  line-height: 0;
}

.headerNav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1 1 auto;
  min-width: 0;
  margin-left: auto;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.headerNav::-webkit-scrollbar {
  display: none;
}

.headerNav a {
  flex: 0 0 auto;
  padding: 9px 12px;
  border-radius: 6px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
}

.headerNav a:hover {
  background: var(--primary-soft);
  color: var(--primary);
}

.headerActions {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 8px;
}

.loginTrigger,
.headerCta,
.primaryCta,
.secondaryCta {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  padding: 0 14px;
  font-weight: 900;
  text-decoration: none;
}

.loginTrigger {
  background: transparent;
  color: var(--primary);
  border: 1px solid #a9c5ed;
}

.headerCta,
.primaryCta {
  background: linear-gradient(180deg, var(--primary), var(--primary-strong));
  color: white;
  box-shadow: 0 10px 22px rgba(29, 95, 211, 0.2);
}

.loginPopover {
  position: absolute;
  top: calc(100% + 10px);
  right: 20px;
  width: min(360px, calc(100vw - 28px));
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  box-shadow: var(--shadow);
}

.popoverHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
  color: #10294f;
}

.popoverHead button {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 18px;
  line-height: 1;
}

.demoList {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.demoList button {
  display: grid;
  gap: 3px;
  text-align: left;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--primary-soft);
}

.demoList strong {
  color: #173a66;
  font-size: 13px;
}

.demoList span {
  color: var(--muted);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.landingMain {
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

.landingLayout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.contentColumn {
  min-width: 0;
}

.heroSection {
  display: grid;
  gap: 22px;
}

.heroContent {
  min-width: 0;
  padding: 18px 0 0;
}

.eyebrow {
  width: fit-content;
  margin: 0 0 14px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--primary-weak);
  color: var(--primary);
  font-size: 13px;
  font-weight: 900;
}

.heroContent h1 {
  margin: 0;
  color: #0a2544;
  font-size: clamp(32px, 4.2vw, 56px);
  line-height: 1.08;
  letter-spacing: 0;
}

.heroLead {
  max-width: 690px;
  margin: 14px 0 0;
  color: #4f6279;
  font-size: 15px;
  line-height: 1.75;
}

.heroActions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.primaryCta,
.secondaryCta {
  min-height: 46px;
  padding: 0 18px;
}

.secondaryCta {
  background: #fff;
  color: var(--primary);
  border: 1px solid #a9c5ed;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 20px 0 0;
}

.stats div {
  position: relative;
  display: grid;
  gap: 6px;
  overflow: hidden;
  padding: 15px 15px 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(247, 250, 255, 0.96)),
    #fff;
  box-shadow: 0 8px 22px rgba(29, 78, 137, 0.06);
}

.stats div::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: linear-gradient(180deg, var(--primary), var(--cyan));
}

.stats dt {
  position: relative;
  z-index: 1;
  color: var(--primary-strong);
  font-size: clamp(21px, 2.2vw, 24px);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  line-height: 1.08;
  letter-spacing: 0;
}

.stats dd {
  position: relative;
  z-index: 1;
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.45;
}

.heroVisual {
  position: relative;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  border: 1px solid rgba(185, 207, 235, 0.9);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 18px 42px rgba(29, 78, 137, 0.12);
}

.heroVisual img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 7.2;
  object-fit: cover;
  object-position: left center;
}

.heroVisual::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 58%, rgba(255, 255, 255, 0.72));
  pointer-events: none;
}

.heroVisual figcaption {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.heroVisual figcaption span {
  min-height: 26px;
  display: inline-flex;
  align-items: center;
  padding: 0 9px;
  border: 1px solid rgba(169, 197, 237, 0.9);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  color: var(--primary-strong);
  font-size: 12px;
  font-weight: 900;
  backdrop-filter: blur(8px);
}

.registerPanel {
  padding: 24px 18px 32px 18px;
  border: 1px solid rgba(215, 224, 236, 0.9);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 10px 28px rgba(29, 78, 137, 0.08);
  scrollbar-gutter: stable;
}

.registerHead {
  margin-bottom: 12px;
}

.registerHead span {
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
}

.registerHead h2 {
  margin: 3px 0 0;
  color: #10294f;
  font-size: 22px;
}

.registerHead p {
  margin: 5px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.formGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.formGrid > * {
  min-width: 0;
}

.one {
  grid-template-columns: 1fr;
}

.registerGrid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.registerGrid > :nth-child(5),
.registerGrid > :nth-last-child(2),
.registerGrid > :last-child {
  grid-column: 1 / -1;
}

.privacyConsent {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 9px;
  align-items: start;
  padding: 10px;
  border: 1px solid #c6d5e8;
  border-radius: 6px;
  background: var(--primary-soft);
  color: #263f63;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.55;
}

.privacyConsent input {
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: var(--primary);
}

.privacyConsent button {
  padding: 0;
  background: transparent;
  color: var(--primary);
  font-weight: 900;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.privacyConsent small {
  grid-column: 1 / -1;
  color: #b8202d;
  font-size: 12px;
  font-weight: 800;
}

.privacyConsentError {
  border-color: #d83f4b;
  background: #fff7f7;
}

.sendButton {
  margin: 10px 0;
}

.infoSection,
.visualSection,
.projectsSection,
.flowSection {
  margin-top: 42px;
}

.sectionHead {
  max-width: 760px;
  margin-bottom: 18px;
}

.sectionHead span {
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
}

.sectionHead h2 {
  margin: 4px 0 0;
  color: #0d2749;
  font-size: clamp(24px, 2.8vw, 36px);
  line-height: 1.2;
}

.featureGrid,
.projectGrid,
.flowList {
  display: grid;
  gap: 14px;
}

.featureGrid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.featureGrid article,
.projectGrid article,
.flowList li {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  padding: 16px;
  box-shadow: 0 8px 22px rgba(29, 78, 137, 0.06);
}

.featureGrid strong,
.flowList strong {
  color: #10294f;
  font-size: 16px;
}

.featureGrid p,
.projectGrid p,
.flowList p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.7;
}

.featureGrid article {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px;
  align-items: start;
  overflow: hidden;
  padding: 18px;
  border-color: rgba(185, 207, 235, 0.95);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 250, 255, 0.98)),
    #fff;
}

.featureGrid article::after {
  content: "";
  position: absolute;
  right: -34px;
  top: -38px;
  width: 110px;
  height: 110px;
  border-radius: 999px;
  background: rgba(29, 95, 211, 0.07);
  pointer-events: none;
}

.featureIcon {
  position: relative;
  z-index: 1;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(169, 197, 237, 0.95);
  border-radius: 12px;
  background: linear-gradient(180deg, var(--primary), var(--primary-strong));
  color: #fff;
  font-size: 20px;
  font-weight: 900;
  line-height: 1;
  box-shadow: 0 10px 22px rgba(29, 95, 211, 0.18);
}

.featureBody {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.featureBody strong {
  display: block;
  color: #0d2749;
  font-size: 16px;
  line-height: 1.45;
}

.featureBody p {
  margin: 9px 0 0;
  color: var(--muted);
  line-height: 1.85;
}

.visualSection {
  position: relative;
  display: grid;
  gap: 18px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: linear-gradient(180deg, #ffffff, #f6faff);
  box-shadow: 0 16px 34px rgba(29, 78, 137, 0.09);
}

.visualSection img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 7.5;
  object-fit: cover;
  object-position: center;
}

.visualText {
  padding: 0 22px 22px;
}

.visualText span {
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
}

.visualText h2 {
  margin: 5px 0 0;
  color: #0d2749;
  font-size: clamp(22px, 2.6vw, 32px);
  line-height: 1.2;
}

.visualText p {
  max-width: 680px;
  margin: 10px 0 0;
  color: var(--muted);
  line-height: 1.8;
}

.projectGrid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.projectMeta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.projectMeta span {
  min-height: 25px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0 8px;
  background: var(--primary-strong);
  color: var(--soft);
  font-size: 12px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}

.projectGrid h3 {
  margin: 0;
  color: #10294f;
  font-size: 17px;
}

.projectFoot {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 6px;
  row-gap: 4px;
  align-items: center;
  margin-top: 14px;
  padding: 12px;
  border: 1px solid #c6d9f4;
  border-radius: 8px;
  background: #f7fbff;
}

.projectFoot strong {
  color: var(--primary-strong);
  font-size: 19px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
  line-height: 1;
  white-space: nowrap;
}

.skillBadges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 10px;
}

.projectFoot .skillBadges {
  grid-column: 1 / -1;
}

.skillBadges span {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border: 1px solid #b8cff0;
  border-radius: 999px;
  background: #f4f8fe;
  color: var(--primary-strong);
  font-size: 12px;
  font-weight: 900;
}

.projectFoot > span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
}

.flowList {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 0;
  list-style: none;
  counter-reset: flow;
}

.flowList li {
  position: relative;
  padding-left: 54px;
  counter-increment: flow;
}

.flowList li::before {
  content: counter(flow);
  position: absolute;
  left: 16px;
  top: 16px;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--primary);
  color: #fff;
  font-weight: 900;
}

.landingFooter {
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 22px 20px 34px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid rgba(215, 224, 236, 0.9);
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
}

.landingFooter button {
  padding: 0;
  background: transparent;
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
  text-decoration: underline;
  text-underline-offset: 3px;
}

@media (max-width: 980px) {
  .landingLayout,
  .featureGrid,
  .projectGrid,
  .flowList {
    grid-template-columns: 1fr;
  }

  .heroContent {
    padding-top: 18px;
  }

  .registerPanel {
    position: static;
    width: auto;
    max-height: none;
    overflow: visible;
  }
}

@media (max-width: 620px) {
  .landingShell {
    --landing-scroll-offset: calc(var(--safe-top) + var(--landing-header-height, 132px) + 14px);
    padding-top: calc(var(--safe-top) + var(--landing-header-height, 132px));
  }

  .headerInner {
    flex-wrap: nowrap;
    align-items: center;
    gap: 10px;
    padding: 12px;
  }

  .brand {
    width: auto;
    flex: 0 0 auto;
    justify-content: flex-start;
  }

  .headerNav {
    order: 2;
    width: 100%;
    min-width: 0;
    padding-bottom: 2px;
  }

  .headerActions {
    flex: 0 0 auto;
  }
}

@media (max-width: 620px) and (min-width: 421px) {
  .headerInner {
    flex-wrap: wrap;
  }

  .headerActions {
    width: auto;
  }
}

@media (max-width: 420px) {
  .landingShell {
    --landing-scroll-offset: calc(var(--safe-top) + var(--landing-header-height, 176px) + 12px);
    padding-top: calc(var(--safe-top) + var(--landing-header-height, 176px));
  }

  .headerInner {
    flex-wrap: wrap;
  }

  .brand,
  .headerNav,
  .headerActions {
    width: 100%;
  }

  .headerActions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .loginPopover {
    right: 12px;
    left: 12px;
    width: auto;
  }

  .landingMain {
    padding: 22px 12px 40px;
  }

  .heroContent h1 {
    line-height: 1.14;
    font-size: 24px;
  }

  .heroLead {
    margin-top: 18px;
    line-height: 1.9;
  }

  .heroActions {
    display: grid;
    grid-template-columns: 1fr;
    margin-top: 22px;
  }

  .stats {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-top: 26px;
  }

  .stats div {
    position: relative;
    overflow: hidden;
    padding: 18px 18px 16px 20px;
    border-color: rgba(185, 207, 235, 0.95);
    border-radius: 12px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 250, 255, 0.98)),
      #fff;
    box-shadow: 0 12px 28px rgba(29, 78, 137, 0.08);
  }

  .stats div::before {
    content: "";
    position: absolute;
    left: 0;
    top: 14px;
    bottom: 14px;
    width: 4px;
    border-radius: 0 999px 999px 0;
    background: linear-gradient(180deg, var(--primary), var(--primary-strong));
  }

  .stats div::after {
    content: "";
    position: absolute;
    right: -28px;
    top: -34px;
    width: 92px;
    height: 92px;
    border-radius: 999px;
    background: rgba(29, 95, 211, 0.08);
    pointer-events: none;
  }

  .stats dt {
    position: relative;
    z-index: 1;
    color: var(--primary-strong);
    font-size: 24px;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: 0;
  }

  .stats dd {
    position: relative;
    z-index: 1;
    margin-top: 8px;
    color: #4f6279;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.6;
    margin-left: 6px;
  }

  .heroVisual img,
  .visualSection img {
    aspect-ratio: 4 / 3;
  }

  .heroVisual::after {
    display: none;
  }

  .heroVisual figcaption {
    left: 10px;
    right: 10px;
    justify-content: flex-start;
  }

  .infoSection,
  .visualSection,
  .projectsSection,
  .flowSection {
    margin-top: 42px;
  }

  .sectionHead {
    margin-bottom: 22px;
  }

  .sectionHead span,
  .visualText span {
    letter-spacing: 0.04em;
  }

  .sectionHead h2 {
    margin-top: 7px;
    line-height: 1.3;
    font-size: 20px;
  }

  .featureGrid,
  .projectGrid {
    gap: 18px;
  }

  .featureGrid article,
  .projectGrid article {
    padding: 18px;
  }

  .featureGrid strong {
    display: block;
    line-height: 1.45;
  }

  .featureGrid p,
  .projectGrid p {
    margin-top: 10px;
    line-height: 1.9;
  }

  .featureGrid article {
    grid-template-columns: 42px minmax(0, 1fr);
    gap: 14px;
    padding: 14px;
    border-radius: 12px;
  }

  .featureIcon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    font-size: 20px;
    margin: auto 0;
  }

  .featureBody strong {
    line-height: 1.45;
  }

  .featureBody p {
    margin-top: 10px;
    line-height: 1.9;
    font-size: 14px;
  }

  .visualSection {
    gap: 20px;
  }

  .visualText {
    padding: 0 18px 20px;
  }

  .visualText h2 {
    margin-top: 8px;
    line-height: 1.3;
  }

  .visualText p {
    margin-top: 13px;
    line-height: 1.95;
  }

  .projectMeta {
    gap: 7px;
    margin-bottom: 14px;
  }

  .projectGrid h3 {
    line-height: 1.45;
  }

  .projectFoot {
    row-gap: 6px;
    align-items: center;
    margin-top: 18px;
    padding: 12px;
  }

  .projectFoot strong,
  .projectFoot > span {
    line-height: 1;
  }

  .skillBadges {
    gap: 7px;
    padding-top: 12px;
  }

  .flowSection {
    margin-top: 48px;
  }

  .flowSection .sectionHead {
    margin-bottom: 24px;
  }

  .flowList {
    position: relative;
    display: grid;
    grid-template-columns: 1fr;
    gap: 0;
    padding: 4px 0 4px;
    list-style: none;
  }

  .flowList::before {
    content: "";
    position: absolute;
    left: 32px;
    top: 26px;
    bottom: 26px;
    width: 2px;
    border-radius: 999px;
    background: linear-gradient(
      180deg,
      rgba(29, 95, 211, 0.95),
      rgba(29, 95, 211, 0.34)
    );
    pointer-events: none;
  }

  .flowList li {
    position: relative;
    min-width: 0;
    padding: 20px 18px 20px 70px;
    border: 1px solid rgba(185, 207, 235, 0.95);
    border-radius: 12px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 250, 255, 0.98)),
      #fff;
    box-shadow: 0 12px 28px rgba(29, 78, 137, 0.08);
    counter-increment: flow;
  }

  .flowList li + li {
    margin-top: 16px;
  }

  .flowList li::before {
    content: counter(flow);
    position: absolute;
    left: 18px;
    top: 20px;
    z-index: 1;
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border: 3px solid #fff;
    border-radius: 999px;
    background: linear-gradient(180deg, var(--primary), var(--primary-strong));
    color: #fff;
    font-size: 13px;
    font-weight: 900;
    line-height: 1;
    box-shadow:
      0 0 0 1px rgba(29, 95, 211, 0.18),
      0 8px 18px rgba(29, 95, 211, 0.24);
  }

  .flowList strong {
    display: block;
    color: #0d2749;
    font-size: 16px;
    line-height: 1.45;
  }

  .flowList p {
    margin-top: 10px;
    color: var(--muted);
    line-height: 1.9;
  }

  .registerPanel {
    padding: 16px 16px 24px 16px;
  }

  .registerGrid {
    grid-template-columns: 1fr;
  }

  .registerGrid > :nth-child(3),
  .registerGrid > :nth-last-child(2),
  .registerGrid > :last-child {
    grid-column: auto;
  }

  .landingFooter {
    padding: 18px 12px 28px;
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 620px) {
  .landingMain {
    padding: 22px 12px 40px;
  }

  .heroContent h1 {
    line-height: 1.14;
    font-size: 24px;
  }

  .heroActions {
    display: grid;
    grid-template-columns: 1fr;
    margin-top: 22px;
  }

  .stats,
  .registerGrid {
    grid-template-columns: 1fr;
  }

  .heroVisual img,
  .visualSection img {
    aspect-ratio: 4 / 3;
  }

  .heroVisual::after {
    display: none;
  }

  .registerPanel {
    padding: 16px 16px 24px 16px;
  }

  .landingFooter {
    padding: 18px 12px 28px;
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
