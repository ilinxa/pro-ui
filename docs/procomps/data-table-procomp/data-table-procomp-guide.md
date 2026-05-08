# `data-table` — Pro-component Guide (Stage 3)

> **Audience:** consumer using `<DataTable />` in an app, or building a richer table on top of it.
>
> **Companion docs:** [description](data-table-procomp-description.md) (what & why), [plan](data-table-procomp-plan.md) (how it's built).

---

## When to use DataTable

- You need to render a list of records as a table
- You want **typed accessors** so the column code knows what shape the rows are
- You want shadcn-styled output that flips light/dark via the project's tokens
- You're OK owning sort / pagination / filter / selection / virtualization in your own host code (`<DataTable>` doesn't do those)
- You want SSR — the table renders on the server and hydrates without client state

Examples that fit:
- Admin "users" / "projects" / "audit log" tables
- Settings panels listing API keys, webhooks, members
- Report tables in a dashboard, where data lives in `useQuery` upstream and the table just renders the result
- A read-only review screen showing CSV-like output

---

## When NOT to use DataTable

- **You need built-in sort / pagination / filter.** Use TanStack Table or wait for a sibling host component (`sortable-data-table-01`, `paginated-data-table-01` — planned). v0.1 of this component deliberately doesn't ship them.
- **Your row count is > 500.** Render perf is fine for ~500 rows. Past that, you want virtualization. Either compose with TanStack Virtual + this component, or use a different table.
- **You need keyboard cell navigation** (arrow keys jumping between cells like a spreadsheet). Out of scope for v0.1. Consumer can layer this with a focus manager but the component won't help.
- **You need editable cells with edit state.** This component renders; it doesn't track which cell is being edited. Use `properties-form` for typed records, or build a custom inline-editor on top.
- **You're rendering a dashboard tile that's just one row of stats.** A table is over-structure for a single row; use a flex layout.

---

## The five-minute walkthrough

```tsx
import { DataTable, type DataTableColumn } from "@/components/data-table";

type User = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member";
};

// Columns describe HOW to render each cell. Lift them outside the
// component (or wrap in useMemo) so the array reference is stable.
const columns: DataTableColumn<User>[] = [
  { id: "name",  header: "Name",  accessor: (r) => r.name },
  { id: "email", header: "Email", accessor: (r) => r.email },
  { id: "role",  header: "Role",  accessor: (r) => r.role },
];

export function UserList({ users }: { users: User[] }) {
  return (
    <DataTable
      columns={columns}
      rows={users}
      rowKey={(row) => row.id}
      caption="Workspace members."
    />
  );
}
```

That's it. No `'use client'` needed; `<DataTable>` is RSC-safe. The empty-state path renders automatically when `users.length === 0`.

---

## The mental model

`DataTable` is a renderer. It does **three things** on every render:

1. Map `columns[i].header` into a `<thead>` row
2. For each `row` in `rows`, map `columns[i].accessor(row)` into a `<tbody>` row, keyed by `rowKey(row, index)`
3. If `rows.length === 0`, short-circuit to an empty-state card before rendering any `<table>`

It does **not** do:

