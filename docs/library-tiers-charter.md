# Library tiers charter

> **Status:** Locked 2026-05-25 (this is Phase A — model + rule only; tooling + first pilots are Phase B / Phase C).
> **Authority:** Binding for all library artifacts authored after this date. Existing 49 procomps are unchanged.
> **Source of truth:** This file. The rule [`.claude/rules/readiness-review.md`](../.claude/rules/readiness-review.md), [`CLAUDE.md`](../.claude/CLAUDE.md), and [`docs/component-guide.md`](component-guide.md) cross-reference here. If they drift from the charter, the charter wins.

---

## Why this exists

`ilinxa-ui-pro` started as a procomp library: sealed, dynamic, runtime-composable units. Real consumer apps need more than units — they need **pre-composed sections**, **pre-built pages**, and **pre-bundled panels** that drop into a new project with minimal wiring. This charter formalizes the three new tiers above procomp and the gate system that keeps them coherent.

Composition is where libraries fail. Without explicit tiering and reviewed composition contracts, a "panel" becomes either a god-component with a brutal prop surface, or 12 forked snowflakes that fight each other. The gates exist to prevent both.

---

## The four tiers

| Tier | Responsibility | Default distribution | Default scope | Folder |
|---|---|---|---|---|
| **pro-component** (existing) | A single composable unit (a Sidebar, a DataTable, a JSON Form). | Runtime — `registry:component` | 1 concept | `src/registry/components/<category>/<slug>/` |
| **pro-section** (new) | A self-contained sub-route region: hero, stats row, filter bar, footer block. Owns its visual concern but not a route. | Runtime — `registry:component` | 1–3 procomps + shadcn primitives | `src/registry/sections/<category>/<slug>/` |
| **pro-page** (new) | A single full route. Owns the page's lifecycle: layout, data wiring, auth boundary. | Scaffold-fork — `registry:block` | 1 route, 1–4 sections, N procomps | `src/registry/pages/<category>/<slug>/` |
| **pro-panel** (new) | A multi-page bundle with a shared shell: sidebar, topbar, auth, theme. The end-to-end product chunk (e.g. `cms-panel`, `admin-panel`). | Scaffold-fork — `registry:block` (meta) | Route group + shell + N pages + N sections | `src/registry/panels/<slug>/` |

### Tier boundaries are by responsibility, not by procomp count

Procomp counts are guidance, not rules. The real test:

- **Owns sub-route visual content only** → section.
- **Owns one full route** (`/path/to/page`) → page.
- **Owns a route group** (`/admin/*`) **with a shared shell** → panel.

A "page" with a single embedded DataTable is still a page. A "section" with 5 procomps is still a section if it doesn't own a route. A "panel" with 2 pages is still a panel if it ships a shared shell.

### Distribution defaults can be overridden per artifact

The defaults above are starting points. Either direction can be justified at GATE 1:

- A complex hero pro-section that consumers will fork heavily? Ship as `registry:block` (scaffold-fork).
- A thin pro-page that's mostly a wrapped DataTable with no real customization? Ship as `registry:component` (runtime).
- Panels are the one exception — **panels are always scaffold-fork**. A runtime panel is a god-component by definition.

If the choice is non-default, the GATE 1 description must include a one-paragraph justification.

---

## The three gates (scaled per tier)

The procomp gate ladder is preserved. Page and panel gates absorb a *constituent inventory + composition contract* into GATE 1 (not a separate GATE 0).

### GATE 1 — Description (`<slug>-<tier>-description.md`)

The "what + why". Cheap to revise.

