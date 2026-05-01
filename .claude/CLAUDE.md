# ilinxa-ui-pro

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
pnpm new:component <category>/<slug>    # scaffold a new component from _template
pnpm dlx shadcn@latest add <name>       # add a shadcn primitive
```

## Registry conventions
- Components live ONLY in `src/registry/components/<category>/<slug>/`. Never under `src/app/`.
- Registry code may import only: `react`, `@/components/ui/*`, `@/lib/utils`, and explicitly-declared third-party deps. **Never `next/*`**, app contexts, or env-specific code — this keeps the library portable for the future NPM extraction.
- Each component is a sealed folder following the `data-table` shape: `<slug>.tsx`, `parts/`, `hooks/`, `types.ts`, `dummy-data.ts`, `demo.tsx`, `usage.tsx`, `meta.ts`, `index.ts`.
- `meta.ts` must populate every required `ComponentMeta` field. The scaffolder generates a stub with today's date.
- Categories live in `src/registry/categories.ts`. Adding one requires updating `ComponentCategorySlug` and `CATEGORIES`.
- Adding a component to the docs site requires a 3-line edit to `src/registry/manifest.ts` — the scaffolder prints the exact lines.
- **Registry distribution:** [`registry.json`](../registry.json) at repo root is the source of truth for `https://ilinxa-proui.vercel.app/r/<slug>.json` artifacts. Each shipped component is TWO items: base (`<slug>`) + fixtures (`<slug>-fixtures`, depends on the base, adds `dummy-data.ts`). Locked target convention: every file `type: "registry:component"`, `target: "components/<slug>/<sub-path>"`. Never include `demo.tsx`, `usage.tsx`, or `meta.ts` — docs-site only. `pnpm vercel-build` chains `shadcn build && next build` so production artifacts auto-regenerate on each deploy. Producer-side reference: [.claude/skills/shadcn-registry-pro/](skills/shadcn-registry-pro/).

## Workflow
0. **(Required gate — must)** Before any code, author the procomp planning docs at `docs/procomps/<slug>-procomp/`. Two documents must exist and be signed off by the user, in order: `<slug>-procomp-description.md` (what & why), then `<slug>-procomp-plan.md` (how). The third doc, `<slug>-procomp-guide.md` (consumer-facing usage notes), is authored alongside the implementation. **Do not run `pnpm new:component` until the description AND plan are confirmed.** If the user asks for a new component without these docs, your first move is to draft the description and pause for their sign-off — not to scaffold. See [docs/procomps/README.md](../docs/procomps/README.md) and [docs/component-guide.md §2](../docs/component-guide.md#2-before-you-start).
1. `pnpm new:component <category>/<slug>` generates the folder from `_template/`.
2. Implement the component, fill `meta.ts`, write the demo and usage.
3. Paste the printed 3 lines into `src/registry/manifest.ts` (registers it in the docs site).
4. Verify the docs render at `/components` and `/components/<slug>`.
5. **Add the component to [`registry.json`](../registry.json)** — one base item (sealed-folder source files) + one `<slug>-fixtures` sibling item (just `dummy-data.ts`). Locked convention: every file uses `type: "registry:component"` and `target: "components/<slug>/<sub-path>"`. **Never ship `demo.tsx`, `usage.tsx`, or `meta.ts`** — those are docs-site only. Pattern in [docs/component-guide.md §11.5](../docs/component-guide.md#115-shipping-via-the-registry); skill at [.claude/skills/shadcn-registry-pro/](skills/shadcn-registry-pro/).
6. `pnpm registry:build` to regenerate `public/r/*.json` locally; spot-check the new `<slug>.json` artifact. Optional but recommended on first ship: smoke-test from a tmp consumer (see §11.5).
7. Update `.claude/STATUS.md` with the new entry and any decisions worth keeping.
8. Commit + push to `master`. Vercel auto-runs `pnpm vercel-build` on each deploy, regenerating the catalog from `registry.json`. Once deployed, the component is installable via `pnpm dlx shadcn@latest add @ilinxa/<slug>` from any consumer app.

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

## Progress tracking
Read [.claude/STATUS.md](.claude/STATUS.md) at session start to see where the project is. Update it whenever you ship a component, change a component's status, or make a non-obvious decision worth keeping. STATUS.md is the current snapshot — not a changelog. Trim the "Recent decisions" log to the most recent ~10 entries.
