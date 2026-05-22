---
date: 2026-05-22
type: ship
commits: [pending]
components: [pricing-table-01]
findings: [F-01-cross-13-tooltip-delay-dropped, F-02-tooltipprovider-nested, F-03-tier-warn-dedupe, F-04-path-b-smoke-deferred, F-05-fixture-copy-polish]
status: shipped
---

# pricing-table-01 v0.1.0 — first ship (47th component)

## Summary

Closes out the in-flight `pricing-table-01` implementation that was authored earlier in the session but never registered / GATE-3'd / committed. The user surfaced it ("there are many thing waiting for commit") at the end of the chain that shipped its sibling `registration-form-01@v0.1.0`. Same batch (CMS conversion-block, 1 of 2 — sibling = registration-form-01 = 2 of 2).

**Final shape:** marketing-category pricing surface. 2 layout variants (`cards` default, 2–4 tier grid; `table` feature-comparison grid with proper `<th scope>` semantics) × optional monthly/annual toggle × highlighted-tier badge + signal-lime accent × per-feature tooltip rows × controlled-or-uncontrolled billing state × ReactNode or CtaSpec polymorphic CTAs × 3 tones × full i18n bag × RTL-safe. ~1,500 LOC across 11 shipped files + 1 dummy-data fixtures file.

## Pre-ship F-cross-13 carrier drop (load-bearing)

Caught during the GATE 3 inspection pass: `<TooltipProvider delayDuration={150}>` at `pricing-table-01.tsx:93` was the known Radix → Base UI divergence carrier (Radix uses `delayDuration`, Base UI uses `delay`). **Dropped pre-ship** with an inline comment explaining the rationale — same defensive pattern as rich-card-in-flow@v0.2.0 (B4) and todo-rich-card@v0.1.1. Default delay (~700ms Radix / ~600ms Base UI) is acceptable for the pricing-table tooltip surface; consumers needing a snappier delay wrap their own `<TooltipProvider delay={NN}>` at app-root level.

This pre-emption is the *third consecutive* time a v0.1.0 first ship avoids the same-day F-cross-13 patch loop by catching the carrier pre-push. The pattern is now project default.

## Public API surface

The exported component + the 1 public-API type are:

- `<PricingTable01 {...props}>` — React.memo-wrapped marketing surface
- `PricingTable01Props` + nested types (PricingTier, CtaSpec, PricingLabels, BillingPeriod, Tone)
- `DEFAULT_LABELS` re-exported from the barrel (English defaults; consumers shallow-merge their overrides)

## Verification

- `pnpm tsc --noEmit` → 0
- `pnpm validate:meta-deps` → 47/47 clean (pricing-table-01 specifically clean post `lucide-react` meta-decl)
- `pnpm validate:default-registry-whitelist` → 25/25 clean
- `pnpm registry:build` → clean (regenerates `public/r/pricing-table-01.json` + `public/r/pricing-table-01-fixtures.json` + catalog index)
- CDP page-load via `e:/tmp/pt01-repro.mjs` → `/components/pricing-table-01` renders with `v0.1.0` version label + meta description + 2 billing-toggle radios (Monthly / Annual); **zero console warnings, zero page errors**

## GATE 3 spotcheck verdict

**Pass with follow-ups** ([reviews/2026-05-22-v0.1.0-spotcheck.md](../../docs/procomps/pricing-table-01-procomp/reviews/2026-05-22-v0.1.0-spotcheck.md))

Rotating dimension: Robustness / edge cases (controlled-or-uncontrolled billing, tier-count bounds, polymorphic CTA shape, annual-strikethrough rule, `Intl.NumberFormat` SSR consistency, F-cross-13 primitive divergence).

5 findings, all **non-blocking**:

- F-01 🔹 Low — F-cross-13 carrier `delayDuration` dropped pre-ship (pre-empted; now non-issue)
- F-02 🔹 Low — `<TooltipProvider>` internally scoped; nested-with-consumer-provider is benign but slightly wide (v0.2 candidate)
- F-03 🔹 Low — Dev-mode tier-count warn fires once per parent render with inline `tiers={[]}` arrays (v0.2 candidate)
- **F-04 🔸 Medium — path-b consumer-tsc smoke deferred to post-deploy** (established pattern; F-cross-13 carriers pre-empted)
- F-05 🔹 Low — Demo fixture copy not deeply audited for marketing-friendly tone (v0.1.x polish)

## Backstory

The `pricing-table-01` files (1,500 LOC, 11 source files + types + index + meta + demo + usage + dummy-data, plus a full GATE 1 description + GATE 2 plan) pre-existed in this session's working tree at session start. I noticed them as `??` git-untracked entries earlier while staging the `registration-form-01` ship but deliberately left them alone to avoid mixing two unrelated bodies of work.

The `manifest.ts` entry for pricing-table-01 had been added by a previous session and was committed as part of `registration-form-01`'s C1 (the import + REGISTRY array entry came along inside the file when I staged it). That meant the project tsc + lint were already green for pricing-table-01 throughout the registration-form-01 ship — the only missing surfaces were registry.json + the GATE 3 review + STATUS + component-versions + decision file.

The user surfaced this after my "shipped + pushed" report for registration-form-01: "there are many thing waiting for commit". The closeout work proceeded the same way as the C7-C11 sequence I just ran for the sibling: registry.json entries → registry:build → CDP smoke → GATE 3 spotcheck → STATUS / component-versions / decision file → commit + push.

## Files

```
docs/procomps/pricing-table-01-procomp/
├── pricing-table-01-procomp-description.md       (pre-existed; GATE 1)
├── pricing-table-01-procomp-plan.md              (pre-existed; GATE 2)
└── reviews/
    └── 2026-05-22-v0.1.0-spotcheck.md            (NEW; GATE 3)

src/registry/components/marketing/pricing-table-01/
├── pricing-table-01.tsx                          (root; F-cross-13 fix applied)
├── index.ts
├── types.ts
├── meta.ts                                       (npm: lucide-react added)
├── dummy-data.ts
├── demo.tsx
├── usage.tsx
└── parts/
    ├── billing-toggle.tsx
    ├── comparison-table.tsx
    ├── price-display.tsx
    ├── tier-card.tsx
    ├── tier-cta.tsx
    ├── tier-feature-row.tsx
    ├── format.ts
    └── tone.ts

registry.json                                      (base + fixtures items added; slotted after share-bar-01-fixtures)
public/r/pricing-table-01.json                     (generated)
public/r/pricing-table-01-fixtures.json            (generated)
public/r/registry.json                             (catalog index updated)
src/registry/manifest.ts                           (entry was committed earlier; no change here)

.claude/STATUS.md                                  (banner + table row 46→47 + Recent activity pointer)
.claude/decisions/2026-05-22-pricing-table-01-v0.1.0-first-ship.md  (this file)
docs/component-versions.md                         (Total 46→47 + table row + Highlights entry)
```

**47 components total** across 8 categories after this ship.

## Post-deploy

Run `node e:/tmp/ilinxa-smoke-consumer/run-smoke.mjs pricing-table-01` once Vercel completes the deploy. F-cross-13 carriers pre-empted in source — expected install + consumer-tsc clean. If anything surfaces, same-day v0.1.1 patch per the established pattern.
