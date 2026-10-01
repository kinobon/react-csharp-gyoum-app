# React + TypeScript + Vite

## 天気予報のAPI接続サンプル

`/weather`で、既存の`WeatherForecastController`が返す5日分のランダムな予報を表示します。
一覧・再取得・取得失敗時の再試行を実装しています。実際の天気情報ではありません。
旧画面の右上にある「天気予報サンプル」からも移動できます。Oracleは不要です。

リポジトリのルートでAPIを起動し、別のターミナルでフロントを起動します。

```powershell
dotnet run --project apps/backend/FactoryTraining/FactoryTraining.Api --launch-profile http
```

```powershell
cd apps/frontend
pnpm install --frozen-lockfile
pnpm dev
```

Viteが表示するURLの`/weather`を開きます。ブラウザは`/api/WeatherForecast`を呼び、
Viteの開発用proxyが`http://localhost:5199/WeatherForecast`へ転送します。
`pnpm preview`や本番配信にはこのproxyはありません。そこでAPIを接続する場合は、配信側で`/api`の転送設定が必要です。

### 定義からクライアントを生成する

```text
C# Controller・DTO → /openapi/v1.json → openapi/api.json
                                      ↓ Orval
                         src/api/generated/（型・fetch関数・Queryフック）
                                      ↓
                         features/weather/WeatherPage.tsx
                                      ↓
                         features/weather/WeatherPage.ui.tsx
```

`apps/frontend`で実行します。

```powershell
pnpm api:update    # 起動中のAPIから定義を取得 → クライアント生成
pnpm api:pull      # 定義の取得だけ
pnpm api:generate  # 保存した定義から生成。API起動は不要
pnpm test:api      # 生成クライアントとQueryの正常・空結果・失敗・復旧を検証
```

API定義のURLを変更する場合は、`OPENAPI_URL`環境変数を指定します。
画面の接続先を変更する場合は、`vite.config.ts`のproxy設定を変更します。

- `openapi/api.json`と`src/api/generated/`は生成物としてGit管理します。手動編集せず、ControllerやDTOの変更後に`pnpm api:update`で更新します。
- 通常の`pnpm build`ではAPI定義を取り直しません。API停止中でも保存済みの生成コードをビルドできます。
- `src/routes/weather.tsx`はURLと画面の接続、`WeatherPage.tsx`はQueryと表示の接続、`WeatherPage.ui.tsx`はpropsを受け取る表示を担当します。
- 型はOrval生成の`WeatherForecast`を利用し、feature側で同じDTOを手書きしません。生成済みフックを包むだけの独自フックも追加していません。
- HTTP失敗をQueryのエラーとして扱うため、Orvalの`forceSuccessResponse`を有効にしています。再取得失敗時には前回の一覧を残し、その旨を表示します。

参照：[Orval React Query](https://orval.dev/docs/guides/react-query/)、[Orval Fetch設定](https://orval.dev/docs/reference/configuration/output/#overridefetch)、[TanStack Query](https://tanstack.com/query/latest/docs/framework/react/quick-start)。

## ルーティング

TanStack Routerのファイルベースルーティングを使用します。
現在は`/`で旧題材の部品・改訂一覧（`src/App.tsx`）を表示します。
一致しないURLには、一覧へ戻るリンク付きの案内を表示します。

| ファイル                 | 役割                                                                |
| ------------------------ | ------------------------------------------------------------------- |
| `src/router.ts`          | Routerの作成と型登録                                                |
| `src/routes/__root.tsx`  | 共通のOutlet、未定義URLの表示、開発時のRouter Devtools              |
| `src/routes/index.tsx`   | `/`の画面                                                           |
| `src/routes/weather.tsx` | `/weather`のAPI接続サンプル                                         |
| `src/routeTree.gen.ts`   | 自動生成されるルート定義（手動編集・Git管理・lint・formatの対象外） |

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
