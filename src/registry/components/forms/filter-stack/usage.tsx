export default function FilterStackUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>FilterStack</code> when you have a list of typed items
        and want a stacked filter panel — checkbox lists, toggles, debounced
        text, custom range pickers — composing AND-across categories. Generic
        over the item type; the host owns items, predicates, and what to do
        with the filtered output. Sync-only predicates in v0.1; async slot is
        a v0.2 additive prop.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import {
  FilterStack,
  type FilterCategory,
} from "@/registry/components/forms/filter-stack";

interface Project {
  id: string;
  name: string;
  status: "todo" | "in-progress" | "done";
  tags: string[];
}

const CATEGORIES: ReadonlyArray<FilterCategory<Project>> = [
  {
    id: "status",
    type: "checkbox-list",
    label: "Status",
    options: [
      { value: "todo", label: "To do" },
      { value: "in-progress", label: "In progress" },
      { value: "done", label: "Done" },
    ],
    predicate: (item, value) => {
      const sel = (value as string[]) ?? [];
      return sel.length === 0 || sel.includes(item.status);
    },
  },
  {
    id: "search",
    type: "text",
    label: "Search",
    placeholder: "Filter by name…",
    predicate: (item, value) =>
      typeof value !== "string" || value.length === 0 ||
      item.name.toLowerCase().includes(value.toLowerCase()),
  },
];

export function ProjectFilters({ projects }: { projects: Project[] }) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  return (
    <FilterStack<Project>
      items={projects}
      categories={CATEGORIES}
      values={values}
      onChange={setValues}
      onFilteredChange={setFilteredProjects}
    />
  );
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Filter types</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>checkbox-list</code> — multi-select. Optional{" "}
          <code>modeToggle</code> for Union / Intersection. Optional{" "}
          <code>showSoloButtons</code> for per-row solo affordance.
        </li>
        <li>
          <code>toggle</code> — boolean switch.{" "}
          <code>isEmpty</code> required (host intent governs — typically{" "}
          <code>{`(v) => v !== true`}</code>).
        </li>
        <li>
          <code>text</code> — debounced input.{" "}
          <code>debounceMs</code> defaults to 250.{" "}
          ESC clears the field.
        </li>
        <li>
          <code>custom</code> — escape hatch. <code>render(props)</code>{" "}
          receives <code>{`{ value, onChange, items, fieldId }`}</code>;{" "}
          <code>isEmpty</code> required.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Composition semantics</h3>
      <p className="text-muted-foreground">
        AND-across categories: every active category&apos;s{" "}
        <code>predicate</code> must return true. Within a category, the host
        decides OR vs AND inside <code>predicate</code>. The mode-toggle
        affordance for <code>checkbox-list</code> is a hint stored at{" "}
        <code>{`values["${"$"}{id}__mode"]`}</code> (reserved suffix); your
        predicate reads it and switches.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Empty detection</h3>
      <p className="text-muted-foreground">
        A category is &quot;empty&quot; when its <code>isEmpty(value)</code>{" "}
        returns true; empty categories are skipped during filtering. Defaults:
        <code> checkbox-list</code> = empty array; <code>text</code> = empty
        string. Required for <code>toggle</code> and <code>custom</code>{" "}
        because only the host knows the value shape.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Imperative handle</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const ref = useRef<FilterStackHandle>(null);
// ...
ref.current?.clearAll();
ref.current?.clear("status");
ref.current?.isEmpty();   // true iff every category is empty`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Categories reference stability
      </h3>
      <p className="text-muted-foreground">
        Inline <code>{`categories={[...]}`}</code> rebuilds category objects
        on every parent render and re-runs the filter pipeline. In-repo, the
        React Compiler memoizes inline literals at the call site. For NPM
        consumers without the Compiler, hoist to module scope or wrap with{" "}
        <code>useMemo</code>.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const CATEGORIES: FilterCategory<Item>[] = [/* ... */];
// or
const categories = useMemo(() => buildCategories(...), [deps]);`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        onFilteredChange semantics
      </h3>
      <p className="text-muted-foreground">
        Fires when the filtered array&apos;s reference changes — &quot;may
        have changed&quot;, not &quot;definitely differs&quot;. Same items +
        same values + same categories → no fire. Cost-conscious hosts dedupe
        via shallow-equal-by-id on their side.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Reserved id suffixes
      </h3>
      <p className="text-muted-foreground">
        <code>__mode</code> is reserved for internal mode storage on{" "}
        <code>checkbox-list</code> categories with{" "}
        <code>modeToggle: true</code>. Schema validation (dev-only) flags
        category ids ending in reserved suffixes, duplicate ids, and{" "}
        <code>checkbox-list</code> categories with empty options.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">What ships in v0.2+</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Built-in <code>range</code> / <code>date-range</code> filter types.
        </li>
        <li>
          Per-category collapsibles (<code>collapsible</code> +{" "}
          <code>defaultExpanded</code>).
        </li>
        <li>Horizontal layout via <code>direction</code> prop.</li>
        <li>Async predicate support.</li>
        <li>Deep-equal change detection for <code>onFilteredChange</code>.</li>
      </ul>
    </div>
  );
}
