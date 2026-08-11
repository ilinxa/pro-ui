# Structure audit — story-viewer v0.5.0 (2026-08-11)

verdict: findings-logged
artifact: 204.9 KB / budget 240 KB (14.6% headroom)

## 1. Compound compliance (.claude/rules/compound-component-structure.md)

`story-viewer` already does the hard part of "capability-gated affordances" right: every
viewerMode-scoped region (engagement overlay, DM/reply composer, owner overlay, kebab, comments
panel, share panel) is individually opt-out-able (`disableEngagement` / `disableReplyComposer` /
`disableOwnerOverlay` / `disableComments` / `disableSharePanel`) and mount-gated in JSX
(`story-viewer.tsx:755-764`, `:1167`, `:1187`, `:1258`, `:1291`, `:1311`) — dropping a handler drops
the affordance, per the rule.

**Finding:** the rule also requires composed procomps to be delegated behind `React.lazy` so
*dropping the part drops the weight*. Today all three of `story-viewer`'s declared `internal`
registry dependencies (`meta.ts` `dependencies.internal: ["video-player", "engagement-bar",
"comment-thread"]`) are **static, module-level imports**, not lazy:
- `parts/item-view.tsx:2` — `import { VideoPlayer } from "../../video-player/video-player"` —
  `ItemView` mounts unconditionally for every story item (image or video), so an all-image story
  set still bundles `video-player`.
- `parts/engagement-overlay.tsx:7` — `import { EngagementBar } from
  "@/registry/components/data/engagement-bar/engagement-bar"` — bundled even when `viewerMode`
  isn't `"viewer"` or `disableEngagement` is set.
- `parts/reply-composer.tsx:8-10` — runtime `CommentComposer` (not just its type) imported from
  `@/registry/components/data/comment-thread/parts/comment-composer` — bundled even when
  `disableReplyComposer` is set or `viewerMode !== "viewer"`.

This is a real, current-era gap: it survived two dedicated readiness-review passes already run on
this component (v0.4.3 "full-component readiness review" and v0.4.4 "docs + demo alignment pass",
both `meta.ts` feature-log entries) — those passes covered registry-file completeness, doc/meta
staleness, and barrel type-exports, but not bundle-weight/lazy-boundary compliance, so this is a new
finding, not a re-flag.

## 2. Dead / orphaned public API

None found. `useCubeTransition` and `useLongPressPause` are deliberately kept internal (documented
in `usage.tsx`'s "Public types & helpers" section as "tightly coupled to this viewer's render
shape") — a stated design decision, not an abandoned surface.

## 3. Undocumented prop semantics

None found. `usage.tsx` already covers role-aware mode, engagement overlay, comments panel, share
panel, and the v0.4 cube/swipe mechanics in dedicated sections — this folder already carries two
recent dedicated doc-alignment passes (v0.4.3/v0.4.4, see §1) that closed the drift classes this
audit would otherwise surface (registry roster, meta/description staleness, feature-count drift,
barrel type-export gaps, thin usage.tsx). Re-flagging those would be redundant with `meta.ts`'s own
change log.

## 4. A11y baseline

Solid — `DialogTitle` present as `sr-only` (`parts/viewer-shell.tsx:58`), per-button `aria-label`s
throughout (heart toggle, panel-close backdrop, kebab, header controls), progress segments use
`role="progressbar"` with `aria-valuenow` per `meta.ts`'s feature claim. No findings.

## 5. Weight & slice candidacy

Core folder (excl. `demo.tsx`/`dummy-data.ts`/`usage.tsx`/`meta.ts`): **4,907 LOC**. Top-3 files:
`story-viewer.tsx` 1,288 (26.2% — the assembly itself, not a slice candidate), `types.ts` 790
(16.1%), `hooks/use-story-viewer-state.ts` 376 (7.7%).

**Slice-candidate axis: the role-aware engagement layer.** Everything gated behind `viewerMode`
truthy — `parts/engagement-overlay.tsx` (96) + `hooks/use-story-engagement-state.ts` (161) +
`lib/engagement-actions.ts` (110) + `parts/reply-composer.tsx` (170) + `parts/owner-overlay.tsx`
(165) + `parts/kebab-panel.tsx` (112) + `lib/kebab.ts` (176) + `parts/comments-panel.tsx` (44) +
`parts/share-panel.tsx` (46) + `parts/bottom-sheet.tsx` (78, shared panel chrome) = **1,158 LOC
(23.6%)** of extractable files alone (before counting the viewerMode-gated wiring inline in
`story-viewer.tsx` itself) — clears the ≥20% bar. Base-coupling is genuinely low: every sub-piece
already has its own disable flag and mount gate (§1), and this is exactly the axis carrying all
three composed-procomp static imports from §1 — slicing it out would fix the lazy-loading gap and
the weight-budget story in one move. A pure "story slideshow" consumer (no social layer) pays for
`engagement-bar` + `comment-thread`'s composer + all of the above today for zero benefit. Note as
feature-slice candidate for next MAJOR touch, following the P3 injection-surface convention (base
owns the `viewerMode` prop + extension context; feature module supplies the engagement/DM/owner/
comments/share implementation and carries the 3 composed-procomp deps out of base).

## Owners

| Finding | Severity (🚫/⚠️/🔸/🔹) | Owner target |
|---|---|---|
| `video-player` / `engagement-bar` / `comment-thread`'s `CommentComposer` statically imported (not `React.lazy`) despite being conditionally-mounted composed procomps | ⚠️ High | Next MINOR touch (v0.5.1) — wrap the 3 composed-procomp imports in `React.lazy` boundaries |
| Role-aware engagement layer (~23.6%+ LOC, already flag-gated per sub-piece) is a strong feature-slice candidate carrying all 3 composed-procomp deps | 🔹 Low (opportunity, not a defect) | Next MAJOR touch — extract as `story-viewer-engagement` feature-item per P3 injection-surface convention |
