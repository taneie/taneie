<template>
  <div :class="$style.landingShell">
    <header :class="$style.landingHeader">
      <div :class="$style.headerInner">
        <div :class="$style.brand">
          <BrandMark />
          <span>TRYANGLE FREELANCE</span>
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
            <FormInput v-model="loginForm.email" label="メールアドレス" name="email" type="email" autocomplete="email" />
            <FormInput v-model="loginForm.password" label="パスワード" name="password" type="password" autocomplete="current-password" />
            <BaseButton type="submit" icon="user">ログイン</BaseButton>
          </form>
          <div :class="$style.demoList">
            <button type="button" @click="loginWithDemo('freelancer')">
              <strong>求職者デモ</strong>
              <span>freelancer@example.com</span>
            </button>
            <button type="button" @click="loginWithDemo('sales')">
              <strong>営業デモ</strong>
              <span>sales@tryangle.jp</span>
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
              <h1>希望条件とスキルをもとに、営業担当が最適な案件提案まで伴走します。</h1>
              <p :class="$style.heroLead">
                TRYANGLE FREELANCEは、プロフィール登録、案件検索、応募、面談調整、チャットまでを一つにつなげたマッチングシステムです。
              </p>

              <div :class="$style.heroActions">
                <button type="button" :class="$style.primaryCta" @click="scrollToRegister">無料で登録する</button>
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
              <img src="/images/lp-hero-engineer.png" alt="案件提案とチャットを管理するフリーランス向け画面のイメージ" />
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
              <h2>案件探しの手間を減らす、TRYANGLEの仕組み</h2>
            </div>
            <div :class="$style.featureGrid">
              <article>
                <strong>条件に合う案件を探しやすい</strong>
                <p>キーワード、スキル、単価、リモート、商流で絞り込み、優先案件からすぐ応募できます。</p>
              </article>
              <article>
                <strong>営業担当とのやり取りを集約</strong>
                <p>面談候補とチャットを同じ画面で管理し、応募後の調整をスムーズに進められます。</p>
              </article>
              <article>
                <strong>提案用プロフィールを整備</strong>
                <p>スキル、稼働条件、レジュメ、面談候補を段階的に登録し、提案準備を整えます。</p>
              </article>
            </div>
          </section>

          <section :class="$style.visualSection">
            <img src="/images/lp-flow-visual.png" alt="プロフィール登録、案件推薦、オンライン面談へ進む流れのイメージ" />
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
                  <strong>{{ project.rate }}</strong>
                  <span>{{ project.skills }}</span>
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
                <p>基本情報、スキル、希望条件、レジュメを登録します。</p>
              </li>
              <li>
                <strong>案件検索・応募</strong>
                <p>公開案件を確認し、条件に合う案件へ応募します。</p>
              </li>
              <li>
                <strong>面談調整</strong>
                <p>営業担当と候補日や確認事項をチャットで調整します。</p>
              </li>
            </ol>
          </section>
        </div>

        <aside id="register-panel" :class="$style.registerPanel" aria-label="新規登録フォーム">
          <div :class="$style.registerHead">
            <span>30秒で開始</span>
            <h2>無料会員登録</h2>
            <p>登録後、プロフィール入力画面へ進みます。</p>
          </div>

          <form :class="[$style.formGrid, $style.one]" @submit.prevent="submitRegister">
            <FormInput v-model="registerForm.name" label="氏名" name="name" required @update:model-value="markDirty" />
            <FormInput v-model="registerForm.email" label="メールアドレス" name="email" type="email" autocomplete="email" required @update:model-value="markDirty" />
            <FormInput v-model="registerForm.phone" label="電話番号" name="phone" @update:model-value="markDirty" />
            <FormInput v-model="registerForm.role" label="職種" name="role" placeholder="バックエンドエンジニア" @update:model-value="markDirty" />
            <FormInput v-model="registerForm.password" label="パスワード" name="password" type="password" autocomplete="new-password" required @update:model-value="markDirty" />
            <FormInput v-model="registerForm.passwordConfirm" label="パスワード確認" name="passwordConfirm" type="password" autocomplete="new-password" required @update:model-value="markDirty" />
            <label :class="$style.privacyConsent">
              <input v-model="privacyAccepted" type="checkbox" required @change="markDirty" />
              <span>
                <button type="button" @click="showPrivacyPolicy = true">プライバシーポリシー</button>
                に同意します
              </span>
            </label>
            <BaseButton type="submit" icon="user">会員登録して始める</BaseButton>
          </form>

          <p :class="$style.formNote">
            登録は求職者アカウントとして作成されます。営業側はヘッダーのログインからデモアカウントをご利用ください。
          </p>
        </aside>
      </div>
    </main>

    <footer :class="$style.landingFooter">
      <span>© 2026 TRYANGLE FREELANCE. All rights reserved.</span>
      <button type="button" @click="showPrivacyPolicy = true">プライバシーポリシー</button>
    </footer>

    <PrivacyPolicyModal :open="showPrivacyPolicy" @close="showPrivacyPolicy = false" />
    <ToastMessage />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useTryangleFreelance } from "~/composables/useTryangleFreelance";
