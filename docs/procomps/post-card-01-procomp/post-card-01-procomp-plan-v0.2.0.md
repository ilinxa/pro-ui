# `post-card-01` v0.2.0 — Plan Addendum (Stage 2)

> **Stage:** 2 of 3 · **Status:** 🟡 Drafted, awaiting sign-off
> **Slug:** `post-card-01` (unchanged) · **Target version:** `0.2.0`
> **Depends on:** [post-card-01-procomp-description-v0.2.0.md](./post-card-01-procomp-description-v0.2.0.md) (GATE 1 ✅ signed off 2026-05-27)
>
> This addendum documents the **implementation contract** for v0.2.0 — *how* the description's six buckets land in code. The v0.1.1 base plan ([post-card-01-procomp-plan.md](./post-card-01-procomp-plan.md)) carries unchanged; this file extends with the v0.2.0-specific commit chain, type additions, resolver semantics, and risk register.

---

## 1. Q-P locks (v0.2.0-specific; v0.1 Q-Ps 1–24 carry unchanged)

| # | Lock | Source |
|---|---|---|
| **Q-P25** | `viewerMode?: "owner" \| "viewer"` two-mode toggle. No `"moderator"` value (slot-driven). No auto-derivation. `undefined` = v0.1 legacy mode (handler-driven kebab). | GATE 1 Q-D1 |
| **Q-P26** | Permissions resolver lives at `lib/permissions.ts`. Scoped to post-card-01. Cross-card lift is v0.3+. | GATE 1 Q-D2 |
| **Q-P27** | Resolution order: `canPerformAction(action, post)` returning `true \| false` → `permissions[canX]` → `viewerMode`-derived defaults → legacy mode. `canPerformAction` returning `undefined` falls through to the next layer. | GATE 1 Q-D2 + dynamicity-primacy memory |
| **Q-P28** | `PostMutationHandlers` is a **separate interface** flattened onto `PostCard01Props` (not a nested prop bag). Same pattern as v0.1's `PostHandlers extends PostCard01Props`. | F-2 closure |
| **Q-P29** | `defaultPostKebabActions` signature extended with optional trailing args (`viewerMode?`, `permissions?`, `canPerformAction?`, `mutationHandlers?`). Old v0.1 call sites compile unchanged. Single helper, not 3. | GATE 1 Q-D9 |
| **Q-P30** | Nested `repostOf` mini-card renders as `<PostCard01 variant="compact" engagementMode="navigate" viewerMode="viewer" engagementActions={() => []}>` — the explicit empty array suppresses the engagement bar entirely (engagement-bar-01.tsx:106 short-circuits `if (actions.length === 0) return null`). Result: counts-only meta row inside the nested compact card. Tap navigates via `getHref(repostOf)`. Default `onRepostOfClick` calls `getHref` when wired. F-Plan-1 closure. | GATE 1 Q-D3 |
| **Q-P31** | `linkPreview` is fully host-supplied. Library renders only; no fetch transport. `linkPreviewFetcher` is NOT shipped. | GATE 1 Q-D4 |
| **Q-P32** | Poll vote is **optimistic**. Local mirror gains `pollVote: { optionId, votedAt } \| null`. `onVotePoll(postId, optionId)` fires after optimistic flip; host can reject by calling `ref.current.reset(originalPost)`. | GATE 1 Q-D5 |
| **Q-P33** | Sensitive-media gate is **per-post**, not per-`MediaItem`. Single reveal button covers the entire carousel. Gate state lives in the card; `onRevealSensitive(postId)` fires when tapped (analytics hook). | GATE 1 Q-D6 |
| **Q-P34** | Demo refresh strategy: rewrite 9 existing tabs in-place + add 3 new tabs (Repost / Poll / Sensitive). Single responsive tab strip; 12 tabs total. Library API stays backwards-compat. | GATE 1 Q-D7 |
| **Q-P35** | F-01 closure: smoke harness gains consumer-side `pnpm tsc --noEmit` after `pnpm dlx shadcn add @ilinxa/post-card-01`. Convention doc is OPTIONAL secondary; the lint is the load-bearing fix. | GATE 1 Q-D8 |
| **Q-P36** | `post-editor-01` GATE 1 description is **sequenced after** this card's GATE 3 closure. Editor depends on the final v0.2.0 `Post` schema; no parallel authoring to prevent schema thrashing. | GATE 1 Q-D10 |
| **Q-P37** | `engagement-bar-01` sub-export extraction (LikersStrip + ShareMenu) **BLOCKS** post-card-01 v0.2.0. engagement-bar-01 ships v0.1.2 → v0.2.0 first (minor bump — additive public API; GATE 3 spotcheck required per the readiness-review rule). Then post-card-01 v0.2.0 implementation begins at C1 with cross-folder imports already in place. The two files (`likers-strip.tsx` + `share-menu.tsx`) move from `post-card-01/parts/` → `engagement-bar-01/parts/` during the engagement-bar GATE work. | F-3 closure + user lock Q-P37=(a) |
| **Q-P38** | All new render parts that own DOM state are `"use client"` (`sensitive-gate`, `link-preview-card`, `poll-widget`, `repost-of-card`). Pure-render parts are RSC-compatible: `pinned-badge`, `visibility-badge`, `mention-text`. | RSC layering project lock |
| **Q-P39** | Local-mirror pattern carries: `statefulPost` reflects all 12 new optional fields. Engagement-subscribe deltas don't carry poll/sensitive/visibility deltas (out of scope per F-13). | R-Plan-1 carries |
| **Q-P40** | All new touch-interactive elements (poll buttons, sensitive gate, mention chips, tag chips) get min `h-11 w-11` (44×44 CSS px) per WCAG 2.5.5. Verified via the visual sweep + an audit pass at GATE 3. | Bucket B success criterion |
| **Q-P41** | All new CSS transitions get `motion-reduce:transition-none` (poll bar fill + sensitive-gate opacity + likers-strip drag). `motion-reduce:hover:*` overrides where needed. | F-17 closure |
| **Q-P42** | **Library does NOT ship a visibility picker UI.** The kebab "Change visibility" item is a single trigger that fires `onChangeVisibility(postId, currentVisibility)` — host opens its own picker (banner / sheet / dialog / inline control) wherever the host's UX wants it. Card renders only the visibility badge (read-only). Lightest possible library footprint. | User lock Q-P42 |
| **Q-P43** | `PostVisibility` is a **Facebook-style extensible string union** with 6 known base values: `"public" \| "followers" \| "friends" \| "circle" \| "only-me" \| "private"` + `(string & {})` branded extension. Library renders default labels + icons for the 6 base values via `DEFAULT_POST_CARD_LABELS`. Custom string values (e.g. `"specific-friends"`, `"list:close-friends"`, `"everyone-except-bob"`) get a fallback "Custom" label + a configurable icon via `labels.customVisibilityIcon`. Granular cases (Facebook-style "Friends except…" or "Specific friends only") are encoded by the host as their own string keys; library doesn't model the granularity directly. | User lock Q-P43 |

