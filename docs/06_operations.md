# 06. 運用・開発手順

## 1. ローカル起動

### 1.1 依存関係のインストール

```bash
npm install
```

### 1.2 フロントエンド起動

```bash
npm run dev
```

ブラウザで以下を開く。

```text
http://127.0.0.1:5173/
```

## 2. DB/API起動

### 2.1 PostgreSQL起動

```bash
docker compose up -d postgres
```

### 2.2 Prismaマイグレーション

```bash
npm run db:migrate
```

### 2.3 初期データ投入

```bash
npm run db:seed
```

### 2.4 API起動

```bash
npm run api:dev
```

ヘルスチェック:

```text
http://127.0.0.1:8787/api/health
```

## 3. 環境変数

| 変数 | 必須 | デフォルト/例 | 説明 |
|---|---:|---|---|
| `DATABASE_URL` | ○ | `postgresql://tryangle:tryangle@localhost:5432/tryangle_freelance?schema=public` | PostgreSQL接続文字列 |
| `API_PORT` | - | `8787` | APIポート |
| `JWT_SECRET` | ○ | `replace-with-a-long-random-secret` | JWT署名鍵。本番では長いランダム値必須 |
| `JWT_EXPIRES_IN` | - | `7d` | JWT有効期限 |
| `CORS_ORIGIN` | - | `http://127.0.0.1:5173,http://localhost:5173` | CORS許可オリジン |
| `PRIVACY_POLICY_VERSION` | - | `2026-06-10` | 同意記録に保存するポリシー版 |
| `WEB_PUSH_PUBLIC_KEY` | 通知利用時○ | 空 | VAPID公開鍵 |
| `WEB_PUSH_PRIVATE_KEY` | 通知利用時○ | 空 | VAPID秘密鍵 |
| `WEB_PUSH_SUBJECT` | 通知利用時○ | `mailto:admin@example.com` | VAPID subject |
| `DATA_ENCRYPTION_KEY` | 本番○ | 空 | 個人情報暗号化鍵 |

## 4. 暗号化鍵生成

```bash
openssl rand -base64 32
```

生成した値を `DATA_ENCRYPTION_KEY` に設定する。値を変更すると既存暗号化データを復号できなくなるため、環境ごとに固定して安全に保管する。

## 5. Web Push鍵生成

```bash
npx web-push generate-vapid-keys
```

生成値を以下に設定する。

- `WEB_PUSH_PUBLIC_KEY`
- `WEB_PUSH_PRIVATE_KEY`
- `WEB_PUSH_SUBJECT`

## 6. 確認コマンド

```bash
npm run typecheck
npm run build
npm run api:build
npm run db:generate
```

## 7. ビルド・デプロイ関連

| コマンド | 内容 |
|---|---|
| `npm run build` | Nuxtアプリをビルド |
| `npm run preview` | ビルド済みアプリをローカルプレビュー |
| `npm run generate` | 静的生成 |
| `npm run deploy` | `generate` 後、`.output/public` を GitHub Pages にデプロイ |
| `npm run api:build` | バックエンドTypeScriptをコンパイル |
| `npm run api:start` | コンパイル済みAPIを起動 |

## 8. デモログイン

| ロール | メールアドレス | パスワード |
|---|---|---|
| 求職者 | `freelancer@example.com` | `freelance123` |
| 営業 | `sales@tryangle.jp` | `sales123` |

## 9. macOSでNuxt/Vite socketエラーが出る場合

このプロジェクトでは `scripts/nuxt-short-tmp.mjs` を経由してNuxtを起動し、`TMPDIR=/tmp` を自動設定する。直接 `npx nuxt dev` は使わず `npm run dev` を使用する。

キャッシュ削除:

```bash
rm -rf .nuxt .output node_modules/.vite
npm run dev
```

## 10. データ移行・暗号化移行

既存の平文または旧形式の個人情報を暗号化するためのスクリプトが用意されている。

```bash
npm run db:encrypt-pii
```

実行前に必ずDBバックアップを取得し、`DATA_ENCRYPTION_KEY` が正しいことを確認する。
