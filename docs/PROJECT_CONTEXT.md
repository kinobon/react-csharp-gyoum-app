# 工場向け部品仕様改訂管理：学習プロジェクトの方針

更新日：2026-10-01（日本時間）  
用途：技術方針・実装範囲・コードレビューの前提共有  
文書の状態：設計・学習計画。実装状況と検証結果は、実際のコード・Issue・実行記録で確認する。

> **目的はAG Grid・C#・Oracleの技術学習。小規模な架空の業務モデルを通して各技術を学ぶ。**
>
> 計画と実装状況を区別する。以下の業務要件・画面・テーブル・パスは、特記しない限り学習用の暫定案であり、実在する実装の説明ではない。

## 0. 最初に読む要約

学習用に、React＋AG Grid Enterprise、ASP.NET Core、Oracleを使った小規模な業務アプリを作る方針。題材の現案は「部品仕様の改訂・承認・適用管理」。画面で改訂を作成して承認し、適用日時を迎えた改訂をバッチが反映する。

Web APIと共通ライブラリはC# 7.3、バッチはC# 14を使う。実行基盤は双方とも.NET 10を想定する。C# 7.3に制限するのは基礎や従来の書き方を学ぶためで、.NET Frameworkの動作環境を再現するためではない。

Grid LayoutとFilterを重点対象とし、一覧画面の列レイアウト・フィルター・状態管理を学ぶ。Enterprise固有機能も評価する。Oracleアクセスは、まずODP.NETで生SQLを書き、接続・パラメータ・トランザクションを理解する。

**バッチは、ローカルで手動起動すると一回分の処理を実行し、結果を残して終了するConsoleアプリでよい。** Cronos、常駐Worker、タスクスケジューラの設定は現段階で不要。定期的に呼び出されても安全な処理本体を作ることが対象。

GitHubでコードを管理し、Issue→ブランチ→実装とテスト→PR→CI／Codexレビュー→修正→受入確認→マージ、という開発フローも学ぶ。GitHub・Codexの設定状況は実際のリポジトリで確認する。

## 1. 学習目標

AG GridのLayout・Filter、C#の基礎、OracleへのSQLアクセスを、実装と検証を通して理解する。

## 2. 技術方針と暫定案

| 状態 | 項目 | 内容 |
|---|---|---|
| 現方針 | 学習の主軸 | AG Grid、C#、Oracle。ASP.NET Coreとテストを組み合わせる |
| 現方針 | Enterprise | ローカル評価として利用する。ライセンス条件に従う |
| 現方針 | 言語の分担 | Web API側はC# 7.3、バッチ側はC# 14 |
| 現方針 | バッチの実行 | 手動起動→一回分を処理→終了。定期起動基盤は作らない |
| 現方針 | DB学習 | 生SQLを扱い、接続・パラメータ・結果取得・トランザクションを学ぶ |
| 現方針 | 開発フロー | GitHub、テストコード、PR、Codexレビューを取り入れる |
| 暫定構成 | 実行基盤 | 各バックエンドプロジェクトを.NET 10にそろえる |
| 暫定構成 | フロント | Vite＋React＋TypeScript。Next.js固有機能は対象にしない |
| 暫定構成 | DB環境 | Oracle Database FreeのDockerコンテナをローカル利用 |
| 暫定構成 | 接続 | ODP.NET Coreを直接使用。EF Coreは必須にしない |
| 暫定構成 | コード配置 | frontend／backend／db／docsを持つモノリポ |
| 暫定題材 | 業務アプリ | 工場向け部品仕様の改訂・承認・適用管理 |
| 要選定 | 認証・テスト等 | 認証方式、テストライブラリ、パッケージの正確なバージョン、CIのDB実行方式 |

「現方針」は学習の進め方であり、実装完了を表すものではない。暫定案を正式な受入条件にする際は、対象Issueまたは仕様へ採用した旨を記録する。

## 3. 何を作るか：業務題材の暫定案

### 3.1 システムの目的

部品の仕様を改訂単位で管理し、「現在適用されている仕様」「申請中の変更」「承認済みで適用待ちの変更」「過去の仕様」を区別できるようにする。設計担当者が変更を申請し、承認者が承認する。適用日時を迎えた承認済み改訂は、手動起動したバッチで適用する。

