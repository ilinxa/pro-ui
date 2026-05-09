---
date: 2026-05-09
session: 14
phase: 7-followup
type: ship
commits:
  - 427a678
  - 59b44fd
  - 34c324a
  - 932e648
  - 9559ee3
components:
  - stat-card
findings:
  - 4 from GATE 3 spotcheck (3M + 1L); 3 closed in v0.1.1 same-day; F-04 (--success token) deferred to v0.2
status: complete
---

# stat-card — full v0.1.0 → v0.1.1 pipeline

First component to graduate the post-Phase-7 component-readiness-review rule end-to-end. Single-metric dashboard widget. Greenfield (no migration intake). First entry in a future "metrics-domain" family (kpi-grid, gauge-card, comparison-card all TBD).

## Pipeline trace

| Stage | Commit | Date | Outcome |
|---|---|---|---|
| Stage 1 description authored | `427a678` | 2026-05-09 | 9 open questions surfaced |
| Stage 1 audit fixes (3) | `59b44fd` | 2026-05-09 | Default `delta.format` = Intl percent / `polarity` → `betterIsHigher` / drop `direction` from public API |
| **GATE 1 sign-off** ("ship it") | — | 2026-05-09 | description locked |
| Stage 2 plan authored | `34c324a` | 2026-05-09 | Self-audit caught 4 inconsistencies (slug normalization, polarity-matrix wording, cell count, sparkline strokeColor default) — fixed same-commit |
| **GATE 2 sign-off** ("ship it") | — | 2026-05-09 | plan locked |
| v0.1.0 implementation + ship | `932e648` | 2026-05-09 | 9 source files; manifest + registry.json + public/r artifacts; full procomp doc trio |
| **GATE 3 spotcheck review** | (in commit) | 2026-05-09 | Verdict: Pass with follow-ups (3 Medium + 1 Low) |
| Smoke verification (post-push) | (review file revision) | 2026-05-09 | Install pass + tsc clean (14s + 34s) against deployed Vercel artifact |
| v0.1.1 patch (close 3 follow-ups) | `9559ee3` | 2026-05-09 | F-01 + F-02 + F-03 fixed same-day |

## What stat-card is

Single-metric dashboard widget. Required props: `value` + `label`. Optional: `delta` (object-shape), `trend` (number array → built-in pure-SVG sparkline), `icon`, `variant` (default / compact / detailed), `loading`, `href` + `linkComponent` (overlay-link pattern), `formatValue` / `renderValue` / `renderTrend` slots, `labels` for i18n.

The component bakes in three v0.1.x lessons:
- **Object-shape callbacks from day one** (F-cross-12 lessons): `onClick({ event })`, `renderValue({ value, loading })`, `renderTrend({ data, variant })`. No positional shapes.
- **Locale-aware default delta format** — `Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" })`. Convention: `delta.value` is a fraction (`0.124` = +12.4%).
- **`betterIsHigher` polarity flag** (default `true`) — explicit boolean, not a `polarity: "positive" | "negative"` enum (which would be ambiguous between "the number is positive" and "up is good").

## Sibling export

`<StatCardSparkline>` is exported standalone for use outside the card (e.g., a sparkline in a non-card context). Pure SVG, ~50 LOC, downsamples >100 points uniformly, `currentColor` inheritance via parent's `text-*` class. Engagement-bar-01's `EngagementHeartBurst` set the sub-export precedent.

## File-by-file

```
src/registry/components/data/stat-card/
├── stat-card.tsx               main component (~280 LOC, variant dispatch + skeleton)
├── parts/sparkline.tsx         sibling-exported pure-SVG sparkline (~50 LOC)
├── lib/format-default.ts       defaultDeltaFormat (single function)
├── types.ts                    StatCardProps + StatCardDelta + StatCardLabels +
│                               render contexts + DEFAULT_STAT_CARD_LABELS
├── dummy-data.ts               6 fixtures (revenue/errorRate/activeUsers/latency/signups/uptime)
├── demo.tsx                    9 tabs (Default / Compact / Detailed / Loading /
│                               Empty / Color logic matrix / Custom value /
│                               Sparkline only / Localized TR)
├── usage.tsx                   consumer-facing prose with code blocks
├── meta.ts                     shadcn=skeleton; npm={}; tags=[stat-card,metric,kpi,...]
└── index.ts                    barrel — NO meta re-export (post-Phase-7 rule)
```