---

## 2. Implementation order (prerequisite C0 + main chain C1 → C12)

Each commit lands on its own; `pnpm tsc --noEmit && pnpm lint && pnpm validate:meta-deps` must pass at every step. **Smoke harness runs at C0 (engagement-bar slug) + C12 (post-card slug)**. Per the "Audit systematic scope before committing sweep-wide fixes" memory, the responsive sweep at C10 runs a programmatic class-name scan first.

### C0 — engagement-bar-01 v0.2.0 prerequisite ship (separate procomp's GATE work)

Per Q-P37 lock, this **must land before C1 of post-card-01 v0.2.0 begins**. It's a separate procomp's cycle with its own GATE 1/2/3, tracked in [`docs/procomps/engagement-bar-01-procomp/`](../engagement-bar-01-procomp/) (separate addendum docs to be authored next).

| Step | Scope | Files touched | Verification |
|---|---|---|---|
| C0-G1 | Author engagement-bar-01 v0.2.0 description addendum — minor bump (additive public API: 2 new sub-exports + 2 new prop type re-exports + 0 behavior changes). Patch-bump exemption does NOT apply (public-API touch). | `docs/procomps/engagement-bar-01-procomp/engagement-bar-01-procomp-description-v0.2.0.md` (new) | User sign-off |
| C0-G2 | Author engagement-bar-01 v0.2.0 plan addendum — short, ~3 commits internal to that slug. | `docs/procomps/engagement-bar-01-procomp/engagement-bar-01-procomp-plan-v0.2.0.md` (new) | User sign-off |
| C0-1 | Move `post-card-01/parts/likers-strip.tsx` → `engagement-bar-01/parts/likers-strip.tsx`; move `post-card-01/parts/share-menu.tsx` → `engagement-bar-01/parts/share-menu.tsx`. Update imports in post-card-01 to use `@/registry/components/data/engagement-bar-01`. (Producer-side only — post-card-01 v0.1.1 keeps working during this transition.) | 2 files moved + 2 import-line edits in post-card-01 | tsc + lint clean |
| C0-2 | Add sub-exports + type exports to `engagement-bar-01/index.ts`: `LikersStrip`, `LikersStripProps`, `ShareMenu`, `ShareMenuProps`. Update `engagement-bar-01/meta.ts` features list + bump version `0.1.2` → `0.2.0` + `updatedAt`. Update `registry.json` engagement-bar-01 item with the 2 new files. | `engagement-bar-01/index.ts` + `meta.ts` + `registry.json` | tsc + lint + `pnpm validate:meta-deps` clean |
| C0-3 | Smoke harness run for both slugs (engagement-bar-01 + post-card-01) — verify consumer install resolves both + tsc-passes both post-install. | Smoke run only (no source) | Smoke clean |
| C0-GATE 3 | engagement-bar-01 v0.2.0 spotcheck — fixed core (Dim 1/9/10/12) + rotating dim Public API (the additive surface). Author review file at `docs/procomps/engagement-bar-01-procomp/reviews/<date>-v0.2.0-spotcheck.md`. Verdict must be `Pass` or `Pass with follow-ups` before C1 begins. | 1 review file | Verdict ≥ Pass with follow-ups |

