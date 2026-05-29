# ilinxa-ui-pro — Status

> **Current snapshot — the *now*, not a changelog.** For per-decision context, browse [`.claude/decisions/`](decisions/) (one file per decision, YAML-frontmatter queryable). For full historical record pre-2026-05-09, see [`.claude/STATUS-archive.md`](STATUS-archive.md) (frozen).
>
> **Active handoff:** [`.claude/HANDOFF-2026-05-29-story-viewer-01-v0.3.9-session-close.md`](HANDOFF-2026-05-29-story-viewer-01-v0.3.9-session-close.md) — **session paused at user request after the v0.2.0 → v0.3.9 rapid-iteration arc** (18 commits, 9 versions, single day). Tip `0d9d2cf`. Working tree clean. Open follow-ups queued: smile-icon polish (needs engagement-bar-01 upstream bump), v0.3 guide section + usage.tsx update, smoke harness run, GATE 3 spotcheck for v0.3.5+ surfaces. Concurrent in-flight: [`HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md`](HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md) — cms-panel-01 GATE 1 unchanged. Past handoffs (frozen): [`HANDOFF-2026-05-28-story-viewer-01-v0.2.0-c6-pause.md`](HANDOFF-2026-05-28-story-viewer-01-v0.2.0-c6-pause.md), [`HANDOFF-2026-05-28-session-close-engagement-bar-01-v0.3.2-shipped.md`](HANDOFF-2026-05-28-session-close-engagement-bar-01-v0.3.2-shipped.md), [`HANDOFF-2026-05-28-session-close-post-card-01-v0.2.1-shipped.md`](HANDOFF-2026-05-28-session-close-post-card-01-v0.2.1-shipped.md), [`HANDOFF-2026-05-25-workspace-v0.1.2-shipped-locally-phase-b-queued.md`](HANDOFF-2026-05-25-workspace-v0.1.2-shipped-locally-phase-b-queued.md), [`HANDOFF-2026-05-09-session-pause.md`](HANDOFF-2026-05-09-session-pause.md).
>
> **Last big snapshot trim:** 2026-05-25 (this trim, restoring the lean-snapshot convention; ~41K tokens → ~8K). Prior trim: 2026-05-09 (F-cross-02 split — Recent decisions log moved to per-decision files; pre-2026-05-09 bulk archive frozen).

---

## Library tiers

Four-tier model formalized 2026-05-25. Charter: [`docs/library-tiers-charter.md`](../docs/library-tiers-charter.md). Rule: [`.claude/rules/readiness-review.md`](rules/readiness-review.md).

| Tier | Shipped | Distribution | Folder |
|---|---|---|---|
| **pro-component** | 49 | runtime (`registry:component`) | `src/registry/components/` |
| **pro-section** | 0 (charter locked, tooling Phase B) | runtime default | `src/registry/sections/` *(Phase B)* |
| **pro-page** | 0 (charter locked, tooling Phase B) | scaffold-fork (`registry:block`) | `src/registry/pages/` *(Phase B)* |
| **pro-panel** | 0 (charter locked, tooling Phase B) | scaffold-fork meta-block | `src/registry/panels/` *(Phase B)* |

Phase A landed 2026-05-25 (charter + rule restructure + tier dir READMEs + STATUS block). Phase B (scaffolders + registry infra + per-tier categories + meta-deps lint extension) ships alongside the first pilot in each tier. Phase C is pilots in order: section → page → panel (no panel-first; composition risk compounds).

---

## Components

49 components across 8 categories. Source of truth for per-component description / API / status: each component's `meta.ts` and procomp docs (`docs/procomps/<slug>-procomp/`). For the version snapshot: [`docs/component-versions.md`](../docs/component-versions.md). For per-component review state + per-finding history: [`docs/reviews/sweep-tracker.md`](../docs/reviews/sweep-tracker.md).

