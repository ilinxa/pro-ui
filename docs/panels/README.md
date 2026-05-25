# Pro-panel planning docs (`docs/panels/`)

A **pro-panel** is a multi-page bundle with a shared shell — sidebar, topbar, auth boundary, theme provider. The end-to-end product chunk: `cms-panel`, `admin-panel`, `merchant-panel`. Panels compose pages + sections + procomps + a shell into a scaffold-fork meta-block: the consumer installs once, gets the whole product surface, owns + customizes freely.

> **Tier model + gate definitions:** see [`docs/library-tiers-charter.md`](../library-tiers-charter.md). The charter is the spec; this file is operational.
>
> **Status (2026-05-25):** charter locked; 0 panels shipped yet. This directory is a placeholder. Scaffolders + planning-doc templates + the `src/registry/panels/` directory itself land in Phase B alongside the first pilot panel. **Pilot order:** sections first, then pages, then panels — do not skip levels. Composition risk compounds.

## Folder shape (when panels start shipping)

```
docs/panels/<slug>/
├── <slug>-description.md   ← Stage 1: what & why + page roster + shell composition + permission model (sign off before Stage 2)
├── <slug>-plan.md          ← Stage 2: how + full consumer file tree + shell wiring + per-page references (sign off before any code)
└── <slug>-guide.md         ← Stage 3: consumer-facing usage + deployment + per-page customization notes
```

**Slug pattern (per [charter](../library-tiers-charter.md#slug--namespace-conventions)):** `<noun>-panel-NN` — the `-panel` disambiguator lives in the slug itself (e.g. `cms-panel-01`). The folder is the slug directly, NOT slug + `-panel` again. So a panel called `cms-panel-01` lives at `docs/panels/cms-panel-01/` with `cms-panel-01-description.md` inside.

## The three stages (panels-specific bits)

Panels extend the procomp stages with bundle-level concerns:

### Stage 1 — Description (additions)

- **Page roster** — every constituent page with a one-liner each. Page slugs already shipped + their current versions.
- **Shell composition** — what makes up the shared shell: sidebar (which procomp + variant), topbar, auth boundary, theme provider, layout wrapper. Naming each role explicitly.
- **Permission model** — `role` / `scope` / `rbac` / `none`. How the panel expects the consumer's auth system to plug in.
- **Install-order graph** — which constituents install first (procomps → sections → pages → panel shell → wiring). Important because shadcn `registry:block` deps install transitively.
- **Cross-page state** — what state spans pages: auth context, theme, layout (sidebar collapse state, etc.), notifications.
- **Theming hooks** — which design tokens the panel exposes for consumer override beyond the default `@ilinxa` token set.

### Stage 2 — Plan (additions)

- **Full consumer file tree** — every file the meta-block writes into the consumer's app. Includes route group structure, shared component locations, providers, hooks.
- **Shell wiring** — exact integration of sidebar / topbar / auth / theme into the route group.
- **Cross-page links + navigation** — every internal link the panel renders; how nav state is owned.
- **Per-page GATE 2 references** — link to each constituent page's own GATE 2; do not duplicate content. The panel plan composes references, not implementations.
- **Install order** — which `registry:block`s install in what sequence, with dep declarations explicit.

## Default distribution

Scaffold-fork — ships as `registry:block` (meta) to `<consumer>/src/app/(<panel-slug>)/` (route group) + `<consumer>/src/components/<panel-slug>/` (shell). **Panels are always scaffold-fork.** A runtime panel is a god-component by definition.

## GATE 3 (per [`.claude/rules/readiness-review.md`](../../.claude/rules/readiness-review.md))

**5 fixed dims**: the shared 4 (planning docs / registry distribution / meta + manifest sync / verification) + **design coherence sweep** (do all constituent pages feel like one product? token compliance across pages? typography/spacing/motion choreography consistent?). Rotating dim picked from the standard list.

**Reviewer:** peer or AI-assisted (no self-review for panels).

**Smoke:** scaffold-install + tsc clean + **navigate every constituent page** + design-token sweep across all pages.

## Workflow checklist (manual until Phase B scaffolders land)

```
[ ]  1. Check the charter — does this panel fit a real product chunk?
[ ]  2. Verify every constituent page + section + procomp already exists AND has closed its own GATE 3
[ ]  3. Create docs/panels/<slug>/<slug>-description.md
[ ]  4. Get description signed off  ──── GATE 1 (must include page roster + shell composition + permission model)
[ ]  5. Create docs/panels/<slug>/<slug>-plan.md
[ ]  6. Get plan signed off          ──── GATE 2 (must include full consumer file tree + per-page references)
[ ]  7. Manually scaffold src/registry/panels/<slug>/ + shell components
[ ]  8. Implement shell + wire constituent pages
[ ]  9. Author docs/panels/<slug>/<slug>-guide.md + per-page deployment notes
[ ] 10. Run §13 verification checklist — panel variant
[ ] 11. Author a v0.1.0 integration spot-check review (5 fixed + 1 rotating)
[ ] 12. Peer or AI-assisted review — verdict ≥ "Pass with follow-ups"  ──── GATE 3
[ ] 13. Update .claude/STATUS.md (Library tiers block + Recent activity)
[ ] 14. Commit + push (Vercel auto-deploys)
```

## Constituent rule (strict)

A panel's GATE 3 review references its constituent pages' + sections' + procomps' reviews. **Every constituent must have its own GATE 3 closed first** — no exceptions. The panel's review **does not re-run** constituent reviews; it references them and adds the panel-level composition + design coherence dims on top.

If a constituent is `Needs revision`, the panel cannot close — fix the constituent's findings, re-close its review, then resume the panel.

## Why panels need both composition integrity AND design coherence

A pro-page already checks composition integrity (prop flow, state lifting, no prop-drilling hacks). A panel inherits all of that via constituent pages, so it doesn't need a separate composition dim — but it DOES need design coherence, which a single page cannot check by itself: do twelve pages feel like one product, or twelve products glued together? That question only exists at the panel tier, and it's where panels add value over a `git clone` of twelve scaffolds.
