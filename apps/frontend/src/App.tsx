import { useMemo, useRef, useState } from "react";
import { Button, ConfigProvider, Descriptions, Drawer, Input, Tabs, Tag } from "antd";
import jaJP from "antd/locale/ja_JP";
import { AgGridProvider, AgGridReact } from "ag-grid-react";
import { AllCommunityModule, enableDevValidations, themeQuartz } from "ag-grid-community";
import type { ColDef, GetRowIdParams, ICellRendererParams, SideBarDef } from "ag-grid-community";
import { AllEnterpriseModule } from "ag-grid-enterprise";
import { AG_GRID_LOCALE_JP } from "@ag-grid-community/locale";
import "./App.css";

type RevisionStatus = "適用中" | "申請中" | "承認済" | "下書き" | "旧版";
type StatusView = "all" | RevisionStatus;

interface PartRevision {
  id: string;
  partCode: string;
  name: string;
  revision: number;
  category: string;
  material: string;
  weight: number;
  status: RevisionStatus;
  effectiveDate: string | null;
  owner: string;
  updatedDate: string;
  changeReason: string;
}

interface GridContext {
  openDetails: (revision: PartRevision) => void;
}

// 架空の評価用データ。業務ルールやAPIの正式な仕様を定義するものではない。
const mockRevisions: PartRevision[] = [
  {
    id: "P-1001-3",
    partCode: "P-1001",
    name: "駆動シャフト",
    revision: 3,
    category: "駆動部品",
    material: "S45C",
    weight: 1.24,
    status: "申請中",
    effectiveDate: "2026-10-08",
    owner: "佐藤 美咲",
    updatedDate: "2026-10-01",
    changeReason: "加工工程の見直しに伴い、端部の形状と重量を変更。",
  },
  {
    id: "P-1002-2",
    partCode: "P-1002",
    name: "ベアリングハウジング",
    revision: 2,
    category: "支持部品",
    material: "ADC12",
    weight: 0.38,
    status: "適用中",
    effectiveDate: "2026-09-20",
    owner: "田中 健太",
    updatedDate: "2026-09-20",
    changeReason: "取り付け穴の公差を見直し、組み付け精度を改善。",
  },
  {
    id: "P-1003-1",
    partCode: "P-1003",
    name: "固定プレート",
    revision: 1,
    category: "支持部品",
    material: "SS400",
    weight: 2.85,
    status: "承認済",
    effectiveDate: "2026-10-03",
    owner: "鈴木 遥",
    updatedDate: "2026-09-30",
    changeReason: "新規設備向けの固定プレートを登録。",
  },
  {
    id: "P-1004-4",
    partCode: "P-1004",
    name: "搬送ローラー",
    revision: 4,
    category: "駆動部品",
    material: "SUS304",
    weight: 3.6,
    status: "下書き",
    effectiveDate: null,
    owner: "佐藤 美咲",
    updatedDate: "2026-10-01",
    changeReason: "耐食性向上のため、材質と表面処理を検討中。",
  },
  {
    id: "P-1005-2",
    partCode: "P-1005",
    name: "ガイドレール",
    revision: 2,
    category: "支持部品",
    material: "A6061",
    weight: 1.8,
    status: "適用中",
    effectiveDate: "2026-09-15",
    owner: "高橋 翔",
    updatedDate: "2026-09-15",
    changeReason: "搬送ストロークの変更に合わせて全長を変更。",
  },
  {
    id: "P-1006-3",
    partCode: "P-1006",
    name: "接続ブラケット",
    revision: 3,
    category: "締結部品",
    material: "SS400",
    weight: 0.65,
    status: "申請中",
    effectiveDate: "2026-10-10",
    owner: "田中 健太",
    updatedDate: "2026-09-30",
    changeReason: "接続位置の変更に伴い、取り付け穴を追加。",
  },
  {
    id: "P-1007-1",
    partCode: "P-1007",
    name: "保護カバー",
    revision: 1,
    category: "外装部品",
    material: "SUS304",
    weight: 0.42,
    status: "承認済",
    effectiveDate: "2026-10-05",
    owner: "鈴木 遥",
    updatedDate: "2026-09-29",
    changeReason: "安全対策として回転部の保護カバーを追加。",
  },
  {
    id: "P-1008-2",
    partCode: "P-1008",
    name: "六角スペーサー",
    revision: 2,
    category: "締結部品",
    material: "S45C",
    weight: 0.09,
    status: "適用中",
    effectiveDate: "2026-09-18",
    owner: "高橋 翔",
    updatedDate: "2026-09-18",
    changeReason: "組み付け時の高さ調整のため、寸法を変更。",
  },
  {
    id: "P-1009-1",
    partCode: "P-1009",
    name: "センサーマウント",
    revision: 1,
    category: "支持部品",
    material: "A6061",
    weight: 0.24,
    status: "下書き",
    effectiveDate: null,
    owner: "佐藤 美咲",
    updatedDate: "2026-09-29",
    changeReason: "位置検出センサーの新規取り付け部品を検討中。",
  },
  {
    id: "P-1010-2",
    partCode: "P-1010",
    name: "テンションアーム",
    revision: 2,
    category: "駆動部品",
    material: "S45C",
    weight: 1.56,
    status: "申請中",
    effectiveDate: "2026-10-12",
    owner: "高橋 翔",
    updatedDate: "2026-09-28",
    changeReason: "ベルト張力の調整範囲を拡大するため、形状を変更。",
  },
  {
    id: "P-1001-2",
    partCode: "P-1001",
    name: "駆動シャフト",
    revision: 2,
    category: "駆動部品",
    material: "S45C",
    weight: 1.32,
    status: "適用中",
    effectiveDate: "2026-09-10",
    owner: "佐藤 美咲",
    updatedDate: "2026-09-10",
    changeReason: "軸受けの変更に伴い、外径を調整。",
  },
  {
    id: "P-1006-2",
    partCode: "P-1006",
    name: "接続ブラケット",
    revision: 2,
    category: "締結部品",
    material: "SS400",
    weight: 0.68,
    status: "旧版",
    effectiveDate: "2026-08-22",
    owner: "田中 健太",
    updatedDate: "2026-09-01",
    changeReason: "旧設備用の接続ブラケット。現在は参照用として保管。",
  },
];

