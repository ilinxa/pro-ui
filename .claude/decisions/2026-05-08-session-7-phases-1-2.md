---
date: 2026-05-08
session: 7
phase: 1-2
type: fix
commits: [fb23a2b, b807e35, 0be5a57, f319ae8, 829863f, c34d8f2]
components: []
findings: [F-cross-03, F-cross-05, F-cross-06, F-cross-08, F-cross-09]
status: shipped
---

# Session 7 Phases 1+2 — close 5 of 9 cross-cutting findings

## Summary

Mid-sweep checkpoint per master plan §7. Phase 1 diagnosed and resolved the smoke-test harness regression (F-cross-09); Phase 2 landed 4 sweep-wide cross-cutting fixes in 4 fine-grained commits. 5 of 10 cross-cutting findings closed in one session.

## Context

Tier 1 closed at 9/9 in session 6. Cross-cutting findings had accumulated:

- F-cross-03 (🚫 Blocker): `flow-canvas-01` absent from registry.json
- F-cross-05 (⚠️ High): 4 components declaring sibling deps as bare slug names; consumer install 404s
- F-cross-06 (🔸 Medium): 8/8 Tier 1 `usage.tsx` files using producer-side import paths
- F-cross-08 (⚠️ High): `process.env.NODE_ENV` use flagged in 4/9 Tier 1; rule conflicted with entity-picker plan §12.5 #5 explicit lock
- F-cross-09 (⚠️ High): smoke harness regression — 19/1/16 vs session 1's 31/1/5 across three sub-modes

Master plan §7 mid-sweep checkpoint allotted session 7 to triage + close these before Tier 2 begins.

## Outcome

**Phase 1 — F-cross-09 diagnostic:**

- Pinned smoke harness to `pnpm dlx shadcn@4.6.0` (was `@latest`) per CLI version regression
- Sub-mode (A): pure CLI regression in `latest`; pin resolved 9 carriers
- Sub-mode (B): peer-dep loop on harness's corrupt `@tailwindcss/postcss: ^10.0.0`; fixing the range resolved 3 silent-120s-timeouts
- Sub-mode (C): merged into F-cross-05 (same underlying bug; CLI message-text changed)
- Side-finding promoted to F-cross-10 (harness `package.json` hygiene drift)

**Phase 2 — sweep-wide commits:**

- `fb23a2b` F-cross-06 CLOSED — 37 `usage.tsx` files normalized from `@/registry/components/<category>/<slug>` to `@/components/<slug>`. tsc + lint clean.
- `b807e35` F-cross-08 CLOSED — `docs/component-guide.md` relaxed in 3 spots; `process.env.NODE_ENV` dev-warn gates explicitly allowed (cite entity-picker plan §12.5 #5 as canonical evidence).
- `0be5a57` F-cross-05 CLOSED — 44 bare-name internal references namespaced as `@ilinxa/<slug>` in registry.json. **Scope expanded** mid-fix: original 4 carriers had 9 cross-component refs; programmatic audit surfaced 35 latent fixtures-base intra-component refs (latent because smoke installs base only). Total 44 sites in one commit.
- `f319ae8` F-cross-03 CLOSED — `flow-canvas-01` shipped to registry.json (kanban pattern: 26-file base + 1-file fixtures). Build artifacts emitted.
- `829863f` Tracker bookkeeping for the above.
- `c34d8f2` Self-review consistency fix at sign-off (5 cross-doc inconsistencies caught + repaired).

**Verification:** tsc clean; lint 0 errors (3 pre-existing rich-card useVirtualizer warnings unchanged); smoke verification of F-cross-03 + F-cross-05 carriers deferred to session 7b after Vercel redeploys.

## Cross-references

- Tracker entry for F-cross-09: docs/reviews/sweep-tracker.md (cross-cutting findings table)
- Master plan §7: `~/.claude/plans/now-as-we-have-snazzy-raccoon.md`
- Handoff doc: `.claude/HANDOFF-sweep-paused-session-7.md`
- Audit-systematic-scope memory locked from this session's F-cross-05 expansion (4 → 44 sites)
