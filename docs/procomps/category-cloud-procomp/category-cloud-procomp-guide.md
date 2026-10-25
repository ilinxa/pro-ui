# category-cloud — procomp guide

> Stage 3.

## When to use

- Sidebar / inline filter affordance for categorized content (news, blogs, docs, e-commerce facets).
- When you have a fixed set of categories (typically < 20) and want users to filter by clicking one.
- When count distribution at-a-glance is valuable (the inline counts).
- When you want native button semantics + `aria-pressed` for accessibility.

## When NOT to use

- **Searchable / paginated lists of items** — use `entity-picker` (popover-driven select with cmdk search).
- **Multi-section schema-driven filters** — use `filter-panel`.
- **Composite filter with search + chips + date** — use `filter-bar`.
- **Multi-select** — single-select only; multi-select is not implemented.

## Composition patterns

### Sidebar filter with parent-driven state

```tsx
const [activeCategory, setActiveCategory] = useState<string | null>(null);
const filteredItems = useMemo(
  () => items.filter(i => activeCategory ? i.category === activeCategory : true),
  [items, activeCategory],
);

<aside>
  <CategoryCloud
    items={categoriesWithCounts}
    value={activeCategory}
    onChange={setActiveCategory}
    title="Categories"
  />
</aside>
```

### URL-driven filters (link mode)

Pass `getHref` and each chip becomes a real link (`<a>` by default, or your router's link via `linkComponent`). The chip matching `value` gets `aria-current="page"`; there is no `aria-pressed`. `onChange` still fires on click and the default navigation is not prevented, so a router can handle it.

```tsx
import Link from "next/link"; // or any router link that accepts href + onClick + className

<CategoryCloud
  items={categories}
  value={activeSlug}               // derive from the current URL
  getHref={(item) => `/explore?category=${item.value}`}
  linkComponent={Link}
/>
```

`linkComponent` is rendered as an element type (never `asChild`). An item whose `getHref` returns `undefined` stays a button. `toggleable` has no meaning for link chips: clicking the active link reports its own value again, it does not clear. To offer a "clear" chip, include an item whose `getHref` points at the unfiltered URL.

In link mode, control `value` from the current URL: an uncontrolled cloud marks the last clicked chip as the current page, which is wrong after Back / Forward. A click with a modifier key (Ctrl / Cmd / Shift / Alt — open in a new tab or window) neither calls `onChange` nor moves the active chip, so `onChange` is safe for analytics but is not a navigation signal; let the link navigate. Links activate with Enter (not Space, which scrolls the page — the browser default for links); button chips take Enter and Space. A `getHref` that returns anything but a string (`undefined`, `null`) leaves that chip a button.

### Localization (labels + locale)

```tsx
<CategoryCloud
  items={items}
  locale="tr"                                   // counts via Intl.NumberFormat: 12345 -> "12.345"
  labels={{
    group: "Kategori filtresi",                 // group name when neither ariaLabel nor title is set
    count: (_n, formatted) => ` (${formatted} yazı)`,
  }}
/>
```

Group name precedence: `ariaLabel` > `title` > `labels.group`. Count text precedence: `formatCount` (full override, receives the raw number) > `labels.count(n, formatted)`. `labels` keys set to `undefined` keep the defaults (`defaultCategoryCloudLabels`). An invalid `locale` falls back to `"en"`. The default count is locale-formatted too, so English counts of 1,000 or more are grouped (`(12,345)`; 0.2.0 printed `(12345)`) — pass `formatCount={(n) => " (" + n + ")"}` for the old text.

### Custom count format

```tsx
<CategoryCloud
  items={items}
  formatCount={(c) => c > 999 ? ` (${(c / 1000).toFixed(1)}k)` : ` (${c})`} // overrides labels.count and locale
/>
```

### String-array shorthand

For tags / topics where counts aren't relevant:

```tsx
<CategoryCloud items={["Tech", "Design", "Engineering"]} />
```

## Gotchas

### Re-clicking active clears (toggleable)

Default behavior. If `null` isn't a valid state in your app — e.g. you always require an active filter — pass `toggleable={false}`.

### Stable `items` reference

The card is `React.memo`-wrapped. Passing a fresh `items` array every render breaks memoization. Hoist outside component or `useMemo`.

### `<button>` inside `<Badge>` styling

The chip is a real `<button>` wrapping a `<Badge>`. The button has the focus-visible ring; the Badge has the visual style. If you customize Badge styling via className overrides, ensure your hover state doesn't fight the button's outline-on-focus.

### Title font

The default title is the editorial serif-bold heading (`font-serif`). If your app has no serif font configured, or you want the sans stack, override it with `titleClassName` (e.g. `titleClassName="font-sans"`).

### Dev warnings

In development only: a controlled `value` that matches no item (no chip is active), and repeated `item.value`s (repeated chips are all active together), each warn once per change.

### Heading semantic level

Default `h3`. Pass `headingAs="h2"` if the cloud sits at a higher level in your page (e.g. directly under the page H1).

## Migration notes

Supersedes the "Kategoriler" sidebar block in kasder `kas-social-front-v0` `NewsMagazineGrid.tsx`. The migration:

- **Preserved:** flex-wrap of pill chips, active-vs-inactive variant swap, inline counts pattern, editorial header rhythm.
- **Rewrote:** `string[]`/`{value,label,count}[]` generic input; controlled-or-uncontrolled value; native button semantics with `aria-pressed`; configurable count format; toggleable behavior.
- **Added:** ARIA group label, focus-visible ring per chip, optional title with editorial header.

Originals at [`docs/migrations/category-cloud/original/`](../../migrations/category-cloud/original/).

## Open follow-ups

- Not implemented: multi-select mode (`selectionMode: 'single' | 'multi'`).
- Not implemented: roving-tabindex for arrow-key navigation between chips.
- Not implemented: built-in collapsing for very long lists (show 10, "+ N more" expand).
- Not implemented: visual variants (rounded-lg vs rounded-full, with/without backdrop, etc.).