本書は製造業の標準業務を定義するものではない。学びたい技術を一つの小さな流れに結びつけるための架空の業務モデルである。

### 3.2 主な流れ

```text
P001 / Rev.1 が適用中
    ↓ 現行版を基に新しい改訂を作る
Rev.2 の下書き
    ↓ 仕様・変更理由・適用予定日時を入力
申請中
    ├─ 差し戻し → 下書きへ戻る（差し戻し履歴を残す）
    └─ 承認 → 承認済・適用待ち
                    ↓ 適用日時を迎え、バッチを手動起動
                Rev.2 が適用中
                Rev.1 は旧版
```

### 3.3 業務ルール候補

以下は採用候補。実装Issueへ落とす際に正式化する。

| ID | ルール案 | 主な確認方法 |
|---|---|---|
| BR-01 | 仕様内容を編集できるのは下書きのみ | 申請後の編集APIを拒否するテスト |
| BR-02 | 承認は承認者ロールのみ。自分の申請は承認不可 | 権限不足・自己承認のテスト |
| BR-03 | 一つの部品の適用中改訂は最大一つ | 適用後のDB状態を検証 |
| BR-04 | 一つの部品で並行して進める未適用の改訂は一つまで | 二つ目の下書き作成を検証 |
| BR-05 | 承認済み、かつ適用予定日時が実行基準時刻以前の改訂だけ適用する | 状態と日時の境界値テスト |
| BR-06 | 仕様変更・申請・承認・差し戻し・適用の履歴を残す | 操作と履歴の整合性確認 |
| BR-07 | 改訂番号と、同時更新検出用のバージョン番号は別に扱う | 更新競合テスト |

承認後に固定するのは「仕様内容」であり、承認済→適用中→旧版という正当な状態遷移まで禁止するわけではない。

並行改訂、承認の取消し、部品の削除、初版の登録方法、管理者による例外操作はまだ詳細未決定。必要がなければ機能を増やさず、初期データから始める。

## 4. 画面とAPIの暫定範囲

### 4.1 画面

| 画面 | 内容 | 優先度 |
|---|---|---|
| 部品・改訂一覧 | AG Gridで一覧、検索、列操作、詳細への遷移 | 最優先 |
| 改訂詳細・編集 | 仕様編集、申請、承認、差し戻し、履歴 | 基本フロー |
| ログイン | テスト利用者による認証とロールの確認 | 基本フロー |
| バッチ実行結果 | 実行日時・件数・失敗情報の確認 | まずログでよい。専用画面は追加範囲 |

一覧は「1行＝1改訂」を基本案とし、初期条件は適用中のみ。品番、品名、Rev、区分、材質、重量、状態、適用予定日時、申請者、更新日時などを列候補とする。

下書きだけをAG Gridでセル編集する小さな機能も候補。ただし、複雑な一括編集・複数行保存までは必須にしない。保存失敗時の表示と、サーバー側の再検証は扱う。

### 4.2 APIの機能境界

検索、改訂の取得・作成・更新、申請、承認、差し戻し、フィルター候補取得、ログイン／利用者情報／ログアウトを想定する。URL、HTTPメソッド、DTO、エラーコードは実装Issueで確定する。

検索条件にはAG Gridのデータモデルが入るが、DomainをAG Grid固有のJSON構造に依存させない。APIまたは専用の変換処理で、許可した列・演算子・型を持つ検索条件へ変換する案とする。

## 5. AG Gridの学習・実装範囲

### 5.1 Grid Layout

Grid Layoutの学習では、DOM Layoutと列配置の両方を扱う。

| 項目 | 学習・確認する内容 |
|---|---|
| グリッド領域 | 親要素とグリッドの高さ・幅、スクロール領域 |
| DOM Layout | `normal`／`autoHeight`／`print`の違いを小さく検証 |
| 列サイズ | `width`、`minWidth`、`maxWidth`、`flex`、自動サイズ調整 |
| 列操作 | リサイズ、並べ替え、固定、表示・非表示 |
| Enterprise UI | Columns Tool Panel、Filters Tool Panel |
| 状態管理 | 列順・幅・表示・固定・フィルター条件の保存と復元 |
| 画面幅 | 狭い幅で重要列・スクロール・パネルが使えるか |

