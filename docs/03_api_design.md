# 03. API設計

## 1. 共通仕様

| 項目           | 内容                                                 |
| -------------- | ---------------------------------------------------- |
| ベースURL      | `http://127.0.0.1:8787/api`                          |
| データ形式     | JSON                                                 |
| 認証方式       | JWT Bearer Token                                     |
| 認証ヘッダー   | `Authorization: Bearer <token>`                      |
| バリデーション | Zod schema                                           |
| エラー形式     | `{ "error": { "code": string, "message": string } }` |

## 2. エンドポイント一覧

| メソッド | パス                           | 認証 | ロール             | 概要                         |
| -------- | ------------------------------ | ---: | ------------------ | ---------------------------- |
| GET      | `/health`                      | 不要 | -                  | APIヘルスチェック            |
| GET      | `/push/public-key`             | 不要 | -                  | Web Push公開鍵取得           |
| POST     | `/auth/register`               | 不要 | -                  | 求職者登録                   |
| POST     | `/auth/login`                  | 不要 | -                  | ログイン                     |
| GET      | `/auth/me`                     | 必要 | freelancer / sales | ログインユーザー情報取得     |
| GET      | `/bootstrap`                   | 必要 | freelancer / sales | 初期表示データ取得           |
| GET      | `/jobs`                        | 必要 | freelancer / sales | 案件一覧取得                 |
| POST     | `/jobs`                        | 必要 | sales              | 案件登録                     |
| PATCH    | `/jobs/:id`                    | 必要 | sales              | 案件の優先表示・公開状態更新 |
| GET      | `/freelancers`                 | 必要 | sales              | 求職者一覧取得               |
| GET      | `/profile/me`                  | 必要 | freelancer         | 自分のプロフィール取得       |
| PUT      | `/profile/me`                  | 必要 | freelancer         | 自分のプロフィール更新       |
| POST     | `/resumes`                     | 必要 | freelancer         | レジュメメタ情報登録         |
| GET      | `/applications`                | 必要 | freelancer / sales | 応募一覧取得                 |
| POST     | `/applications`                | 必要 | freelancer         | 応募作成                     |
| PATCH    | `/applications/:id/status`     | 必要 | sales              | 応募ステータス変更           |
| GET      | `/meeting-requests`            | 必要 | freelancer / sales | 面談候補一覧取得             |
| POST     | `/meeting-requests`            | 必要 | freelancer / sales | 面談候補作成                 |
| PATCH    | `/meeting-requests/:id/status` | 必要 | sales              | 面談ステータス更新           |
| GET      | `/messages`                    | 必要 | freelancer / sales | メッセージ一覧取得           |
| POST     | `/messages`                    | 必要 | freelancer / sales | メッセージ送信               |
| POST     | `/push/subscriptions`          | 必要 | freelancer / sales | Web Push購読登録             |
| DELETE   | `/push/subscriptions`          | 必要 | freelancer / sales | Web Push購読解除             |
| POST     | `/alive-checks`                | 必要 | sales              | 稼働確認バッチ作成           |

## 3. 認証API

### 3.1 求職者登録

`POST /api/auth/register`

#### Request

```json
{
  "name": "山田 太郎",
  "email": "freelancer@example.com",
  "password": "freelance123",
  "phone": "090-0000-0000",
  "roleTitle": "バックエンドエンジニア",
  "privacyPolicyAccepted": true
}
```

#### Response

```json
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "freelancer@example.com",
    "role": "freelancer",
    "name": "山田 太郎",
    "freelancerId": "uuid"
  }
}
```

### 3.2 ログイン

`POST /api/auth/login`

```json
{
  "email": "sales@freelink.jp",
  "password": "sales123"
}
```

## 4. 案件API

### 4.1 案件一覧取得

`GET /api/jobs`

- sales: 全案件を取得
- freelancer: 公開中案件のみ取得。ただしプロフィール要件未完了の場合は403

### 4.2 案件登録

`POST /api/jobs`

```json
{
  "title": "金融SaaSのバックエンド刷新",
  "client": "FinTech事業会社",
  "summary": "Java/Spring Bootで既存決済基盤を刷新。",
  "required": ["Java", "Spring Boot"],
  "nice": ["AWS"],
  "rateMin": 80,
  "rateMax": 100,
  "marginRate": 12,
  "streamType": "end_direct",
  "remoteType": "hybrid",
  "isPinned": true
}
```

### 4.3 案件フラグ更新

`PATCH /api/jobs/:id`

```json
{
  "isPinned": true,
  "isActive": false
}
```

## 5. プロフィールAPI

### 5.1 自分のプロフィール取得

`GET /api/profile/me`

### 5.2 自分のプロフィール更新

