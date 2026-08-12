# ilinxa/pro-ui

Production-ready React components distributed via the [shadcn-registry](https://ui.shadcn.com/docs/registry) model. Built on shadcn/ui primitives + Tailwind CSS v4 + React 19. Install components into your Next.js (or any React) app with `pnpm dlx shadcn@latest add @ilinxa/<slug>` — source files copy into your repo, you own the code.

> **Demo:** [ui.ilinxa.com](https://ui.ilinxa.com) · **Catalog:** [/r/registry.json](https://ui.ilinxa.com/r/registry.json) · **AI reference:** [/llms.txt](https://ui.ilinxa.com/llms.txt)

---

## Install components in your app

### Prerequisites

Your consumer app needs **three** things in place before installing any `@ilinxa/*` component. The CLI handles peer deps; it does NOT seed the design system itself.

**1. Any React 19 host — Next.js is not required.**

Components are pure React. They import only `react`, sibling shadcn primitives, and explicitly-declared third-party deps — never `next/*`. Any React 19 host works: Next.js 14/15/16 (App Router or Pages), Vite, Remix, Astro islands, RSPack, etc. Many components ship with a leading `"use client"` directive — load-bearing in the Next.js App Router, a harmless no-op everywhere else.

**2. Tailwind CSS v4 with the shadcn token set.**

This is a hard requirement, not a styling preference. Components render against semantic class names (`bg-card`, `text-foreground`, `border-border`, `bg-primary`, `text-muted-foreground`, `ring-ring`, …). Those classes only exist when Tailwind v4 reads a matching `@theme inline` block. Without it, the classes don't compile.

Concretely, the consumer's `globals.css` needs the canonical shadcn CSS variables (`--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`) defined under `:root` and `.dark`, plus an `@theme inline` block that maps them onto `--color-*` / `--radius-*` tokens. Running `pnpm dlx shadcn@latest init` against a v4 project does this for you.

A few components rely on extra tokens beyond the canonical set:

| Token group | Required by | Where to copy from |
|---|---|---|
| `--chart-1` … `--chart-5` | chart-shell, stat-card, rich-text-editor syntax highlighting | [src/app/globals.css:94-98, 132-136](src/app/globals.css#L94-L98) |
| `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring` (+ `-foreground` variants) | sidebar / nav surfaces | [src/app/globals.css:100-107, 137-144](src/app/globals.css#L100-L107) |
| `--warning`, `--warning-foreground` | components with semantic warning state | [src/app/globals.css:86-87, 126-127](src/app/globals.css#L86-L87) |
| `--xy-*` overrides | flow-canvas only | [src/app/globals.css:224-244](src/app/globals.css#L224-L244) |
| `.hljs-*` syntax classes | rich-text-editor only | [src/app/globals.css:246-304](src/app/globals.css#L246-L304) |

You **don't** need to copy the brand *values* — keep your own `--primary`, `--background`, etc. Every ilinxa component reads tokens by name, so it inherits whatever palette the host ships. The brand identity (signal-lime + cool off-white + graphite-cool dark) is only authoritative on this demo site.

**3. shadcn initialized in the project.**

```bash
pnpm dlx shadcn@latest init
```

This seeds `lib/utils.ts` (the `cn` helper that every primitive imports) and `components.json` (alias config). Skip if you've already used any shadcn component in the project.

### Register the namespace

Add the namespace to your project's `components.json` (merge with your existing config):

```json
"registries": {
  "@ilinxa": "https://ui.ilinxa.com/r/{name}.json"
}
```

### Install a component

```bash
# Lean install (component only)
pnpm dlx shadcn@latest add @ilinxa/properties-form

# With dummy-data fixtures (separate item)
pnpm dlx shadcn@latest add @ilinxa/properties-form-fixtures
```

The CLI auto-installs:
- shadcn primitives the component depends on (`button`, `popover`, etc.)
- npm peer deps (`lucide-react`, `@dnd-kit/*`, `@codemirror/*`, `marked`, etc.)

Files land at `components/<slug>/...` with the sealed folder intact — `src/components/<slug>/...` if your project uses a `src/` directory. A custom `aliases.components` doesn't relocate them (imports are rewritten to your aliases either way, so the install compiles as-is).

### Use it

```tsx
import { PropertiesForm } from "@/components/properties-form";

export function TaskEditor() {
  return (
    <PropertiesForm
      schema={taskSchema}
      values={task}
      onSubmit={async (next) => { /* persist */ }}
    />
  );
}
```

Per-component API + worked examples on the demo site at `/components/<slug>`.

### Update an installed component

shadcn-registry copies source verbatim — you own the code. To pull upstream changes:

```bash
pnpm dlx shadcn@latest add @ilinxa/<slug> --overwrite
```

Diff against your local modifications (use `--dry-run` first if unsure), merge, ship.

---

<!-- GENERATED CATALOG — do not edit; run `pnpm build:llms` -->
## Available components

63 components across 9 categories, each with an optional `-fixtures` sibling for example data. Generated from [`registry.json`](registry.json) — run `pnpm build:llms` after registry changes.

| Slug | Category | Description |
|---|---|---|
| `code-block` | code | Code surface with view, edit, and terminal modes — Shiki highlighting, dual-theme CSS variables, and chrome presets for… |
| `article-meta` | data | Icon-and-value metadata strip for article headers — author, date, read time, view count, or any custom pairs. |
| `blackboard` | data | Chalkboard-style team notes board — handwritten ink notes with pens, widths, pins, @mentions, auto-save, and lazy histo… |
| `card-tree` | data | JSON-driven recursive card tree with a full structural editor — drag and drop, multi-select, permissions, search, valid… |
| `card-tree-node` | data | Card-tree renderer for flow canvas nodes — read-only viewer, a consumer-owned edit dialog pattern, and a typed port edi… |
| `comment-thread` | data | Recursive comment thread with composer, optimistic add, like, and delete, inline expansion past max depth, and realtime… |
| `data-table` | data | A typed, composable table primitive with column accessors and per-cell rendering. |
| `engagement-bar` | data | Social action row — like, comment, share, bookmark, custom actions, and a multi-reaction picker with realtime counts an… |
| `event-calendar` | data | Editable event calendar with month, week, day, and agenda views — multi-day spans, drag and resize editing, clipboard s…<br>↳ optional slice: `event-calendar-editing` — Drag-and-resize editing, quick-compose creation, keyboard mutations, cross-surface clipboard, and permission-gated acti… |
| `event-card` | data | Event preview card with six status states and four layouts — capacity-aware badges, overlay links, and soft-failure ite… |
| `expandable-text` | data | Truncating text block that only shows its toggle when text actually overflows — configurable line clamp, controlled or… |
| `flow-canvas` | data | Node-and-edge canvas with typed ports, pluggable node renderers, edge and port-type registries, and JSON save and load… |
| `gantt-timeline` | data | Editable Gantt timeline — per-task bars, collapsible summary rows, milestone diamonds, continuous zoom from hours to qu… |
| `info-list` | data | Card-framed list of icon-prefixed rows — primary and secondary text, optional actions, per-row links, comfortable and c… |
| `kanban-board` | data | Drag-and-drop kanban board with swimlanes, tinted columns, per-column rules, and a renderer registry that hosts any car… |
| `news-card` | data | Magazine-style news card in five sizes — role-aware editor and viewer modes, permissions matrix, badges, paywall and se… |
| `people-grid` | data | Responsive grid of person cards — avatar with initials fallback, name, title, per-card links, and a custom item rendere… |
| `post-card` | data | Social post composite in four layouts — text expansion, media carousel, engagement bar, and comment thread wired togeth… |
| `progress-timeline` | data | Horizontal progress bar with a current-position marker and start, state-aware center, and end captions — derives its st… |
| `project-card` | data | Project and case-study card with editorial status states and grid or feature layouts — overlay links and soft-failure i… |
| `registration-card` | data | Event registration status card — capacity progress, spots-left counter, status-aware call to action, and a share slot. |
| `rich-text-editor` | data | Plate-powered WYSIWYG editor and read-only viewer for long-form articles — code blocks, captioned images, floating tool… |
| `schedule-list` | data | Time-anchored agenda list — time or range, title, optional description and icons, per-row links, framed or bare. |
| `stat-card` | data | Single-metric dashboard card — value, label, delta, and a dependency-free SVG sparkline with polarity-aware coloring. |
| `story-rail` | data | Horizontal story rail with unread gradient rings, drag-free skim scrolling, an add-story tile, and edge-fade gradients. |
| `task-card` | data | Schema-driven task card with time-aware color coding, popup and inline editing, clipboard and drag-drop payloads, and p… |
| `task-tree` | data | Hierarchical task outline with multi-select, bulk operations, search and filter toolbar, dual drag-and-drop, and virtua… |
| `thumbnail-list` | data | Linked thumbnail list — small image, title, and meta line per row, each row one link target. |
| `detail-panel` | feedback | Selection-aware detail container with read and edit modes, lifecycle states, sticky header and footer actions, and a sl… |
| `category-cloud` | forms | Flex-wrapped cloud of clickable category chips with optional counts — single-select, toggleable, controlled or uncontro… |
| `entity-picker` | forms | Searchable picker for typed entities — single or multi select, kind badges, chip cluster with removal, and custom rende… |
| `filter-bar` | forms | Composite filter bar — search, category pills, date-range picker, and results count, each independently controlled or h… |
| `filter-panel` | forms | Schema-driven filter panel — checkbox lists, toggles, text, and custom filter types with AND composition and debounced… |
| `json-form` | forms | Schema-driven form engine — a field DSL compiled to Zod, 25 field types including rich text, conditional and computed f… |
| `markdown-editor` | forms | CodeMirror 6 markdown editor with GFM, wikilink autocomplete, a slot-able toolbar, and edit, split, and preview modes. |
| `properties-form` | forms | Schema-driven read and edit form for typed records — six field types, per-field permissions, sync validation, and a cus… |
| `signup-form` | forms | Email and password signup with optional profile step, OAuth row, password strength meter, magic-link variant, consent g… |
| `team-challenge` | gamification | Cooperative team challenge card — one shared goal, collective progress, a whole-team reward, and penalty-free opt-in. |
| `team-feedback-loop` | gamification | Non-blocking celebration layer — a brief skippable overlay when team progress advances, plus a gentle dismissible next-… |
| `team-progress-bar` | gamification | Read-only team progress bar showing milestone completion — optional ticks and numeric readout, cooperative by design. |
| `team-quest-log` | gamification | Team quest overlay — an editable skippable quest name plus a milestone chapter timeline with done, current, and upcomin… |
| `team-task-claim` | gamification | Task autonomy control — an open-for-anyone toggle, a volunteer claim button, and an assignee chip with neutral release… |
| `team-trophy-shelf` | gamification | Gallery of earned team badges with honest locked slots, an optional count header, and a brief skippable reveal for new… |
| `magazine-layout` | layout | Slot-based magazine layout — hero, filter bar, sidebar, and a mixed-size article grid with infinite scroll and a filter… |
| `split-workspace` | layout | Splittable, mergeable canvas of editor areas — a dynamic layout primitive for dashboards, dev tools, and data apps. |
| `author-card` | marketing | Person identity card — avatar, name, role, optional bio, optionally clickable. |
| `newsletter-signup` | marketing | Newsletter signup card — inline email form or CTA-only variant, async status tracking, three tones, full i18n. |
| `page-hero` | marketing | Full-bleed gradient hero band — badge, title, highlight, description, stats row, and a reveal-on-mount animation. |
| `pricing-table` | marketing | Pricing tiers side by side — monthly and annual toggle, highlighted tier, per-feature tooltips, and a comparison layout. |
| `share-bar` | marketing | Social share button row — nine built-in platforms, custom targets, and copy-link with success feedback. |
| `carousel-composer` | media | Multi-item media post composer — drag in photos and videos, reorder them on a rail, and edit each through a shared edit… |
| `content-composer` | media | Multi-step content authoring shell — each content type is a JSON config composing form, rich text, and media editing st… |
| `media-carousel` | media | Embla image and video carousel — gallery or linear variants, coordinated video pause for inactive slides. |
| `media-editor` | media | Media capture and edit surface for photo, video, and text — capability dials and an Instagram-style chrome model.<br>↳ optional slice: `media-editor-capture` — Camera photo/video capture for Media Editor — permission flows, shutter control, multi-instance guard. |
| `media-library` | media | Drive-style media library — folders and files, lazy loading, drag-drop upload, drag-to-move, context menus, and multi-t… |
| `pdf-viewer` | media | Drop-in PDF reader — toolbar, zoom, selectable text, drag-drop, and a themed context menu. |
| `story-composer` | media | Instagram-style story creation surface — a locked 9:16 wrapper around the media editor. |
| `story-viewer` | media | Full-screen story viewer — segmented progress, 3D cube transitions, finger-following swipe, tap zones, and an engagemen… |
| `video-player` | media | Video element wrapper — autoplay-friendly defaults, slot-based controls, carousel-coordinated pause, and double-tap ges… |
| `account-switcher` | navigation | Popover account and context switcher — active label trigger, switchable context list, and a footer slot for create or r… |
| `app-sidebar` | navigation | App-shell sidebar with mobile drawer mode, twelve composition slots, prefab nav parts, and a headless state hook. |
| `file-manager` | navigation | Finder-style file browser — grid and list views, marquee multi-select, cut copy paste, drag-and-drop, and a shared clip… |
| `file-tree` | navigation | VS Code-style file tree — format-aware icons, full CRUD, drag-and-drop, lazy children, and multi-select. |
<!-- END GENERATED CATALOG -->

---

## Compatibility

- **React host** — any React 19 framework. Tested on Next.js 14 / 15 / 16 (App Router & Pages Router); works in Vite, Remix, Astro, RSPack, etc. Components never import `next/*`.
- **React version** — 19 (or 18 with graceful primitive variants).
- **Tailwind CSS** — **v4 required** (CSS-vars-only config; no `tailwind.config.*`). The components are written against semantic Tailwind tokens (`bg-card`, `text-foreground`, `border-border`, …) registered through `@theme inline`. v3 + JS config won't compile the class names. See [Prerequisites §2](#prerequisites).
- **Design tokens** — canonical shadcn token set required (`--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`). A few components also need `--chart-*`, `--sidebar*`, `--warning*` — see the table in [Prerequisites §2](#prerequisites).
- **Package managers** — pnpm / bun / yarn. npm + React 19 needs `--legacy-peer-deps`.

---

## AI / LLM access

A concise, AI-friendly registry reference is at [/llms.txt](https://ui.ilinxa.com/llms.txt).

Point Claude Code, Cursor, GitHub Copilot, or any AI assistant at this URL when working on a project that consumes the registry. It contains install steps, the full component list, common gotchas, and the namespace snippet — everything an AI needs to install components correctly without guessing.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Cannot find module '@/lib/utils'` after install | Run `pnpm dlx shadcn@latest init` in the consumer project. `shadcn add` doesn't seed the `cn` helper — `init` does. |
| Re-running `add` didn't pull upstream changes | Without `--overwrite`, locally-modified files are skipped — non-interactive runs auto-answer the overwrite prompt with "no" and exit 0, so exit-code checks can't detect it. Add `--overwrite` to update; the CLI diffs per file, so unchanged files are left alone. |
| `npm ERESOLVE` on React 19 peer deps | Use `npm install --legacy-peer-deps`, or switch to pnpm/bun which resolve cleanly. |
| Stale install after upstream registry update | The CLI doesn't cache; the CDN does. Wait out the 5-minute TTL or append `?v=<hash>` to the registry URL once. |

Longer-form troubleshooting + context: [/docs#troubleshooting](https://ui.ilinxa.com/docs#troubleshooting).

---

## Contributing — building components

> **Stack:** Next.js 16 (App Router, Turbopack, React Compiler) · React 19 · Tailwind v4 · shadcn CLI v4 · TypeScript 5 · pnpm 10
> **Building or modifying components?** See [docs/component-guide.md](docs/component-guide.md) — comprehensive developer reference covering anatomy, rules, design system, lifecycle, and a worked end-to-end example.

### Local dev

```bash
pnpm install
pnpm dev                # http://localhost:3000
pnpm registry:build     # regenerate public/r/*.json from registry.json
```

### Add a new component

```bash
pnpm new:component <category>/<slug>
# e.g. pnpm new:component data/stat-card
```

The scaffolder copies the canonical template at `src/registry/components/_template/_template/`, replaces tokens, writes a fresh `meta.ts`, and prints the 3 lines to paste into `src/registry/manifest.ts`. After implementing, add the component to `registry.json` (one base item + one `-fixtures` sibling) following the pattern of existing items. The `vercel-build` script regenerates the catalog automatically on each Vercel deploy.

Categories live in `src/registry/categories.ts` — `data`, `forms`, `navigation`, `feedback`, `overlays`, `marketing`, `layout`, `media`, `auth`.

### Project shape

```
src/
├── app/                     # docs site (consumes the registry)
├── components/
│   ├── site/                # site chrome — header, footer, theme toggle
│   └── ui/                  # shadcn primitives (treat as third-party)
├── lib/utils.ts
└── registry/                # THE LIBRARY — keep portable for distribution
    ├── categories.ts
    ├── manifest.ts
    ├── types.ts
    └── components/
        ├── _template/       # canonical template (excluded from manifest)
        └── <category>/<slug>/
            ├── <slug>.tsx   # main export
            ├── parts/, hooks/, lib/
            ├── types.ts
            ├── dummy-data.ts # ships in <slug>-fixtures item
            ├── demo.tsx     # docs-site only — NOT shipped via registry
            ├── usage.tsx    # docs-site only — NOT shipped via registry
            ├── meta.ts      # docs-site only — NOT shipped via registry
            └── index.ts
registry.json                # source of truth for the shadcn-registry catalog
public/r/                    # build artifacts — auto-regenerated by vercel-build
.claude/
├── CLAUDE.md                # project instructions for Claude Code
├── STATUS.md                # live progress tracker
└── skills/
    └── shadcn-registry-pro/ # the skill that documents this distribution model
scripts/new-component.mjs
```

**Registry import rules** — registry code may import only `react`, `@/components/ui/*`, `@/lib/utils`, and explicitly-declared third-party deps. Never `next/*` or app-level concerns. This keeps every sealed folder portable across consumer projects.

### Design system

- **Type:** Onest (sans), JetBrains Mono (mono)
- **Accent:** signal-lime — `oklch(0.80 0.20 132)` light / `oklch(0.86 0.18 132)` dark — paired with near-black foreground (lime is too bright for white text)
- **Light surfaces:** cool off-white page (`oklch(0.975 0.003 250)`); cards lifted to pure white for visible elevation
- **Dark surfaces:** graphite-cool — `0.13` base / `0.17` raised / `0.22` subtle, all at hue 250
- **Motion:** one orchestrated `reveal-up` per major page (60ms stagger), guarded by `prefers-reduced-motion`

Full token reference: [src/app/globals.css](src/app/globals.css). Mandate and "don'ts" (no Inter / Roboto / Geist / system-font defaults, no pure-white pages, no neon-saturated lime, no purple-on-white gradient clichés): [.claude/CLAUDE.md](.claude/CLAUDE.md).

### Status & roadmap

Live in [.claude/STATUS.md](.claude/STATUS.md) — current component catalog, next priorities, open decisions, and a rolling decisions log.

### Scripts

```bash
pnpm dev                                # next dev (Turbopack)
pnpm build                              # next build (local; production uses vercel-build)
pnpm vercel-build                       # shadcn build && next build (used by Vercel)
pnpm registry:build                     # shadcn build only — regenerate public/r/*.json
pnpm lint                               # ESLint
pnpm tsc --noEmit                       # typecheck
pnpm new:component <category>/<slug>    # scaffold a new component
pnpm dlx shadcn@latest add <name>       # add a shadcn primitive
```

---

## License

[MIT](LICENSE) — open source since 2026-08-11.