**Estimated C0 time:** ~2–3h end-to-end (description ~30min + plan ~20min + implementation ~45min + smoke ~15min + spotcheck ~30min). Once C0-GATE 3 closes, the C1–C12 chain begins below.

### C1 → C12 — post-card-01 v0.2.0 main chain

| Commit | Scope | Files touched | Verification |
|---|---|---|---|
| **C1** | **Type additions** — `PostViewerMode` / `PostPermissions` / `PostPermissionAction` / `PostMutationHandlers` / `PostVisibility` (Facebook-style extensible string union, 6 base values + branded extension per Q-P43) / 12 new optional `Post` fields / `PostPoll` + `PostPollOption` / `PostMention` / `PostLocation` / `PostReplyTo` / `LinkPreview` / updated `PostCard01Props` (8 new render-handler props + 5 new imperative handle methods on `PostCard01Handle`). `onChangeVisibility` signature locked at `(postId: string, currentVisibility: PostVisibility \| undefined) => void` per Q-P42 (no library picker UI). **Per engagement-bar-01 v0.2.0 Q-EB-1:** add `@deprecated` alias `export type PostLikeUser = EngagementLikerProfile;` (the `EngagementLikerProfile` type lives in engagement-bar-01/types.ts post-C0; imported cross-folder here). JSDoc: `@deprecated Use EngagementLikerProfile from @ilinxa/engagement-bar-01 instead.`. Preserves zero-breakage promise for any v0.1 consumer that imported `PostLikeUser` directly. | `types.ts` only | tsc + lint clean |
| **C2** | **Permissions resolver** — `lib/permissions.ts` (`resolvePostPermissions` + `canPerformActionInternal` + `PERMISSION_DEFAULTS_BY_MODE` const). Pure, no React, no DOM. Refactor `defaultPostKebabActions` to **dual-mode**: when `viewerMode === undefined && permissions === undefined && canPerformAction === undefined`, the helper takes the exact v0.1 handler-driven code path (resolver NOT called — zero behavior drift for v0.1 consumers). When ANY of the three role-aware args is set, the helper calls the resolver + assembles role-aware items per the matrix. Same function, branch at entry. F-Plan-3 closure. | `lib/permissions.ts` (new), `lib/defaults.tsx` (extended) | tsc + lint + hand-walked truth table covering 6 combinations (no Vitest per project lock) |
| **C3** | **Local-mirror extensions** — `post-card-01.tsx` `statefulPost` already mirrors `Post`; add `pollVote` local state + `sensitiveRevealed` local state. Add `triggerEdit` / `triggerDelete` / `triggerPin` / `revealSensitive` / `votePoll` to imperative handle. | `post-card-01.tsx` | tsc + lint |
| **C4** | **PostHeader extensions** — Pinned-badge bubble (above header), visibility-badge icon (next to timestamp), "(edited)" suffix after timestamp, replyTo "Replying to @x" sub-header line, location chip after timestamp. Header truncation discipline applied per description §2.1-B (closes F-11). | `parts/post-header.tsx` + 3 new parts: `parts/pinned-badge.tsx` (RSC) + `parts/visibility-badge.tsx` (RSC) + `parts/edited-suffix.tsx` (RSC) | tsc + lint + visual check at 320 / 768 / 1280 viewports |
| **C5** | **Content-body extensions** — `parts/mention-text.tsx` (RSC; sub-exported from `index.ts`; renders content with clickable `@mention` spans via the `mentions` range array) + `parts/tag-chips.tsx` (RSC; clickable chip row). **Default `renderContent` stays unchanged** (`<ExpandableText01 content={post.content}>`) — `<ExpandableText01>`'s `content: string` API cannot accept JSX-span output, so inline mention highlighting requires a host-supplied `renderContent={(p) => <MentionText content={p.content} mentions={p.mentions} onMentionClick={onMentionClick} />}` override (opt-in). **Tag chips render as a SEPARATE sibling row** below the content body (NOT inside ExpandableText01's clamping) — automatic when `post.tags?.length > 0`. Documents the tradeoff in the guide. F-Plan-7 closure. | 2 new parts + 1 sibling render addition in 4 variants | tsc + lint |
| **C6** | **Sensitive-media gate** — `parts/sensitive-gate.tsx` (`"use client"`; overlays the media block when `post.isSensitive`; reveal button fires `onRevealSensitive` + sets local `sensitiveRevealed=true`). Keyboard-operable. `prefers-reduced-motion` snap-reveal. Wires into all 4 variants' media render path. | 1 new part + edits to 4 variant parts | tsc + lint + visual + keyboard test |
| **C7** | **Link-preview card** — `parts/link-preview-card.tsx` (`"use client"`; OG card render below content + above media; `<a>` wrap with `onLinkPreviewClick` override). 4-variant integration (renders only in feed + detail; compact + list skip per description §1.3). | 1 new part + edits to 2 variant parts | tsc + lint |
| **C8** | **Repost mini-card** — `parts/repost-of-card.tsx` (`"use client"`; nests `<PostCard01 variant="compact" engagementMode="navigate" viewerMode="viewer" engagementActions={() => []}>` — the empty-array slot suppresses the engagement bar per Q-P30; `onClick` → `onRepostOfClick` override → `getHref(repostOf)` default; strips inner `repostOf` from nested `Post` to prevent recursion). Renders in feed + detail only. | 1 new part + edits to 2 variant parts + recursion-strip helper | tsc + lint + depth-3 fixture smoke |
| **C9** | **Poll widget** — `parts/poll-widget.tsx` (`"use client"`; viewer view = vote buttons, owner view = live results bar chart with width transition + `motion-reduce:transition-none`; closes-at countdown via `formatRelativeTime`). Wires `onVotePoll` optimistic flow into local-mirror. | 1 new part + edits to 2 variant parts + small `post-card-01.tsx` local-mirror addition | tsc + lint + visual |
| **C10** | **Responsive sweep** — apply description §2.1-B step rules across all 4 variants + `post-header.tsx` + `likers-strip.tsx`. Run a programmatic scan FIRST: grep all `p-\d`/`text-(xs\|sm\|base\|lg)`/`h-\d \|w-\d` strings under `parts/`, audit each against the step table. Touch targets ≥44×44 verified. Header truncation discipline confirmed. | All 4 variant parts + `parts/post-header.tsx` + `parts/likers-strip.tsx` | tsc + lint + visual sweep at 320 / 360 / 414 / 768 / 1024 / 1280 / 1440 |
| **C11** | **Kebab role-aware rendering** — wire `defaultPostKebabActions` extended signature into `post-card-01.tsx` (replaces the explicit kebab construction in current `kebabItems` useMemo). Visibility item is a **single trigger** that fires `onChangeVisibility(postId, currentVisibility)` per Q-P42 — host opens its own picker (no library `DropdownMenuSub` / `Dialog`). New `commentMenuItem`-style entries for Edit / Delete / Pin / Change visibility (trigger only) / Mark sensitive / Block author / Mute author. v0.1 legacy mode still works when all 3 new args omitted. | `post-card-01.tsx` + `lib/defaults.tsx` + new labels in `types.ts` `DEFAULT_POST_CARD_LABELS` | tsc + lint + manual kebab walkthrough in owner / viewer / legacy modes |
| **C12** | **Demo refresh** + **registry.json update** + **F-01 closure** — rewrite `demo.tsx` per Q-D7 lock (9 tabs refreshed in-place + 3 new tabs Repost/Poll/Sensitive); update `dummy-data.ts` with new field examples (pinned post, sensitive post, post with poll, post with repostOf, post with linkPreview, post with replyTo); update `registry.json` `post-card-01` item — add 9 new files (C4–C9 parts + C2 lib) + remove `likers-strip.tsx` / `share-menu.tsx` entries (those moved to engagement-bar-01 at C0) + update `registryDependencies` to import LikersStrip/ShareMenu cross-folder; extend smoke harness with consumer-side `pnpm tsc --noEmit` per Q-P35; bump `meta.ts` version `0.1.1` → `0.2.0`. | `demo.tsx` + `dummy-data.ts` + `registry.json` (repo root) + `meta.ts` + smoke harness | Full smoke harness run including consumer-tsc; tsc + lint clean; `pnpm validate:meta-deps` clean |

