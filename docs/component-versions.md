# Component Versions

Snapshot of every shipped procomponent in the registry, with version + release status. Pulled directly from each component's `src/registry/components/<category>/<slug>/meta.ts`.

> Snapshot date: **2026-05-16** (**flow-canvas-01 v0.2.3 SHIPPED — round-trip echo guard for controlled-mode resync**: follow-up to v0.2.2. After microtask defer silenced "setState during render", xyflow's "trying to drag a node that is not initialized" started firing. New private helper `canvasMatchesInternalState` does structural comparison; useEffect skips resync when consumer's new data prop matches current internal state. v0.2.3 is the floor for safe controlled-mode use. Earlier today: **v0.2.2 setState-during-render fix** (`queueMicrotask` wrap of `fireOnChange`), **rich-card-in-flow v0.1.0 SHIPPED — Workstream B**: 43rd component, new sealed folder under `data/` category. Canonical implementation of the popup-edit renderer convention from flow-canvas-01@v0.2.0 perf description Q33: read-only `RichCardViewer` renderer + consumer-owned-dialog pattern; `RichCardCanvasNode = NodeData & RichCardJsonNode` intersection (F-V6 lock); subPath = rich-card `__rcid` + imperative `RichCardHandle.focusCard(id)` via ref (F-02 lock); F-V2 smoke harness path-b passed after F-S1 cross-procomp import fix-up cycle. GATE 3 Pass with follow-ups. Earlier today: flow-canvas-01 v0.2.1 SHIPPED — Workstream A: `onEditRequest` API + `updateNodeData` helper. Earlier today: v0.2.0 Tier 1 + Tier 2 perf bundle.)
> Total: **43 components** across **8 categories**
> Source of truth: `meta.ts` per component (this doc is a generated snapshot — re-run when versions change)

## Summary

| Category   | Count | Notes                                                                 |
|------------|-------|-----------------------------------------------------------------------|
| `data`     | 22    | Largest category; hosts the canonical `data-table` template + `stat-card` + new `rich-card-in-flow` (2026-05-16) |
| `forms`    | 7     | `json-form` added 2026-05-13 (first cross-registry `dependencies.internal` consumer; lazy-loads `@ilinxa/code-block`) |
| `marketing`| 4     |                                                                       |
| `media`    | 4     | `pdf-viewer` added 2026-05-10                                         |
| `navigation`| 2    | New category 2026-05-10 (`file-tree` + `file-manager`)               |
| `layout`   | 2     |                                                                       |
| `code`     | 1     | New category 2026-05-11 (`code-block`)                                |
| `feedback` | 1     |                                                                       |
| **Total**  | **43**|                                                                       |

## Highlights

