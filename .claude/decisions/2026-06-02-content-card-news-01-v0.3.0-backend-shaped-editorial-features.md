---
date: 2026-06-02
session: content-card-news-01-v0.3.0
phase: ship
type: minor-bump
components: [content-card-news-01]
findings:
  - F-01 (Med, v0.3.1): post-push smoke harness path-b consumer-tsc against new dropdown-menu primitive
  - F-02 (Low, v0.3.1): Live badge + LiveUpdateLine double pulsing dot
  - F-03 (Low, working as designed): featured byline soft-compat between authorEntity and string author
  - F-04 (Low, v0.4): openKebab handle method is a no-op stub
status: shipped (unpushed; awaits master push + Vercel deploy)
---

# content-card-news-01 v0.3.0 — backend-shaped editorial features

## Summary

v0.3.0 grows content-card-news-01 from a v0.2 magazine-card primitive into an A+ pro-component on par with post-card-01 v0.3.2. The trait set is mirrored from post-card-01 v0.2/v0.3 work and translated into editorial vocabulary (`editor` instead of `owner`; `publish/unpublish/feature` instead of `pin/markSensitive`; `paywall` distinct from `sensitive`).

**Strictly additive on v0.2.** Every v0.2.x consumer keeps working unchanged — all 31 new `ContentCardItem` fields + ~50 new `ContentCardNewsProps` + ~49 new label keys are optional. Drop-in test verified at GATE 3.

## What landed (14 A+ traits, 12-commit chain)

| # | Trait | Detail |
|---|---|---|
| 1 | Role-aware mode | `viewerMode: "editor" \| "viewer"` opt-in two-mode toggle, no auto-derivation |
| 2 | Permissions matrix | 19-capability `ContentCardPermissions` (12 editor + 2 host-policy + 4 reader + 1 moderator) |
| 3 | Universal predicate | `canPerformAction(action, item)` wins over matrix → mode → legacy |
| 4 | Moderator section | Orthogonal `canModerate` + `moderatorActions(item)` slot, divider-separated kebab group |
| 5 | Editor mutation handlers | 12 — Edit/Delete/Publish/Unpublish/Schedule/Feature/Pin/ChangeVisibility/ChangeCategory/MarkSensitive/SeeAnalytics/PushToTop |
| 6 | Reader mutation handlers | 4 — Report/BlockAuthor/MuteAuthor/UnfollowTopic |
| 7 | Kebab system | Default + role-aware + moderator section + `kebabActions(item)` full-takeover slot |
| 8 | Schema expansion | 31 new optional `ContentCardItem` fields including paywall/sensitivity/quotedArticle/publisher/authorEntity/status/visibility/editorial-badges/engagement-counts |
| 9 | Slot system | 9 render slots + 7 opt-outs + 11 sub-exports |
| 10 | Per-entity click handlers | 13 — onAuthorClick / onPublisherClick / onCategoryClick / onTopicClick / onTagClick / onQuotedClick / onCommentCountClick / onTranslate / onRevealPaywall / onRevealSensitive (+3 engagement) |
| 11 | Light engagement counts | like/comment/bookmark/share inline chips with bistate fill + handler-driven interactivity |
| 12 | Imperative handle | 11 methods (`openKebab` is a no-op stub — F-04 v0.4) |
| 13 | i18n labels | ~50 new keys, English defaults via `DEFAULT_LABELS` |
| 14 | Backward compat | Zero v0.2.x breakage; soft-compat `author` string + `date` field stay |

## Engagement-bar-01 integration pattern (user amendment)

`renderEngagementCounts` slot lets consumers compose `<EngagementBar01>` for the article detail page. Engagement data shape on `ContentCardItem` deliberately matches engagement-bar-01's counts shape — drop-in. `engagement-bar-01` is NOT a peer dep of content-card-news-01. Documented in guide.md and description §6.2.

## Sibling queued (user amendment)

`related-articles-ribbon-01` added to STATUS.md sibling queue. Consumers will stack it UNDER a news card on detail-page layouts, not inside the card. Out of v0.3.0 scope per user sign-off.

## Per-variant feature matrix (Q-PA)

Enforced at the part level — each variant explicitly opts in/out per the matrix:
- **featured** + **large**: full badge stack overlay, publisher row, kebab, paywall, sensitive, engagement counts, structured byline, live-update sub-line, clickable category
- **medium**: same as featured/large PLUS quoted-article mini-card
- **list**: same as medium (no publisher row; inline badge stack instead of overlay; sensitive gates excerpt since no image)
- **small**: ONLY highest-priority badge + sensitive gate + clickable category (no kebab/paywall/engagement/byline/quoted — too compact)

## Locks worth preserving (Q-Ps)