| Tier | Required sections beyond procomp baseline |
|---|---|
| pro-component | (unchanged — see [`docs/procomps/README.md`](procomps/README.md)) |
| pro-section | + **Composed-of list** (procomps + shadcn primitives) • + **Consumer surface** (slots + callbacks + events the section exposes) |
| pro-page | + **Constituent inventory** (sections + procomps + shadcn) • + **Composition contract** (which procomp owns which region, what's customizable post-install vs. baked-in) • + **Route shape** • + **Data assumption** (server / client / static) |
| pro-panel | + **Page roster** (one-liner per constituent page) • + **Shell composition** (sidebar / topbar / auth boundary / theme provider) • + **Permission model** • + **Install-order graph** • + **Cross-page state** (auth ctx, theme, layout) |

### GATE 2 — Plan (`<slug>-<tier>-plan.md`)

The "how". Implementation contract.

| Tier | Required sections beyond procomp baseline |
|---|---|
| pro-component | (unchanged) |
| pro-section | + **Composition map** (region → procomp) • + **Prop flow** (where data enters, where it lifts) • + **State-lifting strategy** • + **Design-token mandate restatement** |
| pro-page | + **Scaffold file tree** (what files the consumer will own post-install) • + **Per-procomp wiring** • + **Shared state plan** • + **Data fetching boundary** (server component vs. client component vs. RSC + hydration) • + **Auth/permission integration points** |
| pro-panel | + **Full consumer file tree** (every file the meta-block writes) • + **Shell wiring** • + **Cross-page links + navigation** • + **Per-page GATE 2 references** (don't duplicate — link) • + **Install order** (which `registry:block`s install first, dependencies between them) |

### GATE 3 — Readiness review (per [`.claude/rules/readiness-review.md`](../.claude/rules/readiness-review.md))

| Tier | Fixed core dims | Rotating | Smoke test |
|---|---|---|---|
| pro-component | 4 (existing) | 1 | `pnpm dlx shadcn add @ilinxa/<slug>` + consumer tsc clean |
| pro-section | 4 (procomp core, default rotating = composition integrity) | 1 | same as procomp |
| pro-page | **5 fixed** (procomp's 4 + **composition integrity**) | 1 | scaffold-install in tmp consumer + render route + tsc clean |
| pro-panel | **5 fixed** (procomp's 4 + **design coherence**) | 1 | scaffold-install + navigate every page + tsc clean + design-token sweep across all pages |

### Cross-tier invariant: constituents never skip their own gates

A pro-section used inside a pro-page still ships with its own three-gate trio. A pro-page used inside a pro-panel still ships with its own three-gate trio. The higher tier's review **references** the constituent's review, never re-runs or absorbs it.

Without this rule, tiering collapses into "one big god-thing with extra steps."

---

## Slug + namespace conventions

| Tier | Slug shape | Example | Namespace |
|---|---|---|---|
| pro-component | `<noun>-<variant>-NN?` | `rich-sidebar`, `flow-canvas-01` | `@ilinxa/<slug>` |
| pro-section | `<noun>-section-NN` | `stats-row-section-01`, `pricing-tier-section-01` | `@ilinxa/<slug>` |
| pro-page | `<noun>-page-NN` | `dashboard-page-01`, `settings-page-01` | `@ilinxa/<slug>` |
| pro-panel | `<noun>-panel-NN` | `cms-panel-01`, `admin-panel-01` | `@ilinxa/<slug>` |

All four tiers share the `@ilinxa/<slug>` namespace. shadcn's registry `type` field (`registry:component` vs. `registry:block`) is what disambiguates them at install time. This matches how shadcn itself ships blocks alongside components.

---

## Scaffold install-target convention

When a consumer runs `pnpm dlx shadcn add @ilinxa/<slug>` for a scaffold-fork artifact, files land here:

| Tier | Install target |
|---|---|
| pro-component / pro-section (runtime) | `<consumer>/components/<slug>/` (sealed folder, identical shape to producer) |
| pro-section (scaffold-fork override) | `<consumer>/components/sections/<slug>/` |
| pro-page | `<consumer>/src/app/<route-slug>/` (page + layout + colocated parts) |
| pro-panel | `<consumer>/src/app/(<panel-slug>)/` (route group) + `<consumer>/src/components/<panel-slug>/` (shell) |

**First-pilot may revise.** These conventions are best-guesses until the first pilot in each tier; ship the pilot, learn, then re-lock. If a tier's first pilot exposes a better convention, the charter gets a v2.

---

## Versioning + update story for scaffolds

Scaffold-fork artifacts (pages, panels, scaffold-override sections) are **snapshots**. Once installed, the consumer owns the code.

- Re-installing a scaffold overwrites the prior install (shadcn's default behavior); consumer reconciles their edits manually via git.
- There is **no SemVer compatibility guarantee** across re-installs of the same scaffold. Major / minor / patch bumps still happen producer-side, but they don't propagate without re-install.
- Runtime artifacts (procomps, runtime sections) follow normal SemVer — bump producer-side and consumers get the new behavior on next `shadcn add`.

This is the shadcn block model. It's a snapshot + own-it system, not a live dependency. Consumers should expect that.

---

## Per-tier meta schema (skeleton)

Each tier's `meta.ts` extends the procomp `ComponentMeta` shape with tier-specific fields. Concrete TypeScript types land in Phase B alongside the first pilot in each tier.

| Tier | Required meta fields beyond procomp baseline |
|---|---|
| pro-component | (existing) |
| pro-section | `procompDependencies: string[]` (registry slugs of upstream procomps) |
| pro-page | `sectionDependencies: string[]` • `procompDependencies: string[]` • `dataAssumptions: { server?: boolean; client?: boolean; static?: boolean }` • `routeShape: string` (e.g. `"/dashboard/[orgId]"`) |
| pro-panel | `pageDependencies: string[]` • `sectionDependencies: string[]` • `procompDependencies: string[]` • `shellComposition: { sidebar?: string; topbar?: string; auth?: string; theme?: string }` • `permissionModel: "role" \| "scope" \| "rbac" \| "none"` |

These let `validate:meta-deps` (the existing lint) scale into cross-tier dependency tracking in Phase B: bump procomp X → surface every section/page/panel that depends on it.

---

## Tier-scaled review mode

| Tier | Self-review acceptable | Peer or AI-assisted required |
|---|---|---|
| pro-component | ✅ for v0.1.0 + patch bumps | preferred for `alpha → beta` + breaking minors |
| pro-section | ✅ for v0.1.0 + patch bumps | preferred for `alpha → beta` + breaking minors |
| pro-page | ❌ never — composition risk too high | ✅ required at every GATE 3 |
| pro-panel | ❌ never — composition risk too high | ✅ required at every GATE 3 |

If no human peer is available for page/panel reviews, run an AI-assisted pass (spawn a `code-reviewer` agent or run a structured prompt over the diff) and tag the review file's findings as AI-sourced.

---

## Ownership + forking policy

- **Shared at library level:** sections and pages that are reused across multiple panels live at the library level (`src/registry/sections/`, `src/registry/pages/`).
- **Panel-specific variants:** if a panel needs a customized version of an existing section, fork it **inside the panel's `parts/`** — do not create a separate slug. Panel-local variants stay private to the panel.
- **Procomps are never forked.** If a procomp needs a behavioral variant, add a prop or a slot; if it needs a structural variant, ship a sibling procomp with its own slug.

---

## Workflow placement

The procomp workflow (CLAUDE.md §Workflow + [`docs/procomps/README.md`](procomps/README.md)) is unchanged. Tier-specific workflows mirror it:

| Step | pro-section | pro-page | pro-panel |
|---|---|---|---|
| 0 | (migration intake — optional) | (migration intake — optional) | (migration intake — optional) |
| 1 | GATE 1: description sign-off | GATE 1: description + constituent inventory + composition contract sign-off | GATE 1: description + page roster + shell composition sign-off |
| 2 | GATE 2: plan sign-off | GATE 2: plan + scaffold file tree sign-off | GATE 2: plan + full consumer file tree + per-page references sign-off |
| 3 | `pnpm new:section <category>/<slug>` *(Phase B)* | `pnpm new:page <category>/<slug>` *(Phase B)* | `pnpm new:panel <slug>` *(Phase B)* |
| 4 | implement + populate meta + demo + usage | implement + populate meta + demo + usage | implement shell + wire pages + meta + demo |
| 5 | manifest entry | manifest entry | manifest entry |
| 6 | verify docs render | verify docs render + route renders | verify docs render + every page renders |
| 7 | add to registry.json | add to registry.json (as `registry:block`) | add to registry.json (meta-block) |
| 8 | `pnpm registry:build` | `pnpm registry:build` | `pnpm registry:build` |
| 9 | author guide.md | author guide.md | author guide.md + per-page deployment notes |
| 10 | **GATE 3 spotcheck** | **GATE 3 spotcheck (peer/AI required)** | **GATE 3 integration spotcheck (peer/AI required; constituent pages must each have passed GATE 3 first)** |
| 11 | verdict ≥ Pass-with-follow-ups | verdict ≥ Pass-with-follow-ups | verdict ≥ Pass-with-follow-ups |
| 12 | update STATUS + decision file | update STATUS + decision file | update STATUS + decision file |
| 13 | commit + push | commit + push | commit + push |

Steps 3 (scaffolders) and 7 (registry typing for pages/panels) require Phase B tooling. Until Phase B lands, manually mirror the procomp scaffold shape.

---

## Phase B — deferred (author when the first pilot in a tier is being built)

1. Spotcheck templates for page + panel (`docs/reviews/templates/review-spotcheck-page.md`, `-panel.md`). Section reuses the existing procomp spotcheck template; just defaults the rotating dim to *composition integrity*.
2. Planning-doc templates per tier (description / plan / guide skeletons under `docs/<tier>/_template/`).
3. Scaffolders: `pnpm new:section`, `pnpm new:page`, `pnpm new:panel`.
4. Registry infrastructure: `src/registry/sections/`, `src/registry/pages/`, `src/registry/panels/`; per-tier `categories.ts`; per-tier `manifest.ts`; concrete `meta.ts` TypeScript types.
5. Migration intake extension: `pnpm new:migration --tier {section|page|panel}`.
6. `validate:meta-deps` extension: surface downstream consumers when an upstream tier bumps.
7. Smoke harness extension at `e:/tmp/ilinxa-smoke-consumer/`: per-tier smoke flows (page = install + tsc + render; panel = install + tsc + navigate).
8. STATUS.md per-tier tables (one block per tier, not one table with a tier column).
9. Per-tier category systems (sections by domain, pages by use-case, panels by product).

---

## Phase C — pilot one pro-section first

Lowest-risk tier. Pick a pro-section, run it through GATEs 1 → 3, stress-test the model, fix anything the pilot surfaces in the charter (v2). Only then move to a pro-page pilot, then a pro-panel pilot.

Do NOT attempt to ship a panel before sections and pages have been piloted. The composition risk compounds.

---

## What this charter explicitly does NOT do

- Doesn't replace any existing procomp convention. All 49 existing procomps are unchanged.
- Doesn't promise that Phase B / Phase C tooling exists yet. Until scaffolders + templates land, the workflow is manual.
- Doesn't define the *category* taxonomies for sections / pages / panels — that's Phase B's job, after pilots reveal what categories are useful.
- Doesn't introduce automated testing. Vitest remains an informed-defer at every tier.

---

## Cross-references

- Rule: [`.claude/rules/readiness-review.md`](../.claude/rules/readiness-review.md)
- Procomp planning conventions: [`docs/procomps/README.md`](procomps/README.md), [`docs/component-guide.md`](component-guide.md)
- Tier folders (placeholders): [`docs/sections/README.md`](sections/README.md), [`docs/pages/README.md`](pages/README.md), [`docs/panels/README.md`](panels/README.md)
- Decision: [`.claude/decisions/2026-05-25-library-tier-system-charter.md`](../.claude/decisions/2026-05-25-library-tier-system-charter.md)
- Producer-side registry skill: [`.claude/skills/shadcn-registry-pro/`](../.claude/skills/shadcn-registry-pro/)

---

**Established:** 2026-05-25.
**Authority:** This charter is binding for sections, pages, and panels authored after this date. Procomp conventions (and the 49 existing procomps) are unchanged.
