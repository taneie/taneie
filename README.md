# TRYANGLE FREELANCE

Vue + Nuxt 3 + Atomic Design 構成へ分割した修正版です。

## 起動方法

```bash
npm install
npm run dev
```

ブラウザで以下を開きます。

```txt
http://127.0.0.1:5173/
```

5173番ポートが使用中の場合、Nuxt が別ポートを表示します。

## バックエンド / DB

PostgreSQL を Docker で起動し、Prisma のマイグレーションと初期データ投入を行います。

```bash
docker compose up -d postgres
npm run db:migrate
npm run db:seed
npm run api:dev
```

API は以下で起動します。

```txt
http://127.0.0.1:8787/api/health
```

主な API は `/api/auth/register`, `/api/auth/login`, `/api/jobs`, `/api/profile/me`, `/api/applications`, `/api/meeting-requests`, `/api/messages`, `/api/alive-checks` です。
営業専用の操作は JWT の role が `sales` の場合だけ許可され、求職者専用の操作は `freelancer` の場合だけ許可されます。

接続情報を変更する場合は `.env.example` を参考に `DATABASE_URL`, `API_PORT`, `JWT_SECRET`, `CORS_ORIGIN` を設定してください。

閉じているブラウザへチャット通知を送る場合は Web Push 用の VAPID 鍵も設定します。

```bash
npx web-push generate-vapid-keys
```

生成された値を `.env` の `WEB_PUSH_PUBLIC_KEY`, `WEB_PUSH_PRIVATE_KEY` に設定してください。

## macOSで `connect EINVAL ... nuxt-vite-node-*.sock` が出る場合

macOS の標準一時ディレクトリ `/var/folders/...` のパスが長く、Nuxt/Vite が作る socket パスが長すぎると起きることがあります。
この修正版では `scripts/nuxt-short-tmp.mjs` 経由で Nuxt を起動し、`TMPDIR=/tmp` を自動設定します。

古いキャッシュが残っている場合は、以下を実行してから再起動してください。

```bash
rm -rf .nuxt .output node_modules/.vite
npm run dev
```

直接 `npx nuxt dev` や `nuxt dev` を実行すると、この対策が効かないため、必ず `npm run dev` を使ってください。

## 確認コマンド

```bash
npm run typecheck
npm run build
npm run api:build
npm run db:generate
```

## デモログイン

- 求職者: freelancer@example.com / freelance123
- 営業: sales@tryangle.jp / sales123