- **Past beta gate:** `rich-card` only — v0.4.1, status `beta`.
- **v0.3.x:** `kanban-board-01` (F-cross-12 v0.2 cutover).
- **v0.2.x:** `flow-canvas-01` (v0.2.3 — round-trip echo guard; structural-equality check in controlled-mode useEffect skips wholesale-replace of xyflow internal node refs when consumer's new data prop matches current internal state; fixes xyflow's "trying to drag a node that is not initialized" warning that surfaced post-v0.2.2; v0.2.3 is the floor for safe controlled-mode use; see [decision file](../.claude/decisions/2026-05-16-flow-canvas-v0.2.3-resync-echo-guard.md). v0.2.2 — setState-during-render fix; `fireOnChange` body wrapped in `queueMicrotask` so all 13 reducer-side-effect sites in `use-canvas-data.ts` uniformly defer consumer notify to post-commit; promotes the v0.3-deferred F-V4 cleanup forward; surfaced by `rich-card-in-flow@v0.1.0`'s demo (first controlled-mode consumer); patch-bump exemption — no GATE 3; see [decision file](../.claude/decisions/2026-05-16-flow-canvas-v0.2.2-microtask-defer.md). v0.2.1 — additive `onEditRequest` API on `FlowCanvasProps` + `RenderContext` + new exported `updateNodeData` helper; popup-edit renderer convention canonical first consumer is `rich-card-in-flow@v0.1.0` (now shipped); patch-bump exemption — no GATE 3; see [decision file](../.claude/decisions/2026-05-16-flow-canvas-v0.2.1-on-edit-request.md). v0.2.0 — Tier 1 + Tier 2 perf bundle: default flip + drag-batching + narrow `portEqual` + CSS-driven selection ring + new `lib/shallow.ts` + sealed-folder `flow-canvas-01.css`; one default flip + one soft behavior change + zero breaking type changes; see [decision file](../.claude/decisions/2026-05-16-flow-canvas-v0.2.0-perf-bundle.md)), `article-body-01`, `grid-layout-news-01` + `content-card-news-01` + `project-card-01` + `story-rail-01` (F-cross-12 v0.2 cutover — positional callbacks removed; canonical names now object-shape).
- **v0.1.4 (now superseded by v0.2.0):** `flow-canvas-01` patch — custom-json renderer was missing `<PortsAt>` calls for declared ports; xyflow's edge layer failed `getEdgePosition` thousands of times per second and warning-spammed the console; ~6-line fix = 15-20× FPS improvement at the light-fixture cliff; surfaced during v0.2 perf-tier pre-work.
- **v0.1.3:** `pdf-viewer` (AnnotationLayer fix — wrap page list in `<Document className="contents">`); `flow-canvas-01` (paint-side perf patch — `defaultViewport` snapshot + collapsed `<CustomJsonNode>` no-`<pre>` hot path; preceded by v0.1.2 cascading-callback round).
- **v0.1.2:** `engagement-bar-01` (Phase 7 utils→lib), `media-carousel-01` (Phase 7 a11y), `progress-timeline-01` (Phase 7 status colors), `page-hero-news-01` (Phase 7 lime mandate), `video-player-01` (Pexels CDN fixture swap).
- **v0.1.1 (patch shipped):** `post-card-01`, `data-table`, `flow-canvas-01`, `entity-picker`, `markdown-editor`, `properties-form`, `workspace`, plus Phase 7 batch — `event-card-01`, `registration-card-01`, `detail-panel`, `story-viewer-01`, `grid-layout-news-01`. `stat-card` patched 2026-05-09.
- **All remaining components** sit at the initial v0.1.0 ship.
- **New 2026-05-10:** `pdf-viewer` (media), `file-tree` (new `navigation` category), `file-manager` (navigation, composes file-tree + ships shared `@ilinxa/file-clipboard` primitive).
- **New 2026-05-11:** `code-block` (new `code` category at order 9 — Shiki dual-theme + CodeMirror 6 + custom HighlightStyle; substrate for chat/markdown/rich-card/terminal surfaces).
- **New 2026-05-16:** `rich-card-in-flow` (data; canonical implementation of flow-canvas-01@v0.2.0 perf description Q33's popup-edit renderer convention; cross-registry deps on `@ilinxa/rich-card` + `@ilinxa/flow-canvas-01@^0.2.1`; F-V2 smoke harness path-b PASS after F-S1 fix-up; GATE 3 Pass with follow-ups).
- `force-graph` was **removed 2026-05-08** pending recreation under a new design + plan. v0.2 source + procomp docs archived to `docs/migrations/force-graph/`. The future v3 will go through the standard procomp planning pipeline.
- `flow-canvas-01` v0.1.0 is feature-rich despite the version (39 files; renderers/portTypes/edgeTypes registries; typed-port validation; sub-object drag-extract; right-click menus; 200-node stress demo).

## data (22)

| Slug                    | Name                       | Version | Status |
|-------------------------|----------------------------|---------|--------|
| `rich-card`             | Rich Card                  | 0.4.1   | beta   |
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
| `flow-canvas-01`        | Flow Canvas                | 0.2.3   | alpha  |
| `info-list-01`          | Info List 01               | 0.1.0   | alpha  |
| `people-grid-01`        | People Grid 01             | 0.1.0   | alpha  |
| `progress-timeline-01`  | Progress Timeline 01       | 0.1.2   | alpha  |
| `project-card-01`       | Project Card 01            | 0.2.0   | alpha  |
| `registration-card-01`  | Registration Card 01       | 0.1.1   | alpha  |
| `schedule-list-01`      | Schedule List 01           | 0.1.0   | alpha  |
| `story-rail-01`         | Story Rail 01              | 0.2.0   | alpha  |
| `thumb-list-01`         | Thumb List 01              | 0.1.0   | alpha  |
| `stat-card`             | Stat Card                  | 0.1.1   | alpha  |
| `rich-card-in-flow`     | Rich Card in Flow          | 0.1.0   | alpha  |

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
