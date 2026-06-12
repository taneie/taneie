<template>
  <div :class="$style.landingShell">
    <header :class="$style.landingHeader">
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
          <button
            type="button"
            :class="$style.loginTrigger"
            @click="showLogin = !showLogin"
          >
            ログイン
          </button>
          <button
            type="button"
            :class="$style.headerCta"
            @click="scrollToRegister"
          >
            無料登録
          </button>
        </div>

        <div v-if="showLogin" :class="$style.loginPopover">
          <div :class="$style.popoverHead">
            <strong>ログイン</strong>
            <button
              type="button"
              aria-label="ログインを閉じる"
              @click="showLogin = false"
            >
              ×
            </button>
          </div>

          <form
            :class="[$style.formGrid, $style.one]"
            @submit.prevent="submitLogin"
          >
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
              <p :class="$style.eyebrow">
                フリーランスエンジニア向け案件マッチング
              </p>
              <h1>
                希望条件とスキルをもとに、営業担当が最適な案件提案まで伴走します。
              </h1>
              <p :class="$style.heroLead">
                TRYANGLE
                FREELANCEは、プロフィール登録、案件検索、応募、面談調整、チャットまでを一つにつなげたマッチングシステムです。
              </p>

              <div :class="$style.heroActions">
                <button
                  type="button"
                  :class="$style.primaryCta"
                  @click="scrollToRegister"
                >
                  無料で登録する
                </button>
                <a href="#projects" :class="$style.secondaryCta"
                  >案件例を見る</a
                >
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
                src="/images/lp-hero-engineer.png"
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
              <h2>案件探しの手間を減らす、TRYANGLEの仕組み</h2>
            </div>

            <div :class="$style.featureGrid">
              <article>
                <strong>条件に合う案件を探しやすい</strong>
                <p>
                  キーワード、スキル、単価、リモート、商流で絞り込み、優先案件からすぐ応募できます。
                </p>
              </article>
              <article>
                <strong>営業担当とのやり取りを集約</strong>
                <p>
                  面談候補とチャットを同じ画面で管理し、応募後の調整をスムーズに進められます。
                </p>
              </article>
              <article>
                <strong>提案用プロフィールを整備</strong>
                <p>
                  スキル、稼働条件、レジュメ、面談候補を段階的に登録し、提案準備を整えます。
                </p>
              </article>
            </div>
          </section>

          <section :class="$style.visualSection">
            <img
              src="/images/lp-flow-visual.png"
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
                  <strong>{{ project.rate }}</strong>
                  <span>{{ project.skills }}</span>
                </div>
              </article>
            </div>
          </section>

          <section id="flow" :class="$style.flowSection">
            <div :class="$style.sectionHead">
              <span>FLOW</span>
              <h2>登録から案件参画までの流れ</h2>
            </div>

            <ol :class="$style.flowList">
              <li>
                <strong>プロフィール登録</strong>
                <p>スキル、希望単価、稼働条件、レジュメを登録します。</p>
              </li>
              <li>
                <strong>案件検索・応募</strong>
                <p>条件に合う案件を確認し、興味のある案件へ応募します。</p>
              </li>
              <li>
                <strong>営業担当と調整</strong>
                <p>
                  チャットや面談候補を使いながら、商談までの調整を進めます。
                </p>
              </li>
            </ol>
          </section>
        </div>

        <aside :class="$style.registerColumn">
          <section ref="registerCardRef" :class="$style.registerCard">
            <div :class="$style.registerHead">
              <span>FREE ENTRY</span>
              <h2>無料登録</h2>
              <p>
                デモ環境では、登録後すぐに案件検索や応募機能を確認できます。
              </p>
            </div>

            <AuthTabs :mode="activeTab" @change="activeTab = $event" />

            <form
              v-if="activeTab === 'register'"
              :class="$style.formStack"
              @submit.prevent="submitRegister"
            >
              <FormInput
                v-model="registerForm.name"
                label="氏名"
                name="register-name"
                autocomplete="name"
              />

              <FormInput
                v-model="registerForm.email"
                label="メールアドレス"
                name="register-email"
                type="email"
                autocomplete="email"
              />

              <FormInput
                v-model="registerForm.phone"
                label="電話番号"
                name="register-phone"
                type="tel"
                autocomplete="tel"
              />

              <FormSelect
                v-model="registerForm.role"
                label="利用区分"
                name="register-role"
                :options="roleOptions"
              />

              <FormInput
                v-model="registerForm.password"
                label="パスワード"
                name="register-password"
                type="password"
                autocomplete="new-password"
              />

              <FormInput
                v-model="registerForm.passwordConfirm"
                label="パスワード確認"
                name="register-password-confirm"
                type="password"
                autocomplete="new-password"
              />

              <label :class="$style.checkbox">
                <input v-model="registerForm.privacyAccepted" type="checkbox" />
                <span>
                  <button
                    type="button"
                    :class="$style.policyButton"
                    @click="showPolicy = true"
                  >
                    個人情報の取り扱い
                  </button>
                  に同意する
                </span>
              </label>

              <BaseButton type="submit" icon="user">登録して始める</BaseButton>
            </form>

            <form
              v-else
              :class="$style.formStack"
              @submit.prevent="submitLogin"
            >
              <FormInput
                v-model="loginForm.email"
                label="メールアドレス"
                name="aside-login-email"
                type="email"
                autocomplete="email"
              />

              <FormInput
                v-model="loginForm.password"
                label="パスワード"
                name="aside-login-password"
                type="password"
                autocomplete="current-password"
              />

              <BaseButton type="submit" icon="user">ログイン</BaseButton>

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
            </form>
          </section>
        </aside>
      </div>
    </main>

    <footer :class="$style.footer">
      <span>© 2026 TRYANGLE FREELANCE. All rights reserved.</span>
      <button type="button" @click="showPolicy = true">
        個人情報の取り扱い
      </button>
    </footer>

    <PrivacyPolicyModal :open="showPolicy" @close="showPolicy = false" />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useTryangleFreelance } from "~/composables/useTryangleFreelance";
