# `content-card-news-01` v0.3.0 — Plan Addendum (Stage 2)

> **Stage:** 2 of 3 · **Status:** 🟡 Drafted, awaiting sign-off
> **Slug:** `content-card-news-01` (unchanged) · **Target version:** `0.3.0`
> **Depends on:** [content-card-news-01-procomp-description-v0.3.0.md](./content-card-news-01-procomp-description-v0.3.0.md) (GATE 1 ✅ signed off 2026-06-02 — all defaults + 2 user amendments: engagement-bar slot + related-articles-ribbon-01 sibling queued)
>
> This addendum is the **implementation contract** for v0.3.0 — *how* the description's 14 A+ traits land in code. The v0.1/v0.2 base plan ([content-card-news-01-procomp-plan.md](./content-card-news-01-procomp-plan.md)) carries unchanged; this file extends with the v0.3.0-specific commit chain, resolver semantics, file deltas, and risk register.

---

## 1. Q-P locks (v0.3.0-specific; v0.1/v0.2 Q-Ps carry unchanged)

| # | Lock | Source |
|---|---|---|
| **Q-P25** | `viewerMode?: "editor" \| "viewer"` two-mode toggle. No `"moderator"` value (slot-driven via `canModerate` + `moderatorActions(item)`). No auto-derivation from any identity source. `undefined` = v0.2 legacy mode (handler-driven kebab — but v0.2 has NO kebab today, so `undefined` means no kebab renders unless ANY of the new role-aware args is set). | GATE 1 Q-D1 + Q-D2 |
| **Q-P26** | Permissions resolver lives at `lib/permissions.ts`. Scoped to content-card-news-01. Cross-card lift to a shared `@/lib/permissions` is v0.4+; explicit pattern parallelism with post-card-01's `lib/permissions.ts` for now (two files, identical shape, different action enum). | parallelism w/ post-card-01 |
| **Q-P27** | Resolution order: `canPerformAction(action, item)` returning `true \| false` → `permissions[canX]` → `viewerMode`-derived defaults → legacy mode (no kebab). `canPerformAction` returning `undefined` falls through. Same shape as post-card-01. | GATE 1 §4 |
| **Q-P28** | `ContentCardMutationHandlers` interface flattened onto `ContentCardNews01Props` (not a nested prop bag). Same pattern as post-card-01's `PostMutationHandlers`. Editor-side (12) + reader-side (4) handlers in one interface. | parallelism w/ post-card-01 |
| **Q-P29** | `defaultContentCardKebabActions` helper is **new** (v0.2 ships no kebab). Single helper, dual-mode: when all 3 role-aware args undefined AND ≥1 engagement handler wired → minimal default kebab (Bookmark / Share / Copy link / Translate / Report). When ANY role-aware arg set → assembles role-aware items per the matrix. Exported sub-export for extend-not-replace. **Refinement (locked C3, 2026-06-02):** signature uses a single `DefaultContentCardKebabArgs` object arg instead of post-card-01's positional `(item, handlers, labels, viewerMode?, …)` — 8+ positional args are hard to call + adding new optional args breaks call sites. Object args follow the same shape as React component props and let future optional args land non-breakingly. post-card-01 may adopt the same pattern in a future bump for parallelism. | GATE 1 §5.1 |
| **Q-P30** | `NewsVisibility` is **extensible string union** with 5 base values: `"public" \| "members" \| "subscribers" \| "staff" \| "unlisted"` + `(string & {})` branded extension. Library renders default labels for the 5 base values via `DEFAULT_CONTENT_CARD_NEWS_LABELS`. Custom values get "Custom" fallback. Same pattern as `PostVisibility`. | GATE 1 §3.1 |
| **Q-P31** | `ContentStatus` is **closed enum** (`"draft" \| "scheduled" \| "published" \| "archived"`) — NOT extensible. Status drives editor-mode badge rendering; library must own the full set. Hosts with custom workflow states encode via `visibility` (which IS extensible). | GATE 1 Q-D10 + R-02 |
| **Q-P32** | `quotedArticle?: ContentCardItem` is recursive — recursion-strip applies: a quoted article's own `quotedArticle` field is ignored when rendering the inner card. Renders as `<ContentCardNews01 variant="medium" viewerMode={undefined} disableQuotedRender disableBadgesRender={false} actions={undefined}>` — the inner card suppresses nested actions/kebab and skips its own quoted-article. Mirrors post-card-01 `repostOf` Q-P30. | GATE 1 §1.3 + Q-D5 |
| **Q-P33** | `paywall` gate is **per-card**, not per-image. Gates `excerpt + media` (title + author byline + date still visible above the gate). When `paywall.preview` is set, renders the preview words inline above the gate; tap on CTA fires `onRevealPaywall(articleId)`. Library renders default CTA using `paywall.ctaLabel` + `paywall.ctaHref` per Q-D7=(a). **CTA element resolution:** when `paywall.ctaHref` set → renders as `<a href={ctaHref}>` (consumer can pass `linkComponent={NextLink}` to swap), `onClick` fires `onRevealPaywall` BEFORE navigation; when `ctaHref` not set → renders as `<button>` that fires `onRevealPaywall` only. | GATE 1 Q-D7 + Q-PG |
| **Q-P34** | `sensitivity` gate is **per-card** (gates media only — excerpt + title remain visible). Single reveal button fires `onRevealSensitive(articleId)` (analytics hook) + sets local `sensitiveRevealed=true`. Keyboard-operable. `prefers-reduced-motion` snap-reveal. Mirrors post-card-01 SensitiveGate Q-P33. | GATE 1 Q-PF |
| **Q-P35** | **Engagement model = light count chips by default + slot-driven full-bar composition.** `renderEngagementCounts` slot receives `(item, { handlers })` where `handlers = { onLike, onComment, onShare, onBookmark }` pre-wired. Consumers compose `<EngagementBar01>` via the slot on detail pages (§6.2 of description). `engagement-bar-01` is NOT a peer-dep of content-card-news-01. Data-shape on `ContentCardItem` matches engagement-bar-01's counts shape for drop-in composition. | GATE 1 Q-D6 + Q-D6b |
| **Q-P36** | Local-mirror pattern: `statefulItem` reflects all new optional fields + 2 local flags `paywallRevealed` + `sensitiveRevealed`. No realtime subscribe (Q-D6 = light counts). `reset(next)` clears both flags. `getCurrentItem()` returns the current mirror. | GATE 1 §1.5 |
| **Q-P37** | All new render parts that own DOM state are `"use client"` (`paywall-gate`, `sensitive-gate`, `quoted-article-card`, `engagement-counts`, `news-badges` if it owns dropdown state). Pure-render parts stay RSC-compatible: `news-author-byline`, `status-badge`, `visibility-badge`, `live-update-line`, `sponsor-badge`. | RSC layering project lock |
| **Q-P38** | All new touch-interactive elements (kebab trigger, engagement count chips, paywall CTA, sensitive reveal, badge chips with onClick) get min `h-11 w-11` (44×44 CSS px) per WCAG 2.5.5. Verified at GATE 3 visual sweep. | Q-PI |
| **Q-P39** | All new CSS transitions get `motion-reduce:transition-none` (paywall blur overlay + sensitive-gate opacity + quoted-card hover). | motion-safe project lock |
| **Q-P40** | **Library does NOT ship visibility / category / schedule pickers.** Each kebab item is a single trigger — `onChangeVisibility(articleId, currentVisibility)`, `onChangeCategory(articleId, currentCategory)`, `onSchedule(articleId, currentScheduledFor)`. Host opens its own picker UI wherever the host's UX wants it. Card renders read-only badges. Same lock as post-card-01 Q-P42. | GATE 1 Q-D4 |
| **Q-P41** | Per-variant feature matrix (description §7) is enforced at the **part level** — each variant part (`featured.tsx` / `large.tsx` / `medium.tsx` / `small.tsx` / `list.tsx`) explicitly opts in/out of rendering each new sub-feature. `small` renders only highest-priority badge per Q-PC. Renderers receive the FULL helper bag; gating is per-part composition. | Q-PA |
| **Q-P42** | Badge stack priority (Q-PC) is implemented in `parts/news-badges.tsx` via a fixed ordered render — first match wins for `small` variant; full stack renders for other variants. Order frozen: `isBreaking` → `isLive` → `isExclusive` → `isFeatured` → `isPinned` → `isSponsored` → `status` (editor mode only). | Q-PC |
| **Q-P43** | `author: string` field stays + new structured `authorEntity?: NewsArticleAuthor` field. When both set, `authorEntity` wins. Renderer falls back to `author` string. Same pattern for `date` → `publishedAt`. Soft-compat with v0.2.x consumers. | GATE 1 Q-D8 |
| **Q-P44** | Imperative handle exposes 11 methods (description §1.5). Handle methods bypass the permissions matrix — escape hatch for bulk-action UIs (e.g. "Publish all selected" in a CMS table). Renderers gate UI affordances; handle gates programmatic intent. | GATE 1 §1.5 |
| **Q-P45** | Live-update sub-line (`isLive === true` + `lastLiveUpdateAt` set) renders below the date in `featured` / `large` / `medium` / `list` variants. `small` skips per Q-D11. Uses `formatRelativeTime` for the timestamp. | Q-D11 |