import type { RegisterInput } from "~/composables/useTryangleFreelance";

const { login, loginWithDemo, register, markDirty, confirmDiscardChanges } = useTryangleFreelance();

const showLogin = ref(false);
const showPrivacyPolicy = ref(false);
const privacyAccepted = ref(false);

const loginForm = reactive({
  email: "freelancer@example.com",
  password: "freelance123"
});

const registerForm = reactive<RegisterInput>({
  name: "",
  email: "",
  phone: "",
  role: "",
  password: "",
  passwordConfirm: ""
});

const projects = [
  {
    title: "金融SaaSのバックエンド刷新",
    summary: "Java/Spring Bootで決済基盤を刷新。設計から実装、テストまで担当。",
    rate: "80-100万円",
    skills: "Java / Spring Boot / PostgreSQL",
    remote: "一部リモート",
    stream: "エンド直"
  },
  {
    title: "人材マッチングサービスのフロント開発",
    summary: "React/TypeScriptで候補者・営業向け画面を改善。UI実装と状態管理が中心。",
    rate: "70-90万円",
    skills: "React / TypeScript / CSS",
    remote: "フルリモート",
    stream: "1次請け"
  },
  {
    title: "製造業向けクラウド基盤構築",
    summary: "AWS/Terraformで新規クラウド環境を設計。監視、権限、CI/CD整備を含む。",
    rate: "75-95万円",
    skills: "AWS / Terraform / Linux",
    remote: "一部リモート",
    stream: "2次請け"
  }
];

function submitLogin() {
  if (!confirmDiscardChanges()) return;
  login(loginForm.email, loginForm.password);
}

function submitRegister() {
  if (!privacyAccepted.value) {
    showPrivacyPolicy.value = true;
    return;
  }
  register(registerForm);
}

function scrollToRegister() {
  document.getElementById("register-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
}
</script>

<style module>
.landingShell {
  min-height: 100vh;
  background:
    radial-gradient(circle at 8% 12%, rgba(29, 95, 211, 0.16), transparent 28%),
    linear-gradient(180deg, #f3f8ff 0%, #ffffff 46%, #f5f8fd 100%);
}

.landingHeader {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid rgba(215, 224, 236, 0.9);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(14px);
}

.headerInner {
  position: relative;
  max-width: 1180px;
  width: 100%;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 22px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #0d2749;
  font-weight: 900;
  white-space: nowrap;
}

.headerNav {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-left: auto;
}

.headerNav a {
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
}

.headerActions {
  display: flex;
  align-items: center;
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
  padding: 34px 20px 56px;
}

.landingLayout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 420px);
  gap: 28px;
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
  padding: 32px 0 0;
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
  margin: 18px 0 0;
  color: #4f6279;
  font-size: 16px;
  line-height: 1.9;
}

.heroActions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 24px;
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
  margin: 28px 0 0;
}

.stats div {
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 8px 22px rgba(29, 78, 137, 0.06);
}

.stats dt {
  color: var(--primary-strong);
  font-size: 24px;
  font-weight: 900;
}

.stats dd {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
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
  aspect-ratio: 16 / 8.5;
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
  position: sticky;
  top: 84px;
  max-height: calc(100vh - 104px);
  overflow: auto;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  box-shadow: var(--shadow);
  scrollbar-gutter: stable;
}

.registerHead {
  margin-bottom: 16px;
}

.registerHead span {
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
}

.registerHead h2 {
  margin: 4px 0 0;
  color: #10294f;
  font-size: 24px;
}

.registerHead p,
.formNote {
  margin: 7px 0 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.formGrid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.formGrid > * {
  min-width: 0;
}

.one {
  grid-template-columns: 1fr;
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

.infoSection,
.visualSection,
.projectsSection,
.flowSection {
  margin-top: 56px;
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
  background: var(--primary-weak);
  color: var(--primary);
  font-size: 12px;
  font-weight: 800;
}

.projectGrid h3 {
  margin: 0;
  color: #10294f;
  font-size: 17px;
}

.projectFoot {
  display: grid;
  gap: 4px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

.projectFoot strong {
  color: var(--primary-strong);
  font-size: 20px;
}

.projectFoot span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
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
  .headerNav {
    display: none;
  }

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
    max-height: none;
    overflow: visible;
  }
}

@media (max-width: 620px) {
  .headerInner {
    flex-wrap: wrap;
    gap: 10px;
    padding: 12px;
  }

  .brand {
    width: 100%;
  }

  .headerActions {
    width: 100%;
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

  .stats {
    grid-template-columns: 1fr;
  }

  .heroActions {
    display: grid;
    grid-template-columns: 1fr;
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

  .registerPanel {
    padding: 16px;
  }

  .visualText {
    padding: 0 16px 16px;
  }

  .landingFooter {
    padding: 18px 12px 28px;
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
