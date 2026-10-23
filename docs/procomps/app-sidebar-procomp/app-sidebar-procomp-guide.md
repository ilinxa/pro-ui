# `app-sidebar` — Consumer guide

> **Stage:** 3 of 3 (consumer-facing usage + migration notes)
> **Current version:** `0.5.0` · **Status:** alpha
> **Companion docs:** [description](app-sidebar-procomp-description.md) (its "v0.5.0 update" section wins) · [plan](app-sidebar-procomp-plan.md) · [loop file](app-sidebar-loop.md)

## Installation

```bash
pnpm dlx shadcn@latest add @ilinxa/app-sidebar
# Optional — the demo dummy data:
pnpm dlx shadcn@latest add @ilinxa/app-sidebar-fixtures
```

This pulls in the shadcn primitives `avatar`, `button`, `dropdown-menu` and `sheet`, plus `lucide-react@^1.11.0`. Your `sheet` must support `showCloseButton` on `SheetContent`; every current shadcn style does. An older `sheet` renders its own English "Close" button next to ours, so update it with `pnpm dlx shadcn@latest add sheet --overwrite`. Install has been proven on shadcn CLI 4.18 and 3.8.5. It also adds `@theme` mappings, but only when they are absent, so yours always win:

```css
--color-success: var(--success, oklch(0.65 0.15 150));
--color-warning: var(--warning, oklch(0.78 0.16 75));
--color-brand: var(--brand, var(--primary));
--color-brand-foreground: var(--brand-foreground, var(--primary-foreground));
--color-destructive-foreground: var(--destructive-foreground, var(--background));
```

## Minimal

```tsx
"use client";
import { AppSidebar, type NavLinkProps } from "@/components/app-sidebar";
import Link from "next/link";

// Module scope: an inline component gets a new identity every render and remounts every row.
const AppLink = (props: NavLinkProps) => <Link {...props} />;

<AppSidebar items={items} currentPath={pathname} linkComponent={AppLink} />
```

`labels`, `formatBadgeCount`, `linkComponent` and the render props are functions. They can't cross a server→client boundary, so build them inside a client component, for example from your i18n hook.

## Collapse: uncontrolled, controlled, or lifted

- **Uncontrolled:** `defaultCollapsed`. Add `storageKey` to persist the collapsed state and section folds in `localStorage`. Storage is read **after mount**, so a persisted `collapsed: true` causes one expanded → collapsed transition on load. For SSR without that flip, use the controlled pattern below.
- **Controlled:** `isCollapsed` + `onCollapsedChange`.
  - The toggle (and `handle.toggleCollapse()` / `setCollapsed()`) requests `!isCollapsed`, computed from the **rendered** value. The width changes only when your prop changes.
  - With `isCollapsed` set, `storageKey` never reads or writes `collapsed`. Section folds still persist, and the stored `collapsed` value is left untouched.
  - `isMobileOpen` + `onMobileOpenChange` work the same way.
- **Lifted:** `state={useAppSidebarState({...})}` owns everything, including `storageKey`. It accepts `isOwner`, `currentMaxMembers`, `bypassFiltering` and `keepEmptySections`, with the same meanings as on the component.

### Server cookie (no first-paint flip)

```tsx
// Server component
const collapsed = (await cookies()).get("sidebar-collapsed")?.value === "1";
return <Shell initialCollapsed={collapsed} />;

// Client
"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

function Shell({ initialCollapsed }: { initialCollapsed: boolean }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  return (
    <AppSidebar
      items={items}
      currentPath={pathname}
      isCollapsed={collapsed}
      onCollapsedChange={({ collapsed: next }) => {
        setCollapsed(next);
        document.cookie = `sidebar-collapsed=${next ? 1 : 0}; path=/; max-age=31536000`;
      }}
    />
  );
}
```

`renderToString` with `isCollapsed` already emits `data-collapsed="true"` and the collapsed width.

## Mobile drawer

Below `mobileBreakpoint` (default `lg`), the rail is CSS-hidden and the drawer takes over:

```tsx
import { useRef } from "react";
import { AppSidebar, AppSidebarTrigger, type AppSidebarHandle } from "@/components/app-sidebar";

const sidebarRef = useRef<AppSidebarHandle>(null);

<header>
  {/* A sibling of the sidebar: it can't see its context, so give it the handle and its label. */}
  <AppSidebarTrigger controls={sidebarRef} aria-label={t("openNavigation")} className="lg:hidden" />
</header>
<AppSidebar ref={sidebarRef} items={items} currentPath={pathname} labels={labels} />
```

