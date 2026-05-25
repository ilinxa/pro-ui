# Pro-section planning docs (`docs/sections/`)

A **pro-section** is a self-contained sub-route region — a hero, a stats row, a filter bar, a footer block. It owns its visual concern but does NOT own a route. Sections compose 1–3 procomps + shadcn primitives into a runtime-dynamic, named, reusable unit.

> **Tier model + gate definitions:** see [`docs/library-tiers-charter.md`](../library-tiers-charter.md). Don't read this file as a standalone spec — it's the operational reference for *where files go*; the charter is the spec.
>
> **Status (2026-05-25):** charter locked; 0 sections shipped yet. This directory is a placeholder. Scaffolders + planning-doc templates + the `src/registry/sections/` directory itself land in Phase B alongside the first pilot section. See [`docs/library-tiers-charter.md` §"Phase B"](../library-tiers-charter.md#phase-b--deferred-author-when-the-first-pilot-in-a-tier-is-being-built).

## Folder shape (when sections start shipping)

```
docs/sections/<slug>/
├── <slug>-description.md   ← Stage 1: what & why + composed-of list + consumer surface (sign off before Stage 2)
├── <slug>-plan.md          ← Stage 2: how + composition map + prop flow + state-lifting strategy (sign off before any code)
└── <slug>-guide.md         ← Stage 3: consumer-facing usage notes
```

**Slug pattern (per [charter](../library-tiers-charter.md#slug--namespace-conventions)):** `<noun>-section-NN` — the `-section` disambiguator lives in the slug itself (e.g. `stats-row-section-01`). The folder is the slug directly, NOT slug + `-section` again. This differs from procomp's `<slug>-procomp/` pattern (where procomp slug has no suffix); the trade-off is a shorter folder name + a single source of truth for the tier disambiguator. So a section called `stats-row-section-01` lives at `docs/sections/stats-row-section-01/` with `stats-row-section-01-description.md` inside.

## The three stages (sections-specific bits)

The procomp stages from [`docs/procomps/README.md`](../procomps/README.md) apply unchanged. Sections add the following required sections to each stage:

### Stage 1 — Description (additions)

- **Composed-of list** — every procomp + shadcn primitive the section uses, with version pins where available.
- **Consumer surface** — slots, callbacks, and events the section exposes (this is the section's public API, separate from the constituent procomps' APIs).

### Stage 2 — Plan (additions)

- **Composition map** — which region of the section is owned by which constituent procomp; visualize as a labeled box diagram if helpful.
- **Prop flow** — where data enters the section, how it threads through to constituents, where consumer callbacks lift back out.
- **State-lifting strategy** — what state stays local to the section, what lifts to the consumer.
- **Design-token mandate restatement** — explicitly call out that the section holds the [CLAUDE.md design tokens](../../.claude/CLAUDE.md#design-system-mandate) even though its constituents already do; composition can drift visually.

## Default distribution

Runtime — ships as `registry:component` to `<consumer>/components/<slug>/`. Override to scaffold-fork (`<consumer>/components/sections/<slug>/`) only with GATE 1 justification (see [charter](../library-tiers-charter.md#distribution-defaults-can-be-overridden-per-artifact)).

## GATE 3 (per [`.claude/rules/readiness-review.md`](../../.claude/rules/readiness-review.md))

Same 4 fixed dims as procomp, but the **rotating dim defaults to composition integrity**. Override only if composition is trivially clean and another dim has higher risk for THIS section.

Smoke = F-cross-11 path-b consumer-tsc (`pnpm dlx shadcn add @ilinxa/<slug>` + post-install `pnpm tsc --noEmit` clean).

## Workflow checklist (manual until Phase B scaffolders land)

```
[ ]  1. Read .claude/STATUS.md — is this section on the roadmap?
[ ]  2. Grep src/registry/ for similar sections — surface naming collisions
[ ]  3. Create docs/sections/<slug>/<slug>-description.md
[ ]  4. Get description signed off  ──── GATE 1
[ ]  5. Create docs/sections/<slug>/<slug>-plan.md
[ ]  6. Get plan signed off          ──── GATE 2
[ ]  7. Manually scaffold src/registry/sections/<category>/<slug>/ mirroring procomp shape
[ ]  8. Implement against the plan
[ ]  9. Author docs/sections/<slug>/<slug>-guide.md
[ ] 10. Run the §13 verification checklist (component-guide.md) — section variant
[ ] 11. Author a v0.1.0 spot-check review at docs/sections/<slug>/reviews/<date>-v0.1.0-spotcheck.md
[ ] 12. Verdict ≥ "Pass with follow-ups"  ──── GATE 3
[ ] 13. Update .claude/STATUS.md (Library tiers block + Recent activity)
[ ] 14. Commit + push (Vercel auto-deploys)
```
