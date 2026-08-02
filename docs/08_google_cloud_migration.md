# 08. Google Cloud + Neon 移行

## 方針

- 本番環境は Google Cloud Run + 新規Neon project を利用する。
- 現行の Vercel + Neon は開発環境として残す。
- Cloud Run では Express API と Nuxt静的成果物を同じコンテナで配信し、フロントは `/api` に接続する。
- 本番の `DATABASE_URL`、`JWT_SECRET`、`DATA_ENCRYPTION_KEY`、`CORS_ORIGIN` は Google Secret Manager で管理する。

## 追加された構成

| ファイル | 用途 |
| -------- | ---- |
| `Dockerfile` | Cloud Run用コンテナをビルドする |
| `cloudbuild.yaml` | Artifact RegistryへのpushとCloud Run deployを行う |
| `.dockerignore` | Docker build contextから不要ファイルを除外する |
| `.gcloudignore` | Cloud Build送信対象から不要ファイルを除外する |

## 初回に必要な情報

| 項目 | 例 |
| ---- | -- |
| Google Cloud project ID | `frichy-prod` |
| Cloud Run region | `asia-northeast1` |
| Cloud Run service name | `frichy` |
| Artifact Registry repository | `frichy` |
| 本番URLまたはカスタムドメイン | `https://app.example.com` |
| 新Neon projectの接続文字列 | `postgresql://...?...sslmode=require` |
| `JWT_SECRET` | 32文字以上のランダム文字列 |
| `DATA_ENCRYPTION_KEY` | 個人情報暗号化用の固定秘密値 |
| レジュメ保存先 | 当面Vercel Blob継続、またはGoogle Cloud Storageへ移行 |

## Google Cloud側の準備

Artifact Registry repositoryを作成する。

```bash
gcloud artifacts repositories create frichy \
  --repository-format=docker \
  --location=asia-northeast1
```

Secret Managerに本番値を登録する。

```bash
printf '%s' '<NEON_PROD_DATABASE_URL>' | gcloud secrets create frichy-prod-database-url --data-file=-
printf '%s' '<JWT_SECRET>' | gcloud secrets create frichy-prod-jwt-secret --data-file=-
printf '%s' '<DATA_ENCRYPTION_KEY>' | gcloud secrets create frichy-prod-data-encryption-key --data-file=-
printf '%s' 'https://<production-domain-or-cloud-run-url>' | gcloud secrets create frichy-prod-cors-origin --data-file=-
```

Cloud Build / Cloud Runのサービスアカウントには、Artifact Registry書き込み、Cloud Runデプロイ、Secret Manager Secret Accessorの権限が必要。

## DB初期化

新Neon projectの接続文字列を `DATABASE_URL` に指定して、Prisma migrationを適用する。

```bash
DATABASE_URL='<NEON_PROD_DATABASE_URL>' npm run db:deploy
```

デモデータを本番へ入れる場合のみ seed を実行する。通常の本番では実行しない。

```bash
DATABASE_URL='<NEON_PROD_DATABASE_URL>' npm run db:seed
```

営業ユーザーだけ作る場合は `backend/scripts/add-sales-user/README.md` を参照する。

## デプロイ

標準値のままデプロイする。

```bash
gcloud builds submit --config cloudbuild.yaml
```

region、service名、Artifact Registry repositoryを変える場合は substitutions を指定する。

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions _REGION=asia-northeast1,_SERVICE=frichy,_REPOSITORY=frichy,_IMAGE=web
```

## 環境の分離

| 環境 | フロント | API | DB | デモログイン |
| ---- | -------- | --- | -- | ------------ |
| Production | Cloud Run | Cloud Run | 新Neon project | `false` |
| Development | 現行Vercel | 現行Dev API | 既存Neon project | 必要に応じて `true` |
| Local | Nuxt dev server | Express dev server | Docker PostgreSQLまたはDev Neon | 任意 |

Vercel側の `vercel.json` は残す。現行Vercel projectは開発環境として、既存Neon Dev DBの `DATABASE_URL` を使い続ける。

## 注意点

- `cloudbuild.yaml` は Secret Manager の secret名を前提にしている。異なる名前にする場合は substitutions の `_DATABASE_URL_SECRET` などを変更する。
- `CORS_ORIGIN` は本番URLが決まった後に更新する。
- 現状のレジュメアップロードは Vercel Blob を利用している。完全にGoogle Cloudへ寄せる場合は、Google Cloud Storage用のアップロード・署名付き閲覧実装へ差し替える。
