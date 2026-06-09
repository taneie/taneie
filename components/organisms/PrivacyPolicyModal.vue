<template>
  <Teleport to="body">
    <div v-if="open" :class="$style.overlay" role="presentation" @click.self="$emit('close')">
      <section
        :class="$style.modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-policy-title"
      >
        <header :class="$style.header">
          <div>
            <span>PRIVACY POLICY</span>
            <h2 id="privacy-policy-title">プライバシーポリシー</h2>
          </div>
          <button type="button" aria-label="プライバシーポリシーを閉じる" @click="$emit('close')">×</button>
        </header>

        <div :class="$style.body">
          <p>
            TRYANGLE FREELANCE（以下「当サービス」）は、フリーランス人材と案件のマッチングを円滑に行うため、利用者の個人情報を適切に取り扱います。
          </p>

          <section>
            <h3>1. 取得する情報</h3>
            <p>氏名、メールアドレス、電話番号、職種、スキル、希望条件、レジュメ情報、面談候補、応募・チャット履歴など、サービス提供に必要な情報を取得します。</p>
          </section>

          <section>
            <h3>2. 利用目的</h3>
            <p>案件紹介、応募管理、営業担当からの連絡、面談調整、スキルシート作成、サービス改善、不正利用の防止、問い合わせ対応のために利用します。</p>
          </section>

          <section>
            <h3>3. 第三者提供</h3>
            <p>法令に基づく場合を除き、本人の同意なく個人情報を第三者へ提供しません。案件提案に必要な範囲で、匿名化または同意済みの情報をクライアントへ共有する場合があります。</p>
          </section>

          <section>
            <h3>4. 安全管理</h3>
            <p>個人情報の漏えい、滅失、毀損を防ぐため、アクセス管理、保存情報の見直し、関係者への取り扱いルール周知など合理的な安全管理措置を講じます。</p>
          </section>

          <section>
            <h3>5. 開示・訂正・削除</h3>
            <p>利用者本人から個人情報の開示、訂正、利用停止、削除の依頼があった場合、本人確認のうえ合理的な範囲で対応します。</p>
          </section>

          <section>
            <h3>6. 改定</h3>
            <p>本ポリシーは、サービス内容や法令の変更に応じて改定することがあります。重要な変更がある場合は、当サービス上で通知します。</p>
          </section>
        </div>

        <footer :class="$style.footer">
          <BaseButton type="button" @click="$emit('close')">内容を確認しました</BaseButton>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean;
}>();

defineEmits<{
  close: [];
}>();
</script>

<style module>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(7, 24, 48, 0.48);
  backdrop-filter: blur(10px);
}

.modal {
  width: min(720px, 100%);
  max-height: min(760px, calc(100vh - 40px));
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(7, 24, 48, 0.24);
}

.header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--line);
  background: linear-gradient(180deg, #f7fbff, #fff);
}

.header span {
  color: var(--primary);
  font-size: 12px;
  font-weight: 900;
}

.header h2 {
  margin: 4px 0 0;
  color: #10294f;
  font-size: 22px;
}

.header button {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 22px;
  line-height: 1;
}

.body {
  overflow: auto;
  padding: 18px 20px;
  color: #253b5a;
  line-height: 1.75;
}

.body p {
  margin: 0;
}

.body section {
  margin-top: 16px;
}

.body h3 {
  margin: 0 0 6px;
  color: #10294f;
  font-size: 15px;
}

.footer {
  display: flex;
  justify-content: flex-end;
  padding: 14px 20px;
  border-top: 1px solid var(--line);
  background: #fff;
}

@media (max-width: 620px) {
  .overlay {
    padding: 12px;
  }

  .header,
  .body,
  .footer {
    padding-inline: 14px;
  }

  .footer {
    display: grid;
  }

  .footer button {
    width: 100%;
  }
}
</style>
