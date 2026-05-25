# Pro-page planning docs (`docs/pages/`)

A **pro-page** is a single full route — `/dashboard`, `/settings`, `/auth/login`. It owns the page's lifecycle: layout, data wiring, auth boundary, the works. Pages compose sections + procomps + shadcn primitives into a scaffold-fork artifact: the consumer installs once, owns the code, customizes freely.

> **Tier model + gate definitions:** see [`docs/library-tiers-charter.md`](../library-tiers-charter.md). The charter is the spec; this file is operational.
>
> **Status (2026-05-25):** charter locked; 0 pages shipped yet. This directory is a placeholder. Scaffolders + planning-doc templates + the `src/registry/pages/` directory itself land in Phase B alongside the first pilot page. **Pilot order:** sections first, then pages — do not skip.

## Folder shape (when pages start shipping)

```
docs/pages/<slug>/
├── <slug>-description.md   ← Stage 1: what & why + constituent inventory + composition contract (sign off before Stage 2)
├── <slug>-plan.md          ← Stage 2: how + scaffold file tree + data boundary (sign off before any code)
└── <slug>-guide.md         ← Stage 3: consumer-facing usage + customization notes
```

**Slug pattern (per [charter](../library-tiers-charter.md#slug--namespace-conventions)):** `<noun>-page-NN` — the `-page` disambiguator lives in the slug itself (e.g. `dashboard-page-01`). The folder is the slug directly, NOT slug + `-page` again. So a page called `dashboard-page-01` lives at `docs/pages/dashboard-page-01/` with `dashboard-page-01-description.md` inside.

## The three stages (pages-specific bits)

Pages extend the procomp stages with composition + scaffolding concerns:

### Stage 1 — Description (additions)

- **Constituent inventory** — every section + procomp + shadcn primitive the page uses, with version pins.
- **Composition contract** — which procomp owns which region; what's customizable post-install vs. baked into the scaffold.
- **Route shape** — e.g. `/dashboard/[orgId]`. Includes dynamic segments, search params consumed, parent layout assumptions.
- **Data assumption** — server / client / static. Where data is fetched (RSC vs. client hook), what the page assumes about the consumer's data layer.
- **Customization model** — what consumers are expected to edit vs. leave alone. (Pages are scaffold-fork; once installed, they own it — but the GATE 1 should set expectations about which seams are "primary" vs. "incidental.")

### Stage 2 — Plan (additions)

- **Scaffold file tree** — the exact files the consumer will own after `shadcn add`. Includes `page.tsx`, `layout.tsx` if any, colocated components.
- **Per-procomp wiring** — how each constituent procomp is configured + which slots are filled + which callbacks are wired.
- **Shared state plan** — what state lifts to the page level vs. stays inside constituents.
- **Data fetching boundary** — server component vs. client component vs. RSC + hydration; auth checks at server level vs. middleware.
- **Auth/permission integration points** — exact assumptions the page makes about consumer's auth context.

## Default distribution

Scaffold-fork — ships as `registry:block` to `<consumer>/src/app/<route-slug>/`. Override to runtime (`registry:component`) only with GATE 1 justification (rare; usually only thin pages that wrap one procomp).

## GATE 3 (per [`.claude/rules/readiness-review.md`](../../.claude/rules/readiness-review.md))

**5 fixed dims**: the shared 4 (planning docs / registry distribution / meta + manifest sync / verification) + **composition integrity** (prop flow correctness; no leaked internals; no prop-drilling hacks; clean state lifting). Rotating dim picked from the standard list.

**Reviewer:** peer or AI-assisted (no self-review for pages).

**Smoke:** scaffold-install in tmp consumer + route renders + tsc clean. **Mandatory.**

## Workflow checklist (manual until Phase B scaffolders land)

```
[ ]  1. Check the charter — does this page fit a use-case the project actually has?
[ ]  2. Verify all constituent sections + procomps already exist (or are queued); pages don't unblock their constituents
[ ]  3. Create docs/pages/<slug>/<slug>-description.md
[ ]  4. Get description signed off  ──── GATE 1 (must include constituent inventory + composition contract)
[ ]  5. Create docs/pages/<slug>/<slug>-plan.md
[ ]  6. Get plan signed off          ──── GATE 2 (must include full scaffold file tree)
[ ]  7. Manually scaffold src/registry/pages/<category>/<slug>/ mirroring procomp shape but typed as registry:block items
[ ]  8. Implement against the plan
[ ]  9. Author docs/pages/<slug>/<slug>-guide.md
[ ] 10. Run §13 verification checklist — page variant
[ ] 11. Author a v0.1.0 spot-check review (5 fixed + 1 rotating)
[ ] 12. Peer or AI-assisted review — verdict ≥ "Pass with follow-ups"  ──── GATE 3
[ ] 13. Update .claude/STATUS.md (Library tiers block + Recent activity)
[ ] 14. Commit + push (Vercel auto-deploys)
```

## Constituent rule

A page's GATE 3 review references its constituent sections' + procomps' reviews. **Every constituent must have its own GATE 3 closed first.** If a constituent is `Needs revision`, the page cannot close — fix the constituent before continuing.
