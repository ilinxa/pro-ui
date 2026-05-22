import type { CSSProperties } from "react";
import type { RichSidebarProps } from "../types";

/**
 * Build the inline-style object that sets the component's CSS variables
 * on the <nav> root. Consumer CSS at any ancestor scope wins via cascade;
 * consumer props win over defaults (L11 + L16).
 */
export function deriveCssVars(
  props: Pick<
    RichSidebarProps,
    "collapsedWidth" | "expandedWidth" | "transitionDuration"
  >,
): CSSProperties {
  return {
    "--ilinxa-sidebar-w-collapsed": props.collapsedWidth ?? "5rem",
    "--ilinxa-sidebar-w-expanded": props.expandedWidth ?? "16rem",
    "--ilinxa-sidebar-transition-duration": props.transitionDuration ?? "300ms",
    "--ilinxa-sidebar-row-h": "2.75rem",
    "--ilinxa-sidebar-row-gap": "0.25rem",
    "--ilinxa-sidebar-px": "0.75rem",
    "--ilinxa-nav-active-bg": "var(--primary)",
    "--ilinxa-nav-active-fg": "var(--primary-foreground)",
    "--ilinxa-nav-active-bar-w": "3px",
    "--ilinxa-nav-badge-size": "1.25rem",
    "--ilinxa-nav-indent-step": "0.75rem",
  } as CSSProperties;
}
