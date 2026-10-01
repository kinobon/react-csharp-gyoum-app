# テスト方針とレビューで確認すること

更新日：2026-10-01

APIテストを含め、実装する機能ごとに自動テストを追加する方針案。テストを最後の別工程にせず、各Issueの受入条件を実装と同じ変更で確認する。最初の対象は[蔵書一覧](specs/catalog-list.md)。

## 現在の確認状況

2026-10-01にローカルのファイルを確認した。以下はコードの存在を確認した結果であり、この文書作成時のテスト成功結果ではない。作業中の変更を含むため、コミット済みの状態とは区別する。

- BackendはFactoryTraining.Apiがあり、net10.0、LangVersion 7.3、通常のProgram.Main。バックエンドのテストプロジェクトはまだない。
- Frontendには`test:api`スクリプトと`weather-api.test.mjs`がある。生成クライアントとTanStack Queryに正常値・空配列・非2xx・通信例外を渡すテストで、fetchを差し替えている。
- 上記のクライアントテストは、実ASP.NET CoreやOracleの動作確認を含まない。
- `build`、`lint`、OpenAPI取得・Orval生成のスクリプトがある。GitHub Actionsの定義はまだない。

## テストの分担

| 種類 | 動かすもの | 確認すること | 導入時期 |
|---|---|---|---|
| 単体テスト | 業務ルール・値オブジェクト・独立した変換処理 | 正常系、拒否条件、境界値 | そのロジックを実装するとき |
| APIテスト | 実ASP.NET Coreの起動処理・ルーティング・Controller・JSON変換。DBアクセス部分はFake | HTTP、入力、空結果、エラー、DTO | 最初から |
| Oracle結合テスト | 実ODP.NET・実SQL・テスト用Oracle | JOIN、null、重複、並び順、後続では更新・ロールバック | SQL実装と同時 |
| Oracleを使うAPI結合テスト | 実APIから実SQLまで | DIや接続設定も含む代表経路 | 蔵書一覧で少数追加 |
| クライアントテスト | 生成クライアントと取得状態。HTTP応答はFake | URL、正常値、空配列、非2xx、通信例外、再取得 | 接続する画面ごと |
| ブラウザでの受入確認 | 実ブラウザとAG Grid | 表示、フィルター、列幅、読込・失敗表示 | 画面実装と同時 |

APIテストでは、Controllerのメソッドを直接呼ぶだけで終えず、WebApplicationFactoryが起動したTestServerへHttpClientで要求を送る。外部でAPIプロセスを起動する必要はないが、TCP・開発用HTTPS証明書・Vite proxyまで通るテストではない。その接続は実ブラウザで確認する。

APIテストが通ったことだけではOracleのSQLを保証しない。Oracleを使うテストを実行できなかった場合は、APIのFakeテストの成功と分けて未実行と記録する。

## .NETの構成案

テストフレームワークの推奨案はxUnit.net v3の安定版。APIにはMicrosoft.AspNetCore.Mvc.Testingの10.0系を使う。正確な版とテストランナーは、テスト基盤のIssueで復元・検出・実行を確認して固定する。公式記事のプレビュー版指定をそのまま採用しない。

| プロジェクトの候補 | 用途 |
|---|---|
| tests/FactoryTraining.ApiTests | Oracle不要のAPIテスト |
| tests/FactoryTraining.OracleTests | Oracleを使う検索と代表的なAPI結合テスト |
| tests/FactoryTraining.UnitTests | 業務ロジックができた段階の単体テスト |

配置基準は`apps/backend/FactoryTraining/`。上記のtests配下のプロジェクトはまだ存在しない。必要になったものから追加し、空のテストプロジェクトや常に成功するだけのテストを作らない。

テスト側はnet10.0・C# 14を推奨案とし、業務本体のApi/Application/Domain/InfrastructureはC# 7.3を維持する。テストの構文に引きずられて本体のLangVersionを上げない。

xUnitの世代とMicrosoft Testing Platform/VSTestの選択により、パッケージやdotnet testの設定が異なる。テンプレートが生成するglobal.jsonも確認する。導入Issueには、採用したランナー、正確なコマンド、検出・成功・失敗・スキップ件数を残す。

## 最初のAPIテスト

テスト基盤では、既存WeatherForecast APIに対して200、JSONの形、temperatureFとtemperatureCの対応を確認する。乱数で変わる天気や日付を固定値として期待しない。空のAssert.True(true)を完成条件にしない。