本番想定の一覧は、サイズを定めた`normal`を基本案にする。`autoHeight`を大量データに無制限で適用しない。AG Grid公式は、SSRMと無制限のautoHeightの組み合わせでは全データを読み込むことになると説明している。[^grid-layout]

列の手動リサイズと`flex`の関係、保存した幅と初期サイズ調整の競合も確認対象。公式では、flex列を手動リサイズすると、その列のflexは無効になる。[^column-sizing]

### 5.2 Filter

| 列の例 | 学習対象 |
|---|---|
| 品番・品名 | Text Filter：部分一致など |
| 重量 | Number Filter：大小・範囲など |
| 状態・区分・材質 | Set Filter：複数候補選択 |
| 適用予定日時 | Date Filter：日付・範囲、時刻との境界 |
| 一部の列 | Multi Filter：TextとSetなどを組み合わせて評価 |

条件の設定だけで終わらず、取得・変更・解除・保存・復元、Apply操作と適用済み条件の違いまで確認する。条件の保存・復元にはGrid State等を利用する。[^grid-state]

Advanced Filter、複雑なAND／OR、多階層のフィルター式は後回し。最初から全フィルターを処理できる汎用変換エンジンは作らない。

### 5.3 Oracleまでつなぐ段階

最初は少量データでClient-Side Row Modelを使い、グリッド自体の動作を理解する。次の段階でSSRMに切り替え、対応範囲を限定したフィルター、サーバー側ソート、必要な行範囲の取得を実装する。

```text
AG GridのfilterModel／sortModel／取得範囲
    ↓ 許可する条件と型を検証
ASP.NET Coreの検索処理
    ↓ パラメータ付きSQL
Oracleで絞り込み・並べ替え・対象行の取得
    ↓
必要なデータと件数等を返す
```

SSRMのフィルタリングはサーバー側で実装する。また、Set Filterの選択候補は、読み込まれている行だけから作らず、マスタや候補取得APIなどで別途供給する。[^ssrm]

検索APIの契約では、対応する列と演算子、null・空文字・日付の意味、最大取得件数、未知の条件へのエラー、安定した並び順を決める。同じソート値の行には一意IDなどの追加順序を与える案とする。権限の異なるデータがある設計を採用した場合は、候補APIにも同じ閲覧範囲を適用する。

### 5.4 Enterpriseの利用条件

Communityは企業・商用利用が可能であり、企業が使うからEnterprise必須という区分ではない。今回Enterpriseを使う理由は、追加機能を学ぶため。

公式ではEnterprise機能をライセンスキーなしでローカル評価でき、その場合はウォーターマークとコンソールメッセージが出る。これを不具合として消す実装はしない。デプロイや外部公開は、ローカル評価とは分けて条件を確認する。[^ag-license]

AG Gridの正確な採用バージョンは未決定。関連パッケージの互換性を確認し、固定したバージョンに対応するドキュメントを読む。

## 6. C#・.NET・ASP.NET Coreの学習方針

### 6.1 バージョンの分担

| プロジェクト案 | C# | TargetFramework | 意図 |
|---|---:|---|---|
| Api | 7.3 | net10.0 | 従来の構文でHTTP・DIなどを学ぶ |
| Application | 7.3 | net10.0 | 業務処理・検索条件・抽象化を学ぶ |
| Domain | 7.3 | net10.0 | 状態と業務ルールを学ぶ |
| Infrastructure | 7.3 | net10.0 | SQL・DB接続・リソース管理を学ぶ |
| Batch | 14.0 | net10.0 | 新しいC#も使い、一回分のバッチを組み立てる |
| テスト | 未決定 | 原則net10.0 | テスト用ライブラリに合わせて選ぶ。業務本体の制約は変えない |

`LangVersion`と`TargetFramework`は別の設定。言語バージョンはプロジェクトごとに指定でき、.NET 10の既定の言語はC# 14である。[^csharp-config][^csharp-version]

**C# 7.3で書いたnet10.0の成果物を、.NET Frameworkでそのまま動かせるとはみなさない。** 新しい.NET APIを使うこと自体は禁止しないが、言語の共通知識と実行基盤固有の知識は区別する。

