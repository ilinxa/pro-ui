# Pro-Component Development Guide

A comprehensive, codebase-grounded guide to building pro-components in `ilinxa-ui-pro`. Read once, build right.

> Every rule in this guide is anchored to a specific file. When the codebase changes, this guide must change. **If something here conflicts with the source code, the source code wins** — open a fix to this file so they realign.

## Contents

1. [What is a pro-component](#1-what-is-a-pro-component)
2. [Before you start](#2-before-you-start)
3. [The 60-second workflow](#3-the-60-second-workflow)
4. [Choosing a category and slug](#4-choosing-a-category-and-slug)
5. [Anatomy of a component folder](#5-anatomy-of-a-component-folder)
6. [File-by-file reference](#6-file-by-file-reference)
7. [The hard rules: portability contract](#7-the-hard-rules-portability-contract)
8. [Design system contract](#8-design-system-contract)
9. [Composition patterns](#9-composition-patterns)
10. [Client vs server boundaries](#10-client-vs-server-boundaries)
11. [Registering the component](#11-registering-the-component)
    - [Worked example: scaffolding `data/stat-card`](#worked-example-scaffolding-datastat-card-from-scratch)
12. [Anti-patterns](#12-anti-patterns)
13. [Verification checklist](#13-verification-checklist)
14. [Versioning, status, lifecycle](#14-versioning-status-lifecycle)
15. [Updating an existing component](#15-updating-an-existing-component)
16. [Adding a new category](#16-adding-a-new-category)
17. [Troubleshooting](#17-troubleshooting)
18. [Reference appendix](#18-reference-appendix)

---

## 1. What is a pro-component

A **pro-component** is a fully-composed, dynamic, dependency-explicit component built on top of shadcn/ui that solves a recurring app pattern.

It is **not**:

- A re-skin of a shadcn primitive (those go in [src/components/ui/](../src/components/ui/)).
- A one-app utility (those stay in your app).
- A whole screen or page.

The bar to clear: **would three different teams in three different projects reach for this?** If yes, it earns its slot in the registry. If no, edit the underlying primitive instead — most "I need a slightly different button" requests are solved by editing [src/components/ui/button.tsx](../src/components/ui/button.tsx), not by adding a `data/lime-button` to the registry.

The canonical pro-component philosophy is captured in `data-table`'s own meta:

> "DataTable is the foundational data display component — every more advanced table (sortable, paginated, virtualized) in this registry is expected to compose on top of it. It is deliberately small: one render, no client state, no DOM-level magic."

Read that twice. **Pro-components are foundations.** Compose, don't bloat.

---

## 2. Before you start

Three steps before you touch any code:

1. **Read [.claude/STATUS.md](../.claude/STATUS.md)** — you'll see what already exists, what's on the roadmap, and recent decisions. If your component is already there, build that one. If it's not, decide whether you're adding to the roadmap or refining an existing entry.
2. **Grep the registry for similar tags or features** — `Grep "your-tag-here" src/registry/` saves embarrassment. Naming collisions and duplicated work both surface here.
3. **Run the procomp planning workflow** — see below. This is a hard gate: no scaffolding, no `pnpm new:component`, no code until the description and plan documents are written and signed off.

Skip these and you'll either rebuild something that already exists or scaffold a folder you have to rename in twenty minutes.

### The procomp planning workflow (required gate)

**Every new pro-component must pass through three written stages before any code lands.** Each stage produces one document; each stage is reviewed and confirmed before the next begins. The documents live in [docs/procomps/](../docs/procomps/) — one folder per component, three files per folder. Operational reference: [docs/procomps/README.md](../docs/procomps/README.md).

```
docs/procomps/<slug>-procomp/
├── <slug>-procomp-description.md   ← Stage 1: what & why
├── <slug>-procomp-plan.md          ← Stage 2: how
└── <slug>-procomp-guide.md         ← Stage 3: consumer-facing usage notes
```

`<slug>` is the same kebab-case slug the component will use in the registry (e.g. `stat-card`, `command-palette`).

| Stage | Document | Contents | Gate |
|---|---|---|---|
| 1 | `description.md` | Problem, in/out of scope, target consumers, rough API sketch, example usages, success criteria, open questions | **Description must be reviewed and signed off before Stage 2.** |
| 2 | `plan.md` | Final API, file-by-file plan, dependencies, composition pattern, client/server boundary, edge cases, accessibility, risks | **Plan must be reviewed and signed off before any code.** |
| 3 | `guide.md` | Consumer-facing usage notes, gotchas, composition patterns, migration notes, follow-ups | Authored alongside the implementation — lands in the same PR. |

> **Rule (must):** Do not run `pnpm new:component` until both `description.md` and `plan.md` exist and have been signed off. The 60-second workflow in §3 begins only after the gate is cleared. If you start coding without the docs, the work doesn't merge — full stop.

The gate exists for two reasons:

1. **Renaming and re-API-ing a published component is expensive.** Catching design issues at the description stage costs a paragraph; catching them after consumers exist costs a major version bump.
2. **The plan is the contract for review.** It's much easier to review "should we build this, and how?" against a written description than to argue against a half-finished implementation.

For required sections in each document and the full workflow checklist, see [docs/procomps/README.md](../docs/procomps/README.md).

---

## 3. The 60-second workflow

Five commands. In order.

```bash
# 1. scaffold the folder
pnpm new:component <category>/<slug>
# e.g. pnpm new:component data/stat-card

# 2. (you edit the seven scaffolded files — anatomy in §5)

# 3. paste the printed lines into src/registry/manifest.ts

# 4. run the dev server
pnpm dev

# 5. verify the docs auto-render
# open http://localhost:3000/components
# open http://localhost:3000/components/<slug>
```

The scaffolder ([scripts/new-component.mjs](../scripts/new-component.mjs)) prints exactly what to paste:

```
✔ created src/registry/components/data/stat-card/

Add this entry to src/registry/manifest.ts:

  import StatCardDemo from "./components/data/stat-card/demo";
  import StatCardUsage from "./components/data/stat-card/usage";
  import { meta as statCardMeta } from "./components/data/stat-card/meta";

  // and add to REGISTRY:
  { meta: statCardMeta, Demo: StatCardDemo, Usage: StatCardUsage },
```

Paste those four lines verbatim. The three imports go above with the existing imports; the entry goes inside the `REGISTRY` array, grouped with its category siblings.

> **Hand-creating a component folder is a pattern violation.** Always run the scaffolder. The template is the contract.

---

## 4. Choosing a category and slug

### The 9 categories (fixed set)

Source of truth: [src/registry/categories.ts](../src/registry/categories.ts). **Do not invent new categories without going through §16.**

| Slug | Label | Use for |
|---|---|---|
| `data` | Data Display | Tables, charts, lists, stats, KPIs, dashboards |
| `forms` | Forms | Inputs, builders, multi-step flows, validation |
| `navigation` | Navigation | Headers, sidebars, breadcrumbs, command palettes, tabs |
| `feedback` | Feedback | Toasts, alerts, empty states, loaders, progress |
| `overlays` | Overlays | Dialogs, drawers, sheets, popovers, tooltips |
| `marketing` | Marketing | Heroes, pricing, testimonials, feature grids, CTAs |
| `layout` | Layout | Page shells, dashboard frames, splits, grids |
| `media` | Media | Image galleries, video players, carousels, file viewers |
| `auth` | Auth | Login, signup, account, multi-factor, session UI |

Decision tree for ambiguous cases:

- A "command palette" with `Cmd+K` opens a list of actions → **`navigation`** (it's how you get around), not `overlays` (the modal is just the surface).
- A "stat card" → **`data`**, not `marketing`. Marketing is for landing-page hero/pricing components, not internal app metrics.
- A "drag-and-drop file uploader" → **`media`** (it accepts files), not `forms` (forms are about typed inputs).
- An "empty state" → **`feedback`**, not `layout`. Empty states convey state, not structure.

### Slug naming

Source of truth: regex in [scripts/new-component.mjs:174](../scripts/new-component.mjs#L174) — `/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/`.

Rules:

- Lowercase only.
- Kebab-case (hyphens between words).
- Must start with a letter.
- No leading or trailing hyphens.
- No double hyphens.
- Numbers OK after the first letter.

| Pass | Fail |
|---|---|
| `stat-card` | `Stat-Card` (uppercase) |
| `multi-select` | `-stat` (leading hyphen) |
| `command-palette` | `stat-` (trailing hyphen) |
| `data-table` | `stat--card` (double hyphen) |
| `wizard-2` | `2-step` (starts with number) |

**Style:** noun phrase, singular. `stat-card` not `stat-cards`. `data-table` not `tables`.

**Renaming cost is high.** The slug appears in: folder name, `<slug>.tsx` filename, three manifest imports, the URL, `meta.slug`, and any `related[]` cross-link. Pick once.

If `toTitle(slug)` doesn't give you the display name you want (e.g. `usa-card` becomes "Usa Card"), pass `--name="USA Card"` to the scaffolder.

### Three sources of truth — two of them can silently drift

The 9 categories are hand-maintained in three places:

- [src/registry/types.ts:5-14](../src/registry/types.ts#L5) — the `ComponentCategorySlug` TypeScript union (compile-time check)
- [src/registry/categories.ts](../src/registry/categories.ts) — the `CATEGORIES` record carrying `label`, `description`, and `order` for each slug
- [scripts/new-component.mjs:27-37](../scripts/new-component.mjs#L27) — the `VALID_CATEGORIES` array (runtime scaffolder check)

`categories.ts` is keyed by `Record<ComponentCategorySlug, CategoryMeta>`, so its *set of keys* is type-checked against `types.ts` — the keys can't drift. What CAN drift silently is the pair `types.ts` ↔ `new-component.mjs`: TypeScript won't catch a missing entry in the scaffolder array, and the scaffolder won't catch a missing entry in the union. The order is also different in each (`types.ts` puts `marketing` before `overlays`; the scaffolder puts `overlays` before `marketing`) — harmless, but a tell that they're hand-synced. **Adding or removing a category requires editing all three files.** See §16.

---

## 5. Anatomy of a component folder

Every component is a sealed folder. The shape is non-negotiable.

```
src/registry/components/<category>/<slug>/
├── <slug>.tsx          ← the component (named export)
├── types.ts            ← public API (prop types)
├── dummy-data.ts       ← realistic-but-fake fixtures
├── demo.tsx            ← default export, RSC-safe, what users see
├── usage.tsx           ← default export, prose + code block
├── meta.ts             ← rich metadata
└── index.ts            ← barrel
```

Optional, only when justified:

- `parts/` — private sub-components, when the main component naturally decomposes into >3 pieces (see §9).
- `hooks/` — private hooks, when state/effect logic is non-trivial enough to extract.

**What does NOT belong in a component folder:**

- No `*.test.tsx`. There's no test runner wired up; don't add infrastructure ad-hoc — raise it as a STATUS decision first.
- No `*.css` or `*.module.css`. Tailwind utilities only.
- No `*.stories.tsx`. There's no Storybook.
- No `README.md` per component. The auto-rendered docs page IS the component's README.
- No assets (images, fonts). If you need an asset, declare it via prop and let the consumer wrap with `next/image` or whatever they use.

### Build order

Implement in this order:

1. `types.ts` — define the public API first.
2. `<slug>.tsx` — implement against the types.
3. `dummy-data.ts` — write realistic fixtures.
4. `demo.tsx` — render the component with the fixtures.
5. `usage.tsx` — document how to use it.
6. `meta.ts` — fill the metadata (the scaffolder seeds this with `TODO:` strings).
7. `index.ts` — barrel-export.

The scaffolder creates skeletons of all seven; you flesh them out top-to-bottom.

---

## 6. File-by-file reference

The running example throughout this section is [src/registry/components/data/data-table/](../src/registry/components/data/data-table/) — the canonical pro-component. When in doubt, mirror it.

### 6.1 `types.ts` — the public API contract

Written first. All consumer-facing prop types live here. Sibling files import from `./types`.

Real example ([data-table/types.ts](../src/registry/components/data/data-table/types.ts)):

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
```

Rules:

- **Export every prop type** — consumers extend or compose them. `DataTableProps` and `DataTableColumn` are both exported.
- **Use generics** when the component is data-shape-agnostic. `DataTable<TRow>` lets the consumer's row type flow through to the accessor.
- **`ReactNode` is the right escape hatch** for "anything renderable" (cell content, captions, empty states).
- **Type-only imports** for React types: `import type { ReactNode } from "react"`. Don't import the React runtime.

### 6.2 `<slug>.tsx` — the component

Named export, PascalCase from the slug. Default RSC-safe (no `"use client"` unless you actually need it — see §10).

Real example imports ([data-table/data-table.tsx:1-13](../src/registry/components/data/data-table/data-table.tsx#L1)):

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { DataTableProps } from "./types";

export function DataTable<TRow>({ columns, rows, caption, emptyState, rowKey }: DataTableProps<TRow>) {
  // ...
}
```

Rules:

- **Imports stay on the allowlist** (§7): `react` types only via `import type`, `@/components/ui/*`, `@/lib/utils`, declared third-party deps, sibling files.
- **No React runtime import.** Notice data-table.tsx imports nothing from `react` itself — JSX in React 19 doesn't need it. Only `import type` from `react` for type imports.
- **Compose shadcn primitives. Never reach into them or fork them.** The day you copy-paste a primitive's source into your component is the day the design system fragments.
- **Use `cn()` from `@/lib/utils`** for class merging (it handles Tailwind class conflicts).
- **Conventional `className?: string` prop**, merged via `cn()` at the root element. Lets consumers compose layout (`className="h-full w-full"` etc.) without forking.
- **Empty / loading / error states live IN the component**, not the consumer. data-table's empty branch ([data-table.tsx:20-26](../src/registry/components/data/data-table/data-table.tsx#L20)):

  ```tsx
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {emptyState ?? "No records to display."}
      </div>
    );
  }
  ```

  The default message is sensible; the `emptyState` slot lets the consumer override.

> **Need a shadcn primitive that isn't installed?** Run `pnpm dlx shadcn@latest add <name>` *before* you write the import. Then list it in `meta.dependencies.shadcn`.

> **Need a third-party npm dep?** Check [package.json](../package.json) first — `lucide-react`, `radix-ui`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css` are already installed in this app, so the import will resolve. For anything new, `pnpm add <pkg>` first. **Either way, declare every third-party package you import in `meta.dependencies.npm`** — including the already-installed ones. That field becomes the peer-dependency list when the registry is extracted to NPM. The only implicit peers you skip are `react` and `react-dom`.

### 6.3 `dummy-data.ts` — fixtures for the demo

Realistic but obviously fake. The demo page is a public preview — your dummy data IS your branding here.

Real example ([data-table/dummy-data.ts](../src/registry/components/data/data-table/dummy-data.ts)):

```ts
export type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member" | "Viewer";
  status: "Active" | "Invited" | "Suspended";
  lastSeen: string;
};

export const DEMO_USERS: DemoUser[] = [
  { id: "u_01", name: "Aria Montgomery", email: "aria@ilinxa.dev", role: "Owner",  status: "Active",    lastSeen: "2 minutes ago" },
  { id: "u_02", name: "Bilal Hashemi",   email: "bilal@ilinxa.dev", role: "Admin",  status: "Active",    lastSeen: "1 hour ago" },
  // ... 3 more
];
```

Rules:

- **First names + `@ilinxa.dev` emails.** Never real-looking emails. Never recognizable real people.
- **4–8 rows for table-like components; 1–3 items for card-like.** Enough to show variety; not so much it scrolls.
- **Export the shape type AND the fixture.** The shape type doubles as a usage example for consumers.
- **Pre-formatted strings** for dates/numbers (`"2 minutes ago"`, `"12,483"`). Formatting is the consumer's concern; the registry component renders strings.
- **Naming convention: domain-noun plural** — `DEMO_USERS`, `DEMO_TICKETS`, `DEMO_INVOICES`. Reads naturally in the demo: `<DataTable rows={DEMO_USERS} ... />`.

> The `_template/` folder uses a placeholder name `TEMPLATE_DUMMY` because it's a generic skeleton. **Don't follow that convention in real components** — use the domain-noun pattern.

### 6.4 `demo.tsx` — what users see on the docs page

Default export. Renders the component with the dummy data. Zero chrome.

Real example ([data-table/demo.tsx](../src/registry/components/data/data-table/demo.tsx)):

```tsx
import { Badge } from "@/components/ui/badge";
import { DataTable } from "./data-table";
import { DEMO_USERS, type DemoUser } from "./dummy-data";
import type { DataTableColumn } from "./types";

const columns: DataTableColumn<DemoUser>[] = [
  { id: "name",    header: "Name",   accessor: (row) => /* … */ },
  { id: "role",    header: "Role",   accessor: (row) => /* … */ },
  { id: "status",  header: "Status", accessor: (row) => /* … */ },
  { id: "lastSeen", header: "Last Seen", align: "right", accessor: (row) => /* … */ },
];

export default function DataTableDemo() {
  return (
    <DataTable columns={columns} rows={DEMO_USERS} rowKey={(row) => row.id} caption="A starter table rendered from dummy data." />
  );
}
```

Rules:

- **Default export.** The manifest imports it as `import <Pascal>Demo from "./demo"`.
- **Compose configs inline** (column definitions, layout config, etc.) so readers see real consumption patterns, not a magical config blob.
- **No outer wrapper card.** [src/app/components/[slug]/page.tsx:117](../src/app/components/[slug]/page.tsx#L117) wraps the demo in `<div className="rounded-lg border border-border bg-background p-6">` already. If you add your own, you'll get nested borders.
- **Use `bg-card` (or `bg-popover`) for surfaces you create *inside* the demo.** The detail page's wrapper uses `bg-background`, which is the page canvas color; surfaces inside should visibly raise.
- **RSC-safe by default.** If your `<slug>.tsx` is `"use client"`, the demo can still be a server component (it just renders a client component as a child).

### 6.5 `usage.tsx` — written guidance + copy-pasteable code

Default export. Three H3 subsections: **When to use**, **Basic example**, **Notes**.

Rules:

- **Default export.** The manifest imports it as `import <Pascal>Usage from "./usage"`.
- **DO NOT use `prose` classes.** `@tailwindcss/typography` is not installed; `prose prose-neutral dark:prose-invert` are silent no-ops. Use explicit Tailwind utilities for headings, paragraphs, and lists.
- **Wrap content** in `<div className="max-w-none text-sm leading-relaxed text-foreground">`.
- **Heading style:** `<h3 className="mb-2 mt-0 text-base font-semibold">` (first), `mb-2 mt-6` for subsequent.
- **Paragraph style:** `<p className="text-muted-foreground">`.
- **List style:** `<ul className="ml-5 list-disc space-y-1 text-muted-foreground">`.
- **Code block:** `<pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs"><code>{...}</code></pre>`.
- **The example's import path** must be the registry path: `@/registry/components/<category>/<slug>`. Never relative, never an app-route path.
- **Document non-obvious props in Notes.** Things that aren't obvious from the type signature.

### 6.6 `meta.ts` — rich metadata

Every required `ComponentMeta` field populated. The scaffolder seeds this with `TODO:` strings — replace every one before merging.

Real example ([data-table/meta.ts](../src/registry/components/data/data-table/meta.ts)):

```ts
import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "data-table",
  name: "Data Table",
  category: "data",

  description: "A typed, composable table primitive with column accessors and per-cell rendering.",
  context:
    "DataTable is the foundational data display component — every more advanced table (sortable, paginated, virtualized) in this registry is expected to compose on top of it. It is deliberately small: one render, no client state, no DOM-level magic.",
  features: [
    "Generic over row type — fully type-safe column accessors",
    "Per-column alignment and fixed widths",
    "Custom empty state slot",
    "Composes any ReactNode in cells (badges, avatars, actions)",
  ],
  tags: ["table", "data", "list", "typed"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-04-26",
  updatedAt: "2026-04-26",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["table"],
    npm: {},
    internal: [],
  },

  related: [],
};
```

Field rules (source of truth: [src/registry/types.ts:30-52](../src/registry/types.ts#L30)):

| Field | Rule |
|---|---|
| `slug` | Kebab-case, **must exactly match the folder name and the URL**. |
| `name` | Title case display name. |
| `category` | Must be one of the 9 in `ComponentCategorySlug`. |
| `description` | One sentence, ≤ 120 chars. Renders on the catalog card AND the detail page header. |
| `context` | A paragraph: why this component exists, where it sits, what it composes. Renders only on the detail page. The most-skipped field; **don't skip it**. |
| `features` | Outcome-oriented bullets. ≤ 6. ("Generic over row type" not "uses TypeScript".) Renders only if non-empty. |
| `tags` | Lowercase single words preferred. First 4 render on the catalog card; all render on the detail page. |
| `version` | SemVer string. **First ship is `"0.1.0"`** — never `"1.0.0"`. |
| `status` | First ship is `"alpha"`. Promotion criteria in §14. |
| `createdAt` / `updatedAt` | ISO date `YYYY-MM-DD`. Scaffolder seeds today. **Bump `updatedAt` on real changes only** — typo fixes don't count. |
| `author` | String OR `{ name: string; url?: string }`. Both shapes handled at render time. |
| `dependencies.shadcn[]` | Every `@/components/ui/*` you import. **Be honest** — drives install instructions later. |
| `dependencies.npm{}` | `{ "package-name": "^semver" }` for every third-party npm dep your component imports — *including* ones already installed in this app (e.g. `lucide-react`). This field becomes the peer-dependency list when the registry is extracted to NPM, so be honest. The only implicit peers you skip are `react` / `react-dom`. |
| `dependencies.internal[]` | Other registry components this one composes (e.g. `["data/data-table"]`). |
| `related` | Slugs that compose with or supersede this one. **Reserved — not yet rendered. See note below.** |
| `thumbnail` | Optional image path. **Reserved — not yet rendered.** |
| `subcategory` | Optional. **Reserved — not yet rendered.** |

#### What renders where (the visual contract)

This table is the source of truth for which fields show up on which page. Compiled from [src/app/components/page.tsx](../src/app/components/page.tsx) and [src/app/components/[slug]/page.tsx](../src/app/components/[slug]/page.tsx).

| Field | Catalog card `/components` | Detail page `/components/<slug>` |
|---|---|---|
| `name` | ✅ as `CardTitle` | ✅ as `<h1>` |
| `description` | ✅ `CardDescription`, line-clamp-2 | ✅ in header, `max-w-2xl` |
| `status` | ✅ as Badge | ✅ as Badge |
| `version` | ❌ | ✅ as version chip |
| `category` (resolved to label) | ✅ section header | ✅ in metadata strip |
| `tags` | ✅ first 4, as pills | ✅ all, in Tags section |
| `context` | ❌ | ✅ as paragraph |
| `Demo` | ❌ | ✅ wrapped in `bg-background` border |
| `Usage` | ❌ | ✅ rendered inline |
| `features` | ❌ | ✅ as `<ul>` (only if non-empty) |
| `dependencies.shadcn[]` | ❌ | ✅ in Dependencies block |
| `dependencies.npm{}` | ❌ | ✅ in Dependencies block |
| `dependencies.internal[]` | ❌ | ✅ in Dependencies block |
| `createdAt` / `updatedAt` | ❌ | ✅ in metadata strip |
| `author` | ❌ | ✅ in metadata strip (string or `{name}`) |
| `subcategory` | ❌ | ❌ (reserved) |
| `thumbnail` | ❌ | ❌ (reserved) |
| `related` | ❌ | ❌ (reserved) |
| `RegistryEntry.examples` | ❌ | ❌ (reserved, not consumed by manifest entries) |

> **Reserved fields:** `subcategory`, `thumbnail`, `related`, and `RegistryEntry.examples` exist on the types but are not rendered anywhere yet. Don't waste effort filling them expecting display. Leave defaults (`undefined` or `[]`).

> **Status badge color:** [components/page.tsx:78-83](../src/app/components/page.tsx#L78) and [[slug]/page.tsx:56-62](../src/app/components/[slug]/page.tsx#L56) hard-code only three states: `stable → default`, `deprecated → destructive`, anything else → `secondary`. Practical effect: **`alpha` and `beta` look identical in the UI.** Tracked as an open decision in STATUS.md.

### 6.7 `index.ts` — the barrel

Real example ([data-table/index.ts](../src/registry/components/data/data-table/index.ts)):

```ts
export { DataTable } from "./data-table";
export type { DataTableColumn, DataTableProps } from "./types";
export { meta } from "./meta";
```

Rules:

- Export the **named component** from `<slug>.tsx`.
- Export **all public types** from `types.ts`.
- Export **`meta`** from `meta.ts`.
- **Do NOT re-export `Demo` or `Usage`.** The manifest imports them directly from `./demo` and `./usage` — re-exporting bloats the public surface.

---

## 7. The hard rules: portability contract

The single most important rule of pro-components: **every import a registry component makes is a future NPM peer dependency.** The library will be extracted to NPM; we are paying portability now.

### Allowlist

```tsx
// ✅ React types only — never the runtime
import type { ReactNode, ComponentType } from "react";

// ✅ shadcn primitives in src/components/ui/
import { Card, CardContent } from "@/components/ui/card";

// ✅ The cn() helper
import { cn } from "@/lib/utils";

// ✅ Sibling files in the same component folder
import type { StatCardProps } from "./types";
import { DEMO_STATS } from "./dummy-data";

// ✅ Declared third-party deps (must appear in meta.dependencies.npm)
import { ArrowUp } from "lucide-react";
```

### Banned

```tsx
// ❌ next/* — Link, Image, navigation, headers, font, dynamic, server, etc.
import Link from "next/link";              // → take href as a string prop
import Image from "next/image";            // → take src as a string prop
import { useRouter } from "next/navigation"; // → expose onSelect callback

// ❌ Site chrome — app-specific by definition
import { SiteHeader } from "@/components/site/site-header";

// ❌ App routes / pages
import { something } from "@/app/...";

// ❌ Environment access
const token = process.env.API_TOKEN;       // → take config as a prop
```

> If you reach for a `next/*` import, the component is in the wrong folder.

### How to dodge each ban

| Need | Banned path | Allowed path |
|---|---|---|
| Navigation link | `next/link` | `href: string` prop, render `<a>` |
| Images | `next/image` | `src: string` prop, render `<img>` |
| Routing actions | `next/navigation` `useRouter` | `onSelect` / `onClick` callback prop |
| Server-only data | `process.env`, `next/headers` | Pass config via props |
| Browser APIs | `window`, `document` at module scope | `useEffect` inside, with `"use client"` |

---

## 8. Design system contract

Source of truth for tokens: [src/app/globals.css](../src/app/globals.css). **Don't restate OKLCH values in components — use semantic Tailwind utilities.**

### Use semantic tokens, never hard-coded colors

✅ Allowed:

```tsx
className="bg-card text-card-foreground"
className="bg-background text-foreground"
className="bg-muted text-muted-foreground"
className="bg-primary text-primary-foreground"
className="bg-secondary text-secondary-foreground"
className="bg-accent text-accent-foreground"
className="bg-destructive text-destructive-foreground"
className="border-border"
className="ring-ring"
```

❌ Banned:

```tsx
className="bg-white"            // → bg-card or bg-background
className="bg-black"            // → bg-foreground (inverse) or bg-card in dark mode
className="bg-gray-50"          // → bg-muted
className="bg-zinc-900"         // → bg-card
className="text-white"          // on bg-primary → text-primary-foreground
style={{ color: "#888" }}       // → text-muted-foreground
className="bg-[#bada55]"        // → text-primary or define a token
```

### The lime + foreground rule

The brand accent (`--primary`) is signal-lime. Lime is bright at OKLCH lightness 0.80, so:

- **`bg-primary` is paired with `text-primary-foreground`** (which is near-black). Always.
- **Do not use `text-white` on `bg-primary`.** The contrast fails (~3.4:1, below WCAG AA for body text).
- If you genuinely want white-on-green, that's a darker forest green — a different token, not `--primary`. Discuss before adding new tokens.

### Typography

The page sets Onest (sans) and JetBrains Mono (mono) globally. **Do not set `font-family` directly.** Use `font-sans` (default, you don't need to write it) and `font-mono` for code, version chips, metadata strips.

### Spacing and radius

Stick to Tailwind defaults. `gap-2`, `gap-4`, `p-6`, `rounded-md`, `rounded-full` (pills/badges).

Don't reach for arbitrary values (`gap-[7px]`) without a real reason. The default scale exists to keep components in rhythm with each other.

### Motion

Page-level reveals are owned by the page (`reveal-up` on landing-page hero, etc.). **Do not add component-level mount animations.** A component that pulses or slides in every time it mounts will be infuriating in a list.

If your component genuinely needs motion (a modal opening, a toast appearing), use the existing `tw-animate-css` utilities or shadcn's animation conventions — never roll your own keyframes.

### Accessibility (quality bar, not a nice-to-have)

- **Keyboard navigation must work.** Every interactive element reachable by `Tab`. Every action triggerable without a mouse.
- **Don't override `outline-none` without a `focus-visible:` replacement.** shadcn primitives provide `focus-visible:ring-2 focus-visible:ring-ring` already; if you make a custom button, mirror that pattern.
- **Semantic HTML over divs.** `<button>`, `<nav>`, `<section>`, `<header>`, `<ul>` — use them. Divs are a last resort.
- **ARIA only where you've removed semantics** (or where the affordance isn't obvious). Don't sprinkle `role="button"` on a `<button>`.

---

## 9. Composition patterns

When you have a choice in API design, prefer the patterns this codebase already uses.

### Render props / accessor functions

When you can't predict cell/row content, take a function. data-table:

```tsx
export type DataTableColumn<TRow> = {
  id: string;
  header: ReactNode;
  accessor: (row: TRow) => ReactNode;
  // ...
};
```

Consumers pass any `(row) => JSX` — total flexibility, zero coupling.

### Generics over a type parameter

When the component is data-shape-agnostic, introduce a type parameter:

```tsx
export function DataTable<TRow>({ rows, columns, ... }: DataTableProps<TRow>) { ... }
```

The consumer's row type flows through cleanly to the accessors. No `any`. No `unknown`. No type assertions at the call site.

### `children` as the escape hatch

For layout-shaped components (page-header, empty-state body, dialog), `children: ReactNode` is the right tool. Don't try to spec out every possible content node:

```tsx
type PageHeaderProps = {
  title: string;
  children?: ReactNode; // actions, breadcrumbs, anything the consumer wants
};
```

### Slot props (named ReactNode props)

For 2–4 well-defined extension points, named props beat `children`:

```tsx
type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};
```

data-table does this with `caption?: string` and `emptyState?: ReactNode`.

### Headless core + presentation wrapper

When interactivity is non-trivial (combobox, command palette, form wizard):

```
my-component/
├── my-component.tsx         ← presentation
├── hooks/
│   └── use-my-component.ts  ← state, effects, logic
└── ...
```

Extract the hook so consumers can opt for the headless API if they want a fully-custom shell.

### `parts/` subfolder

Only when the component naturally decomposes into >3 sub-components that consumers might reasonably want to recompose. For 1–3 sub-components, keep them inline in `<slug>.tsx` and don't fragment for fragmenting's sake.

### State ownership: controlled by default

Default to *consumer owns state*. Add an uncontrolled mode (with internal `useState`) only when the friction of always-controlled is real. **Never reach for React Context inside a registry component** — Context is an app concern, not a library one. If you need global state, the consumer wires it.

---

## 10. Client vs server boundaries

By default, a registry component is server-renderable. **Do not add `"use client"` unless you actually need it.**

Add `"use client"` to `<slug>.tsx` only when you use:

- `useState`, `useReducer`, `useRef`
- `useEffect`, `useLayoutEffect`
- Event handlers (`onClick`, `onChange`, `onKeyDown`) on native elements
- Browser APIs (`window`, `document`, `IntersectionObserver`)

If you add it, **add it only to `<slug>.tsx`.** `demo.tsx`, `usage.tsx`, `meta.ts`, `index.ts`, `types.ts`, `dummy-data.ts` should stay server-safe.

The detail page server-renders Demo. A client component will hydrate (that's fine), but each unnecessary `"use client"` is a small performance and SEO hit.

---

## 11. Registering the component

The scaffolder prints exactly what to paste. Don't improvise.

```tsx
// At the top of src/registry/manifest.ts, alongside existing imports:
import StatCardDemo from "./components/data/stat-card/demo";
import StatCardUsage from "./components/data/stat-card/usage";
import { meta as statCardMeta } from "./components/data/stat-card/meta";

// Inside the REGISTRY array, grouped with other `data` category entries:
export const REGISTRY: RegistryEntry[] = [
  { meta: dataTableMeta, Demo: DataTableDemo, Usage: DataTableUsage },
  { meta: statCardMeta, Demo: StatCardDemo, Usage: StatCardUsage },  // new
  // ... other data entries
  // ... then forms entries, etc.
];
```

**Group by category** for `git diff` legibility. Order within a category isn't load-bearing, but readers expect it.

After registering, three URLs to verify:

1. `/components` — your component appears as a card under its category section.
2. `/components/<slug>` — detail page renders fully (preview, usage, features, tags, dependencies).
3. `/components/<wrong-slug>` — 404s correctly.

> **Don't auto-generate the manifest entry.** The deliberate hand-edit is the "did I actually think about this?" gate. The scaffolder declines to do it for you on purpose.

### Worked example: scaffolding `data/stat-card` from scratch

End-to-end walkthrough using the #1 roadmap item from STATUS.md. (This is a paper example — not actually shipped as part of this guide.)

#### 1. Sketch the API

```ts
type StatCardProps = {
  label: string;
  value: string;
  delta?: { direction: "up" | "down" | "flat"; value: string }; // "+8.2%"
  sparkline?: ReactNode;
  className?: string;
};
```

Five props, each justified. `label` and `value` are required (no faceless metrics). `delta` is optional (some metrics aren't comparative). `sparkline` is `ReactNode` (consumer brings any chart lib). `className` for grid-sizing composability.

#### 2. Run the scaffolder

```
$ pnpm new:component data/stat-card

✔ created src/registry/components/data/stat-card/

Add this entry to src/registry/manifest.ts:

  import StatCardDemo from "./components/data/stat-card/demo";
  import StatCardUsage from "./components/data/stat-card/usage";
  import { meta as statCardMeta } from "./components/data/stat-card/meta";

  // and add to REGISTRY:
  { meta: statCardMeta, Demo: StatCardDemo, Usage: StatCardUsage },
```

#### 3. Fill `types.ts`

```ts
import type { ReactNode } from "react";

export type StatCardDelta = {
  direction: "up" | "down" | "flat";
  value: string;
};

export type StatCardProps = {
  label: string;
  value: string;
  delta?: StatCardDelta;
  sparkline?: ReactNode;
  className?: string;
};
```

#### 4. Implement `stat-card.tsx`

```tsx
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StatCardProps } from "./types";

const ARROW = { up: ArrowUp, down: ArrowDown, flat: ArrowRight } as const;
const TONE = {
  up: "text-primary",
  down: "text-destructive",
  flat: "text-muted-foreground",
} as const;

export function StatCard({ label, value, delta, sparkline, className }: StatCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardContent className="flex flex-col gap-3 p-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </span>
        <span className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
          {value}
        </span>
        {delta ? (
          <span className={cn("inline-flex items-center gap-1 text-xs font-medium", TONE[delta.direction])}>
            {(() => {
              const Icon = ARROW[delta.direction];
              return <Icon className="size-3" />;
            })()}
            <span className="tabular-nums">{delta.value}</span>
          </span>
        ) : null}
        {sparkline ? <div className="mt-1 h-10 w-full">{sparkline}</div> : null}
      </CardContent>
    </Card>
  );
}
```

Notes: RSC-safe (no `"use client"`). Imports stay on the allowlist. Uses semantic tokens (`text-primary`, `text-destructive`, `text-muted-foreground`). Conventional `className` prop merged via `cn()`.

#### 5. Realistic `dummy-data.ts`

```ts
export type StatCardFixture = {
  label: string;
  value: string;
  delta: { direction: "up" | "down" | "flat"; value: string };
};

export const DEMO_STATS: StatCardFixture[] = [
  { label: "Active users",  value: "12,483", delta: { direction: "up",   value: "+8.2%"  } },
  { label: "Conversion",    value: "3.41%",  delta: { direction: "down", value: "−0.6pp" } },
  { label: "Avg. response", value: "184ms",  delta: { direction: "flat", value: "0%"     } },
];
```

#### 6. `demo.tsx` — no wrapper card

```tsx
import { StatCard } from "./stat-card";
import { DEMO_STATS } from "./dummy-data";

export default function StatCardDemo() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {DEMO_STATS.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
```

Note: the grid is the demo's structure; the cards have their own surface (`bg-card` from `<Card>`). The page wrapper provides the outer border.

#### 7. `usage.tsx` — explicit Tailwind, no `prose`

```tsx
export default function StatCardUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>StatCard</code> when you need to surface a single metric in a dashboard —
        value, label, optional delta, optional inline sparkline.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { StatCard } from "@/registry/components/data/stat-card"

export function Example() {
  return (
    <StatCard
      label="Active users"
      value="12,483"
      delta={{ direction: "up", value: "+8.2%" }}
    />
  )
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li><code>delta</code> is optional — omit for non-comparative metrics.</li>
        <li>The <code>sparkline</code> slot accepts any <code>ReactNode</code>; bring your own chart library.</li>
      </ul>
    </div>
  );
}
```

#### 8. Filled `meta.ts`

```ts
import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "stat-card",
  name: "Stat Card",
  category: "data",

  description:
    "A single-metric card with label, value, optional delta, and optional sparkline slot.",
  context:
    "StatCard is the atomic unit of dashboard composition — a typed surface for one number with one trend signal. Compose in a grid for KPIs; the sparkline slot lets you bring any chart library without coupling to one.",
  features: [
    "Tabular-nums for value alignment in grids",
    "Direction-tinted delta (up=primary, down=destructive, flat=muted)",
    "Sparkline slot accepts any ReactNode",
    "Conventional className prop for grid sizing",
  ],
  tags: ["stat", "kpi", "dashboard", "metric"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "2026-04-27",
  updatedAt: "2026-04-27",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["card"],
    npm: { "lucide-react": "^1.11.0" },
    internal: [],
  },

  related: [],
};
```

#### 9. Paste the manifest entry

In `src/registry/manifest.ts`, alongside the data-table entry. Done.

#### 10. Verify

```bash
pnpm dev
# open http://localhost:3000/components/stat-card
```

~30 minutes start to finish if you know the API ahead of time.

---

## 12. Anti-patterns

Five families of violations. Each as **violation → why it breaks → what to do instead.**

### Portability violations

| Violation | Why it breaks | Fix |
|---|---|---|
| `import Link from "next/link"` | Kills NPM extraction; `next` becomes a peer dep | Take `href: string` as prop, render `<a>` |
| `import Image from "next/image"` | Same | Take `src: string` as prop, render `<img>`; consumer wraps |
| `import { useRouter } from "next/navigation"` | Server/client coupling, won't work outside Next | Expose `onSelect` / `onClick` callback; consumer wires routing |
| `import { ... } from "@/components/site/*"` | App-chrome leak — those are intentionally app-specific | Don't. Those are off-limits to registry code |
| `process.env.X` | Won't work in a published package | Take config as a prop |

### Design system violations

| Violation | Why it breaks | Fix |
|---|---|---|
| `bg-white` / `bg-black` / `bg-gray-*` / `bg-zinc-*` | Not theme-aware — breaks dark mode and any future rebrand | `bg-background`, `bg-card`, `bg-muted`, `bg-foreground` |
| `text-white` on `bg-primary` | Lime fails contrast (~3.4:1) | `text-primary-foreground` |
| Hex / rgb literals (`#bada55`, `rgb(...)`) | Token system bypassed | Use semantic utilities |
| Manual `font-family` | Fights the global Onest/JetBrains Mono setup | `font-sans` / `font-mono` |
| `outline-none` without `focus-visible:` replacement | Kills keyboard accessibility | `focus-visible:ring-2 focus-visible:ring-ring` |
| Component-level mount animations | Painful in lists; the page owns reveal motion | No mount animations; only interaction-triggered |

### Architecture violations

| Violation | Why it breaks | Fix |
|---|---|---|
| Internal `useState` where controlled was right | Consumer can't integrate with their forms/router | Controlled by default; opt-in uncontrolled if friction is real |
| React Context inside a registry component | Won't work outside the docs app | Pass via props; the consumer wires global state |
| Adding `tests/` or `*.test.tsx` | No test runner is wired yet | Don't add infrastructure ad-hoc; raise a STATUS decision first |
| Editing `manifest.ts` before scaffolding | Broken imports until the folder exists | Scaffold first, register second |
| Hand-creating a folder, skipping the scaffolder | Drift from template shape | Always run `pnpm new:component` |
| Wrapping Demo in your own card | Docs page already provides the wrapper | Just render the component naked |

### Metadata violations

| Violation | Why it breaks | Fix |
|---|---|---|
| Leftover `TODO:` strings in `description` / `context` | Ships broken docs | Replace every TODO before merge |
| `version: "1.0.0"` on first ship | Falsely claims stable surface | Start at `"0.1.0"`, status `"alpha"` |
| Empty `tags[]` | Component undiscoverable | At least the slug + 2–3 functional tags |
| Missing `dependencies.shadcn` while importing from `@/components/ui/*` | Future install instructions wrong | List every primitive |
| `meta.slug` mismatch with folder/URL | Detail page 404s | Slug is the URL is the folder name |
| Filling reserved fields (`thumbnail`, `subcategory`, `related`) expecting display | They're not rendered yet | Leave defaults |

### Demo / Usage violations

| Violation | Why it breaks | Fix |
|---|---|---|
| Wrapping demo in your own card | Docs page provides one — nested borders | Render the component naked |
| Real names / real-looking emails in dummy data | Privacy + legal smell | First names + `@ilinxa.dev` |
| Non-registry import paths in usage code blocks | Consumers can't copy-paste | `@/registry/components/<category>/<slug>` |
| `"use client"` on Demo when not needed | Useless hydration cost | Default RSC; only the component itself opts in |
| `prose` classes in usage.tsx | `@tailwindcss/typography` not installed — silent no-op | Explicit Tailwind utilities (see §6.5) |

### Anti-example: five violations in one snippet

```tsx
// stat-card.tsx — DO NOT DO THIS
"use client";                                                 // ❌ unnecessary (no state/effects)
import Link from "next/link";                                 // ❌ portability violation
import { useRouter } from "next/navigation";                  // ❌ portability violation

export function StatCard({ label, value, href }) {
  const router = useRouter();                                 // ❌ same
  return (
    <div
      className="bg-white rounded p-4"                        // ❌ pure white; not theme-aware
      style={{ borderColor: "#bada55" }}                      // ❌ hex literal
      onClick={() => router.push(href)}
    >
      <Link href={href}>{label}: {value}</Link>
    </div>
  );
}

// meta.ts
export const meta: ComponentMeta = {
  slug: "stat-card",
  name: "Stat Card",
  category: "data",
  description: "TODO: short, single-sentence description...",  // ❌ leftover TODO
  context: "TODO: a paragraph explaining...",                  // ❌ leftover TODO
  tags: [],                                                    // ❌ empty
  version: "1.0.0",                                            // ❌ "1.0.0" on first ship
  status: "stable",                                            // ❌ stable on first ship
  // ...
};
```

The corrected version is the worked example in §11.

---

## 13. Verification checklist

Copy-paste into your PR description. All 16 must be `[x]` before merge.

- [ ] Does `pnpm tsc --noEmit` pass?
- [ ] Does `pnpm lint` pass?
- [ ] Does `pnpm dev` show the component at `/components/<slug>` with no console warnings?
- [ ] Does the catalog card show: name, description (truncated to 2 lines), status badge, first 4 tags?
- [ ] Does the detail page show: context paragraph, working preview, usage prose with copy-pasteable code block, features list, full tags list, all declared dependencies?
- [ ] Did you replace every `TODO:` and "Replace this..." string in `meta.ts` and `usage.tsx`?
- [ ] Does `meta.slug` exactly match the folder name and the URL?
- [ ] Does the named export in `<slug>.tsx` match the PascalCase form of the slug?
- [ ] Are `Demo` and `Usage` default exports (not named)?
- [ ] Did you import only from the allowlist (`react` types, `@/components/ui/*`, `@/lib/utils`, declared deps)?
- [ ] Did you grep your component folder for `next/`, `process.`, `bg-white`, `text-white`, `#`, `rgb(`, `prose ` and find nothing unexpected?
- [ ] Did you list every `@/components/ui/*` you import in `meta.dependencies.shadcn`?
- [ ] Is `version: "0.1.0"` and `status: "alpha"` for first ship?
- [ ] Did you toggle the theme via the dev site's theme toggle and verify both light and dark look right?
- [ ] Did you update [.claude/STATUS.md](../.claude/STATUS.md) (Components table + Recent decisions entry)?
- [ ] Is the manifest entry placed with its category siblings, not appended to the bottom?

---

## 14. Versioning, status, lifecycle

### Status ladder

| Status | Meaning | Promotion criteria |
|---|---|---|
| `alpha` | First ship. API may break weekly. | Every component starts here. |
| `beta` | Used in 1+ real consumer outside the docs site. Breaking changes get a deprecation notice in the changelog. | At least one external consumption + a usage doc with notes. |
| `stable` | API frozen behind SemVer. Breaking changes mean a major bump. | No breaking changes for 30 days + signed off in a STATUS update. |
| `deprecated` | Don't use. Carries a `related` pointer to the successor (when `related[]` is wired up — currently you'd note the successor in `context`). | Replaced or unmaintained. |

> **Note:** `alpha` and `beta` render with the same `secondary` badge variant in the UI today. The badge color collision is tracked as an open decision in STATUS.md.

### SemVer rules

- **patch** = bug fix, docs change, internal refactor with no API change
- **minor** = additive (new optional prop, new variant, new export)
- **major** = breaking (removed prop, changed required prop type, changed default behavior)

**Below `1.0.0`, minor can break.** That's what `alpha` signals — consumers should pin exact versions if they care about stability.

### Bump rules

- **Bump `version`** per SemVer when behavior or API changes.
- **Bump `updatedAt`** alongside any version bump.
- **Don't bump `version` for typo fixes** in description/context. Bump `updatedAt` only.

### Graduating to its own NPM package

Eventually some components will outgrow this monorepo. A reasonable trigger: **stable + 3 external consumers + significant API surface (>200 LOC)**. At that point, extract to its own package. Until then, the registry is the right home — extraction prematurely creates maintenance overhead with no payoff.

---

## 15. Updating an existing component

The same conventions apply. Specifically:

- **Bump `updatedAt`** whenever behavior or docs change in a meaningful way.
- **Bump `version`** per SemVer (§14).
- **If you break the public API:**
  - Update every consumer in the docs app + the usage code block.
  - Add a migration note in `usage.tsx` Notes section.
  - If status was `stable`, bump major (e.g. `1.2.3` → `2.0.0`).
- **If renaming:**
  - Add the new slug as a new component.
  - Mark the old slug `deprecated`.
  - Cross-link via the `related[]` field (reserved but document the intent for when it's rendered).
  - Don't delete the old folder for at least one minor cycle — give consumers time to migrate.
- **Re-run the §13 verification checklist.**

---

## 16. Adding a new category

This is rare. Categories are intentionally a closed set. If you find yourself wanting a 10th, talk to the team first.

### Touch list (in this order)

1. **[src/registry/types.ts](../src/registry/types.ts)** — add the new slug to the `ComponentCategorySlug` union.
2. **[src/registry/categories.ts](../src/registry/categories.ts)** — add the entry to the `CATEGORIES` record with `slug`, `label`, `description`, and the next `order` number.
3. **[scripts/new-component.mjs](../scripts/new-component.mjs)** — add the slug string to the `VALID_CATEGORIES` array.
4. **[.claude/STATUS.md](../.claude/STATUS.md)** — record the decision in Recent decisions.
5. (Optional) **This guide's category table** in §4 — add the row.

> **The drift-prone pair: `ComponentCategorySlug` (TypeScript) and `VALID_CATEGORIES` (runtime scaffolder).** If you forget one, the failure mode is silent (scaffolder rejects what TS allows, or vice versa). `categories.ts` is type-keyed by the union so its *keys* can't drift, but its labels/descriptions/orders are independent — you still have to touch all three (steps 1-3 above).

### Verify

```bash
# scaffolder accepts the new category
pnpm new:component <new-category>/probe

# delete the probe folder
rm -rf src/registry/components/<new-category>/probe
rmdir src/registry/components/<new-category>
```

> **Empty categories are invisible.** [manifest.ts:44](../src/registry/manifest.ts#L44) filters categories with zero entries via `.filter((group) => group.entries.length > 0)`. The new category won't render on `/components` until the first component lands. That's intentional.

---

## 17. Troubleshooting

### "Page 404s on `/components/<slug>`"

- `meta.slug` doesn't match the URL. Open `meta.ts` and fix the slug to match the folder name.
- OR you didn't paste the manifest entry. Check `src/registry/manifest.ts`.

### "Catalog card shows but detail page is blank"

- `Demo` or `Usage` isn't a default export. Open `demo.tsx` / `usage.tsx` and confirm `export default function ...`.

### "Component renders but theme tokens look broken"

- You used `bg-gray-*`, `bg-white`, `bg-black`, or a hex literal somewhere. Grep your folder:
  ```
  Grep "bg-white|bg-black|bg-gray|bg-zinc|#[0-9a-f]" src/registry/components/<category>/<slug>/
  ```

### "TS error in `_template/` after scaffolding"

- `_template/_template/` is a real, compiling folder. If you "cleaned up" the placeholders inside, restore them. The scaffolder needs the placeholders intact to produce correct components.

### "Build fails with 'cannot find module next/...'"

- You imported `next/*` from registry code. Remove it; see §7 for replacements.

### "Prose styling looks wrong / non-existent in usage.tsx"

- You used `prose` classes. They're silent no-ops because `@tailwindcss/typography` isn't installed. Replace with explicit Tailwind utilities (see §6.5).

---

## 18. Reference appendix

### Source-of-truth files

- [src/registry/types.ts](../src/registry/types.ts) — `ComponentMeta`, `ComponentStatus`, `ComponentCategorySlug`, `ComponentDependencies`, `RegistryEntry`
- [src/registry/categories.ts](../src/registry/categories.ts) — the 9 categories with labels and descriptions
- [src/registry/manifest.ts](../src/registry/manifest.ts) — `getEntry`, `getEntriesByCategory`, `getAllSlugs`, `getGroupedRegistry`, `getMetaList`
- [src/registry/components/data/data-table/](../src/registry/components/data/data-table/) — the canonical example
- [src/registry/components/_template/_template/](../src/registry/components/_template/_template/) — the skeleton (real, compiling code)
- [scripts/new-component.mjs](../scripts/new-component.mjs) — slug regex, replacement order, `VALID_CATEGORIES`
- [src/app/components/page.tsx](../src/app/components/page.tsx) — the catalog card layout
- [src/app/components/[slug]/page.tsx](../src/app/components/[slug]/page.tsx) — the detail page visual contract
- [src/app/globals.css](../src/app/globals.css) — design tokens (don't restate values)
- [.claude/CLAUDE.md](../.claude/CLAUDE.md) — Claude-side rules (terser; this guide is the human reference)
- [.claude/STATUS.md](../.claude/STATUS.md) — live state: components table, roadmap, decisions
- [README.md](../README.md) — stack and quick start
- [package.json](../package.json) — installed dependencies
