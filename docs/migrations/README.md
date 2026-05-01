# Component migrations (`docs/migrations/`)

Process for bringing components from other apps into `ilinxa-ui-pro`. Adds a 2-step **intake** stage in front of the existing procomp gate ([docs/procomps/README.md](../procomps/README.md)) — the original code's *design DNA* gets preserved; the *structure / dynamism / optimization / accessibility* get rewritten on the way in.

> The premise (per [.claude/STATUS.md](../../.claude/STATUS.md)): incoming components are **stronger in design, weaker in structure / dynamism / optimization**. The migration pipeline is built around that asymmetry — keep what's good, rewrite what isn't.

## Folder shape

```
docs/migrations/<slug>/
├── original/         ← raw source files, any structure (paste as-is)
├── source-notes.md   ← intake doc — you fill
└── analysis.md       ← extraction pass — assistant fills
```

`<slug>` is the **same kebab-case slug** the component will use in the registry — `stat-card`, `multi-select`, `command-palette`. Stays consistent through migration → procomp → registry.

## The pipeline

```
[ ]  1. pnpm new:migration <slug>          ── scaffolds the folder + templates
[ ]  2. paste original code into original/
[ ]  3. fill source-notes.md (template guides what to write)
[ ]  4. assistant writes analysis.md       ── EXTRACTION PASS
[ ]  5. you sign off on analysis           ──────────── INTAKE GATE
[ ]  6. procomp description.md             ── informed by analysis
[ ]  7. sign off                           ──────────── GATE 1 (procomp)
[ ]  8. procomp plan.md                    ── identical to greenfield
[ ]  9. sign off                           ──────────── GATE 2 (procomp)
[ ] 10. pnpm new:component <category>/<slug>
[ ] 11. implement → demo → usage → meta
[ ] 12. registry.json (base + fixtures)
[ ] 13. STATUS.md
```

Steps 1–5 are new (this doc). Steps 6–13 are the existing pipeline ([docs/procomps/README.md](../procomps/README.md), [docs/component-guide.md](../component-guide.md)).

## What each artifact contains

### `original/` — raw paste

Drop the source files in untouched. Any structure. If the component spans multiple files / hooks / types in the source app, paste them all — the assistant needs the full collaborator graph to do a useful analysis.

### `source-notes.md` — intake (you fill)

Filled by you before the analysis pass. Sections:

- **Source** — which app, which file path, which pages/contexts use it today
- **Role** — what it does for the user in the source app (1–2 paragraphs)
- **What I like (preserve)** — specific visual / UX / behavior decisions worth keeping. Be concrete: *"the avatar → author → timestamp left-to-right rhythm"*, *"the hover-reveal action menu"*, *"the exact teal accent on the comment count"*. Generic answers ("looks clean") block a useful analysis.
- **What bothers me (rewrite)** — structural debt, hardcoded values, prop gaps, perf issues, a11y gaps
- **Constraints / non-goals** — *"we are not turning this into a feed"* boundaries
- **Screenshots / links** — design files, recordings, anything visual

### `analysis.md` — extraction (assistant fills)

Output of reading `original/` + `source-notes.md`. Sections:

- **Design DNA to PRESERVE** — concrete list: typography, color, spacing, density, motion, micro-interactions
- **Structural debt to REWRITE** — hardcoded data, prop gaps, env coupling, local-state silos, prop drilling
- **Dependency audit** — what to install (with version research), what to drop, what conflicts with the stack ([.claude/CLAUDE.md](../../.claude/CLAUDE.md) tech stack)
- **Dynamism gaps** — what becomes a prop / slot / generic / render-prop / context
- **Optimization gaps** — `useMemo`, `React.memo`, virtualization, suspense boundaries, code-splitting
- **Accessibility gaps** — ARIA, keyboard, focus management, screen-reader semantics, reduced-motion
- **Proposed procomp scope** — single component / compound (`<X.Header>` + `<X.Body>`) / system (multiple companion procomps)
- **Recommendation** — proceed / redirect (and how) / decline (and why)

The analysis is reviewable. You sign off or redirect before any procomp doc is started.

## What stays / what changes

**PRESERVE in code** (drives implementation choices):

- All visual decisions called out in `source-notes.md` "What I like"
- Typography, color, spacing, micro-interaction timing
- Visual hierarchy and density

**REWRITE in code** (default — explicit deviation must be justified in `analysis.md`):

- Hardcoded data → props or hooks
- Local state silos → controlled-or-uncontrolled with imperative handles where useful
- Direct env coupling → forbidden by registry rules (no `next/*`, no app contexts; see [.claude/CLAUDE.md](../../.claude/CLAUDE.md) "Registry conventions")
- Performance — add memo / virtualization where the data shape warrants
- Accessibility — full keyboard + ARIA + focus restoration

## Why a separate `analysis.md` (not folded into procomp description)

`source-notes.md` + `original/` are **inbound material**. `analysis.md` is the **working note**. `<slug>-procomp-description.md` is the **outbound contract** — what consumers eventually read. Keeping the three roles separate makes review faster and the procomp folder cleaner.

The procomp description references its origin with a one-liner near the top:

```markdown
> Migration origin: [`docs/migrations/<slug>/`](../../migrations/<slug>/)
```

## When to delete `original/`?

**Never** (default). The git diff between `original/` and the shipped implementation is the historical record of what got rewritten and why. Revisiting a year later — for a v0.2 follow-up, an external bug report against the source design, a "why did we change X?" question — is much faster with the source intact.

## What this directory is NOT

- **Not the implementation source.** Real code lives in `src/registry/components/<category>/<slug>/`. `original/` is reference material.
- **Not a registry artifact.** `pnpm registry:build` ignores everything under `docs/`.
- **Not a public API.** These docs are internal — they may reference proprietary source-app code.
