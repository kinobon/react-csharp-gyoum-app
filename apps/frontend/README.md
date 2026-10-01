# React + TypeScript + Vite

## ルーティング

TanStack Routerのファイルベースルーティングを使用します。
現在は`/`で旧題材の部品・改訂一覧（`src/App.tsx`）を表示します。
一致しないURLには、一覧へ戻るリンク付きの案内を表示します。

| ファイル                | 役割                                                                |
| ----------------------- | ------------------------------------------------------------------- |
| `src/router.ts`         | Routerの作成と型登録                                                |
| `src/routes/__root.tsx` | 共通のOutlet、未定義URLの表示、開発時のRouter Devtools              |
| `src/routes/index.tsx`  | `/`の画面                                                           |
| `src/routeTree.gen.ts`  | 自動生成されるルート定義（手動編集・Git管理・lint・formatの対象外） |

`apps/frontend`で実行します。

```sh
pnpm dev              # Viteプラグインがルート定義を生成・監視
pnpm routes:generate  # ルート定義だけを生成
pnpm build            # ルート生成 → TypeScript検証 → Viteビルド
pnpm lint
```

画面を追加するときは`src/routes`にルートファイルを追加します。
ルート定義がない初回でも、`pnpm build`が型チェックの前に生成します。
Routerの型推論に必要な`strictNullChecks`を有効にしています。
配信先を用意する際は、各画面URLへの直接アクセスも`index.html`へ返すSPAフォールバックが必要です。

公式資料：[手動セットアップ](https://tanstack.com/router/latest/docs/installation/manual)、[Vite設定](https://tanstack.com/router/latest/docs/installation/with-vite)、[Router CLI](https://tanstack.com/router/latest/docs/installation/with-router-cli)。

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
