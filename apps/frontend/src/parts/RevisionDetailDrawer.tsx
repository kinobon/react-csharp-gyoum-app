import { Button, Descriptions, Drawer, Flex, Typography } from "antd";
import type { PartRevision } from "./model";
import { RevisionStatusTag } from "./RevisionStatusTag";

interface RevisionDetailDrawerProps {
  revision: PartRevision | null;
  onClose: () => void;
}

// Ant Designの標準Drawer・Descriptionsで詳細を表示する。
export function RevisionDetailDrawer({ revision, onClose }: RevisionDetailDrawerProps) {
  return (
    <Drawer
      title="改訂の詳細"
      open={revision !== null}
      onClose={onClose}
      footer={<Button onClick={onClose}>閉じる</Button>}
    >
      {revision && (
        <Flex vertical gap="large">
          <div>
            <Typography.Text type="secondary">
              {revision.partCode} / Rev.{revision.revision}
            </Typography.Text>
            <Typography.Title level={3}>{revision.name}</Typography.Title>
            <RevisionStatusTag status={revision.status} />
          </div>
          <Descriptions
            column={1}
            size="medium"
            bordered
            items={[
              { key: "code", label: "品番", children: revision.partCode },
              { key: "revision", label: "改訂", children: `Rev.${revision.revision}` },
              { key: "category", label: "区分", children: revision.category },
              { key: "material", label: "材質", children: revision.material },
              {
                key: "weight",
                label: "重量",
                children: `${revision.weight.toFixed(2)} kg`,
              },
              {
                key: "date",
                label: "適用予定日",
                children: revision.effectiveDate ?? "未設定",
              },
              { key: "owner", label: "担当者", children: revision.owner },
              { key: "updated", label: "更新日", children: revision.updatedDate },
            ]}
          />

          <div>
            <Typography.Title level={5}>変更理由</Typography.Title>
            <Typography.Paragraph>{revision.changeReason}</Typography.Paragraph>
          </div>
          <Typography.Text type="secondary">
            この画面はサンプルです。編集・申請・承認は今後実装します。
          </Typography.Text>
        </Flex>
      )}
    </Drawer>
  );
}