**Estimated commit count:** 12 ± 2. C2 + C10 + C11 are the load-bearing ones; the others are mechanical part additions.

---

## 3. Resolver semantics (locked truth table)

`resolvePostPermissions(viewerMode, permissions)`:

| `viewerMode` | `permissions` | Resulting `Required<PostPermissions>` |
|---|---|---|
| `undefined` | `undefined` | (legacy mode — resolver NOT called; kebab uses v0.1 handler-driven path) |
| `undefined` | `{ canX: ... }` | All fields default to **viewer baseline** (owner-side `false`, viewer-side `true`); explicit fields override. Promotes to role-aware mode despite `viewerMode` omitted. |
| `"owner"` | `undefined` | All owner-side `true` (canEdit/canDelete/canPin/canChangeVisibility/canMarkSensitive/canSeeAnalytics/canShare/canBookmark); all viewer-side `false` (canReport/canBlockAuthor/canMuteAuthor). |
| `"owner"` | `{ canDelete: false }` | Owner defaults + `canDelete: false`. |
| `"viewer"` | `undefined` | All owner-side `false`; all viewer-side `true`; `canShare`, `canBookmark` `true` (host-policy gates default to allowed for viewer). |
| `"viewer"` | `{ canShare: false }` | Viewer defaults + `canShare: false` (private posts that disallow share). |

