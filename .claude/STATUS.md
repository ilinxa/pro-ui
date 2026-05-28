# ilinxa-ui-pro — Status

> **Current snapshot — the *now*, not a changelog.** For per-decision context, browse [`.claude/decisions/`](decisions/) (one file per decision, YAML-frontmatter queryable). For full historical record pre-2026-05-09, see [`.claude/STATUS-archive.md`](STATUS-archive.md) (frozen).
>
> **Active handoff:** No active handoff (this session's ship — post-card-01 v0.3.0 + comment-thread-01 v0.2.0 closing ILX-3 + ILX-4 — is staged for commit + push; post-push smoke is the only remaining task per both spotchecks' F-01). Concurrent in-flight: [`HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md`](HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md) — cms-panel-01 GATE 1 still awaiting user sign-off (unchanged this session). Past handoffs (frozen): [`HANDOFF-2026-05-28-session-close-engagement-bar-01-v0.3.2-shipped.md`](HANDOFF-2026-05-28-session-close-engagement-bar-01-v0.3.2-shipped.md), [`HANDOFF-2026-05-28-session-close-post-card-01-v0.2.1-shipped.md`](HANDOFF-2026-05-28-session-close-post-card-01-v0.2.1-shipped.md), [`HANDOFF-2026-05-25-workspace-v0.1.2-shipped-locally-phase-b-queued.md`](HANDOFF-2026-05-25-workspace-v0.1.2-shipped-locally-phase-b-queued.md), [`HANDOFF-2026-05-09-session-pause.md`](HANDOFF-2026-05-09-session-pause.md).
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
| `post-card-01` | data | alpha | 0.3.1 |
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
| `story-rail-01` | data | alpha | 0.2.0 |
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
| `story-viewer-01` | media | alpha | 0.1.2 |
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

