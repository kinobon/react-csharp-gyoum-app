---
name: react-patterns
description: Implement, debug, and review React 19 Actions, forms, optimistic updates, use/Suspense, and React Compiler behavior in TypeScript. Use when choosing or combining React Actions and TanStack Query mutations. Check the actual runtime and dependencies first; UI-library-only styling and backend-only work are outside this skill.
---

# React 19 Patterns

React 19の実装・レビューで、採用環境に合うAPIと状態管理を選ぶ。
新しいHooksやライブラリの使用自体を目的にしない。

## 適用前の確認

1. リポジトリの指示・対象Issueと、対象コンポーネント・API呼び出しを読む。このリポジトリではルートの`docs/PROJECT_CONTEXT.md`と`docs/WORKFLOW.md`を前提とする。
2. `package.json`、ロックファイル、必要ならインストール済みパッケージで、React・型定義・TypeScript・TanStack Queryの実バージョンを確認する。依存への追加と、Provider・画面での利用開始を区別する。
3. Vite等のビルド設定、React Compilerの有効化、TypeScript・lint設定、実在する検証コマンドを確認する。React 19を使っているだけでCompilerが動くとは判断しない。
4. SPA、SSR、RSC／Server Functions対応環境を区別する。このリポジトリのVite＋C# API構成へ、Server FunctionsやNext.js固有の再検証APIを前提にした実装を持ち込まない。
5. 以下のうち変更する項目の公式資料を開く。リンク先の現行仕様と採用バージョンが異なる場合は、該当版の資料・型定義・リリース情報で確かめる。未確認のAPIを利用可能と断定しない。

AG GridのAPI・列・データ連携を変更するときは既存の[ag-dev](../ag-dev/SKILL.md)、Ant Designのコンポーネント・Form・tokensを扱うときは[antd](../antd/SKILL.md)も適用する。このスキルだけで各ライブラリ固有の契約を判断しない。

## 更新処理の選択

最初に「サーバー由来のデータをどこが保持し、成功後に何を更新するか」を確認する。

| 状況 | 判断の目安 |
| --- | --- |
| 対象データを既存のTanStack Queryで管理している | mutationとキャッシュ更新を既存方針にそろえる。フォームからの更新にも使える |
| フォーム送信の結果・pendingを局所的に扱う | Reactのform actionとuseActionStateを候補にする |
| ActionsとQueryを組み合わせる理由がある | フォーム状態とキャッシュの責任を分け、通信・楽観的更新・エラー表示を二重実装しない |
| 小さな既存イベント処理で要件を満たす | 新しいHooksや依存の導入を必須にしない |

フォームかボタンかだけでライブラリを決めない。Ant Design等のフォームを使う場合は、その送信・検証経路を確認し、HTML form actionの例を機械的に当てはめない。

## React Actionsとフォーム

- `<form action={fn}>`へ直接渡す関数はFormDataを受け取る。`useActionState`へ渡す関数は`(previousState, formData)`を受け取り、次の状態を返す。同じ一引数関数をそのまま使い回さない。
- `useActionState`の初期状態と戻り値を同じ型にそろえる。状態を返す非同期関数をform actionへ直接渡す例は避け、採用したReact型定義と照合する。
- `formData.get()`はstring・File・nullになり得る。`as string`を入力検証の代わりにせず、必要な型・長さ・業務条件を確認する。API側の検証・認可も必要である。
- 想定内の入力・業務エラーは状態等で表示し、予期しない例外の表示経路も用意する。エラーオブジェクトを返すだけで画面が自動表示するとは扱わない。
- HTMLの制約検証、クライアントの業務検証、API側の検証を区別する。Actions自体に業務バリデーションが組み込まれているとは説明しない。
- uncontrolledなフォーム項目の自動リセットに注意する。エラー状態を返して正常にresolveする場合も含め、失敗時に入力を保持できるか確認する。
- form actionはTransition内で実行される。`useActionState`のdispatchや楽観的更新を手動で呼ぶ場合は、必要なAction／`startTransition`の文脈を確認する。`await`後のstate更新をTransitionに含める方法は採用版の仕様に従う。
- 更新後の再取得・キャッシュ無効化・一覧への反映を明示する。React Actions一般に自動のデータ再検証があるとは説明しない。
- `'use server'`はServer Functions対応環境向けの指示であり、SPAのAPI呼び出しや通常のSSRを自動的にサーバー処理へ変換しない。

