# ilinxa/pro-ui

Production-ready React components distributed via the [shadcn-registry](https://ui.shadcn.com/docs/registry) model. Built on shadcn/ui primitives + Tailwind CSS v4 + React 19. Install components into your Next.js (or any React) app with `pnpm dlx shadcn@latest add @ilinxa/<slug>` — source files copy into your repo, you own the code.

> **Demo:** [ilinxa-proui.vercel.app](https://ilinxa-proui.vercel.app) · **Catalog:** [/r/registry.json](https://ilinxa-proui.vercel.app/r/registry.json) · **AI reference:** [/llms.txt](https://ilinxa-proui.vercel.app/llms.txt)

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
| `--chart-1` … `--chart-5` | chart-shell, stat-card, article-body-01 syntax highlighting | [src/app/globals.css:94-98, 132-136](src/app/globals.css#L94-L98) |
| `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring` (+ `-foreground` variants) | sidebar / nav surfaces | [src/app/globals.css:100-107, 137-144](src/app/globals.css#L100-L107) |
| `--warning`, `--warning-foreground` | components with semantic warning state | [src/app/globals.css:86-87, 126-127](src/app/globals.css#L86-L87) |
| `--xy-*` overrides | flow-canvas-01 only | [src/app/globals.css:224-244](src/app/globals.css#L224-L244) |
| `.hljs-*` syntax classes | article-body-01 only | [src/app/globals.css:246-304](src/app/globals.css#L246-L304) |

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
  "@ilinxa": "https://ilinxa-proui.vercel.app/r/{name}.json"
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

Files land at `components/<slug>/...` with the sealed folder intact.

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
| `code-block` | code | Language-agnostic code surface with view / edit / terminal modes, Shiki syntax highlighting, dual-theme CSS-variable th… |
| `article-body-01` | data | Plate-based WYSIWYG rich-text editor + RSC-friendly read-only viewer. |
| `article-meta-01` | data | Horizontal strip of icon + value pairs surfacing key metadata (author / date / read-time / view-count) under an article… |
| `blackboard-01` | data | A dark-navy chalkboard widget where a team writes handwritten notes — per-note ink color, chalk width, and handwriting… |
| `calendar-01` | data | Editable calendar over the canonical TodoItem[] — the date-grid sibling of gantt-timeline-01. |
| `comment-thread-01` | data | Recursive comment tree with composer + realtime. |
| `content-card-news-01` | data | Backend-shaped news card with 5 variants and the full A+ procomp surface: role-aware editor/viewer mode, 19-capability… |
| `data-table` | data | Generic typed-columns data table — composable column definitions, no client state, host-owned data. |
| `engagement-bar-01` | data | Discriminated-union action row (like / comment / share / bookmark / view-count / custom / reaction) with realtime subsc… |
| `event-card-01` | data | Event preview card with a 6-state status state machine (open / upcoming / lastSpots / ongoing / full / expired) and 4 v… |
| `expandable-text-01` | data | Truncate-and-expand plain-text block — measure-based detection (toggle only renders when truncation actually occurs), c… |
| `flow-canvas-01` | data | Node-and-edge canvas with typed ports, three keystone registries (renderer / port-type / edge-type), recursive sub-obje… |
| `gantt-timeline-01` | data | Editable project timeline (Gantt) over the canonical TodoItem[] — one bar per task from effective start→end, collapsibl… |
| `info-list-01` | data | Card-framed icon-prefixed details list — vertical rows of icon + primary + optional secondary + optional action. |
| `kanban-board-01` | data | Column-based board with drag-and-drop, swimlanes, color-tinted columns, and a pluggable renderer registry that hosts an… |
| `people-grid-01` | data | Section heading + responsive N-column grid of person cards (round avatar + name + title). |
| `post-card-01` | data | Tier-2 social-post composite — composes expandable-text-01 + media-carousel-01 + engagement-bar-01 + comment-thread-01… |
| `progress-timeline-01` | data | Horizontal progress bar with marker dot at current % + 3-caption row (start / dynamic state-aware center / end). |
| `project-card-01` | data | Project / case-study preview card with 3-state editorial status (completed / ongoing / planned) and 2 visual variants (… |
| `registration-card-01` | data | Card-framed registration status display — capacity progress + spots-left counter + status-aware primary CTA + optional… |
| `rich-card` | data | JSON-driven recursive card-tree viewer + structural editor. |
| `rich-card-in-flow` | data | Read-only RichCardViewer renderer for flow-canvas-01 nodes + consumer-owned-dialog pattern for editing rich-card conten… |
| `schedule-list-01` | data | Vertical time-anchored agenda — time + title + optional description rows. |
| `stat-card` | data | Single-metric dashboard widget — value + label + optional delta + optional sparkline. |
| `story-rail-01` | data | Horizontal stories rail (kasder-exact) — gradient ring on unread, muted ring on read; AddStoryThumbnail standalone expo… |
| `thumb-list-01` | data | Linked thumbnail-list block — small image + title + meta line per row, each row a single link target. |
| `todo-rich-card` | data | Time-aware task card with OKLCH border-color engine (urgency green→red ramp), dual edit modes (popup + inline-toggle),… |
| `todo-tree` | data | Lightweight tree-row renderer for TodoItem outlines. |
| `detail-panel` | feedback | Selection-aware compound container — DetailPanel.Header / .Body / .Actions via React Context. |
| `category-cloud-01` | forms | Always-visible flex-wrap of clickable category chips with optional inline counts. |
| `entity-picker` | forms | Searchable typed picker — single OR multi mode via mode prop with TS function overloads, kind badges via kinds map, thr… |
| `filter-bar-01` | forms | Composite filter bar with centered search + category pill row + date-range Popover + optional results count. |
| `filter-stack` | forms | Schema-driven controlled filter panel. |
| `json-form` | forms | Schema-driven form renderer — declarative field DSL compiled to Zod, 25 built-in field types (incl. |
| `markdown-editor` | forms | CodeMirror 6 substrate with three view modes (edit / split / preview), default 8-item toolbar, [[wikilink]] autocomplet… |
| `properties-form` | forms | Schema-driven controlled read/edit form. |
| `registration-form-01` | forms | Email + password registration form with optional second-step profile fields, ToS-consent gate, OAuth row above, passwor… |
| `cooperative-challenge-01` | gamification | A safe-by-design cooperative team challenge card: one shared goal, a collective progress meter (current / target, never… |
| `task-choice-control-01` | gamification | A small, droppable autonomy affordance for one team task (system E4): an 'open for anyone' toggle, an 'I'll take this'… |
| `team-feedback-loop-01` | gamification | A host-triggered, NON-BLOCKING cooperative feedback layer: a brief (<1s), skippable celebration overlay when team progr… |
| `team-progress-bar-01` | gamification | An always-visible, read-only progress bar showing one team's milestone-completion % — signal-lime fill on the shadcn pr… |
| `team-quest-log-01` | gamification | A light team narrative overlay (system E5): an editable, skippable quest name (a blank name falls back to the team's li… |
| `team-trophy-shelf-01` | gamification | A durable gallery of a team's earned milestone badges, with honest locked slots for what's ahead, an optional header co… |
| `grid-layout-news-01` | layout | Slot-based magazine layout — optional hero / filter bar / sidebar + a generic main-column tower (1 large + 2-up + N-up… |
| `workspace` | layout | Splittable canvas — corner-drag split/merge, edge-drag resize, registry-driven content, responsive collapse with per-br… |
| `author-card-01` | marketing | Card-framed person identity block — avatar (image OR icon fallback), name, role, optional bio. |
| `newsletter-card-01` | marketing | Brand-tinted CTA card with email signup. |
| `page-hero-news-01` | marketing | Full-bleed gradient hero band with badge / title / highlight / description / children slot. |
| `pricing-table-01` | marketing | Side-by-side pricing tier cards (2–4 tiers) with optional monthly/annual toggle, highlighted-tier badge, per-feature in… |
| `share-bar-01` | marketing | Horizontal cluster of social-share buttons + copy-link with success-state feedback. |
| `content-composer-01` | media | Multi-step content-authoring shell that composes json-form (metadata), article-body-01/Plate (body), media-editor-01 (s… |
| `media-carousel-01` | media | Embla-driven image+video carousel with two variants (gallery peek-scale / linear snap). |
| `media-carousel-editor-01` | media | Multi-item media composer (Instagram-feed-post semantics): drag-drop / browse one-or-more mixed photo+video files into… |
| `media-editor-01` | media | Black-box media capture + edit surface (photo / video / text) with four controllable capability dials (enabledModes, en… |
| `media-library-01` | media | A Google-Drive-style media library: folders + files with lazy loading, drag-drop upload, drag-to-move, right-click menu… |
| `pdf-viewer` | media | Drop-in PDF reader with toolbar, zoom, selectable text, drag-drop, and right-click context menu — themed to your design… |
| `story-composer-01` | media | Instagram-canonical story creation surface — camera-first capture, multi-layer Konva editor, 6 edit tools, single-point… |
| `story-viewer-01` | media | Full-screen sequential story viewer — Radix Dialog modal with segmented progress, multi-story navigation via Instagram-… |
| `video-player-01` | media | <video> wrapper with muted-autoplay-friendly defaults, slot-based controls via renderControls(state), isActive auto-pau… |
| `account-switcher-01` | navigation | Popover-with-switchable-items primitive: active context label + chevron trigger that opens a list of contexts to switch… |
| `file-manager` | navigation | Mac Finder-style file + folder browser with grid / list views, multi-select with marquee, cut/copy/paste, drag-and-drop… |
| `file-tree` | navigation | VS Code-style hierarchical file tree with format-aware icons, full CRUD, drag-and-drop, lazy children, and multi-select. |
| `rich-sidebar` | navigation | Registry-portable, framework-agnostic app-shell sidebar with mobile-drawer mode, 13-slot composition (incl. |
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

A concise, AI-friendly registry reference is at [/llms.txt](https://ilinxa-proui.vercel.app/llms.txt).

Point Claude Code, Cursor, GitHub Copilot, or any AI assistant at this URL when working on a project that consumes the registry. It contains install steps, the full component list, common gotchas, and the namespace snippet — everything an AI needs to install components correctly without guessing.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Cannot find module '@/lib/utils'` after install | Run `pnpm dlx shadcn@latest init` in the consumer project. `shadcn add` doesn't seed the `cn` helper — `init` does. |
| Files landed at `./<slug>/...` instead of `./components/<slug>/...` | Your `components.json` has a non-default `aliases.components` (e.g. `@/src/components`). Either move the installed files post-install or adjust the alias. |
| `npm ERESOLVE` on React 19 peer deps | Use `npm install --legacy-peer-deps`, or switch to pnpm/bun which resolve cleanly. |
| Stale install after upstream registry update | The CLI doesn't cache; the CDN does. Wait out the 5-minute TTL or append `?v=<hash>` to the registry URL once. |

Longer-form troubleshooting + context: [/docs#troubleshooting](https://ilinxa-proui.vercel.app/docs#troubleshooting).

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
