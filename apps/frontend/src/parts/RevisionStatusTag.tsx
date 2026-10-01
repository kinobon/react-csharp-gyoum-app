import { Tag } from "antd";
import type { RevisionStatus } from "./model";

const statusColors: Record<RevisionStatus, string> = {
  適用中: "green",
  申請中: "gold",
  承認済: "blue",
  下書き: "default",
  旧版: "default",
};

// Ant Designの標準Tag。AG Gridのセルと詳細Drawerの両方から利用する。
export function RevisionStatusTag({ status }: { status: RevisionStatus }) {
  return <Tag color={statusColors[status]}>{status}</Tag>;
}
