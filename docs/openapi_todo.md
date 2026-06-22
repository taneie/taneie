# OpenAPI化メモ

現在の実装から、次の順番でOpenAPI定義へ移すとよい。

1. `backend/src/interfaces/http/app.ts` のルート一覧を `paths` に転記
2. `backend/src/interfaces/http/schemas.ts` のZod schemaを `components.schemas` に対応
3. 共通エラー `{ error: { code, message } }` を `components.schemas.ErrorResponse` として定義
4. JWT Bearer認証を `components.securitySchemes.bearerAuth` に定義
5. sales専用 / freelancer専用の権限制約を各operationの説明に明記

OpenAPIファイル名案: `openapi.yaml`