- **2026-05-28 — post-card-01 v0.3.0 + comment-thread-01 v0.2.0 SHIPPED (ILX-3 moderator section + ILX-4 edited badge) + snapshot drift fixes** ([decision](decisions/2026-05-28-ilx-3-and-ilx-4-moderator-and-edited-comment.md)) — Closes ILX-3 (HIGH) + ILX-4 (MEDIUM) from `social-moduls-python` backend team's review of the 2026-05-27 v0.2.0 + 2026-05-28-morning v0.3.x ships. **post-card-01 v0.3.0**: additive moderator section in the kebab — `PostPermissionAction` gains `"moderate"` (12th arm); `PostPermissions.canModerate?: boolean` (default `false` in BOTH viewerMode defaults — orthogonal, never auto-derived); new `moderatorActions?: (post) => CommentMenuItem[]` prop; `defaultPostKebabActions` injects the section between common items and viewer-destructive items with first item carrying `separatorBefore: true`; PostHeader separator logic composed (explicit flag + destructive-boundary); stale "moderator slot-driven via kebabActions" JSDoc replaced; new Moderator demo tab (Feature / Lock / Remove items); usage.tsx v0.3.0 section. **comment-thread-01 v0.2.0**: `Comment.edited?: boolean` first-paint flag; `CommentMenuItem.separatorBefore?: boolean` (reusable additive flag — first user is post-card moderator section; idiomatic — `flow-canvas-01/types.ts:113` already has the same pattern on ContextMenuItem); `CommentThreadLabels.editedSuffix?: string` default `"(edited)"`; realtime `{ kind: "edited" }` delta now also flips `edited:true` (first-paint and post-realtime UI behave identically); CommentNode renders the suffix; dummy `c3` comment carries `edited: true` to surface the badge in docs. **GATE 3 both Pass-with-follow-ups** ([post-card spotcheck](procomps/post-card-01-procomp/reviews/2026-05-28-v0.3.0-spotcheck.md), [comment-thread spotcheck](procomps/comment-thread-01-procomp/reviews/2026-05-28-v0.2.0-spotcheck.md)). Bundled: snapshot drift fixes — `docs/component-versions.md` rich-sidebar 0.2.4 → 0.3.0, forms count 7 → 8, marketing count 4 → 5, verify-math 41 → 49; `.gitignore` `.claude/*.lock` entry. Zero-breakage verified for v0.1 + v0.2 consumers. Post-push smoke is the only remaining task.
- **2026-05-28 — engagement-bar-01 v0.3.0 → v0.3.2 SHIPPED (multi-kind reactions + interactive demo + 2 smoke-driven patches)** ([decision](decisions/2026-05-28-engagement-bar-01-v0.3.0-reactions-multi-kind-ship.md)) — Closes ILX-1 (HIGH) + ILX-2 (MEDIUM) from `social-moduls-python` backend team spec. **v0.3.0** (`d6e72e9`): main ship — new `kind: "reaction"` union arm + `EngagementReactionKind` interface + 3 delta variants + 3 nullable state fields + `reaction-select` reducer action + `<ReactionPicker>` + `<ReactionAction>` parts (popover assembly, 350ms long-press, tap-vs-clear matrix) + `reactionsPreview` slot + 4 new labels + `triggerReaction` + `getCurrentReaction` handle methods + Defense 1 (microtask) + Defense 2 (sync effect for controlled viewerReaction). Q-P locks Q-P1=(b) single kinds array · Q-P2=(c) clearOnTap default true · Q-P3=(a) like + reaction coexist. Interactive demo: `InteractiveDefaultDemo` wires all 4 callbacks (LikersStrip + CommentThread01 + ShareMenu + bookmark); `InteractiveReactionsDemo` adds scrollable + lazy-loaded reactors panel. GATE 3 Pass with follow-ups, 16 re-validation findings caught + fixed pre-spotcheck. **v0.3.1** (`0c803ee`): smoke surfaced PopoverAnchor not exported by Base UI — revert to PopoverTrigger + queueMicrotask override for auto-toggle. **v0.3.2** (`6f99a88`): smoke surfaced asChild not accepted by Base UI's PopoverTrigger — drop asChild, render PopoverTrigger directly as button with HTML props spread. **Live smoke ✅ green** post-v0.3.2 (install OK + consumer-tsc 0 engagement-bar-01 errors). F-cross-13 carrier list extended with the Popover 3-facet sub-trap; Vercel bot-mitigation-on-polling lesson banked as feedback memory.
- **2026-05-28 — post-card-01 v0.2.1 patch + docs-site SwipeTabsList sweep** ([decision](decisions/2026-05-28-post-card-01-v0.2.1-list-thumb-and-docs-swipe-tabs.md)) — Two changes in two commits. (1) post-card-01 v0.2.1 list-thumb width shrink: `w-20 → w-16` mobile + cap growth to `lg:w-28` (was `lg:w-40`), fixes name-collapse-to-"H…" on narrow containers. Visual-only patch, no GATE 3. (2) Docs-site `<SwipeTabsList>` wrapper + 39-demo sweep + ViewCode reposition (out of Preview interior into section heading row). Adopts LikersStrip's `useDragScroll` pattern + `getBoundingClientRect`-based JS snap-on-release. Demos all share one tab-strip layout source-of-truth; ad-hoc `flex flex-wrap` / `grid grid-cols-N` classNames stripped. `component-versions.md` synced (engagement-bar-01 + post-card-01 rows were stale at 0.1.x since the 2026-05-27 v0.2.0 ship).
- **2026-05-27 — post-card-01 v0.2.0 SHIPPED + engagement-bar-01 v0.2.1 (responsive sweep)** ([decision](decisions/2026-05-27-post-card-01-v0.2.0-ship.md)) — 13-commit chain `7b453a3..(C12)` over a single session: C0 engagement-bar extraction → C1 types → C2 permissions resolver → C3 local-mirror + 5 handle triggers → C4 PostHeader badges + truncation → C5 MentionText + TagChips → C6 sensitive gate → C7 link-preview card → C8 repost mini-card → C9 inline poll widget → C10 responsive sweep (+ engagement-bar-01 v0.2.0 → v0.2.1 patch) → C11 kebab role-aware wiring → C12 demo refresh + dummy expansion + meta bump + guide.md + GATE 3 spotcheck. **GATE 3 verdict: Pass with follow-ups** (5 findings, all sub-Blocker — F-01 smoke-post-push / F-02 sub-export asymmetry → v0.2.1 / F-03 multi-select polls → v0.3 / F-04 closesAt tick → v0.3+ cross-procomp / F-05 hardcoded English aria-label → v0.2.1). Zero v0.1 breakage verified across 7-pattern matrix. Post-push smoke harness run pending (consumer-tsc step already baked into harness at `e:/tmp/ilinxa-smoke-consumer/scripts/smoke-all.mjs`).
- **2026-05-27 — engagement-bar-01 v0.2.0 SHIPPED** ([decision](decisions/2026-05-27-engagement-bar-01-v0.2.0-likers-strip-share-menu-extraction.md)) — additive sub-export extraction: `LikersStrip` + `ShareMenu` moved from `post-card-01/parts/` → `engagement-bar-01/parts/`; new `EngagementLikerProfile` type (relaxed-fields shape, parallel to strict `EngagementLikeUser` for delta payloads). Spotcheck verdict **Pass**, zero findings. C0 prerequisite for post-card-01 v0.2.0; main chain C1 → C12 unblocked.

Older entries trimmed 2026-05-28 per the lean-snapshot convention (kept 5 most-recent). Recently trimmed but still meaningful: cms-panel-01 GATE 1 in-flight (now surfaced via the active handoff banner above), library tier system charter ([decision](decisions/2026-05-25-library-tier-system-charter.md)), and the 2026-05-25 STATUS.md slim-down itself. All entries since 2026-05-09 still live at [`.claude/decisions/`](decisions/) — every shipped component, gate closure, or substantive decision has its own dated file. Slug-grep is the search interface.

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
