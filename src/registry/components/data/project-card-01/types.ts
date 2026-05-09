import type { ComponentType, ElementType, MouseEvent, ReactNode } from "react";
import type { ProjectStatus } from "./lib/project-status";

export type { ProjectStatus };

export type ProjectCard01Variant = "grid" | "feature";

export interface ProjectCardItem {
  /** Stable identifier. Used for React keys and the default ariaLabel. */
  id: string;
  /** Headline. Rendered as <h3>. Required. */
  title: string;
  /** Editorial category (e.g. "Urban Renewal"). Used as a key into `categoryStyles`. Required. */
  category: string;
  /** Image URL. Required (can be empty string — fallback placeholder rendered when falsy). */
  image: string;
  /** Image alt-text. Optional — falls back to `title`. */
  imageAlt?: string;
  /** Short summary. Required. Both variants line-clamp it. */
  description: string;
  /** Editorial status. Required — drives the status pill. */
  status: ProjectStatus;
  /** Free-form location string ("Istanbul, Kadıköy", "Remote", etc). Optional — meta line omitted if missing. */
  location?: string;
  /** Free-form year string ("2023", "Q4 2023", "2023–2025" ranges). Optional — meta line omitted if missing. */
  year?: string;
  /** Default href for this project. Optional — overridden by `href` / `getHref` on the card. */
  href?: string;
  /** Promotional flag. Optional — adds visual lift treatment + Star title prefix. */
  featured?: boolean;
}

export interface ProjectCard01Labels {
  // ─── Status pill ────────────────────────────────────────────────
  /** Default: 'Completed'. */
  completed?: string;
  /** Default: 'In progress'. */
  ongoing?: string;
  /** Default: 'Planned'. */
  planned?: string;
  // ─── Image-area CTA (grid only) ─────────────────────────────────
  /** Hover-reveal CTA pill text. Default: 'View details'. */
  viewDetails?: string;
  // ─── A11y ───────────────────────────────────────────────────────
  /** sr-only label appended after the title for featured projects. Default: 'Featured project'. */
  featuredAriaLabel?: string;
}

export interface ProjectCategoryStyle {
  /** Tailwind class string for the category pill. Optional. */
  className?: string;
  /** Custom icon overriding the default `Building2`. Optional. */
  icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
}

export interface ProjectCard01Props {
  /** The project to render. */
  project: ProjectCardItem;

  /** Visual variant. Required — no default; explicit per render site. */
  variant: ProjectCard01Variant;

  // ─── Navigation ──────────────────────────────────────────────────
  /** URL the card links to. Mutually exclusive with `getHref`. */
  href?: string;
  /** Alternative href derivation. Receives the project, returns a URL. Wins over `href` and `project.href`. */
  getHref?: (project: ProjectCardItem) => string;
  /**
   * Click handler — object-shape, fired before navigation if `href` is also
   * set. v0.2 cutover from positional `(project, mouseEvent)`.
   */
  onClick?: (args: { project: ProjectCardItem; mouseEvent: MouseEvent }) => void;
  /** Element used for the link. Default: 'a'. Pass NextLink / RemixLink / etc. */
  linkComponent?: ElementType;

  // ─── Theming ─────────────────────────────────────────────────────
  /** Map of category → className + icon override. Default: empty (universal Building2 + neutral chip). */
  categoryStyles?: Record<string, ProjectCategoryStyle>;
  /** Localized labels. Defaults are English. */
  labels?: ProjectCard01Labels;
  /** Override classes for the title. */
  titleClassName?: string;
  /** Override classes for the image. */
  imageClassName?: string;
  /** Override classes for the root <article>. */
  className?: string;

  // ─── Accessibility ───────────────────────────────────────────────
  /** Override the link's accessible name. Default: title (via aria-labelledby). */
  ariaLabel?: string;

  // ─── Nested interactives (overlay-link pattern) ──────────────────
  /** Optional cluster of buttons/links that sit ABOVE the link overlay (z-10). */
  actions?: ReactNode;

  // ─── Performance ─────────────────────────────────────────────────
  /** Image loading strategy. Default: 'lazy'. */
  loading?: "lazy" | "eager";
}

/** Default English labels — exported for consumer composition. */
export const DEFAULT_PROJECT_CARD_LABELS: Required<ProjectCard01Labels> = {
  completed: "Completed",
  ongoing: "In progress",
  planned: "Planned",
  viewDetails: "View details",
  featuredAriaLabel: "Featured project",
};
