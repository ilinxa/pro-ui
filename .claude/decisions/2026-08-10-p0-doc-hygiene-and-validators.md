---
date: 2026-08-10
session: production-readiness-p0
phase: P0 (plan: docs/production-readiness-plan.md)
type: infrastructure + docs
commits: (this commit series)
components: none (docs site + internal docs only)
findings: review 4.1, 4.2, 4.3, 10.1, 10.2 closed; doc-system audit items closed
status: shipped
---

# P0 — doc-system hygiene + truth validators

Executed the signed-off plan's Phase 0 in one pass. Everything below lands together.

## Internal doc system (the token-weight fix)

- **CLAUDE.md**: stale "49 shipped" fixed (counts now live in STATUS only), master-plan pointer added, duplicated registry/GATE-3 prose trimmed, size-budget header added. 13.1KB → 11.7KB.
- **readiness-review rule**: split core/spec — always-loaded core now 2.7KB (was 13.7KB); full spec moved verbatim-in-substance to `docs/reviews/readiness-review-spec.md`. Redirect stub kept (20+ historical links).
- **STATUS.md**: 120KB → 8.7KB (third restoration of the lean-snapshot rule). One-line component rows (D3), banner-blockquote stack deleted (content lives in decision files), Recent activity capped at 5, queue re-dated, stale "not pushed" items dropped (verified pushed — tree was clean/synced).
- **Archive sweep**: 46 handoffs + PHASE-7-PLAN → `.claude/handoffs-archive/`; root debris (`firstconversation.md`, `graph-visualizer-old.md`) → `docs/archive/`. One active handoff remains.
- Session-loaded chain: ~33KB → **~20KB**.

## Public docs truth (review 4.1 / 4.2 / 4.3 / 10.1 / 10.2)

- **`scripts/build-llms.mjs`** generates the catalog sections of `public/llms.txt` + `README.md` from registry.json between marker comments (63 components, per-category, first-sentence blurbs). Stale "eight components" lists + force-graph notes deleted from llms.txt, README, and the docs page.
- **docs page** catalog section now renders from `getMetaList()` (category-grouped slug chips) — cannot go stale.
- **Homepage** category count now counts populated categories only (9, not 11).
- **`use-filters.ts`** `VALID_CATEGORIES` derived from `CATEGORIES` (was a hand-list missing `code` + `gamification` — the filter silently no-op'd for both).
- **`/components` prerender**: Suspense fallback now renders the real unfiltered catalog grid server-side (was 6 skeleton divs) — crawlers/no-JS agents see all 63 names + links.
- **`components/[slug]/error.tsx`** added (a throwing demo no longer takes down the page chrome) + **`sitemap.ts`** (66 URLs from the manifest).

## Validators (P5 seeds — the "can't regress" layer)

- **`validate:doc-drift`** — llms.txt/README generated sections vs registry.json base-item set + count claims. Fails on missing/phantom slugs or hand-edits between markers.
- **`validate:doc-budget`** — byte budgets on always-loaded .claude files (CLAUDE 12KB / STATUS 14KB / rules 4-8KB) + max 2 active handoffs. **Caught CLAUDE.md over-budget on its first run** (trimmed to comply).
- Both + `build:llms` wired into `registry:build`, so `vercel-build` regenerates + validates on every deploy.

## Gates at close

tsc 0 · lint 81/23 (pre-existing baseline, P1E owns it) · meta-deps 63/63 · doc-drift ✓ · doc-budget ✓ · build ✓.

## Follow-ups

- P1 fix program is next (plan §Phase 1).
- llms.txt blurbs inherit the long meta descriptions until P2.5 rewrites them (the generator clamps to first sentence ≤160 chars as a stopgap).
- The docs-page prose sections (install steps etc.) remain hand-written — only the catalog is generated.
