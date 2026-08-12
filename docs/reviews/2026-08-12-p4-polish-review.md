# GATE 3 readiness review — P4 professional polish & the 1.0 bar

**Date:** 2026-08-12 · **Scope:** full P4 phase (plan §4.1–4.4) — 1.0-bar ADR + versioning
policy, install-matrix evidence on CLI 4.17.0 + doc precision, docs-site professional baseline
(metadata/OG/robots/not-found/a11y/constants/badges + design pass + brand assets), generated
component-versions surface. · **Review mode:** AI-assisted per the readiness-review rule —
two independent fresh-context adversarial finders (site-code axis · docs/tooling axis), architect
refute-or-confirm verdicts, plus a 31-check runtime verification suite against the production
build. · **Loop state machine:** [`docs/plans/p4-polish-1-0-plan.md`](../plans/p4-polish-1-0-plan.md).

## Evidence spine

| Layer | Result |
|---|---|
| Gate battery (R3, re-run post-fixes) | tsc 0 · lint 0 errors + exactly the 9 known warnings · meta-deps 63/63 · whitelist/registry-json/naming ✓ (0 high) · doc-drift ✓ incl. NEW component-versions `--check` · registry:build + artifact-size 65/65 ✓ · app build 76 pages |
| Adversarial finders (2, fresh context) | 14 findings — **12 CONFIRMED + fixed + re-gated · 2 DROPPED with reasoned refutation** (findings table in the plan doc) |
| Runtime verification (R5, prod build) | **31/31 checks pass** — metadata/OG on 3 route classes, sitemap 66 URLs, robots, skip-link keyboard flow, breadcrumb filter contract, styled 404 negative path, served llms.txt text, brand assets |
| Consumer-install evidence (S1) | 3 fresh consumers, real `shadcn@4.17.0` adds — root/src/custom-alias landing paths settled empirically; phantom no-op re-tested print-vs-disk; package.json corruption NOT reproduced on 4.17.0. Report: `e:/tmp/ilinxa-p4-install-matrix-report.md` |
| Design pass (S4) | 12-screenshot light/dark coherence audit vs the token mandate — no drift; OG image + icon set generated FROM the tokens (no volatile counts baked in) |

## Findings worth naming (full table in the plan doc)

- **F-10 (High, fixed):** route-level `openGraph` shallow-replaces the layout's — og:site_name/
  type/locale were dropped on all 63 detail routes. Fixed via shared `OG_BASE` spread
  (`src/lib/site-metadata.ts`).
- **R5-only finding (High, fixed):** app-dir `opengraph-image.png` does NOT cascade to child
  segments on Next 16.2.4 — contradicted the finder's docs-based expectation; caught only by
  driving the real server. Moved to `public/og-image.png` + explicit `images`.
- **F-1/F-4 (CRLF class):** Windows CRLF rewrites broke the doc-drift validator's ↳-strip and
  would have caused permanent regenerate-thrash in the new generator. Both scripts now
  `\r\n`-normalize on read.
- **F-7 (gap, closed):** committed `docs/component-versions.md` had no freshness gate (unlike
  llms.txt) — generator `--check` mode now chained into `validate:doc-drift`.
- **F-11/F-12 (DROPPED):** playground revoke-on-replace (uploader can't know URL liveness —
  unmount-scoped cleanup is the correct conservative design) · single-frame PNG-ICO favicon
  (valid modern format; icon.svg/apple-icon preferred by all current browsers).

## Close conditions (readiness-review rule)

1. Planning docs current — plan doc is the loop state machine, ADR FINAL ✅
2. tsc/lint/meta-deps/build + validators green with numbers ✅ (table above)
3. Review file at `docs/reviews/` ✅ (this file)
4. Verdict ≥ Pass with follow-ups; every follow-up owner'd ✅ (below)
5. Constituent gates n/a (no new library artifacts — site/docs/tooling phase)
6. STATUS.md honest + decision file — lands in the same base commit ✅

## Verdict: **Pass with follow-ups**

Follow-ups (owner + target):
- **Whole-write-abort on conflicting base files** not re-reproduced on CLI ≥4.17.0 (matrix
  covered same-item re-add only) — owner: next feature-slice ship re-exercises it; guidance in
  the convention doc stays until then.
- **favicon.ico is single-frame 32px** (PNG-ICO) — cosmetic legacy-16px edge; owner: informed
  defer, revisit only if legacy crispness ever matters (icon.svg covers modern browsers).
- **`/sandbox/flow-stress` hand-rolled title suffix** — noindexed devtools page; owner:
  fix-on-touch.
- **Playground per-mount object-URL growth** — accepted-by-design, bounded by publish count;
  documented in-code; owner: none (re-open only if a real memory complaint surfaces).

**GATE 3 CLOSED** pending the R6 base commit + R7 push per the readiness loop §Commit points.
