# Component Versions

Snapshot of every shipped procomponent in the registry, with version + release status. Pulled directly from each component's `src/registry/components/<category>/<slug>/meta.ts`.

> Snapshot date: **2026-05-09** (post-Phase-7 patches + first new component under the readiness-review rule: stat-card v0.1.0)
> Total: **36 components** across 6 categories
> Source of truth: `meta.ts` per component (this doc is a generated snapshot — re-run when versions change)

## Summary

| Category   | Count | Notes                                                                 |
|------------|-------|-----------------------------------------------------------------------|
| `data`     | 21    | Largest category; hosts the canonical `data-table` template + `stat-card` |
| `forms`    | 6     |                                                                       |
| `marketing`| 4     |                                                                       |
| `media`    | 3     |                                                                       |
| `layout`   | 2     |                                                                       |
| `feedback` | 1     |                                                                       |
| **Total**  | **37**|                                                                       |

## Highlights

- **Past beta gate:** `rich-card` only — v0.4.1, status `beta`.
- **v0.3.x:** `kanban-board-01` (F-cross-12 v0.2 cutover; see Highlights below).
- **v0.2.x:** `article-body-01`, `grid-layout-news-01` + `content-card-news-01` + `project-card-01` + `story-rail-01` (F-cross-12 v0.2 cutover — positional callbacks removed; canonical names now object-shape).
- **v0.1.2:** `engagement-bar-01` (Phase 7 utils→lib), `media-carousel-01` (Phase 7 a11y), `progress-timeline-01` (Phase 7 status colors → audit follow-up marker differentiation), `page-hero-news-01` (Phase 7 lime mandate → audit follow-up `text-accent` carriers).
- **v0.1.1 (patch shipped):** `post-card-01`, `data-table`, `flow-canvas-01`, `entity-picker`, `markdown-editor`, `properties-form`, `workspace`, plus Phase 7 batch — `event-card-01`, `registration-card-01`, `detail-panel`, `story-viewer-01`, `video-player-01`, `grid-layout-news-01`.
- **All remaining components** sit at the initial v0.1.0 ship.
- `force-graph` was **removed 2026-05-08** pending recreation under a new design + plan. v0.2 source + procomp docs archived to `docs/migrations/force-graph/`. The future v3 will go through the standard procomp planning pipeline; whether it reuses the `force-graph` slug or picks a new one (e.g. `graph-canvas-01`) is a v3 decision.
- `flow-canvas-01` v0.1.0 is feature-rich despite the version (39 files; renderers/portTypes/edgeTypes registries; typed-port validation; sub-object drag-extract; right-click menus; 200-node stress demo).

## data (20)

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
| `flow-canvas-01`        | Flow Canvas                | 0.1.1   | alpha  |
| `info-list-01`          | Info List 01               | 0.1.0   | alpha  |
| `people-grid-01`        | People Grid 01             | 0.1.0   | alpha  |
| `progress-timeline-01`  | Progress Timeline 01       | 0.1.2   | alpha  |
| `project-card-01`       | Project Card 01            | 0.2.0   | alpha  |
| `registration-card-01`  | Registration Card 01       | 0.1.1   | alpha  |
| `schedule-list-01`      | Schedule List 01           | 0.1.0   | alpha  |
| `story-rail-01`         | Story Rail 01              | 0.2.0   | alpha  |
| `thumb-list-01`         | Thumb List 01              | 0.1.0   | alpha  |
| `stat-card`             | Stat Card                  | 0.1.1   | alpha  |

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

## media (3)

| Slug                | Name              | Version | Status |
|---------------------|-------------------|---------|--------|
| `media-carousel-01` | Media Carousel 01 | 0.1.2   | alpha  |
| `story-viewer-01`   | Story Viewer 01   | 0.1.1   | alpha  |
| `video-player-01`   | Video Player 01   | 0.1.1   | alpha  |

## feedback (1)

| Slug           | Name         | Version | Status |
|----------------|--------------|---------|--------|
| `detail-panel` | Detail Panel | 0.1.1   | alpha  |

---

## Verification method

Counts cross-checked three ways and all agreed at **36**:

1. **Filesystem:** `ls src/registry/components/<category>/` per category — 20 + 6 + 2 + 4 + 3 + 1 = 36.
2. **Manifest:** `src/registry/manifest.ts` has 110 import lines — `(36 components × 3 imports each: Demo / Usage / meta) + 2 type-and-categories imports = 110`.
3. **Per-component meta:** every directory contains a `meta.ts` with populated `slug`, `category`, `version`, and `status` fields, and each is registered in `REGISTRY` in the manifest.

The `_template/_template/` folder is excluded — it ships its own placeholder `meta.ts` for `tsc` compatibility but is never registered or installable.

> **Removed 2026-05-08:** `force-graph` v0.2.0 (data) — pending recreation. v0.2 source + procomp docs archived to `docs/migrations/force-graph/`.