APIの設定例（参照やパッケージを省略した例。実プロジェクトとしての検証は未実施）：

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <LangVersion>7.3</LangVersion>
    <Nullable>disable</Nullable>
    <ImplicitUsings>disable</ImplicitUsings>
  </PropertyGroup>
</Project>
```

バッチの設定例：

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
    <LangVersion>14.0</LangVersion>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
</Project>
```

C# 7.3側では、`Program.Main`、ブロック形式のnamespace、明示的なusing、通常のコンストラクタなどを使う。テンプレートや生成コードを含めて最初に最小ビルドを確認し、言語制約に合わないコードが入った場合は原因を特定する。解決のために無断で言語バージョンを引き上げない。

SDK、パッケージ、コンテナイメージは実際に利用できる版を確認して固定する。`LangVersion=latest`を使うと環境によって意味が変わるため、今回の比較学習では明示的な値を使う。[^csharp-config]

### 6.2 共通基盤として学ぶC#

| 分野 | 到達目標 |
|---|---|
| 型・null・コピー | 値型／参照型、参照型と参照渡し、nullableな値型、型変換を説明できる |
| class・property | フィールドとの違い、コンストラクタ、アクセス制御、static／readonlyを使い分ける |
| interface・継承 | 差し替えの目的を理解し、abstract／virtual／overrideを読める |
| Generics・コレクション | List、Dictionary、HashSet、IEnumerableと型制約を理解する |
| delegate・ラムダ | Func／Action／event、従来型の拡張メソッドを理解する |
| LINQ・列挙 | Where／Select／Any／GroupByなどに加え、遅延実行・実体化・再列挙を検証する |
| 非同期 | Task／async／await、例外伝播、CancellationTokenを扱う |
| 例外・リソース | using／IDisposable、失敗時の後始末、必要な情報を残す例外処理を実装する |
| プロジェクトの読み方 | sln／csproj／NuGet／ProjectReference／namespaceの役割を説明する |

アプリで使う理由のない継承、event、refなどは、小さな言語実験テストで補う。網羅のために本体へ不要な抽象化を増やさない。

### 6.3 新しいC#はバッチや小さな比較テストで扱う

Nullable参照型、record、init／required、switch式、using宣言、コレクション式、プライマリコンストラクタなどを候補とする。これら全部がC# 14で初登場した機能という意味ではない。C# 14固有機能まで触る場合も、採用したSDKの公式資料で確認する。

共通ライブラリを新旧二重に書かない。バッチの引数・結果の表現や処理の組み立てで新しい書き方を試す。例えば、コレクション式は型を明示した`int[] ids = [1, 2, 3];`などで試し、型を推論できない`var ids = [1, 2, 3];`とは区別する。

### 6.4 ASP.NET Coreで一巡する範囲

Controller、ルーティング、モデルバインディングと入力検証、DTO、DIとサービスの寿命、Middleware、例外とHTTPレスポンス、設定、ログ、認証・認可、APIテストを対象にする。全機能を網羅するのではなく、リクエストからDB処理・レスポンスまでを追えることを目標とする。

NestJSの概念を対応づけて説明してよい。ただし、Moduleとcsproj、GuardとMiddlewareなどを完全な一対一として扱わない。

## 7. Oracle・DBアクセス

### 7.1 構成案

Oracle Database Freeの公式Dockerイメージをローカルで使い、C#からODP.NET Core経由でSQLを実行する。Oracle公式にはOracle LinuxベースのFreeコンテナイメージがある。イメージの版・CPUアーキテクチャ・利用条件は導入前に確認する。[^oracle-free]

.NET 10対応のODP.NET Coreを選ぶ。公式の対応表では23.26.0以降が.NET 10に対応しているが、今回インストールする正確な版は未決定。DB本体とドライバのバージョンを混同しない。[^odp-requirements]

接続・検索・更新を直接書き、ORMが代わりに行う処理の原理を学ぶ。DapperやEF Coreとの比較は追加課題であり、最初から必須にしない。

### 7.2 テーブルの暫定案

| テーブル | 役割 |
|---|---|
| PART | 部品の識別情報・共通情報 |
| PART_REVISION | 改訂ごとの仕様、状態、適用日時、申請・承認情報 |
| REVISION_HISTORY | 変更・申請・承認・差し戻し・適用の履歴 |
| APP_USER | テスト利用者とロール、選択した認証方式に必要な情報 |
| BATCH_RUN | バッチの実行結果。初期段階はログ中心でもよい |

