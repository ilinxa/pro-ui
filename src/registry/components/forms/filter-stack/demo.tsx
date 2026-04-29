"use client";

import { useCallback, useMemo, useState } from "react";
import { Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterStack } from "./filter-stack";
import {
  KIND_OPTIONS,
  NODE_FIXTURES,
  TAG_OPTIONS,
  type GraphNodeFixture,
  type GraphNodeKind,
} from "./dummy-data";
import type {
  FilterCategory,
  FilterMode,
  FilterValue,
} from "./types";

function asStringArray(v: FilterValue): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function FilteredList({ items }: { items: ReadonlyArray<GraphNodeFixture> }) {
  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
        No matches.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((n) => (
        <li
          key={n.id}
          className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
        >
          <div className="flex flex-col">
            <span className="flex items-center gap-2 font-medium text-foreground">
              {n.label}
              {n.pinned ? (
                <Pin aria-hidden="true" className="size-3 text-primary" />
              ) : null}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {n.kind}
            </span>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {n.tags.map((t) => (
              <Badge key={t} variant="secondary" className="font-mono text-[10px]">
                {t}
              </Badge>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

function PanelLayout({
  panel,
  list,
}: {
  panel: React.ReactNode;
  list: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="rounded-md border border-border bg-card/30 p-3">
        {panel}
      </div>
      <div>{list}</div>
    </div>
  );
}

function BasicDemo() {
  const [values, setValues] = useState<Record<string, FilterValue>>({});
  const categories = useMemo<ReadonlyArray<FilterCategory<GraphNodeFixture>>>(
    () => [
      {
        id: "kind",
        type: "checkbox-list",
        label: "Kind",
        options: KIND_OPTIONS as unknown as Array<{
          value: string;
          label: string;
        }>,
        predicate: (item, value) => {
          const sel = asStringArray(value);
          return sel.length === 0 || sel.includes(item.kind);
        },
      },
      {
        id: "search",
        type: "text",
        label: "Search by name",
        placeholder: "Type to filter…",
        predicate: (item, value) => {
          if (typeof value !== "string" || value.length === 0) return true;
          return item.label.toLowerCase().includes(value.toLowerCase());
        },
      },
      {
        id: "pinned",
        type: "toggle",
        label: "Pinned only",
        isEmpty: (v) => v !== true,
        predicate: (item, value) => (value === true ? item.pinned : true),
      },
    ],
    [],
  );

  const filtered = useMemo(() => {
    return NODE_FIXTURES.filter((n) =>
      categories.every((c) => c.predicate(n, values[c.id])),
    );
  }, [categories, values]);

  return (
    <PanelLayout
      panel={
        <FilterStack<GraphNodeFixture>
          items={NODE_FIXTURES}
          categories={categories}
          values={values}
          onChange={setValues}
          ariaLabel="Basic facets"
        />
      }
      list={<FilteredList items={filtered} />}
    />
  );
}

function ModeToggleDemo() {
  const [values, setValues] = useState<Record<string, FilterValue>>({
    tags: ["security", "frontend"],
  });

  const tagMode: FilterMode =
    values["tags__mode"] === "intersection" ? "intersection" : "union";

  const tagsPredicate = useCallback(
    (item: GraphNodeFixture, value: FilterValue) => {
      const sel = asStringArray(value);
      if (sel.length === 0) return true;
      if (tagMode === "intersection") {
        return sel.every((t) => item.tags.includes(t));
      }
      return sel.some((t) => item.tags.includes(t));
    },
    [tagMode],
  );

  const categories = useMemo<ReadonlyArray<FilterCategory<GraphNodeFixture>>>(
    () => [
      {
        id: "tags",
        type: "checkbox-list",
        label: "Tags",
        description:
          "Union: any selected tag matches. Intersection: all selected tags must match.",
        options: TAG_OPTIONS as unknown as Array<{
          value: string;
          label: string;
        }>,
        modeToggle: true,
        defaultMode: "union",
        predicate: tagsPredicate,
      },
    ],
    [tagsPredicate],
  );

  const filtered = useMemo(
    () =>
      NODE_FIXTURES.filter((n) =>
        categories.every((c) => c.predicate(n, values[c.id])),
      ),
    [categories, values],
  );

  return (
    <PanelLayout
      panel={
        <FilterStack<GraphNodeFixture>
          items={NODE_FIXTURES}
          categories={categories}
          values={values}
          onChange={setValues}
          ariaLabel="Mode toggle"
        />
      }
      list={<FilteredList items={filtered} />}
    />
  );
}

function SoloButtonsDemo() {
  const [values, setValues] = useState<Record<string, FilterValue>>({});

  const categories = useMemo<ReadonlyArray<FilterCategory<GraphNodeFixture>>>(
    () => [
      {
        id: "kind",
        type: "checkbox-list",
        label: "Kind",
        description:
          "Hover a row to reveal the solo affordance — collapses selection to that one option.",
        options: KIND_OPTIONS as unknown as Array<{
          value: string;
          label: string;
        }>,
        showSoloButtons: true,
        predicate: (item, value) => {
          const sel = asStringArray(value);
          return sel.length === 0 || sel.includes(item.kind);
        },
      },
    ],
    [],
  );

  const filtered = useMemo(
    () =>
      NODE_FIXTURES.filter((n) =>
        categories.every((c) => c.predicate(n, values[c.id])),
      ),
    [categories, values],
  );

  return (
    <PanelLayout
      panel={
        <FilterStack<GraphNodeFixture>
          items={NODE_FIXTURES}
          categories={categories}
          values={values}
          onChange={setValues}
          ariaLabel="Solo buttons"
        />
      }
      list={<FilteredList items={filtered} />}
    />
  );
}

function CustomRangeDemo() {
  const [values, setValues] = useState<Record<string, FilterValue>>({});

  const categories = useMemo<ReadonlyArray<FilterCategory<GraphNodeFixture>>>(
    () => [
      {
        id: "members",
        type: "custom",
        label: "Members",
        description: "Custom range slot — host owns the renderer.",
        isEmpty: (v) => {
          if (!Array.isArray(v) || v.length !== 2) return true;
          const [min, max] = v as [number, number];
          return min === 0 && max >= 1000;
        },
        predicate: (item, value) => {
          if (!Array.isArray(value) || value.length !== 2) return true;
          const [min, max] = value as [number, number];
          return item.members >= min && item.members <= max;
        },
        render: ({ value, onChange, fieldId }) => {
          const range =
            Array.isArray(value) && value.length === 2
              ? (value as [number, number])
              : ([0, 1000] as [number, number]);
          return (
            <div className="flex flex-col gap-2 px-1">
              <div className="flex items-center gap-2 text-sm">
                <label
                  htmlFor={`${fieldId}-min`}
                  className="text-xs text-muted-foreground"
                >
                  min
                </label>
                <input
                  id={`${fieldId}-min`}
                  type="number"
                  value={range[0]}
                  min={0}
                  onChange={(e) =>
                    onChange([Number(e.target.value) || 0, range[1]])
                  }
                  className="h-8 w-24 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <label
                  htmlFor={`${fieldId}-max`}
                  className="text-xs text-muted-foreground"
                >
                  max
                </label>
                <input
                  id={`${fieldId}-max`}
                  type="number"
                  value={range[1]}
                  min={0}
                  onChange={(e) =>
                    onChange([range[0], Number(e.target.value) || 0])
                  }
                  className="h-8 w-24 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Default range 0–1000 reads as &quot;empty&quot;.
              </p>
            </div>
          );
        },
      },
    ],
    [],
  );

  const filtered = useMemo(
    () =>
      NODE_FIXTURES.filter((n) =>
        categories.every((c) => c.predicate(n, values[c.id])),
      ),
    [categories, values],
  );

  return (
    <PanelLayout
      panel={
        <FilterStack<GraphNodeFixture>
          items={NODE_FIXTURES}
          categories={categories}
          values={values}
          onChange={setValues}
          ariaLabel="Custom range"
        />
      }
      list={<FilteredList items={filtered} />}
    />
  );
}

function RichDemo() {
  const [values, setValues] = useState<Record<string, FilterValue>>({});

  const tagMode: FilterMode =
    values["tags__mode"] === "intersection" ? "intersection" : "union";

  const tagsPredicate = useCallback(
    (item: GraphNodeFixture, value: FilterValue) => {
      const sel = asStringArray(value);
      if (sel.length === 0) return true;
      if (tagMode === "intersection") {
        return sel.every((t) => item.tags.includes(t));
      }
      return sel.some((t) => item.tags.includes(t));
    },
    [tagMode],
  );

  const categories = useMemo<ReadonlyArray<FilterCategory<GraphNodeFixture>>>(
    () => [
      {
        id: "search",
        type: "text",
        label: "Search",
        placeholder: "Filter by label…",
        predicate: (item, value) => {
          if (typeof value !== "string" || value.length === 0) return true;
          return item.label.toLowerCase().includes(value.toLowerCase());
        },
      },
      {
        id: "kind",
        type: "checkbox-list",
        label: "Kind",
        options: KIND_OPTIONS as unknown as Array<{
          value: string;
          label: string;
        }>,
        showSoloButtons: true,
        predicate: (item, value) => {
          const sel = asStringArray(value);
          return sel.length === 0 || sel.includes(item.kind as GraphNodeKind);
        },
      },
      {
        id: "tags",
        type: "checkbox-list",
        label: "Tags",
        options: TAG_OPTIONS as unknown as Array<{
          value: string;
          label: string;
        }>,
        modeToggle: true,
        defaultMode: "union",
        predicate: tagsPredicate,
      },
      {
        id: "pinned",
        type: "toggle",
        label: "Pinned only",
        isEmpty: (v) => v !== true,
        predicate: (item, value) => (value === true ? item.pinned : true),
      },
    ],
    [tagsPredicate],
  );

  const filtered = useMemo(
    () =>
      NODE_FIXTURES.filter((n) =>
        categories.every((c) => c.predicate(n, values[c.id])),
      ),
    [categories, values],
  );

  return (
    <PanelLayout
      panel={
        <FilterStack<GraphNodeFixture>
          items={NODE_FIXTURES}
          categories={categories}
          values={values}
          onChange={setValues}
          ariaLabel="Rich faceted"
        />
      }
      list={<FilteredList items={filtered} />}
    />
  );
}

export default function FilterStackDemo() {
  return (
    <Tabs defaultValue="basic">
      <TabsList className="flex flex-wrap">
        <TabsTrigger value="basic">Basic facets</TabsTrigger>
        <TabsTrigger value="mode">Mode toggle</TabsTrigger>
        <TabsTrigger value="solo">Solo buttons</TabsTrigger>
        <TabsTrigger value="custom">Custom range</TabsTrigger>
        <TabsTrigger value="rich">All combined</TabsTrigger>
      </TabsList>
      <TabsContent value="basic" className="mt-4">
        <BasicDemo />
      </TabsContent>
      <TabsContent value="mode" className="mt-4">
        <ModeToggleDemo />
      </TabsContent>
      <TabsContent value="solo" className="mt-4">
        <SoloButtonsDemo />
      </TabsContent>
      <TabsContent value="custom" className="mt-4">
        <CustomRangeDemo />
      </TabsContent>
      <TabsContent value="rich" className="mt-4">
        <RichDemo />
      </TabsContent>
    </Tabs>
  );
}