`canPerformAction?(action, post)`:

| Returns | Effect |
|---|---|
| `true` | Force-allow this action for this post (overrides matrix + mode). |
| `false` | Force-deny. |
| `undefined` | Fall through to `permissions[canX]` → mode-derived default → legacy (in that order). |

**Important:** `canPerformAction` is called **per action per render** (cheap — host should memoize the callback identity). The pure resolver caches the matrix per `(viewerMode, permissions)` identity tuple via `useMemo` inside the card.

---

## 4. Files added / modified summary

### Added (new files under `src/registry/components/data/post-card-01/`)

```
lib/
  permissions.ts                # resolver + truth-table defaults (C2)
parts/
  pinned-badge.tsx              # RSC (C4)
  visibility-badge.tsx          # RSC (C4)
  edited-suffix.tsx             # RSC (C4)
  mention-text.tsx              # RSC (C5)
  tag-chips.tsx                 # RSC (C5)
  sensitive-gate.tsx            # client (C6)
  link-preview-card.tsx         # client (C7)
  repost-of-card.tsx            # client (C8)
  poll-widget.tsx               # client (C9)
```

10 new files. RSC : client = 5 : 5 (balanced; RSC-compatible parts where possible per project lock).

### Removed (during C0 prerequisite per Q-P37=(a))

