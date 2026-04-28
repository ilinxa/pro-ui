import type { ReactNode } from "react";

export type DataTableColumn<TRow> = {
  id: string;
  header: ReactNode;
  accessor: (row: TRow) => ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
};

export type DataTableProps<TRow> = {
  columns: DataTableColumn<TRow>[];
  rows: TRow[];
  caption?: string;
  emptyState?: ReactNode;
  rowKey: (row: TRow, index: number) => string | number;
};
