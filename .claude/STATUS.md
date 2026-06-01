# ilinxa-ui-pro — Status

> **Current snapshot — the *now*, not a changelog.** For per-decision context, browse [`.claude/decisions/`](decisions/) (one file per decision, YAML-frontmatter queryable). For full historical record pre-2026-05-09, see [`.claude/STATUS-archive.md`](STATUS-archive.md) (frozen).
>
> **Active handoff:** [`.claude/HANDOFF-2026-06-01-story-composer-01-v0.1.4-session-close.md`](HANDOFF-2026-06-01-story-composer-01-v0.1.4-session-close.md) — **50th procomp shipped + 5-version patch arc closed in one day** (20 commits total). v0.1.0 first ship (15-commit chain C1→C15, GATE 3 Pass-with-follow-ups, 3 pre-push fixes closed) → v0.1.1 smoke patch (3 F-cross-13 sub-traps against consumer-side shadcn primitives) → re-smoke green → v0.1.2 Radix a11y (DialogDescription missing) → v0.1.3 pan + pinch-zoom (touch 2-finger, desktop wheel/keyboard, useKonvaStageSize + getRelativePointerPosition for zoom-safe strokes) → v0.1.4 3 user-reported fixes (wheel zoom no-longer-needs-Ctrl via native non-passive listener; crop tool removed from default `enabledTools` since stories are 9:16-locked; camera flicker root-cause fixed via `requestAudio` default false + bounded auto-retry). Full Instagram parity: 3 modes (photo / video / text), 6 edit tools (text / draw / stickers / filters / adjust / crop opt-in), 36 built-in emoji stickers, 10 filter presets, undo/redo + Ctrl+Z, mobile-fullscreen / desktop 400×711 9:16 modal. Story-system trilogy closed (rail + viewer + composer). All gates green (tsc + lint + meta-deps + registry:build + pnpm build + smoke harness). Deferred follow-ups: F-01 RAF-throttle adjust sliders (v0.1.5); F-02 drawing-stroke counter-ref (v0.1.x defer-if-no-drop); crop-with-zoom integration (v0.2 — needs DOM→Konva crop rewrite). Concurrent in-flight: [`HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md`](HANDOFF-2026-05-25-cms-panel-01-gate-1-awaiting-signoff.md) — cms-panel-01 GATE 1 unchanged. Past handoffs (frozen): [`HANDOFF-2026-06-01-story-composer-01-v0.1.0-shipped.md`](HANDOFF-2026-06-01-story-composer-01-v0.1.0-shipped.md), [`HANDOFF-2026-05-30-story-viewer-01-v0.4.4-session-close.md`](HANDOFF-2026-05-30-story-viewer-01-v0.4.4-session-close.md), [`HANDOFF-2026-05-29-story-viewer-01-v0.3.9-session-close.md`](HANDOFF-2026-05-29-story-viewer-01-v0.3.9-session-close.md), [`HANDOFF-2026-05-28-story-viewer-01-v0.2.0-c6-pause.md`](HANDOFF-2026-05-28-story-viewer-01-v0.2.0-c6-pause.md), [`HANDOFF-2026-05-28-session-close-engagement-bar-01-v0.3.2-shipped.md`](HANDOFF-2026-05-28-session-close-engagement-bar-01-v0.3.2-shipped.md), [`HANDOFF-2026-05-28-session-close-post-card-01-v0.2.1-shipped.md`](HANDOFF-2026-05-28-session-close-post-card-01-v0.2.1-shipped.md), [`HANDOFF-2026-05-09-session-pause.md`](HANDOFF-2026-05-09-session-pause.md).
>
> **Last big snapshot trim:** 2026-05-25 (this trim, restoring the lean-snapshot convention; ~41K tokens → ~8K). Prior trim: 2026-05-09 (F-cross-02 split — Recent decisions log moved to per-decision files; pre-2026-05-09 bulk archive frozen).

---

## Library tiers

Four-tier model formalized 2026-05-25. Charter: [`docs/library-tiers-charter.md`](../docs/library-tiers-charter.md). Rule: [`.claude/rules/readiness-review.md`](rules/readiness-review.md).

| Tier | Shipped | Distribution | Folder |
|---|---|---|---|
| **pro-component** | 50 | runtime (`registry:component`) | `src/registry/components/` |
| **pro-section** | 0 (charter locked, tooling Phase B) | runtime default | `src/registry/sections/` *(Phase B)* |
| **pro-page** | 0 (charter locked, tooling Phase B) | scaffold-fork (`registry:block`) | `src/registry/pages/` *(Phase B)* |
| **pro-panel** | 0 (charter locked, tooling Phase B) | scaffold-fork meta-block | `src/registry/panels/` *(Phase B)* |