const statuses: RevisionStatus[] = ["適用中", "申請中", "承認済", "下書き", "旧版"];
const statusColors: Record<RevisionStatus, string> = {
  適用中: "green",
  申請中: "gold",
  承認済: "blue",
  下書き: "default",
  旧版: "default",
};
const statusCount = (status: RevisionStatus) =>
  mockRevisions.filter((row) => row.status === status).length;
const fontFamily = '"Noto Sans JP", "Yu Gothic", "Meiryo", sans-serif';

// TODO: 実装する機能が固まったら、必要なモジュールだけに絞る。
const gridModules = [AllCommunityModule, AllEnterpriseModule];
if (import.meta.env.DEV) enableDevValidations();

const gridTheme = themeQuartz.withParams({
  accentColor: "#2563eb",
  backgroundColor: "#ffffff",
  foregroundColor: "#334155",
  headerBackgroundColor: "#f8fafc",
  headerTextColor: "#64748b",
  borderColor: "#e7ecf2",
  rowHoverColor: "#f0f6ff",
  fontFamily,
  fontSize: 13,
  headerFontSize: 12,
  headerHeight: 44,
  rowHeight: 49,
  cellHorizontalPadding: 18,
  wrapperBorderRadius: 0,
  browserColorScheme: "light",
});
const defaultColDef: ColDef<PartRevision> = {
  sortable: true,
  resizable: true,
  filter: "agTextColumnFilter",
  minWidth: 110,
};
const sideBar: SideBarDef = {
  toolPanels: [
    {
      id: "columns",
      labelDefault: "列",
      labelKey: "columns",
      iconKey: "columns",
      toolPanel: "agColumnsToolPanel",
      toolPanelParams: {
        suppressRowGroups: true,
        suppressValues: true,
        suppressPivots: true,
        suppressPivotMode: true,
      },
    },
    {
      id: "filters",
      labelDefault: "フィルター",
      labelKey: "filters",
      iconKey: "filter",
      toolPanel: "agFiltersToolPanel",
    },
  ],
};
const getRowId = (params: GetRowIdParams<PartRevision>) => params.data.id;