`PUT /api/profile/me`

`roleTitle` はプロフィール画面の職種プルダウンに表示する定義済み職種のみ受け付ける。

```json
{
  "name": "山田 太郎",
  "phone": "090-0000-0000",
  "roleTitle": "バックエンドエンジニア",
  "yearsExperience": 6,
  "desiredRate": 85,
  "startDate": "2026-07-01",
  "workRate": "週5",
  "remoteType": "full_remote",
  "availabilityStatus": "scheduled",
  "availabilityNote": "2026年7月から空き予定",
  "pledgeAccepted": true,
  "skills": ["Java", "TypeScript", "PostgreSQL", "AWS"]
}
```

## 6. レジュメAPI

`POST /api/resumes`

このAPIはファイル本体ではなく、レジュメのメタ情報を登録する。既存レジュメは `isLatest=false` に更新され、新規レジュメが最新扱いになる。

```json
{
  "originalFilename": "職務経歴書.pdf",
  "mimeType": "application/pdf",
  "fileSizeBytes": 384000,
  "storageKey": "resumes/user/xxxx.pdf"
}
```

## 7. 応募API

### 7.1 応募一覧

`GET /api/applications`

- sales: 全応募を取得
- freelancer: 自分の応募のみ取得

### 7.2 応募作成

`POST /api/applications`

```json
{
  "jobId": "uuid"
}
```

プロフィール要件を満たしていれば、初回面談の完了前でも応募を作成できる。

### 7.3 応募ステータス変更

`PATCH /api/applications/:id/status`

```json
{
  "status": "meeting_pending",
  "note": "初回面談調整へ進行"
}
```

## 8. 面談API

### 8.1 面談候補一覧

`GET /api/meeting-requests`

salesは `freelancerProfileId` クエリで対象者を指定できる。

### 8.2 面談候補作成

`POST /api/meeting-requests`

```json
{
  "freelancerProfileId": "uuid",
  "applicationId": "uuid",
  "candidateAt": "2026-06-10T10:00:00+09:00"
}
```

### 8.3 面談ステータス更新

`PATCH /api/meeting-requests/:id/status`

```json
{
  "status": "confirmed"
}
```

## 9. メッセージAPI

### 9.1 メッセージ一覧

`GET /api/messages`

salesは `freelancerProfileId` クエリで対象者を指定できる。

### 9.2 メッセージ送信

`POST /api/messages`

```json
{
  "freelancerProfileId": "uuid",
  "receiverUserId": "uuid",
  "jobId": "uuid",
  "body": "面談候補を確認しました。",
  "messageType": "chat"
}
```

`messageType` は `chat`, `scout`, `alive_check`, `system` のいずれか。
`jobId` を指定した `chat` は応募済み案件に紐づく案件チャットとして扱う。案件チャットの送信は初回面談完了を必須にしない。

## 10. Web Push API

### 10.1 購読登録

`POST /api/push/subscriptions`

```json
{
  "endpoint": "https://push.example/subscription",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

### 10.2 購読解除

`DELETE /api/push/subscriptions`

リクエストボディは購読登録と同じ。

## 11. 稼働確認API

`POST /api/alive-checks`

営業専用。以下のいずれかに該当する求職者を対象に `AliveCheckBatch` と `AliveCheckTarget` を作成する。

- `availabilityStatus` が `ready` ではない
- `lastUpdatedOn` が14日以上前

## 12. 主なエラーコード

| HTTP | code                              | 内容                                     |
| ---: | --------------------------------- | ---------------------------------------- |
|  400 | `VALIDATION_ERROR`                | 入力値が不正                             |
|  400 | `FREELANCER_PROFILE_REQUIRED`     | 求職者プロフィールIDが必要               |
|  401 | `AUTH_REQUIRED`                   | 認証が必要                               |
|  401 | `INVALID_CREDENTIALS`             | メールアドレスまたはパスワードが不正     |
|  403 | `FORBIDDEN`                       | 操作権限なし                             |
|  403 | `PROFILE_REQUIREMENTS_INCOMPLETE` | 案件閲覧に必要なプロフィール要件が未完了 |
|  403 | `CORS_FORBIDDEN`                  | 許可されていないオリジン                 |
|  404 | `PROFILE_NOT_FOUND`               | プロフィールが存在しない                 |
|  409 | `EMAIL_ALREADY_EXISTS`            | メールアドレス登録済み                   |
|  409 | `APPLICATION_ALREADY_EXISTS`      | 応募済み                                 |
|  409 | `UNIQUE_CONSTRAINT`               | 一意制約違反                             |
|  500 | `INTERNAL_SERVER_ERROR`           | サーバー内部エラー                       |
