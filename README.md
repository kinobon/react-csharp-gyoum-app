# 🚧 React・C#・Oracle 学習用アプリ

AG Grid・C#・Oracleを使い、図書館の蔵書・貸出管理を題材にした業務アプリを作成しています。実物の本がある前提で、蔵書検索・貸出・返却を扱う方針です。

現在は、旧題材である部品・改訂管理のモック画面、ASP.NET Core Web APIの雛形、Oracle Database Freeの開発環境を用意しています。図書館向けの画面・業務処理、API・DBとの連携は今後実装予定です。

予約、購入希望の申請・承認、延滞確認のバッチは追加候補です。学習方針と未確定事項は[PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md)にまとめています。

業務の流れと設計候補は、[イベントストーミング](docs/modeling/event-storming.md)と[ドメインモデル](docs/modeling/domain-model.md)にまとめています。

以下は旧題材の仮画面です。

![旧題材の部品・改訂一覧の仮画面](docs/assets/image.png)

## 前提条件

- Node.js：24以上
- pnpm
- Docker CLI・Docker Composeが利用できる環境
  - 現在はWindows 11のRancher Desktopで、コンテナエンジンに`dockerd (moby)`を使用しています。
  - Oracleを起動する前にRancher Desktopを起動してください。

## 起動手順

### フロントエンド

リポジトリのルートから実行します。

```powershell
cd apps/frontend
pnpm install --frozen-lockfile
pnpm dev
```

ターミナルに表示されるURLをブラウザで開きます。通常は`http://localhost:5173`です。

### バックエンド

🚧

### データベース

※フロントエンドは現在モックデータで動作するため、Oracleを起動せずに画面を確認できます。

リポジトリのルートで実行します。

```powershell
docker compose up -d
```

Windows上のDBクライアントから接続する場合の設定です。

| 項目             | 値          |
| ---------------- | ----------- |
| ホスト           | `localhost` |
| ポート           | `1521`      |
| サービス名       | `FREEPDB1`  |
| 管理用ユーザー   | `PDBADMIN`  |
| 開発用パスワード | `Password1` |

`FREEPDB1`は、Oracle Freeイメージが用意するPDBの名前です。アプリ専用のDBユーザーは今後作成予定です。

DBを停止するときは、リポジトリのルートで実行します。

```powershell
docker compose down
```

## 構成

| パス             | 内容                                                 |
| ---------------- | ---------------------------------------------------- |
| `apps/frontend/` | Vite・React・TypeScript・Ant Design・AG Gridの仮画面 |
| `apps/backend/`  | ASP.NET Core Web APIの雛形                           |
| `compose.yaml`   | Oracle Database Freeの開発環境                       |