type IconName = "parts" | "check" | "clock" | "search" | "download" | "columns" | "reset" | "arrow";
const iconPaths: Record<IconName, string> = {
  parts: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  check: "M9 12l2 2 4-4 M9 4H5v16h14V4h-4 M9 3h6v4H9z",
  clock: "M12 8v4l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  search: "M21 21l-5-5 M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0",
  download: "M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5",
  columns: "M3 4h18v16H3z M9 4v16 M15 4v16",
  reset: "M3 10a9 9 0 1 1 1 7 M3 4v6h6",
  arrow: "M5 12h14 M14 7l5 5-5 5",
};
function Icon({ name }: { name: IconName }) {
  return (
    <svg
      className="ui-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={iconPaths[name]} />
    </svg>
  );
}
function PartCodeCell(params: ICellRendererParams<PartRevision, string, GridContext>) {
  const row = params.data;
  return row ? (
    <button
      className="part-link"
      type="button"
      onClick={() => params.context.openDetails(row)}
      aria-label={`${row.partCode} Rev.${row.revision}の詳細`}
    >
      {row.partCode}
      <Icon name="arrow" />
    </button>
  ) : null;
}
function StatusCell(params: ICellRendererParams<PartRevision, RevisionStatus>) {
  return params.value ? (
    <Tag color={statusColors[params.value]} variant="filled" className="status-tag">
      <span className="status-dot" />
      {params.value}
    </Tag>
  ) : null;
}

const columnDefs: ColDef<PartRevision>[] = [
  { field: "partCode", headerName: "品番", width: 150, pinned: "left", cellRenderer: PartCodeCell },
  { field: "name", headerName: "品名", flex: 1, minWidth: 195 },
  {
    field: "revision",
    headerName: "Rev.",
    width: 85,
    minWidth: 85,
    filter: "agNumberColumnFilter",
    valueFormatter: ({ value }) => `Rev.${value}`,
  },
  {
    field: "status",
    headerName: "状態",
    width: 135,
    filter: "agSetColumnFilter",
    cellRenderer: StatusCell,
    filterParams: { values: statuses },
  },
  { field: "category", headerName: "区分", width: 125, filter: "agSetColumnFilter" },
  { field: "material", headerName: "材質", width: 115, filter: "agSetColumnFilter" },
  {
    field: "weight",
    headerName: "重量 (kg)",
    width: 120,
    filter: "agNumberColumnFilter",
    cellClass: "numeric-cell",
    valueFormatter: ({ value }) => (typeof value === "number" ? value.toFixed(2) : ""),
  },
  {
    field: "effectiveDate",
    headerName: "適用予定日",
    width: 145,
    cellDataType: "dateString",
    filter: "agDateColumnFilter",
    valueFormatter: ({ value }) => value ?? "未設定",
  },
  { field: "owner", headerName: "担当者", width: 130 },
  {
    field: "updatedDate",
    headerName: "更新日",
    width: 140,
    cellDataType: "dateString",
    filter: "agDateColumnFilter",
  },
];

