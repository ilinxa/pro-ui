import type { ReactNode } from "react";

/** Semantic tone. Drives default icon + `role="status"` gating (I4). */
export type EmptyStateVariant =
  | "default"
  | "search"
  | "error"
  | "offline"
  | "permission"
  | "first-use";

/** Controls type scale, icon-tile scale, and vertical padding. */
export type EmptyStateSize = "sm" | "md" | "lg";

/** Object form of an action — renders a real `<Button>` (or `<a>` when `href` is set). */
export interface EmptyStateActionConfig {
  label: string;
  onClick?: () => void;
  /** Renders `<a className={cn(buttonVariants(...))}>` — never `asChild` (F-cross-13). */
  href?: string;
  disabled?: boolean;
}

/** Object form for the terse 90% case, or a ReactNode escape hatch for full control. */
export type EmptyStateAction = EmptyStateActionConfig | ReactNode;

export interface EmptyStateProps {
  /** Semantic tone; changes default icon + transient-status ARIA gating. Default: `"default"`. */
  variant?: EmptyStateVariant;
  /** Type scale / icon scale / padding. Default: `"md"`. */
  size?: EmptyStateSize;
  /** Overrides the per-variant default lucide icon. Ignored when `media` is set (I3). */
  icon?: ReactNode;
  /** Illustration slot. When set, the icon tile + bloom are omitted entirely (I3). */
  media?: ReactNode;
  /** Required. ReactNode so hosts can mix markup / i18n components. */
  title: ReactNode;
  description?: ReactNode;
  /** Primary action. Object form → `<Button>`; ReactNode → rendered as-is. */
  action?: EmptyStateAction;
  /** Secondary action. Object form → `<Button variant="outline">`. */
  secondaryAction?: EmptyStateAction;
  /** Footer micro-copy row (e.g. a keyboard-shortcut hint). */
  hint?: ReactNode;
  /** Semantic heading level for `title`. Default: `3` (renders `<h3>`). */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Entrance reveal on mount. Default: `true`. `false` renders SSR-stable with no reveal classes. */
  animated?: boolean;
  /** Root surface treatment. `"dashed"` = dropzone-style border; `"card"` = raised `bg-card`. Default: `"none"`. */
  frame?: "none" | "dashed" | "card";
  className?: string;
}