- **Q-P29 (refinement on plan, locked C3 2026-06-02):** `defaultContentCardKebabActions` uses a single `DefaultContentCardKebabArgs` object arg instead of post-card-01's positional `(item, handlers, labels, viewerMode?, …)`. 8+ positional args break call sites when new optional args are added. Object args follow React-component-props shape — non-breaking expansion. post-card-01 may adopt the same pattern in a future bump.
- **Q-P31:** `ContentStatus` is a CLOSED enum (draft/scheduled/published/archived). `NewsVisibility` is extensible — workflows with custom states encode there.
- **Q-P32:** Quoted article recursion-strip — inner card has `disableQuotedRender` baked in + `actions: undefined` + `viewerMode: undefined`. Pointer-events-none wrapper prevents inner interactivity competing with foreground click target.
- **Q-P33:** Paywall CTA renders as `<a href>` when `ctaHref` set (with `linkComponent` polymorphism), `<button>` otherwise. `onRevealPaywall` fires BEFORE navigation in both cases.
- **Q-P35:** Engagement model = light count chips DEFAULT + `renderEngagementCounts` slot for full-bar composition. Detail-page composition is consumer-side; no peer dep on engagement-bar-01.
- **Q-P40:** Library does NOT ship visibility / category / schedule pickers. Single-trigger callbacks.
- **Q-P42:** Badge stack priority frozen: Breaking → Live → Exclusive → Featured → Pinned → Sponsored → status (editor mode).
- **Q-P43:** `author` string + `date` field stay; structured `authorEntity` + `publishedAt` win when both set (soft-compat).

## Files (13 new, 12 edited, 0 removed)

**New:**
- `lib/permissions.ts` — pure resolver + truth table
- `lib/defaults.tsx` — dual-mode kebab helper + recursion-strip helper
- `parts/news-badges.tsx` — ordered badge stack
- `parts/status-badge.tsx` — editor-mode draft/scheduled/archived chip
- `parts/visibility-badge.tsx` — access-tier badge
- `parts/sponsor-badge.tsx` — Sponsored by X chip
- `parts/live-update-line.tsx` — Updated N ago · N updates sub-line
- `parts/news-author-byline.tsx` — structured byline with avatar/role/verified
- `parts/news-publisher-row.tsx` — publisher logo + name + click
- `parts/news-paywall-gate.tsx` — premium content gate
- `parts/content-sensitive-gate.tsx` — sensitive-content gate (media-only)
- `parts/quoted-article-card.tsx` — recursive nested mini-card
- `parts/news-engagement-counts.tsx` — light count chips row
- `parts/news-kebab.tsx` — shared kebab dropdown (used by 4 variants)

**Edited:**
- `types.ts` — 117 → 866 lines
- `content-card-news-01.tsx` — full rewrite with local-mirror + 11-method handle + kebab integration
- `parts/featured.tsx` + `parts/large.tsx` + `parts/medium.tsx` + `parts/list.tsx` + `parts/small.tsx` — per-variant integration sweep
- `index.ts` — 28 sub-exports (was 6)
- `meta.ts` — version bump + 45 features + dependency updates
- `dummy-data.ts` — 7 v0.3 fixture examples added
- `demo.tsx` — 5 new tabs (Editor mode / Paywall / Sensitive / Quoted / Engagement)
- `lib/format-default.ts` — `toDate` accepts `number` (epoch millis)
- `registry.json` — 10 → 24 files; registryDependencies expanded
- guide.md — v0.3.0 section appended with 8 usage patterns

## Verification — all gates green

- `pnpm tsc --noEmit` clean
- `pnpm lint` clean for content-card-news-01
- `pnpm validate:meta-deps` clean (no F-cross-07 drift)
- `pnpm registry:build` clean (24 files in artifact)
- Manual registry-roster audit clean (find vs registry diff = 0)
- `pnpm build` clean (59 static pages, content-card-news-01 detail page renders)
- Backward-compat drop-in test verified

## GATE 3 spotcheck verdict

✅ **Pass with follow-ups.** Review at [`docs/procomps/content-card-news-01-procomp/reviews/2026-06-02-v0.3.0-spotcheck.md`](../../docs/procomps/content-card-news-01-procomp/reviews/2026-06-02-v0.3.0-spotcheck.md). 4 findings (1 Med + 3 Low):
- F-01 (Med, v0.3.1) — post-push smoke harness path-b consumer-tsc against `dropdown-menu`. Expected next failure mode per `project_smoke_harness` + 4 consecutive prior ships. F-cross-13 defensive pattern already pre-wired in `parts/news-kebab.tsx`.
- F-02 (Low, v0.3.1) — Live badge + LiveUpdateLine double pulsing dot.
- F-03 (Low, working as designed) — featured byline soft-compat surface area.
- F-04 (Low, v0.4) — `openKebab` handle method is a no-op stub.

## Next steps

1. Push v0.3.0 to master.
2. Vercel auto-deploys; v0.3.0 becomes installable via `pnpm dlx shadcn@latest add @ilinxa/content-card-news-01`.
3. Run smoke harness path-b consumer-tsc against the deployed artifact.
4. If sub-traps surface (likely against `dropdown-menu` per F-cross-13 expectation), patch as v0.3.1 same-day per established `ship → smoke → patch → re-smoke clean` 4-ship pattern.
5. Land F-02 / F-04 in v0.3.1 sweep (or stay open as deferred).
6. (Future) `related-articles-ribbon-01` sibling — queued, no GATE 1 yet.