蔵書一覧ではCAT-01/05/06/07を自動化する。テスト用の一覧取得サービスをDIで差し替え、通常データ・空配列・識別可能な取得不能・予期しない例外を決定的に発生させる。ルーティング・JSON変換・例外応答処理は実物を使う。

HTTPSのリダイレクトで本来の結果を隠さないよう、テスト用HttpClientのBaseAddressとリダイレクト設定を明示する。テスト専用の経路で成功させず、実際に公開する経路を呼ぶ。認証を追加する段階では、未認証401・権限不足403・他人のデータへのアクセス拒否を追加する。

## Oracle結合テスト

蔵書一覧ではCAT-02/03/04/05と、APIから実Oracleまで通すCAT-08を対象とする。同一書籍の複数冊、過去の貸出が複数ある一冊、未返却、棚のnullを用意する。

- 明示的に指定したテスト専用スキーマを使う。開発アプリのデータと分け、接続設定をソースやログへ露出させない。
- fixtureが作成したレコードをIDで記録し、そのレコードだけを後始末する。スキーマ全体のDROP/TRUNCATEや開発データの無条件DELETEを行わない。
- 全件・0件のケースは既知の空のテスト用領域から開始する。想定外の既存データがあれば自動削除せず準備エラーにする。
- 最初はOracleテスト群を直列実行し、同じテスト用スキーマを複数の実行で同時利用しない。
- Oracleテストを明示的に実行したのに設定不足・DB停止だった場合は、成功扱いや無言のスキップにしない。準備失敗を表示する。

貸出・返却を追加するときに、二重貸出、同じ返却の再送、過去のLoanIdによる誤返却、途中失敗のロールバックを追加する。モックの呼出回数だけでトランザクションや同時実行が正しいと判断しない。

## フロントとブラウザ

既存のnode:testによるクライアントテストを活用し、蔵書一覧のURL・正常値・空配列・非2xx・通信例外・再取得を追加する。生成コードの手修正は避け、OpenAPIとOrval設定から直す。

AG Gridのレイアウトと操作は実ブラウザで確認する。公式にもjsdomのレイアウト等の制限が記載されているため、DOMのモックだけで列幅や仮想スクロールを確認済みとは扱わない。

初回はCAT-09/10/11の手順と実行結果をPRに残す。画面が固まった段階でPlaywrightによる少数のブラウザテストを追加する案とし、初回から全操作の自動化を必須にしない。APIを差し替えるブラウザテストと、実Oracleまでつなぐ受入確認も区別する。

## CIとローカル実行

CIの初期案はフロントのbuild/lint/クライアントテスト、バックエンドのbuildとOracle不要のAPI・単体テスト。Oracle結合テストはまずローカルで実行し、PRに結果を残す。CIが緑でもOracle未検証なら明記する。

現在定義されているフロントのコマンドは、`apps/frontend`での`pnpm build`、`pnpm lint`、`pnpm test:api`。この文書作成時には実行していない。

バックエンドのテストコマンドは、プロジェクトとランナーを追加してから確定する。Oracle不要のテストとOracleが必要なテストを別コマンドで実行できるようにする。CIでテスト0件を成功として見落とさない。

## レビューで求める証拠

1. Issueの受入条件と、確認したテストケースの対応が分かる。
2. 実行コマンド・対象・結果・未実行の範囲が分かる。
3. 正常系に加え、その変更で重要な空結果・境界・失敗を確認している。
4. テストの期待値が仕様に基づき、実装の計算式やSQLを写しただけになっていない。
5. Fakeの成功を実Oracleの成功と取り違えず、DBや時刻への依存を制御している。

カバレッジ率の目標は今は設けない。蔵書一覧のために貸出ルールのテストを先回りして増やさず、貸出機能の実装時に追加する。テストのためだけに公開メソッドや共通基盤を増やさない。

## 参考資料

- [Microsoft ASP.NET Coreの統合テスト](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0)
- [xUnit.net v3 Getting Started](https://xunit.net/docs/getting-started/v3/getting-started)
- [AG Grid Testing](https://www.ag-grid.com/react-data-grid/testing/)（確認時の表示版36.2.0）
- [Zenn リポジトリとテスト](https://zenn.dev/yamachan0625/books/ddd-hands-on/viewer/chapter12_repository)