| Slug | Category | Status | Version |
|------|----------|--------|---------|
| `data-table` | data | alpha | 0.1.1 |
| `rich-card` | data | **beta** | 0.4.2 |
| `kanban-board-01` | data | alpha | 0.3.0 |
| `flow-canvas-01` | data | alpha | 0.2.5 |
| `article-body-01` | data | alpha | 0.2.2 |
| `engagement-bar-01` | data | alpha | 0.3.2 |
| `post-card-01` | data | alpha | 0.3.2 |
| `comment-thread-01` | data | alpha | 0.2.1 |
| `article-meta-01` | data | alpha | 0.1.0 |
| `content-card-news-01` | data | alpha | 0.2.0 |
| `event-card-01` | data | alpha | 0.1.1 |
| `expandable-text-01` | data | alpha | 0.1.0 |
| `info-list-01` | data | alpha | 0.1.0 |
| `people-grid-01` | data | alpha | 0.1.0 |
| `progress-timeline-01` | data | alpha | 0.1.2 |
| `project-card-01` | data | alpha | 0.2.0 |
| `registration-card-01` | data | alpha | 0.1.1 |
| `schedule-list-01` | data | alpha | 0.1.0 |
| `story-rail-01` | data | alpha | 0.2.1 |
| `thumb-list-01` | data | alpha | 0.1.0 |
| `stat-card` | data | alpha | 0.1.1 |
| `rich-card-in-flow` | data | alpha | 0.2.0 |
| `todo-rich-card` | data | alpha | 0.1.1 |
| `todo-tree` | data | alpha | 0.1.3 |
| `workspace` | layout | alpha | 0.1.3 |
| `grid-layout-news-01` | layout | alpha | 0.2.0 |
| `markdown-editor` | forms | alpha | 0.1.1 |
| `properties-form` | forms | alpha | 0.1.1 |
| `json-form` | forms | alpha | 0.2.5 |
| `registration-form-01` | forms | alpha | 0.1.1 |
| `pricing-table-01` | marketing | alpha | 0.1.0 |
| `entity-picker` | forms | alpha | 0.1.1 |
| `category-cloud-01` | forms | alpha | 0.1.0 |
| `filter-bar-01` | forms | alpha | 0.1.0 |
| `filter-stack` | forms | alpha | 0.1.0 |
| `author-card-01` | marketing | alpha | 0.1.0 |
| `newsletter-card-01` | marketing | alpha | 0.1.0 |
| `page-hero-news-01` | marketing | alpha | 0.1.2 |
| `share-bar-01` | marketing | alpha | 0.1.0 |
| `media-carousel-01` | media | alpha | 0.1.3 |
| `story-viewer-01` | media | alpha | 0.3.9 |
| `video-player-01` | media | alpha | 0.1.2 |
| `pdf-viewer` | media | alpha | 0.1.3 |
| `file-tree` | navigation | alpha | 0.1.0 |
| `file-manager` | navigation | alpha | 0.1.0 |
| `rich-sidebar` | navigation | alpha | 0.3.0 |
| `account-switcher-01` | navigation | alpha | 0.1.0 |
| `code-block` | code | alpha | 0.1.1 |
| `detail-panel` | feedback | alpha | 0.1.1 |

> `force-graph` removed 2026-05-08 pending recreation; v0.2 source + procomp docs archived to [`docs/migrations/force-graph/`](../docs/migrations/force-graph/). v3 design + slug TBD.

---

## Active queue (session-open list, 2026-05-13)

User's procomp queue — 7 of 10 shipped, 3 remaining. Each goes through GATE 1 (description) → GATE 2 (plan) → implementation → GATE 3 (spot-check review).

1. ~~`pdf-viewer`~~ ✅ shipped 2026-05-10
2. ~~`file-tree`~~ ✅ shipped 2026-05-10
3. ~~`file-manager`~~ ✅ shipped 2026-05-10
4. ~~`code-block`~~ ✅ shipped 2026-05-11
5. ~~`json-form`~~ ✅ shipped 2026-05-13 (now v0.2.5)
6. ~~`todo-rich-card`~~ ✅ shipped 2026-05-20 (now v0.1.1)
7. ~~`todo-tree`~~ ✅ shipped 2026-05-21 (now v0.1.3)
8. `rich-graph-2`
9. `chat-panel`
10. `notification-system`

Sibling procomps queued (no GATE 1 yet): `todo-rich-card-in-flow` (flow-canvas-01 adapter), `bottom-tab-bar-01` (shares NavBadge + NavItem schema with rich-sidebar via F-S1 relative imports).

**Side workstreams — recently closed:** `rich-sidebar` v0.1 → v0.3 (3 ships across 2026-05-22 / 23), `account-switcher-01` v0.1.0 (49th component, 2026-05-23), `registration-form-01` + `pricing-table-01` (CMS conversion batch, 2026-05-22), `workspace` v0.1.2 → v0.1.3 + v0.2.0 GATE 1 (2026-05-24 / 25). See Recent activity below or `.claude/decisions/`.