列、キー、インデックス、採番、型、日時の保持方式、マイグレーション実行方式は未確定。改訂ごとの履歴を残すべき属性をPART側だけに持たせないよう、実装時に整理する。

### 7.3 学習・レビュー対象

SELECT／JOIN／INSERT／UPDATE、検索条件、集計、主キー・外部キー・一意制約、採番、型とnull、インデックスと実行計画、トランザクションを扱う。

SQLの値はバインド変数で渡す。列名・並び順・演算子など、値としてバインドできないSQL構造は許可リストで選ぶ。クライアント入力をそのままSQLへ連結しない。[^sql-injection]

複数の更新を原子的に扱う箇所では、同一接続のトランザクションに含める。ODP.NETではトランザクションは接続を基準に扱われる。Repositoryごとに別接続を開いて「全体が一つのトランザクション」と誤認しない。[^odp-transactions]

アプリ用DB利用者と構築・管理用利用者を分ける。実環境の接続資格情報をソースへ直書きしない。Composeの固定パスワードはローカル学習用のサンプルとして扱う。テストDB・スキーマの初期化は開発・学習用の範囲に限定し、保存済みデータを無断で削除しない。

## 8. バッチ：現在の最小要件

### 8.1 採用する形

**一回起動→対象を処理→結果を出す→終了。** 一回実行は一件処理という意味ではなく、その実行の対象をまとめて処理する。

```text
設定・実行基準時刻を決める
    ↓
承認済み、かつ適用日時 <= 実行基準時刻の改訂を取得
    ↓
各対象について旧版・新版・履歴を整合する形で更新
    ↓
成功件数・失敗件数・エラー情報を残して終了
```

実行基準時刻は、一回の実行中でぶれない値にする案。通常は起動時刻を使い、テストでは指定できると便利。`--as-of`などの引数の名前や書式はまだ未実装・未決定。日時の保存基準と表示タイムゾーンも仕様化する。

定期実行を想定しても、当日分だけではなく、基準時刻以前の未適用分を対象にする案とする。過去分が残った状態を作って検証する。

### 8.2 最小の完成条件

| ID | 条件 | 期待する結果 |
|---|---|---|
| B-01 | 対象を用意して一回実行 | 適用対象だけ更新される。旧版・新版・履歴が整合する |
| B-02 | 対象なし、または適用後に同条件で再実行 | 0件で正常終了。業務上の適用履歴を重複登録しない |
| B-03 | 一つの改訂の更新途中で失敗 | その改訂の変更は取り消され、失敗を確認できる |
| B-04 | 実行結果を確認 | 対象数・成功数・失敗数と終了コードを確認できる |

暫定案では1改訂の適用を一つのトランザクションにする。失敗時に後続を続けるか全体を中断するかは、最初の実装Issueで決める。どちらでも、失敗を成功として終了しない。

BATCH_RUNの実行記録は再実行のたびに増えてよい。「実行した記録」と「同じ改訂を二重適用した履歴」を区別する。

### 8.3 今は実装しないもの

Cronos、常駐Worker、BackgroundServiceによるスケジュールループ、タスクスケジューラへの登録、Windowsサービス化、ジョブ管理製品、本番配置は対象外。

複数プロセス同時起動への堅牢な対応、分散ロック、複雑なリトライは追加検証。最小版で対応しない場合は制約を明記し、本番で安全とは主張しない。再実行時の二重適用防止は最小版でも扱う。

## 9. 認証・認可・テスト

### 9.1 認証の範囲

ログイン、現在の利用者確認、ログアウト、最小のロール分けを入れる方針。Designer／Reviewerの2ロール、初期データのテスト利用者を使う案。

CookieかTokenか、ユーザー情報をどう保持するかは未確定。認証や暗号処理は既存の仕組みを使い、パスワードの平文保存や独自ハッシュ方式は採用しない。API側で権限・状態・所有者条件を確認し、画面のボタン非表示だけで制御しない。

Cookie認証を選ぶ場合は、CSRFへの対策も設計・テスト対象にする。[^csrf]

OAuth／OIDCの詳細、SSO、多要素認証、アカウント管理画面一式は現時点の必須範囲ではない。

### 9.2 テストの分担