## GATE 3 review findings

| # | Severity | Description | Status |
|---|---|---|---|
| F-01 | 🔸 Medium | Skeleton `role="region"` without accessible name | ✅ closed v0.1.1 (same-day) |
| F-02 | 🔸 Medium | Skeleton class string-replace fragile for `detailed` variant | ✅ closed v0.1.1 (same-day) |
| F-03 | 🔹 Low | Linked card with `value=undefined` produces unnamed link | ✅ closed v0.1.1 (same-day) |
| F-04 | 🔹 Low | `text-chart-2` for "good" tone is a workaround | open — v0.2 / separate design-system pass adds `--success` token |

## Smoke verification (F-cross-11 path b)

- Install: 14083 ms — pass
- tsc: 33683 ms — pass

The component has no cross-folder imports (only same-folder `lib/` + `parts/`), so the F-cross-11 brittleness class doesn't apply by construction. Path b nonetheless caught a separate-class issue during implementation: `validate-meta-deps` flagged a phantom `lucide-react` declaration in `meta.ts` before commit (the icon prop type is generic `ComponentType`, not lucide-specific; icons in demo.tsx are demo-only). Removed before push.

## Audit-fixes-during-implementation that surfaced from rule + lint stack

1. **`validate-meta-deps`** caught the phantom `lucide-react` declaration. Pre-commit fix.
2. **`pnpm lint`** caught a `react-hooks/preserve-manual-memoization` violation in the resolver (would have been an issue if I'd used `useMemo` with destructured-prop deps). Avoided by computing inline (matches the Group A + Group H precedents from Phase 7).
3. **Self-audit pass on the plan** caught 4 inconsistencies before code landed: slug normalization (`stat-card-01` → `stat-card`), demo tab wording ("Polarity matrix" → "Color logic matrix"), success criterion cell count (6 → 5), sparkline strokeColor default (var(--primary) vs currentColor).

## What doesn't apply / what's deferred

- **kpi-grid sibling layout** — out of v0.1.0 scope; consumer wraps cards in their own grid for now
- **Comparison-card** (two-up "this vs that") — v0.2 sibling
- **Gauge-card** (radial single-metric) — v0.2 sibling
- **target / goal prop** — v0.2 candidate (would add a tiny progress bar between value and delta rows)
- **`--success` design-system token** — F-04; v0.2 / separate design-system pass

## Cross-references

- Procomp docs: [`docs/procomps/stat-card-procomp/`](../../docs/procomps/stat-card-procomp/)
- Component source: [`src/registry/components/data/stat-card/`](../../src/registry/components/data/stat-card/)
- GATE 3 review file: [`docs/procomps/stat-card-procomp/reviews/2026-05-09-v0.1.0-spotcheck.md`](../../docs/procomps/stat-card-procomp/reviews/2026-05-09-v0.1.0-spotcheck.md)
- Readiness-review rule: [`.claude/rules/component-readiness-review.md`](../rules/component-readiness-review.md)
- Component-readiness-review rule decision: [`2026-05-09-component-readiness-review-rule.md`](2026-05-09-component-readiness-review-rule.md) (predecessor work)
- F-cross-11 path b decision: [`2026-05-09-fcross11-path-b-smoke-tsc.md`](2026-05-09-fcross11-path-b-smoke-tsc.md) (the smoke harness this verification used)
- F-cross-12 v0.2 cutover: [`2026-05-09-fcross12-v02-cutover.md`](2026-05-09-fcross12-v02-cutover.md) (the object-shape callback convention this component instantiates)
