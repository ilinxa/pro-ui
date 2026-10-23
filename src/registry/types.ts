import type { ComponentType } from "react";

export type ComponentStatus = "alpha" | "beta" | "stable" | "deprecated";

export type ComponentCategorySlug =
  | "data"
  | "forms"
  | "navigation"
  | "feedback"
  | "marketing"
  | "layout"
  | "media"
  | "code"
  | "overlays"
  | "auth"
  | "gamification";

export type ComponentDependencies = {
  shadcn?: string[];
  npm?: Record<string, string>;
  internal?: string[];
};

export type ComponentAuthor = string | { name: string; url?: string };

export type ComponentMeta = {
  slug: string;
  name: string;
  category: ComponentCategorySlug;

  description: string;
  context: string;
  features?: string[];
  tags: string[];

  version: string;
  status: ComponentStatus;
  /** Allowed KB of the built `public/r/<slug>.json` artifact — validate:artifact-size fails at >20% over. */
  artifactBudgetKB: number;
  createdAt: string;
  updatedAt: string;

  author?: ComponentAuthor;

  dependencies?: ComponentDependencies;

  related?: string[];
  /** Opt-in feature items installable on top of this component (P3 feature-slicing). */
  slices?: { name: string; item: string; description: string }[];
  /**
   * A heavy item (an editor, Konva, pdf.js…). Another item may reach it only through a slot
   * or render prop — never a static import or a `registryDependencies` entry. Enforced by
   * `scripts/validate-registry-deps.mjs` (consumer contract C10 / R11).
   */
  heavy?: boolean;
};

export type RegistryEntry = {
  meta: ComponentMeta;
  Demo: ComponentType;
  Usage: ComponentType;
};

export type CategoryMeta = {
  slug: ComponentCategorySlug;
  label: string;
  description: string;
  order: number;
};
