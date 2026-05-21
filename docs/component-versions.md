# Component Versions

Snapshot of every shipped procomponent in the registry, with version + release status. Pulled directly from each component's `src/registry/components/<category>/<slug>/meta.ts`.

> Snapshot date: **2026-05-17** (**rich-card-in-flow v0.2.0 SHIPPED — port editor (Workstream B)**: adds `PortEditorStrip` — opt-in editor for the ports carried by each rich-card canvas node or its `__rcid`-tagged subcards. Six editable fields per port (id / type / side / dir / multi / label); live-save; add-popover with `[✓in][✓out]` atomic create-flow that splits to `{base}-in` / `{base}-out` rows after save (Q3 lock); doc-port type forces `bottom` side editor-side (Q4 lock); orphan-doc-target tooltip on doc-typed ports today (Q-O2 lock — separate doc-file procomp will resolve in v0.3+). No breaking changes vs v0.1.0. New public surface: `PortEditorStrip` + `PortEditorPermissions` + `PortField` union. shadcn primitive deps grew 0→7 (popover/select/checkbox/input/tooltip/label/button). Uncontrolled-by-design (Q9 lock). 8 implementation commits + B4 (registry distribution + path-b smoke + 3 primitive-divergence fixes — see F-cross-13 below). GATE 3 spotcheck Pass with follow-ups; rotating dim Public API; 3 findings (F-01 F-cross-13 closed pre-ship; F-02 per-field ports + F-03 custom port-type registration both v0.3 candidates). See [decision file](../.claude/decisions/2026-05-17-rich-card-in-flow-v0.2.0-port-editor.md). **flow-canvas-01 v0.2.5 SHIPPED — built-in `"doc"` port type (Workstream A prerequisite)**: one-line `defaultPortTypes` add — `{ id: "doc", color: "var(--chart-3)", label: "Doc" }`. Required upstream for rcif v0.2.0's PortEditorStrip — doc-port type is the only port type with editor-side side-enforcement (auto-corrects to `bottom`). Runtime stays neutral about doc ports. Patch-bump exemption per readiness-review rule — additive, non-breaking, no public-API touch; GATE 3 skipped, v0.2.0 spotcheck verdict carries forward. See [decision file](../.claude/decisions/2026-05-17-flow-canvas-v0.2.5-doc-port-type.md). **NEW F-cross-13 (Medium) — shadcn primitive Radix → Base UI divergence**: producer ships Radix-based primitives but `shadcn@4.6.0 add` ships Base UI primitives; `TooltipProvider.delayDuration` (Radix) vs `delay` (Base UI); `Select.onValueChange` is `(v: string)` on Radix vs `(v: string | null, eventDetails)` on Base UI. Path (a) defensive callback pattern shipped per-procomp in rcif v0.2.0 B4 (parameter contravariance — widen onValueChange to `(v: string | null)` to satisfy both backends); path (b) producer-primitive refresh = standalone hygiene task. See [`docs/reviews/sweep-tracker.md`](reviews/sweep-tracker.md) F-cross-13. **Earlier today: rich-card v0.4.2 SHIPPED — empty-card add-affordances fix**: lifted `+ FIELD` / `+ BLOCK` action row out of the `hasBody`-gated body wrapper in `parts/card.tsx` so empty cards (zero fields, zero predefined) — including any freshly-added child card — can be populated through the UI. Pre-v0.4.2, `dispatchers.cardAdd` created `fields:[]/predefined:[]` cards that had only `+ CHILD` exposed (nestable, never fillable). Surfaced during a post-v0.2.4 rich-card-in-flow editor audit; user-reported "ADD BLOCK options disappear" + "root has no add options" turned out to be by-design and a misperception respectively, but the investigation surfaced THIS distinct latent bug. Patch-bump exemption — GATE 3 skipped, rich-card stays `beta`. Earlier today: **flow-canvas-01 v0.2.4 SHIPPED — suppress mid-drag onChange + microtask-time drag guard**: third and final follow-up in the v0.2.2 → v0.2.3 → v0.2.4 controlled-mode saga. After v0.2.3, xyflow's #015 "trying to drag a node that is not initialized" warning was STILL firing during drag (10–20+ per drag) — mid-drag mixed batches slipped through the position-only short-circuit, queued microtasks via v0.2.2's defer, by microtask-fire time further drag ticks had moved internal state on, and v0.2.3's structural-check correctly identified the divergence but its "fix" (wholesale replace) wiped `measured` → #015 next tick. Two complementary defenses in `hooks/use-canvas-data.ts`: (1) `onNodesChange` suppresses ALL consumer onChange during drag (not just position-only batches); (2) `fireOnChange` microtask checks `isDraggingRef` at fire time + bails early if drag in progress. `onNodeDragStop` continues flushing the single authoritative post-drag snapshot. Patch-bump exemption — GATE 3 skipped. v0.2.4 is the floor for safe controlled-mode use. Earlier: v0.2.3 round-trip echo guard via `canvasMatchesInternalState` (still load-bearing for steady-state round-trips). Earlier: v0.2.2 setState-during-render fix (`queueMicrotask` wrap of `fireOnChange`). Earlier (2026-05-16): **rich-card-in-flow v0.1.0 SHIPPED**: 43rd component, canonical implementation of flow-canvas-01@v0.2.0's popup-edit renderer convention. flow-canvas-01 v0.2.1 (`onEditRequest` API + `updateNodeData` helper). v0.2.0 Tier 1 + Tier 2 perf bundle.)
> Total: **45 components** across **8 categories**
>
> **Updated 2026-05-20** (additive to 2026-05-17 snapshot above): **todo-rich-card v0.1.0 → v0.1.1 SHIPPED** — first ship was the time-aware task card sibling to rich-card (full detail in [`decisions/2026-05-20-todo-rich-card-v0.1.0-first-ship.md`](../.claude/decisions/2026-05-20-todo-rich-card-v0.1.0-first-ship.md)); same-day F-cross-13 patch loop ([`decisions/2026-05-20-todo-rich-card-v0.1.1-f-cross-13-fix.md`](../.claude/decisions/2026-05-20-todo-rich-card-v0.1.1-f-cross-13-fix.md)) widened Select.onValueChange callbacks + dropped TooltipProvider.delayDuration; F-04 closed. **todo-tree v0.1.0 scaffolded** (C1 of C1–C11 chain per [todo-tree-procomp-plan.md §18](procomps/todo-tree-procomp/todo-tree-procomp-plan.md#18-implementation-order-commit-chain)) — single feature-complete v0.1, no v0.2/v0.3 deferrals; full type catalog locked, stub component renders; implementation lands across C2–C11. **Live rich+kanban composition demo** added to todo-rich-card detail page (docs-only).
>
> **Updated 2026-05-21 (later)** (additive): **todo-tree v0.1.2 SHIPPED** — same-day follow-on after v0.1.1's GATE 3 review. Closes F-perm (keyboard Space/Delete now consult the declarative permissions matrix + `item.locked` + `readOnly`, fire `onPermissionDenied` on denial) and ships a UX/API batch: new `editable` prop (gates the toolbar "+ New" button + bulk Delete), new `createItem` factory (built-in fallback uses `statusOptions[0]`), new `onCreateRequest` hook + deferred-commit pending-item flow in `<TodoTreeWithEditor>` (dialog opens immediately on "+ New"; Submit commits, Cancel discards), F-grip-clip closed (grip moved from `absolute -left-4` into the row's flex flow), Dialog width 1.5× + scroll cap + `aria-describedby={undefined}` + Radix focus-blur race fix. Public-API additive — no breakage. v0.1.2 GATE 3 spotcheck file at [reviews/2026-05-21-v0.1.2-spotcheck.md](procomps/todo-tree-procomp/reviews/2026-05-21-v0.1.2-spotcheck.md).
>
> **Updated 2026-05-21** (additive): **todo-tree v0.1.0 → v0.1.1 SHIPPED** — 45th component formally closed under the GATE 3 readiness-review rule. C1–C11 of plan §18 chain complete; commit chain `aa623a0..5aba0cd` (19 commits incl. 6 audit fixups). 48 base + 1 fixtures = 49 files via registry. Same-day F-cross-13 patch loop ([`decisions/2026-05-21-todo-tree-v0.1.0-and-v0.1.1-first-ship.md`](../.claude/decisions/2026-05-21-todo-tree-v0.1.0-and-v0.1.1-first-ship.md)) replaced `=== "indeterminate"` check at `parts/todo-tree-checkbox.tsx:37` with `typeof next === "boolean" ? next : true` — third same-day F-cross-13 patch loop in a row; adds **Checkbox.onCheckedChange to the carrier list** alongside Select.onValueChange + TooltipProvider.delayDuration. F-S1 verified clean (third same-category cross-procomp ship to pass; lock now battle-tested project default). GATE 3 spotcheck **Pass with follow-ups** ([reviews/2026-05-21-v0.1.1-spotcheck.md](procomps/todo-tree-procomp/reviews/2026-05-21-v0.1.1-spotcheck.md)) — rotating dim Public API; 5 findings (F-perm Medium permissions matrix not threaded through keyboard handlers v0.1.2 candidate; F-event Low Enter handler event-union widening walkthrough; F-grip-clip Low cosmetic; F-04 High path-b smoke closed in v0.1.1; F-html5-edge Low HTML5 drops no edge-zone v0.2 candidate). Procomp guide.md authored at C11. 45 components total — todo-tree promoted from scaffold to shipped.
>
> Source of truth: `meta.ts` per component (this doc is a generated snapshot — re-run when versions change)

## Summary

| Category   | Count | Notes                                                                 |
|------------|-------|-----------------------------------------------------------------------|
| `data`     | 24    | Largest category; hosts the canonical `data-table` template + `stat-card` + `rich-card-in-flow` (2026-05-16) + `todo-rich-card` (2026-05-20) + `todo-tree` (2026-05-20 scaffold) |
| `forms`    | 7     | `json-form` added 2026-05-13 (first cross-registry `dependencies.internal` consumer; lazy-loads `@ilinxa/code-block`) |
| `marketing`| 4     |                                                                       |
| `media`    | 4     | `pdf-viewer` added 2026-05-10                                         |
| `navigation`| 2    | New category 2026-05-10 (`file-tree` + `file-manager`)               |
| `layout`   | 2     |                                                                       |
| `code`     | 1     | New category 2026-05-11 (`code-block`)                                |
| `feedback` | 1     |                                                                       |
| **Total**  | **45**|                                                                       |

## Highlights

- **Past beta gate:** `rich-card` only — v0.4.2, status `beta` (v0.4.2 patch 2026-05-17: empty-card add-affordances fix; lifted `+ FIELD` / `+ BLOCK` row out of the `hasBody` wrapper so freshly-added child cards can be populated through the UI; see [decision file](../.claude/decisions/2026-05-17-rich-card-v0.4.2-empty-card-add-affordances.md)).
- **v0.3.x:** `kanban-board-01` (F-cross-12 v0.2 cutover).
- **v0.2.x:** `flow-canvas-01` (v0.2.5 — additive built-in `"doc"` port type in `defaultPortTypes` for use by `rich-card-in-flow@v0.2.0`'s port editor; patch-bump exemption — no GATE 3; see [decision file](../.claude/decisions/2026-05-17-flow-canvas-v0.2.5-doc-port-type.md). v0.2.4 — third and final follow-up in the controlled-mode saga: suppresses ALL consumer onChange during drag (not just position-only batches) + fireOnChange microtask bails if drag started post-queue; closes the stale-snapshot race that v0.2.3's structural-check correctly identified but couldn't fix without wiping `measured`; v0.2.4 is the floor for safe controlled-mode use; see [decision file](../.claude/decisions/2026-05-17-flow-canvas-v0.2.4-stale-snapshot-fix.md). v0.2.3 — round-trip echo guard; structural-equality check in controlled-mode useEffect skips wholesale-replace of xyflow internal node refs when consumer's new data prop matches current internal state; still load-bearing for steady-state round-trips; see [decision file](../.claude/decisions/2026-05-16-flow-canvas-v0.2.3-resync-echo-guard.md). v0.2.2 — setState-during-render fix; `fireOnChange` body wrapped in `queueMicrotask` so all 13 reducer-side-effect sites in `use-canvas-data.ts` uniformly defer consumer notify to post-commit; promotes the v0.3-deferred F-V4 cleanup forward; surfaced by `rich-card-in-flow@v0.1.0`'s demo (first controlled-mode consumer); patch-bump exemption — no GATE 3; see [decision file](../.claude/decisions/2026-05-16-flow-canvas-v0.2.2-microtask-defer.md). v0.2.1 — additive `onEditRequest` API on `FlowCanvasProps` + `RenderContext` + new exported `updateNodeData` helper; popup-edit renderer convention canonical first consumer is `rich-card-in-flow@v0.1.0` (now shipped); patch-bump exemption — no GATE 3; see [decision file](../.claude/decisions/2026-05-16-flow-canvas-v0.2.1-on-edit-request.md). v0.2.0 — Tier 1 + Tier 2 perf bundle: default flip + drag-batching + narrow `portEqual` + CSS-driven selection ring + new `lib/shallow.ts` + sealed-folder `flow-canvas-01.css`; one default flip + one soft behavior change + zero breaking type changes; see [decision file](../.claude/decisions/2026-05-16-flow-canvas-v0.2.0-perf-bundle.md)), `article-body-01`, `grid-layout-news-01` + `content-card-news-01` + `project-card-01` + `story-rail-01` (F-cross-12 v0.2 cutover — positional callbacks removed; canonical names now object-shape).
- **v0.1.4 (now superseded by v0.2.0):** `flow-canvas-01` patch — custom-json renderer was missing `<PortsAt>` calls for declared ports; xyflow's edge layer failed `getEdgePosition` thousands of times per second and warning-spammed the console; ~6-line fix = 15-20× FPS improvement at the light-fixture cliff; surfaced during v0.2 perf-tier pre-work.
- **v0.1.3:** `pdf-viewer` (AnnotationLayer fix — wrap page list in `<Document className="contents">`); `flow-canvas-01` (paint-side perf patch — `defaultViewport` snapshot + collapsed `<CustomJsonNode>` no-`<pre>` hot path; preceded by v0.1.2 cascading-callback round).
- **v0.1.2:** `engagement-bar-01` (Phase 7 utils→lib), `media-carousel-01` (Phase 7 a11y), `progress-timeline-01` (Phase 7 status colors), `page-hero-news-01` (Phase 7 lime mandate), `video-player-01` (Pexels CDN fixture swap).
- **v0.1.1 (patch shipped):** `post-card-01`, `data-table`, `flow-canvas-01`, `entity-picker`, `markdown-editor`, `properties-form`, `workspace`, plus Phase 7 batch — `event-card-01`, `registration-card-01`, `detail-panel`, `story-viewer-01`, `grid-layout-news-01`. `stat-card` patched 2026-05-09.
- **All remaining components** sit at the initial v0.1.0 ship.
- **New 2026-05-10:** `pdf-viewer` (media), `file-tree` (new `navigation` category), `file-manager` (navigation, composes file-tree + ships shared `@ilinxa/file-clipboard` primitive).
- **New 2026-05-11:** `code-block` (new `code` category at order 9 — Shiki dual-theme + CodeMirror 6 + custom HighlightStyle; substrate for chat/markdown/rich-card/terminal surfaces).
- **New 2026-05-16:** `rich-card-in-flow` (data; canonical implementation of flow-canvas-01@v0.2.0 perf description Q33's popup-edit renderer convention; cross-registry deps on `@ilinxa/rich-card` + `@ilinxa/flow-canvas-01@^0.2.1`; F-V2 smoke harness path-b PASS after F-S1 fix-up; GATE 3 Pass with follow-ups). **Bumped 2026-05-17 to v0.2.0** — opt-in `PortEditorStrip` for per-card / per-subcard port editing (id / type / side / dir / multi / label); cross-registry dep bumped to `@ilinxa/flow-canvas-01@^0.2.5` for the built-in `"doc"` port type; new F-cross-13 (shadcn primitive Radix→Base UI divergence) surfaced + closed via defensive callback pattern in B4. See [decision file](../.claude/decisions/2026-05-17-rich-card-in-flow-v0.2.0-port-editor.md).
- `force-graph` was **removed 2026-05-08** pending recreation under a new design + plan. v0.2 source + procomp docs archived to `docs/migrations/force-graph/`. The future v3 will go through the standard procomp planning pipeline.
- `flow-canvas-01` v0.1.0 is feature-rich despite the version (39 files; renderers/portTypes/edgeTypes registries; typed-port validation; sub-object drag-extract; right-click menus; 200-node stress demo).

## data (24)

| Slug                    | Name                       | Version | Status |
|-------------------------|----------------------------|---------|--------|
| `rich-card`             | Rich Card                  | 0.4.2   | beta   |
| `article-body-01`       | Article Body 01            | 0.2.0   | alpha  |
| `kanban-board-01`       | Kanban Board 01            | 0.3.0   | alpha  |
| `engagement-bar-01`     | Engagement Bar 01          | 0.1.2   | alpha  |
| `post-card-01`          | Post Card 01               | 0.1.1   | alpha  |
| `article-meta-01`       | Article Meta 01            | 0.1.0   | alpha  |
| `comment-thread-01`     | Comment Thread 01          | 0.1.0   | alpha  |
| `content-card-news-01`  | Content Card (News 01)     | 0.2.0   | alpha  |
| `data-table`            | Data Table                 | 0.1.1   | alpha  |
| `event-card-01`         | Event Card 01              | 0.1.1   | alpha  |
| `expandable-text-01`    | Expandable Text 01         | 0.1.0   | alpha  |
| `flow-canvas-01`        | Flow Canvas                | 0.2.5   | alpha  |
| `info-list-01`          | Info List 01               | 0.1.0   | alpha  |
| `people-grid-01`        | People Grid 01             | 0.1.0   | alpha  |
| `progress-timeline-01`  | Progress Timeline 01       | 0.1.2   | alpha  |
| `project-card-01`       | Project Card 01            | 0.2.0   | alpha  |
| `registration-card-01`  | Registration Card 01       | 0.1.1   | alpha  |
| `schedule-list-01`      | Schedule List 01           | 0.1.0   | alpha  |
| `story-rail-01`         | Story Rail 01              | 0.2.0   | alpha  |
| `thumb-list-01`         | Thumb List 01              | 0.1.0   | alpha  |
| `stat-card`             | Stat Card                  | 0.1.1   | alpha  |
| `rich-card-in-flow`     | Rich Card in Flow          | 0.2.0   | alpha  |
| `todo-rich-card`        | Todo Rich Card             | 0.1.1   | alpha  |
| `todo-tree`             | Todo Tree                  | 0.1.2   | alpha  |

## forms (6)

| Slug                | Name              | Version | Status |
|---------------------|-------------------|---------|--------|
| `category-cloud-01` | Category Cloud 01 | 0.1.0   | alpha  |
| `entity-picker`     | Entity Picker     | 0.1.1   | alpha  |
| `filter-bar-01`     | Filter Bar 01     | 0.1.0   | alpha  |
| `filter-stack`      | Filter Stack      | 0.1.0   | alpha  |
| `markdown-editor`   | Markdown Editor   | 0.1.1   | alpha  |
| `properties-form`   | Properties Form   | 0.1.1   | alpha  |

## layout (2)

| Slug                  | Name                    | Version | Status |
|-----------------------|-------------------------|---------|--------|
| `grid-layout-news-01` | Grid Layout (News 01)   | 0.2.0   | alpha  |
| `workspace`           | Workspace               | 0.1.1   | alpha  |

## marketing (4)

| Slug                   | Name                | Version | Status |
|------------------------|---------------------|---------|--------|
| `author-card-01`       | Author Card 01      | 0.1.0   | alpha  |
| `newsletter-card-01`   | Newsletter Card 01  | 0.1.0   | alpha  |
| `page-hero-news-01`    | Page Hero (News 01) | 0.1.2   | alpha  |
| `share-bar-01`         | Share Bar 01        | 0.1.0   | alpha  |

## media (4)

| Slug                | Name              | Version | Status |
|---------------------|-------------------|---------|--------|
| `media-carousel-01` | Media Carousel 01 | 0.1.2   | alpha  |
| `pdf-viewer`        | PDF Viewer        | 0.1.3   | alpha  |
| `story-viewer-01`   | Story Viewer 01   | 0.1.1   | alpha  |
| `video-player-01`   | Video Player 01   | 0.1.2   | alpha  |

## navigation (2)

| Slug            | Name          | Version | Status |
|-----------------|---------------|---------|--------|
| `file-tree`     | File Tree     | 0.1.0   | alpha  |
| `file-manager`  | File Manager  | 0.1.0   | alpha  |

## code (1)

| Slug          | Name        | Version | Status |
|---------------|-------------|---------|--------|
| `code-block`  | Code Block  | 0.1.0   | alpha  |

## feedback (1)

| Slug           | Name         | Version | Status |
|----------------|--------------|---------|--------|
| `detail-panel` | Detail Panel | 0.1.1   | alpha  |

---

## Verification method

Counts cross-checked three ways and all agreed at **41**:

1. **Filesystem:** `ls src/registry/components/<category>/` per category — 21 + 6 + 2 + 4 + 4 + 2 + 1 + 1 = 41.
2. **Manifest:** `src/registry/manifest.ts` REGISTRY array has 41 entries (each component has 3 imports — Demo / Usage / meta — plus 2 type-and-categories imports at the bottom).
3. **Per-component meta:** every directory contains a `meta.ts` with populated `slug`, `category`, `version`, and `status` fields, and each is registered in `REGISTRY` in the manifest.

The `_template/_template/` folder is excluded — it ships its own placeholder `meta.ts` for `tsc` compatibility but is never registered or installable.

Cross-component shared primitives (e.g., `@ilinxa/file-clipboard` shipped at `src/registry/components/navigation/_shared/`) are NOT counted as components — they ship as separate registry items but are not registered in the manifest's REGISTRY array.

> **Removed 2026-05-08:** `force-graph` v0.2.0 (data) — pending recreation. v0.2 source + procomp docs archived to `docs/migrations/force-graph/`.
