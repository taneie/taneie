# メール送信設定手順（さくらSMTP）

Frichy の生存確認メールは、さくらのSMTPサーバーから送信する。
Resend API keyやResend用DNSレコードは使わない。

## 1. アプリ側の設定

### 1.1 必要な値

| 変数 | 値 | 備考 |
| ---- | -- | ---- |
| `SMTP_HOST` | `<initial-domain>.sakura.ne.jp` | さくらの初期ドメイン。独自ドメインのメールでもSMTPサーバーは初期ドメインを使う |
| `SMTP_PORT` | `587` | STARTTLS。465を使う場合は `SMTP_SECURE=true` |
| `SMTP_SECURE` | `false` | 587は `false`、465は `true` |
| `SMTP_USER` | `noreply@frichy.jp` | さくらで作成したメールアドレス |
| `SMTP_PASSWORD` | メールアドレスのパスワード | Secret Managerで管理し、GitHubには保存しない |
| `EMAIL_FROM` | `Frichy <noreply@frichy.jp>` | 送信元表示 |
| `EMAIL_REPLY_TO` | `sales@frichy.jp` | 返信先。任意だが受信可能なアドレスにする |

### 1.2 ローカル `.env`

ローカルで送信確認する場合は `.env` に設定する。

```env
SMTP_HOST="example.sakura.ne.jp"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="noreply@frichy.jp"
SMTP_PASSWORD="<mail-password>"
EMAIL_FROM="Frichy <noreply@frichy.jp>"
EMAIL_REPLY_TO="sales@frichy.jp"
APP_PUBLIC_URL="http://127.0.0.1:5173"
```

設定後、APIを再起動する。

```bash
npm run api:dev
```

### 1.3 Secret Manager

本番の `SMTP_PASSWORD` は Secret Manager に保存する。

```bash
gcloud secrets create frichy-prod-smtp-password \
  --project frichy \
  --replication-policy=automatic

printf "%s" "<mail-password>" | gcloud secrets versions add frichy-prod-smtp-password \
  --project frichy \
  --data-file=-
```

Cloud Run runtime service accountにsecret参照権限を付与する。

```bash
gcloud secrets add-iam-policy-binding frichy-prod-smtp-password \
  --project frichy \
  --member serviceAccount:frichy-cloud-run-runtime@frichy.iam.gserviceaccount.com \
  --role roles/secretmanager.secretAccessor
```

### 1.4 GitHub Actions Variables

GitHub repositoryのVariablesに以下を設定する。

| Variable | 値 |
| -------- | -- |
| `SMTP_HOST` | `example.sakura.ne.jp` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | `noreply@frichy.jp` |
| `SECRET_SMTP_PASSWORD` | `frichy-prod-smtp-password` |
| `EMAIL_FROM` | `Frichy <noreply@frichy.jp>` |
| `EMAIL_REPLY_TO` | `sales@frichy.jp` |
| `APP_PUBLIC_URL` | `https://frichy.jp` |

設定後、`Deploy Cloud Run` workflowを再実行する。
workflowは `SECRET_SMTP_PASSWORD` が設定されている場合だけ、Cloud Runへ `SMTP_PASSWORD` secretを渡す。

### 1.5 アプリ側の確認

営業画面の生存確認メール送信機能で確認する。
未設定の場合、APIは `EMAIL_NOT_CONFIGURED` を返す。
SMTP認証や配送で失敗した場合、APIは `EMAIL_DELIVERY_FAILED` を返す。

## 2. さくら側の設定

### 2.1 メールアドレスを作成する

さくらのサーバーコントロールパネルで、送信元にするメールアドレスを作成する。

例:

```txt
noreply@frichy.jp
```

このとき設定したメールパスワードを、アプリ側の `SMTP_PASSWORD` として使う。

### 2.2 初期ドメインを確認する

SMTPサーバー名には、さくら契約時の初期ドメインを使う。

例:

```txt
example.sakura.ne.jp
```

独自ドメインのメールアドレスを使う場合でも、SMTPサーバー名は `smtp.frichy.jp` ではなく初期ドメインを指定する。

### 2.3 SMTP設定値

さくら側で確認する値は以下。

| 項目 | 値 |
| ---- | -- |
| SMTP送信サーバー | 初期ドメイン |
| SMTPユーザー名 | 作成したメールアドレス |
| SMTPパスワード | メールアドレス作成時のパスワード |
| ポート | `587` または `465` |
| 暗号化 | 587はSTARTTLS、465はSSL/TLS |
| 認証方式 | 通常のパスワード認証 |

Frichyでは既定値として `587` / STARTTLS を使う。
465を使う場合は、アプリ側で `SMTP_PORT=465` と `SMTP_SECURE=true` にする。

### 2.4 DNSについて

Resendを使わないため、Resend用のMX/TXT/DKIMレコード追加は不要。

さくらのメールボックスで `sales@frichy.jp` などを受信する場合は、対象ドメインのメール利用設定とMX設定がさくら側で有効になっていることを確認する。
送信品質を上げる場合は、さくら側のSPF/DKIM/DMARC設定を有効化してから、受信先で迷惑メール扱いにならないか確認する。

初期確認用のDMARCは監視のみの `p=none` から始める。

```txt
v=DMARC1; p=none; rua=mailto:sales@frichy.jp;
```

`rua` はDMARC集計レポートの受信先なので、受信できるアドレスを指定する。
送信が安定し、SPF/DKIM/DMARCがpassしていることを確認できたら、段階的に `p=quarantine` や `p=reject` を検討する。

## 3. 確認チェックリスト

- `SMTP_HOST` がさくらの初期ドメインになっている
- `SMTP_USER` がさくらで作成したメールアドレスになっている
- `SMTP_PASSWORD` がSecret ManagerからCloud Runへ渡っている
- `EMAIL_FROM` のメールアドレスが `SMTP_USER` と同じ、またはさくら側で送信許可されている
- Cloud Runを再デプロイ済み
- 生存確認メール送信で `EMAIL_NOT_CONFIGURED` が出ない
- 送信先で迷惑メール扱いになっていない

## 4. 参考

- さくらのメールソフト設定: https://help.sakura.ad.jp/mail/2114/
- さくらのOutlook SMTP構成: https://help.sakura.ad.jp/mail/2869/
- さくらのサブミッションポート: https://help.sakura.ad.jp/mail/2129/
