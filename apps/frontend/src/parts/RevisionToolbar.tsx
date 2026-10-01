import { Button, Flex, Input, Space, Tabs } from "antd";
import { mockRevisions, statusCount } from "./mockRevisions";
import { statuses } from "./model";
import type { RevisionStatus, StatusView } from "./model";

interface RevisionToolbarProps {
  statusView: StatusView;
  onStatusChange: (status: StatusView) => void;
  query: string;
  onQueryChange: (query: string) => void;
  gridReady: boolean;
  onReset: () => void;
  onOpenColumns: () => void;
}

// Ant Designの操作バー。グリッド操作はAppから渡されたコールバックへ委譲する。
export function RevisionToolbar({
  statusView,
  onStatusChange,
  query,
  onQueryChange,
  gridReady,
  onReset,
  onOpenColumns,
}: RevisionToolbarProps) {
  return (
    <Flex vertical gap="medium">
      <Tabs
        activeKey={statusView}
        onChange={(key) => {
          if (key === "all" || statuses.includes(key as RevisionStatus))
            onStatusChange(key as StatusView);
        }}
        items={[
          { key: "all", label: `すべて (${mockRevisions.length})` },
          ...statuses.map((status) => ({
            key: status,
            label: `${status} (${statusCount(status)})`,
          })),
        ]}
      />
      <Flex justify="space-between" align="center" wrap gap="small">
        <Input
          className="search-input"
          placeholder="品番・品名などで検索"
          aria-label="一覧をキーワードで検索"
          allowClear
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <Space wrap>
          <Button onClick={onReset} disabled={!gridReady}>
            表示をリセット
          </Button>
          <Button onClick={onOpenColumns} disabled={!gridReady}>
            列の設定
          </Button>
        </Space>
      </Flex>
    </Flex>
  );
}