---

## Roadmap (longer-term team-utility candidates)

Next candidates, ordered by team utility (separate from the active queue above):

1. ~~`data/stat-card`~~ ✅ shipped 2026-05-09
2. `feedback/empty-state` — icon + title + body + primary action.
3. `forms/multi-select` — combobox with tag chips (shadcn has Command, no real multi-select).
4. `layout/page-header` — title + breadcrumbs + actions slot.
5. `feedback/notification-feed` — grouped, time-bucketed, read/unread (overlaps with active-queue `notification-system` — reconcile when that one starts).
6. `navigation/command-palette` — cmd+k, grouped results.
7. `media/dropzone` — drag-drop + progress + previews.

**Active sweep work** — in-progress at [`docs/reviews/sweep-tracker.md`](../docs/reviews/sweep-tracker.md). Tier 1 (9 components) reviewed at v0.1 across sessions 1-6; Phases 1-6 closed in sessions 7-7d; Tier 2 (27 components) reviews scheduled across sessions 8-12.

---

## Open decisions / TODOs

**Active — needs decision or work**

- **F-cross-13** — shadcn primitive Radix→Base UI divergence (Medium). Path (a) shipped per-procomp (defensive callback contravariance + drop divergent prop names; established 2026-05-17 in rcif v0.2.0). Path (b) — producer-primitive refresh — standalone hygiene task, affects every procomp using shadcn primitives with non-trivial props. Tracker: [`docs/reviews/sweep-tracker.md` F-cross-13](../docs/reviews/sweep-tracker.md). Defensive-callback pattern is the **new default for all future procomp authors**.
- **F-S1 cross-procomp `/types` substitution** (Watch). shadcn 4.6.0 path rewriter substitutes the current slug for the target slug when a same-category sibling imports `<other-slug>/types`. Worked around via RELATIVE imports for all cross-procomp paths in shipped source. Promotion criterion: a second same-category cross-procomp ship that trips the bug despite the relative-paths lock.
- **rich-card-in-flow v0.1 + v0.2 spot-check follow-ups** → v0.3.0 plan (4 Low candidates: `isCardLike` tightening + Plate per-mount cost + per-field ports + custom port-type registration). Decisions: [v0.1.0](decisions/2026-05-16-rich-card-in-flow-v0.1.0-first-ship.md), [v0.2.0](decisions/2026-05-17-rich-card-in-flow-v0.2.0-port-editor.md).
- **flow-canvas-01 v0.2.0 spot-check follow-ups** → v0.2.1 candidates (F-01 Med post-Tier-1+2 DevTools-trace measurement; F-02 Low path-b smoke; F-03 Low usage.tsx stale "Deferred to v0.2" heading). Decision: [2026-05-16-flow-canvas-v0.2.0-perf-bundle](decisions/2026-05-16-flow-canvas-v0.2.0-perf-bundle.md).
- **pdf-viewer worker default** (F-01) → v0.2.0. Replace unpkg-CDN default with bundled-or-postinstall path; Turbopack rejected bare-specifier `new URL()` so v0.1.0 ships CDN default + `workerSrc` override. Decision: [2026-05-10-pdf-viewer-v01-pipeline](decisions/2026-05-10-pdf-viewer-v01-pipeline.md).

**Informed defers — explicit trigger to revisit**

- **MDX for usage docs** — currently `usage.tsx`. Trigger: ~5 components reach prose-heavy guidance, OR a consumer needs MDX-specific features (embeds, codeblocks-with-render).
- **NPM publish artifacts** — no `tsup`/`rollup`, no exports map. shadcn-registry handles team-internal use. Trigger: external consumer onboards, OR registry update-friction surfaces real pain.
- **Test runner not wired** — `tsc --noEmit` + `lint` + demo-driven manual verification cover today. Trigger: first non-trivial bug in pure-function `lib/` modules (workspace + rich-card + properties-form). First test should be rich-card's `parse → serialize → parse` fixed-point property test.

Closed entries (F-cross-01/04/11-pathB/12, Phase 0 risk spike, chart palette, site nav, alpha/beta variants, footer version, public registry build, reserved meta fields, lime contrast pattern, rcif p-llm-system-in warning, etc.) live in [`.claude/decisions/`](decisions/) + [`STATUS-archive.md`](STATUS-archive.md) (pre-2026-05-09).

---

## Recent activity

The 5 most-recent decision files, most-recent first. Full per-decision log at [`.claude/decisions/`](decisions/).

