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

## 3. Docker Desktopを使わない環境構築方針

本プロジェクトでは、ローカルDBとして `docker-compose.yml` の PostgreSQL コンテナのみを使用する。Docker Desktop固有の機能には依存しないため、以下の方針で構築する。

| OS      | 推奨方針                                                                  | 備考                                                                   |
| ------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Windows | WSL2 Ubuntu 内に Docker Engine / Docker Compose Plugin / Node.js を入れる | Node.js、npm、Docker、プロジェクトファイルをすべてWSL2側に寄せる       |
| macOS   | Colima + Docker CLI + Docker Compose Plugin を使う                        | Docker Desktopを使わず、Colima上のDocker runtimeでPostgreSQLを起動する |

混在構成、たとえば「Node.jsはWindows側、DockerはWSL2側」は `localhost`、ファイル監視、権限で詰まりやすいため避ける。

## 4. Windows環境構築手順（Docker Desktop不使用）

### 4.1 前提

- Windows 11 推奨
- WSL2 有効化済み
- Ubuntu 24.04 LTS または 22.04 LTS
- 作業はすべてWSL2 Ubuntuターミナル内で実行する
- プロジェクトは `/home/<user>/projects/` 配下など、WSL2側ファイルシステムに配置する

非推奨の配置例:

```text
/mnt/c/Users/<user>/...
```

推奨の配置例:

```text
/home/<user>/projects/tryangle-freelance
```

### 4.2 WSL2 UbuntuにDocker Engineをインストール

Ubuntuターミナルで実行する。

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 4.3 Dockerサービス起動確認

WSL2でsystemdが有効な場合:

```bash
sudo systemctl status docker
sudo systemctl start docker
```

systemdが使えない場合は、WSL2の設定でsystemdを有効化するか、利用環境のルールに従ってDocker daemonを起動する。

### 4.4 sudoなしでDockerを実行できるようにする

```bash
sudo usermod -aG docker $USER
```

一度Ubuntuを終了して入り直す。

```powershell
wsl --shutdown
```

再度Ubuntuを開き、確認する。

```bash
docker run hello-world
docker compose version
```

### 4.5 Node.jsをWSL2 Ubuntuにインストール

Node.jsはLTS版を使用する。組織標準がある場合は、そのバージョンに合わせる。

`nvm` を使う例:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts
node -v
npm -v
```

### 4.6 プロジェクト配置と依存関係インストール

```bash
mkdir -p ~/projects
cd ~/projects
# ZIP展開済みディレクトリ、またはgit cloneしたディレクトリへ移動
cd tryangle-freelance

npm install
cp .env.example .env
```

### 4.7 PostgreSQL起動

```bash
docker compose up -d postgres
docker compose ps
```

### 4.8 DB初期化

```bash
npm run db:migrate
npm run db:seed
```

### 4.9 API起動

```bash
npm run api:dev
```

ヘルスチェック:

```text
http://127.0.0.1:8787/api/health
```

### 4.10 フロントエンド起動

別ターミナルでWSL2 Ubuntuを開き、同じプロジェクトディレクトリで実行する。

```bash
npm run dev
```

Windows側ブラウザで以下を開く。

```text
http://127.0.0.1:5173/
```

### 4.11 Windows環境での注意点

- Windows側のNode.jsとWSL2側のDockerを混在させない。
- プロジェクトは `/mnt/c/...` ではなくWSL2側に置く。
- `DATABASE_URL` は通常、既定値の `localhost:5432` のままでよい。
- ポート `5432`、`5173`、`8787` が既に使われている場合は停止するか、設定を変更する。
- VS Codeを使う場合は、Remote - WSL でWSL2内のプロジェクトを開く。

## 5. macOS環境構築手順（Docker Desktop不使用）

### 5.1 前提

- Homebrew導入済み
- Node.js LTSを使用
- Docker Desktopは使わない
- PostgreSQLはColima上のDocker runtimeで起動する

### 5.2 Colima / Docker CLI / Docker Composeをインストール

```bash
brew install colima docker docker-compose
```

`docker compose` が使えない場合は、Homebrewの環境によってCompose pluginのリンク状態が異なる可能性がある。以下で確認する。

```bash
docker --version
docker compose version
```

`docker compose version` が失敗する場合は、`docker-compose` コマンドの利用可否も確認する。

```bash
docker-compose version
```

本ドキュメントでは `docker compose` を前提に記載する。必要に応じて `docker compose` を `docker-compose` に読み替える。

### 5.3 Colimaを起動

```bash
colima start --runtime docker
```

確認:

```bash
docker run hello-world
docker ps
```

### 5.4 Node.jsをインストール

組織標準がなければLTS版を使用する。

`nvm` を使う例:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.zshrc
nvm install --lts
nvm use --lts
node -v
npm -v
```

Homebrewで入れる場合:

```bash
brew install node
node -v
npm -v
```

### 5.5 プロジェクト配置と依存関係インストール

```bash
cd ~/projects/tryangle-freelance
npm install
cp .env.example .env
```

### 5.6 PostgreSQL起動

```bash
docker compose up -d postgres
docker compose ps
```

### 5.7 DB初期化

```bash
npm run db:migrate
npm run db:seed
```

### 5.8 API起動

