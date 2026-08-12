---
date: 2026-08-12
session: P4 readiness loop (polish & 1.0 bar)
phase: P4.1
type: architecture-decision
commits: (P4 base commit — fill at R6)
components: [catalog-wide]
findings: ratifies plan D4 with the review-10.5 candidate bar folded in; evidence links in docs/plans/p4-polish-1-0-plan.md
status: FINAL — ratified 2026-08-12 (S1 install-matrix evidence landed same day)
---

# P4.1 — What "1.0" means for ilinxa pro-ui

## Decision

**"1.0" is a catalog-level claim, not a per-component version.** Individual components keep
independent semver (all currently 0.x). The library declares **catalog 1.0** when every criterion
below holds; the catalog version is published in `llms.txt` + README header and bumped by the
criteria in §Versioning policy.

## The 1.0 bar (ratified from plan D4 + review 10.5)

| # | Criterion | State at ratification |
|---|---|---|
| 1 | P0–P3 of the production-readiness plan closed with GATE 3 verdicts | ✅ (P0 ✅ P1 ✅ P1.5 ✅ P2 ✅ P3 ✅) |
| 2 | Full validator battery wired into `registry:build` → every deploy gated (meta-deps incl. reverse-npm, registry-json, naming, artifact-size, doc-drift, doc-budget, whitelist) | ✅ (P0–P3) |
| 3 | Cross-backend consumer smoke green across catalog: Base UI 63/63 + Radix directory-audit path, consumer tsc 0 | ✅ 2026-08-11 evidence; re-affirmed on current-CLI samples at P4.2 |
| 4 | Install-path behavior EVIDENCED on the current CLI (root layout, src layout, custom alias) and documented precisely in llms.txt/README — no folklore | ✅ 2026-08-12: CLI 4.17.0 matrix (`e:/tmp/ilinxa-p4-install-matrix-report.md`) — targets resolve against source root (src-aware), aliases don't relocate explicit-target files, imports rewrite + compile; 4.6.0 package.json corruption NOT reproduced; phantom-no-op softened (prompt auto-"no", still exit 0). Docs corrected: llms.txt, README, /docs page, registry skill, feature-slicing convention |
| 5 | Docs surfaces generated, not hand-maintained: llms.txt/README catalog (build:llms), component-versions (build:component-versions) — each with a freshness validator (llms/README via validate:doc-drift; component-versions via its own `--check` mode chained into the same gate) | ✅ 2026-08-12: generator wired into registry:build + `--check` freshness gate in validate:doc-drift; old hand file archived |
| 6 | Docs site professional baseline: metadataBase/OG/sitemap/robots, skip-link, linked breadcrumbs, single registry-constants source, single status-badge helper, design-coherence pass per `frontend-design` | ✅ 2026-08-12: all shipped (P4 loop S2+S4); 12-screenshot light/dark coherence audit passed; OG image + brand icon set generated from tokens |
| 7 | Versioning policy published (this file, §below) | this file |
| 8 | `@ilinxa` listed in the official shadcn registry directory, **or PR submitted & pending external review** — with zero-config `add` verified from a clean project (done 2026-08-11) + shadcn-MCP discoverability confirmed (done 2026-08-11: list/view/search green) | ⏳ USER-GATED: DNS `ui.ilinxa.com` + PR submission (docs/directory-pr-pack.md) |
| 9 | No open 🚫 Blocker / ⚠️ High findings against shipped code in the deep-review ledger or sweep-tracker | ✅ per review §0 ledger 2026-08-11 (re-check at P4 close) |

**Explicitly NOT in the bar** (informed defers, unchanged): unit-test runner · NPM tarball
publishing · MDX prose docs · per-component `beta`/`stable` promotion sweeps (per-component
concern, tier charter owns it).

**Consequence:** when #4–#7 close in this loop, the only remaining gate is #8 (user actions).
1.0 declaration = flip the catalog version to 1.0.0 in the generated headers + a decision file,
once #8's PR is submitted.

## Versioning policy (published — bar criterion #7)

**Per-component semver** (unchanged, now written down):
- **patch** — internal fix, no public-API touch. GATE 3 exempt (readiness-review rule).
- **minor** — additive public API (props, parts, exports), new feature slice, dep additions.
  GATE 3 spotcheck if API-touching.
- **major** (post-1.0 components) / **0.x minor with BREAKING marker** (pre-1.0) — renames,
  removals, behavior contract changes. Requires migration note in the component guide +
  deprecated-alias where the registry supports it (P2 precedent).
- `status` field: `alpha` (shipped, API may move) → `beta` (survived a full checklist review +
  ≥1 external consumer use) → `stable` (no breaking change across 2 consecutive minors).
  Promotion triggers per tier charter; never bulk-promoted.

**Catalog version** (new):
- Lives in generated `llms.txt` + README header (build:llms emits it from one constant).
- **patch** — regenerated docs, component patches only.
- **minor** — any component minor, new component, new category.
- **major** — registry URL/template change, item-naming change (a P2-class event), convention
  break that forces consumer re-installs.
- 0.x → 1.0.0 is gated by the bar above, not by calendar or count.

## Why now
Review 10.5 ("decide what 1.0 means before client-facing sales material") + plan D4 default bar
needed ratification before the directory listing goes live — the listing is the first surface
where an external consumer reasonably asks "is this stable?".

## Links
- Master plan §4.1 (D4): docs/production-readiness-plan.md
- Loop evidence: docs/plans/p4-polish-1-0-plan.md
- Directory pack: docs/directory-pr-pack.md