| 種類 | 確認する内容 |
|---|---|
| 単体テスト | 業務ルール、入力検証、状態遷移、検索条件変換、基準時刻による対象判定 |
| Oracle結合テスト | 実SQL、型・null、検索、更新と履歴、トランザクション、再実行 |
| APIテスト | 入力・認証・権限・対象なし・更新競合・正常系のレスポンス |
| UI受入確認 | Layout、Filter、状態復元、編集と保存結果、主要フロー |
| 言語実験 | コピー、LINQの実行時点、Dispose、例外、新旧構文の比較 |

xUnitは候補であり、導入バージョンや最終選択は未確定。ASP.NET CoreのAPI結合テストにはWebApplicationFactoryなどを使う方法がある。[^api-tests]

単体テストのFake／Mockが通るだけで、OracleのSQLが正しいとは判断しない。テストデータは実行ごとに識別・分離し、繰り返し実行できるようにする。CIでDBテストを実行できない段階では、未実行と明記し、ローカルでの検証方法を残す。

未認証→401、認証済み権限不足→403、対象なし→404などをAPIの候補契約とする。業務エラーや競合の具体的なコードは確定してからテストに落とす。

## 10. リポジトリと開発環境

### 10.1 モノリポの配置案

```text
factory-design-training/
├─ frontend/
├─ backend/
│  ├─ FactoryTraining.sln
│  ├─ src/
│  │  ├─ FactoryTraining.Api/
│  │  ├─ FactoryTraining.Application/
│  │  ├─ FactoryTraining.Domain/
│  │  ├─ FactoryTraining.Infrastructure/
│  │  └─ FactoryTraining.Batch/
│  └─ tests/
├─ db/
│  ├─ migrations/
│  └─ seed/
├─ docs/
│  ├─ PROJECT_CONTEXT.md
│  └─ learning-log/
├─ .github/
│  └─ workflows/
├─ compose.yaml
├─ AGENTS.md
└─ README.md
```

これは配置案であり、上記ファイルが実リポジトリに存在することは未確認。実装済み範囲は実際のファイルを確認する。

Api／Batchは入口としてApplicationを呼び、InfrastructureをDIへ登録する。Applicationは業務処理と必要な抽象を持ち、DomainはHTTPやOracleの具体型に依存しない。Infrastructureは抽象のOracle実装を持つ、という分担を候補とする。

フォルダ名をそろえること自体より、依存方向とトランザクション境界を読めることを重視する。大規模なClean Architectureや汎用Repositoryの実装を必須にしない。Nx／Turborepoも現段階では不要。

### 10.2 既知の技術との対応

| 慣れた概念 | .NET側で見るもの | 注意 |
|---|---|---|
| package.json＋tsconfig | csproj | 依存・対象フレームワーク・コンパイラ設定が集まるが完全一致ではない |
| workspaceの一覧 | sln／slnx | 複数プロジェクトをまとめる。Gitリポジトリの分割単位とは別 |
| 外部パッケージ依存 | PackageReference／NuGet | ローカルプロジェクト参照と区別する |
| workspace内依存 | ProjectReference | プロジェクト間のビルド参照 |
| import | using | usingは名前空間内の型名を短く書くための指定で、パッケージ追加そのものではない |
| NestJS main.ts | Program.cs | アプリの起動と登録処理を見る |

最初に読む順序の目安は、solution→csproj→Program.cs→設定→Controller→Service／UseCase→DBアクセス→テスト。実際のコード構成によって読み替える。

### 10.3 CLI・IDEでの注意

.NET 10の`dotnet new sln`は既定で`.slnx`を生成する。従来の`.sln`を使うなら、`dotnet new sln -n FactoryTraining --format sln`のように形式を指定する。両方の形式を重複管理する必要はない。[^solution]

.NET 10をVisual Studioで正式に対象とするにはVisual Studio 18.0以降が必要。実際に使えるIDEとSDKは導入前に確認する。C# 7.3を書くためにVisual Studio 2017を用意する必要はない。[^vs-sdk]

READMEには作業ディレクトリと対象プロジェクトを明記する。例えばバッチ起動は、上記構成を採用・作成した後なら次の形を想定する。

```sh
dotnet run --project backend/src/FactoryTraining.Batch/FactoryTraining.Batch.csproj
```

