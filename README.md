# TRYANGLE FREELANCE

TRYANGLE FREELANCE は、フリーランス人材・案件・応募・スカウト・面談・チャットを管理するためのWebアプリケーションです。

フロントエンドは Nuxt 3 / Vue 3、バックエンドは Express、DBは PostgreSQL + Prisma で構成されています。

---

## 主な機能

- フリーランスユーザーの登録・ログイン
- 営業ユーザーのログイン
- フリーランスプロフィール管理
- スキル・職務経歴情報の管理
- 案件一覧の表示
- 案件作成・編集
- 案件への応募
- 営業ユーザーによるスカウト
- 応募ステータス管理
- 面談候補日管理
- チャット / メッセージ管理
- 生存確認
- 問い合わせ管理
- Web Push通知用の購読情報管理

---

## システム構成

```txt
Nuxt 3 / Vue 3
  ↓
Express API
  ↓
Prisma
  ↓
PostgreSQL
```

### フロントエンド

```txt
Nuxt 3
Vue 3
TypeScript
Atomic Design 構成
```

主な配置は以下です。

```txt
app.vue
pages/
components/
  atoms/
  molecules/
  organisms/
  pages/
  templates/
composables/
src/styles.css
public/
```

### バックエンド

```txt
Express
TypeScript
Prisma
PostgreSQL
JWT認証
bcryptjs
Zod
```

主な配置は以下です。

```txt
backend/src/
  application/
  domain/
  infrastructure/
  interfaces/http/
```

### DB

```txt
PostgreSQL 16
Prisma ORM
Prisma Migrate
Prisma Seed
```

主な配置は以下です。

```txt
prisma/
  schema.prisma
  seed.ts
  migrations/
```

---

## 利用フレームワーク / ライブラリ

### Frontend

- Nuxt 3
- Vue 3
- TypeScript

### Backend

- Node.js
- Express
- TypeScript
- Zod
- CORS
- JSON Web Token
- bcryptjs
- web-push

### Database / ORM

- PostgreSQL
- Prisma
- @prisma/client
- @prisma/adapter-pg
- pg

### Development

- Docker Compose
- tsx
- vue-tsc
- Prisma CLI

---

## 必要なもの

ローカル環境では以下を使用します。

```txt
Node.js
npm
Docker
Git
```

Node.js は LTS 版の利用を推奨します。

---

## 環境変数

このプロジェクトでは `.env` を使用します。

`.env` にはDB接続情報やJWT秘密鍵などが含まれるため、ソース管理には含めません。  
リポジトリには `.env.example` を置き、各自がコピーして `.env` を作成します。


---

## Docker Compose

ローカルDBは Docker Compose で起動します。


---

## セットアップ手順: Mac

### 1. リポジトリを取得

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. 依存パッケージをインストール

```bash
npm install
```

### 3. `.env` を作成

```bash
cp .env.example .env
```

必要に応じて `.env` の値を編集します。

ローカルDBをDocker Composeで使う場合、通常は `DATABASE_URL` を変更する必要はありません。

### 4. PostgreSQLを起動

```bash
docker compose up -d postgres
```

起動状態を確認する場合は以下を実行します。

```bash
docker compose ps
```

### 5. Prisma Clientを生成

```bash
npm run db:generate
```

### 6. マイグレーションを適用

```bash
npm run db:migrate
```

### 7. 初期データを投入

```bash
npm run db:seed
```

### 8. APIサーバーを起動

```bash
npm run api:dev
```

APIは以下で起動します。

```txt
http://127.0.0.1:8787/api
```

ヘルスチェック:

```txt
http://127.0.0.1:8787/api/health
```

### 9. フロントエンドを起動

別ターミナルで以下を実行します。

```bash
npm run dev
```

ブラウザで以下を開きます。

```txt
http://127.0.0.1:5173/
```

---

## セットアップ手順: Windows

Windowsでは PowerShell の利用を想定しています。

### 1. リポジトリを取得

```powershell
git clone <repository-url>
cd <repository-directory>
```

### 2. 依存パッケージをインストール

```powershell
npm install
```

### 3. `.env` を作成

```powershell
Copy-Item .env.example .env
```

必要に応じて `.env` の値を編集します。

ローカルDBをDocker Composeで使う場合、通常は `DATABASE_URL` を変更する必要はありません。

### 4. PostgreSQLを起動

```powershell
docker compose up -d postgres
```

起動状態を確認する場合は以下を実行します。

```powershell
docker compose ps
```

### 5. Prisma Clientを生成

```powershell
npm run db:generate
```

### 6. マイグレーションを適用

```powershell
npm run db:migrate
```