A trigger rendered **inside** the sidebar (in `headerSlot`, for example) finds the sidebar through context and takes its name from `labels.openNavigation`. A trigger **outside** the sidebar needs `controls`. It can't read `labels` either, so pass its `aria-label` yourself. A trigger with neither is inert and warns in development. If you build your own hamburger button, call `sidebarRef.current?.toggleMobile("trigger")`.

- **Full labels always.** The drawer renders its chrome as never collapsed: user name and handle, brand label, primary-action label, and badges at the inline end. Render props inside the drawer receive `isCollapsed: false`.
- **Mode-aware slots.** `topSlot` may be a function: `topSlot={({ mode, isCollapsed }) => mode === "mobile" ? <Full/> : <Compact collapsed={isCollapsed}/>}`. It is called once per render for each mode, the drawer included even while closed. Return elements from it and don't call hooks in it; put hooks inside the components it returns. Any descendant can call `useAppSidebarMode()`, which returns `"desktop" | "mobile" | null`.
- **Styling.** `drawerClassName` and `drawerStyle` apply to the drawer panel. Its width is `--ilinxa-sidebar-drawer-w` (default `18rem`), capped by the sheet primitive's `max-w-sm` (24rem) on `sm` and up. `style` applies to the desktop `<nav>` and the in-tree drawer wrapper: its `--ilinxa-*` variables reach the drawer panel, but other properties don't (use `drawerStyle`).
- **Keyboard.** The arrow keys rove inside the drawer exactly as in the rail.
- **Close button.** It is labelled by `labels.closeNavigation`, which replaces the primitive's English sr-only "Close".
- **Close reasons.** `onMobileOpenChange({ open, reason })` reports `"trigger" | "item-click" | "outside-click" | "escape" | "imperative"`.

## Labels (every string)

```tsx
import { AppSidebar, type AppSidebarLabels } from "@/components/app-sidebar";

const tr: Partial<AppSidebarLabels> = {
  navigation: "Ana gezinme",
  expandSidebar: "Kenar çubuğunu genişlet",
  collapseSidebar: "Kenar çubuğunu daralt",
  openNavigation: "Gezinmeyi aç",
  closeNavigation: "Gezinmeyi kapat",
  skipToContent: "İçeriğe geç",
  loading: "Gezinme yükleniyor",
  userMenu: (name) => `${name} — menüyü aç`,
  itemWithBadge: (label, value) => `${label}, ${value} yeni`,
  itemWithIndicator: (label) => `${label}, yeni`,
  emptyState: { "no-items": { title: "Öğe yok" } },
};

<AppSidebar labels={tr} … />
```

- `labels` takes an `AppSidebarLabelsInput`: every key is optional, and `emptyState` merges per reason over `DEFAULT_APP_SIDEBAR_LABELS`. A key passed as `undefined` keeps its default.
- Memoize the object (`useMemo` or module scope). A new `labels` object on every render re-renders every part.
- The older `aria-label`, `skipLinkLabel` and trigger `aria-label` props still win when you pass them.
- **Badge-aware names.** A row whose badge shows a number or string is named `itemWithBadge(label, value)`, both collapsed and expanded, and the visual badge is hidden from assistive tech so it isn't read twice.
  - `value` is the raw value, so a capped `9+` badge with value 25 is announced as 25, which lets your function pluralize.
  - The name replaces the row's content name, including a visible `shortcut` / `accessory`.
  - A dot or pulse badge gives `itemWithIndicator(label)`.
  - A hidden zero, `null`, `""`, a `renderBadge` that returns `null`, or no badge gives the plain label.
  - Keep `renderBadge` output non-interactive: it is `aria-hidden` when the row carries the badge name.

## Badges

```ts
{ id: "msgs", label: "Messages", badge: 12 }
{ id: "alerts", label: "Alerts", badge: { value: 3, tone: "destructive", activeTone: "brand" } }
{ id: "dm", label: "Direct", badge: { value: 1, variant: "dot" } }
{ id: "hidden", label: "Requests", badge: { value: null } } // withheld → renders nothing
```

- **Tones:** `default` · `accent` · `destructive` (default) · `muted` · `brand` (`--brand` / `--brand-foreground`). `activeTone` replaces `tone` on the active row.
- **Counts:** `formatBadgeCount={(n, max) => (n > max ? `${max}+` : new Intl.NumberFormat("tr").format(n))}` controls the visible text.
- **Size:** the corner badge, drawn when collapsed, is `--ilinxa-nav-badge-corner-size` (default `1rem`; the social prototype uses `1.25rem`). Its halo is `--ilinxa-nav-badge-halo`.

