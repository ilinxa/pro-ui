/**
 * P2 naming-canon rename map — single source of truth for the 2026-08 great rename.
 * Consumed by scripts/p2-rename.mjs (one-shot sweep) and scripts/validate-naming.mjs
 * (alias-awareness). Canon doc: docs/naming-canon.md (LOCKED 2026-08-11).
 */

export const RENAMES = {
  // re-stems (18 after the gantt revalidation flip)
  "article-body-01": "rich-text-editor",
  "calendar-01": "event-calendar",
  "content-card-news-01": "news-card",
  "rich-card": "card-tree",
  "rich-card-in-flow": "card-tree-node",
  "thumb-list-01": "thumbnail-list",
  "todo-rich-card": "task-card",
  "todo-tree": "task-tree",
  "filter-stack": "filter-panel",
  "registration-form-01": "signup-form",
  "cooperative-challenge-01": "team-challenge",
  "task-choice-control-01": "team-task-claim",
  "grid-layout-news-01": "magazine-layout",
  "workspace": "split-workspace",
  "newsletter-card-01": "newsletter-signup",
  "page-hero-news-01": "page-hero",
  "media-carousel-editor-01": "carousel-composer",
  "rich-sidebar": "app-sidebar",
  // suffix drops (34, incl. the gantt flip)
  "gantt-timeline-01": "gantt-timeline",
  "article-meta-01": "article-meta",
  "blackboard-01": "blackboard",
  "comment-thread-01": "comment-thread",
  "engagement-bar-01": "engagement-bar",
  "event-card-01": "event-card",
  "expandable-text-01": "expandable-text",
  "flow-canvas-01": "flow-canvas",
  "info-list-01": "info-list",
  "kanban-board-01": "kanban-board",
  "people-grid-01": "people-grid",
  "post-card-01": "post-card",
  "progress-timeline-01": "progress-timeline",
  "project-card-01": "project-card",
  "registration-card-01": "registration-card",
  "schedule-list-01": "schedule-list",
  "story-rail-01": "story-rail",
  "category-cloud-01": "category-cloud",
  "filter-bar-01": "filter-bar",
  "team-feedback-loop-01": "team-feedback-loop",
  "team-progress-bar-01": "team-progress-bar",
  "team-quest-log-01": "team-quest-log",
  "team-trophy-shelf-01": "team-trophy-shelf",
  "author-card-01": "author-card",
  "pricing-table-01": "pricing-table",
  "share-bar-01": "share-bar",
  "content-composer-01": "content-composer",
  "media-carousel-01": "media-carousel",
  "media-editor-01": "media-editor",
  "media-library-01": "media-library",
  "story-composer-01": "story-composer",
  "story-viewer-01": "story-viewer",
  "video-player-01": "video-player",
  "account-switcher-01": "account-switcher",
};

/** Slugs untouched by the canon (11). */
export const UNCHANGED = [
  "code-block", "data-table", "stat-card", "detail-panel", "entity-picker",
  "json-form", "markdown-editor", "properties-form", "pdf-viewer",
  "file-manager", "file-tree",
];

export const pascal = (s) =>
  s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join("");
export const camel = (s) => {
  const p = pascal(s);
  return p[0].toLowerCase() + p.slice(1);
};
export const titleCase = (s) => s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
