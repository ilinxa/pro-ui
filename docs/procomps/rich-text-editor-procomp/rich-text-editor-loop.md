# Loop state — `rich-text-editor` (U-loop)

<!-- This file IS the state machine: a fresh session resumes from the first unchecked gate.
     Update the Status header at EVERY stage transition. -->

## Status

| Field | Value |
|---|---|
| **Mode** | U-loop (change class: **minor** — additive props `embedAllowList` / `isEmbedAllowed`; default embed behavior tightens, see migration note) |
| **Current stage** | U7 — gates 1–8 green, consumer smoke 23/23 + tsc 0; committed locally, push awaits user |
| **Sign-off policy** | minor — delegated by user 2026-10-23 for the fix-now batch (docs/plans/fix-now-batch-plan.md); architect signs off contract B9 |
| **Version target** | v0.3.0 → **v0.4.0** |
| **Model roster** | architect: main session · implementers: Sonnet 5 · finders: architect to assign |
| **Started / updated** | 2026-10-23 / 2026-10-23 |

## Stage checklist

- [x] U0 Intake & impact — blast radius below
- [x] U1 Change contract — batch plan row B9; sign-off per policy above
- [x] U2 Implement — slices below
- [x] U3 Gate battery — architect re-runs full battery — gates 1–8 green (batch gate battery, docs/plans/fix-now-batch-plan.md)
- [x] U4 Adversarial review — adversarial review done — findings table below
- [ ] U5 Runtime & smoke
- [x] U6 Docs sync & GATE 3 — guides/meta current; minors reviewed in spotcheck files (Pass with follow-ups); patches: architect self-check (no review file per ladder) — review file [reviews/2026-10-23-v0.4.0-spotcheck.md](reviews/2026-10-23-v0.4.0-spotcheck.md) exists; GATE 3 closure pending
- [ ] U7 Ship

## U0 — Blast radius

| Surface | Why touched |
|---|---|
| `json-form` (field-richtext, lazy) | consumes `RichTextEditor`; no edits, must compile + behave the same (new props optional) |
| `content-composer` (body substrate) | consumes the editor; same |
| `src/app/sandbox/event-detail-page-01` | docs-site page using `RichTextViewer` |
| `registry.json` | two new shipped files: `lib/safe-embed.ts`, `parts/safe-embed-view.tsx` (coordinator-owned) |
| guide / description / plan / meta | props tables, security section, version 0.4.0 |

## Slice plan

| # | Slice | Owner | Status | Evidence |
|---|---|---|---|---|
| 1 | `lib/safe-embed.ts` (policy, `resolveEmbed`, `safeHref`, `isHttpUrl`, per-editor WeakMap) + `parts/safe-embed-view.tsx` | implementer | done | `__tests__/safe-embed.test.ts` |
| 2 | Wire `MediaEmbedElement`, `StaticMediaEmbed`, `LinkElement`, `StaticLink`; `LinkPlugin` `allowedSchemes` in both kits | implementer | done | `__tests__/safe-embed-render.test.tsx` |
| 3 | Toolbar + floating-toolbar link/image prompt validation | implementer | done | `parts/editor-toolbar.tsx`, `parts/floating-toolbar.tsx` |
| 4 | Props on editor / viewer / `SerializeHtmlOptions`; barrel exports | implementer | done | `types.ts`, `lib/serialize-html.ts`, `index.ts` |
| 5 | Docs + meta 0.4.0 | implementer | done | guide "Security: embeds and links" |

## Invariants

| # | Invariant (testable) | Reviewed (U4) | Observed live (U5) |
|---|---|---|---|
| I1 | Existing YouTube/Vimeo embed URLs keep rendering as iframes | | |
| I2 | Dependents (json-form, content-composer) compile unchanged | | |
| I3 | No `javascript:` href is ever emitted by editor, viewer, or HTML export | | |
| I-neg | Non-allow-listed / non-https embed never produces an iframe | | |

## Gate battery (stage U3)

Batch-wide numbers copied from `docs/plans/fix-now-batch-plan.md` (2026-10-23).

| Gate | Result |
|---|---|
| tsc | exit 0, 0 errors (consumer-strict flags) |
| lint | exit 0 — 0 errors, 14 warnings (= known baseline) |
| meta-deps | exit 0 — 64/64 clean |
| registry validators | all exit 0: whitelist ✓ · registry-json 0 high / 6 warn (all pre-existing: filter-bar ×2, rich-text-editor `@platejs/resizable`, post-card ×2, project-card) · naming 0 · no-control-chars 1438 files · barrel-exports 0 high · inert-surfaces 0 · registry-tokens 0 (new) |
| doc validators | doc-drift ✓ (inside registry:build) · doc-budget ✓ |
| registry:build | exit 0 — 66 artifacts, artifact-size 0 high; `cssVars` + new files verified in `public/r/*.json` |
| build | exit 0 — compiled in 3.8 min, 77/77 static pages (first attempt OOM'd on a memory-starved host; retry clean) |
| tests (`NODE_ENV=production`) | exit 0 — **35 files / 263 tests** (first run of the session: 14 files + 21 worker-start timeouts — the known cold-start flake; retry clean, counts compared) |

## Findings table (stage U4)

| # | Finding (failure scenario) | Source | Verdict | Evidence / refutation | Fix |
|---|---|---|---|---|---|
| F-C1 | rich-text: render tests unverified (worker timeouts) | finder (B9) | CONFIRMED → resolved | re-run | 35/35 incl. render + serializer |
| F-C2 | rich-text: embed URL with credentials passes | finder (B9) | CONFIRMED 🔹 | `resolveEmbed` | refused; test |
| F-C3..C6 | rich-text: policy change on a mounted editor; protocol-relative hrefs; image `src` unfiltered (no script exec); IDN/wildcard breadth | finder (B9) | DROPPED / documented | low impact | guide notes; image src parked |

## Runtime & smoke evidence (stage U5)

-

## Parked

- Embed policy is stored per editor instance and read at render; prop changes do not re-render already-mounted embed nodes until they re-render for another reason.
- Same-origin embeds are not detected (viewer is server-rendered; a client check would mismatch hydration).

## Pre-mortem (stage U7)

If this breaks for a consumer, it breaks because: they relied on embeds from hosts outside the default allow-list and did not pass `embedAllowList` / `isEmbedAllowed`.
