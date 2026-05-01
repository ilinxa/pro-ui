export default function FilterBar01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>FilterBar01</code> in any browse-and-filter UI: news
        landing pages, blog archives, doc indexes, file browsers,
        dashboards, e-commerce category pages. Three sub-controls in one
        bar — search + category chips + date-range — plus an optional
        results count. Each is independently controlled-or-uncontrolled.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Minimal example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { FilterBar01 } from "@/registry/components/forms/filter-bar-01";

<FilterBar01
  categories={[
    { value: "tech", label: "Technology" },
    { value: "design", label: "Design" },
  ]}
  resultsCount={42}
/>;`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        With no controlled props, all 3 sub-controls run uncontrolled with
        a 250ms debounce on the search. The bar emits no events but the
        UI works for visual demos.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Controlled (the common case)</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const [filters, setFilters] = useState<FilterBarValue>({
  search: "",
  category: null,
  dateRange: { from: undefined, to: undefined },
});

<FilterBar01
  categories={categories}
  search={filters.search}
  onSearchChange={(s) => setFilters((v) => ({ ...v, search: s }))}
  category={filters.category}
  onCategoryChange={(c) => setFilters((v) => ({ ...v, category: c }))}
  dateRange={filters.dateRange}
  onDateRangeChange={(d) => setFilters((v) => ({ ...v, dateRange: d }))}
  resultsCount={filteredItems.length}
/>;`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        Or use the combined <code>onChange</code> emitter:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<FilterBar01
  categories={categories}
  onChange={({ search, category, dateRange }) => {
    setFilters({ search, category, dateRange });
  }}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Hide sub-controls</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<FilterBar01 categories={categories} hideDateRange />
<FilterBar01 hideCategories hideSearch />`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Localization</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<FilterBar01
  categories={categories}
  labels={{
    searchPlaceholder: "Haber ara...",
    allLabel: "Tümü",
    dateButtonText: "Tarih Filtrele",
    clearDateText: "Tarihi Temizle",
    resultsCountText: (n) => \`\${n} haber bulundu\`,
  }}
  formatDateRange={({ from, to }) => {
    const fmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });
    return \`\${fmt.format(from)} - \${fmt.format(to)}\`;
  }}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Search debounce</h3>
      <p className="text-muted-foreground">
        In <strong>uncontrolled</strong> mode, search is debounced 250ms by
        default — set <code>searchDebounceMs={"{0}"}</code> for instant or
        increase for slower-changing dropdowns. In <strong>controlled</strong>{" "}
        mode the debounce is bypassed; consumer&apos;s onChange fires on every
        keystroke. Debounce yourself if you need it.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Accessibility</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Search input is wrapped in <code>{"<div role=\"search\">"}</code> for landmark.
        </li>
        <li>
          Chip row uses <code>{"role=\"group\""}</code> with{" "}
          <code>aria-label</code>; each chip is a real{" "}
          <code>{"<button>"}</code> with <code>aria-pressed</code>.
        </li>
        <li>
          Results count has <code>{"aria-live=\"polite\""}</code> so updates
          announce.
        </li>
        <li>
          Clear-date button has <code>aria-label</code> from{" "}
          <code>labels.clearDateLabel</code>.
        </li>
        <li>
          Date Popover inherits ARIA from shadcn primitives.
        </li>
      </ul>
    </div>
  );
}