function App() {
  const gridRef = useRef<AgGridReact<PartRevision>>(null);
  const [query, setQuery] = useState("");
  const [statusView, setStatusView] = useState<StatusView>("all");
  const [selectedRevision, setSelectedRevision] = useState<PartRevision | null>(null);
  const [displayedCount, setDisplayedCount] = useState(mockRevisions.length);
  const [gridReady, setGridReady] = useState(false);
  const rowData = useMemo(
    () =>
      statusView === "all"
        ? mockRevisions
        : mockRevisions.filter((row) => row.status === statusView),
    [statusView],
  );
  const context = useMemo<GridContext>(() => ({ openDetails: setSelectedRevision }), []);
  const resetView = () => {
    setQuery("");
    setStatusView("all");
    gridRef.current?.api.setFilterModel(null);
    gridRef.current?.api.resetColumnState();
    gridRef.current?.api.closeToolPanel();
  };
  const metrics: {
    label: string;
    value: number;
    note: string;
    status: StatusView;
    icon: IconName;
    color: string;
  }[] = [
    {
      label: "登録部品",
      value: new Set(mockRevisions.map((row) => row.partCode)).size,
      note: `${mockRevisions.length}件の改訂を管理`,
      status: "all",
      icon: "parts",
      color: "blue",
    },
    {
      label: "適用中",
      value: statusCount("適用中"),
      note: "現在使用されている仕様",
      status: "適用中",
      icon: "check",
      color: "green",
    },
    {
      label: "申請中",
      value: statusCount("申請中"),
      note: "承認の確認が必要な改訂",
      status: "申請中",
      icon: "check",
      color: "amber",
    },
    {
      label: "適用待ち",
      value: statusCount("承認済"),
      note: "承認済み・適用予定日待ち",
      status: "承認済",
      icon: "clock",
      color: "purple",
    },
  ];
  return (
    <ConfigProvider
      locale={jaJP}
      theme={{
        token: {
          colorPrimary: "#2563eb",
          fontFamily,
          borderRadius: 6,
          controlHeight: 36,
          colorText: "#334155",
        },
      }}
    >
      <AgGridProvider modules={gridModules}>
        <div className="app-shell">
          <aside className="sidebar">
            <a className="brand" href="#main">
              <span className="brand-mark">
                <Icon name="parts" />
              </span>
              <span>
                PARTS<span className="brand-subtitle">仕様・改訂管理</span>
              </span>
            </a>
            <div className="workspace">
              <span className="workspace-avatar">F</span>
              <div>
                <strong>Factory Workspace</strong>
                <span>設計部門</span>
              </div>
              <span className="workspace-chevron">⌄</span>
            </div>
            <span className="nav-caption">WORKSPACE</span>
            <nav className="navigation" aria-label="管理メニュー">
              {(
                [
                  {
                    label: "部品・改訂一覧",
                    status: "all",
                    icon: "parts",
                    count: mockRevisions.length,
                  },
                  {
                    label: "承認待ち",
                    status: "申請中",
                    icon: "check",
                    count: statusCount("申請中"),
                  },
                  {
                    label: "適用待ち",
                    status: "承認済",
                    icon: "clock",
                    count: statusCount("承認済"),
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.status}
                  type="button"
                  aria-label={item.label}
                  className={`nav-item ${statusView === item.status || (item.status === "all" && statusView !== "申請中" && statusView !== "承認済") ? "is-active" : ""}`}
                  onClick={() => setStatusView(item.status)}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                  <span className="nav-count">{item.count}</span>
                </button>
              ))}
            </nav>
            <div className="sidebar-note">
              <span className="environment-dot" />
              デモワークスペース<p>架空の部品データで画面を確認できます。</p>
            </div>
            <div className="sidebar-user">
              <span className="user-avatar">設</span>
              <div>
                <strong>設計担当者</strong>
                <span>モックユーザー</span>
              </div>
            </div>
          </aside>
          <div className="main-shell">
            <header className="topbar">
              <div className="breadcrumbs">
                <span>ワークスペース</span>
                <span className="breadcrumb-divider">/</span>
                <strong>部品・改訂一覧</strong>
              </div>
              <Tag className="demo-tag" color="blue" variant="filled">
                モック環境
              </Tag>
            </header>
            <main id="main" className="main-content">
              <div className="page-heading">
                <div>
                  <p className="eyebrow">PARTS & REVISIONS</p>
                  <h1>部品・改訂一覧</h1>
                  <p className="page-description">部品の仕様と改訂状況を、ひとつの一覧で。</p>
                </div>
                <Button
                  type="primary"
                  icon={<Icon name="download" />}
                  disabled={!gridReady}
                  onClick={() =>
                    gridRef.current?.api.exportDataAsCsv({ fileName: "parts-revisions-mock.csv" })
                  }
                >
                  CSVエクスポート
                </Button>
              </div>
              <section className="metrics" aria-label="改訂状況の概要">
                {metrics.map((metric) => (
                  <button
                    type="button"
                    className="metric-card"
                    key={metric.label}
                    onClick={() => setStatusView(metric.status)}
                  >
                    <div className="metric-topline">
                      <span>{metric.label}</span>
                      <span className={`metric-icon ${metric.color}`}>
                        <Icon name={metric.icon} />
                      </span>
                    </div>
                    <div className="metric-value">
                      {metric.value}
                      <span>{metric.status === "all" ? "部品" : "件"}</span>
                    </div>
                    <p>
                      {metric.note}
                      <Icon name="arrow" />
                    </p>
                  </button>
                ))}
              </section>
              <section className="records-panel" aria-label="部品改訂テーブル">
                <div className="panel-heading">
                  <div>
                    <h2>
                      改訂リスト<span className="total-badge">{mockRevisions.length}</span>
                    </h2>
                    <p>品番をクリックすると、仕様の詳細を確認できます。</p>
                  </div>
                  <span className="panel-note">
                    <span className="environment-dot" />
                    サンプルデータ
                  </span>
                </div>
                <div className="status-tabs">
                  <Tabs
                    activeKey={statusView}
                    onChange={(key) => {
                      if (key === "all" || statuses.includes(key as RevisionStatus))
                        setStatusView(key as StatusView);
                    }}
                    items={[
                      {
                        key: "all",
                        label: (
                          <span>
                            すべて<span className="tab-count">{mockRevisions.length}</span>
                          </span>
                        ),
                      },
                      ...statuses.map((status) => ({
                        key: status,
                        label: (
                          <span>
                            {status}
                            <span className="tab-count">{statusCount(status)}</span>
                          </span>
                        ),
                      })),
                    ]}
                  />
                </div>
                <div className="table-toolbar">
                  <Input
                    className="search-input"
                    prefix={<Icon name="search" />}
                    placeholder="品番・品名などで検索"
                    aria-label="一覧をキーワードで検索"
                    allowClear
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <div className="toolbar-actions">
                    <Button icon={<Icon name="reset" />} onClick={resetView} disabled={!gridReady}>
                      表示をリセット
                    </Button>
                    <Button
                      icon={<Icon name="columns" />}
                      onClick={() => gridRef.current?.api.openToolPanel("columns")}
                      disabled={!gridReady}
                    >
                      列の設定
                    </Button>
                  </div>
                </div>
                <div className="parts-grid">
                  <AgGridReact<PartRevision>
                    ref={gridRef}
                    theme={gridTheme}
                    rowData={rowData}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    sideBar={sideBar}
                    localeText={AG_GRID_LOCALE_JP}
                    getRowId={getRowId}
                    context={context}
                    quickFilterText={query}
                    onGridReady={() => setGridReady(true)}
                    onModelUpdated={({ api }) => setDisplayedCount(api.getDisplayedRowCount())}
                    onRowDoubleClicked={({ data }) => {
                      if (data) setSelectedRevision(data);
                    }}
                  />
                </div>
                <div className="table-footer">
                  <span aria-live="polite">
                    <strong>{displayedCount}</strong> 件を表示
                    <span className="footer-divider">/</span>全 {mockRevisions.length} 改訂
                  </span>
                  <span>列ヘッダーから並び替え・フィルターを操作できます</span>
                </div>
              </section>
              <footer className="page-footer">
                <span>PARTS · Factory Workspace</span>
                <span>モックデータのみ使用しています</span>
              </footer>
            </main>
          </div>
        </div>
        <Drawer
          title="改訂の詳細"
          open={selectedRevision !== null}
          onClose={() => setSelectedRevision(null)}
          size="min(520px, 100vw)"
          footer={
            <div className="drawer-footer">
              <span>閲覧用のモック画面</span>
              <Button onClick={() => setSelectedRevision(null)}>閉じる</Button>
            </div>
          }
        >
          {selectedRevision && (
            <>
              <div className="detail-heading">
                <p className="eyebrow">
                  {selectedRevision.partCode} / REV.{selectedRevision.revision}
                </p>
                <h2>{selectedRevision.name}</h2>
                <Tag color={statusColors[selectedRevision.status]} variant="filled">
                  {selectedRevision.status}
                </Tag>
              </div>
              <Descriptions
                column={1}
                size="medium"
                bordered
                items={[
                  { key: "code", label: "品番", children: selectedRevision.partCode },
                  { key: "revision", label: "改訂", children: `Rev.${selectedRevision.revision}` },
                  { key: "category", label: "区分", children: selectedRevision.category },
                  { key: "material", label: "材質", children: selectedRevision.material },
                  {
                    key: "weight",
                    label: "重量",
                    children: `${selectedRevision.weight.toFixed(2)} kg`,
                  },
                  {
                    key: "date",
                    label: "適用予定日",
                    children: selectedRevision.effectiveDate ?? "未設定",
                  },
                  { key: "owner", label: "担当者", children: selectedRevision.owner },
                  { key: "updated", label: "更新日", children: selectedRevision.updatedDate },
                ]}
              />
              <div className="change-reason">
                <h3>変更理由</h3>
                <p>{selectedRevision.changeReason}</p>
              </div>
              <div className="detail-notice">
                この画面はサンプルです。編集・申請・承認は今後実装します。
              </div>
            </>
          )}
        </Drawer>
      </AgGridProvider>
    </ConfigProvider>
  );
}
export default App;