起動方法は実物で検証してから確定する。接続先、ポート、環境変数、DB準備手順、テストコマンドを未確認のまま「実行済み」と書かない。

## 11. GitHub・Codexを使う開発フロー

```text
Issueに目的と受入条件を記載
    ↓
作業ブランチ
    ↓
実装＋テスト
    ↓
小さなPR
    ↓
CI＋Codexレビュー
    ↓
指摘の検証・修正・テスト追加
    ↓
レビューと受入確認後にマージ
```

PRは、一つの確認可能な機能で切る。「状態フィルターをAG GridからOracleまで通す」など、必要ならフロント・API・SQLを一つの小さな変更にまとめる。

CIでは、ビルド、型チェック、lint、テストなど機械的に判定できる内容を扱う。具体的なコマンドはpackage.json／csprojなどを確認して設定する。

CodexのGitHubレビューにはリポジトリの接続・レビュー設定が必要で、設定後はPRコメントの`@codex review`で依頼できる。リポジトリ固有の規則は`AGENTS.md`の`Code Review Rules`などに書ける。設定済みとは未確認。[^codex]

AIレビューは開発者の理解・テスト・受入確認を置き換えない。指摘は理由を確認し、採用／見送りと根拠を残す。レビュー指摘がないことを、全機能の安全性保証にしない。

学習用の架空のコード・データを使用する。実データや実環境の資格情報は公開しない。

## 12. レビュー観点

### 12.1 レビューの原則

現行の明示的なユーザー指示、採用済み仕様・Issueの受入条件、コードと検証結果を確認する。本書の暫定案を勝手に正式仕様へ昇格しない。相違があれば「不具合」「仕様未確定」「追加提案」を分ける。

実装済みでない機能全体を、別の小さなPRの不具合として列挙しない。ただし、そのPR単体で発生するデータ破壊・権限逸脱・不正入力による危険は指摘する。

### 12.2 重点チェック

| ID | 観点 | レビューする内容 |
|---|---|---|
| RV-01 | 学習制約 | API側のC# 7.3制約を意図せず変更していないか。バッチへ同じ制限を誤適用していないか |
| RV-02 | 型と寿命 | 不要な共有状態、DIの寿命違反、接続・Reader等の解放漏れがないか |
| RV-03 | 業務状態 | 採用した状態遷移に反する更新、承認済み仕様の変更がないか |
| RV-04 | 認可 | ロール・操作者・状態の条件をAPIでも検証するか。クライアント指定の利用者情報を信用していないか |
| RV-05 | SQL入力 | 検索値のバインド、列名・演算子・ソートの許可リスト、不正条件の拒否があるか |
| RV-06 | 検索整合性 | Gridの条件がOracleまで同じ意味で届くか。null・日付・範囲・件数・並び順が一貫するか |
| RV-07 | SSRM | 読み込み済みの行だけで全件検索したことにしていないか。Set候補を独立して供給するか |
| RV-08 | Layoutと状態 | 幅・固定・非表示・保存復元・初期自動サイズ調整が競合しないか |
| RV-09 | 編集結果 | 保存失敗や競合を画面で成功扱いしていないか。禁止した編集をAPIで拒否するか |
| RV-10 | トランザクション | 対象更新と履歴が分離コミットされないか。失敗時に中途半端な状態が残らないか |
| RV-11 | バッチ再実行 | 0件・再実行・途中失敗で壊れないか。成功／失敗と終了コードが一致するか |
| RV-12 | 版管理 | 業務上の改訂番号と同時更新用番号を混同しないか。採用した一意条件を守るか |
| RV-13 | テスト | 単体テストだけで実SQLの正しさを主張しないか。異常系と境界値を確認しているか |
| RV-14 | 機密情報 | パスワード・接続資格情報・ライセンス情報・実データが不要に含まれないか |
| RV-15 | スコープ | Cronos等の不要な定期実行基盤、過剰な抽象化、未要求の機能を追加していないか |

この表は受入確認も含む詳細チェックリスト。ビルド・フォーマット・静的なルールはCIを優先し、AIのPRコメントは具体的な影響がある問題へ集中させる。

### 12.3 指摘の出し方

重要な問題から提示し、次の情報を含める。