- **⏸ 2026-05-29 SESSION PAUSE — story-viewer-01 v0.2.0 → v0.3.9 rapid-iteration arc (18 commits, 9 versions, single day; tip `0d9d2cf`)** ([decision](decisions/2026-05-29-story-viewer-01-v0.3.x-arc-comments-share-link-drawer-heart-toggle.md)) — Resumed from v0.2.0 C6 pause + drained C7–C10 (render slots + 8 disable opt-outs + long-press + LinkCta + handle expansion + 4 demo tabs + GATE 3 spotcheck Pass-with-follow-ups), then iterated rapidly through visual review with the user. **v0.2.1** F-cross-13 viewer-shell `showCloseButton` patch (smoke-driven). **v0.2.2** `onAuthorClick` + polymorphic `authorComponent`. **v0.3.0** (BREAKING) bookmark removed + Instagram-style comments panel (`renderCommentsPanel` slot hosting `<CommentThread01 />` via demo, visual stack scales 0.55 when panel open + tap-shrunk-visual closes). **v0.3.1** share panel parallel (`renderSharePanel` hosting `<ShareMenu />` from engagement-bar-01) + generic `BottomSheet` chrome + scroll fix + icon size unification. **v0.3.2–v0.3.4** DM bar layout iterations driven by user screenshots — final state: full-width gradient (right-0), no Cancel button, no engagement fade. **v0.3.5** kebab moved from engagement column to ViewerHeader's right cluster + engagement icons collapsed by default + heart toggle reveals with bottom-to-top stagger (delays 0/75/150/200ms). **v0.3.6** DM input height shrink (override shadcn Textarea baked `min-h-16` via `[&_textarea]:min-h-9`). **v0.3.7** heart toggle moved inline with DM bar (z-32, right-3 bottom-3, aligned with avatar). **v0.3.8** LinkCta redesigned as top-anchored collapsible drawer (chip at top-16 right-3 → drawer with host preview + CTA + X). **v0.3.9** review cleanup pass — 4 new label keys (`linkCloseLabel` / `engagementShowLabel` / `engagementHideLabel` / `replyAriaLabel`), stale JSDoc fixes, `onActiveChange` marked `@deprecated`. Public API now ~62 props; zero v0.2.x consumer breakage post-v0.3.0 (only bookmark removal). Tailwind v4 supports bare numeric z-utilities natively (`z-31`, `z-32`, etc.) — IDE lint prefers them over bracket syntax. Open follow-ups queued in [handoff](HANDOFF-2026-05-29-story-viewer-01-v0.3.9-session-close.md): smile-icon reaction polish (needs engagement-bar-01 upstream `defaultReactionIcon`), v0.3 guide section + usage.tsx update, smoke harness re-run, optional GATE 3 spotcheck for v0.3.5+ surfaces.
- **✅ 2026-05-29 — story-viewer-01 v0.3.0 SHIPPED (comments panel + bookmark removal)** ([decision](decisions/2026-05-29-story-viewer-01-v0.3.0-comments-panel-and-bookmark-removal.md)) — User-flagged two changes during visual review of v0.2.x viewer-mode tab. (1) **Bookmark removed** from engagement overlay — stories aren't bookmarkable; owner-side `Save to highlights` in the kebab stays. `onBookmarkStory` prop deleted (breaking; TS flags at compile time; v0.2.x is days old so impact small). (2) **Instagram-style comments panel** — comment-icon tap now opens a bottom-sheet (~62% viewer height) holding the host-supplied comments thread via new `renderCommentsPanel?: (s,i,helpers) => ReactNode` slot. Visual stack above scales to 55% + translates up; tap on shrunk visual closes. Always-mounted (CommentThread01 draft state persists). Auto-pauses story timer. Auto-closes on cursor change. New `disableComments` opt-out for v0.2.x behavior. New `parts/comments-panel.tsx`. DM input semantic clarified — the always-visible bottom `<ReplyComposer>` is Direct Message to the story author (Instagram-canonical), NOT public comments. `onAddReply` callback name preserved. Demo's ViewerModeTab wires CommentThread01 with DUMMY_FLAT_COMMENTS + pageSize=5 + 300ms-simulated onLoadMore. GATE 1+2 skipped per user iteration-mode request; GATE 3 spotcheck Pass with follow-ups (5 findings, mostly v0.3.1 docs/polish). Also includes v0.2.2 author tap-target (`onAuthorClick` + polymorphic `authorComponent`) shipped earlier today.
- **✅ 2026-05-29 — story-viewer-01 v0.2.0 SHIPPED (engagement layer ship + C0–C10 chain closed)** ([decision](decisions/2026-05-29-story-viewer-01-v0.2.0-engagement-layer-ship.md)) — Resumed mid-chain from `90af2db` C6 pause. **C7** wired the 4 v0.2.0 default-part render slots (renderHeader / renderProgress / renderNavArrows / renderTapZones) at the outer level — consistent with the C3/C4/C5 slot pattern (documented deviation from the plan's "files: 4 parts" — simpler, no behavior change). **C8** finished the 5 remaining disable opt-outs (disableTapZones / disableKeyboardNav / disableNavArrows / disableAutoClose / disableProgressBars); `useStoryKeyboardNav` gained an `enabled` opt + `useStoryViewerState` gained a `disableAutoClose` opt. **C9** added the `useLongPressPause` hook (Instagram-canonical mobile gesture, 200ms default, additive on v0.1 tap-pause) and the `<LinkCta>` part with polymorphic `linkComponent` root (F-cross-13 safe). **C10** retired the 3 C6-era `props as { ... }` type-assertion blocks by hoisting the kebab mutation handlers onto `StoryViewer01Props` (post-card-01 v0.2.0 convention); wired the 5 v0.2.0 imperative handle methods (trigger* via refs to keep handle identity stable while reading current cursor + engagement state); expanded dummy-data with viewerCount/viewers/link/reactionKinds; added 4 demo tabs (ViewerMode / OwnerMode / CustomSlots / LinkAndLongPress); bumped meta.ts to 0.2.0 with 13 new feature bullets (dependencies.shadcn unchanged — kebab DropdownMenu dependency avoided per C6 bottom-sheet deviation); extended guide.md with a full v0.2.0 section (engagement / reply / owner / kebab placement / slots / disable matrix / long-press / link / handle / engagementSubscribe); GATE 3 spotcheck verdict **Pass with follow-ups** (5 findings — F-01 triggerReply content stub (v0.2.1 docs + v0.2.2 substrate), F-02 LikersStrip cast (v0.3.0), F-03 engagement-overlay vs composer visual offset (v0.2.1), F-04 long-press race docs (v0.2.1), F-05 disableEngagement + kebab pairing docs (v0.2.1)). Zero v0.1.x consumer breakage (every v0.2.0 surface opt-in). Bundled story-rail-01 v0.2.1 docs patch already shipped in C0. Smoke harness run pending immediately post-push.
- **⏸ 2026-05-28 evening — story-viewer-01 v0.2.0 GATE 1 IN FLIGHT (description signed off; GATE 2 plan next)** — Deep review of story-rail-01 + story-viewer-01 vs the post-card-01 A+ recipe: rail = A− (one docs patch closes it), viewer = B+ (passive viewer missing engagement surface). v0.2.0 description authored at [`docs/procomps/story-viewer-01-procomp/story-viewer-01-procomp-description-v0.2.0.md`](../docs/procomps/story-viewer-01-procomp/story-viewer-01-procomp-description-v0.2.0.md) — 14 scope items (engagement overlay composing engagement-bar-01 v0.3.x variant=stacked + reply composer composing comment-thread-01 v0.2.1 CommentComposer + viewerMode/permissions/canPerformAction mirroring post-card-01 v0.3.0 + owner overlay with hybrid eager-count/lazy-users-list + kebab as 6th engagement-overlay item with header fallback + 7 render slots + 8 disable opt-outs + 13 handle methods + StoryItem.link CTA + long-press pause additive + i18n expansion + F-S1 import patch + touch-target patch bundled + 4 new demo tabs). 7 Q-Ps locked (Q-V1/V2/V5 by user, Q-V8/V9/V16/V17 by Instagram/TikTok/Snapchat platform-alignment re-validation; **Q-V17 revised post-validation** — kebab moved from header to engagement-overlay per Instagram-2024 exact). 10 Q-Ps pre-locked from post-card-01 / engagement-bar v0.3 / F-S1 / F-cross-13 precedent. Bundled: story-rail-01 v0.2.1 docs patch (3 stale positional `onItemClick` snippets). Active handoff: [`HANDOFF-2026-05-28-story-viewer-01-v0.2.0-gate-1-awaiting-signoff.md`](HANDOFF-2026-05-28-story-viewer-01-v0.2.0-gate-1-awaiting-signoff.md).
- **2026-05-28 — post-card-01 v0.3.0 + comment-thread-01 v0.2.0 SHIPPED (ILX-3 moderator section + ILX-4 edited badge) + snapshot drift fixes** ([decision](decisions/2026-05-28-ilx-3-and-ilx-4-moderator-and-edited-comment.md)) — Closes ILX-3 (HIGH) + ILX-4 (MEDIUM) from `social-moduls-python` backend team's review of the 2026-05-27 v0.2.0 + 2026-05-28-morning v0.3.x ships. **post-card-01 v0.3.0**: additive moderator section in the kebab — `PostPermissionAction` gains `"moderate"` (12th arm); `PostPermissions.canModerate?: boolean` (default `false` in BOTH viewerMode defaults — orthogonal, never auto-derived); new `moderatorActions?: (post) => CommentMenuItem[]` prop; `defaultPostKebabActions` injects the section between common items and viewer-destructive items with first item carrying `separatorBefore: true`; PostHeader separator logic composed (explicit flag + destructive-boundary); stale "moderator slot-driven via kebabActions" JSDoc replaced; new Moderator demo tab (Feature / Lock / Remove items); usage.tsx v0.3.0 section. **comment-thread-01 v0.2.0**: `Comment.edited?: boolean` first-paint flag; `CommentMenuItem.separatorBefore?: boolean` (reusable additive flag — first user is post-card moderator section; idiomatic — `flow-canvas-01/types.ts:113` already has the same pattern on ContextMenuItem); `CommentThreadLabels.editedSuffix?: string` default `"(edited)"`; realtime `{ kind: "edited" }` delta now also flips `edited:true` (first-paint and post-realtime UI behave identically); CommentNode renders the suffix; dummy `c3` comment carries `edited: true` to surface the badge in docs. **GATE 3 both Pass-with-follow-ups** ([post-card spotcheck](procomps/post-card-01-procomp/reviews/2026-05-28-v0.3.0-spotcheck.md), [comment-thread spotcheck](procomps/comment-thread-01-procomp/reviews/2026-05-28-v0.2.0-spotcheck.md)). Bundled: snapshot drift fixes — `docs/component-versions.md` rich-sidebar 0.2.4 → 0.3.0, forms count 7 → 8, marketing count 4 → 5, verify-math 41 → 49; `.gitignore` `.claude/*.lock` entry. Zero-breakage verified for v0.1 + v0.2 consumers. Post-push smoke is the only remaining task.
Older entries trimmed 2026-05-29 per the lean-snapshot convention (kept 5 most-recent). Recently trimmed but still meaningful: cms-panel-01 GATE 1 in-flight (now surfaced via the active handoff banner above), library tier system charter ([decision](decisions/2026-05-25-library-tier-system-charter.md)), and the 2026-05-25 STATUS.md slim-down itself. All entries since 2026-05-09 still live at [`.claude/decisions/`](decisions/) — every shipped component, gate closure, or substantive decision has its own dated file. Slug-grep is the search interface.

---

## How to update this file

`STATUS.md` is the slim snapshot. **Don't extend it with verbose entries.** Per-decision detail lives in `.claude/decisions/<date>-<slug>.md` (queryable by YAML frontmatter); STATUS.md is the index + the snapshot. The 2026-05-09 + 2026-05-25 trims were both restorations of this rule, not exceptions.

| When something happens | Where it goes |
|---|---|
| Component ships / version bumps / status changes | Update the Components table row + author a `.claude/decisions/<date>-<slug>.md` file |
| Sweep phase closes / cross-cutting finding closes | Author a decision file; update [`docs/reviews/sweep-tracker.md`](../docs/reviews/sweep-tracker.md); add a one-line "Recent activity" pointer above (keep ~5 most-recent only) |
| New TODO / Open decision lands | Add a one-line bullet in "Open decisions / TODOs" with a decision/tracker link — do NOT inline the decision content |
| Something old gets closed | Either strike inline if recent + relevant, OR drop the line entirely (the decision file is the source of truth) |
| Intro banner urge | **Resist.** No more banner-blockquote stack at the top. Banners ARE the changelog; they belong in decision files + Recent activity, not the snapshot |

The "Recent activity" pointer list stays at ~5 entries (most recent first). Older entries are still in `.claude/decisions/` — not removed, just not surfaced in this index. If you need to extend Recent activity past 7 entries, trim back to 5 instead.