## Theming (CSS variables)

Defaults live where each variable is read (`var(--x, default)`), so **a declaration on any ancestor wins**: `:root`, a layout wrapper, a theme class. Values passed through `collapsedWidth`, `expandedWidth`, `transitionDuration` or `style` are set inline and win over ancestors.

The drawer is portalled out of your tree, so when it opens it copies the effective values from its in-tree wrapper. The copy holds resolved values and isn't refreshed while the drawer is open: a theme switch takes effect the next time it opens.

`APP_SIDEBAR_CSS_VARS` (type `AppSidebarCssVar`) lists every variable and its default.

| Variable | Default |
|---|---|
| `--ilinxa-sidebar-w-collapsed` / `-w-expanded` | `5rem` / `16rem` |
| `--ilinxa-sidebar-transition-duration` | `300ms` |
| `--ilinxa-sidebar-drawer-w` | `18rem` |
| `--ilinxa-sidebar-bg` / `--ilinxa-sidebar-fg` / `--ilinxa-sidebar-border` | `var(--card)` / `var(--foreground)` / `var(--border)` |
| `--ilinxa-nav-hover-bg` | `var(--muted)` |
| `--ilinxa-sidebar-row-h` / `-row-gap` / `-px` | `2.75rem` / `0.25rem` / `0.75rem` |
| `--ilinxa-nav-row-radius` | `var(--radius-lg)` |
| `--ilinxa-nav-active-bg` / `-active-fg` / `-active-bar-w` | `var(--primary)` / `var(--primary-foreground)` / `3px` |
| `--ilinxa-nav-badge-size` / `-badge-corner-size` / `-badge-halo` | `1.25rem` / `1rem` / `var(--card)` |
| `--ilinxa-nav-indent-step` | `0` (section items, expanded rail only) |

