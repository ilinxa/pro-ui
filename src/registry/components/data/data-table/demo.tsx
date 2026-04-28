import { Badge } from "@/components/ui/badge";
import { DataTable } from "./data-table";
import { DEMO_USERS, type DemoUser } from "./dummy-data";
import type { DataTableColumn } from "./types";

const columns: DataTableColumn<DemoUser>[] = [
  {
    id: "name",
    header: "Name",
    accessor: (row) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{row.name}</span>
        <span className="text-xs text-muted-foreground">{row.email}</span>
      </div>
    ),
  },
  {
    id: "role",
    header: "Role",
    accessor: (row) => <span className="text-foreground">{row.role}</span>,
  },
  {
    id: "status",
    header: "Status",
    accessor: (row) => {
      const variant =
        row.status === "Active"
          ? "default"
          : row.status === "Invited"
            ? "secondary"
            : "destructive";
      return <Badge variant={variant}>{row.status}</Badge>;
    },
  },
  {
    id: "lastSeen",
    header: "Last Seen",
    align: "right",
    accessor: (row) => (
      <span className="text-sm text-muted-foreground">{row.lastSeen}</span>
    ),
  },
];

export default function DataTableDemo() {
  return (
    <DataTable
      columns={columns}
      rows={DEMO_USERS}
      rowKey={(row) => row.id}
      caption="A starter table rendered from dummy data."
    />
  );
}
