import DataTableDemo from "./components/data/data-table/demo";
import DataTableUsage from "./components/data/data-table/usage";
import { meta as dataTableMeta } from "./components/data/data-table/meta";

import RichCardDemo from "./components/data/rich-card/demo";
import RichCardUsage from "./components/data/rich-card/usage";
import { meta as richCardMeta } from "./components/data/rich-card/meta";

import WorkspaceDemo from "./components/layout/workspace/demo";
import WorkspaceUsage from "./components/layout/workspace/usage";
import { meta as workspaceMeta } from "./components/layout/workspace/meta";

import { CATEGORIES, ORDERED_CATEGORIES } from "./categories";
import type {
  CategoryMeta,
  ComponentCategorySlug,
  ComponentMeta,
  RegistryEntry,
} from "./types";

export const REGISTRY: RegistryEntry[] = [
  {
    meta: dataTableMeta,
    Demo: DataTableDemo,
    Usage: DataTableUsage,
  },
  {
    meta: richCardMeta,
    Demo: RichCardDemo,
    Usage: RichCardUsage,
  },
  {
    meta: workspaceMeta,
    Demo: WorkspaceDemo,
    Usage: WorkspaceUsage,
  },
];

export function getEntry(slug: string): RegistryEntry | undefined {
  return REGISTRY.find((e) => e.meta.slug === slug);
}

export function getEntriesByCategory(
  category: ComponentCategorySlug,
): RegistryEntry[] {
  return REGISTRY.filter((e) => e.meta.category === category);
}

export function getAllSlugs(): string[] {
  return REGISTRY.map((e) => e.meta.slug);
}

export type GroupedRegistry = Array<{
  category: CategoryMeta;
  entries: RegistryEntry[];
}>;

export function getGroupedRegistry(): GroupedRegistry {
  return ORDERED_CATEGORIES.map((category) => ({
    category,
    entries: getEntriesByCategory(category.slug),
  })).filter((group) => group.entries.length > 0);
}

export function getMetaList(): ComponentMeta[] {
  return REGISTRY.map((e) => e.meta);
}

export { CATEGORIES, ORDERED_CATEGORIES };
