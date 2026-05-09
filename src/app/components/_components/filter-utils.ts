import type {
  ComponentCategorySlug,
  ComponentMeta,
  ComponentStatus,
} from "@/registry/types";
import { CATEGORIES } from "@/registry/categories";

export type FilterState = {
  q: string;
  categories: ComponentCategorySlug[];
  stacks: string[];
  tags: string[];
  status: ComponentStatus[];
};

export type FacetOption<T extends string = string> = {
  value: T;
  label: string;
  count: number;
};

export type FilterFacets = {
  categories: FacetOption<ComponentCategorySlug>[];
  stacks: FacetOption[];
  tags: FacetOption[];
  statuses: FacetOption<ComponentStatus>[];
};

export const EMPTY_FILTERS: FilterState = {
  q: "",
  categories: [],
  stacks: [],
  tags: [],
  status: [],
};

export function isEmpty(filters: FilterState): boolean {
  return (
    filters.q.trim() === "" &&
    filters.categories.length === 0 &&
    filters.stacks.length === 0 &&
    filters.tags.length === 0 &&
    filters.status.length === 0
  );
}

export function activeCount(filters: FilterState): number {
  return (
    (filters.q.trim() === "" ? 0 : 1) +
    filters.categories.length +
    filters.stacks.length +
    filters.tags.length +
    filters.status.length
  );
}

const NPM_GROUP_RULES: Array<{ test: RegExp; group: string }> = [
  { test: /^@dnd-kit\//, group: "dnd-kit" },
  { test: /^@platejs\//, group: "plate" },
  { test: /^platejs$/, group: "plate" },
  { test: /^@codemirror\//, group: "codemirror" },
  { test: /^@lezer\//, group: "codemirror" },
  { test: /^@xyflow\/react$/, group: "xyflow" },
  { test: /^embla-carousel-react$/, group: "embla" },
];

const NPM_DROP = new Set(["lucide-react"]);

function classifyNpmDep(pkg: string): string | null {
  if (NPM_DROP.has(pkg)) return null;
  for (const rule of NPM_GROUP_RULES) {
    if (rule.test.test(pkg)) return rule.group;
  }
  return pkg;
}

function stacksForMeta(meta: ComponentMeta): string[] {
  const npm = meta.dependencies?.npm;
  if (!npm) return [];
  const out = new Set<string>();
  for (const pkg of Object.keys(npm)) {
    const grouped = classifyNpmDep(pkg);
    if (grouped) out.add(grouped);
  }
  return Array.from(out);
}

function tagsForMeta(meta: ComponentMeta): string[] {
  return meta.tags.filter((t) => t !== meta.slug);
}

function bumpCount<T extends string>(map: Map<T, number>, key: T): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

export function deriveFacets(entries: ComponentMeta[]): FilterFacets {
  const catCounts = new Map<ComponentCategorySlug, number>();
  const stackCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  const statusCounts = new Map<ComponentStatus, number>();

  for (const meta of entries) {
    bumpCount(catCounts, meta.category);
    bumpCount(statusCounts, meta.status);
    for (const stack of stacksForMeta(meta)) bumpCount(stackCounts, stack);
    for (const tag of tagsForMeta(meta)) bumpCount(tagCounts, tag);
  }

  const categories: FacetOption<ComponentCategorySlug>[] = Array.from(
    catCounts.entries(),
  )
    .map(([value, count]) => ({
      value,
      label: CATEGORIES[value].label,
      count,
    }))
    .sort((a, b) => CATEGORIES[a.value].order - CATEGORIES[b.value].order);

  const stacks: FacetOption[] = Array.from(stackCounts.entries())
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

  const tags: FacetOption[] = Array.from(tagCounts.entries())
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

  const statuses: FacetOption<ComponentStatus>[] = Array.from(
    statusCounts.entries(),
  )
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => a.value.localeCompare(b.value));

  return { categories, stacks, tags, statuses };
}

function searchHaystack(meta: ComponentMeta): string {
  return [meta.name, meta.slug, meta.description, meta.tags.join(" ")]
    .join(" ")
    .toLowerCase();
}

export function applyFilters(
  entries: ComponentMeta[],
  filters: FilterState,
): ComponentMeta[] {
  const q = filters.q.trim().toLowerCase();

  return entries.filter((meta) => {
    if (q && !searchHaystack(meta).includes(q)) return false;

    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(meta.category)
    ) {
      return false;
    }

    if (filters.status.length > 0 && !filters.status.includes(meta.status)) {
      return false;
    }

    if (filters.stacks.length > 0) {
      const metaStacks = new Set(stacksForMeta(meta));
      if (!filters.stacks.some((s) => metaStacks.has(s))) return false;
    }

    if (filters.tags.length > 0) {
      const metaTags = new Set(tagsForMeta(meta));
      if (!filters.tags.some((t) => metaTags.has(t))) return false;
    }

    return true;
  });
}
