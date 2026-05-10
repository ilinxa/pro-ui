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
  | "auth";

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
  createdAt: string;
  updatedAt: string;

  author?: ComponentAuthor;

  dependencies?: ComponentDependencies;

  related?: string[];
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
