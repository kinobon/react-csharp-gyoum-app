---
name: frontend-ui-structure
description: Build and refactor React screens using feature-based folders, page/UI responsibility separation, and composition in this repository. Use when adding a screen, organizing related components and hooks, or connecting generated API clients to UI. Library-specific APIs and React 19 behavior are covered by the companion skills.
---

# Frontend UI Structure

このリポジトリで、関連ファイルを機能ごとにまとめ、データ取得と表示の責任を読み取れる画面を作る。
分割の判断は、変更範囲・状態の所有者・表示確認のしやすさに基づく。

## 配置と命名

新規の機能は`src/features/<機能名>/`へまとめる。コンポーネント・Hooks・型・表示用変換・CSS・テストなど、一緒に変更するファイルを近くに置く。小さなfeatureでは直下へ並べ、ファイルが増えてから必要なサブフォルダを作る。

```text
src/
  routes/weather.tsx
  features/weather/
    WeatherPage.tsx
    WeatherPage.ui.tsx
    weather.module.css
  api/generated/
    weather.ts
    models/
```

これは既存の天気予報画面の配置例。新しい画面へ同じファイル数や分割を強制しない。

- ページの入口は`XxxPage.tsx`、分離した表示は`XxxPage.ui.tsx`を基本例とする。利用側には通常の画面名を公開し、Containerという内部の役割を名前に必ず含める必要はない。
- 機能固有の部品はfeature内に置く。複数機能で同じ責任を共有するUIは`src/components/`、通信基盤等は既存の共通配置へ置く。将来使いそうという理由だけで共通化しない。
- 別featureの内部ファイルへの依存が増えたら、利用側が必要とする入口を定めるか、複数機能を組み合わせる親で連携する。似た見た目だけを根拠に共通の業務モデルへ統合しない。
- 旧題材の`src/parts/`や既存画面の移動は、依頼された変更に必要な範囲で行う。

## 責務の分け方

| 場所 | 担当 |
| --- | --- |
| `src/routes/` | URL・検索パラメータ・loader等のルート契約と画面の接続 |
| `XxxPage.tsx` | データ取得・更新、複数UIにまたがる状態、画面に渡す値と操作、部品の組み立て |
| `XxxPage.ui.tsx`や表示部品 | propsの表示、入力・操作イベント、レイアウト、必要なUI部品の合成 |
| `useXxx.ts` | 独立した意味を持つ状態や処理のまとまり。JSXを返さない |
| 通常の`.ts` | Reactの状態・ライフサイクルが不要な計算、変換、検証 |

APIへの依存が表示確認を難しくする、処理とレイアウトが別々に変わるなど、分離の効果がある場所でページとUIを分ける。小さな表示部品に、propsを渡すだけのContainerやHooksを一律に追加しない。

表示を分離したUIには、データ・表示状態・イベントコールバックを渡す。Query結果全体やQueryClientを渡すより、表示に必要な項目を選ぶ。API呼び出し、localStorageへの永続化、URL状態の読み書きはページ・ルート・目的に合ったHooksへ寄せる。

UIだけで完結する開閉・入力状態はUI内に保持できる。複数部品が連動する選択や開閉は、その部品を調整する最も近い親へ置く。`useState`や`useEffect`を使うこと自体をUIの責務違反にしない。フォームの状態をすべて上へ持ち上げず、送信・検証・リセットを含めた所有者を決める。

## Composition

- 共通レイアウトや表示枠が、機能固有のモーダル・フォームを知る必要がない場合に`children`や名前付きのReactNode propsを使う。ページ側で必要な部品を組み立て、UI側で配置する。
- 固定で使う表示部品は通常のimportとJSXで組み合わせてよい。すべての子を注入する規則や、render props・compound componentsの汎用基盤を先に作らない。
- Compositionは組み立てる責任と依存先を変える。描画する親子の階層やDOMの入れ子が自動的に減るとは扱わない。

## API接続と表示状態

- Orvalの生成型・取得関数・Queryフックを利用する。同じDTOや取得処理をfeature内へ手書きで複製せず、生成済みフックを呼ぶだけの独自Hooksを増やさない。
- 表示用の変換や型が必要なら、生成DTOとの対応が分かる形でfeature内へ置く。必須・null・列挙値の不一致はOpenAPIと生成設定で直し、型アサーションで隠さない。
- 生成物は手動編集しない。API変更時は[フロントのREADME](../../../apps/frontend/README.md)と実際のスクリプトに従って定義を取得・再生成する。APIの変更と画面内だけの変更を区別する。
- 初回取得中、正常な空結果、条件に一致する行なし、取得失敗、再取得中、再取得失敗を区別する。前回のデータを残す場合は更新中・最新取得失敗であることを表示する。
- 再試行できる経路を用意する。HTTP失敗がQueryの成功として扱われないか確認する。Gridの列・フィルター・状態復元は`ag-dev`と対象仕様に従い、再取得で意図せず初期化しない。

## 関連スキルと参照

Reactの取得・更新・Hooksの挙動は[react-patterns](../react-patterns/SKILL.md)、Ant Designの部品は[antd](../antd/SKILL.md)、AG Gridの列・フィルター・状態管理は[ag-dev](../ag-dev/SKILL.md)を必要に応じて参照する。

配置・接続の実例は[WeatherPage.tsx](../../../apps/frontend/src/features/weather/WeatherPage.tsx)、[WeatherPage.ui.tsx](../../../apps/frontend/src/features/weather/WeatherPage.ui.tsx)、[weatherルート](../../../apps/frontend/src/routes/weather.tsx)。現在の実装を参照し、天気予報の列やQuery設定を他機能の要件にしない。

設計の参考記事は、React全体の必須規則ではなく判断材料として読む。

- [レバテック：規模に応じたReactフォルダ構造](https://levtech.jp/media/article/column/detail_711/) — 関連ファイルを機能ごとにまとめる判断。
- [GLOBIS：UI／Container・Hooks・Composition](https://zenn.dev/globis/articles/c16eaadf3d233b) — 表示と処理の依存を分ける実践例。

APIや挙動を実装するときは、変更する項目の公式資料と採用版を確認する。

- [React：Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)、[Passing Props to a Component](https://react.dev/learn/passing-props-to-a-component)、[Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [TanStack Router：Routing Concepts](https://tanstack.com/router/latest/docs/routing/routing-concepts)
- [Orval：React Query](https://orval.dev/docs/guides/react-query/)、[Fetchの出力設定](https://orval.dev/docs/reference/configuration/output/#overridefetch)