shadcn sidebar tokens (and the social prototype's rail):

```css
.app-shell {
  --ilinxa-sidebar-bg: var(--sidebar);
  --ilinxa-sidebar-fg: var(--sidebar-foreground);
  --ilinxa-sidebar-border: var(--sidebar-border);
  --ilinxa-nav-hover-bg: var(--sidebar-accent);
  --ilinxa-nav-active-bg: var(--sidebar-primary);
  --ilinxa-nav-active-fg: var(--sidebar-primary-foreground);
  --ilinxa-nav-badge-halo: var(--sidebar);
  --ilinxa-nav-badge-corner-size: 1.25rem; /* prototype: 20px corner badge */
  --ilinxa-nav-row-radius: 0.75rem;        /* prototype: 12px rows (80 / 256 px rail and 44 px rows are the defaults) */
  --brand: oklch(0.78 0.16 75);            /* your brand accent — used by tone "brand" */
  --brand-foreground: oklch(0.18 0 0);
}
```

Secondary text (handles, counts, section titles) stays on `--muted-foreground`.

Presence dots use `bg-success` (online), `bg-muted-foreground` (offline), `bg-destructive` (busy) and `bg-warning` (away). Define `--success` / `--warning` in your theme, or rely on the fallbacks.

## Right-to-left

```tsx
<div dir="rtl"><AppSidebar items={items} currentPath={pathname} labels={ar} /></div>
// or <AppSidebar dir="rtl" … />
```

- `side` (`AppSidebarSide`) accepts `"start"` (default), `"end"`, `"left"` and `"right"`. `start` is the right edge in RTL, which also decides the border edge and the side the drawer opens from. `mobileDrawerSide` defaults to `side`.
- `left` / `right` keep their v0.4 behaviour: the drawer and tooltips stay physical, but the border still flips under RTL (a legacy hook). New code should use `start` / `end`.
- `data-side` reflects the prop as given (`"start"` by default).
- The direction comes from the `dir` prop, or else from the computed direction read after mount. It isn't re-read later, so pass `dir` if you switch direction without remounting.
- What follows the direction:
  - collapsed-rail tooltips open toward the content
  - ← / → expand and collapse sections, mirrored in RTL
  - the active bar sits on the inline-start edge
  - the collapse icon mirrors for a right-edge rail

## Keyboard

- ↑ / ↓ move between rows and wrap at the ends, and Home / End jump to the first and last row.
- ← / → fold and unfold section headers, mirrored in RTL.
- Enter follows a focused link row, and Enter or Space toggles a focused section header.
- Key events from form controls (an `<input>` in `topSlot`, a `combobox`…) are ignored, so typing never moves focus.

## Render-prop slots

- **`renderItem`** receives `defaultRender`; return content, not an `<li>` (the library wraps it).
- **`renderSection`** receives `defaultRender`; return an `<li>` (it is placed directly in the list).
- **`renderBadge`** and **`renderLoading`** receive `defaultRender`.
- **`renderTooltipContent`** (`{ item, isActive }`) and **`renderEmptyState`** (`{ reason }`) don't.
- Wrap `defaultRender` in your own tooltip or hover card; the sidebar's internal tooltip isn't exported.

## Migration v0.4.x → v0.5.0

| 0.4 | 0.5 |
|---|---|
| `side` default `"left"` | `"start"`. Identical in LTR. RTL apps now get a right-edge border and a right-side drawer. |
| CSS defaults set inline on the `<nav>`, wrapper and drawer (ancestors couldn't override them) | defaults at the read site; ancestors win; inline only for passed props |
| `--ilinxa-sidebar-row-h/-row-gap/-px`, `--ilinxa-nav-indent-step` had no effect | wired. **Rows are now 2.75rem tall (were 2.5rem).** The indent defaults to `0`. |
| drawer `w-72`, which nova / base sheets overrode to 75% wide (their `data-[side=*]:w-3/4` outranked it) | `--ilinxa-sidebar-drawer-w`, emitted so that it wins on every sheet style: **18rem everywhere** (capped at 24rem) |
| drawer showed collapsed parts when the rail was collapsed | always full labels |
| controlled `isCollapsed` + `storageKey`: storage fought the prop, and the first click could be a no-op | storage ignores `collapsed` while controlled; the toggle requests `!isCollapsed` |
| presence dots `bg-emerald-500` … | semantic tokens (`--success`, `--warning`) |
| hard-coded English strings | `labels` |
| collapsed rows: name was the plain label | badge-aware names, collapsed and expanded |
| `NavBadgeConfig.value` never `null` | `null` = withheld; new tone `brand`, `activeTone` |
| `topSlot: ReactNode` | `ReactNode \| (args: AppSidebarTopSlotArgs) => ReactNode` |
| default `data-side="left"` | `data-side="start"` (the prop as given) |
| section body `<ul role="group">`, plain titles `<h6>` | `<ul aria-label>` (the role orphaned its rows: axe `listitem`); titles are `aria-hidden` visuals (an `<h6>` broke the page's heading order) |
| expanded row named by its content ("Notifications 5") | badge rows named `itemWithBadge(label, value)` ("Notifications, 5"); update name-based test selectors |
| drawer close button from the sheet primitive | the sidebar's own, labelled (`showCloseButton={false}`) |
| `NavBadgeConfig.value` never `null` (`renderBadge` readers) | `number \| string \| ReactNode \| null` |

Earlier migrations (v0.2 → v0.3: `renderItem` wraps in one `<li>`, `onMobileOpenChange.reason`, `NavUserMenuItemSelectEvent`) are recorded in the description's v0.3.0 addendum.

## Gotchas

- **Memoize `items` and `labels`** (`useMemo`). A new object every render invalidates memoization. There is no runtime warning for this.
- `<AppSidebar state={useAppSidebarState(…)}>` owns collapse state: an `isCollapsed` passed alongside it is ignored.
- **Define `linkComponent` at module scope**, for the same reason.
- **The rail/drawer swap is CSS-gated** (no SSR flash). `mobileBreakpoint` takes `sm` · `md` · `lg` · `xl` · `2xl`.
- `activeVariant`: `fill` · `left-bar` (inline-start bar) · `right-bar` (inline-end bar) · `outline` · `subtle`.

## Types

`AppSidebarProps` · `AppSidebarHandle` · `AppSidebarLabels` / `AppSidebarLabelsInput` · `AppSidebarSide` · `AppSidebarMode` · `AppSidebarTopSlotArgs` · `NavBadgeConfig` / `NavBadgeTone` · `AppSidebarCssVar` · render-arg types `AppSidebarRender*Args` — all exported from `@/components/app-sidebar`.

## Related

- [`@ilinxa/account-switcher`](../account-switcher-procomp/account-switcher-procomp-description.md) — canonical `topSlot` occupant. Use the `topSlot` function form to give it a drawer variant.
