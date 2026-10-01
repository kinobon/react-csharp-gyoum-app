# 蔵書一覧の仕様案

更新日：2026-10-01

目的：実装者が最初の機能を作り、同じ条件でテスト・レビューできるようにする。

状態：実装前の仕様案。題材・技術制約は[PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md)に従う。以下の画面・API契約と受入条件は今回具体化した案で、実装済みや業務要件の承認済みを意味しない。着手するIssueで採用範囲と変更点を確認する。

## 利用場面と範囲

図書館の担当者が、所蔵している本と棚の場所を確認し、貸出可能な一冊を探す。同じ書籍を二冊持っていれば二行表示し、貸出中の一冊を区別する。

最初は少量の架空データをOracleから全件取得して画面に表示する。貸出可否の絞り込みは画面上で行う。サーバー側の検索・ページングとSSRMへの移行は後続の仕様で扱う。

この版には蔵書・貸出の更新操作を含めない。予約、貸出期限の計算、冊数上限、紛失・破損・除籍の運用も後続とする。初期データは通常の貸出対象となる蔵書だけに限定するため、この版の二種類の状態を図書館業務全体の状態定義とは扱わない。

認証の導入前に、ローカルの架空データで参照機能を確認する段階とする。借り手の氏名・利用者ID・貸出履歴はレスポンスに含めない。将来の公開範囲や担当者権限の仕様は別途定める。

## データの意味

一行はBookCopy、つまり実物の一冊。Bookはタイトル等の書籍情報、Loanは一回の貸出を表す。ISBNを各冊の識別子にしない。

| 項目 | APIの名前 | 表現 |
|---|---|---|
| 一冊のID | bookCopyId | 空でない文字列。一覧内で一意、再取得しても同じ一冊は同じID |
| 書籍のID | bookId | 空でない文字列。同じ書籍の複数冊で共有 |
| 蔵書番号 | accessionNumber | 表示用の番号。初期データ内で一意 |
| タイトル | title | 文字列 |
| 著者表示名 | authorDisplayName | 文字列。著者の正規化方式はこの版で確定しない |
| ジャンル | category | 文字列 |
| 棚の場所 | shelfLocation | 文字列またはnull。nullは画面で「未設定」と表示 |
| 貸出可否 | availability | availableまたはonLoan |

初期データでは、未返却のLoanがある一冊をonLoan（貸出中）、ない一冊をavailable（貸出可能）とする。過去の返却済みLoanがあるだけでは貸出中にしない。未返却なら返却期限を過ぎていても貸出中のまま。

一冊の過去の貸出が何件あっても、一行だけ返す。未返却Loanは一冊につき最大一件というモデル案に整合するfixtureを用意する。二重貸出を防ぐ更新処理と競合テストは貸出機能のIssueで扱う。

## API契約

ASP.NET Core側の経路案は`GET /book-copies`、OpenAPIのoperationId案は`GetBookCopies`。

現在のViteは`/api`を除去してバックエンドへ転送し、OrvalのbaseUrlは`/api`。この設定を使う場合、ブラウザは`GET /api/book-copies`を呼ぶ。両方に`/api`を重ねて`/api/api/book-copies`にしない。

| 条件 | HTTP | 内容 |
|---|---:|---|
| 正常取得 | 200 | 一冊ごとのJSON配列。Content-Typeはapplication/json |
| 所蔵データなし | 200 | 空配列`[]`。nullや404にしない |
| クエリパラメータが指定された | 400 | この版ではパラメータを受け付けない。検索したように見せて無視しない |
| DBへの接続不能など、識別できる一時的な取得障害 | 503 | Problem Details。空配列へ置き換えない |
| その他の予期しない失敗 | 500 | Problem Details。詳細はサーバーログで確認する |

Problem DetailsのContent-Typeは`application/problem+json`。`status`はHTTPステータスと一致させる。400の`code`は`unsupported_query`、503は`catalog_unavailable`、500は`internal_error`を案とする。title/detailへSQL、接続文字列、パスワード、例外のスタックトレースを入れない。

正常レスポンスの例：

```json
[
  {
    "bookCopyId": "copy-001",
    "bookId": "book-001",
    "accessionNumber": "C-001",
    "title": "図書館サンプルA",
    "authorDisplayName": "サンプル著者A",
    "category": "技術",
    "shelfLocation": "A-01",
    "availability": "available"
  }
]
```

APIの順序は蔵書番号の昇順、同値の場合は一冊のIDの昇順とする。取得結果を無告知で先頭N件に切らない。少量データ用の全件取得であり、大量データの性能を確認したことにはならない。

OpenAPIにも配列・必須項目・null・状態の列挙値・エラーレスポンスを反映する。生成クライアントの型と実際のJSONが一致することを確認する。

## 画面の動作

画面の経路案は`/catalog`。既存のルーティングとレイアウトから遷移できるようにする。