import type {
  AuthMode,
  RegisterInput,
} from "~/composables/useTryangleFreelance";

type UserRole = "freelancer" | "sales";

const { login, register } = useTryangleFreelance();

const showLogin = ref(false);
const showPolicy = ref(false);
const activeTab = ref<AuthMode>("register");
const registerCardRef = ref<HTMLElement | null>(null);

const loginForm = reactive({
  email: "",
  password: "",
});

const registerForm = reactive<RegisterInput & { privacyAccepted: boolean }>({
  name: "",
  email: "",
  phone: "",
  role: "freelancer",
  password: "",
  passwordConfirm: "",
  privacyAccepted: false,
});

const roleOptions = ["freelancer", "sales"];

const projects = [
  {
    remote: "フルリモート",
    stream: "一次請け",
    title: "FinTech SaaS フロントエンド刷新",
    summary: "Nuxt / TypeScript を使った管理画面の再設計と実装を担当します。",
    rate: "月80〜95万円",
    skills: "Nuxt, Vue, TypeScript",
  },
  {
    remote: "週3リモート",
    stream: "エンド直",
    title: "生成AI活用業務システム開発",
    summary:
      "社内ナレッジ検索とチャットUIを組み合わせた新規プロダクト開発です。",
    rate: "月90〜110万円",
    skills: "Node.js, PostgreSQL, AWS",
  },
  {
    remote: "ハイブリッド",
    stream: "上場企業",
    title: "EC基盤バックエンド改善",
    summary: "API性能改善、DB設計、運用監視の改善まで幅広く関わります。",
    rate: "月75〜90万円",
    skills: "Express, Prisma, PostgreSQL",
  },
];

const submitLogin = () => {
  login(loginForm.email, loginForm.password);
};

const submitRegister = async () => {
  if (!registerForm.privacyAccepted) {
    showPolicy.value = true;
    return;
  }

  await register({
    name: registerForm.name,
    email: registerForm.email,
    phone: registerForm.phone,
    role: registerForm.role,
    password: registerForm.password,
    passwordConfirm: registerForm.passwordConfirm,
  });
};

