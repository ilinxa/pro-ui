export default function FilterBarUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>FilterBar</code> in any browse-and-filter UI: news
        landing pages, blog archives, doc indexes, file browsers,
        dashboards, e-commerce category pages. Three sub-controls in one
        bar — search + category chips + date-range — plus an optional
        results count. Each is independently controlled-or-uncontrolled.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Minimal example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { FilterBar } from "@/components/filter-bar";

<FilterBar
  categories={[
    { value: "tech", label: "Technology" },
    { value: "design", label: "Design" },
  ]}
  resultsCount={42}
/>;`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        With no controlled props, all 3 sub-controls run uncontrolled with
        a 250ms debounce on the search. Add <code>onChange</code> to hear
        about each change.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Controlled (the common case)</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const [filters, setFilters] = useState<FilterBarValue>({
  search: "",
  category: null,
  dateRange: { from: undefined, to: undefined },
});

<FilterBar
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
        <code>{`<FilterBar
  categories={categories}
  onChange={({ search, category, dateRange }) => {
    setFilters({ search, category, dateRange });
  }}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Hide sub-controls</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<FilterBar categories={categories} hideDateRange />
<FilterBar hideCategories hideSearch />`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Localization</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<FilterBar
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

      <h3 className="mb-2 mt-6 text-base font-semibold">Locale and time zone</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { tr } from "date-fns/locale";

<FilterBar
  categories={categories}
  locale="tr"             // default date formats + grouped count
  timeZone="Europe/Istanbul"
  calendarLocale={tr}     // month and day names; you import it, we don't bundle locales
  resultsCount={1234}
/>;`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        <code>locale</code> defaults to <code>&quot;en&quot;</code>; an invalid
        tag falls back to <code>&quot;en&quot;</code>. The count is formatted
        with <code>Intl.NumberFormat</code> only when you pass{" "}
        <code>locale</code>. The default count text is &quot;1 item
        found&quot; / &quot;{"{n}"} items found&quot;; translate it through{" "}
        <code>labels.resultsCountText</code>. <code>formatDate</code> /{" "}
        <code>formatDateRange</code> still override the defaults. A well-formed
        tag the runtime has no data for also falls back to{" "}
        <code>&quot;en&quot;</code>. <code>timeZone</code> reaches both the
        default formatting and the calendar, so the day picked is the day
        shown. The default time zone is the runtime&apos;s, so when you server
        render a preset date range, pass <code>timeZone</code> so server and
        client agree.
      </p>
      <p className="mt-2 text-muted-foreground">
        <code>dir=&quot;rtl&quot;</code> sets the direction of the calendar
        popover (default: resolved from the nearest <code>[dir]</code>); pass{" "}
        <code>calendarLocale</code> for localized month and day names. If the
        calendar chunk fails to load, a short message with a retry button shows
        instead (<code>labels.calendarLoadErrorText</code> /{" "}
        <code>labels.calendarRetryText</code>).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Alignment and the search accessory</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<FilterBar
  categories={categories}
  align="left"                              // search, filter row and wrapped chip lines
  searchAccessory={<FilterMenuButton />}    // inline end of the search field, after the input in tab order
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Search debounce</h3>
      <p className="text-muted-foreground">
        In <strong>uncontrolled</strong> mode, search is debounced 250ms by
        default (<code>searchDebounceMs</code>) and emits one{" "}
        <code>onChange</code> per commit. In <strong>controlled</strong> mode{" "}
        <code>onSearchChange</code> fires on every keystroke unless you set{" "}
        <code>debounceControlledSearch</code>: the input then keeps a local
        echo and commits after <code>searchDebounceMs</code>. The{" "}
        <code>search</code> prop wins whenever it changes to a value that is
        not one of the field&apos;s own commits (a URL change, a reset): the
        field resyncs to it, and a host that adopts commits late is fine. While
        a commit is pending the field shows the user&apos;s typing, and a host
        that never adopts a commit leaves the field showing the typed text
        until the prop next changes. Using the chips or the date range while a
        search commit is pending commits the visible text first, so that
        interaction&apos;s single <code>onChange</code> carries it.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Migrating to 0.3.0</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong><code>onChange</code> no longer fires on mount</strong>, when
          its own identity changes, or when a controlled prop changes from
          outside. It fires once per user interaction. Delete any &quot;skip
          the first call&quot; ref. To keep the old start, pass{" "}
          <code>emitInitialChange</code>: one call on mount with the initial
          value.
        </li>
        <li>
          <strong>
            The default date locale is now <code>&quot;en&quot;</code>
          </strong>{" "}
          instead of the browser&apos;s language, so the server and client
          render the same text. Pass <code>locale</code> to get another one.
        </li>
        <li>
          The count reads &quot;1 item found&quot; for one result (it was
          &quot;1 items found&quot;).
        </li>
        <li>
          The calendar loads when the date popover first opens; it never loads
          with <code>hideDateRange</code>.
        </li>
      </ul>

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
