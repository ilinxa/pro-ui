import type { ReactNode } from "react";

export interface ExpandableTextLabels {
  /** Default: "Show more". Toggle button label when collapsed. */
  showMore?: string;
  /** Default: "Show less". Toggle button label when expanded. */
  showLess?: string;
}

export interface ExpandableTextToggleRenderProps {
  /** Current expanded state. */
  isExpanded: boolean;
  /** Setter — handles controlled-or-uncontrolled internally. */
  setExpanded: (next: boolean) => void;
}

export interface ExpandableTextProps {
  /**
   * Plain-text content. Rendered in a `<p>`. Ignored when `children` is given. The component renders
   * nothing when there is neither non-empty `content` nor renderable `children`.
   */
  content?: string | null;

  /**
   * Rich content — your own link / mention renderer. Wins over `content`. Rendered in a `<div>`, so block
   * children (a `<p>` per paragraph) are valid. Changes inside it are re-measured automatically; pass
   * `measureKey` for changes that alter no DOM (a web font finishing loading).
   */
  children?: ReactNode;

  /** Re-measure the clamp whenever this value changes. */
  measureKey?: unknown;

  /** Number of lines before truncation. Default: 3. */
  maxLines?: number;

  /** Text direction of the content element. Default: "auto" (bidi isolation — an Arabic post in an LTR feed starts at the right). */
  dir?: "auto" | "ltr" | "rtl";

  // ─── Controlled-or-uncontrolled expanded state ──────────────────
  /** Controlled expanded state — wins on every render. Pair with `onExpandedChange`. */
  expanded?: boolean;
  /** Initial uncontrolled expanded state. Default: false. Ignored when `expanded` is provided. */
  defaultExpanded?: boolean;
  /**
   * Fires on every requested expand/collapse with the NEXT state — the toggle, and keyboard focus moving
   * into clamped content (which asks to expand, so focus never lands on hidden text).
   */
  onExpandedChange?: (next: boolean) => void;

  // ─── Customization ────────────────────────────────
  /** Localized labels. Defaults are English; an `undefined` key keeps its default. */
  labels?: ExpandableTextLabels;
  /** Custom toggle renderer — full takeover. Receives current state + setter. */
  renderToggle?: (props: ExpandableTextToggleRenderProps) => ReactNode;

  // ─── Style overrides ─────────────────────────────
  /** Override classes for the wrapping <div>. */
  className?: string;
  /** Override classes for the content element (`<p>` for `content`, `<div>` for `children`). */
  contentClassName?: string;
  /** Override classes for the default toggle <button>. Ignored when `renderToggle` is provided. */
  toggleClassName?: string;
}

/** Default English labels — exported for consumer composition. */
export const defaultExpandableTextLabels: Required<ExpandableTextLabels> = {
  showMore: "Show more",
  showLess: "Show less",
};

/** @deprecated Use `defaultExpandableTextLabels` — the same object under its old name. */
export const DEFAULT_EXPANDABLE_TEXT_LABELS: Required<ExpandableTextLabels> = defaultExpandableTextLabels;