```
parts/
  likers-strip.tsx              # MOVED to engagement-bar-01/parts/ at C0-1
  share-menu.tsx                # MOVED to engagement-bar-01/parts/ at C0-1
```

After C0, post-card-01 imports these cross-folder via `@/registry/components/data/engagement-bar-01`.

### Modified

```
types.ts                        # C1 + C11 labels
post-card-01.tsx                # C3 (mirror + handle) + C9 (poll) + C11 (kebab wiring)
lib/defaults.tsx                # C2 (extended defaultPostKebabActions)
parts/post-header.tsx           # C4 (badges + truncation) + C10 (responsive)
parts/feed-variant.tsx          # C6, C7, C8, C9, C10
parts/compact-variant.tsx       # C4 (header badges only) + C10
parts/list-variant.tsx          # C4 (header badges only) + C10
parts/detail-variant.tsx        # C6, C7, C8, C9, C10
parts/likers-strip.tsx          # C10 (responsive)
demo.tsx                        # C12 (full rewrite per Q-D7)
dummy-data.ts                   # C12 (new field examples)
meta.ts                         # C12 (version + features list)
```

### External (NOT in this slug, but coordinated)

```
registry.json (repo root)       # C0-2 (engagement-bar additions) + C12 (post-card-01 changes)
scripts/smoke-harness/*.mjs     # C12 — consumer-tsc step (F-cross-11 path-b)
docs/procomps/post-card-01-procomp/post-card-01-procomp-guide.md  # C12 — v0.2.0 sections (permissions toggle, schema, poll, sensitive, repost)
```

`engagement-bar-01` IS touched by this plan at C0 (Q-P37=(a)): two files move in + index.ts gets 2 sub-exports + meta version bump. That work is owned by engagement-bar-01's own GATE 1/2/3 cycle (separate addendum docs), but it blocks C1.

---

## 5. Backwards-compatibility verification matrix (zero-breakage proof)

For every existing v0.1.x demo tab + every v0.1.x prop pattern, expected behavior at v0.2.0 with **zero source modification**:

| v0.1 pattern | v0.2.0 behavior | Verification |
|---|---|---|
| `<PostCard01 variant="feed" post={p} onLike={fn} />` | Identical render. No `viewerMode` → legacy mode. Kebab is empty (no handler wired for the legacy items). | Renders feed-variant tab with no kebab. ✓ |
| `<PostCard01 variant="feed" post={p} onLike={fn} onBookmark={fn} onShare={fn} onReport={fn} />` | Identical render to v0.1 — Bookmark / Share / Report kebab items, in that order. Legacy mode (no `viewerMode` set). | Kebab shows 3 items. ✓ |
| `<PostCard01 variant="list" kebabActions={(p) => [Pin, TakeDown]} />` | Full takeover unchanged. Slot wins. | Moderator pattern works. ✓ |
| `<PostCard01 variant="detail" engagementSubscribe={s} commentSubscribe={c} />` | Identical. New `pollSubscribe` is NOT added; existing channels carry. | Realtime works. ✓ |
| `<PostCard01 ref={r} />` + `r.current.triggerLike()` | Identical. New handle methods are additions, not replacements. | Imperative API works. ✓ |
| `engagementActions={(p, h, v) => [...defaultPostEngagementActions(p, h, v), customAction]}` | Identical. Helper signature unchanged. | Slot extension works. ✓ |
| `defaultPostKebabActions(post, handlers, labels)` (called externally) | Identical. New trailing args are optional. | Direct helper call works. ✓ |

Every v0.1.1 demo tab compiles and renders identically. **Documented as success criterion §6.11**.

---

