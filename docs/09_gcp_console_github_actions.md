# 09. GCPコンソール設定 + GitHub Actionsデプロイ手順

## 目的

Google Cloud Run + 新規Neon projectを本番環境として構築し、GitHub Actionsからコンテナをビルド・Artifact Registryへpush・Cloud Runへデプロイする。

現行のVercel + Neon環境は開発環境として残す。Vercel側の設定や既存Neon接続情報は変更しない。

## 推奨構成

| 項目 | 推奨値 |
| ---- | ------ |
| Hosting/API | Cloud Run |
| Container registry | Artifact Registry |
| Database | 新規Neon project |
| Secret管理 | Google Secret Manager |
| CI/CD | GitHub Actions |
| GitHub Actions認証 | Workload Identity Federation |
| Cloud Run ingress | まずはall、独自ドメイン設定後に必要に応じて見直し |
| Cloud Run runtime service account | `frichy-cloud-run-runtime` |
| GitHub Actions deploy service account | `frichy-github-deployer` |

## 事前に決める値

| 変数 | 例 | 用途 |
| ---- | -- | ---- |
| `PROJECT_ID` | `frichy-prod` | Google Cloud project ID |
| `PROJECT_NUMBER` | `123456789012` | Workload Identity Provider名に必要 |
| `REGION` | `asia-northeast1` | Cloud Run / Artifact Registry region |
| `SERVICE` | `frichy` | Cloud Run service名 |
| `REPOSITORY` | `frichy` | Artifact Registry repository名 |
| `IMAGE_NAME` | `web` | Artifact Registry内のimage名 |
| `GITHUB_REPO` | `owner/repo` | GitHub repository |
| `PRODUCTION_URL` | `https://app.example.com` | CORSとカスタムドメインに使う |
| `NEON_DATABASE_URL` | `postgresql://...?...sslmode=require` | 新Neon projectの接続文字列 |

## GCPコンソール手順

### 1. Projectを選択

Google Cloud Consoleで作成済みの本番projectを選択する。

### 2. Billingを有効化

`お支払い` からBilling accountを紐づける。

Cloud Run、Artifact Registry、Secret Managerを使うため、Billingが有効である必要がある。

### 3. APIを有効化

`APIとサービス` -> `ライブラリ` から以下を有効化する。

| API | 用途 |
| --- | ---- |
| Cloud Run Admin API | Cloud Run serviceの作成・更新 |
| Artifact Registry API | Docker imageの保存 |
| Secret Manager API | 本番環境変数のSecret管理 |
| IAM Service Account Credentials API | GitHub Actionsからservice accountをimpersonate |
| Security Token Service API | GitHub OIDC / Workload Identity Federation |
| IAM API | Workload Identity Pool / IAM操作 |

### 4. Artifact Registryを作成

`Artifact Registry` -> `リポジトリを作成`。

| 設定 | 値 |
| ---- | -- |
| 名前 | `frichy` |
| 形式 | Docker |
| モード | 標準 |
| リージョン | `asia-northeast1` |

作成後のimage URIは次の形になる。

```text
asia-northeast1-docker.pkg.dev/<PROJECT_ID>/frichy/web:<GITHUB_SHA>
```

### 5. Service Accountを作成

`IAMと管理` -> `サービスアカウント` から2つ作成する。

| service account | 用途 |
| --------------- | ---- |
| `frichy-github-deployer` | GitHub Actionsがデプロイ時にimpersonateする |
| `frichy-cloud-run-runtime` | Cloud Runの実行時service account |

### 6. GitHub Actions deploy service accountへ権限付与

`frichy-github-deployer` に以下を付与する。

| 権限 | 範囲 |
| ---- | ---- |
| Cloud Run Developer | project |
| Artifact Registry Writer | `frichy` repository |
| Service Account User | `frichy-cloud-run-runtime` service account |

Secret値はCloud Run runtime側で読むため、原則としてdeploy service accountへSecret Accessorは付与しない。
デプロイ時にSecret参照の検証で失敗する場合のみ、対象Secretに限定してSecret Manager Secret Accessorを追加する。

### 7. Cloud Run runtime service accountへ権限付与

`frichy-cloud-run-runtime` に、後で作成するSecretごとに `Secret Manager Secret Accessor` を付与する。

対象Secret:

- `frichy-prod-database-url`
- `frichy-prod-jwt-secret`
- `frichy-prod-data-encryption-key`
- `frichy-prod-cors-origin`

Vercel Blobを本番でも継続する場合は、追加で以下もSecret化する。

- `frichy-prod-blob-read-write-token`
- `frichy-prod-blob-upload-callback-url`

### 8. Secret Managerに本番値を登録

`Security` -> `Secret Manager` -> `シークレットを作成`。

| Secret名 | 値 |
| -------- | -- |
| `frichy-prod-database-url` | 新Neon projectの `DATABASE_URL` |
| `frichy-prod-jwt-secret` | 32文字以上のランダム値 |
| `frichy-prod-data-encryption-key` | 個人情報暗号化用の固定秘密値 |
| `frichy-prod-cors-origin` | 本番URL。例: `https://app.example.com` |

初回Cloud Run URLだけで確認する場合、`frichy-prod-cors-origin` は一度Cloud Run URLで作成し、独自ドメイン設定後にSecretの新バージョンとして本番ドメインへ更新する。

### 9. Workload Identity Federationを作成

`IAMと管理` -> `Workload Identity Federation`。

1. `プールを作成`
2. Pool ID: `github`
3. Providerを追加
4. Provider type: OpenID Connect
5. Provider ID: `github`
6. Issuer URL:

