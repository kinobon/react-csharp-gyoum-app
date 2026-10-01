import { useMemo, useState } from "react";
import type { Ref } from "react";
import { Button, Flex, Typography } from "antd";
import { AgGridProvider, AgGridReact } from "ag-grid-react";
import { AllCommunityModule, enableDevValidations, themeQuartz } from "ag-grid-community";
import type { ColDef, GetRowIdParams, ICellRendererParams, SideBarDef } from "ag-grid-community";
import { AllEnterpriseModule } from "ag-grid-enterprise";
import { AG_GRID_LOCALE_JP } from "@ag-grid-community/locale";
import { statuses } from "./model";
import type { PartRevision, RevisionStatus } from "./model";
import { RevisionStatusTag } from "./RevisionStatusTag";

interface GridContext {
  openDetails: (revision: PartRevision) => void;
}

// TODO: 実装する機能が固まったら、必要なモジュールだけに絞る。
const gridModules = [AllCommunityModule, AllEnterpriseModule];
if (import.meta.env.DEV) enableDevValidations();

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

function PartCodeCell(params: ICellRendererParams<PartRevision, string, GridContext>) {
  const row = params.data;
  return row ? (
    <Button
      type="link"
      onClick={() => params.context.openDetails(row)}
      aria-label={`${row.partCode} Rev.${row.revision}の詳細`}
    >
      {row.partCode}
    </Button>
  ) : null;
}
// AG Gridのカスタムセル内に、Ant Designの状態タグを描画する。
function StatusCell(params: ICellRendererParams<PartRevision, RevisionStatus>) {
  return params.value ? <RevisionStatusTag status={params.value} /> : null;
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
    type: "numericColumn",
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

interface RevisionGridProps {
  gridRef: Ref<AgGridReact<PartRevision>>;
  rowData: PartRevision[];
  query: string;
  totalCount: number;
  onReady: () => void;
  onOpenDetails: (revision: PartRevision) => void;
}

// AG Grid本体・モジュール・テーマ・列定義・フィルター・セル表示をここにまとめる。
export function RevisionGrid({
  gridRef,
  rowData,
  query,
  totalCount,
  onReady,
  onOpenDetails,
}: RevisionGridProps) {
  const [displayedCount, setDisplayedCount] = useState(rowData.length);
  const context = useMemo<GridContext>(() => ({ openDetails: onOpenDetails }), [onOpenDetails]);
  return (
    <AgGridProvider modules={gridModules}>
      <Flex vertical gap="medium">
        <div className="parts-grid">
          <AgGridReact<PartRevision>
            ref={gridRef}
            theme={themeQuartz}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            sideBar={sideBar}
            localeText={AG_GRID_LOCALE_JP}
            getRowId={getRowId}
            context={context}
            quickFilterText={query}
            onGridReady={onReady}
            onModelUpdated={({ api }) => setDisplayedCount(api.getDisplayedRowCount())}
            onRowDoubleClicked={({ data }) => {
              if (data) onOpenDetails(data);
            }}
          />
        </div>
        <Flex justify="space-between" wrap gap="small">
          <Typography.Text aria-live="polite">
            {displayedCount} 件を表示 / 全 {totalCount} 改訂
          </Typography.Text>
          <Typography.Text type="secondary">
            列ヘッダーから並び替え・フィルターを操作できます
          </Typography.Text>
        </Flex>
      </Flex>
    </AgGridProvider>
  );
}
