# `data-table` — Pro-component Description (Stage 1)

> **Status:** Stage 1 (description) — authored 2026-05-09 as part of the Phase 4 docs catch-up after the v0.1 review (F-01 of v0.1 review flagged the missing trio). The description retroactively pins the *what* and *why* of v0.1.0 — the component itself shipped earlier; this doc closes the framework gap.
>
> **Previous artifacts:** `meta.ts` v0.1.1 + `data-table.tsx` source (68 lines) + `usage.tsx` consumer notes.

---

## 1. Problem

The registry needs a **foundational data display primitive**: render a list of records with consistent column structure, in a typed-safe way, without client state and without opinions about what surrounds the table.

Every more advanced table — sortable, paginated, virtualized, filterable, multi-select — should compose on top of `DataTable` rather than reinvent the row/cell renderer. By keeping `DataTable` deliberately small, the registry can grow richer table primitives later (e.g. `sortable-data-table-01`, `paginated-data-table-01`) without forcing a costly rebase, and consumers retain full control over what wraps it.

The pain point that birthed the component: every prior in-house React table either tied itself to a specific data source, hid the column accessor behind opinionated APIs, or shipped a full state machine the consumer didn't need. The result was 8-10 near-duplicate table components across the team's apps. `DataTable` is the un-doing of that — one tightly-scoped primitive that defers everything else.

---

## 2. In scope / Out of scope

### In scope (v0.1.0)

- **Generic over row type** (`<TRow>`) — fully type-safe column accessors with no `any` escapes
- **Per-column rendering** — `accessor(row): ReactNode` returns whatever the consumer needs (text, badges, avatars, action menus)
- **Per-column alignment + fixed widths** — `align: "left" | "right" | "center"` and `width: string` for action columns
- **Caption support** — optional `caption` mapped to shadcn's `<TableCaption>`
- **Empty-state slot** — `emptyState: ReactNode` overrides the default "No records to display."
- **Stable `rowKey`** — required `(row, index) => string | number` so React reconciliation is correct under reorder/filter
- **SSR-safe** — no `'use client'`, no DOM access, no client state
- **Built on shadcn `table`** — inherits its typography, hover styles, dark-mode tokens for free

### Out of scope (deferred to v0.2+ or to sibling components)

- ❌ **Sorting** — consumers compose by transforming `rows` upstream + rendering a sort indicator in `header`
- ❌ **Filtering** — same: filter `rows` upstream
- ❌ **Pagination** — slice `rows` upstream + render controls outside `DataTable`
- ❌ **Virtualization** — for trees > 1000 rows, compose a sibling `virtualized-data-table-01` (planned but not yet built)
- ❌ **Row selection** — host with `useState`, render a checkbox in column 0's `accessor`
- ❌ **Inline editing** — explicit non-goal; composing `<input>` cells is permitted but the table doesn't track edit state
- ❌ **Sticky header / horizontal scroll** — host with CSS containers; the rendered table doesn't enforce scroll behavior
- ❌ **Column reorder / resize** — defer to a sibling host component that builds these on top

### What this component will never do

- Carry an internal store
- Couple to a data-fetching library (no `useQuery`, no `swr`)
- Ship animations or transitions
- Handle keyboard navigation across cells (consumers can layer this if needed; the underlying shadcn `Table` is semantic HTML, so screen-reader nav already works)

---

## 3. Target consumers

Three bands:

| Band | Example | Path |
|---|---|---|
| **Direct use** | Admin tables, settings panels, audit log views, simple dashboards | Drop `<DataTable />` in; pass columns + rows; ship |
| **Compose on top** | A team building a sortable wrapper, a virtualized wrapper, an editable wrapper | Wrap `<DataTable />`, control `rows` from outside; column accessors stay the host's contract |
| **Sibling host components** | Future `paginated-data-table-01`, `kanban-board-01` (already uses the same renderer-registry idea but at a higher level) | Reuse the column accessor pattern; the host owns its own state |

The first band is the largest and the test for whether v0.1 is the right shape — if "drop it in for an admin table" is harder than 10 lines, the API is wrong.

---

## 4. Rough API sketch (NOT final — that's the plan stage)

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

export function DataTable<TRow>(props: DataTableProps<TRow>): JSX.Element;
```

Five props. Two required (`columns`, `rows`, `rowKey` — actually three required), two optional (`caption`, `emptyState`). Generic over `TRow`. No imperative handle. No callbacks. No state.

That's the entire surface the plan stage locks.

---

## 5. Example usages

### Minimal

```tsx
import { DataTable, type DataTableColumn } from "@/components/data-table";

type User = { id: string; name: string; email: string };

const columns: DataTableColumn<User>[] = [
  { id: "name",  header: "Name",  accessor: (r) => r.name },
  { id: "email", header: "Email", accessor: (r) => r.email },
];

