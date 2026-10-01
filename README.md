# 🚧 React・C#・Oracle 学習用アプリ

AG Grid・C#・Oracleを使い、工場向け部品仕様の改訂・承認管理を題材にした業務アプリを作成しています。

現在は、架空のデータを使ったフロントエンドの仮画面と、Oracle Database Freeの開発環境を用意しています。API・DBとの連携、編集・承認、バッチ処理は今後実装予定です。

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
cd frontend
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

| 項目 | 値 |
|---|---|
| ホスト | `localhost` |
| ポート | `1521` |
| サービス名 | `FREEPDB1` |
| 管理用ユーザー | `PDBADMIN` |
| 開発用パスワード | `Password1` |

`FREEPDB1`は、Oracle Freeイメージが用意するPDBの名前です。アプリ専用のDBユーザーは今後作成予定です。

DBを停止するときは、リポジトリのルートで実行します。

```powershell
docker compose down
```

## 構成

| パス | 内容 |
|---|---|
| `frontend/` | Vite・React・TypeScript・Ant Design・AG Gridの仮画面 |
| `backend/` | ASP.NET Core Web APIの雛形 |
| `compose.yaml` | Oracle Database Freeの開発環境 |