- 蔵書番号、タイトル、著者、ジャンル、棚の場所、貸出可否を表示する。
- AG Grid 36.2.0のClient-Side Row Modelで、APIから受け取った全行を渡す。行IDはbookCopyIdを使う。
- タイトルはText Filterの部分一致、貸出可否はSet Filterで絞り込める。両方を指定したらANDで適用し、解除すると元の行へ戻る。
- 表示ラベル「貸出可能」「貸出中」と、APIのavailable/onLoanを対応させる。ソートや列のリサイズも操作できる。
- グリッドの親領域に高さを設け、normalのDOM Layoutでスクロールできるようにする。
- 初回取得中、正常な0件、条件に一致する行が0件、取得失敗を区別する。取得失敗時は再試行できる。
- 再取得中・再取得失敗時に前回の行を残す場合は、更新中・最新取得失敗であることを表示する。成功したように見せない。
- 再取得で列幅・適用中のフィルターを意図せず初期化しない。ブラウザ再読み込み後の状態保存・復元は後続のLayout学習で扱う。

フィルターはこの版ではブラウザ内で処理するため、操作のたびにAPI検索は行わない。Set Filterは全件取得したデータを利用できる。SSRMへ移行する際は、候補取得とサーバー側検索の契約を改めて設計する。

## 確認用データ

次は期待結果を共有するための例。SQLやseedは未作成。テスト用IDは実行環境に合わせて置き換えてよい。

| 蔵書番号 | 書籍 | 貸出記録 | 期待する状態 |
|---|---|---|---|
| C-001 | サンプルA | なし | 貸出可能 |
| C-002 | サンプルA | 返却済み一件と未返却一件 | 貸出中 |
| C-003 | サンプルB | 返却済み二件 | 貸出可能 |
| C-004 | サンプルC | 期限を過ぎた未返却一件 | 貸出中 |
| C-005 | サンプルD | なし。棚の場所はnull | 貸出可能 |

全体は五行、貸出可能は三行、貸出中は二行。サンプルAのタイトル条件と貸出可能の条件を重ねるとC-001だけになる。空データのケースは別のfixtureで確認する。

## 受入条件とテスト

テスト種別と実行範囲は[TESTING.md](../TESTING.md)に従う。以下はテストケース案であり、実行結果ではない。

| ID | 条件と期待結果 | 主な確認手段 |
|---|---|---|
| CAT-01 | 正常取得が200、JSON配列、定義した型・null・状態値で返る | APIテスト |
| CAT-02 | 五冊が五行になり、同じ書籍の二冊を別IDで返す | Oracle結合テスト |
| CAT-03 | 過去の貸出が複数あっても行が増えず、現在の貸出だけで可否を判定する | Oracle結合テスト |
| CAT-04 | 期限超過の未返却も貸出中。棚のnullを保持し、順序が安定する | Oracle結合テスト |
| CAT-05 | DBが空ならSQLの結果もHTTPレスポンスも空配列 | Oracle結合テスト、APIテスト |
| CAT-06 | `?availability=available`など未対応のクエリ指定は400 | APIテスト |
| CAT-07 | 取得不能は503、予期しない失敗は500。機密情報をレスポンスへ出さない | APIテストで障害を注入 |
| CAT-08 | 実Oracleを使ったHTTP取得でfixtureの行と状態が返る | Oracleを使うAPI結合テスト |
| CAT-09 | 貸出可否とタイトルの絞り込み・解除が期待する行集合になる | 実ブラウザで受入確認 |
| CAT-10 | 初回取得中・0件・通信失敗・再取得失敗・再試行を区別できる | クライアントテスト、実ブラウザ |
| CAT-11 | 再取得後も同じ一冊のID、列幅、フィルターが維持される | 実ブラウザで受入確認 |
| CAT-12 | OpenAPIから再生成したクライアントが正しいURLを呼び、非2xxを失敗として扱う | 生成クライアントテスト、build |

## 設計とレビューの指針

上記は動作の条件。以下のクラス名・配置は実装例であり、名前が異なるだけで不具合とはしない。

| 場所の例 | 責任 |
|---|---|
| ApiのController | HTTP入力、DTO、レスポンス、例外のHTTPへの対応づけ |
| ApplicationのGetBookCopies | 一覧取得の手順、表示用DTOと検索用インターフェイス |
| InfrastructureのOracleBookCopyQuery | ODP.NETと生SQL、JOIN/EXISTS、結果のマッピング、接続等の解放 |
| フロントのページ | 生成クライアントによる取得状態の管理とグリッドへの受け渡し |

読み取りは表示用DTOへ直接投影してよい。この機能のためだけに全行を変更操作用の集約へ復元したり、汎用Repositoryを先に作ったりする必要はない。貸出・返却を追加するときに、集約と保存用Repositoryの責任を具体化する。

レビューでは、一行の意味、過去の貸出による重複、HTTPとJSONの契約、障害の握りつぶし、生成クライアントと経路の一致、テストの実行範囲を確認する。C# 7.3、net10.0、Oracleへの生SQLという制約を守る。未実装の認証・貸出更新・SSRMをこのIssueの不具合として無制限に追加しない。

## 参考資料

- [既存のドメインモデル](../modeling/domain-model.md)
- [Zenn リポジトリ](https://zenn.dev/yamachan0625/books/ddd-hands-on/viewer/chapter12_repository)
- [Zenn アプリケーションサービスとDTO](https://zenn.dev/yamachan0625/books/ddd-hands-on/viewer/chapter13_application_service)
- [Microsoft 取得処理と集約の永続化](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-design)
- [AG Grid Row Models](https://www.ag-grid.com/react-data-grid/row-models/)（確認時の表示版36.2.0）
