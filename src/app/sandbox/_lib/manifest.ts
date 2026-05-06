/**
 * Sandbox manifest — Tier-3 assembled-page demos.
 *
 * Sandboxes are NOT registry components. They live in `src/app/sandbox/<slug>/`
 * as host code that proves the registry composes into real product surfaces.
 * Each entry maps to one route and lists the registry components it consumes
 * (linked back to `/components/<slug>` from the docs tab).
 */

export type SandboxStatus = "alpha" | "beta" | "stable";

export interface SandboxMeta {
  slug: string;
  title: string;
  /** One-sentence summary used on the index card. */
  description: string;
  /** Domain tag (e.g. "events", "news", "graph"). */
  domain: string;
  status: SandboxStatus;
  /** Slugs of registry components consumed by this sandbox. */
  componentsUsed: string[];
  /** Last update date, ISO `YYYY-MM-DD`. */
  updatedAt: string;
}

export const SANDBOXES: SandboxMeta[] = [
  {
    slug: "event-detail-page-01",
    title: "Event Detail Page 01",
    description:
      "Full kasder-style event detail page assembled from the events-domain pro-comp kit — hero + timeline + body + schedule + speakers + sticky registration sidebar.",
    domain: "events",
    status: "alpha",
    componentsUsed: [
      "progress-timeline-01",
      "article-body-01",
      "schedule-list-01",
      "people-grid-01",
      "registration-card-01",
      "info-list-01",
      "event-card-01",
    ],
    updatedAt: "2026-05-02",
  },
];

export function getSandbox(slug: string): SandboxMeta | undefined {
  return SANDBOXES.find((s) => s.slug === slug);
}

export function getAllSandboxSlugs(): string[] {
  return SANDBOXES.map((s) => s.slug);
}
