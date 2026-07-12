# 営業ユーザー追加スクリプト

`config/sales-users.config.json` に設定した内容を読み込み、DBへ `role = sales` の営業ユーザーを追加します。

`.bat` / `.sh` / OS固有の環境変数指定に依存しないよう、実行本体は Node.js の `.mjs` にしています。

## 追加ファイル

```txt
backend/scripts/add-sales-user/create-sales-users-from-config.mjs
backend/scripts/add-sales-user/config/sales-users.config.json
```

## 使い方

プロジェクトルートに上記2ファイルを配置してから実行します。

```bash
node backend/scripts/add-sales-user/create-sales-users-from-config.mjs
```

対象環境は設定ファイルの `target` で選びます。

```json
{
  "target": "local"
}
```

CLIで一時的に対象環境を上書きすることもできます。

```bash
node backend/scripts/add-sales-user/create-sales-users-from-config.mjs --target staging --dryRun
node backend/scripts/add-sales-user/create-sales-users-from-config.mjs --target staging --yes
```

## 設定ファイル

```json
{
  "target": "local",
  "dryRun": false,
  "defaults": {
    "onExisting": "fail",
    "privacyPolicyVersion": "2026-06-10"
  },
  "environments": {
    "local": {
      "enabled": true,
      "databaseUrl": "postgresql://frichy:frichy@localhost:5432/frichy?schema=public",
      "dataEncryptionKey": "",
      "privacyPolicyVersion": "2026-06-10"
    },
    "staging": {
      "enabled": true,
      "databaseUrl": "postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public",
      "dataEncryptionKey": "STAGING_DATA_ENCRYPTION_KEY_BASE64_OR_TEXT",
      "privacyPolicyVersion": "2026-06-10"
    },
    "production": {
      "enabled": false,
      "allowProductionInsert": false,
      "databaseUrl": "postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public",
      "dataEncryptionKey": "PRODUCTION_DATA_ENCRYPTION_KEY_BASE64_OR_TEXT",
      "privacyPolicyVersion": "2026-06-10"
    }
  },
  "users": [
    {
      "email": "sales2@frichy.jp",
      "name": "Frichy 営業2",
      "nameKana": "トライアングル エイギョウニ",
      "phone": "03-0000-0000",
      "password": "change-me-12chars-or-more",
      "isActive": true,
      "onExisting": "fail",
      "skipPolicyConsent": false
    }
  ]
}
```

## 環境ごとの注意

### local

`dataEncryptionKey` を空にすると、既存実装と同じローカル開発用キーを使います。

### staging

検証環境に投入する場合は、`staging.databaseUrl` と `staging.dataEncryptionKey` を実際の値に置き換えてください。

重要: `dataEncryptionKey` は検証環境の `DATA_ENCRYPTION_KEY` と同じ値にしてください。違うキーを使うと、メール検索用の `emailHash` や暗号化済みPIIが既存環境と整合しません。

検証環境への実投入は誤操作防止のため `--yes` が必要です。

```bash
node backend/scripts/add-sales-user/create-sales-users-from-config.mjs --target staging --dryRun
node backend/scripts/add-sales-user/create-sales-users-from-config.mjs --target staging --yes
```

### production

将来本番投入を許可する場合は、設定ファイルで以下を明示してください。

```json
{
  "production": {
    "enabled": true,
    "allowProductionInsert": true
  }
}
```

本番も `--yes` が必要です。

```bash
node backend/scripts/add-sales-user/create-sales-users-from-config.mjs --target production --dryRun
node backend/scripts/add-sales-user/create-sales-users-from-config.mjs --target production --yes
```

## users の項目

| 項目 | 必須 | 説明 |
|---|---:|---|
| `email` | 必須 | ログイン用メールアドレス。小文字正規化されます。 |
| `name` | 必須 | 表示名。DBには暗号化して保存されます。 |
| `password` | 必須 | 初期パスワード。12文字以上。DBには bcrypt cost 12 のハッシュで保存されます。 |
| `nameKana` | 任意 | 氏名カナ。DBには暗号化して保存されます。 |
| `phone` | 任意 | 電話番号。DBには暗号化して保存されます。 |
| `isActive` | 任意 | 未指定時は `true`。 |
| `onExisting` | 任意 | 同じメールが存在する場合の挙動。`fail` / `update` / `skip`。 |
| `skipPolicyConsent` | 任意 | `true` の場合、`privacy_policy_consents` を作成しません。 |
| `policyVersion` | 任意 | ユーザー単位で規約バージョンを上書きします。 |

## 挿入内容

既存の `backend/prisma/seed.ts` と同じ方針で保存します。

```txt
users.role = sales
users.email / name / nameKana / phone = AES-256-GCMで暗号化
users.emailHash = HMAC-SHA256
users.passwordHash = bcrypt cost 12
privacy_policy_consents = skipPolicyConsent=false の場合に作成
```

## Git管理について

`config/sales-users.config.json` にはDB接続文字列、暗号化キー、初期パスワードが入ります。運用ではGit管理しないことを推奨します。

例:

```gitignore
config/sales-users.config.json
```