const loginWithDemo = (role: UserRole) => {
  const demo =
    role === "sales"
      ? { email: "sales@tryangle.jp", password: "sales123" }
      : { email: "freelancer@example.com", password: "freelance123" };

  loginForm.email = demo.email;
  loginForm.password = demo.password;
  submitLogin();
};

const scrollToRegister = () => {
  registerCardRef.value?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
};
</script>

<style module>
.landingShell {
  min-height: 100vh;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: clip;
}

.landingHeader {
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  max-width: 100%;
  background: rgba(255, 255, 255, 0.92);
  border-bottom: 1px solid rgba(215, 224, 236, 0.8);
  backdrop-filter: blur(18px);
}

.headerInner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 24px;
  width: min(1180px, calc(100% - 32px));
  max-width: 100%;
  min-width: 0;
  margin: 0 auto;
  padding: 14px 0;
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
  flex: 1 1 auto;
  min-width: 0;
  gap: 8px;
}

.headerNav a {
  color: var(--muted);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.headerActions {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 8px;
}

.headerCta,
.loginTrigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 999px;
  font-weight: 800;
  white-space: nowrap;
}

.loginTrigger {
  background: transparent;
  color: var(--primary);
}

.headerCta {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 12px 24px rgba(29, 95, 211, 0.18);
}

.loginPopover {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 100;
  width: min(360px, calc(100vw - 24px));
  max-width: calc(100vw - 24px);
  padding: 16px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: var(--shadow);
}

.popoverHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.popoverHead button {
  width: 32px;
  height: 32px;
  background: var(--soft);
  border-radius: 50%;
  color: var(--muted);
  font-size: 20px;
}

.landingMain {
  width: 100%;
  max-width: 100%;
  padding: 34px 16px 48px;
}

.landingLayout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 390px);
  align-items: start;
  gap: 24px;
  width: min(1180px, 100%);
  max-width: 100%;
  min-width: 0;
  margin: 0 auto;
}

.contentColumn,
.registerColumn {
  min-width: 0;
  max-width: 100%;
}

.registerColumn {
  position: sticky;
  top: 92px;
}

.heroSection,
.infoSection,
.visualSection,
.projectsSection,
.flowSection,
.registerCard {
  min-width: 0;
  max-width: 100%;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 24px;
  box-shadow: var(--shadow);
}

.heroSection {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(260px, 0.9fr);
  gap: 24px;
  padding: clamp(24px, 4vw, 48px);
  overflow: hidden;
}

.heroContent,
.heroVisual,
.visualText {
  min-width: 0;
  max-width: 100%;
}

.eyebrow,
.sectionHead span,
.registerHead span,
.visualText span {
  display: inline-flex;
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.14em;
}

.heroContent h1,
.sectionHead h2,
.visualText h2,
.registerHead h2 {
  overflow-wrap: anywhere;
}

.heroContent h1 {
  margin: 14px 0 18px;
  font-size: clamp(32px, 5vw, 58px);
  line-height: 1.08;
  letter-spacing: -0.05em;
}

.heroLead {
  margin: 0;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.9;
  overflow-wrap: anywhere;
}

.heroActions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.primaryCta,
.secondaryCta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  min-height: 48px;
  padding: 0 20px;
  border-radius: 999px;
  font-weight: 900;
  text-decoration: none;
  white-space: normal;
  text-align: center;
}

.primaryCta {
  background: var(--primary);
  color: #fff;
}

.secondaryCta {
  background: var(--primary-weak);
  color: var(--primary-strong);
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 28px 0 0;
}

.stats div {
  min-width: 0;
  padding: 14px;
  background: var(--primary-soft);
  border-radius: 18px;
}

.stats dt {
  color: var(--primary);
  font-size: 20px;
  font-weight: 900;
}

