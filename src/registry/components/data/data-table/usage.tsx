export default function DataTableUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>DataTable</code> when you need to render a list of
        records with consistent column structure. It is intentionally
        unopinionated about sorting, filtering, and pagination — those concerns
        compose on top via the column accessor and parent state.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { DataTable, type DataTableColumn } from "@/registry/components/data/data-table"

type User = { id: string; name: string; email: string }

const columns: DataTableColumn<User>[] = [
  { id: "name",  header: "Name",  accessor: (r) => r.name },
  { id: "email", header: "Email", accessor: (r) => r.email },
]

export function Example({ users }: { users: User[] }) {
  return (
    <DataTable
      columns={columns}
      rows={users}
      rowKey={(r) => r.id}
    />
  )
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>accessor</code> can return any <code>ReactNode</code>, so
          composing badges, avatars, or actions per cell is the intended path.
        </li>
        <li>
          Column <code>align</code> applies to both header and cells; use{" "}
          <code>width</code> for fixed-width columns (e.g. action menus).
        </li>
        <li>
          Pass an <code>emptyState</code> node to override the default empty
          message.
        </li>
      </ul>
    </div>
  );
}
