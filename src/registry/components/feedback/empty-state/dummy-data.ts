import { createElement, type ReactNode } from "react";
import type { EmptyStateVariant } from "./types";

/** Per-variant sample copy for the docs demo. Copy is host-domain in real usage — see Q2. */
export const EMPTY_STATE_DUMMY_COPY: Record<
  EmptyStateVariant,
  { title: string; description: string }
> = {
  default: {
    title: "No projects yet",
    description: "Projects you create will show up here.",
  },
  search: {
    title: "No results for “gantt”",
    description: "Try a different term or clear the active filters.",
  },
  error: {
    title: "Couldn't load this page",
    description: "Something went wrong on our end. Try again in a moment.",
  },
  offline: {
    title: "You're offline",
    description: "Changes will sync automatically once you're back online.",
  },
  permission: {
    title: "You don't have access",
    description: "Ask a workspace admin to grant you access to this board.",
  },
  "first-use": {
    title: "Upload your first file",
    description: "Drag and drop anywhere, or browse from your device.",
  },
};

/**
 * Small inline SVG illustration for the media-slot demo tab. Built with
 * `createElement` (not JSX) because this file ships as plain `.ts` — see
 * plan P-F4: the demo imports this rather than duplicating an inline node.
 * `currentColor` only, no hex/rgb — inherits `text-muted-foreground`.
 */
export const EMPTY_STATE_DUMMY_ILLUSTRATION: ReactNode = createElement(
  "svg",
  {
    viewBox: "0 0 96 72",
    className: "h-24 w-32 text-muted-foreground",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  },
  createElement("rect", {
    x: 4,
    y: 14,
    width: 88,
    height: 54,
    rx: 8,
    stroke: "currentColor",
    strokeOpacity: 0.35,
    strokeWidth: 2,
  }),
  createElement("path", {
    d: "M4 50 L28 32 L46 46 L64 26 L92 48",
    stroke: "currentColor",
    strokeOpacity: 0.55,
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  }),
  createElement("circle", {
    cx: 30,
    cy: 26,
    r: 6,
    className: "fill-primary/70",
  }),
);
