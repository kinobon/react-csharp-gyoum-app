import { useMemo, useRef, useState } from "react";
import { Card, ConfigProvider, Flex, Tag } from "antd";
import jaJP from "antd/locale/ja_JP";
import type { AgGridReact } from "ag-grid-react";
import { AdminLayout } from "./components/AdminLayout";
import { RevisionOverview } from "./parts/RevisionOverview";
import { RevisionToolbar } from "./parts/RevisionToolbar";
import { RevisionGrid } from "./parts/RevisionGrid";
import { RevisionDetailDrawer } from "./parts/RevisionDetailDrawer";
import { mockRevisions } from "./parts/mockRevisions";
import type { PartRevision, StatusView } from "./parts/model";
import "./App.css";

// 画面の状態管理と、Ant Designの操作からAG GridのAPIへの接続を担当する。
function App() {
  const gridRef = useRef<AgGridReact<PartRevision>>(null);
  const [query, setQuery] = useState("");
  const [statusView, setStatusView] = useState<StatusView>("all");
  const [selectedRevision, setSelectedRevision] = useState<PartRevision | null>(null);
  const [gridReady, setGridReady] = useState(false);
  const rowData = useMemo(
    () =>
      statusView === "all"
        ? mockRevisions
        : mockRevisions.filter((row) => row.status === statusView),
    [statusView],
  );
  const resetView = () => {
    setQuery("");
    setStatusView("all");
    gridRef.current?.api.setFilterModel(null);
    gridRef.current?.api.resetColumnState();
    gridRef.current?.api.closeToolPanel();
  };
  return (
    <ConfigProvider locale={jaJP}>
      <AdminLayout statusView={statusView} onStatusChange={setStatusView}>
        <RevisionOverview
          onStatusChange={setStatusView}
          gridReady={gridReady}
          onExport={() =>
            gridRef.current?.api.exportDataAsCsv({ fileName: "parts-revisions-mock.csv" })
          }
        />
        <Card title={`改訂リスト (${mockRevisions.length})`} extra={<Tag>サンプルデータ</Tag>}>
          <Flex vertical gap="large">
            <RevisionToolbar
              statusView={statusView}
              onStatusChange={setStatusView}
              query={query}
              onQueryChange={setQuery}
              gridReady={gridReady}
              onReset={resetView}
              onOpenColumns={() => gridRef.current?.api.openToolPanel("columns")}
            />
            <RevisionGrid
              gridRef={gridRef}
              rowData={rowData}
              query={query}
              totalCount={mockRevisions.length}
              onReady={() => setGridReady(true)}
              onOpenDetails={setSelectedRevision}
            />
          </Flex>
        </Card>
      </AdminLayout>
      <RevisionDetailDrawer revision={selectedRevision} onClose={() => setSelectedRevision(null)} />
    </ConfigProvider>
  );
}
export default App;
