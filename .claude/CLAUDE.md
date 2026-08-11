# ilinxa-ui-pro

> Size budget: ≤12KB. This file is loaded every session — facts that change (counts, versions, queue state) belong in STATUS.md; procedures belong in skills; long-form specs in docs/. Enforced by `pnpm validate:doc-budget`.

A private high-level component library — fully-composed, dynamic, dependency-explicit components built on top of shadcn/ui that don't exist in the underlying primitives. Single Next.js app for development; eventual NPM / shadcn-registry publish target.

## Tech stack
- Next.js 16.2.x (App Router, Turbopack, React Compiler)
- React 19.2.x
- Tailwind CSS v4.2.x (CSS variables, OKLCH colors, no `tailwind.config.*`)
- shadcn CLI v4 (Radix base, Nova preset, neutral)
- TypeScript 5.x
- pnpm 10.x

## Key directories
- `src/registry/` — **the library**. `types.ts`, `categories.ts`, `manifest.ts`, and one folder per component under `components/<category>/<slug>/`.
- `src/app/` — the docs site. Consumes the registry; auto-renders detail pages from `meta.ts`.
- `src/components/ui/` — shadcn primitives. Treat as third-party.
- `src/lib/utils.ts` — `cn()` helper.
- `scripts/new-component.mjs` — component scaffolder.

## Commands
```bash
pnpm dev                                # next dev (Turbopack)
pnpm build                              # production build
pnpm lint                               # ESLint
pnpm tsc --noEmit                       # typecheck
pnpm validate:meta-deps                 # F-cross-07 audit — drift between meta.ts and shipped imports
pnpm validate:doc-drift                 # public docs (llms.txt / README) vs manifest
pnpm validate:doc-budget                # size budgets on always-loaded .claude files
pnpm registry:build                     # validators + shadcn build → public/r/*.json
pnpm new:component <category>/<slug>    # scaffold a new component from _template
pnpm new:migration <slug>               # scaffold a migration intake folder
pnpm dlx shadcn@latest add <name>       # add a shadcn primitive
```

## Registry conventions
- Components live ONLY in `src/registry/components/<category>/<slug>/`. Never under `src/app/`.
- Registry code may import only: `react`, `@/components/ui/*`, `@/lib/utils`, and explicitly-declared third-party deps. **Never `next/*`**, app contexts, or env-specific code — this keeps the library portable for the future NPM extraction.
- Each component is a sealed folder following the `data-table` shape: `<slug>.tsx`, `parts/`, `hooks/`, `types.ts`, `dummy-data.ts`, `demo.tsx`, `usage.tsx`, `meta.ts`, `index.ts`.
- `meta.ts` must populate every required `ComponentMeta` field. The scaffolder generates a stub with today's date.
- Categories live in `src/registry/categories.ts`. Adding one requires updating `ComponentCategorySlug` and `CATEGORIES`.
- Adding a component to the docs site requires a 3-line edit to `src/registry/manifest.ts` — the scaffolder prints the exact lines.
- **Registry distribution:** [`registry.json`](../registry.json) at repo root drives `https://ilinxa-proui.vercel.app/r/<slug>.json`. TWO items per component: base + `<slug>-fixtures` (adds only `dummy-data.ts`). Locked: every file `type: "registry:component"`, `target: "components/<slug>/<sub-path>"`; never ship `demo.tsx` / `usage.tsx` / `meta.ts`. `pnpm vercel-build` regenerates artifacts + the llms/README catalog each deploy. Skill: [shadcn-registry-pro](skills/shadcn-registry-pro/).

