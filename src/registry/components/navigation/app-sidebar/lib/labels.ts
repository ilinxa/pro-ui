import type { AppSidebarLabels, AppSidebarLabelsInput } from "../types";

/** English defaults for every string the sidebar renders. Spread + override, or pass `labels`. */
export const DEFAULT_APP_SIDEBAR_LABELS: AppSidebarLabels = {
  navigation: "Main navigation",
  expandSidebar: "Expand sidebar",
  collapseSidebar: "Collapse sidebar",
  openNavigation: "Open navigation",
  closeNavigation: "Close navigation",
  skipToContent: "Skip to content",
  loading: "Loading navigation items",
  userMenu: (name) => `${name} — open menu`,
  itemWithBadge: (label, value) => `${label}, ${value}`,
  itemWithIndicator: (label) => `${label}, new`,
  emptyState: {
    "no-items": {
      title: "No items",
      body: "Configure `items` prop to populate the navigation.",
    },
    "all-filtered-by-permission": {
      title: "Nothing visible",
      body: "All items filtered by current permissions.",
    },
    "all-hidden": {
      title: "All items hidden",
      body: "Every item has `hidden: true`.",
    },
    "all-filtered-by-loading": {
      title: "No items",
      body: "Loading completed with no items.",
    },
  },
};

/**
 * Merge a partial override over the defaults. A key passed as `undefined`
 * keeps its default (a conditional i18n entry must not erase it); a partial
 * `emptyState` merges per reason.
 */
export function resolveLabels(
  override: AppSidebarLabelsInput | undefined,
): AppSidebarLabels {
  if (!override) return DEFAULT_APP_SIDEBAR_LABELS;
  const merged: AppSidebarLabels = { ...DEFAULT_APP_SIDEBAR_LABELS };
  for (const key of Object.keys(override) as (keyof AppSidebarLabels)[]) {
    const value = override[key];
    if (value === undefined || key === "emptyState") continue;
    (merged as unknown as Record<string, unknown>)[key] = value;
  }
  if (override.emptyState) {
    merged.emptyState = { ...DEFAULT_APP_SIDEBAR_LABELS.emptyState };
    for (const reason of Object.keys(override.emptyState) as (keyof AppSidebarLabels["emptyState"])[]) {
      const copy = override.emptyState[reason];
      if (copy) merged.emptyState[reason] = copy;
    }
  }
  return merged;
}