```text
https://token.actions.githubusercontent.com
```

属性マッピング:

```text
google.subject=assertion.sub
attribute.repository=assertion.repository
attribute.ref=assertion.ref
```

属性条件:

```text
assertion.repository == '<GITHUB_REPO>' && assertion.ref == 'refs/heads/main'
```

作成後、Provider resource nameを控える。

```text
projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github/providers/github
```

### 10. Workload Identity Userを付与

`frichy-github-deployer` の `権限` から、GitHub repositoryに対して `Workload Identity User` を付与する。

Principal:

```text
principalSet://iam.googleapis.com/projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github/attribute.repository/<GITHUB_REPO>
```

Role:

```text
Workload Identity User
```

## GitHub側の設定

GitHub repositoryの `Settings` -> `Secrets and variables` -> `Actions` -> `Variables` に以下を設定する。

| Variable | 例 |
| -------- | -- |
| `GCP_PROJECT_ID` | `frichy-prod` |
| `GCP_REGION` | `asia-northeast1` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/github/providers/github` |
| `GCP_DEPLOY_SERVICE_ACCOUNT` | `frichy-github-deployer@<PROJECT_ID>.iam.gserviceaccount.com` |
| `GAR_REPOSITORY` | `frichy` |
| `IMAGE_NAME` | `web` |
| `CLOUD_RUN_SERVICE` | `frichy` |
| `CLOUD_RUN_RUNTIME_SERVICE_ACCOUNT` | `frichy-cloud-run-runtime@<PROJECT_ID>.iam.gserviceaccount.com` |
| `NUXT_PUBLIC_API_BASE` | `/api` |
| `NUXT_PUBLIC_SHOW_DEMO_LOGIN` | `false` |
| `SECRET_DATABASE_URL` | `frichy-prod-database-url` |
| `SECRET_JWT_SECRET` | `frichy-prod-jwt-secret` |
| `SECRET_DATA_ENCRYPTION_KEY` | `frichy-prod-data-encryption-key` |
| `SECRET_CORS_ORIGIN` | `frichy-prod-cors-origin` |

GitHub SecretsにはGCPの秘密値を置かない。秘密値はGCP Secret Managerに保存する。

## 追加済みGitHub Actions

以下のworkflowを追加済み。

```text
.github/workflows/deploy-cloud-run.yml
.github/workflows/push-artifact-registry.yml
```

`deploy-cloud-run.yml` は以下を行う。

1. GitHub OIDCでGCPへ認証
2. Docker imageをbuild
3. Artifact Registryへpush
4. Cloud Runへdeploy

`main` branchへのpush、またはGitHub Actions画面からの手動実行で動く。

`push-artifact-registry.yml` はArtifact Registryへのimage pushだけを行う。Cloud Runへはdeployしない。

初回にimageだけpushする場合:

1. GitHub repositoryの `Actions` を開く
2. `Push Artifact Registry Image` を選択
3. `Run workflow` を押す
4. `image_tag` に任意のタグを指定する。未指定ならcommit SHAを使う
5. `push_latest` は必要な場合だけ `true` にする

push後のimage URI:

```text
asia-northeast1-docker.pkg.dev/<PROJECT_ID>/frichy/web:<TAG>
```

## Neon初期化

新Neon projectを作成し、接続文字列に `sslmode=require` が含まれていることを確認する。

初回のみ、ローカルまたは管理用CIからmigrationを適用する。

```bash
DATABASE_URL='<NEON_DATABASE_URL>' npm run db:deploy
```

本番にデモデータを入れない場合、`npm run db:seed` は実行しない。

営業ユーザーだけ作る場合:

```bash
DATABASE_URL='<NEON_DATABASE_URL>' \
DATA_ENCRYPTION_KEY='<PROD_DATA_ENCRYPTION_KEY>' \
node backend/scripts/add-sales-user/create-sales-users-from-config.mjs --target production --dryRun
```

問題なければ `--yes` を付けて実行する。

## 初回デプロイ後の確認

Cloud Run URLが発行されたら以下を確認する。

```text
https://<cloud-run-url>/api/health
```

期待値:

```json
{"status":"ok","service":"Frichy API"}
```

画面で確認する内容:

- ログイン画面が表示される
- デモログイン入口が本番で非表示
- 登録/ログインAPIが通る
- DBが新Neon projectを向いている
- CORSエラーが出ない

## 独自ドメイン設定

Cloud Runの `カスタムドメイン` から本番ドメインを割り当てる。

DNS反映後、Secret Managerの `frichy-prod-cors-origin` に本番ドメインを新バージョンとして追加し、GitHub Actionsを再実行する。

## レジュメ保存について

現状の実装はVercel Blobを利用している。

選択肢:

| 方針 | 内容 |
| ---- | ---- |
| 当面継続 | Cloud Runにも `BLOB_READ_WRITE_TOKEN` をSecretとして渡し、Vercel Blobを使い続ける |
| GCSへ移行 | Google Cloud Storage用の署名付きアップロード/閲覧実装へ差し替える |

Google Cloudへ完全移行するならGCS移行が自然。ただし実装変更が必要なので、初回移行ではVercel Blob継続でもよい。

## 参考

- Google Cloud Run deploy docs: https://docs.cloud.google.com/run/docs/deploying
- Google Workload Identity Federation docs: https://docs.cloud.google.com/iam/docs/workload-identity-federation
- google-github-actions/auth: https://github.com/google-github-actions/auth
