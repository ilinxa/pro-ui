# ilinxa-ui-pro

A private high-level component library — fully-composed, dynamic components built on top of shadcn/ui, Tailwind CSS v4, and Radix. Not a replacement for shadcn primitives; a layer above them for the patterns that don't exist in any single library (sortable/filterable tables, multi-selects with chips, empty states, dashboards, command palettes, etc.).

> alpha · 1 component shipped · single Next.js app · NPM target

## Stack

- **Next.js 16** — App Router, Turbopack, React Compiler
- **React 19**
- **Tailwind CSS v4** — OKLCH tokens, no `tailwind.config.*`
- **shadcn CLI v4** — Radix base, Nova preset (rebranded tokens)
- **TypeScript 5** · **pnpm 10**

## Quick start

```bash
pnpm install
pnpm dev                # http://localhost:3000
```

Routes:
- `/` — landing
- `/components` — catalog grouped by category
- `/components/<slug>` — auto-rendered detail page (preview, usage, dependencies, meta)

## Add a component

> **Building a component? Read [docs/component-guide.md](docs/component-guide.md)** — the comprehensive developer reference covering anatomy, rules, design system, lifecycle, anti-patterns, and a worked end-to-end example.

```bash
pnpm new:component <category>/<slug>
# e.g. pnpm new:component data/stat-card
```

The scaffolder copies the canonical template at `src/registry/components/_template/_template/`, replaces `Template`/`_template`/`TEMPLATE` with the new name in PascalCase / kebab / scream-snake, writes a fresh `meta.ts` with today's date, and prints the 3 lines to paste into `src/registry/manifest.ts` to register the component. The docs page renders automatically from `meta.ts`.

Categories live in `src/registry/categories.ts` — `data`, `forms`, `navigation`, `feedback`, `overlays`, `marketing`, `layout`, `media`, `auth`.

## Project shape

```
src/
├── app/                     # docs site (consumes the registry)
├── components/
│   ├── site/                # site chrome — header, footer, theme toggle
│   └── ui/                  # shadcn primitives (treat as third-party)
├── lib/utils.ts
└── registry/                # THE LIBRARY — keep portable for NPM extraction
    ├── categories.ts
    ├── manifest.ts
    ├── types.ts
    └── components/
        ├── _template/       # canonical template (excluded from manifest)
        └── <category>/<slug>/
            ├── <slug>.tsx   # main export
            ├── types.ts
            ├── dummy-data.ts
            ├── demo.tsx     # rendered on docs page
            ├── usage.tsx    # written guidance
            ├── meta.ts      # rich metadata
            └── index.ts
scripts/new-component.mjs
.claude/
├── CLAUDE.md                # project instructions for Claude Code
└── STATUS.md                # live progress tracker
```

**Registry import rules** — registry code may import only `react`, `@/components/ui/*`, `@/lib/utils`, and explicitly-declared third-party deps. Never `next/*` or app-level concerns. This keeps the library portable for the eventual NPM/registry extraction.

## Design system

- **Type:** Onest (sans), JetBrains Mono (mono)
- **Accent:** signal-lime — `oklch(0.80 0.20 132)` light / `oklch(0.86 0.18 132)` dark — paired with near-black foreground (lime is too bright for white text)
- **Light surfaces:** cool off-white page (`oklch(0.975 0.003 250)`); cards lifted to pure white for visible elevation
- **Dark surfaces:** graphite-cool — `0.13` base / `0.17` raised / `0.22` subtle, all at hue 250
- **Motion:** one orchestrated `reveal-up` per major page (60ms stagger), guarded by `prefers-reduced-motion`

Full token reference: [src/app/globals.css](src/app/globals.css). Mandate and "don'ts" (no Inter / Roboto / Geist, no pure-white pages, no neon-saturated lime, no purple-on-white gradient clichés): [.claude/CLAUDE.md](.claude/CLAUDE.md).

## Status & roadmap

Live in [.claude/STATUS.md](.claude/STATUS.md) — current component catalog, next priorities, open decisions, and a rolling decisions log.

## Scripts

```bash
pnpm dev                                # next dev (Turbopack)
pnpm build                              # production build
pnpm lint                               # ESLint
pnpm tsc --noEmit                       # typecheck
pnpm new:component <category>/<slug>    # scaffold a new component
pnpm dlx shadcn@latest add <name>       # add a shadcn primitive
```

## License

Private. Internal use only — not yet published.
