# category-cloud-01 — procomp plan

> Stage 2: how. The implementation contract.
>
> See [description](./category-cloud-01-procomp-description.md) and [analysis](../../migrations/category-cloud-01/analysis.md).

## Final API

```ts
// types.ts

export type CategoryCloudHeadingLevel = 'h2' | 'h3' | 'h4';

export interface CategoryCloudItem {
  /** Stable identifier, used as the selection value. */
  value: string;
  /** Display text. Defaults to `value` if not provided. */
  label?: string;
  /** Optional count rendered after the label. */
  count?: number;
}

export interface CategoryCloudProps {
  /** Categories to render. Pass `string[]` as shorthand for `[{value,label}]`. */
  items: CategoryCloudItem[] | string[];

  /** Controlled selection value. Pass null to clear. */
  value?: string | null;
  /** Uncontrolled initial selection. Default: null. */
  defaultValue?: string | null;
  /** Selection change callback. Fires with null when re-clicking active (if toggleable). */
  onChange?: (value: string | null) => void;

  /** Whether re-clicking the active chip clears the selection. Default: true. */
  toggleable?: boolean;

  /** Optional title rendered above the cloud. */
  title?: string;
  /** Heading semantic level. Default: 'h3'. */
  headingAs?: CategoryCloudHeadingLevel;

  /** Custom count formatter. Default: `(count) => \` (\${count})\``. */
  formatCount?: (count: number) => string;

  /** ARIA group label. Defaults to `title` if provided. */
  ariaLabel?: string;

  /** Override classes for the root container. */
  className?: string;
  /** Override classes for the title heading. */
  titleClassName?: string;
}
```

## File-by-file plan

```
src/registry/components/forms/category-cloud-01/
├── category-cloud-01.tsx     # 1
├── parts/
│   └── category-chip.tsx     # 2
├── types.ts                  # 3
├── dummy-data.ts             # 4
├── demo.tsx                  # 5
├── usage.tsx                 # 6
├── meta.ts                   # 7
└── index.ts                  # 8
```

### 1. `category-cloud-01.tsx` — root

- `"use client"` — uses `useState` for uncontrolled mode.
- `React.memo` wrapped.
- Resolves controlled-vs-uncontrolled value.
- Normalizes `items: string[]` to `CategoryCloudItem[]`.
- Computes a stable `formatCount` (default: `(c) => \` (\${c})\``).
- Renders title (if present) + `<div role="group" aria-label={...} className="flex flex-wrap gap-2">`.
- Maps items to `<CategoryChip>` parts.
- Click handler: if value === item.value AND toggleable → set null; else set value.

### 2. `parts/category-chip.tsx`

- `<button type="button" role="button" aria-pressed={isActive} onClick={onClick} className="rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none">`
  - Inside: a `<Badge>` styled as default (active) or secondary (inactive).
- The `<button>` wraps the `<Badge>` so we get native button semantics + Badge visual.

### 3. `types.ts` — public types as shown.

### 4. `dummy-data.ts`

```ts
export const DUMMY_CATEGORIES_TR: CategoryCloudItem[] = [
  { value: 'urban-development', label: 'Kentsel Dönüşüm', count: 2 },
  { value: 'sustainability', label: 'Sürdürülebilirlik', count: 2 },
  { value: 'technology', label: 'Teknoloji', count: 2 },
  { value: 'events', label: 'Etkinlik', count: 2 },
  { value: 'announcement', label: 'Duyuru', count: 2 },
  { value: 'research', label: 'Araştırma', count: 2 },
];
```

### 5. `demo.tsx`

3 tabs:
1. **Basic** — `string[]` shorthand, no counts.
2. **With counts** — full items with Turkish labels.
3. **Controlled** — sibling `<p>Active: {value}</p>` shows external state.

### 6. `usage.tsx`

Code blocks: minimal, controlled, custom format, with title, with aria-label.

### 7. `meta.ts`

```ts
{
  slug: 'category-cloud-01',
  name: 'Category Cloud 01',
  category: 'forms',
  // ...
}
```

### 8. `index.ts`

Standard exports.

## Dependencies

- `@/components/ui/badge`
- `@/lib/utils`

No new deps.

## Composition pattern

Headless wrapping; one part for the chip. Native `<button>` for keyboard semantics; `<Badge>` inside for visual.

## Client vs server

**Client component** — uses `useState` for uncontrolled mode + `useId` for ARIA.

## Edge cases

| Case | Behavior |
|---|---|
| `items` empty | Renders nothing (or just the title if provided). |
| `items` is `string[]` | Desugars to `[{value: s, label: s}]`. |
| `count` undefined on an item | Count omitted from the chip label. |
| `count = 0` | Renders as ` (0)`. |
| Re-click active chip | Clears to null (if `toggleable: true`); no-op (if `false`). |
| Controlled `value` not in `items` | Nothing matches; nothing visually selected. Acceptable. |
| RTL | Tailwind flex-wrap reverses correctly. |

## Accessibility

- Each chip is a real `<button type="button">` with `aria-pressed`.
- Container has `role="group" aria-label`.
- Focus-visible ring per chip.
- Configurable heading level.
- WCAG 2.1 AA.

## Verification checklist

- [ ] tsc / lint / build clean.
- [ ] SSR 200 with all 3 demo tabs.
- [ ] Tab between chips works; Enter/Space activates.

## Risks

1. **`<button>` inside `<Badge>` styling** — Badge's hover state may visually conflict with button's. Mitigation: pass classes to Badge via `className`; if conflict surfaces, switch to `<button>` styled inline as a pill instead of nesting Badge.
2. **`toggleable: false` confusion** — disabling toggle means active never clears. Document clearly in usage.tsx.
