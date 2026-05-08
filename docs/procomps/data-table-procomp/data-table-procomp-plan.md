# `data-table` — Pro-component Plan (Stage 2)

> **Status:** Stage 2 (plan) — authored 2026-05-09 retroactively as the Phase 4 docs catch-up. The component shipped at v0.1.0 in commit `7263286`; this plan documents the actual implementation as it landed and locks the architectural decisions for v0.2 follow-ons.
>
> **Description:** [data-table-procomp-description.md](data-table-procomp-description.md)

---

## 1. Inherited inputs (from description, in one paragraph)

`DataTable` is the registry's foundational table primitive: render a typed list of records with consistent column structure, no client state, no opinions about sorting/pagination/filtering/virtualization (consumers compose those upstream). Generic over `<TRow>`. Five props (3 required: `columns`, `rows`, `rowKey`; 2 optional: `caption`, `emptyState`). Single shadcn dep (`table`). RSC-safe. Built to be the foundation for richer sibling tables, not the end-state for any production table use case more complex than "show a list".

---

## 2. Final API (locked)

```ts
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

export function DataTable<TRow>(props: DataTableProps<TRow>): JSX.Element;
```

**Defaults:**
- `align`: `"left"` (omitted → no alignment class applied → inherits shadcn cell default which is left)
- `width`: undefined → no inline style; shadcn's `<table>` natural sizing applies
- `caption`: undefined → no `<TableCaption>` rendered
- `emptyState`: undefined → renders `"No records to display."` in a default empty card

**Counts:** 2 public types + 1 component. 3 required props, 2 optional. Generic over `TRow` propagates through `columns[i].accessor(row)`'s argument type — TS rejects accessors that read keys not on `TRow`.