## 6. Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| **C10 responsive sweep breaks a v0.1 visual baseline** (e.g., `w-32` → `w-20 sm:w-28 md:w-32 lg:w-40` changes the desktop appearance of the List variant if the lg-breakpoint isn't perfectly tuned) | Medium | Visual sweep at 7 viewports BEFORE commit; rollback per-variant if any baseline drift; lg-step preserves v0.1's `w-32` value exactly. |
| **Q-P32 optimistic poll vote desyncs on rapid double-tap** | Low | Local mirror guards via `pollVote !== null` check before calling `onVotePoll`; second tap = no-op. Documented in plan §3. |
| **Engagement-bar-01 v0.2.0 ship (C0 prerequisite) delays the main chain** | Medium | Per Q-P37=(a) lock, this IS the chosen path. Mitigation: C0 is scoped tight (~2–3h end-to-end; mechanical file moves + no behavior change). If C0 surfaces unexpected complexity (e.g., naming conflict, unrelated lint breakage), abort + fall back to v0.2.1-deferred extraction with user approval. |
| **engagement-bar-01 v0.2.0 GATE 3 surfaces a Blocker** | Low | Spotcheck on a 2-file additive ship has very narrow surface. Worst case is naming-conflict in `engagement-bar-01/index.ts` (already-exported `LikersStrip` name) — pre-checked at C0-G1 description draft. |
| **C11 kebab visibility-item rendering** introduces no Radix submenu/Dialog | Low | Per Q-P42 lock, the picker is host-side. Single-item kebab trigger uses existing `DropdownMenuItem` (no F-cross-13 surface area beyond v0.1 baseline). |
| **`canPerformAction` callback identity churn** (host re-creates per render) **forces full re-render of every kebab item** | Low | Document the `useCallback` requirement in the guide (consumer responsibility); resolver caches matrix by `(viewerMode, permissions)` identity tuple — `canPerformAction` only invalidates the per-action lookup, not the cached matrix. |
| **12 new optional `Post` fields breaks consumer's `Post`-typed API client** (theirs is narrower than ours) | Very Low | All fields optional; consumer's `Post` is a structural subtype. TS structural typing handles it. Smoke harness catches any type-narrowing issue. |
| **C9 poll widget bar-fill transition jank on mobile** | Low | `transition-[width] duration-300 motion-reduce:transition-none`; transform-based fallback documented in source comments. |
| **Sensitive-gate keyboard handler doesn't trap focus correctly** | Low | Use `<button>` element (not `<div role="button">`); `Enter` / `Space` fire natively. No focus trap needed (gate dismisses, focus moves to revealed media). |
| **Repost mini-card recursive `repostOf` (a repost of a repost) infinite-renders** | Medium | C8 explicitly forces `viewerMode="viewer" engagementMode="navigate"` on nested + does NOT pass `repostOf` recursively into the nested `Post` (strips it via prop transform). Documented; smoke-tested with a depth-3 fixture. |
| **F-01 (cross-folder-import) blocks Q-P35 smoke harness extension** | Medium | C12 lands the consumer-tsc step. If it surfaces a broken import path, that's a FIX-FIRST blocker — GATE 3 doesn't sign off until the smoke is green. |

---

## 7. Testing strategy (informed-defer per project lock)

**No Vitest in v0.2.0.** Per project memory + STATUS.md, automated test coverage is an informed-defer at every tier — the readiness review (GATE 3 spotcheck) is procedural rigor instead.

Verification at C-by-C level:
- **tsc clean** at every commit
- **lint clean** at every commit
- **`pnpm validate:meta-deps` clean** at C12
- **Visual sweep** at C4, C6, C7, C8, C9, C10, C11, C12 at 4 viewports minimum (360 / 768 / 1024 / 1440)
- **Keyboard sweep** at C6, C11 (sensitive-gate reveal + kebab item navigation)
- **Smoke harness** at C12 (single run; full surface)

GATE 3 spotcheck template: [`docs/reviews/templates/review-spotcheck.md`](../../reviews/templates/review-spotcheck.md). Fixed core (4 dims) + rotating dim — likely **Public API** given the scope, or **Composition integrity** given the 7 new render parts.

---

## 8. Pre-emptive locks (carry from v0.1 + project)

