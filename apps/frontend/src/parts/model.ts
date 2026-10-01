export type RevisionStatus = "適用中" | "申請中" | "承認済" | "下書き" | "旧版";
export type StatusView = "all" | RevisionStatus;

export interface PartRevision {
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

export const statuses: RevisionStatus[] = ["適用中", "申請中", "承認済", "下書き", "旧版"];