- Sort rows (caller passes pre-sorted)
- Filter rows (caller passes pre-filtered)
- Track selection (caller renders checkbox cells + their own state)
- Keep a stable scroll position across re-renders (browser default)
- Memoize cell output (consumer's `accessor` runs each render — memoize upstream if expensive)

The whole purpose is that this is the bottom of the stack. If you find yourself wanting `DataTable` to "just sort", that's a sign you need a host component (`sortable-data-table-01` — planned) instead of patching this primitive.

---

## Composition patterns

### Pattern 1: pure render

The default. Pass `columns` (stable reference) + `rows` + `rowKey`. Done. See the five-minute walkthrough.

### Pattern 2: badge / link / icon cells

`accessor` returns any `ReactNode`. Drop in shadcn `Badge`, an `<a>`, an icon, whatever — all per-cell.

```tsx
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

const columns: DataTableColumn<Project>[] = [
  {
    id: "name",
    header: "Project",
    accessor: (p) => (
      <a href={`/projects/${p.id}`} className="font-medium underline">
        {p.name}
        <ExternalLink className="ml-1 inline h-3 w-3" />
      </a>
    ),
  },
  {
    id: "status",
    header: "Status",
    accessor: (p) => (
      <Badge variant={p.archived ? "secondary" : "default"}>
        {p.archived ? "Archived" : "Active"}
      </Badge>
    ),
  },
];
```

### Pattern 3: actions menu in the last column

Use `width` to pin the actions column tight, `align: "right"` to push it to the edge:

```tsx
const columns: DataTableColumn<Member>[] = [
  { id: "name", header: "Name", accessor: (m) => m.name },
  { id: "role", header: "Role", accessor: (m) => m.role },
  {
    id: "actions",
    header: "",
    width: "60px",
    align: "right",
    accessor: (m) => <RowMenu memberId={m.id} />,
  },
];
```

The `<RowMenu>` is a consumer component that wraps shadcn `DropdownMenu` — it tracks its own open state. The cell that hosts it is otherwise stateless.

### Pattern 4: sortable wrapper

Sort happens upstream; the table never sees it.

```tsx
"use client";

import { useMemo, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data-table";

type SortKey<T> = { key: keyof T; dir: "asc" | "desc" };

function SortHeader<T>({
  label,
  k,
  current,
  onChange,
}: {
  label: string;
  k: keyof T;
  current: SortKey<T> | null;
  onChange: (next: SortKey<T>) => void;
}) {
  const isActive = current?.key === k;
  const dir = isActive ? current!.dir : null;
  return (
    <button
      type="button"
      onClick={() => onChange({ key: k, dir: dir === "asc" ? "desc" : "asc" })}
      className="inline-flex items-center gap-1"
    >
      {label}
      {dir === "asc" && <ChevronUp className="h-3 w-3" />}
      {dir === "desc" && <ChevronDown className="h-3 w-3" />}
    </button>
  );
}

export function SortableUserList({ users }: { users: User[] }) {
  const [sort, setSort] = useState<SortKey<User> | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return users;
    const dirMul = sort.dir === "asc" ? 1 : -1;
    return [...users].sort((a, b) =>
      String(a[sort.key]).localeCompare(String(b[sort.key])) * dirMul,
    );
  }, [users, sort]);

  const columns = useMemo<DataTableColumn<User>[]>(
    () => [
      { id: "name", header: <SortHeader label="Name"  k="name"  current={sort} onChange={setSort} />, accessor: (r) => r.name },
      { id: "role", header: <SortHeader label="Role"  k="role"  current={sort} onChange={setSort} />, accessor: (r) => r.role },
    ],
    [sort],
  );

  return <DataTable columns={columns} rows={sorted} rowKey={(r) => r.id} />;
}
```

The `useMemo` for `columns` is critical — without it, every render re-creates the column array and React reconciles the entire `<thead>` even when `sort` is unchanged.

### Pattern 5: paginated wrapper

Same idea — slice `rows` upstream, render controls outside.

```tsx
const PAGE_SIZE = 25;

export function PaginatedUserList({ users }: { users: User[] }) {
  const [page, setPage] = useState(0);
  const slice = useMemo(
    () => users.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [users, page],
  );
  const totalPages = Math.ceil(users.length / PAGE_SIZE);

  return (
    <div className="space-y-3">
      <DataTable columns={USER_COLUMNS} rows={slice} rowKey={(r) => r.id} />
      <div className="flex items-center justify-between text-sm">
        <span>Page {page + 1} of {totalPages}</span>
        <div className="flex gap-2">
          <Button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
          <Button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>Next</Button>
        </div>
      </div>
    </div>
  );
}
```

### Pattern 6: row selection (checkboxes)

Selection is the host's. Render a checkbox in column 0's `accessor`; track the selected-id set externally.

```tsx
"use client";

const SelectableUserList = ({ users }: { users: User[] }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allSelected = users.length > 0 && selected.size === users.length;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const columns = useMemo<DataTableColumn<User>[]>(
    () => [
      {
        id: "select",
        width: "40px",
        header: (
          <Checkbox
            checked={allSelected}
            onCheckedChange={(c) =>
              setSelected(c ? new Set(users.map((u) => u.id)) : new Set())
            }
          />
        ),
        accessor: (r) => (
          <Checkbox
            checked={selected.has(r.id)}
            onCheckedChange={() => toggle(r.id)}
          />
        ),
      },
      { id: "name", header: "Name", accessor: (r) => r.name },
    ],
    [allSelected, selected, users],
  );

  return <DataTable columns={columns} rows={users} rowKey={(r) => r.id} />;
};
```

`accessor` closes over `selected` and `toggle`, so this column re-renders every time selection changes. That's fine for ~500 rows. Past that, lift selection to a `Set` ref + `forceUpdate` pattern, or use a virtualized table.

---

## Gotchas

### Reference-stability footgun on `columns`

Inline-creating `columns={[{ id: ... }]}` re-creates the array each render. Effects:

- React reconciles the entire `<thead>` every render (cheap but wasteful)
- React Compiler in this repo memoizes literal arrays automatically; **NPM consumers without React Compiler do NOT get this for free**

Always either lift `columns` to module scope (when columns are static) or wrap in `useMemo` (when they close over component state):

```tsx
// ✓ Module scope
const COLUMNS: DataTableColumn<User>[] = [/* ... */];

// ✓ useMemo
const columns = useMemo<DataTableColumn<User>[]>(() => [/* ... */], [deps]);

// ✗ Inline (works in this repo, breaks bundle perf for NPM consumers)
<DataTable columns={[/* ... */]} ... />
```

This is the same footgun pattern as `entity-picker`'s `items`, `markdown-editor`'s `wikilinkCandidates`, and `filter-stack`'s categories.

### `rowKey` returning index is a footgun

`rowKey={(r, i) => i}` works until rows reorder or filter — at which point React mis-reconciles, and cell-internal state (an open `<DropdownMenu>`, focus on an `<input>`) jumps to the wrong row. Always return a stable id:

```tsx
// ✓
rowKey={(row) => row.id}

// ✗
rowKey={(row, index) => index}
```

### `accessor` exceptions bubble up

If `accessor(row)` throws (e.g. accessing a property that's `undefined` on the row), the error bubbles to the nearest error boundary or crashes the page. The component does NOT wrap cells in their own error boundary — it would be too easy to mask a real bug.

Defend at the accessor:

```tsx
accessor: (r) => r.profile?.displayName ?? "—"
```

### Caption is `string` only

`caption: "..."` is a `string` in the type; rich captions (links, tooltips) need to live outside the table. If you want a header above the table with a link, render it as a sibling `<h2>` / `<p>`, not as the caption.

### The empty-state path doesn't render `<table>`

When `rows.length === 0`, the component renders a `<div>`-based card. CSS that targets `table.data-table` (or similar) won't match. If you need to inject a custom empty state, use the `emptyState` prop:

```tsx
<DataTable
  columns={columns}
  rows={users}
  rowKey={(r) => r.id}
  emptyState={
    <div className="space-y-2">
      <p>No members yet.</p>
      <Button onClick={onInvite}>Invite someone</Button>
    </div>
  }
/>
```

### `width: "100px"` is hint, not lock

Browsers can grow a column past `width` if the content demands it. To enforce a hard cap, use Tailwind on the cell content:

```tsx
{
  id: "name",
  header: "Name",
  width: "180px",
  accessor: (r) => <span className="block max-w-[180px] truncate">{r.name}</span>,
}
```

### `align` doesn't include "justify"

Only `"left" | "right" | "center"`. Right-aligning numbers + center-aligning a status pill covers ~95% of needs. Block-level alignment (`text-justify`) was deliberately excluded.

### `<TableCaption>` renders BELOW the table by default

Per HTML spec / shadcn primitive. If you want a header-style caption above, leave the `caption` prop unset and render a `<h2>` above `<DataTable>` instead.

---

## Common operations cookbook

### Render a fixed-width actions column

```tsx
{
  id: "actions",
  header: "",          // empty string OK; no <th> text
  width: "44px",
  align: "right",
  accessor: (r) => <RowMenu rowId={r.id} />,
}
```

### Render a status badge with conditional variant

```tsx
{
  id: "status",
  header: "Status",
  accessor: (r) => {
    const variant = r.status === "Active" ? "default" : r.status === "Invited" ? "secondary" : "destructive";
    return <Badge variant={variant}>{r.status}</Badge>;
  },
}
```

### Multi-line cell (primary + secondary text)

```tsx
{
  id: "name",
  header: "Member",
  accessor: (r) => (
    <div className="flex flex-col">
      <span className="font-medium">{r.name}</span>
      <span className="text-xs text-muted-foreground">{r.email}</span>
    </div>
  ),
}
```

### Right-aligned numeric column

```tsx
{
  id: "balance",
  header: "Balance",
  align: "right",
  accessor: (r) => <span className="font-mono tabular-nums">{formatCurrency(r.balance)}</span>,
}
```

### Conditional empty-state CTA

```tsx
<DataTable
  columns={columns}
  rows={users}
  rowKey={(r) => r.id}
  emptyState={
    isLoading
      ? <Skeleton className="h-32 w-full" />
      : <InvitePrompt onInvite={handleInvite} />
  }
/>
```

---

## Known limitations / deferred to v0.2

- No `striped: boolean` prop — host with Tailwind's `[&>tr:nth-child(even)]:bg-muted/30` if needed
- No `dense: boolean` prop — same approach
- No `className` on the wrapper `<div>` — currently rigid; v0.2 candidate
- No `onRowClick` callback — render a wrapping `<button>` in the first column or wrap the whole row via custom CSS for now
- No virtualization — render budget ~500 rows
- No keyboard cell navigation — semantic HTML covers the table-as-data accessibility story; cell-by-cell arrow nav is a v0.2+ host feature

---

## Migration notes

This is the v0.1.0 component (description + plan retroactively authored at v0.1.1 — no API changes; the docs catch up to the shipped surface). No prior version to migrate from.

If you're moving from a custom in-house table:
- Pull row-typed fields out into `DataTableColumn<TRow>` array
- Pull `<table>` chrome out — `<DataTable>` provides it
- Move sort / page / filter / select state OUT of the table component into the host

---

## Open follow-ups

- v0.2 may add `striped`, `dense`, `className` props (additive — non-breaking)
- A sibling `sortable-data-table-01` is a candidate for the data category
- A sibling `paginated-data-table-01` is a candidate
- A sibling `virtualized-data-table-01` for high-row-count scenarios; would compose TanStack Virtual + `<DataTable>`
- Docs on integrating with `useQuery` / RSC streaming are not yet written

---

## Reference

### Public exports

```ts
// from @/components/data-table
export { DataTable } from "./data-table";
export type { DataTableColumn, DataTableProps } from "./types";
export { meta } from "./meta";
```

### Types

```ts
type DataTableColumn<TRow> = {
  id: string;
  header: ReactNode;
  accessor: (row: TRow) => ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
};

type DataTableProps<TRow> = {
  columns: DataTableColumn<TRow>[];
  rows: TRow[];
  caption?: string;
  emptyState?: ReactNode;
  rowKey: (row: TRow, index: number) => string | number;
};
```

### Install

```bash
pnpm dlx shadcn@latest add @ilinxa/data-table
```

Then import from `@/components/data-table`.

### Related

- `kanban-board-01` — when the table model isn't right (records are cards in columns)
- `workspace` — when you need a layout primitive that hosts multiple tables side-by-side
- `rich-card` — for hierarchical record viewers (when each row is itself a tree of fields)