```text
分類：不具合／仕様未確定／改善案
対象：実在するファイルと行、または仕様項目
条件：どの入力・利用者・状態で起きるか
影響：誤更新、情報漏えい、検索漏れ、処理失敗など
根拠：コード・採用済み要件・テスト結果
修正方向：必要最小限の対応
確認方法：追加すべきテストや再現手順
```

実行していないテストは「未実行」、推測は「未検証」と明記する。コードやログを見ていないのにファイル名・行番号・合格結果を作らない。学習用の改善案を、根拠なく重大障害として扱わない。

## 13. 実装の進め方と完成範囲

固定の日割りではなく、次の小さな段階で進める。期間内に足りなくなったら、業務機能を増やすより重点技術の検証を残す。

| 段階 | ゴール |
|---|---|
| M0 | リポジトリの土台、IDE／SDK確認、APIとBatchの最小ビルド、Oracle起動確認 |
| M1 | Oracle→C# API→AG Gridの一覧を一巡。状態による絞り込みを一つ通す |
| M2 | Layout、Set／Multi Filter、Tool Panel、保存復元を検証 |
| M3 | 限定したSSRMの検索・ソート・取得範囲をOracleへつなぐ |
| M4 | 最小の認証・認可と、下書き→申請→承認のフローを実装 |
| M5 | C# 14の単発バッチで適用。再実行と失敗時の整合性をテスト |
| M6 | 主要フローの受入確認、レビュー修正、READMEと学習記録の整理 |

各段階でテストとPRを作る。最後にまとめてテストを付けたり、全コードを一つのPRにしたりしない。

最低限の一連のデモは「一覧で対象を探す→改訂を作る→別ロールで承認する→バッチを手動実行→画面再取得で適用を確認→再実行で重複しないことを確認」とする案。

## 14. 明示的に後回しにするもの

多階層BOM、CADファイル管理、在庫・発注・生産計画、多段階承認、任意の業務フローエンジン、全種類のAG Gridフィルターの汎用SQL変換、SSRMでの高度な集計・ピボット、完全なスマホ専用UI、本番公開、SSO等の高度な認証、定期実行基盤、分散ジョブ制御は現在の中核ではない。


## 参考資料

以下は技術仕様の補足資料。実装時には採用バージョンに対応する仕様を確認する。

[^csharp-config]: Microsoft Learn, [Configure C# language version](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/configure-language-version).
[^csharp-version]: Microsoft Learn, [C# language versioning](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-versioning).
[^ag-license]: AG Grid, [Community vs. Enterprise](https://www.ag-grid.com/react-data-grid/community-vs-enterprise/).
[^grid-layout]: AG Grid, [Grid Layout](https://www.ag-grid.com/react-data-grid/grid-size/).
[^column-sizing]: AG Grid, [Column Sizing](https://www.ag-grid.com/react-data-grid/column-sizing/).
[^grid-state]: AG Grid, [Grid State](https://www.ag-grid.com/react-data-grid/grid-state/).
[^ssrm]: AG Grid, [SSRM Filtering](https://www.ag-grid.com/react-data-grid/server-side-model-filtering/).
[^oracle-free]: Oracle, [Oracle AI Database Free FAQ](https://www.oracle.com/database/free/faq/).
[^odp-requirements]: Oracle, [ODP.NET System Requirements](https://docs.oracle.com/en/database/oracle/oracle-database/26/odpnt/InstallSystemRequirements.html).
[^odp-transactions]: Oracle, [OracleCommand Object — Transactions](https://docs.oracle.com/en/database/oracle/oracle-database/26/odpnt/featOraCommand.html).
[^sql-injection]: OWASP, [SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html).
[^csrf]: Microsoft Learn, [Prevent CSRF attacks in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/anti-request-forgery?view=aspnetcore-10.0).
[^api-tests]: Microsoft Learn, [Integration tests in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0).
[^solution]: Microsoft Learn, [Default templates — sln](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-new-sdk-templates#sln).
[^vs-sdk]: Microsoft Learn, [.NET SDK, MSBuild, and Visual Studio versioning](https://learn.microsoft.com/en-us/dotnet/core/porting/versioning-sdk-msbuild-vs).
[^codex]: OpenAI, [Review GitHub pull requests with Codex](https://developers.openai.com/codex/integrations/github/).