export function UserList({ users }: { users: User[] }) {
  return <DataTable columns={columns} rows={users} rowKey={(r) => r.id} />;
}
```

### With cell rendering

```tsx
const columns: DataTableColumn<Project>[] = [
  { id: "name",   header: "Project",  accessor: (r) => <span className="font-medium">{r.name}</span> },
  { id: "status", header: "Status",   accessor: (r) => <Badge>{r.status}</Badge> },
  { id: "due",    header: "Due date", align: "right", accessor: (r) => formatDate(r.due) },
  { id: "actions", header: "", width: "60px", accessor: (r) => <RowMenu projectId={r.id} /> },
];
```

### Composing into a sortable wrapper

```tsx
function SortableUserList({ users }: { users: User[] }) {
  const [sortKey, setSortKey] = useState<keyof User>("name");
  const sorted = useMemo(
    () => [...users].sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey]))),
    [users, sortKey],
  );
  const columns: DataTableColumn<User>[] = useMemo(
    () => [
      { id: "name", header: <SortHeader k="name" current={sortKey} on={setSortKey} />, accessor: (r) => r.name },
      { id: "email", header: <SortHeader k="email" current={sortKey} on={setSortKey} />, accessor: (r) => r.email },
    ],
    [sortKey],
  );
  return <DataTable columns={columns} rows={sorted} rowKey={(r) => r.id} />;
}
```

The sort UI is the host's. `DataTable` is unaware sorting exists. This is the model for every "richer table" use case.

---

## 6. Success criteria

`DataTable` v0.1.0 ships when:

- The minimal example renders correctly in light + dark mode without consumer styling
- A typed `DataTableColumn<TRow>` rejects a wrong-key access at the type level (TS error, not runtime)
- A consumer can produce a sortable / paginated wrapper in ≤ 30 lines of hosting code
- The component renders on the server (no `'use client'` needed for the table itself)
- An empty `rows` array shows the empty state without crashing
- The shadcn `Table` semantic HTML chain (`<table>` / `<thead>` / `<tbody>` / `<tr>` / `<th>` / `<td>`) is preserved (screen readers see a real table)
- Lint / type-check are clean against the producer's strict TS config

If any of those fail, the API shape is wrong and we should not ship.

---

## 7. Locked decisions (was: open questions)

These were considered + locked at description sign-off (some retroactively, since the component shipped before this doc):

1. **Generics for row type** — yes, mandatory. Rejecting `any` accessors is the whole point of typed tables.
2. **Accessor returns `ReactNode`** — not a `string`. Cells frequently host badges, links, action menus.
3. **`rowKey` is required** — not optional with an `index` fallback. React reconciliation is critical when `rows` reorders / filters; relying on index is a known footgun.
4. **No client state** — explicit non-goal. State (sort, page, selection) lives in the host.
5. **No `'use client'`** — RSC-safe by virtue of being stateless. Testing this is a v0.1 gate.
6. **Flat folder shape** — no `parts/` / no `hooks/` / no `lib/`. The plan-stage's job is to lock this as the canonical "simple primitive" pattern (vs. host components like kanban / workspace which need the sealed-folder host shape). See review-guide §3.
7. **Single shadcn dep** — `table`. No additional primitives. If badges/buttons appear in cells, the consumer adds those at the call site.
8. **No `aria-label` prop** — the underlying `<table>` is semantic; consumers adding a caption already get accessible naming. Adding a separate `aria-label` is solving a problem we don't have.
9. **Caption is `string`, not `ReactNode`** — keeps the API tight. Rich captions (links, icons) are the host's job; render them outside the table.

---

## 8. Risks

- **Bundle ceiling:** `DataTable` itself is ~2 KB. The shadcn `table` primitive (~1.5 KB) is the only direct dep. Total install adds ≤ 4 KB before consumer-side cell renderers. Low risk.
- **API stability:** v0.1 is alpha-status. A future v0.2 may add an opt-in `striped: boolean` prop or similar surface tweaks. None of the locked decisions above are at-risk for v0.2.
- **Accessibility:** Relies on shadcn's `<TableHeader>` setting `<th scope="col">` correctly. Verified at v0.1 ship.
- **Reference-stability footgun:** Consumers passing inline `[{ id: "name", ... }]` for `columns` re-create the array each render. React Compiler memoizes JSX-literal arrays in this repo, but NPM consumers without it must `useMemo` columns or hoist to module scope. Documented in the guide. Same footgun pattern as filter-stack, entity-picker, markdown-editor's `wikilinkCandidates`.

---

## 9. Definition of "done" for THIS document (stage gate)

- [x] Problem stated in one paragraph
- [x] In/Out of scope explicit at the bullet level
- [x] Target consumers named with examples
- [x] Rough API sketch shown (types, not implementation)
- [x] At least 3 example usages, each compilable
- [x] Success criteria are concrete + testable
- [x] At least one risk identified
- [x] Locked decisions list ≥ 6 items

Once signed off, this description is the input to the plan stage. The plan stage takes "what & why" and produces "how" — file structure, architecture, dependencies, edge cases, performance, accessibility.

---

## Appendix A — Why this description is retroactive

The component shipped at v0.1.0 in commit `7263286` (article-body-01 series; data-table was a pre-existing snapshot). Per the project workflow (`AGENTS.md`/`CLAUDE.md` §0–§1), the description should have been authored + signed off BEFORE `pnpm new:component`. It wasn't — the gap was caught by the v0.1 review (F-01: "NO procomp planning docs"). This Phase-4 catch-up:

- documents the component as it actually shipped (no API changes)
- pins the locked decisions retroactively, citing v0.1 source as evidence
- does NOT propose v0.2 changes (those land in a forward-looking v0.2 plan if/when needed)

Future components must NOT use this as a precedent — the workflow gate (description signed off → plan signed off → scaffold) stays binding. data-table's catch-up is the framework's exception, not the rule.
