# Frichy ドキュメント

このドキュメントは、アップロードされた `Frichy` のソースコードを静的に確認して生成した設計ドキュメントです。

## ドキュメント構成

| ファイル                     | 内容                                            |
| ---------------------------- | ----------------------------------------------- |
| `00_overview.md`             | システム概要、利用者、主要機能、対象範囲        |
| `01_architecture.md`         | アーキテクチャ、ディレクトリ構成、技術スタック  |
| `02_screen_design.md`        | 画面一覧、ロール別導線、主要画面仕様            |
| `03_api_design.md`           | API一覧、認証、リクエスト/レスポンス概要        |
| `04_database_design.md`      | Prisma schemaに基づくDB設計、主要テーブル、ER図 |
| `05_auth_security_design.md` | 認証・認可、暗号化、個人情報保護、エラー設計    |
| `06_operations.md`           | 起動手順、環境変数、DB運用、確認コマンド        |
| `07_open_items.md`           | 実装から見える未決事項・改善候補                |
| `08_google_cloud_migration.md` | Google Cloud + Neon移行手順、本番/開発環境の分離 |
| `09_gcp_console_github_actions.md` | GCPコンソール設定、GitHub Actionsデプロイ手順 |

## 前提

- 対象システム名: Frichy
- フロントエンド: Nuxt 3 / Vue 3
- バックエンド: Express / TypeScript
- DB: PostgreSQL / Prisma
- 認証: JWT
- 生成日: 2026-06-13

## 注意

このドキュメントはソースコードからのリバース設計です。実装に存在しない業務背景、正式なSLA、インフラ構成、外部ストレージ実体などは断定していません。
