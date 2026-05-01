import DataTableDemo from "./components/data/data-table/demo";
import DataTableUsage from "./components/data/data-table/usage";
import { meta as dataTableMeta } from "./components/data/data-table/meta";

import RichCardDemo from "./components/data/rich-card/demo";
import RichCardUsage from "./components/data/rich-card/usage";
import { meta as richCardMeta } from "./components/data/rich-card/meta";

import WorkspaceDemo from "./components/layout/workspace/demo";
import WorkspaceUsage from "./components/layout/workspace/usage";
import { meta as workspaceMeta } from "./components/layout/workspace/meta";

import PropertiesFormDemo from "./components/forms/properties-form/demo";
import PropertiesFormUsage from "./components/forms/properties-form/usage";
import { meta as propertiesFormMeta } from "./components/forms/properties-form/meta";

import DetailPanelDemo from "./components/feedback/detail-panel/demo";
import DetailPanelUsage from "./components/feedback/detail-panel/usage";
import { meta as detailPanelMeta } from "./components/feedback/detail-panel/meta";

import FilterStackDemo from "./components/forms/filter-stack/demo";
import FilterStackUsage from "./components/forms/filter-stack/usage";
import { meta as filterStackMeta } from "./components/forms/filter-stack/meta";

import EntityPickerDemo from "./components/forms/entity-picker/demo";
import EntityPickerUsage from "./components/forms/entity-picker/usage";
import { meta as entityPickerMeta } from "./components/forms/entity-picker/meta";

import MarkdownEditorDemo from "./components/forms/markdown-editor/demo";
import MarkdownEditorUsage from "./components/forms/markdown-editor/usage";
import { meta as markdownEditorMeta } from "./components/forms/markdown-editor/meta";

import ForceGraphDemo from "./components/data/force-graph/demo";
import ForceGraphUsage from "./components/data/force-graph/usage";
import { meta as forceGraphMeta } from "./components/data/force-graph/meta";

import ContentCardNews01Demo from "./components/data/content-card-news-01/demo";
import ContentCardNews01Usage from "./components/data/content-card-news-01/usage";
import { meta as contentCardNews01Meta } from "./components/data/content-card-news-01/meta";

import NewsletterCard01Demo from "./components/marketing/newsletter-card-01/demo";
import NewsletterCard01Usage from "./components/marketing/newsletter-card-01/usage";
import { meta as newsletterCard01Meta } from "./components/marketing/newsletter-card-01/meta";

import CategoryCloud01Demo from "./components/forms/category-cloud-01/demo";
import CategoryCloud01Usage from "./components/forms/category-cloud-01/usage";
import { meta as categoryCloud01Meta } from "./components/forms/category-cloud-01/meta";

import FilterBar01Demo from "./components/forms/filter-bar-01/demo";
import FilterBar01Usage from "./components/forms/filter-bar-01/usage";
import { meta as filterBar01Meta } from "./components/forms/filter-bar-01/meta";

import PageHeroNews01Demo from "./components/marketing/page-hero-news-01/demo";
import PageHeroNews01Usage from "./components/marketing/page-hero-news-01/usage";
import { meta as pageHeroNews01Meta } from "./components/marketing/page-hero-news-01/meta";

import GridLayoutNews01Demo from "./components/layout/grid-layout-news-01/demo";
import GridLayoutNews01Usage from "./components/layout/grid-layout-news-01/usage";
import { meta as gridLayoutNews01Meta } from "./components/layout/grid-layout-news-01/meta";

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
  {
    meta: propertiesFormMeta,
    Demo: PropertiesFormDemo,
    Usage: PropertiesFormUsage,
  },
  {
    meta: detailPanelMeta,
    Demo: DetailPanelDemo,
    Usage: DetailPanelUsage,
  },
  {
    meta: filterStackMeta,
    Demo: FilterStackDemo,
    Usage: FilterStackUsage,
  },
  {
    meta: entityPickerMeta,
    Demo: EntityPickerDemo,
    Usage: EntityPickerUsage,
  },
  {
    meta: markdownEditorMeta,
    Demo: MarkdownEditorDemo,
    Usage: MarkdownEditorUsage,
  },
  {
    meta: forceGraphMeta,
    Demo: ForceGraphDemo,
    Usage: ForceGraphUsage,
  },
  {
    meta: contentCardNews01Meta,
    Demo: ContentCardNews01Demo,
    Usage: ContentCardNews01Usage,
  },
  {
    meta: newsletterCard01Meta,
    Demo: NewsletterCard01Demo,
    Usage: NewsletterCard01Usage,
  },
  {
    meta: categoryCloud01Meta,
    Demo: CategoryCloud01Demo,
    Usage: CategoryCloud01Usage,
  },
  {
    meta: filterBar01Meta,
    Demo: FilterBar01Demo,
    Usage: FilterBar01Usage,
  },
  {
    meta: pageHeroNews01Meta,
    Demo: PageHeroNews01Demo,
    Usage: PageHeroNews01Usage,
  },
  {
    meta: gridLayoutNews01Meta,
    Demo: GridLayoutNews01Demo,
    Usage: GridLayoutNews01Usage,
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
