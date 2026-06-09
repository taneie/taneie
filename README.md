# TRYANGLE FREELANCE

Vue + Nuxt 3 + Atomic Design 構成へ分割した修正版です。

## 起動方法

```bash
npm install
npm run dev
```

ブラウザで以下を開きます。

```txt
http://127.0.0.1:5173/
```

5173番ポートが使用中の場合、Nuxt が別ポートを表示します。

## macOSで `connect EINVAL ... nuxt-vite-node-*.sock` が出る場合

macOS の標準一時ディレクトリ `/var/folders/...` のパスが長く、Nuxt/Vite が作る socket パスが長すぎると起きることがあります。
この修正版では `scripts/nuxt-short-tmp.mjs` 経由で Nuxt を起動し、`TMPDIR=/tmp` を自動設定します。

古いキャッシュが残っている場合は、以下を実行してから再起動してください。

```bash
rm -rf .nuxt .output node_modules/.vite
npm run dev
```

直接 `npx nuxt dev` や `nuxt dev` を実行すると、この対策が効かないため、必ず `npm run dev` を使ってください。

## 確認コマンド

```bash
npm run typecheck
npm run build
```

## デモログイン

- 求職者: freelancer@example.com / freelance123
- 営業: sales@tryangle.jp / sales123
