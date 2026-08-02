# FE/BE回帰テストレポート

実施日: 2026-08-02

## 対象

- ローカル作業ツリー（未コミット差分を含む）
- FE: Nuxt dev server `http://127.0.0.1:3000/`
- BE: Express appをテストコマンド内で一時起動
- DB: Docker Compose PostgreSQL `frichy-postgres`
- 本番GCP/Vercel環境へのデプロイ・データ変更は未実施

## 今回確認した修正

- ローカルデモ求職者ログイン時に、プロフィール画面へ氏名・メールアドレスが反映されること。
- ローカルデモ求職者でプロフィール保存、レジュメ情報保存、最終画面の登録完了がAPIトークンなしでも進むこと。
- デモ求職者の初期チャットが未読バッジにならないこと。
- 新規登録ユーザーに初期未読メッセージが付かないこと。
- FEのタイトル、FEATURES主要文言、生成ビルドが壊れていないこと。
- BEの認証、プロフィール、面談候補、メッセージ、営業向け一覧が壊れていないこと。

## 結果サマリ

| 区分 | 結果 | 備考 |
| --- | --- | --- |
| FE型チェック | PASS | `npm run typecheck` 成功 |
| FE静的生成 | PASS | `NUXT_IGNORE_LOCK=1 npm run generate` 成功 |
| FE起動確認 | PASS | `curl -I http://127.0.0.1:3000/` が `200 OK` |
| BEビルド | PASS | `npm run api:build` 成功 |
| DB migration | PASS | `npm run db:deploy` で `No pending migrations to apply.` |
| DB seed | PASS | ローカルDBへseed再投入成功 |
| API回帰 | PASS | 認証・プロフィール・面談・未読・営業一覧が全てPASS |
| lint/test script | 未実施 | `package.json` に `lint` / `test` scriptなし |

## 観点別結果

| 観点 | 期待結果 | 実施内容 | 結果 |
| --- | --- | --- | --- |
| FE TypeScript | 型エラーがない | `npm run typecheck` | PASS |
| FE production生成 | 本番相当の静的生成が完了する | `NUXT_IGNORE_LOCK=1 npm run generate` | PASS |
| FEトップ疎通 | ローカルトップがHTTP 200を返す | `curl -I http://127.0.0.1:3000/` | PASS |
| ブラウザタブ文言 | `Frichy - フリーランスエンジニアと働き方をつなぐ` が出力される | `Frontend/.output/public` 内を検索 | PASS |
| LP FEATURES文言 | `FEATURES`、`最短1分で応募まで。`、`Frichyが案件探しを自動化。` が生成物に含まれる | `Frontend/.output/public` 内を検索 | PASS |
| BE TypeScript | APIビルドが成功する | `npm run api:build` | PASS |
| DB接続 | PostgreSQLが起動・healthy | `docker compose ps` | PASS |
| migration適用状態 | 未適用migrationがない | `DATABASE_URL=... npm run db:deploy` | PASS |
| seed再投入 | デモデータが投入できる | `DATABASE_URL=... npm run db:seed` | PASS |
| APIヘルス | APIが稼働応答を返す | `GET /api/health` | PASS |
| 求職者ログイン | デモ求職者でログインできる | `POST /api/auth/login` | PASS |
| 求職者認証状態 | role/freelancerIdが取得できる | `GET /api/auth/me` | PASS |
| 求職者プロフィール表示 | 氏名・メールアドレスが返る | `GET /api/profile/me` | PASS |
| プロフィール保存 | API経由でプロフィール更新できる | `PUT /api/profile/me` | PASS |
| 面談候補保存 | タイムゾーン付きISO日時で登録できる | `POST /api/meeting-requests` | PASS (`201 Created`) |
| デモ初期未読 | デモ求職者の営業メッセージ未読が0件 | `GET /api/messages` | PASS (`unread=0`) |
| 新規登録未読 | 新規登録ユーザーの営業メッセージ未読が0件 | `POST /api/auth/register` 後 `GET /api/messages` | PASS (`unread=0`) |
| 営業ログイン | デモ営業でログインできる | `POST /api/auth/login` | PASS |
| 営業向け求職者一覧 | 営業で求職者一覧を取得できる | `GET /api/freelancers` | PASS |

## テスト中に見つけた問題と対応

| 問題 | 影響 | 対応 |
| --- | --- | --- |
| FEローカルseedの初期チャットに `readAt` がなく、デモ未読バッジが出る | デモ求職者が未送信でも未読ありに見える | FE seedの初期メッセージに `readAt` を付与 |
| BE seedの初期チャットに `readAt` がなく、API連携時にも未読が出る | APIデモデータでも未読ありに見える | BE seedの初期メッセージに `readAt` を付与 |
| 未読判定が現在ユーザーの対象範囲を見ていない箇所がある | 別求職者/別スレッドの未読が混ざる可能性 | `isUnreadIncomingMessage()` に対象スコープ判定を集約 |
| ローカルデモ求職者の保存経路がAPI前提になっている | APIトークンなしのデモでプロフィール保存・登録完了できない | ローカルデモ用の保存、レジュメメタデータ保存、面談候補保存を追加 |

## 補足

- `npm run generate` は既存Nuxt dev serverのロックで一度停止したため、生成確認では `NUXT_IGNORE_LOCK=1` を付けて再実行した。
- `npm run db:deploy` と `npm run db:seed` はサンドボックス内でPrisma/tsxの制約に当たったため、権限付きでローカルDBに対して再実行した。
- ブラウザ操作のE2Eテストは、Playwright/Cypress等のscriptが定義されていないため未実施。
- レジュメの実ファイルアップロード先（GCS/Vercel Blob）の実送信は、今回のローカル回帰範囲では未実施。
