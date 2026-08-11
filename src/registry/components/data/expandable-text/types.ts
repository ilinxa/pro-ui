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
  /** Plain-text content to render. Empty/null → component renders nothing. */
  content: string | null | undefined;

  /** Number of lines before truncation. Default: 3. */
  maxLines?: number;

  // ─── Controlled-or-uncontrolled expanded state ──────────────────
  /** Controlled expanded state. Pair with `onExpandedChange`. */
  expanded?: boolean;
  /** Initial uncontrolled expanded state. Default: false. Ignored when `expanded` is provided. */
  defaultExpanded?: boolean;
  /** Fires on every expand/collapse with the NEXT state. */
  onExpandedChange?: (next: boolean) => void;

  // ─── Customization ────────────────────────────────
  /** Localized labels. Defaults are English. */
  labels?: ExpandableTextLabels;
  /** Custom toggle renderer — full takeover. Receives current state + setter. */
  renderToggle?: (props: ExpandableTextToggleRenderProps) => ReactNode;

  // ─── Style overrides ─────────────────────────────
  /** Override classes for the wrapping <div>. */
  className?: string;
  /** Override classes for the content <p>. */
  contentClassName?: string;
  /** Override classes for the default toggle <button>. Ignored when `renderToggle` is provided. */
  toggleClassName?: string;
}

/** Default English labels — exported for consumer composition. */
export const DEFAULT_EXPANDABLE_TEXT_LABELS: Required<ExpandableTextLabels> = {
  showMore: "Show more",
  showLess: "Show less",
};