公式資料：[form](https://react.dev/reference/react-dom/components/form)、[useActionState](https://react.dev/reference/react/useActionState)、[startTransition](https://react.dev/reference/react/startTransition)、[use server](https://react.dev/reference/rsc/use-server)。

## 楽観的更新

- 楽観的表示は処理中の仮表示であり、保存成功の確定表示と区別する。業務上、先に成功したように見せるのが不適切ならpending表示を選ぶ。
- `useOptimistic(baseState, updateFn)`のupdateFnを純粋に保つ。仮ID・時刻は送信処理で生成して渡し、updateFn内で`Date.now()`や乱数を使わない。
- Actionの成功時に正式なレスポンスをbaseStateへ反映するか、元データの取得元を更新する。仮表示だけ追加して、処理終了後も元データを古いままにしない。
- 失敗時の仮表示の取り消し、エラー表示、再試行時の入力保持を設計する。通信中断をサーバー更新の取り消しとみなさない。
- Queryの楽観的更新はUIだけの仮表示とキャッシュ変更から選ぶ。キャッシュ変更時は必要な取得キャンセル、ロールバック、再取得を設計する。同時更新を許す場合、古いスナップショットの復元で後続の成功結果を消さない。
- ReactとQueryの両方で同じ行の楽観的追加を行わない。仮IDと正式IDを対応させ、重複表示を防ぐ。

公式資料：[useOptimistic](https://react.dev/reference/react/useOptimistic)、[TanStack Query optimistic updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)。

## TanStack Queryで取得・更新する場合

- 対象版のQueryClient／Providerと既存のキー設計を確認する。利用開始が未実装なら、その作業を対象機能に必要な範囲で扱う。
- queryKeyに取得対象と結果を変える条件を含める。異なる対象を取得する汎用コンポーネントで固定の`['data']`を共有しない。
- 読み込み・取得エラー・空結果・再取得中を区別する。`if (!data)`で全状態を判定せず、正常値の`0`・`false`等を読み込み中として扱わない。
- mutation成功時はレスポンスによるキャッシュ更新か、関連queryのinvalidate／再取得を選ぶ。更新した一覧・詳細がどう同期するかを明確にする。
- 再取得までpendingに含める設計では、コールバックからinvalidateのPromiseをreturn／awaitする。保存成功後の再取得失敗と保存自体の失敗を区別する。
- `mutateAsync`の例外は呼び出し元で処理するなど、選んだ呼び出し方法に合うエラー経路を用意する。

公式資料：[query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)、[invalidations from mutations](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)、[mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)。

## useとSuspense

- クライアントで`use(promise)`を使う場合、同じ取得対象のPromiseを再レンダー間で安定させる。毎回新しいPromiseを返すfetch処理をレンダー中に呼ぶ例を作らない。
- 親からPromiseを渡すだけではキャッシュにならない。既存のローダーやSuspense対応データ取得機構を確認する。初回サスペンドをまたぐ保持を、コンポーネント内のuseMemoだけで保証しない。
- pending用のSuspenseと、Promise拒否時のエラー表示を用意する。単純なSPAの取得へ、新しいキャッシュ機構を目的なく追加しない。
- `use(context)`とPromiseの読み取りを区別する。`use`には条件分岐・ループ内で呼べる例外があるが、通常のHooksへその例外を広げない。

公式資料：[use](https://react.dev/reference/react/use)、[Suspense](https://react.dev/reference/react/Suspense)。

## Compiler・コンポーネント・型

- レンダーとHooksを純粋に保ち、props・stateを直接変更しない。表示用の派生値はレンダーで計算し、不要なEffectと二重のstateに置き換えない。
- 通常のクライアントコンポーネントのpropsすべてにシリアライズ可能性を要求しない。サーバー／クライアント境界の制約と区別する。
- Compilerが有効でも、既存のmemo・useMemo・useCallbackを一括削除しない。手動最適化は測定結果や外部ライブラリの参照安定性の契約に基づいて判断する。
- DevToolsの最適化表示に加え、必要に応じて設定・診断・生成コードを確認する。バッジがないことだけでコード違反と断定しない。
- `'use no memo'`は問題の切り分けに限定して使い、理由を残す。関数先頭ならその関数、モジュール先頭ならファイル全体に影響する。根本原因を解消した後に解除を検討する。
- compositionは既存UIの部品に合わせる。compound components、render props、汎用DataLoader等を標準形として強制しない。
- Error Boundaryを自作する場合はクラス、または既存ライブラリを使う。通常のイベントハンドラーや独立した非同期処理の例外をすべて捕捉できるとはみなさず、Actions／Transitionの例外経路は各APIで確認する。
- TypeScriptの実設定に合わせる。`verbatimModuleSyntax`環境ではReactNode・ErrorInfo等を`import type`で読み、Reactの公開型を利用する。

公式資料：[purity](https://react.dev/reference/rules/components-and-hooks-must-be-pure)、[Compiler introduction](https://react.dev/learn/react-compiler/introduction)、[Compiler installation](https://react.dev/learn/react-compiler/installation)、[use no memo](https://react.dev/reference/react-compiler/directives/use-no-memo)、[Component / Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)。

## 完了時の確認

実装を変更した場合は、実在する型チェック・build・lintと、変更した挙動に必要な検証を行う。レビューだけの場合に設定や依存を変更しない。

変更内容に応じて、次の観点から必要なものを確認する。

- 送信中・成功・入力エラー・通信失敗が表示に反映され、失敗を成功表示にしない。
- 楽観的な行が成功後も正式な行として残り、失敗時は仮表示を解消できる。
- 取得対象・検索条件の切り替えでキャッシュが混ざらず、古い結果が新しい対象として表示されない。
- 親の再レンダーで不要な通信やSuspenseへの戻りが発生しない。
- 連続送信・並行更新を扱う機能では、順序の逆転や取り消しが別の更新結果を壊さない。

結果は変更理由、参照した公式資料、実行した検証と未検証の範囲を短く報告する。レビューでは不具合・仕様未確定・改善案を区別する。
