# category-cloud-01 — procomp guide

> Stage 3.

## When to use

- Sidebar / inline filter affordance for categorized content (news, blogs, docs, e-commerce facets).
- When you have a fixed set of categories (typically < 20) and want users to filter by clicking one.
- When count distribution at-a-glance is valuable (the inline counts).
- When you want native button semantics + `aria-pressed` for accessibility.

## When NOT to use

- **Searchable / paginated lists of items** — use `entity-picker` (popover-driven select with cmdk search).
- **Multi-section schema-driven filters** — use `filter-stack`.
- **Composite filter with search + chips + date** — use `filter-bar-01`.
- **Multi-select** — single-select only in v0.1; multi-select is a v0.2 candidate.

## Composition patterns

### Sidebar filter with parent-driven state

```tsx
const [activeCategory, setActiveCategory] = useState<string | null>(null);
const filteredItems = useMemo(
  () => items.filter(i => activeCategory ? i.category === activeCategory : true),
  [items, activeCategory],
);

<aside>
  <CategoryCloud01
    items={categoriesWithCounts}
    value={activeCategory}
    onChange={setActiveCategory}
    title="Categories"
  />
</aside>
```

### URL-state sync

```tsx
const searchParams = useSearchParams();
const router = useRouter();
const active = searchParams.get("category");

<CategoryCloud01
  items={categories}
  value={active}
  onChange={(value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("category", value);
    else params.delete("category");
    router.push(`?${params.toString()}`);
  }}
/>
```

### Custom count format

```tsx
<CategoryCloud01
  items={items}
  formatCount={(c) => c > 999 ? ` (${(c / 1000).toFixed(1)}k)` : ` (${c})`}
/>
```

### String-array shorthand

For tags / topics where counts aren't relevant:

```tsx
<CategoryCloud01 items={["Tech", "Design", "Engineering"]} />
```

## Gotchas

### Re-clicking active clears (toggleable)

Default behavior. If `null` isn't a valid state in your app — e.g. you always require an active filter — pass `toggleable={false}`.

### Stable `items` reference

The card is `React.memo`-wrapped. Passing a fresh `items` array every render breaks memoization. Hoist outside component or `useMemo`.

### `<button>` inside `<Badge>` styling

The chip is a real `<button>` wrapping a `<Badge>`. The button has the focus-visible ring; the Badge has the visual style. If you customize Badge styling via className overrides, ensure your hover state doesn't fight the button's outline-on-focus.

### Heading semantic level

Default `h3`. Pass `headingAs="h2"` if the cloud sits at a higher level in your page (e.g. directly under the page H1).

## Migration notes

Supersedes the "Kategoriler" sidebar block in kasder `kas-social-front-v0` `NewsMagazineGrid.tsx`. The migration:

- **Preserved:** flex-wrap of pill chips, active-vs-inactive variant swap, inline counts pattern, editorial header rhythm.
- **Rewrote:** `string[]`/`{value,label,count}[]` generic input; controlled-or-uncontrolled value; native button semantics with `aria-pressed`; configurable count format; toggleable behavior.
- **Added:** ARIA group label, focus-visible ring per chip, optional title with editorial header.

Originals at [`docs/migrations/category-cloud-01/original/`](../../migrations/category-cloud-01/original/).

## Open follow-ups

- v0.2: multi-select mode (`selectionMode: 'single' | 'multi'`).
- v0.2: roving-tabindex for arrow-key navigation between chips.
- v0.2: built-in collapsing for very long lists (show 10, "+ N more" expand).
- v0.3: visual variants (rounded-lg vs rounded-full, with/without backdrop, etc.).
