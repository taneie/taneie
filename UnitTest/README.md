# UnitTest

FE/BEの単体テストを管理するディレクトリです。

## 実行方法

```bash
npm run UnitTest
```

または既存のscript名でも実行できます。

```bash
npm run test:unit
```

## 管理方針

- 外部APIやブラウザ操作を使わない、純粋関数・mapper・schema・小さなロジックのテストを置く。
- API routeをHTTP経由で確認するテストは `tests/api/` に置く。
- UI/UXの静的検査は `tests/ui/` に置く。
- 共通fixtureやHTTP helperは `tests/helpers/` を使う。