Phase A landed 2026-05-25 (charter + rule restructure + tier dir READMEs + STATUS block). Phase B (scaffolders + registry infra + per-tier categories + meta-deps lint extension) ships alongside the first pilot in each tier. Phase C is pilots in order: section → page → panel (no panel-first; composition risk compounds).

---

## Components

50 components across 8 categories. Source of truth for per-component description / API / status: each component's `meta.ts` and procomp docs (`docs/procomps/<slug>-procomp/`). For the version snapshot: [`docs/component-versions.md`](../docs/component-versions.md). For per-component review state + per-finding history: [`docs/reviews/sweep-tracker.md`](../docs/reviews/sweep-tracker.md).

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
| `story-viewer-01` | media | alpha | 0.4.4 |
| `story-composer-01` | media | alpha | 0.1.4 |
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

- **✅ 2026-06-01 — story-composer-01 v0.1.0 → v0.1.4 SHIPPED (50th procomp; full ship + 4 patch arc in one day; story-system trilogy closes)** ([decision](decisions/2026-06-01-story-composer-01-v0.1.0-first-ship.md)) — Greenfield ship via user request "create new story panel … directly opens camera … gallery … text editor … brightness/contrast/saturation … save/publish". 15-commit chain landed + 1 v0.1.1 smoke patch (`fb18b90`); smoke harness path-b consumer-tsc now ✅ green (36/36 files install + 0 consumer errors). 15-commit chain (C1 scaffold + C2 types + C3 shell/state/mode-pill + C4 camera + C5 video record/trim + C6 Konva editor with SSR-safe React.lazy boundary + C7 adjust/filters + C8 text + C9 stickers + C10 draw + history + retro-wire + C11 crop + C12 publish/uploader/composite-video bake-in + C13 text-only mode + a11y polish + guide + C14 registry roster + manual audit + C15 GATE 3 spotcheck Pass-with-follow-ups). 40 disk files, 36 base + 1 fixtures via registry, 2 new peer deps (`konva ^10.3.0` + `react-konva ^19.2.4`), 6 shadcn deps (alert-dialog/button/dialog/popover/slider/toggle-group). Full Instagram parity per user lock — three capture modes (photo + video + text), six edit tools (text/draw/stickers/filters/adjust/crop with 36 built-in SVG-data-URL emoji stickers + 10 Instagram-style preset filters with pre-rendered thumbnails), undo/redo on every command + Ctrl/Cmd+Z bindings, mobile-fullscreen / desktop 400×711 9:16 modal, XHR FormData uploader + signed-URL escape hatch, discard-confirm guard, live-region SR announcer, 15-method imperative handle. Q-Ps locked to recommendations 10/10. F-cross-13 defensive pre-wires applied (Popover direct trigger, no asChild). SSR boundary solved via React.lazy + Suspense (registry rule bans `next/dynamic`). Performance was the rotating-dim spot-check — surfaced 2 v0.1.x perf follow-ups (F-01 adjust-slider re-cache thrashing → RAF-throttle; F-02 drawing-stroke array-clone signal → counter ref). Review pre-push fixes landed: F-03 expanded index.ts barrel from 1 component + 24 types to also include 5 parts + 3 hooks + 5 lib helpers + 4 default tokens + 2 helper types = 14 newly-promised exports; F-04 STATUS.md catalog 49→50 + Components table row + this Recent activity pointer; F-05 `pnpm build` confirmed clean (59 static pages, RSC + React.lazy + Konva boundary holds). **v0.1.1 patch (`fb18b90`)** — first-pass smoke surfaced 3 F-cross-13 sub-traps against older consumer shadcn primitives: `radix-ui` namespace import not portable → use shadcn's PopoverTrigger directly (no asChild); `showCloseButton` prop is producer-side-only → CSS-hide via `[&_[data-slot=dialog-close]]:hidden`; `size="icon-sm"` producer-only Button variant → `size="icon" + size-8 className`. Re-smoke against deployed v0.1.1 ✅ green (36/36 files install + 0 consumer-tsc errors). Fourth consecutive ship following the established `ship → smoke → patch → re-smoke clean` pattern. **v0.1.2 patch (`e46778a`)** — user-reported Radix a11y console warning ("Missing Description or aria-describedby for DialogContent"). Added required `ariaDescription` prop on ComposerShell + sr-only `<DialogDescription>` + new `composerDescription` label key with a default explaining the 3 modes + close affordance. **v0.1.3 patch (`75acbba`)** — user request: "we must be able to pan and scale the visual content (2-finger touch + mouse/keyboard for PC)". New `usePanZoom` hook + Konva Stage scale/position wired. Touch 2-finger pinch+pan (single-finger drag still goes to text/sticker/drawing as before); desktop Ctrl/Cmd+wheel zoom anchored to cursor + arrow/+/-/0 keyboard. Min 1× / max 4×. Disabled during drawing (pointer-pipeline conflict) + cropping (DOM overlay can't follow stage transform). Reset-zoom CTA top-left when not at identity. Drawing-coord fix: `stage.getPointerPosition()` → `stage.getRelativePointerPosition()` so strokes stick at any zoom. **v0.1.4 patch (`c64df7a`)** — 3 user-reported issues fixed atomically: **(a)** PC Ctrl+wheel was zooming the whole browser — dropped Ctrl requirement; plain wheel over canvas zooms via native non-passive listener (React's `onWheel` is passive in modern browsers so `preventDefault` was a no-op); new required `targetRef` option on `usePanZoom`. **(b)** Crop tool removed from default `enabledTools` — stories are 9:16-locked by platform convention; consumers explicitly opt in for post-style composers. **(c)** Camera flicker root cause: photo mode was requesting mic permission (`audio: true` always), and if user denied mic while granting camera, `getUserMedia` rejected with `NotAllowedError` → status flipped to "denied" → auto-retry effect re-fired → infinite loop. Two fixes: renamed `recordAudio` option → `requestAudio` with default flipped `true` → `false`; only video mode requests mic via `requestAudio = mode === "video" && recordAudio` derivation. AND bounded the auto-retry effect via `autoRetryAttemptedRef` (fires at most once per granted-state transition; resets when status reaches "ready"). Mount effect deps on `requestAudio` so photo↔video re-acquires with the correct constraint. Final v0.1.4 verification: tsc + lint + meta-deps + registry:build + `pnpm build` (59 static pages) all clean. 20 commits total in single-day arc (15 chain + 5 patches). Closes the story-system trilogy: rail (discovery) + viewer (consumption) + composer (creation).
- **✅ 2026-05-30 SESSION CLOSE — story-viewer-01 v0.4.0 → v0.4.4 cube/swipe/readiness/docs arc (5 versions, single day)** ([decision](decisions/2026-05-30-story-viewer-01-v0.4.x-cube-swipe-arc.md)) — Continuation of the morning's v0.3.9 close. **v0.4.0** Instagram-canonical 3D cube transition between stories — pure CSS (Tailwind v4 `perspective-distant` + `@container` + `transform-3d` + `backface-hidden` + `translateZ(50cqw)` inline), no JS width measurement, no framer-motion. New hook `useCubeTransition` (internal) + new part `StoryCubeFace` (static ghost render). Mid-render `setState` pattern detects story-level cursor changes in the SAME React commit — no 1-frame flash. Angle driven via CSS variable + callback ref (no React renders per frame). New opt-outs `disableStoryTransition` + `storyTransitionDurationMs`. **v0.4.1** finger-following swipe gesture — pointer drag drives angle 1:1 at half-width=90°, prev+next ghosts mounted during drag, commit threshold 30% width OR 0.5 px/ms velocity, ×0.25 boundary resistance at first/last story. Conflicts handled: long-press cancelled on drag intent, tap-zone clicks suppressed via `swipeJustEnded` flag + `onClickCapture`. Mobile-fullscreen sizing fixed via Tailwind v4 `!` important suffix (shadcn's `sm:max-w-sm` was floating the modal at 384px on intermediate widths). Bundled docs page `overflow-x-hidden` + `wrap-break-word` for long feature bullets. Stability fixes: infinite-loop in `useEffect` dep on full `cube` object (destructured to stable `forceIdle` ref); tap-zones `aria-hidden` + focused-child (mousedown preventDefault). **v0.4.2** cube-engagement scale-jump fix — one-line CSS (prefix rotator with `translateZ(-50cqw)`) so front face lands at world z=0 (natural perspective plane) at idle — scale 1.0× at engagement (no jump from idle), shrinks DOWN to ≈0.857× as it rotates to ∓90°. **v0.4.3** full-component readiness review — 5 drift findings closed: 🚫 BLOCKER `registry.json` missing the 2 v0.4.0 cube files (would have broken consumer installs), `meta.context` + `registry.json.description` stale ("framer-motion v0.2 gate"), feature-count drift (1→7 vs actual 9 slots; 8 vs actual 12 opt-outs), `index.ts` barrel missing 17 public-API types, `usage.tsx` documented only v0.1. **v0.4.4** docs + demo alignment — `guide.md` major refresh (drop framer-motion claim from "5 rules"; rewrite engagement section for v0.3.5 collapsed-column + kebab-in-header; drop bookmark; extend slot table to 9 + opt-out table to 12; add v0.3.0/v0.3.1/v0.3.8/v0.3.9/v0.4.0/v0.4.1 sections; retitle "What's NOT in v0.1" → "Still out of scope (as of v0.4)" with a "now shipped" subsection); `demo.tsx` Multi-story tab renamed "Cube + swipe" with explainer + `disableStoryTransition` checkbox + `storyTransitionDurationMs` slider. Per-version planning docs intentionally frozen. Tip post-state-lock. Verification: tsc + meta-deps + registry:build all clean; artifact ships 28 files (was 26 pre-review). Deferred: smile-icon polish (engagement-bar-01 upstream) + live smoke verification post-deploy.
- **⏸ 2026-05-29 SESSION PAUSE — story-viewer-01 v0.2.0 → v0.3.9 rapid-iteration arc (18 commits, 9 versions, single day; tip `0d9d2cf`)** ([decision](decisions/2026-05-29-story-viewer-01-v0.3.x-arc-comments-share-link-drawer-heart-toggle.md)) — Resumed from v0.2.0 C6 pause + drained C7–C10 (render slots + 8 disable opt-outs + long-press + LinkCta + handle expansion + 4 demo tabs + GATE 3 spotcheck Pass-with-follow-ups), then iterated rapidly through visual review with the user. **v0.2.1** F-cross-13 viewer-shell `showCloseButton` patch (smoke-driven). **v0.2.2** `onAuthorClick` + polymorphic `authorComponent`. **v0.3.0** (BREAKING) bookmark removed + Instagram-style comments panel (`renderCommentsPanel` slot hosting `<CommentThread01 />` via demo, visual stack scales 0.55 when panel open + tap-shrunk-visual closes). **v0.3.1** share panel parallel (`renderSharePanel` hosting `<ShareMenu />` from engagement-bar-01) + generic `BottomSheet` chrome + scroll fix + icon size unification. **v0.3.2–v0.3.4** DM bar layout iterations driven by user screenshots — final state: full-width gradient (right-0), no Cancel button, no engagement fade. **v0.3.5** kebab moved from engagement column to ViewerHeader's right cluster + engagement icons collapsed by default + heart toggle reveals with bottom-to-top stagger (delays 0/75/150/200ms). **v0.3.6** DM input height shrink (override shadcn Textarea baked `min-h-16` via `[&_textarea]:min-h-9`). **v0.3.7** heart toggle moved inline with DM bar (z-32, right-3 bottom-3, aligned with avatar). **v0.3.8** LinkCta redesigned as top-anchored collapsible drawer (chip at top-16 right-3 → drawer with host preview + CTA + X). **v0.3.9** review cleanup pass — 4 new label keys (`linkCloseLabel` / `engagementShowLabel` / `engagementHideLabel` / `replyAriaLabel`), stale JSDoc fixes, `onActiveChange` marked `@deprecated`. Public API now ~62 props; zero v0.2.x consumer breakage post-v0.3.0 (only bookmark removal). Tailwind v4 supports bare numeric z-utilities natively (`z-31`, `z-32`, etc.) — IDE lint prefers them over bracket syntax. Open follow-ups queued in [handoff](HANDOFF-2026-05-29-story-viewer-01-v0.3.9-session-close.md): smile-icon reaction polish (needs engagement-bar-01 upstream `defaultReactionIcon`), v0.3 guide section + usage.tsx update, smoke harness re-run, optional GATE 3 spotcheck for v0.3.5+ surfaces.
- **✅ 2026-05-29 — story-viewer-01 v0.3.0 SHIPPED (comments panel + bookmark removal)** ([decision](decisions/2026-05-29-story-viewer-01-v0.3.0-comments-panel-and-bookmark-removal.md)) — User-flagged two changes during visual review of v0.2.x viewer-mode tab. (1) **Bookmark removed** from engagement overlay — stories aren't bookmarkable; owner-side `Save to highlights` in the kebab stays. `onBookmarkStory` prop deleted (breaking; TS flags at compile time; v0.2.x is days old so impact small). (2) **Instagram-style comments panel** — comment-icon tap now opens a bottom-sheet (~62% viewer height) holding the host-supplied comments thread via new `renderCommentsPanel?: (s,i,helpers) => ReactNode` slot. Visual stack above scales to 55% + translates up; tap on shrunk visual closes. Always-mounted (CommentThread01 draft state persists). Auto-pauses story timer. Auto-closes on cursor change. New `disableComments` opt-out for v0.2.x behavior. New `parts/comments-panel.tsx`. DM input semantic clarified — the always-visible bottom `<ReplyComposer>` is Direct Message to the story author (Instagram-canonical), NOT public comments. `onAddReply` callback name preserved. Demo's ViewerModeTab wires CommentThread01 with DUMMY_FLAT_COMMENTS + pageSize=5 + 300ms-simulated onLoadMore. GATE 1+2 skipped per user iteration-mode request; GATE 3 spotcheck Pass with follow-ups (5 findings, mostly v0.3.1 docs/polish). Also includes v0.2.2 author tap-target (`onAuthorClick` + polymorphic `authorComponent`) shipped earlier today.
- **✅ 2026-05-29 — story-viewer-01 v0.2.0 SHIPPED (engagement layer ship + C0–C10 chain closed)** ([decision](decisions/2026-05-29-story-viewer-01-v0.2.0-engagement-layer-ship.md)) — Resumed mid-chain from `90af2db` C6 pause. **C7** wired the 4 v0.2.0 default-part render slots (renderHeader / renderProgress / renderNavArrows / renderTapZones) at the outer level — consistent with the C3/C4/C5 slot pattern (documented deviation from the plan's "files: 4 parts" — simpler, no behavior change). **C8** finished the 5 remaining disable opt-outs (disableTapZones / disableKeyboardNav / disableNavArrows / disableAutoClose / disableProgressBars); `useStoryKeyboardNav` gained an `enabled` opt + `useStoryViewerState` gained a `disableAutoClose` opt. **C9** added the `useLongPressPause` hook (Instagram-canonical mobile gesture, 200ms default, additive on v0.1 tap-pause) and the `<LinkCta>` part with polymorphic `linkComponent` root (F-cross-13 safe). **C10** retired the 3 C6-era `props as { ... }` type-assertion blocks by hoisting the kebab mutation handlers onto `StoryViewer01Props` (post-card-01 v0.2.0 convention); wired the 5 v0.2.0 imperative handle methods (trigger* via refs to keep handle identity stable while reading current cursor + engagement state); expanded dummy-data with viewerCount/viewers/link/reactionKinds; added 4 demo tabs (ViewerMode / OwnerMode / CustomSlots / LinkAndLongPress); bumped meta.ts to 0.2.0 with 13 new feature bullets (dependencies.shadcn unchanged — kebab DropdownMenu dependency avoided per C6 bottom-sheet deviation); extended guide.md with a full v0.2.0 section (engagement / reply / owner / kebab placement / slots / disable matrix / long-press / link / handle / engagementSubscribe); GATE 3 spotcheck verdict **Pass with follow-ups** (5 findings — F-01 triggerReply content stub (v0.2.1 docs + v0.2.2 substrate), F-02 LikersStrip cast (v0.3.0), F-03 engagement-overlay vs composer visual offset (v0.2.1), F-04 long-press race docs (v0.2.1), F-05 disableEngagement + kebab pairing docs (v0.2.1)). Zero v0.1.x consumer breakage (every v0.2.0 surface opt-in). Bundled story-rail-01 v0.2.1 docs patch already shipped in C0. Smoke harness run pending immediately post-push.
Older entries trimmed 2026-06-01 per the lean-snapshot convention (kept 5 most-recent). Recently trimmed but still meaningful: 2026-05-28 post-card-01 v0.3.0 + comment-thread-01 v0.2.0 ships (ILX-3 + ILX-4) — [decision](decisions/2026-05-28-ilx-3-and-ilx-4-moderator-and-edited-comment.md); cms-panel-01 GATE 1 in-flight (surfaced via the active handoff banner above); library tier system charter ([decision](decisions/2026-05-25-library-tier-system-charter.md)); 2026-05-25 STATUS.md slim-down. All entries since 2026-05-09 still live at [`.claude/decisions/`](decisions/) — every shipped component, gate closure, or substantive decision has its own dated file. Slug-grep is the search interface.

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