- **`"use client"` only where needed.** RSC-compatible parts stay RSC-compatible (`pinned-badge` / `visibility-badge` / `edited-suffix` / `mention-text` / `tag-chips`).
- **No framer-motion.** All new motion is CSS keyframes + `transition-*` + `motion-reduce:transition-none`.
- **No new shadcn primitives beyond v0.1.1.** Already pulled: `avatar` / `button` / `dropdown-menu` / `input`. Per Q-P42 lock, no `DropdownMenuSub` or `Dialog` for visibility picker (host-side UI); the kebab uses only the existing `DropdownMenuItem` primitive.
- **Tailwind v4 translations at write-time.** `bg-gradient-to-*` → `bg-linear-to-*`, `break-words` → `wrap-break-word`, `grayscale-[N%]` → `grayscale-N`.
- **Locked target convention** for `registry.json`: every file `type: "registry:component"`, `target: "components/post-card-01/<sub>"`. No `demo.tsx` / `usage.tsx` / `meta.ts` shipped. `dummy-data.ts` ships only via `-fixtures` sibling.
- **`React.memo` at export + ref-as-prop.** Unchanged.
- **Local-mirror state pattern.** Unchanged. New mirror fields (`pollVote`, `sensitiveRevealed`) live alongside the existing `statefulPost`.
- **Always-uncontrolled.** `post` prop is mount-only. `reset(next)` rebuilds the mirror including new fields transparently.
- **GATE 3 required** (public-API-touching minor bump). Patch-bump exemption does NOT apply.

---

## 9. Implementation sequence summary

```
C0  engagement-bar-01 v0.2.0 prerequisite ship:
    C0-G1 + C0-G2 (description + plan)                            → user sign-off
    C0-1 file moves (likers-strip + share-menu)                   → tsc + lint
    C0-2 sub-exports + meta + registry.json                       → tsc + lint + validate-meta-deps
    C0-3 dual-slug smoke                                          → smoke clean
    C0-GATE 3 spotcheck                                           → verdict ≥ Pass-with-follow-ups

[CHECKPOINT: C0 closed → C1 begins]

C1  types.ts                                                      → tsc + lint
C2  lib/permissions.ts + lib/defaults.tsx (extend signature)      → tsc + lint + truth-table audit
C3  post-card-01.tsx (mirror + handle additions)                  → tsc + lint
C4  parts/post-header.tsx + 3 RSC badge parts                     → tsc + lint + visual
C5  parts/mention-text.tsx + parts/tag-chips.tsx (RSC)            → tsc + lint
C6  parts/sensitive-gate.tsx + 4 variant integrations             → tsc + lint + visual + keyboard
C7  parts/link-preview-card.tsx + 2 variant integrations          → tsc + lint
C8  parts/repost-of-card.tsx + 2 variant integrations             → tsc + lint
C9  parts/poll-widget.tsx + 2 variant integrations + mirror       → tsc + lint + visual
C10 responsive sweep (audit-first; all 4 variants + header)       → tsc + lint + 7-viewport sweep
C11 kebab role-aware wiring (replaces useMemo kebabItems block)   → tsc + lint + 3-mode walkthrough
C12 demo.tsx rewrite + dummy-data.ts + registry.json + meta.ts
    + smoke harness consumer-tsc extension                        → FULL smoke; tsc + lint + validate-meta-deps
```

Net surface delta (post-card-01 only): **+10 files, +1 lib module, +~600 LOC, +1 toggle prop, +1 matrix type, +1 universal predicate, +1 mutations interface, +8 render-handler props, +5 imperative-handle methods, +12 optional `Post` fields, +1 helper-function extension. −2 files removed (likers-strip + share-menu moved to engagement-bar-01 at C0).**

Net surface delta (engagement-bar-01 v0.2.0 via C0): **+2 files moved in, +2 sub-exports, +2 type re-exports, +1 minor-bump.**

---

**Status:** 🟡 Drafted, awaiting user sign-off. Once signed off → **GATE 2 closed**, and implementation begins at C0 (engagement-bar-01 v0.2.0 description draft). Per the workflow, no code may be written until both GATE 1 (description) ✅ and GATE 2 (this plan) are signed off.

**Estimated implementation time:** ~10–15h of focused work across the C0 prerequisite + C1–C12 chain. C0 = ~2–3h (engagement-bar-01 v0.2.0 description + plan + impl + spotcheck). C1–C12 = ~8–12h. Largest commits: C2 (resolver + truth-table audit, ~1.5h), C10 (responsive sweep, ~2h), C11 (kebab rewiring, ~1.5h), C12 (demo refresh + smoke extension, ~2h). Other commits are mechanical (~30–60 min each).
