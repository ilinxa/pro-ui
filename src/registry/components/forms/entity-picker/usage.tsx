export default function EntityPickerUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>EntityPicker</code> whenever a host has a list of typed
        entities (graph nodes, users, files, organizations, …) and a user
        needs to pick one or many. Generic over the entity type via{" "}
        <code>{`<EntityPicker<T extends EntityLike>>`}</code>; supports single
        or multi mode with mode-aware <code>value</code> typing via TypeScript
        function overloads. Built on shadcn <code>Command</code> (cmdk) for
        search and <code>Popover</code> for the dropdown.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic single</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { EntityPicker } from "@/components/entity-picker";

interface Node {
  id: string;
  label: string;
  kind: "person" | "project";
}

const NODES: Node[] = [/* ... */];

export function NodePicker() {
  const [value, setValue] = useState<Node | null>(null);
  return (
    <EntityPicker<Node>
      items={NODES}
      value={value}
      onChange={setValue}
      triggerLabel="Pick a node"
    />
  );
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Multi</h3>
      <p className="text-muted-foreground">
        Set <code>{`mode="multi"`}</code>. <code>value</code> becomes{" "}
        <code>T[]</code>; chips render in the trigger; Backspace on empty
        search removes the last chip; chip-X buttons remove individual chips.
        Selection order is the order picked (no drag-to-reorder).
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<EntityPicker<Node>
  mode="multi"
  items={NODES}
  value={selected}
  onChange={setSelected}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Kinds + badges</h3>
      <p className="text-muted-foreground">
        When items carry a <code>kind</code>, supply a{" "}
        <code>kinds: Record&lt;string, KindMeta&gt;</code> map keyed by kind
        value. Each <code>KindMeta</code> has a <code>label</code> and an
        optional <code>color</code> (CSS variable name or OKLCH literal).
        Badges render in result rows + chips; toggle with{" "}
        <code>showKindBadges</code> (defaults to true iff any item or any
        selected value has a kind, so chips keep their badge while{" "}
        <code>items</code> is empty).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom match</h3>
      <p className="text-muted-foreground">
        Default match is case-insensitive substring on{" "}
        <code>item.label</code> via <code>String.toLowerCase()</code>, or{" "}
        <code>toLocaleLowerCase(locale)</code> when you pass{" "}
        <code>locale</code> (so <code>locale=&quot;tr&quot;</code> finds
        &quot;İstanbul&quot; for &quot;istanbul&quot;). Pass{" "}
        <code>{`match: (item, query) => boolean`}</code> for richer search
        (e.g., search across <code>description</code>, fuzzy-rank via
        Fuse.js, or <code>Intl.Collator</code> for accent-insensitive
        matching). Filter cost runs on every keystroke; keep predicates
        cheap.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom slots</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>renderItem(item, ctx)</code> — replace the result row body.
          ctx has <code>{`{ selected, query }`}</code>. The CommandItem
          chrome (highlight, click handler) is preserved.
        </li>
        <li>
          <code>renderTrigger(ctx)</code> — replace the trigger entirely. ctx
          has <code>{`{ value, open, triggerRef }`}</code>. Attach{" "}
          <code>triggerRef</code> to your root focusable element so{" "}
          <code>focus()</code> ref method works.
        </li>
        <li>
          <code>renderEmpty(ctx)</code> — replace the empty-state copy. ctx
          has <code>{`{ query, itemCount }`}</code>; default is &quot;No
          results&quot; or &quot;Nothing to pick from&quot;.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        properties-form integration
      </h3>
      <p className="text-muted-foreground">
        When composing entity-picker inside properties-form&apos;s{" "}
        <code>custom</code> field renderer, pass{" "}
        <code>{`id={fieldId}`}</code> from <code>FieldRendererProps</code> so{" "}
        <code>{`<label htmlFor={fieldId}>`}</code> associates correctly.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`{
  key: "owner",
  type: "string",  // type ignored when renderer is set
  label: "Owner",
  renderer: ({ value, onChange, fieldId, error, errorId }) => (
    <EntityPicker<User>
      id={fieldId}
      items={users}
      value={value as User | null}
      onChange={onChange}
      triggerLabel="Pick owner"
    />
  ),
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Imperative handle</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const ref = useRef<EntityPickerHandle>(null);
// ...
ref.current?.focus();
ref.current?.open();
ref.current?.close();
ref.current?.clear();`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Items reference stability
      </h3>
      <p className="text-muted-foreground">
        Inline <code>{`items={[...]}`}</code> rebuilds entity references each
        render and re-derives cmdk&apos;s filter index. In-repo, the React
        Compiler memoizes inline literals at the call site. For NPM
        consumers without the Compiler, hoist to module scope or wrap with{" "}
        <code>useMemo</code>. A dev-only warning fires after &gt;5 successive
        unstable renders.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Selection equality
      </h3>
      <p className="text-muted-foreground">
        <code>onChange</code> fires only when the id-set of the selection
        changes. Same-id new-reference values do not fire (avoids spurious
        re-renders when the host re-derives entity objects upstream).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Keyboard
      </h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>Tab / Shift+Tab — focus trigger and chip-X buttons.</li>
        <li>Enter / Space / ↓ on trigger — open dropdown.</li>
        <li>↑ / ↓ inside search — navigate results (cmdk).</li>
        <li>Enter on highlighted result — toggle selection.</li>
        <li>Esc — close dropdown.</li>
        <li>Backspace on empty search (multi mode) — remove last chip.</li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Server-side search (the host owns the data)
      </h3>
      <p className="text-muted-foreground">
        The picker never fetches. You own the query, the request and the{" "}
        <code>items</code>; the picker shows what you give it. Control the
        search text with <code>query</code> / <code>onQueryChange</code>, turn
        the built-in filter off with <code>{`filterItems={false}`}</code>
        (rows render as given, <code>match</code> is ignored), and report the
        request state with <code>loading</code>, <code>error</code> and{" "}
        <code>onRetry</code>. Precedence is loading, then error, then empty;
        the Retry button renders only when <code>onRetry</code> is passed.
        Pagination is a &quot;Load more&quot; row that appears only when both{" "}
        <code>hasMore</code> and <code>onLoadMore</code> are passed (
        <code>loadingMore</code> disables it while a page loads). Guard against
        stale responses in your fetch layer, and pass only the latest result.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const [query, setQuery] = useState("");
const { data, isFetching, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
  useMyInfiniteSearch(query);

<EntityPicker<User>
  items={data ?? []}
  value={value}
  onChange={setValue}
  query={query}
  onQueryChange={(q) => setQuery(q)}   // reason: "input" | "reset" (on close)
  filterItems={false}
  loading={isFetching && !isFetchingNextPage}
  error={isError}
  onRetry={refetch}
  hasMore={hasNextPage}
  onLoadMore={fetchNextPage}
  loadingMore={isFetchingNextPage}
/>`}</code>
      </pre>
      <p className="text-muted-foreground">
        When loading settles while the popover is open, a polite live region
        announces <code>labels.resultsCount(count, formatted)</code> once (not per keystroke).
        Use <code>renderLoading</code> / <code>renderError</code> to replace
        the default rows.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Labels and locale</h3>
      <p className="text-muted-foreground">
        Every string is a key of <code>labels</code> (a partial of{" "}
        <code>EntityPickerLabels</code>; an <code>undefined</code> key keeps
        the default). The English defaults are exported as{" "}
        <code>defaultEntityPickerLabels</code>. <code>placeholder</code> and{" "}
        <code>triggerLabel</code> still work as deprecated aliases and win over
        their keys. <code>locale</code> drives the default match&apos;s case
        folding and the number passed to <code>resultsCount</code>.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<EntityPicker<City>
  items={cities}
  value={city}
  onChange={setCity}
  locale="tr"
  labels={{
    searchPlaceholder: "Ara…",
    searchLabel: "Şehir ara",
    triggerPlaceholder: "Şehir seç…",
    removeChip: (label) => label + " öğesini kaldır",
    noResults: "Sonuç yok",
    nothingToPick: "Seçenek yok",
    resultsCount: (n, formatted) => formatted + " sonuç",
  }}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Not implemented</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>Virtualization for very long lists.</li>
        <li>&quot;Create new&quot; affordance via <code>onCreate(query)</code>.</li>
        <li>Multi-section grouping via <code>groups</code>.</li>
        <li>Drag-to-reorder chips (multi mode).</li>
        <li>Fuzzy-rank via <code>{`rank: (item, query) => number`}</code>.</li>
        <li>Infinite scroll (pagination is the &quot;Load more&quot; row).</li>
      </ul>
    </div>
  );
}