## Workflow
0. **(Migration intake — only if porting from another app)** `pnpm new:migration <slug>` scaffolds `docs/migrations/<slug>/`; user fills `original/` + `source-notes.md`, assistant writes `analysis.md`, user signs off before Stage 1. See [docs/migrations/README.md](../docs/migrations/README.md).
1. **(Required gates — GATE 1 + GATE 2)** Before any code, author `docs/procomps/<slug>-procomp/` planning docs and get user sign-off IN ORDER: `<slug>-procomp-description.md` (what & why — **GATE 1**), then `<slug>-procomp-plan.md` (how — **GATE 2**); the guide doc is authored alongside implementation. **Never scaffold before both are confirmed** — if asked for a new component without these docs, draft the description and pause. See [docs/procomps/README.md](../docs/procomps/README.md) + [component-guide §2](../docs/component-guide.md#2-before-you-start).
2. `pnpm new:component <category>/<slug>` generates the folder from `_template/`.
3. Implement the component, fill `meta.ts`, write the demo and usage.
4. Paste the printed 3 lines into `src/registry/manifest.ts` (registers it in the docs site).
5. Verify the docs render at `/components` and `/components/<slug>`.
6. **Add the component to [`registry.json`](../registry.json)** — base + fixtures items per the locked convention above. Pattern: [component-guide §11.5](../docs/component-guide.md#115-shipping-via-the-registry).
7. `pnpm registry:build` to regenerate `public/r/*.json` locally; spot-check the new `<slug>.json` artifact. Optional but recommended on first ship: smoke-test from a tmp consumer (see §11.5).
8. **(Required gate — must, GATE 3)** Structured readiness review per [rules/readiness-review.md](rules/readiness-review.md) (always loaded; full spec in [docs/reviews/readiness-review-spec.md](../docs/reviews/readiness-review-spec.md)). Verdict ≥ `Pass with follow-ups` to close.
9. Update `.claude/STATUS.md` with the new entry and any decisions worth keeping. Add the review file to the "Recent activity" pointer if non-trivial.
10. Commit + push to `master`. Vercel auto-runs `pnpm vercel-build` on each deploy, regenerating the catalog from `registry.json`. Once deployed, the component is installable via `pnpm dlx shadcn@latest add @ilinxa/<slug>` from any consumer app.

For human-readable rules and a worked end-to-end example, see [docs/component-guide.md](../docs/component-guide.md). This `CLAUDE.md` stays terse; the guide is the long-form reference. The `shadcn-registry-pro` skill at `.claude/skills/shadcn-registry-pro/` covers registry-side work in detail.

## Gotchas
- Root `CLAUDE.md` chains to `AGENTS.md` — Next.js 16 has breaking changes from training data. Read `node_modules/next/dist/docs/` before writing route code.
- `_template/_template/` is a real, compiling folder. Its files must stay valid TS/TSX (the manifest does not import from it, but `tsc` still checks it).
- Use official CLI commands for setup (`pnpm create next-app`, `pnpm dlx shadcn add`, `pnpm new:component`) over hand-edits. Research current versions before installing.
- Demos and Usage are React components today (`usage.tsx`). MDX is not wired up.

## Design system mandate
Hold the line on tokens defined in [src/app/globals.css](src/app/globals.css):
- **Fonts:** Onest (sans), JetBrains Mono (mono). Never Inter / Roboto / Geist / system-font defaults.
- **Accent:** signal-lime — `oklch(0.80 0.20 132)` light / `oklch(0.86 0.18 132)` dark. Always paired with near-black `--primary-foreground` (lime is too bright for white text).
- **Light backgrounds:** never pure white as the page background. Use cool off-white `oklch(0.975 0.003 250)` for `--background`; lift `--card` and `--popover` to pure white so raised surfaces visibly sit above the canvas.
- **Dark backgrounds:** graphite-cool, not warm-grey. Base `oklch(0.13 0.006 250)`; raised surfaces `oklch(0.17 0.006 250)`; subtle surfaces (`--muted`, `--secondary`, `--accent`) `oklch(0.22 0.005 250)`.
- **Motion:** one orchestrated reveal per major page (`reveal-up` keyframe + 60ms stagger). Don't reveal every section independently.
- **Forbidden:** pure-white page backgrounds, purple-on-white gradient clichés, neon-saturated lime (keep chroma ≤ 0.20).

## Skills mandates
- **IMPORTANT:** Use the `frontend-design` (a.k.a. `designer`) skill when designing or refactoring any visual surface in `src/app/`, `src/components/ui/`, or `src/registry/components/`. Hold the design tokens above.
- **IMPORTANT:** Use the `configuring-project-memory` skill when editing this `CLAUDE.md`, `.claude/STATUS.md`, `.claude/rules/`, or auto-memory.
- **IMPORTANT:** Use the `skill-creator-pro` skill to author or restructure any skill in `.claude/skills/`.
- **IMPORTANT:** Use the `shadcn-registry-pro` skill when authoring `registry.json`, running `shadcn build`, hosting/configuring the shadcn registry, setting up namespaced installs, or shipping components via the `pnpm dlx shadcn add` flow.
- **IMPORTANT:** Use the `xyflow-react-pro` skill when working with `@xyflow/react` (React Flow / ReactFlow) — building flow editors, node graphs, workflow canvases, port-and-edge UIs, custom node/edge types — or whenever a file imports from `@xyflow/react`.

## Library tiers
The library has four tiers, each with their own three-gate workflow and review specifics. The **procomp** workflow above is the established case; **pro-section / pro-page / pro-panel** are formalized but tooling + first pilots are queued (Phase B / C).

- **pro-component** — single composable unit (the established tier; current count + versions in STATUS.md). Sealed folder under `src/registry/components/`. Runtime distribution.
- **pro-section** — self-contained sub-route region (hero / stats row / filter bar). 1–3 procomps. Runtime by default. *Not yet shipped.*
- **pro-page** — one full route + lifecycle (layout / data / auth). Scaffold-fork (`registry:block`). Peer/AI review required. *Not yet shipped.*
- **pro-panel** — multi-page bundle with shared shell (`cms-panel`, `admin-panel`). Scaffold-fork meta-block. Peer/AI review required. Constituents must close their own GATE 3 first. *Not yet shipped.*

Full tier model + per-tier gate specifics: [docs/library-tiers-charter.md](../docs/library-tiers-charter.md). Tier folders: [docs/sections/](../docs/sections/), [docs/pages/](../docs/pages/), [docs/panels/](../docs/panels/).

## Rules
- **IMPORTANT — Subagent models:** Opus 4.8[1m] or Sonnet 5[1m] only; **never Opus 5** (doesn't follow rules); cheap tiers for bulk jobs need verification. Full rule: [rules/subagent-model-policy.md](rules/subagent-model-policy.md).
- **IMPORTANT — Readiness review (GATE 3):** every new library artifact MUST pass a structured review, verdict ≥ `Pass with follow-ups`, before push to `master`. The core rule auto-loads from [rules/readiness-review.md](rules/readiness-review.md); full spec at [docs/reviews/readiness-review-spec.md](../docs/reviews/readiness-review-spec.md).
- **IMPORTANT — Compound structure for big components:** Any multi-part artifact (≥3 mountable regions, composes another procomp, pulls a heavy dep, or a consumer could want a subset) MUST ship as a shadcn-style compound — headless `Root` provider + flat à-la-carte parts + standalone primitives + a logic-free `<Name>` assembly; flat exports (never `Name.Root`); heavy deps `React.lazy`. Single-unit widgets are exempt. Full rule (path-scoped) at [.claude/rules/compound-component-structure.md](rules/compound-component-structure.md). Reference impl: `media-library-01`.

## Progress tracking
Read [.claude/STATUS.md](.claude/STATUS.md) at session start to see where the project is. STATUS.md is the current snapshot — not a changelog. The active master plan (phases, locked decisions, loops) is [docs/production-readiness-plan.md](../docs/production-readiness-plan.md). When you ship a component / change a status / make a non-obvious decision worth keeping:

- **Update STATUS.md** for state changes (Components table row, version bump, Open decisions/TODOs).
- **Author a per-decision file** at [.claude/decisions/](decisions/)`<YYYY-MM-DD>-<slug>.md` with YAML frontmatter (`date / session / phase / type / commits / components / findings / status`) — convention at [.claude/decisions/README.md](decisions/README.md).
- **Update the "Recent activity" pointer list** at the bottom of STATUS.md to surface the new decision file (keep ~5 most-recent).

Pre-2026-05-09 history is in [.claude/STATUS-archive.md](.claude/STATUS-archive.md) (frozen; do not extend). The split was option (b3) hybrid per F-cross-02 closure — see [.claude/decisions/2026-05-09-session-7d-phase-6.md](decisions/2026-05-09-session-7d-phase-6.md).