```bash
npm run api:dev
```

ヘルスチェック:

```text
http://127.0.0.1:8787/api/health
```

### 5.9 フロントエンド起動

別ターミナルで実行する。

```bash
npm run dev
```

ブラウザで以下を開く。

```text
http://127.0.0.1:5173/
```

### 5.10 macOS環境での注意点

- Colimaが停止しているとPostgreSQLコンテナも使えないため、開発前に `colima status` を確認する。
- `localhost` で疎通しない場合は `127.0.0.1` を使う。
- このプロジェクトではNuxt/Viteのsocketエラー対策として `scripts/nuxt-short-tmp.mjs` を経由するため、直接 `npx nuxt dev` ではなく `npm run dev` を使う。
- Colimaのディスク容量が不足した場合は、Colima VMのディスク設定を拡張する。

## 6. OS共通の起動順序

Docker Desktopを使わない場合も、プロジェクト自体の起動順序は同じである。

```bash
npm install
cp .env.example .env

docker compose up -d postgres
npm run db:migrate
npm run db:seed

npm run api:dev
npm run dev
```

## 7. OS共通の停止・再起動

PostgreSQLコンテナ停止:

```bash
docker compose stop postgres
```

PostgreSQLコンテナ再起動:

```bash
docker compose restart postgres
```

コンテナとネットワークを停止・削除:

```bash
docker compose down
```

DBボリュームも削除して初期化する場合:

```bash
docker compose down -v
```

`down -v` はDBデータを削除するため、必要なデータがある場合は事前にバックアップする。

## 8. 環境変数

| 変数                     |        必須 | デフォルト/例                                                                    | 説明                                  |
| ------------------------ | ----------: | -------------------------------------------------------------------------------- | ------------------------------------- |
| `DATABASE_URL`           |           ○ | `postgresql://tryangle:tryangle@localhost:5432/tryangle_freelance?schema=public` | PostgreSQL接続文字列                  |
| `API_PORT`               |           - | `8787`                                                                           | APIポート                             |
| `JWT_SECRET`             |           ○ | `replace-with-a-long-random-secret`                                              | JWT署名鍵。本番では長いランダム値必須 |
| `JWT_EXPIRES_IN`         |           - | `7d`                                                                             | JWT有効期限                           |
| `CORS_ORIGIN`            |           - | `http://127.0.0.1:5173,http://localhost:5173`                                    | CORS許可オリジン                      |
| `PRIVACY_POLICY_VERSION` |           - | `2026-06-10`                                                                     | 同意記録に保存するポリシー版          |
| `WEB_PUSH_PUBLIC_KEY`    | 通知利用時○ | 空                                                                               | VAPID公開鍵                           |
| `WEB_PUSH_PRIVATE_KEY`   | 通知利用時○ | 空                                                                               | VAPID秘密鍵                           |
| `WEB_PUSH_SUBJECT`       | 通知利用時○ | `mailto:admin@example.com`                                                       | VAPID subject                         |
| `DATA_ENCRYPTION_KEY`    |       本番○ | 空                                                                               | 個人情報暗号化鍵                      |

## 9. 暗号化鍵生成

```bash
openssl rand -base64 32
```

生成した値を `DATA_ENCRYPTION_KEY` に設定する。値を変更すると既存暗号化データを復号できなくなるため、環境ごとに固定して安全に保管する。

## 10. Web Push鍵生成

```bash
npx web-push generate-vapid-keys
```

生成値を以下に設定する。

- `WEB_PUSH_PUBLIC_KEY`
- `WEB_PUSH_PRIVATE_KEY`
- `WEB_PUSH_SUBJECT`

## 11. 確認コマンド

```bash
npm run typecheck
npm run build
npm run api:build
npm run db:generate
```

## 12. ビルド・デプロイ関連

| コマンド            | 内容                                                       |
| ------------------- | ---------------------------------------------------------- |
| `npm run build`     | Nuxtアプリをビルド                                         |
| `npm run preview`   | ビルド済みアプリをローカルプレビュー                       |
| `npm run generate`  | 静的生成                                                   |
| `npm run deploy`    | `generate` 後、`.output/public` を GitHub Pages にデプロイ |
| `npm run api:build` | バックエンドTypeScriptをコンパイル                         |
| `npm run api:start` | コンパイル済みAPIを起動                                    |

## 13. デモログイン

| ロール | メールアドレス           | パスワード     |
| ------ | ------------------------ | -------------- |
| 求職者 | `freelancer@example.com` | `freelance123` |
| 営業   | `sales@tryangle.jp`      | `sales123`     |

## 14. macOSでNuxt/Vite socketエラーが出る場合

このプロジェクトでは `scripts/nuxt-short-tmp.mjs` を経由してNuxtを起動し、`TMPDIR=/tmp` を自動設定する。直接 `npx nuxt dev` は使わず `npm run dev` を使用する。

キャッシュ削除:

```bash
rm -rf .nuxt .output node_modules/.vite
npm run dev
```

## 15. データ移行・暗号化移行

既存の平文または旧形式の個人情報を暗号化するためのスクリプトが用意されている。

```bash
npm run db:encrypt-pii
```

実行前に必ずDBバックアップを取得し、`DATA_ENCRYPTION_KEY` が正しいことを確認する。
