# Usage migration tracker

> **Established:** 2026-05-12 alongside the Phase 1 detail-page overhaul (see [`.claude/plans/create-a-comprehensive-plan-hidden-pebble.md`](../.claude/plans/create-a-comprehensive-plan-hidden-pebble.md) or `.claude/decisions/2026-05-12-detail-page-phase-1.md`).

## Context

Phase 1 of the shadcn-parity detail-page overhaul left every existing component's `usage.tsx` untouched. The detail page renders the **demo source** (extracted at build time from `demo.tsx`) as the canonical code surface, and the legacy `<Usage />` React component prints below it for prose context. That works, but it duplicates content — many `usage.tsx` files contain hand-maintained code snippets that overlap with the demo.

The eventual target is a structured `usage.ts` per component:

```ts
// src/registry/components/<category>/<slug>/usage.ts
export const usage = {
  imports: `import { Foo } from "@/components/foo";`,
  example: `<Foo prop={x}>...</Foo>`,
  notes: "Optional prose — short, scoped to the example.",
};
```

The detail page supports BOTH shapes for the life of this migration:
- `usage.ts` (structured) — renders as two copyable `<CodeBlock />`s (imports + example) plus the `notes` paragraph.
- `usage.tsx` (legacy React component) — renders as today.

**Migrate one component at a time.** No blanket migration sprint. Authors flip each row to `migrated` the next time they touch the component for any reason (patch bump, follow-up, GATE 3 review, design tweak). When all 41 flip, we deprecate the legacy `usage.tsx` path.

## How to migrate a component

1. Create `usage.ts` exporting the `usage` constant. Keep `imports` and `example` tight and copyable — these are what consumers paste. Move any explanatory prose to `notes` or into the procomp `<slug>-procomp-guide.md`.
2. Delete `usage.tsx`. Update the slug's entry in [src/registry/manifest.ts](../src/registry/manifest.ts) to import the new shape.
3. Verify `/components/<slug>` renders both code blocks with copy buttons.
4. Flip the tracker row below: `unmigrated` → `migrated`, fill the date column.
5. Commit + push. No version bump needed (this is docs-site work, not a public-API change to the registry component).

## Tracker

| Component | Status | Migrated date | Notes |
|---|---|---|---|
| article-body-01 | unmigrated | — | — |
| article-meta-01 | unmigrated | — | — |
| author-card-01 | unmigrated | — | — |
| category-cloud-01 | unmigrated | — | — |
| code-block | unmigrated | — | recently shipped — usage.tsx is 86 LOC; defer until first patch bump |
| comment-thread-01 | unmigrated | — | — |
| content-card-news-01 | unmigrated | — | — |
| data-table | unmigrated | — | — |
| detail-panel | unmigrated | — | — |
| engagement-bar-01 | unmigrated | — | — |
| entity-picker | unmigrated | — | — |
| event-card-01 | unmigrated | — | — |
| expandable-text-01 | unmigrated | — | — |
| file-manager | unmigrated | — | usage.tsx is 163 LOC — multi-section prose; care needed when extracting |
| file-tree | unmigrated | — | usage.tsx is 147 LOC |
| filter-bar-01 | unmigrated | — | — |
| filter-stack | unmigrated | — | — |
| flow-canvas-01 | unmigrated | — | — |
| grid-layout-news-01 | unmigrated | — | — |
| info-list-01 | unmigrated | — | — |
| kanban-board-01 | unmigrated | — | — |
| markdown-editor | unmigrated | — | — |
| media-carousel-01 | unmigrated | — | — |
| newsletter-card-01 | unmigrated | — | — |
| page-hero-news-01 | unmigrated | — | usage.tsx is 125 LOC |
| pdf-viewer | unmigrated | — | usage.tsx is 224 LOC — heaviest in the repo; multiple worker / dynamic-import code samples; migrate last |
| people-grid-01 | unmigrated | — | — |
| post-card-01 | unmigrated | — | — |
| progress-timeline-01 | unmigrated | — | — |
| project-card-01 | unmigrated | — | — |
| properties-form | unmigrated | — | usage.tsx is 186 LOC |
| registration-card-01 | unmigrated | — | — |
| rich-card | unmigrated | — | usage.tsx is 138 LOC — Plate / read-only / undo / validators code samples |
| schedule-list-01 | unmigrated | — | — |
| share-bar-01 | unmigrated | — | — |
| stat-card | unmigrated | — | usage.tsx is 154 LOC |
| story-rail-01 | unmigrated | — | — |
| story-viewer-01 | unmigrated | — | — |
| thumb-list-01 | unmigrated | — | — |
| video-player-01 | unmigrated | — | — |
| workspace | unmigrated | — | — |

**Total:** 41 components. **Migrated:** 0 / 41.

## When the migration is done

When the tracker hits 41 / 41:
1. Remove the legacy `Usage` React component slot from `RegistryEntry` ([src/registry/types.ts](../src/registry/types.ts)).
2. Remove the `<Usage />` fallback render path in [src/app/components/[slug]/page.tsx](../src/app/components/[slug]/page.tsx).
3. Remove this tracker.
4. Author a decision file marking the migration complete.