.stats dd {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.heroVisual {
  display: grid;
  align-content: center;
}

.heroVisual img,
.visualSection img {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  border-radius: 22px;
}

.heroVisual figcaption {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.heroVisual figcaption span {
  min-width: 0;
  padding: 7px 10px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.infoSection,
.projectsSection,
.flowSection,
.registerCard {
  margin-top: 22px;
  padding: 24px;
}

.sectionHead h2,
.registerHead h2,
.visualText h2 {
  margin: 8px 0 0;
  font-size: clamp(24px, 3vw, 34px);
  line-height: 1.25;
  letter-spacing: -0.04em;
}

.featureGrid,
.projectGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.featureGrid article,
.projectGrid article,
.flowList li {
  min-width: 0;
  padding: 18px;
  background: var(--soft);
  border-radius: 18px;
}

.featureGrid strong,
.projectGrid h3,
.flowList strong {
  overflow-wrap: anywhere;
}

.featureGrid p,
.projectGrid p,
.flowList p,
.projectFoot span {
  color: var(--muted);
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.visualSection {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
  gap: 24px;
  margin-top: 22px;
  padding: 24px;
}

.projectMeta,
.projectFoot {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.projectMeta span {
  padding: 6px 9px;
  background: var(--cyan-weak);
  border-radius: 999px;
  color: var(--cyan);
  font-size: 12px;
  font-weight: 800;
}

.projectFoot {
  align-items: center;
  justify-content: space-between;
}

.projectFoot strong {
  color: var(--primary);
}

.flowList {
  display: grid;
  gap: 12px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}

.registerCard {
  margin-top: 0;
}

.registerHead p {
  color: var(--muted);
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.formStack,
.formGrid {
  display: grid;
  min-width: 0;
  gap: 14px;
  margin-top: 16px;
}

.formGrid.one {
  grid-template-columns: minmax(0, 1fr);
}

.checkbox {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.checkbox span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.policyButton {
  padding: 0;
  background: transparent;
  color: var(--primary);
  font-weight: 800;
  text-decoration: underline;
}

.demoList {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.demoList button {
  display: grid;
  justify-items: start;
  min-width: 0;
  padding: 12px;
  background: var(--primary-soft);
  border: 1px solid var(--line);
  border-radius: 14px;
  color: var(--ink);
  text-align: left;
}

.demoList span {
  color: var(--muted);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  padding: 24px 16px 36px;
  color: var(--muted);
  font-size: 13px;
  text-align: center;
}

.footer button {
  background: transparent;
  color: var(--primary);
  font-weight: 800;
}

@media (max-width: 1040px) {
  .landingLayout {
    grid-template-columns: minmax(0, 1fr);
  }

  .registerColumn {
    position: static;
  }

  .heroSection,
  .visualSection {
    grid-template-columns: minmax(0, 1fr);
  }

  .featureGrid,
  .projectGrid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 760px) {
  .landingHeader {
    position: static;
  }

  .headerInner {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    width: calc(100% - 24px);
    padding: 12px 0;
  }

  .brand {
    grid-column: 1 / 2;
    justify-content: flex-start;
  }

  .headerActions {
    grid-column: 2 / 3;
    justify-content: flex-end;
  }

  .headerNav {
    grid-column: 1 / -1;
    order: 3;
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 2px;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .headerNav::-webkit-scrollbar {
    display: none;
  }

  .loginPopover {
    top: calc(100% + 8px);
    right: 0;
  }

  .headerCta,
  .loginTrigger {
    min-height: 36px;
    padding: 0 12px;
    font-size: 13px;
  }

  .landingMain {
    padding: 18px 12px 36px;
  }

  .heroSection,
  .infoSection,
  .visualSection,
  .projectsSection,
  .flowSection,
  .registerCard {
    border-radius: 18px;
  }

  .heroSection {
    padding: 22px;
  }

  .stats {
    grid-template-columns: minmax(0, 1fr);
  }

  .infoSection,
  .projectsSection,
  .flowSection,
  .registerCard,
  .visualSection {
    padding: 18px;
  }
}

@media (max-width: 420px) {
  .headerInner {
    grid-template-columns: minmax(0, 1fr);
  }

  .headerActions {
    grid-column: 1 / -1;
    justify-content: stretch;
  }

  .headerActions button {
    flex: 1 1 0;
  }

  .loginPopover {
    left: 0;
    right: auto;
    width: 100%;
    max-width: 100%;
  }

  .heroSection {
    padding: 18px;
  }

  .primaryCta,
  .secondaryCta {
    width: 100%;
  }
}
</style>