---

## 2. Implementation order — main chain C1 → C12

Each commit lands on its own; `pnpm tsc --noEmit && pnpm lint && pnpm validate:meta-deps` must pass at every step. Smoke harness runs at **C12** (final). No prerequisite C0 (engagement-bar-01 stays untouched — composition is slot-driven, not built-in).

Per the "Audit systematic scope before committing sweep-wide fixes" memory, C11 (per-variant integration) runs a programmatic check across all 5 variant parts before committing.

| Commit | Scope | Files touched | Verification |
|---|---|---|---|
| **C1** | **Type additions** — All new types and interfaces. `ContentStatus` (closed enum) / `NewsVisibility` (extensible) / `NewsArticleAuthor` / `NewsPublisher` / `ContentSensitivity` / `ContentPaywall` / `ContentCardPermissionAction` (19 action discriminators: edit / delete / publish / unpublish / schedule / feature / pin / changeVisibility / changeCategory / markSensitive / seeAnalytics / pushToTop / share / bookmark / report / blockAuthor / muteAuthor / unfollowTopic / moderate) / `ContentCardPermissions` (19 capabilities: 12 editor-side + 2 host-policy + 4 reader-side + 1 moderator) / `ContentCardMutationHandlers` (16: 12 editor + 4 reader) / `ContentCardNews01Handle` (11 methods). Extend `ContentCardItem` with **31 new optional fields** (per description §3.1: slug, authorEntity, publisher, publishedAt, updatedAt, scheduledFor, status, visibility, topics, tags, language, availableTranslations, isPinned, isFeatured, isBreaking, isLive, isExclusive, isSponsored, sponsorLabel, liveUpdateCount, lastLiveUpdateAt, sensitivity, paywall, commentsEnabled, commentCount, likeCount, isLiked, bookmarkCount, isBookmarked, shareCount, quotedArticle). Extend `ContentCardNewsProps` with **~50 new optional props** (13 per-entity click handlers + 16 mutation handlers + 9 render slots incl. kebabActions/moderatorActions + 7 opt-outs + 3 role-aware args + ref + onComment alias). Extend `ContentCardNewsLabels` with **~49 new keys** per description §9 (22 kebab + 6 visibility + 3 status + 6 editorial badges + 4 paywall + 3 sensitive + 4 engagement + 1 live). Extend `DEFAULT_LABELS` with new defaults. Update `ResolvedPartProps` to carry all new resolved fields downstream. | `types.ts` only | tsc + lint clean |
| **C2** | **Permissions resolver** — `lib/permissions.ts` (`resolveContentCardPermissions` + `canPerformActionInternal` + `PERMISSION_DEFAULTS_BY_MODE` const). Pure, no React, no DOM. Hand-walked truth table (no Vitest — project lock). | `lib/permissions.ts` (new) | tsc + lint + hand-walked truth table |
| **C3** | **Default kebab helper** — `lib/defaults.tsx` new file. Implement `defaultContentCardKebabActions(item, handlers, viewerMode?, permissions?, canPerformAction?, mutationHandlers?, moderatorActions?, labels?)`. Dual-mode entry-branch per Q-P29. Returns `CommentMenuItem[]` (reuses shape from comment-thread-01 — same as post-card-01's kebab). Sub-export from `index.ts`. | `lib/defaults.tsx` (new) | tsc + lint |
| **C4** | **Local-mirror + handle** — extend `content-card-news-01.tsx` with `statefulItem` (mirrors `item`) + `paywallRevealed` + `sensitiveRevealed` local state. Add `useImperativeHandle` for 11 handle methods. Add `ref` to `ContentCardNewsProps`. | `content-card-news-01.tsx` | tsc + lint |
| **C5** | **News badges + status + sponsor + live** — `parts/news-badges.tsx` (RSC; ordered badge stack per Q-P42) + `parts/status-badge.tsx` (RSC; renders only in editor mode + when `status !== "published"`) + `parts/visibility-badge.tsx` (RSC) + `parts/sponsor-badge.tsx` (RSC) + `parts/live-update-line.tsx` (RSC; uses `formatRelativeTime`). 5 new parts; all RSC; all sub-exported. | 5 new `parts/*.tsx` + `index.ts` updates | tsc + lint + visual check |
| **C6** | **Author byline + publisher** — `parts/news-author-byline.tsx` (RSC; renders `authorEntity` with avatar + role + verified badge, falls back to `author` string per Q-P43) + `parts/news-publisher-row.tsx` (RSC; publisher logo + name + optional `onPublisherClick`). Sub-exported. | 2 new `parts/*.tsx` + `index.ts` updates | tsc + lint |
| **C7** | **Paywall gate** — `parts/news-paywall-gate.tsx` (`"use client"`; overlays excerpt + media when `paywall.isPaywalled`; renders `paywall.preview` words inline above the gate when set; CTA button per Q-P33). Wires `onRevealPaywall` + local `paywallRevealed` flip. Sub-exported as `NewsPaywallGate`. | 1 new `parts/*.tsx` + `index.ts` updates | tsc + lint + keyboard test |
| **C8** | **Sensitive content gate** — `parts/content-sensitive-gate.tsx` (`"use client"`; overlays media only when `sensitivity.isSensitive`; reveal button fires `onRevealSensitive` + local `sensitiveRevealed=true`; lists `contentWarnings[]` if set). Keyboard-operable. `prefers-reduced-motion` snap. Sub-exported as `ContentSensitiveGate`. | 1 new `parts/*.tsx` + `index.ts` updates | tsc + lint + keyboard + reduced-motion test |
| **C9** | **Quoted article mini-card** — `parts/quoted-article-card.tsx` (`"use client"`; recursively renders `<ContentCardNews01 variant="medium">` with the strip-options per Q-P32; `onClick` → `onQuotedClick` → fallback navigate). Recursion-strip helper. Renders in `medium` + `list` only per Q-PE. Sub-exported as `QuotedArticleCard`. | 1 new `parts/*.tsx` + `index.ts` updates + recursion-strip helper in `lib/` | tsc + lint + depth-2 fixture smoke (no infinite recursion) |
| **C10** | **Engagement counts** — `parts/news-engagement-counts.tsx` (`"use client"`; row of inline count chips: like/comment/bookmark/share each with optional handler + count display). When count = 0 OR handler missing AND count undefined, chip omitted. Hooks for `onCommentCountClick(articleId)` + `onLike(articleId, nextLiked)` + `onBookmark(articleId, nextBookmarked)` + `onShare(articleId)`. Sub-exported as `NewsEngagementCounts`. **This is the part that consumers replace via `renderEngagementCounts` slot when they want the full engagement-bar-01.** | 1 new `parts/*.tsx` + `index.ts` updates | tsc + lint + visual |
| **C11** | **Per-variant integration sweep** — wire the 9 new feature parts into 5 variant files (`parts/featured.tsx` / `large.tsx` / `medium.tsx` / `small.tsx` / `list.tsx`) per the Q-P41 feature matrix. Programmatic pre-scan: grep each variant for placeholder slots before integration. Verify Q-P38 touch-target standard (≥44px on all interactives) + Q-P39 reduced-motion classes. Kebab integration in this commit (every variant except `small` gets the dropdown trigger in the top-right corner). | 5 variant files + `content-card-news-01.tsx` (pass handlers + resolved permissions to parts) | tsc + lint + per-variant visual check at 320 / 768 / 1280 |
| **C12** | **Demo refresh + dummy-data + registry.json + meta bump** — rewrite `demo.tsx` with new tabs: `Editor mode` / `Paywall` / `Sensitive` / `Quoted article` / `Engagement counts` / `Detail (with engagement bar)` (new tab demonstrating the `renderEngagementCounts` slot composing `<EngagementBar01>`); preserve existing variant tabs. Extend `dummy-data.ts` with new field examples (paywalled article, sensitive article, sponsored article, live-blog article, scheduled article, quoted-article example). Update `registry.json` content-card-news-01 item with **9 new files** (5 parts from C5 + 1 from C6 + 1 from C7 + 1 from C8 + 1 from C9 + 1 from C10 + lib/permissions.ts + lib/defaults.tsx) plus `dropdown-menu` shadcn primitive in registryDependencies. Bump `meta.ts` version `0.2.0` → `0.3.0`. Add ~22 new features bullets. Refresh `description` + `context`. Update `dependencies.shadcn` to include `dropdown-menu`. Author guide.md additions. **Smoke harness path-b consumer-tsc smoke at the end** per F-cross-11. | `demo.tsx` + `dummy-data.ts` + `registry.json` (repo root) + `meta.ts` + `<slug>-procomp-guide.md` (extend) | Full smoke harness; tsc + lint + `pnpm validate:meta-deps` clean |

**Estimated commit count:** 12 ± 2. C1 + C2 + C11 are the load-bearing ones. C5–C10 are mostly mechanical part additions.

---

## 3. Resolver semantics — locked truth table

`resolveContentCardPermissions(viewerMode, permissions)`:

| `viewerMode` | `permissions` | Resulting `Required<ContentCardPermissions>` |
|---|---|---|
| `undefined` | `undefined` | (legacy mode — resolver NOT called; no kebab renders unless explicit `kebabActions` slot supplied) |
| `undefined` | `{ canX: ... }` | All fields default to **reader baseline** (editor-side `false`, reader-side `true`); explicit fields override. Promotes to role-aware mode despite `viewerMode` omitted. |
| `"editor"` | `undefined` | All editor-side `true` (canEdit / canDelete / canPublish / canUnpublish / canSchedule / canFeature / canPin / canChangeVisibility / canChangeCategory / canMarkSensitive / canSeeAnalytics / canPushToTop / canShare / canBookmark); all reader-side `false` (canReport / canBlockAuthor / canMuteAuthor / canUnfollowTopic). `canModerate` defaults `false` (orthogonal). |
| `"editor"` | `{ canDelete: false }` | Editor defaults + `canDelete: false`. |
| `"viewer"` | `undefined` | All editor-side `false`; all reader-side `true`; `canShare`, `canBookmark` `true` (host-policy gates default to allowed for reader). `canModerate` defaults `false`. |
| `"viewer"` | `{ canShare: false }` | Reader defaults + `canShare: false` (paywalled article that disallows share for non-subscribers). |

`canPerformAction?(action, item)`:

| Returns | Effect |
|---|---|
| `true` | Force-allow this action for this item (overrides matrix + mode). |
| `false` | Force-deny. |
| `undefined` | Fall through to `permissions[canX]` → mode-derived default → legacy (in that order). |

**Important:** `canPerformAction` is called **per action per render**. Host should memoize the callback identity. The pure resolver caches the matrix per `(viewerMode, permissions)` identity tuple via `useMemo` inside the card.

---

## 4. File structure delta (v0.2 → v0.3)

```
src/registry/components/data/content-card-news-01/
├── content-card-news-01.tsx              [edit — local-mirror, handle, kebab integration]
├── types.ts                              [edit — ~22 new fields, ~30 new props, ~45 new label keys, 11-method Handle]
├── dummy-data.ts                         [edit — add 6+ new fixture variants]
├── demo.tsx                              [edit — refresh tabs, add Editor/Paywall/Sensitive/Quoted/Engagement/Detail tabs]
├── meta.ts                               [edit — version 0.3.0, features list, shadcn deps +dropdown-menu]
├── usage.tsx                             [edit — document new features]
├── index.ts                              [edit — sub-exports for 9 new parts + lib helpers]
├── hooks/
│   └── use-relative-time.ts              [unchanged]
├── lib/
│   ├── format-default.ts                 [unchanged]
│   ├── permissions.ts                    [NEW — resolveContentCardPermissions]
│   └── defaults.tsx                      [NEW — defaultContentCardKebabActions + recursion-strip helper]
└── parts/
    ├── featured.tsx                      [edit — integrate new parts]
    ├── large.tsx                         [edit — integrate new parts]
    ├── medium.tsx                        [edit — integrate new parts]
    ├── small.tsx                         [edit — integrate new parts (highest-priority badge only, sensitive gate only)]
    ├── list.tsx                          [edit — integrate new parts]
    ├── news-badges.tsx                   [NEW — RSC, ordered badge stack]
    ├── status-badge.tsx                  [NEW — RSC]
    ├── visibility-badge.tsx              [NEW — RSC]
    ├── sponsor-badge.tsx                 [NEW — RSC]
    ├── live-update-line.tsx              [NEW — RSC]
    ├── news-author-byline.tsx            [NEW — RSC]
    ├── news-publisher-row.tsx            [NEW — RSC]
    ├── news-paywall-gate.tsx             [NEW — "use client"]
    ├── content-sensitive-gate.tsx        [NEW — "use client"]
    ├── quoted-article-card.tsx           [NEW — "use client", recursive]
    └── news-engagement-counts.tsx        [NEW — "use client"]
```

**New files:** 13 (2 in `lib/`, 11 in `parts/`).
**Edited files:** 12.
**Removed files:** 0.

---

## 5. Registry.json delta

Currently the content-card-news-01 item ships **9 files**. After v0.3.0:

- **Base item `content-card-news-01`:** add 13 new file entries (5 parts + 1 author + 1 publisher + 1 paywall + 1 sensitive + 1 quoted + 1 engagement + 2 lib). Total file count: **9 → 22**.
- **Fixtures item `content-card-news-01-fixtures`:** unchanged (just `dummy-data.ts` — gets a content refresh but not new files).
- **registryDependencies:** **unchanged** (engagement-bar-01 NOT added; composition is consumer-side via the slot per Q-P35).
- **dependencies.shadcn:** add `dropdown-menu` (kebab).

---

## 6. Backward compatibility verification plan

At C11 + C12 (before push), run the **drop-in test**:

```tsx
// Should render identically to v0.2.0 — zero visual diff
<ContentCardNews01
  item={{
    id: "1",
    title: "Earthquake-Resilient Standards Updated",
    image: "...",
    excerpt: "New regulations...",
    category: "Urban Development",
    author: "Prof. Dr. Ali Demir",
    date: "2026-05-08",
    readTime: 12,
    views: 3421,
  }}
  variant="medium"
  href="/news/123"
/>
```

Expected: identical render to v0.2.0. No kebab, no engagement chips, no badges, no gates. Verified visually at C11 in the existing demo tabs.

---

## 7. Risk register

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| **R-1** | Recursion explosion via `quotedArticle` | Med | Q-P32 recursion-strip + render-depth gating (only `medium`/`list` variants render quoted articles per Q-PE; inner card has `disableQuotedRender` baked in) |
| **R-2** | `CommentMenuItem` cross-procomp import (kebab item shape comes from comment-thread-01) | Low | Use F-S1 lock — RELATIVE path import to `../comment-thread-01/types` (not the barrel) to dodge shadcn 4.6.0's path-rewriter bug. Precedent: post-card-01 v0.3.1. |
| **R-3** | Backward compat — adding required Handle methods could break consumers using `ref` already | Low | v0.2 doesn't ship a Handle (no ref prop). Adding handle is purely additive. |
| **R-4** | Engagement count chip styling conflicting with the existing view-chip on `medium` variant | Med | C10 + C11 audit — view chip stays in its current position on `medium`; new engagement chips render in a separate kicker row below author/date. Confirmed via Q-PB lock. |
| **R-5** | Editor-mode status badge in `small` variant overcrowds the layout | Med | Q-PA matrix: `small` doesn't render status badge at all. `featured`/`large`/`medium`/`list` render it. |
| **R-6** | Paywall + sensitive both firing on the same item (rare but possible) | Low | Render order: paywall outer (gates excerpt + media), sensitive inner (gates media only — but media is already paywall-gated). Effective behavior: paywall wins UI-wise. Documented in guide.md. |
| **R-7** | shadcn DropdownMenu primitive Radix→Base UI divergence (F-cross-13) | Med | Apply the established defensive-callback pattern (don't pass divergent props; use direct trigger, not asChild). Precedent: engagement-bar-01 v0.3.2 + post-card-01 v0.3.x. |
| **R-8** | Smoke harness path-b consumer-tsc surfaces unknown F-cross-13 sub-traps in dropdown-menu OR other primitives we haven't shipped before in this slug | Med | Pre-deploy local smoke before push. If sub-traps surface, patch in v0.3.1 (established pattern: ship → smoke → patch → re-smoke clean — fourth consecutive ship under this pattern per `project_smoke_harness` memory). |
| **R-9** | Quoted-article card calling itself recursively could leak `actions` / `onClick` from the outer card | Low | Q-P32 explicit strip — recursion-strip helper at `lib/defaults.tsx` returns a pruned `ContentCardItem` + the inner card sets `actions={undefined}` + `viewerMode={undefined}` + `disableQuotedRender` to prevent further nesting. |
| **R-10** | `~22 new optional fields` on `ContentCardItem` could surprise users into making them required | Low | JSDoc on every new field explicitly states "optional" + soft-fail behavior. Demo tabs deliberately mix populated/absent fields to demonstrate. |

---

## 8. Verification gates (per commit + final)

Every commit:
- `pnpm tsc --noEmit` clean
- `pnpm lint` clean
- `pnpm validate:meta-deps` clean (after meta.ts is touched at C12; not blocking before)

At C12 (final pre-push):
- `pnpm build` clean (full Next.js production build)
- `pnpm registry:build` regenerates `public/r/content-card-news-01.json` artifact
- **Manual registry-roster audit** — diff `find src/registry/components/data/content-card-news-01` vs `registry.json files[]` to catch any missing-file blocker (per `project_registry_roster_manual_audit_pattern` memory — established 2026-05-30 from story-viewer-01 v0.4.3)
- Smoke harness `pnpm dlx shadcn add @ilinxa/content-card-news-01` in `e:/tmp/ilinxa-smoke-consumer/` + consumer-side `pnpm tsc --noEmit` (F-cross-11 path-b)
- Visual sweep at 320 / 360 / 414 / 768 / 1024 / 1280 / 1440 viewports across all 5 variants
- Backward compat drop-in test (§6)

GATE 3 (after final push):
- Author `docs/procomps/content-card-news-01-procomp/reviews/<YYYY-MM-DD>-v0.3.0-spotcheck.md`
- 4 fixed core dims (Planning docs / Registry distribution / Meta+manifest sync / Verification) + 1 rotating dim
- Rotating dim recommendation: **Public API** (the surface grew ~30 props; locked surface review highest-value)
- Verdict ≥ `Pass with follow-ups` to close

---

## 9. Out of scope for v0.3.0 (already locked in description §12)

Carried unchanged from description §12 — relatedArticles ribbon (queued as `related-articles-ribbon-01` sibling), multi-contributor render, translation switcher render, live-blog dedicated variant, full sponsor metadata, full engagement-bar built-in mode (now slot-driven), comment-thread embedding, bulk-action ribbon, drag-to-reorder, inline poll, inline link-preview, mention-text highlighting.

---

## 10. Estimated effort

| Phase | Estimate |
|---|---|
| C1 (types) | 45 min |
| C2 (resolver) | 30 min |
| C3 (default kebab helper) | 30 min |
| C4 (local-mirror + handle) | 30 min |
| C5 (badge + status + visibility + sponsor + live = 5 parts) | 60 min |
| C6 (author + publisher = 2 parts) | 30 min |
| C7 (paywall gate) | 45 min |
| C8 (sensitive gate) | 30 min (mostly mirrors post-card-01's part) |
| C9 (quoted article) | 45 min |
| C10 (engagement counts) | 30 min |
| C11 (per-variant integration sweep) | 90 min |
| C12 (demo + dummy + registry + meta + guide) | 90 min |
| GATE 3 review | 30 min |
| **TOTAL** | **~9.5h** (1 long focused day OR 2 normal days) |

---

## 11. Sign-off

Sign off here means:
- All 21 Q-Ps above (Q-P25 through Q-P45) confirmed
- Truth table in §3 accepted
- File structure delta in §4 accepted
- Risk register in §7 acknowledged
- Implementation may begin at C1 (`types.ts`)

> **Awaiting your sign-off.**

**Reviewer:** _(your name)_
**Date:** _(YYYY-MM-DD)_
**Sign-off:** _(e.g. "all locked, proceed" OR call out Q-P numbers to revise)_

---

*End of v0.3.0 plan addendum.*