**Locked exclusions** (per description §7):
- No `aria-label` prop (caption is the accessible name when present; otherwise the table's structural HTML carries it)
- No imperative ref handle
- No callbacks (`onRowClick`, `onSelectionChange`, etc.) — consumers add interactivity by rendering interactive `accessor` results
- No `striped` / `compact` / `bordered` style props — those compose at the host layer

---

## 3. Architecture

### 3.1 Single-render strategy

`DataTable` is a single function that renders a single tree:

```
<div className="rounded-md border bg-card">
  <Table>
    {caption ? <TableCaption>{caption}</TableCaption> : null}
    <TableHeader>
      <TableRow>{columns.map(col => <TableHead ... />)}</TableRow>
    </TableHeader>
    <TableBody>
      {rows.map(row => (
        <TableRow key={rowKey(row, index)}>
          {columns.map(col => <TableCell>{col.accessor(row)}</TableCell>)}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

When `rows.length === 0`, the function short-circuits to a `<div>`-based empty state instead of rendering an empty `<table>`. This is intentional — an empty table with no rows is uglier than a card-style "No records" message.

### 3.2 The "simple primitive" pattern

`data-table` is the canonical reference for the **simple primitive** pattern (review-guide §3, post-Phase-3 split):
- Flat folder — no `parts/`, no `hooks/`, no `lib/`
- All code lives in `<slug>.tsx` directly
- Types in `types.ts`; data fixtures in `dummy-data.ts`; that's it for the runtime surface

The host pattern (`parts/` + `hooks/` + `lib/`) is for components that:
- Hold a reducer or state machine (workspace, kanban-board-01)
- Compose multiple sub-renderers (rich-card, kanban-board-01, flow-canvas-01)
- Run gestures or DOM measurements (workspace's corner-drag, flow-canvas pan/zoom)

`data-table` does none of those. Forcing the host shape on it would be over-decomposition.

### 3.3 Generic propagation

`<TRow>` flows through three places:

1. `columns: DataTableColumn<TRow>[]` — each column's `accessor` argument is `TRow`
2. `rows: TRow[]` — the iterated values
3. `rowKey: (row: TRow, index) => string | number` — the key fn sees `TRow`

A single `<DataTable<User> ...>` call (or letting TS infer from `rows`) ties all three together. Mismatched generics (passing `User[]` rows with `Project`-typed columns) is a type error at the call site.

### 3.4 Cell layout

`align` maps to Tailwind classes (`text-right`, `text-center`); applied to BOTH `<TableHead>` and `<TableCell>` so headers and cells stay aligned. `width` maps to inline `style.width` on `<TableHead>` only (the browser auto-aligns `<td>` widths to the header for that column).

---

## 4. File structure

The full sealed folder is **7 files** (per the locked "simple primitive" shape):

```
src/registry/components/data/data-table/
├── data-table.tsx        # 68 lines — the component
├── types.ts              # 17 lines — DataTableColumn + DataTableProps
├── dummy-data.ts         # ~50 lines — DEMO_USERS for the demo
├── demo.tsx              # ~55 lines — rendered at /components/data-table
├── usage.tsx             # ~50 lines — consumer-facing notes (HTML-formatted)
├── meta.ts               # ~35 lines — ComponentMeta for the registry
└── index.ts              # 3 lines — re-exports DataTable + types + meta
```

**File count: 7.** Smallest in the registry. Sets the lower bound of the "simple primitive" envelope.

**Shipped via the registry** (per locked target convention): the 4 source files (`data-table.tsx`, `types.ts`, `dummy-data.ts`, `index.ts`) ship via the base + fixtures registry items in `registry.json`. `demo.tsx`, `usage.tsx`, `meta.ts` are docs-site only (never ship to consumers).

---

## 5. Composition pattern

`DataTable` is the bottom of a stack. Higher-level tables compose downward:

```
       ┌──────────────────────────────────────────┐
       │  paginated-data-table-01 (planned)       │
       │  - controls + rows.slice() + DataTable   │
       └──────────────────────────────────────────┘
                          │ uses
       ┌──────────────────▼────────────────────────┐
       │  sortable-data-table-01 (planned)         │
       │  - sort header + rows.sort() + DataTable  │
       └───────────────────────────────────────────┘
                          │ uses
       ┌──────────────────▼────────────────────────┐
       │  data-table v0.1 (this component)         │
       │  - columns + rows + rowKey + render       │
       └───────────────────────────────────────────┘
                          │ uses
       ┌──────────────────▼────────────────────────┐
       │  shadcn Table primitive (`@/components/ui/table`) │
       │  - semantic <table>/<thead>/<tbody>/<tr>/<th>/<td> │
       └───────────────────────────────────────────┘
```

Higher-level hosts:
1. Own their own state (sort key, page index, selection set)
2. Transform `rows` upstream of `<DataTable>`
3. Render their own controls (sort indicators in `header`, pagination in a sibling)
4. Pass the transformed slice + computed columns to `<DataTable>`

`<DataTable>` is unaware that any of those hosts exist. It just renders what it's given.

---

## 6. Client/server boundary

- **No `'use client'` directive.** The component is a pure render — no hooks, no event handlers in the table body itself.
- **Cell content is the consumer's choice.** If a consumer puts a `<button onClick>` in an `accessor`, that cell becomes a client island via React's automatic boundary. The table itself doesn't change.
- **`rowKey` runs at render time.** It's pure — same row → same key. Don't generate random keys here; React's reconciliation breaks.
- **Server-rendered first paint is correct.** The empty-state path (no rows) and the populated path both produce identical SSR output to a client-rendered version, by virtue of being stateless.

---

## 7. Dependencies

### shadcn primitives

| Primitive | Used for |
|---|---|
| `table` | `<Table>` / `<TableHeader>` / `<TableBody>` / `<TableRow>` / `<TableHead>` / `<TableCell>` / `<TableCaption>` — every visual chunk of the rendered tree |

`meta.ts` `dependencies.shadcn`: `["table"]`.

### npm peer deps

None. The component imports `react` (always-OK transitively from the project) and `@/lib/utils` (the `cn()` helper, registry-internal). No third-party.

`meta.ts` `dependencies.npm`: `{}`.

### internal

None. `data-table` doesn't compose other registry components — it's the bottom of the stack.

`meta.ts` `dependencies.internal`: `[]`.

### Banned / not-imported

- `next/*` — would break NPM portability
- App contexts / hooks — registry rule
- `process.env.*` — not needed (no dev-warn paths)

---

## 8. Edge cases (must work)

| Case | Behavior |
|---|---|
| `rows.length === 0` | Short-circuit to empty-state card; never renders an empty `<table>` |
| `rows.length === 0` AND `emptyState` provided | Render `emptyState` instead of the default "No records to display." |
| `columns.length === 0` | Renders `<table>` with empty `<thead>` / `<tbody>` rows. Visual ugly but no crash. (v0.2 may render a "No columns" warning state.) |
| `accessor(row)` returns `null` / `undefined` | Renders an empty cell. React handles this. |
| `accessor(row)` throws | Bubbles up — host's responsibility to handle. We do NOT wrap in error boundary at the cell level. |
| Two rows produce the same `rowKey` | React warns about duplicate keys. Consumer's bug; we don't dedup. |
| `rowKey` returns `0` (zero is a valid React key) | Works correctly. |
| `width: "200px"` provided | Applied as inline `style.width` on `<TableHead>`; cells in that column inherit alignment naturally. |
| `align: "right"` provided | Applied to both `<TableHead>` and `<TableCell>` for that column. Header and cells stay visually aligned. |
| Consumer mutates `rows` array in place (anti-pattern) | We don't defend against it. Consumer should pass a new array reference. |

---

## 9. Accessibility

- **Semantic HTML** is the entire a11y story. shadcn's `Table` primitive renders proper `<table>` / `<thead>` / `<tbody>` / `<tr>` / `<th scope="col">` / `<td>`. Screen readers traverse this natively.
- **Caption** (when provided) maps to `<TableCaption>`, which screen readers announce as the table's title.
- **No focus management.** A pure render doesn't need it. If consumer cells include focusable content (links, buttons, inputs), `Tab` flows naturally row-by-row.
- **No ARIA roles overridden.** The native HTML is sufficient; adding `role="grid"` would over-specify and trigger different SR behavior than expected.
- **No keyboard cell navigation.** Out of scope. A future `keyboard-navigable-data-table-01` host would layer arrow-key focus management on top.

---

## 10. Performance

- **No memoization needed at v0.1.** The component is one function, one return. React Compiler's auto-memoization (this repo) handles the cost of re-rendering on `rows` change.
- **Cell renderer cost.** Consumer's `accessor(row)` runs once per render per cell. If `accessor` is expensive (e.g. `formatLargeNumber(row.total)`), consumer should memoize at the `rows` source.
- **Reference-stability footgun.** Consumers passing `columns={[{...}, {...}]}` inline re-create the array each render. The React Compiler memoizes JSX-literal arrays in this repo, but NPM consumers without it must `useMemo(() => [...], [])` or hoist `columns` to module scope. Documented in the guide.
- **No virtualization.** Render budget per v0.1: ~500 rows in DOM at 60fps. For 1000+ rows, host with a virtualization library (TanStack Virtual, react-window) — or wait for `virtualized-data-table-01`.

---

## 11. Risks & alternatives

### 11.1 Risks

- **Generic propagation through column arrays.** TypeScript can struggle to infer `<TRow>` if `columns` is declared at module scope with explicit `DataTableColumn<User>[]` annotation but `rows` is then narrower (e.g. `User[]`). Workaround: let TS infer from the `<DataTable>` call site, or annotate explicitly: `<DataTable<User> ...>`.
- **`rowKey` requires consumer discipline.** Returning `index` (the second arg) is a common antipattern — works fine until rows reorder, then React reconciliation breaks. Documented in the guide as a top gotcha.
- **shadcn `Table` primitive evolution.** If shadcn rev's the Table primitive's class structure, our component might need a one-line className update. Low likelihood; high tractability.

### 11.2 Alternatives considered (and rejected)

- **TanStack Table (`@tanstack/react-table`)** — too heavy for v0.1's scope. ~30 KB; brings sorting / pagination / column resizing built-in. Right answer if we needed all those at once. v0.1 deliberately skips them so consumers can layer their own.
- **Headless Table from Radix UI** — Radix doesn't have a Table primitive (Tables aren't a UI component in Radix's sense). Custom implementation on shadcn was the natural call.
- **An imperative ref handle** (e.g. `ref.current.scrollToRow(id)`) — not needed at v0.1 (no virtualization, no scrolling state). Would re-add when virtualization lands.

---

## 12. Plan-stage open questions

None at v0.1. The simple primitive pattern is locked; sortable / paginated / virtualized hosts are scoped as separate sibling components.

For v0.2, candidates worth considering:
- `striped: boolean` prop — Tailwind `[&>tr:nth-child(even)]:bg-muted/30` zebra striping
- `dense: boolean` prop — tighter row padding for high-density tables
- `onRowClick: (row: TRow) => void` — consumer pain pattern; would still keep state out of the component
- `className` prop on the wrapper `<div>` — currently rigid

None of these would conflict with the locked v0.1 surface; all are additive.

---

## 13. Definition of "done" for THIS document (stage gate)

- [x] Inherited inputs in one paragraph
- [x] Final API locked with code excerpt + counts + defaults
- [x] Architecture explained at the strategy level (single-render, simple-primitive pattern)
- [x] File structure listed with line counts
- [x] Composition pattern shown as a diagram + words
- [x] Client/server boundary stated
- [x] Dependencies enumerated (shadcn / npm / internal / banned)
- [x] At least 8 edge cases enumerated
- [x] A11y story explicit (even if "semantic HTML")
- [x] Performance discussed (or "no memoization needed at v0.1" stated as an explicit lock)
- [x] At least 2 risks identified
- [x] At least 2 alternatives considered + rejected with reasoning

Once signed off, this plan is the input to the implementation step. Implementation is already done (v0.1.0 shipped); this plan codifies it for the project's three-stage workflow gate.

---

## Appendix — Plan-stage decisions added beyond the description

These are decisions made at the plan-stage refinement of the description, recorded retroactively per the Phase 4 catch-up:

1. **Empty-state branches at the function top, not inside the table.** Avoids the visual ugliness of an empty `<tbody>`.
2. **`align` applies to both `<TableHead>` and `<TableCell>`.** Headers and cells stay aligned visually. Doing it on cells only would have looked broken.
3. **`width` applies to `<TableHead>` only.** Browsers auto-align `<td>` widths to the matching `<th>`. Setting `width` on every `<td>` is redundant.
4. **`caption` rendered even when `rows.length > 0`.** It's part of the table's semantic identity; not conditional on having rows.
5. **No `key={index}` fallback on rows.** `rowKey` is required, no escape hatch. Forces consumer to think about reorder reconciliation up front.
6. **No client component directive.** Confirmed v0.1 is fully RSC-safe; no `'use client'` in the source.
7. **Dummy-data file uses realistic names + emails.** Demo readability matters; placeholder "User 1, User 2" looks worse on the docs site.

These can be revisited in a v0.2 plan but are frozen for v0.1.