### 7. 初期データを投入

```powershell
npm run db:seed
```

### 8. APIサーバーを起動

```powershell
npm run api:dev
```

APIは以下で起動します。

```txt
http://127.0.0.1:8787/api
```

ヘルスチェック:

```txt
http://127.0.0.1:8787/api/health
```

### 9. フロントエンドを起動

別のPowerShellで以下を実行します。

```powershell
npm run dev
```

ブラウザで以下を開きます。

```txt
http://127.0.0.1:5173/
```

---

## 初期データ / デモログイン

`npm run db:seed` を実行すると、開発確認用の初期データが投入されます。

デモログイン情報は以下です。

```txt
フリーランス:
  freelancer@example.com
  freelance123

営業:
  sales@tryangle.jp
  sales123
```

---

## よく使うコマンド

### フロントエンド起動

```bash
npm run dev
```

### API起動

```bash
npm run api:dev
```

### PostgreSQL起動

```bash
docker compose up -d postgres
```

### PostgreSQL停止

```bash
docker compose stop postgres
```

### Prisma Client生成

```bash
npm run db:generate
```

### マイグレーション適用

```bash
npm run db:migrate
```

### 初期データ投入

```bash
npm run db:seed
```

### 型チェック

```bash
npm run typecheck
```

### フロントエンドビルド

```bash
npm run build
```

### APIビルド

```bash
npm run api:build
```

---

## DB関連コマンドの使い分け

### `npm run db:migrate`

ローカル開発向けです。

```bash
npm run db:migrate
```

内部では Prisma の `migrate dev` を実行します。  
ローカルDBにマイグレーションを適用し、必要に応じてPrisma Clientも更新します。

### `npm run db:deploy`

既に作成済みのマイグレーションを適用します。

```bash
npm run db:deploy
```

このコマンドは、現在読み込まれている `DATABASE_URL` のDBに対して実行されます。  
ローカルで実行しても、`.env` の `DATABASE_URL` が外部DBを向いている場合は、その外部DBに適用されます。

実行前に接続先を必ず確認してください。

### `npm run db:seed`

初期データを投入します。

```bash
npm run db:seed
```

既存データの状態によっては、重複や更新が発生する可能性があります。  
ローカル開発環境での利用を想定しています。

---

## 営業ユーザーの追加

営業ユーザーを追加する場合は、管理用スクリプトを使用します。

現在のスクリプト:

```txt
scripts/create-sales-user.ts
```

実行例:

```bash
SALES_USER_PASSWORD='change-me-password' \
  npx tsx scripts/create-sales-user.ts \
    --email sales2@tryangle.jp \
    --name 'TRYANGLE 営業2'
```

Windows PowerShellの場合:

```powershell
$env:SALES_USER_PASSWORD="change-me-password"
npx tsx scripts/create-sales-user.ts --email sales2@tryangle.jp --name "TRYANGLE 営業2"
Remove-Item Env:SALES_USER_PASSWORD
```

既存ユーザーを更新する場合は `--update-existing` を付けます。

```bash
SALES_USER_PASSWORD='change-me-password' \
  npx tsx scripts/create-sales-user.ts \
    --email sales2@tryangle.jp \
    --name 'TRYANGLE 営業2' \
    --update-existing
```

---

## 個人情報の暗号化

このシステムでは、メールアドレス・氏名・電話番号などの個人情報をアプリケーション側で暗号化して保存します。


既存データの暗号化移行用スクリプト:

```bash
npm run db:encrypt-pii
```

---

## Web Push通知

Web Push通知を利用する場合は、VAPID鍵を設定します。

```env
WEB_PUSH_PUBLIC_KEY=""
WEB_PUSH_PRIVATE_KEY=""
WEB_PUSH_SUBJECT="mailto:admin@example.com"
```

VAPID鍵の生成例:

```bash
npx web-push generate-vapid-keys
```

Web Push通知を使わないローカル開発では、空文字のままでも構いません。

---

## APIエンドポイント

主なAPIは以下です。

```txt
GET  /api/health

POST /api/auth/register
POST /api/auth/login
GET  /api/bootstrap

GET  /api/profile/me
PUT  /api/profile/me

GET  /api/jobs
POST /api/jobs

GET  /api/applications
POST /api/applications

GET  /api/meeting-requests
POST /api/meeting-requests

GET  /api/messages
POST /api/messages

POST /api/alive-checks

GET  /api/contact
POST /api/contact
```

認証が必要なAPIでは、ログイン時に取得したJWTを `Authorization` ヘッダーに指定します。

```txt
Authorization: Bearer <token>
```

---

