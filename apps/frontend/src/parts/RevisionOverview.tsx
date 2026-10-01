import { Button, Card, Col, Flex, Row, Statistic, Typography } from "antd";
import { mockRevisions, statusCount } from "./mockRevisions";
import type { StatusView } from "./model";

const metrics: { label: string; value: number; note: string; status: StatusView }[] = [
  {
    label: "登録部品",
    value: new Set(mockRevisions.map((row) => row.partCode)).size,
    note: `${mockRevisions.length}件の改訂を管理`,
    status: "all",
  },
  {
    label: "適用中",
    value: statusCount("適用中"),
    note: "現在使用されている仕様",
    status: "適用中",
  },
  {
    label: "申請中",
    value: statusCount("申請中"),
    note: "承認の確認が必要な改訂",
    status: "申請中",
  },
  {
    label: "適用待ち",
    value: statusCount("承認済"),
    note: "承認済み・適用予定日待ち",
    status: "承認済",
  },
];

interface RevisionOverviewProps {
  onStatusChange: (status: StatusView) => void;
  gridReady: boolean;
  onExport: () => void;
}

// Ant Designの標準Card・Statistic・Buttonを使用する。
export function RevisionOverview({ onStatusChange, gridReady, onExport }: RevisionOverviewProps) {
  return (
    <Flex vertical gap="large">
      <Flex justify="space-between" align="center" wrap gap="small">
        <div>
          <Typography.Title level={2}>部品・改訂一覧</Typography.Title>
          <Typography.Text type="secondary">
            部品の仕様と改訂状況を一覧で確認できます。
          </Typography.Text>
        </div>
        <Button type="primary" disabled={!gridReady} onClick={onExport}>
          CSVエクスポート
        </Button>
      </Flex>
      <Row gutter={[16, 16]} aria-label="改訂状況の概要">
        {metrics.map((metric) => (
          <Col key={metric.status} xs={24} sm={12} xl={6}>
            <Card size="small">
              <Statistic
                title={metric.label}
                value={metric.value}
                suffix={metric.status === "all" ? "部品" : "件"}
              />
              <Typography.Paragraph type="secondary">{metric.note}</Typography.Paragraph>
              <Button onClick={() => onStatusChange(metric.status)}>{metric.label}を表示</Button>
            </Card>
          </Col>
        ))}
      </Row>
    </Flex>
  );
}
