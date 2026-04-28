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
  | "overlays"
  | "auth";

export type ComponentDependencies = {
  shadcn?: string[];
  npm?: Record<string, string>;
  internal?: string[];
};

export type ComponentAuthor = string | { name: string; url?: string };

export type ComponentExample = {
  name: string;
  description?: string;
  component: ComponentType;
};

export type ComponentMeta = {
  slug: string;
  name: string;
  category: ComponentCategorySlug;
  subcategory?: string;

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
  thumbnail?: string;
};

export type RegistryEntry = {
  meta: ComponentMeta;
  Demo: ComponentType;
  Usage: ComponentType;
  examples?: ComponentExample[];
};

export type CategoryMeta = {
  slug: ComponentCategorySlug;
  label: string;
  description: string;
  order: number;
};
