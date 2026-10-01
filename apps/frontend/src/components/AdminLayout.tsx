import type { ReactNode } from "react";
import { Breadcrumb, Card, Flex, Layout, Menu, Tag, Typography } from "antd";
import { mockRevisions, statusCount } from "../parts/mockRevisions";
import type { StatusView } from "../parts/model";

interface AdminLayoutProps {
  statusView: StatusView;
  onStatusChange: (status: StatusView) => void;
  children: ReactNode;
}

// Ant Designの標準レイアウト・メニューを使用する。
export function AdminLayout({ statusView, onStatusChange, children }: AdminLayoutProps) {
  const selectedKey = statusView === "申請中" || statusView === "承認済" ? statusView : "all";
  return (
    <Layout className="app-layout">
      <Layout.Sider theme="light" breakpoint="lg" collapsedWidth={0}>
        <Card title="PARTS" variant="borderless">
          <Typography.Text type="secondary">仕様・改訂管理</Typography.Text>
        </Card>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          aria-label="管理メニュー"
          items={[
            { key: "all", label: `部品・改訂一覧 (${mockRevisions.length})` },
            { key: "申請中", label: `承認待ち (${statusCount("申請中")})` },
            { key: "承認済", label: `適用待ち (${statusCount("承認済")})` },
          ]}
          onClick={({ key }) => {
            if (key === "all" || key === "申請中" || key === "承認済") onStatusChange(key);
          }}
        />
      </Layout.Sider>
      <Layout className="app-main">
        <Layout.Content className="app-content">
          <Flex vertical gap="large">
            <Flex justify="space-between" align="center" wrap gap="small">
              <Breadcrumb items={[{ title: "ワークスペース" }, { title: "部品・改訂一覧" }]} />
              <Tag>モック環境</Tag>
            </Flex>
            {children}
          </Flex>
        </Layout.Content>
        <Layout.Footer>PARTS · モックデータのみ使用しています</Layout.Footer>
      </Layout>
    </Layout>
  );
}
