# ilinxa/pro-ui

Production-ready React components distributed via the [shadcn-registry](https://ui.shadcn.com/docs/registry) model. Built on shadcn/ui primitives + Tailwind CSS v4 + React 19. Install components into your Next.js (or any React) app with `pnpm dlx shadcn@latest add @ilinxa/<slug>` — source files copy into your repo, you own the code.

> **Demo:** [ilinxa-proui.vercel.app](https://ilinxa-proui.vercel.app) · **Catalog:** [/r/registry.json](https://ilinxa-proui.vercel.app/r/registry.json) · **AI reference:** [/llms.txt](https://ilinxa-proui.vercel.app/llms.txt)

---

## Install components in your app

### Prerequisites

Your project must have shadcn already initialized:

```bash
pnpm dlx shadcn@latest init
```

This seeds `lib/utils.ts` (the `cn` helper that all primitives import) and `components.json` (alias config). Skip this if you've already used any shadcn component in the project.

### Register the namespace

In your project's `components.json`:

```json
{
  "registries": {
    "@ilinxa": "https://ilinxa-proui.vercel.app/r/{name}.json"
  }
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

## Available components

Eight components, each with an optional `-fixtures` sibling for example data:

| Slug | Category | Description |
|---|---|---|
| `data-table` | data | Generic typed-columns data table — composable column definitions, host-owned data |
| `rich-card` | data | JSON-driven recursive card-tree viewer + structural editor; drag-drop, virtualization, undo/redo |
| `workspace` | layout | Splittable canvas with corner-drag split/merge, edge-drag resize, registry-driven content |
| `properties-form` | forms | Schema-driven form — six field types, three-state permissions, sync validation |
| `detail-panel` | feedback | Selection-aware compound container — Header / Body / Actions slots, lifecycle precedence |
| `filter-stack` | forms | Schema-driven filter panel — checkbox-list / toggle / text / custom, AND-across-categories |
| `entity-picker` | forms | Searchable typed picker — single or multi mode, kind badges, custom render slots |
| `markdown-editor` | forms | CodeMirror 6 + GFM + `[[wikilink]]` autocomplete + decoration |

---

## Compatibility

- **Next.js** 14 / 15 / 16 (App Router & Pages Router)
- **React** 19 (or 18 with graceful primitive variants)
- **Tailwind CSS** v4 (CSS-vars-only config; no `tailwind.config.*`)
- **Package managers** pnpm / bun / yarn — npm + React 19 needs `--legacy-peer-deps`

---

## AI / LLM access

A concise, AI-friendly registry reference is at [/llms.txt](https://ilinxa-proui.vercel.app/llms.txt).

Point Claude Code, Cursor, GitHub Copilot, or any AI assistant at this URL when working on a project that consumes the registry. It contains install steps, the full component list, common gotchas, and the namespace snippet — everything an AI needs to install components correctly without guessing.

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

Private. Contact the team for licensing inquiries.
