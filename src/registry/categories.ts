import type { CategoryMeta, ComponentCategorySlug } from "./types";

export const CATEGORIES: Record<ComponentCategorySlug, CategoryMeta> = {
  data: {
    slug: "data",
    label: "Data Display",
    description: "Tables, charts, lists, stats, KPIs, and data dashboards.",
    order: 1,
  },
  forms: {
    slug: "forms",
    label: "Forms",
    description: "Inputs, builders, multi-step flows, validation patterns.",
    order: 2,
  },
  navigation: {
    slug: "navigation",
    label: "Navigation",
    description: "Headers, sidebars, breadcrumbs, command palettes, tabs.",
    order: 3,
  },
  feedback: {
    slug: "feedback",
    label: "Feedback",
    description: "Toasts, alerts, empty states, loaders, progress.",
    order: 4,
  },
  overlays: {
    slug: "overlays",
    label: "Overlays",
    description: "Dialogs, drawers, sheets, popovers, tooltips.",
    order: 5,
  },
  marketing: {
    slug: "marketing",
    label: "Marketing",
    description: "Heroes, pricing, testimonials, feature grids, CTAs.",
    order: 6,
  },
  layout: {
    slug: "layout",
    label: "Layout",
    description: "Page shells, dashboard frames, splits, grids.",
    order: 7,
  },
  media: {
    slug: "media",
    label: "Media",
    description: "Image galleries, video players, carousels, file viewers.",
    order: 8,
  },
  auth: {
    slug: "auth",
    label: "Auth",
    description: "Login, signup, account, multi-factor, session UI.",
    order: 9,
  },
};

export const ORDERED_CATEGORIES: CategoryMeta[] = Object.values(CATEGORIES).sort(
  (a, b) => a.order - b.order,
);