## 権限

ユーザーのロールは主に以下です。

```txt
freelancer
sales
```

### freelancer

フリーランスユーザーです。

主な操作:

```txt
プロフィール登録・更新
案件閲覧
案件応募
面談候補確認
チャット
生存確認への応答
```

### sales

営業ユーザーです。

主な操作:

```txt
案件作成
応募管理
スカウト
面談候補作成
チャット
問い合わせ対応
```

---

## Nuxt起動時の注意

このプロジェクトでは、Nuxtの起動に以下のラッパースクリプトを使用しています。

```txt
scripts/nuxt-short-tmp.mjs
```

`package.json` の `dev`, `build`, `preview`, `typecheck`, `postinstall` は、このスクリプト経由でNuxtを実行します。

macOSなどで一時ディレクトリのパスが長くなり、Nuxt/Viteのsocket作成に失敗する問題を避けるためです。

そのため、直接 `npx nuxt dev` を実行するのではなく、通常は以下を使用してください。

```bash
npm run dev
```

キャッシュ起因の問題が疑われる場合は、以下を削除してから再起動してください。

```bash
rm -rf .nuxt .output node_modules/.vite
npm run dev
```

Windows PowerShellの場合:

```powershell
Remove-Item -Recurse -Force .nuxt, .output, node_modules/.vite
npm run dev
```

---

## トラブルシューティング

### DB接続に失敗する

まずPostgreSQLコンテナが起動しているか確認してください。

```bash
docker compose ps
```

起動していない場合:

```bash
docker compose up -d postgres
```

`.env` の `DATABASE_URL` がDocker Composeの設定と一致しているか確認してください。

```env
DATABASE_URL="postgresql://tryangle:tryangle@localhost:5432/tryangle_freelance?schema=public"
```

### `5432` ポートが使われている

ローカルPCで別のPostgreSQLが起動している可能性があります。

`docker-compose.yml` を以下のように変更します。

```yaml
ports:
  - "5433:5432"
```

`.env` も合わせて変更します。

```env
DATABASE_URL="postgresql://tryangle:tryangle@localhost:5433/tryangle_freelance?schema=public"
```

### Prisma Client関連のエラーが出る

Prisma Clientを再生成してください。

```bash
npm run db:generate
```

その後、APIサーバーを再起動してください。

### マイグレーションが失敗する

まず接続先DBを確認してください。

```bash
npm run db:migrate
```

失敗したマイグレーションがDBに記録されている場合は、Prismaのエラー内容に従って対応します。

ローカルDBを作り直してもよい場合は、Dockerボリュームを削除して作り直す方法もあります。

```bash
docker compose down -v
docker compose up -d postgres
npm run db:migrate
npm run db:seed
```

この操作はローカルDBのデータを削除します。

### ログインできない

以下を確認してください。

```txt
APIサーバーを再起動しているか
ログイン先のAPIが正しいか
.env の DATABASE_URL が想定DBを向いているか
対象ユーザーの is_active が true か
パスワードが seed / スクリプトで設定した値と一致しているか
```

環境変数やDBデータを変更した後は、APIサーバーを再起動してください。

### フロントエンドからAPIに接続できない

`.env` の `NUXT_PUBLIC_API_BASE` を確認してください。

```env
NUXT_PUBLIC_API_BASE="http://127.0.0.1:8787/api"
```

バックエンド側の `CORS_ORIGIN` も確認してください。

```env
CORS_ORIGIN="http://127.0.0.1:5173,http://localhost:5173"
```

---

## ディレクトリ構成

```txt
.
├── app.vue
├── pages/
│   └── index.vue
├── components/
│   ├── atoms/
│   ├── molecules/
│   ├── organisms/
│   ├── pages/
│   └── templates/
├── composables/
│   └── useTryangleFreelance.ts
├── backend/
│   ├── src/
│   │   ├── application/
│   │   ├── domain/
│   │   ├── infrastructure/
│   │   └── interfaces/http/
│   └── tsconfig.json
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
├── scripts/
│   ├── create-sales-user.ts
│   ├── encrypt-existing-pii.ts
│   └── nuxt-short-tmp.mjs
├── src/
│   └── styles.css
├── docker-compose.yml
├── nuxt.config.ts
├── package.json
└── tsconfig.json
```

---

## 開発時の基本起動順

初回:

```bash
cp .env.example .env
npm install
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
```

起動:

```bash
npm run api:dev
```

別ターミナル:

```bash
npm run dev
```

アクセス:

```txt
http://127.0.0.1:5173/
```

APIヘルスチェック:

```txt
http://127.0.0.1:8787/api/health
```