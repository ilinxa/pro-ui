import type { CSSProperties } from "react";
import type { AppSidebarProps } from "../types";

/**
 * Every CSS variable the sidebar reads, with the default each read falls back
 * to (`var(--name, default)` at the read site).
 *
 * v0.5.0 (AS3) — defaults are NOT set inline any more. Inline values beat any
 * ancestor declaration, so the old "consumer CSS at any ancestor scope wins"
 * promise was false. Now: an inline value exists only for a prop that was
 * passed (`collapsedWidth`, `expandedWidth`, `transitionDuration`) or that the
 * consumer put in `style` / `drawerStyle`; otherwise the ancestor cascade
 * decides, and the read-site fallback is the default. The drawer is portalled
 * out of the tree, so `app-sidebar.tsx` copies these from the in-tree wrapper
 * onto the drawer panel when it opens.
 */
export const APP_SIDEBAR_CSS_VARS = {
  "--ilinxa-sidebar-w-collapsed": "5rem",
  "--ilinxa-sidebar-w-expanded": "16rem",
  "--ilinxa-sidebar-transition-duration": "300ms",
  "--ilinxa-sidebar-drawer-w": "18rem",
  "--ilinxa-sidebar-bg": "var(--card)",
  "--ilinxa-sidebar-fg": "var(--foreground)",
  "--ilinxa-nav-hover-bg": "var(--muted)",
  "--ilinxa-sidebar-border": "var(--border)",
  "--ilinxa-sidebar-row-h": "2.75rem",
  "--ilinxa-nav-row-radius": "var(--radius-lg)",
  "--ilinxa-sidebar-row-gap": "0.25rem",
  "--ilinxa-sidebar-px": "0.75rem",
  "--ilinxa-nav-active-bg": "var(--primary)",
  "--ilinxa-nav-active-fg": "var(--primary-foreground)",
  "--ilinxa-nav-active-bar-w": "3px",
  "--ilinxa-nav-badge-size": "1.25rem",
  "--ilinxa-nav-badge-corner-size": "1rem",
  "--ilinxa-nav-badge-halo": "var(--card)",
  "--ilinxa-nav-indent-step": "0",
} as const;

export type AppSidebarCssVar = keyof typeof APP_SIDEBAR_CSS_VARS;

/** Inline variables for the props that were actually passed — nothing else. */
export function deriveCssVars(
  props: Pick<
    AppSidebarProps,
    "collapsedWidth" | "expandedWidth" | "transitionDuration"
  >,
): CSSProperties {
  const vars: Record<string, string> = {};
  if (props.collapsedWidth !== undefined) vars["--ilinxa-sidebar-w-collapsed"] = props.collapsedWidth;
  if (props.expandedWidth !== undefined) vars["--ilinxa-sidebar-w-expanded"] = props.expandedWidth;
  if (props.transitionDuration !== undefined) vars["--ilinxa-sidebar-transition-duration"] = props.transitionDuration;
  return vars as CSSProperties;
}

/**
 * Read the effective value of every sidebar variable at `el` (inherited from
 * ancestors or set inline). Only non-empty values are returned, so the drawer's
 * read-site fallbacks still apply where nothing was declared.
 */
export function readInheritedCssVars(el: Element): CSSProperties {
  const computed = getComputedStyle(el);
  const out: Record<string, string> = {};
  for (const name of Object.keys(APP_SIDEBAR_CSS_VARS)) {
    const value = computed.getPropertyValue(name).trim();
    if (value) out[name] = value;
  }
  return out as CSSProperties;
}
