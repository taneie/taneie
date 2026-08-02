# 網羅テスト実施レポート

実施日: 2026-08-03

## 対象

- ローカル作業ツリー
- FE: Nuxt / Vue / TypeScript
- BE: Express / TypeScript / Prisma / PostgreSQL
- DB: Docker Compose PostgreSQL `frichy-postgres`
- テスト実行先DB: `postgresql://frichy:frichy@127.0.0.1:5432/frichy?schema=public`

## 追加した再利用可能なテスト

| 種別 | ファイル | 内容 |
| --- | --- | --- |
| 共通HTTPヘルパー | `tests/helpers/http.ts` | Express一時起動、HTTP request、ログイン、エラー検証、ローカルDBガード |
| 共通fixture | `tests/helpers/fixtures.ts` | 求職者、プロフィール、メッセージの再利用fixture |
| FE単体 | `UnitTest/frontend-utils.test.ts` | utility、state、mapping、scout filter、chat unread判定 |
| BE単体 | `UnitTest/backend-core.test.ts` | domain label、暗号化、PII hash、JWT/password、mapper |
| BE schema単体 | `UnitTest/backend-schemas.test.ts` | exported schemaの正常系/異常系 |
| API横断 | `tests/api/api-regression.test.ts` | 認証、プロフィール、案件、応募、面談、チャット、問い合わせ |
| UI/UX静的 | `tests/ui/static-ui.test.ts` | FEATURES文言、旧名称混入、可読性CSS、a11y、loading/toast |

## 実行結果

| コマンド | 結果 | 備考 |
| --- | --- | --- |
| `npm run typecheck` | PASS | FE型チェック |
| `npm run api:build` | PASS | BE TypeScript build |
| `npm test` | PASS | unit 50件、API 11件、UI 9件、合計70件 |
| `NUXT_IGNORE_LOCK=1 npm run generate` | PASS | Nuxt静的生成 |
| `git diff --check` | PASS | 空白エラーなし |

## テスト観点

| 観点 | 正常系 | 異常系 | 結果 |
| --- | --- | --- | --- |
| 認証 | デモ求職者/営業ログイン、`/auth/me` | 誤パスワード、未認証、無効リセットトークン | PASS |
| 新規登録 | 新規求職者作成、token/user返却 | 重複メール、初期未読0件確認 | PASS |
| プロフィール | 取得、氏名/メール表示、保存 | 営業アクセス禁止、範囲外経験年数 | PASS |
| 案件 | 営業作成、一覧、詳細、フラグ更新 | 求職者作成禁止 | PASS |
| 応募 | 求職者応募、営業ステータス変更 | 重複応募409 | PASS |
| 面談 | 候補作成、営業ステータス更新 | timezoneなし日時、営業のprofile未指定、求職者更新禁止 | PASS |
| チャット | 営業チャット送信、既読化、初期未読0件 | 空本文、求職者scout禁止 | PASS |
| 問い合わせ | 作成、一覧、営業回答 | 求職者回答禁止 | PASS |
| BE schema | 全export schemaのvalid/invalid | 必須不足、型不正、範囲外、uuid不正 | PASS |
| FEロジック | 日時変換、スキル分類、プロフィール変換、ソート、未読判定 | 空白日時、空CSV、対象外スコープ、既読済み | PASS |
| UI/UX静的 | FEATURES文言、CTA、nav、a11y | 旧Freelink混入、viewport依存font、非0 letter-spacing | PASS |

## テストで検出して修正した問題

| 問題 | 影響 | 修正 |
| --- | --- | --- |
| スカウト対象ソートが元配列を破壊する | 絞り込み/並び替え後に元の求職者一覧順が崩れる | `filterAndSortFreelancers()` でコピーしてからsort |
| 面談候補に空白のみを渡すと不正日時へ変換される | UIからAPI 400につながる可能性 | `addMeeting()` でtrim、`toApiDateTime()` で空文字を空のまま返却 |
| チャット未読判定が巨大composable内に閉じていてテストしづらい | ロール/スコープ漏れの再発検知が弱い | `chat.ts` に純粋関数として切り出し、単体テスト追加 |
| FEATURES/LP/PageHead周辺にviewport依存font-sizeが残る | 画面幅で文字サイズが揺れ、可読性と再現性が落ちる | `clamp(...vw...)` を固定サイズ＋mediaへ変更 |
| 一部UIに非0のletter-spacingが残る | テキスト可読性/統一感が落ちる | `letter-spacing: 0` へ統一し静的テスト化 |
| デモseedの初期メッセージが未読扱いになる | デモログイン直後に未読バッジが出る | FE/BE seedに `readAt` を追加 |

## 補足

- `test:api` は安全のためlocalhost DB以外では動かないガードを入れている。
- APIテストでは重複応募の異常系を意図的に踏むため、Prismaの一意制約ログが出る。HTTP結果は409でPASS。
- Playwright/Cypress等のブラウザE2E依存は未導入のため、実ブラウザ操作の自動E2Eは今回追加していない。既存依存のみで実行できる範囲として、API横断・FE/BE単体・UI/UX静的検査・Nuxt生成確認まで実施した。
