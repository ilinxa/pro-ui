# `sidebar-nav-01` — Pro-component Description (Stage 1)

> **Stage:** 1 of 3 · **Status:** ✅ Signed off (GATE 1 closed 2026-05-22 — all 14 Q-Ps confirmed: defaults accepted across Q1–Q14)
> **Slug:** `sidebar-nav-01` · **Category:** `navigation`
> **Release model:** **single feature-complete v0.1.** No phased v0.2 / v0.3 deferrals — every capability that belongs in this component ships on day one. Per the project's dynamicity-primacy memory: "add it later is a breaking change."
> **Conceptual lineage:** modern collapsible app-shell sidebars (Linear, Notion, Slack, Discord, Vercel dashboard). **Sibling-of-`bottom-tab-bar-01`** — shares the `<NavBadge>` part + `NavItem` schema via cross-procomp relative imports (F-S1 lock).
>
> **Migration origin:** [`docs/migrations/social-nav-system/`](../../migrations/social-nav-system/) — port of kasder's `SocialSidebar.tsx` (174 LOC). 80% rewrite / 20% direct visual port; design DNA preserved, structure + dynamism + a11y + portability rewritten. See [`analysis.md`](../../migrations/social-nav-system/analysis.md) for the extraction pass (23-finding deep audit on 2026-05-22 expanded the v0.1 surface beyond the source).
>
> **🔁 GATE-1 re-validation pass — 2026-05-22.** Description re-audited per `feedback_re_validation_pass_catches_real_issues`. **22 substantive findings** across 5 categories (B1–B22) — folded back as L27–L40 new locks + Q11–Q14 added open questions + 2 inline corrections (`<nav>` root element lock + tighter slot signatures). Audit appendix at the bottom (§11) documents the full delta.

This is the **description** doc. Its job is to pin down what we're building and why, surface open decisions, and earn sign-off before any planning or code.

---

## 1. Problem

App-shell navigation is the most common high-touch surface in any product, yet shadcn ships no sidebar primitive — every team rolls their own. The result is fragmented: Linear-style left-bar active, Notion-style indent-rail, Slack-style workspace switcher, Discord-style avatar status dot, Vercel-style command-palette-aware shell. Each consumer reimplements the same 30 affordances (collapse, mobile drawer, badge, sections, tooltip-on-collapsed, keyboard nav, reduced-motion, localStorage persist, link primitive abstraction). Most ship a v0.1 that handles the happy path and breaks under real-world consumer load.

`sidebar-nav-01` is the single-source-of-truth app-shell sidebar. Fully composed, fully dynamic, registry-portable (no `next/*` coupling), accessible by default, slot-everywhere, controlled-or-uncontrolled-or-headless. Ships with companion `<SidebarNavTrigger>` for mobile-drawer wiring, prefab parts (`<NavBrand>` / `<NavUser>` / `<NavPrimaryAction>` / `<NavBadge>`) for the 80% case, and exposes a CSS-variable theme surface so consumers can tune dimensions / timings / active-state colors at any DOM scope without prop drilling.

### Why two procomps, not one shell?

Two siblings (`sidebar-nav-01` + `bottom-tab-bar-01`) in the `navigation` category, NOT a single responsive shell. Pros: each independently installable via `pnpm dlx shadcn@latest add @ilinxa/<slug>`; consumer composes them with their own viewport switch; cleanest single-responsibility surface; matches the `todo-rich-card` ↔ `todo-tree` sibling-pair precedent shipped 2026-05-20/21. The shared `<NavBadge>` part + `NavItem` schema cross from sidebar → bottom via relative-path imports per F-S1 lock.

### Release strategy — single feature-complete ship

User direction (confirmed twice in this session, plus standing project rule per `feedback_dynamicity_reusability_primacy`): **no v0.2 / v0.3 deferrals.** Every capability that belongs in a modern app-shell sidebar ships in **v0.1.0**. The only items left out of v0.1 are the ones that *don't* belong here — nested expandable sub-items beyond a flat section group, command-palette integration, swipe-to-close drawer (Sheet primitive doesn't ship it), pull-to-refresh, haptic feedback — those are deliberate design exclusions, not scheduled additions.

---

## 2. In scope / Out of scope

### v0.1 — in scope (FULL feature set)

**Items schema (post-audit ML13 + ML14)**

`items: ReadonlyArray<NavEntry>` discriminated union:

- `NavItem` (default `kind: "item"`) — `id`, `label`, `icon? (ReactNode | ComponentType<{ className?: string }>)`, `href?`, `onClick?` (at least one of href/onClick required), `badge?`, `shortcut?`, `description?` (longer tooltip body), `accessory?` (right-side ReactNode — count chip, status dot, chevron), `tooltipContent?` (override the tooltip body), `target?` + `rel?`, `match?: "exact" | "prefix"`, `permission?`, `disabled?`, `hidden?`, `className?`, `data-testid?`.
- `NavSection` (`kind: "section"`) — `id`, `title?`, `icon?`, `collapsible?`, `defaultCollapsed?`, `items: ReadonlyArray<NavItem>` (flat — no nested sub-items in v0.1), `permission?`, `hidden?`.
- `NavSeparator` (`kind: "separator"`) — `id?`.

Type aliases exported for ergonomics: `BasicNavItems = ReadonlyArray<NavItem>` (auto-narrows for the flat case), `SidebarNavItems = ReadonlyArray<NavEntry>`. Component accepts both — flat `NavItem[]` gets implicit `kind: "item"` per entry.

**Sidebar layout (the three-zone rhythm)**

- **Top zone — brand row** (`headerSlot` ABOVE `brandSlot`, `navAccessorySlot` to the right). Brand zone hosts logo + label by default via `<NavBrand>` prefab; consumer can replace via `brandSlot` for workspace switcher / env banner / search input. Collapse-toggle button sits in `navAccessorySlot` by default; consumer can replace.
- **Middle zone — scrollable nav list** (`flex-1 min-h-0 overflow-y-auto` with thin-scrollbar token) — renders `items` array. Sections render as `<h6>` header + grouped items; separators render as a thin `border-t` divider.
- **Below nav list (still inside middle zone)** — `primaryActionSlot` OR `primaryAction: NavPrimaryActionConfig` shorthand renders a single full-width button (e.g., "Create post", "New project"). Hidden when neither supplied.
- **Bottom zone — user footer** (`footerSlot` OR `<NavUser>` prefab w/ `user` + `menuItems`). Footer sticks to bottom; never scrolls with the nav list.

**Collapse behavior**

- Uncontrolled (`defaultCollapsed?: boolean` — default `false`) OR controlled (`isCollapsed?: boolean` + `onCollapsedChange?: (next: boolean) => void`) OR headless-via-hook (`state?: SidebarNavStateValue` from `useSidebarNavState`).
- Width morph: `--ilinxa-sidebar-w-collapsed` (default `5rem`) ↔ `--ilinxa-sidebar-w-expanded` (default `16rem`). Transition `transition-[width]` gated `motion-safe:` per A11y mandate.
- At-collapsed:
  - Brand label hidden (icon only); collapse toggle swaps Menu ↔ X icon
  - Nav-row labels hidden (icon only); each row wrapped in a `<Tooltip side="right">` showing the label + optional shortcut + optional description
  - Badge repositions from `right-3` (inline-end) to `top-1 right-1` (corner of the icon) via `<NavBadge position>` resolver
  - Primary-action button collapses to icon-only (`px-0`)
  - User-footer dropdown align flips from `align="end"` to `align="center"`
  - Sections render header as icon-only (or hidden if no icon)
- Controlled-mode wiring: Defenses 1+2 of the three-defenses pattern (Defense 3 N/A — no continuous flow for discrete boolean state per analysis C-1 correction).
- `storageKey?: string` opt-in: when supplied, sidebar persists `collapsed` + `collapsedSectionIds` to `localStorage[storageKey]`. SSR-safe (effect-gated read, no reads during render). Schema-versioned JSON. Uncontrolled mode only.

**Mobile-drawer mode (ML2 — the missing piece in kasder)**

- Below `mobileBreakpoint` (default `"lg"`), sidebar renders inside shadcn `<Sheet>` instead of as a fixed aside.
- State pair: `isMobileOpen?` + `onMobileOpenChange?` (controlled), OR `defaultMobileOpen?` (uncontrolled). Default closed.
- Trigger lives OUTSIDE the sidebar (since sidebar is hidden at-mobile). Use `<SidebarNavTrigger>` companion or roll your own with the imperative handle.
- `mobileDrawerSide?: "left" | "right"` default = same as sidebar `side` prop.
- `autoCloseMobileOnNavigate?: boolean` default `true` — taps an item → fires consumer's `onClick` → microtask defer → `onMobileOpenChange(false)`. Consumers wanting "drawer stays open" set this `false`.
- Drawer header chrome: `drawerHeaderSlot?: ReactNode` (defaults to brand + close button); body reuses the standard sidebar middle + footer zones.
- SSR-safe `useMatchMedia(query)` hook resolves the breakpoint; first client render = "not mobile" (matches SSR fallback); transitions on `useEffect` to avoid hydration mismatch.

**Active-route detection**

- `currentPath: string` (required prop). No `usePathname()` coupling.
- Active resolution order:
  1. `isActive?: (item: NavItem, currentPath: string) => boolean` — if provided, wins for every item.
  2. Per-item `match?: "exact" | "prefix"` — fallback.
  3. `defaultMatch?: "exact" | "prefix"` — applies when item.match unset. Default `"exact"` (matches source).
- Active state lands as `aria-current="page"` on the rendered link + `data-active="true"` for styling hooks + passes to `renderItem` slot as a boolean.

**Link-primitive abstraction (ML15)**

- `linkComponent?: NavLinkComponent` prop. Default = built-in `<a href>` wrapper.
- Concrete contract — `NavLinkProps`:
  - `href: string` (required)
  - `className?`, `aria-current?`, `aria-label?`, `data-active?`, `children?`, `onClick?`, `onMouseEnter?`, `onFocus?`, `target?`, `rel?`, `ref?`, `[key: data-${string}]?`
- Exported type: `NavLinkComponent = ComponentType<NavLinkProps>`. Consumer adapter for Next.js: `({ href, children, ...rest }) => <Link href={href} {...rest}>{children}</Link>`. Same shape for React Router (`<Link to={href} {...rest}>`) + TanStack Router. Recipe in `usage.tsx`.

**CSS-variable theme surface (ML16)**

Sidebar root sets these custom properties inline (with prop overrides) so consumers can re-theme at any DOM scope:

- `--ilinxa-sidebar-w-collapsed` (default `5rem`)
- `--ilinxa-sidebar-w-expanded` (default `16rem`)
- `--ilinxa-sidebar-transition-duration` (default `300ms`)
- `--ilinxa-sidebar-row-h` (default `2.75rem`)
- `--ilinxa-sidebar-row-gap` (default `0.25rem`)
- `--ilinxa-sidebar-px` (default `0.75rem`) — horizontal padding of nav zone
- `--ilinxa-nav-active-bg` (default `var(--primary)`)
- `--ilinxa-nav-active-fg` (default `var(--primary-foreground)`)
- `--ilinxa-nav-active-bar-w` (default `3px`) — width of the accent bar for `"left-bar" | "right-bar"` variants
- `--ilinxa-nav-badge-size` (default `1.25rem`)
- `--ilinxa-nav-indent-step` (default `0.75rem`)

Props (`collapsedWidth?`, `expandedWidth?`, `transitionDuration?`) take string values and write to the CSS vars on the root element. Consumers tweaking via global CSS (`.dark { --ilinxa-nav-active-bg: ... }`) take precedence over component defaults and component-prop fallbacks. **Order:** consumer CSS > consumer prop > component default.

**Active-style variants (ML17)**

`activeVariant?: "fill" | "left-bar" | "right-bar" | "outline" | "subtle"` — default `"fill"` (matches source kasder visual):

- `"fill"` — full row paints `--ilinxa-nav-active-bg` + sets `--ilinxa-nav-active-fg`
- `"left-bar"` — left-edge accent bar (width = `--ilinxa-nav-active-bar-w`), row stays neutral, label/icon flip to active-fg
- `"right-bar"` — same as left-bar but right edge
- `"outline"` — `ring-2 ring-inset ring-[var(--ilinxa-nav-active-bg)]`, no fill
- `"subtle"` — `bg-accent/30` muted background, no fg flip

Slot-priority rule (ML18) — `renderItem` wins over `activeVariant` when both supplied.

**Side + RTL**

- `side?: "left" | "right"` (default `"left"`). Affects: border position (`border-r` vs `border-l`), brand-row collapse-toggle position, footer dropdown align ("end" vs "start"), mobile-drawer side default, scrollbar position.
- RTL-aware: when `side="right"` + `dir="rtl"`, paddings + alignments mirror cleanly.

**Loading state**

- `loading?: boolean` — when true, render 6 muted shimmer rows (matching collapsed/expanded width) instead of `items`. Brand + footer slots still render.
- `renderLoading?: (args: { defaultRender: ReactNode }) => ReactNode` slot for full override.
- Shimmer uses CSS animation, respects `prefers-reduced-motion` (static muted rows when reduced).

**Permissions**

Light-weight membership-only gating (per audit R8 mitigation — no matrix, no predicates beyond Set):

- Per-entry `permission?: string` (on `NavItem` and on `NavSection` — section gates whole group).
- Top-level `permissions?: ReadonlySet<string>` — items / sections with a permission key not present in the Set are filtered out before render (don't render, don't take DOM space).
- `onPermissionDenied?: ({ item, requiredPermission })` fires once per filtered entry on mount (diagnostic; consumer rarely subscribes).

Richer gating (predicates, byLevel matrix) is the consumer's responsibility — wire via `hidden?: boolean` per-item + their own selector. Matches the "narrow over rich" stance the user took on `todo-tree`'s permissions surface.

**Slot props — full slotting on day one (12 slots)**

1. `headerSlot?: ReactNode` — ABOVE brand row
2. `brandSlot?: ReactNode` — brand row (or use `<NavBrand>` prefab via `brand?: NavBrandConfig` shorthand)
3. `navAccessorySlot?: ReactNode` — right of brand (defaults to collapse toggle; consumer can replace, e.g. with a search input)
4. `primaryActionSlot?: ReactNode` — below nav list (or use `primaryAction?: NavPrimaryActionConfig` shorthand)
5. `footerSlot?: ReactNode` — user footer (or use `footer?: NavUserConfig` shorthand wired to `<NavUser>`)
6. `drawerHeaderSlot?: ReactNode` — mobile-drawer top chrome only
7. `renderItem?: (args: { item; isActive; isCollapsed; defaultRender }) => ReactNode` — full row override
8. `renderBadge?: (args: { item; defaultRender }) => ReactNode` — badge cell override
9. `renderTooltipContent?: (args: { item }) => ReactNode` — collapsed-mode tooltip body override
10. `renderSection?: (args: { section; defaultRender }) => ReactNode` — section header + group override
11. `renderLoading?: (args: { defaultRender }) => ReactNode` — skeleton override
12. `renderEmptyState?: (args: { reason: "no-items" | "all-filtered-by-permission" }) => ReactNode`

**Slot priority rule (ML18) — locked.** When a render-prop slot AND a prop variant target the same surface, the slot wins. Examples:
- `renderItem` > `activeVariant` (slot paints whatever it wants)
- `renderBadge` > `<NavBadge>` config inside `item.badge: NavBadgeConfig` > `item.badge: number | string`
- `brandSlot` > `brand: NavBrandConfig`
- `footerSlot` > `footer: NavUserConfig`
- `primaryActionSlot` > `primaryAction: NavPrimaryActionConfig`
- `renderLoading` > built-in skeleton

**Prefab parts shipped (4)**

Exported from `sidebar-nav-01/index.ts` so consumers can compose ad-hoc OR use the shorthand configs. F-S1 lock: `bottom-tab-bar-01` imports `<NavBadge>` from here via relative path `../sidebar-nav-01/parts/nav-badge`.

1. **`<NavBadge>`** — shared with `bottom-tab-bar-01`. Props: `value: number | string | ReactNode`, `max?: number` (default `9`), `variant?: "number" | "dot" | "pulse"` (default `"number"`), `tone?: "default" | "accent" | "destructive" | "muted"`, `position?: "inline-end" | "corner"` (resolved by parent context: corner at-collapsed, inline-end at-expanded), `showZero?: boolean` (default `false`), `className?`. Returns null when `value === 0 && !showZero`. `"pulse"` variant uses Tailwind `animate-ping` for the ring; gated `motion-safe:`.
2. **`<NavBrand>`** — `logo?: ReactNode | { src: string; alt?: string }`, `label: string`, `href?`, `linkComponent?`. Hides label automatically when ancestor sidebar is at-collapsed (reads via context).
3. **`<NavPrimaryAction>`** — `icon: ReactNode | ComponentType<{ className?: string }>`, `label: string`, `onClick?` OR `href?` (one required), `linkComponent?`. Collapses to icon-only at-collapsed.
4. **`<NavUser>`** — `user: { name: string; handle?: string; avatarUrl?: string; avatarFallback?: string; status?: "online" | "offline" | "busy" | "away" | "invisible" }` (ML22-a status dot — bottom-right of avatar, color-coded; status `"invisible"` hides the dot), `menuItems: ReadonlyArray<NavUserMenuItem | { kind: "separator" }>` (ML22-b discriminated union — `NavUserMenuItem = { kind: "item"; icon?; label; onClick?; href?; variant?: "default" | "destructive"; shortcut?; disabled?; }`). Dropdown align flips with sidebar collapsed/expanded state automatically (via context).

**Imperative handle (~22 methods)**

Exposed via `ref?: Ref<SidebarNavHandle>`:

```
// Collapse
toggleCollapse() / setCollapsed(b) / isCollapsed()

// Mobile drawer
openMobile() / closeMobile() / toggleMobile() / isMobileOpen()

// Section state
toggleSection(sectionId) / expandSection(id) / collapseSection(id)
expandAllSections() / collapseAllSections() / isSectionCollapsed(id)

// Items + active
getItems() / getItemById(id) / getActiveItem()

// Focus
focusItem(id) / focusFirstItem() / focusLastItem()

// Snapshot
getState()  // returns SidebarNavStateValue
```

**Headless state hook (ML11)**

```ts
export interface SidebarNavStateValue extends SidebarNavHandle {
  collapsed: boolean;
  mobileOpen: boolean;
  collapsedSectionIds: ReadonlySet<string>;
  activeItemId: string | null;
  activeItem: NavItem | null;
  visibleEntries: ReadonlyArray<NavEntry>;  // post permission + hidden filter
}

export function useSidebarNavState(options?: {
  defaultCollapsed?: boolean;
  defaultMobileOpen?: boolean;
  defaultCollapsedSectionIds?: ReadonlyArray<string>;
  items?: ReadonlyArray<NavEntry>;
  currentPath?: string;
  isActive?: (item: NavItem, currentPath: string) => boolean;
  permissions?: ReadonlySet<string>;
  storageKey?: string;
}): SidebarNavStateValue;
```

Consumers using slots heavily / building their own UI lift state via the hook and pass back through `state?` prop. `<SidebarNav>` uses the same hook internally when bare.

**`<SidebarNavTrigger>` companion (ML12)**

Exported from the same package. Renders as a `<button>` with `aria-controls={sidebarId}` + `aria-expanded={mobileOpen}` + `aria-label?` (default `"Open navigation"` / `"Close navigation"`). Two wiring modes:

1. **Default (context-bridge):** `<SidebarNav>` auto-creates a React context with the state + setters. `<SidebarNavTrigger>` reads via `useContext`. Sidebar + Trigger can live anywhere in the same React tree. If trigger is mounted before sidebar (DOM order), it queues via the context provider — no flicker, no race.
2. **Escape (explicit ref):** consumer wires the imperative handle directly: `<SidebarNavTrigger controls={sidebarRef}>` — bypasses context. Useful when sidebar + trigger live in separate React trees (rare).

If neither context nor `controls` is wired up, trigger renders disabled + logs `console.warn` in dev only.

**Events (16 total — all object-args per post-F-cross-12 convention)**

1. `onCollapsedChange({ collapsed })`
2. `onMobileOpenChange({ open, reason: "trigger" | "item-click" | "outside-click" | "escape" | "imperative" })`
3. `onItemClick({ item, isActive, event })`
4. `onItemHover({ item, event })`
5. `onItemFocus({ item, event })`
6. `onItemNavigate({ item })` — fires after `onItemClick` if `event.defaultPrevented === false`
7. `onActiveItemChange({ item, previousItem })`
8. `onSectionToggle({ section, collapsed })`
9. `onPermissionDenied({ item, requiredPermission })`
10. `onBrandClick({ event })`
11. `onPrimaryActionClick({ event })`
12. `onFooterTriggerOpen({ open })` — footer dropdown open/close
13. `onFooterMenuItemClick({ menuItem, event })`
14. `onSkipLinkActivated({ event })`
15. `onMount({ initialState })`
16. `onUnmount()`

**Accessibility — full pass on day one**

- Root: `<nav aria-label={...}>` (NOT `<aside>` — `<nav>` is the semantically correct element for app navigation; `<aside>` is for tangentially-related content per HTML5 spec). **Locked at L31 via audit B4.**
- Each row: `<a aria-current="page" data-active="true">` when active.
- Icon `aria-hidden`; label provides accessible name.
- At-collapsed: each row wrapped in `<Tooltip side="right">` showing label + optional shortcut + optional description. F-cross-13 defensive — `delayDuration` AND `delay` both typed.
- `prefers-reduced-motion: reduce` — width transition + active-icon transitions snap instantly; color + dot signals still differentiate states.
- Focus: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.
- Keyboard nav within sidebar:
  - `ArrowDown` / `ArrowUp` — move focus between visible rows (skipping collapsed sections + hidden items + separators).
  - `Home` / `End` — first / last visible row.
  - `Enter` / `Space` — activate.
  - For collapsible sections: `ArrowRight` expand / `ArrowLeft` collapse on focused header.
- Skip-link: `skipLinkTarget?: string` renders `<a href="..." className="sr-only focus:not-sr-only ...">` as first child.
- `<SidebarNavTrigger>` carries `aria-haspopup="dialog"` + `aria-expanded`.
- Sheet drawer: focus trap on open + focus restore on close (shadcn Sheet handles; verify no override).
- Section a11y: collapsible section header is `<button aria-expanded aria-controls>`; section body `role="group" aria-labelledby`.

**Visual / theming**

- Holds design tokens (Onest sans, JetBrains mono, signal-lime accent, OKLCH colors per [`src/app/globals.css`](../../src/app/globals.css)).
- Active state in `"fill"` variant uses lime + near-black foreground per design mandate (NOT lime + white — lime is too bright for white text).
- Light-mode page bg = cool off-white; sidebar `bg-card` (pure white) sits visibly above. Dark-mode = graphite-cool.
- Backdrop-blur on the mobile-drawer overlay (shadcn Sheet default).

**SSR / portability**

- Zero `next/*` imports. Zero app-context imports. `react` + `@/components/ui/*` + `@/lib/utils` only.
- `useMatchMedia` SSR-safe (effect-gated; returns `false` during SSR).
- `localStorage` reads/writes in `useEffect` only (gated behind `typeof window !== "undefined"`).
- All event listeners passive (`{ passive: true }`) where applicable.
- React 19 compat: no legacy ref-forwarding patterns; `useImperativeHandle` for handles.

### v0.1 — out of scope (deliberate design exclusions; NOT future deferrals)

- **Nested sub-items beyond a flat section group.** Sections are 1-level groups. If consumers need true tree-shaped nav (Settings → Account → Billing), they use `command-palette` (roadmap) or `file-tree`-style nav (different procomp).
- **Command-palette integration.** Separate procomp (`navigation/command-palette` on roadmap).
- **Swipe-to-close on mobile drawer.** Sheet primitive doesn't ship it; out of scope for this procomp.
- **Pull-to-refresh on bottom (covered by bottom-tab-bar-01 anyway, not nav's job).**
- **Haptic feedback hook** — consumer wraps `onItemClick` to fire `navigator.vibrate` if they want it.
- **Workspace-switcher UI** — covered by `headerSlot`; no opinionated default.
- **Direct edit-in-row of nav items** — nav is not an editor; consumer manages items elsewhere.
- **Multi-select on nav items** — nav is not a list-picker; doesn't make sense.
- **Drag-to-reorder nav items** — out of scope (consumers managing item order should do it in their settings UI, not in the live nav).

---

## 3. Target consumers

| Consumer | Why this and not roll-your-own? |
|---|---|
| SaaS dashboards (project mgmt, analytics, CMS, internal admin) | Three-zone shell + collapse + sections + footer-user dropdown is the universal app-shell mental model. |
| Social products (kasder-style, content feeds, creator dashboards) | Sidebar + primary action button ("Create") + user footer with status dot maps to the social-app pattern 1:1. |
| Developer tools (deploy dashboards, observability, CI/CD) | CSS-var theme surface lets ops apps re-theme to match brand without forking the component. |
| Mobile-first apps with desktop secondary | Sheet-drawer mode + `<SidebarNavTrigger>` keep the same items config working across viewports. |
| Multi-tenant / RBAC apps | Permissions membership + per-item `hidden?: boolean` covers basic gating without bloating the API. |
| Apps using non-Next routers (TanStack, React Router, Hash router, Tauri) | `linkComponent` + `currentPath` prop pair makes the component router-agnostic. |
| Internationalized apps | All copy via props; `side: "right"` + `dir="rtl"` mirrors layout cleanly. |

---

## 4. Rough API sketch (NOT final — that's the plan stage)

```tsx
import type { ComponentType, ReactNode, Ref } from "react";

// ─── Items schema ───────────────────────────────────────────────

export interface NavItem {
  kind?: "item";
  id: string;
  label: string;
  icon?: ReactNode | ComponentType<{ className?: string }>;
  href?: string;
  onClick?: (event: React.MouseEvent) => void;     // at least one of href/onClick required
  badge?: number | string | NavBadgeConfig;
  match?: "exact" | "prefix";
  shortcut?: string;
  description?: string;
  accessory?: ReactNode;
  tooltipContent?: ReactNode;
  target?: "_blank" | "_self" | "_parent" | "_top";
  rel?: string;
  permission?: string;
  disabled?: boolean;
  hidden?: boolean;
  className?: string;
  "data-testid"?: string;
}

export interface NavSection {
  kind: "section";
  id: string;
  title?: string;
  icon?: ReactNode | ComponentType<{ className?: string }>;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  items: ReadonlyArray<NavItem>;
  permission?: string;
  hidden?: boolean;
}

export interface NavSeparator {
  kind: "separator";
  id?: string;
}

export type NavEntry = NavItem | NavSection | NavSeparator;
export type BasicNavItems = ReadonlyArray<NavItem>;
export type SidebarNavItems = ReadonlyArray<NavEntry>;

// ─── Link primitive ──────────────────────────────────────────────

export interface NavLinkProps {
  href: string;
  className?: string;
  "aria-current"?: "page" | undefined;
  "aria-label"?: string;
  "data-active"?: boolean;
  children?: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  target?: string;
  rel?: string;
  ref?: Ref<HTMLAnchorElement>;
  [key: `data-${string}`]: unknown;
}
export type NavLinkComponent = ComponentType<NavLinkProps>;

// ─── Prefab part configs ─────────────────────────────────────────

export interface NavBadgeConfig {
  value: number | string | ReactNode;
  max?: number;                                    // default 9
  variant?: "number" | "dot" | "pulse";            // default "number"
  tone?: "default" | "accent" | "destructive" | "muted";
  showZero?: boolean;
  className?: string;
}

export interface NavBrandConfig {
  logo?: ReactNode | { src: string; alt?: string };
  label: string;
  href?: string;
  linkComponent?: NavLinkComponent;
}

export interface NavPrimaryActionConfig {
  icon: ReactNode | ComponentType<{ className?: string }>;
  label: string;
  onClick?: (event: React.MouseEvent) => void;
  href?: string;
  linkComponent?: NavLinkComponent;
  variant?: "default" | "outline" | "ghost" | "secondary";
  tone?: "default" | "accent" | "destructive";
}

export interface NavUserMenuItem {
  kind: "item";
  icon?: ReactNode | ComponentType<{ className?: string }>;
  label: string;
  onClick?: (event: React.MouseEvent) => void;
  href?: string;
  linkComponent?: NavLinkComponent;
  variant?: "default" | "destructive";
  shortcut?: string;
  disabled?: boolean;
}

export interface NavUserConfig {
  user: {
    name: string;
    handle?: string;
    avatarUrl?: string;
    avatarFallback?: string;
    status?: "online" | "offline" | "busy" | "away" | "invisible";
  };
  menuItems: ReadonlyArray<NavUserMenuItem | { kind: "separator" }>;
  onTriggerOpen?: (args: { open: boolean }) => void;
}

// ─── Main component ──────────────────────────────────────────────

export interface SidebarNavProps {
  // Items
  items: ReadonlyArray<NavEntry>;

  // Active detection
  currentPath: string;
  isActive?: (item: NavItem, currentPath: string) => boolean;
  defaultMatch?: "exact" | "prefix";

  // Link primitive
  linkComponent?: NavLinkComponent;

  // Collapse (uncontrolled / controlled / lifted via state)
  defaultCollapsed?: boolean;
  isCollapsed?: boolean;
  onCollapsedChange?: (args: { collapsed: boolean }) => void;

  // Mobile drawer
  defaultMobileOpen?: boolean;
  isMobileOpen?: boolean;
  onMobileOpenChange?: (args: { open: boolean; reason: "trigger" | "item-click" | "outside-click" | "escape" | "imperative" }) => void;
  mobileBreakpoint?: "sm" | "md" | "lg" | "xl";
  mobileDrawerSide?: "left" | "right";
  autoCloseMobileOnNavigate?: boolean;

  // Lifted state (wins over individual props above)
  state?: SidebarNavStateValue;

  // Layout
  side?: "left" | "right";
  collapsedWidth?: string;                          // CSS length → --ilinxa-sidebar-w-collapsed
  expandedWidth?: string;                           // → --ilinxa-sidebar-w-expanded
  transitionDuration?: string;                      // → --ilinxa-sidebar-transition-duration
  activeVariant?: "fill" | "left-bar" | "right-bar" | "outline" | "subtle";

  // Persistence
  storageKey?: string;

  // Permissions
  permissions?: ReadonlySet<string>;

  // Slots
  headerSlot?: ReactNode;
  brandSlot?: ReactNode;
  brand?: NavBrandConfig;                           // shorthand for <NavBrand>
  navAccessorySlot?: ReactNode;
  primaryActionSlot?: ReactNode;
  primaryAction?: NavPrimaryActionConfig;           // shorthand for <NavPrimaryAction>
  footerSlot?: ReactNode;
  footer?: NavUserConfig;                           // shorthand for <NavUser>
  drawerHeaderSlot?: ReactNode;

  // Render-prop slots
  renderItem?: (args: {
    item: NavItem;
    isActive: boolean;
    isCollapsed: boolean;
    isFocused: boolean;
    isDisabled: boolean;
    sectionId: string | null;                      // null = top-level (not in a section)
    indexInSection: number;
    defaultRender: ReactNode;
  }) => ReactNode;
  renderBadge?: (args: {
    item: NavItem;
    badge: NavBadgeConfig;                          // resolved badge config (number/string shorthand expanded)
    position: "inline-end" | "corner";              // auto-resolved by sidebar collapsed state
    defaultRender: ReactNode;
  }) => ReactNode;
  renderTooltipContent?: (args: { item: NavItem; isActive: boolean }) => ReactNode;
  renderSection?: (args: {
    section: NavSection;
    isCollapsed: boolean;                           // section's own collapse state (not sidebar's)
    visibleItemCount: number;                       // after permission + hidden filter
    defaultRender: ReactNode;
  }) => ReactNode;
  renderLoading?: (args: { isCollapsed: boolean; defaultRender: ReactNode }) => ReactNode;
  renderEmptyState?: (args: { reason: "no-items" | "all-filtered-by-permission" | "all-filtered-by-loading" }) => ReactNode;

  // Loading
  loading?: boolean;

  // Events (subset — full list in §2 "Events")
  onItemClick?: (args: { item: NavItem; isActive: boolean; event: React.MouseEvent }) => void;
  onItemNavigate?: (args: { item: NavItem }) => void;
  onActiveItemChange?: (args: { item: NavItem | null; previousItem: NavItem | null }) => void;
  onSectionToggle?: (args: { section: NavSection; collapsed: boolean }) => void;
  onPermissionDenied?: (args: { item: NavItem; requiredPermission: string }) => void;
  onBrandClick?: (args: { event: React.MouseEvent }) => void;
  onPrimaryActionClick?: (args: { event: React.MouseEvent }) => void;
  onFooterTriggerOpen?: (args: { open: boolean }) => void;
  onFooterMenuItemClick?: (args: { menuItem: NavUserMenuItem; event: React.MouseEvent }) => void;
  onSkipLinkActivated?: (args: { event: React.MouseEvent }) => void;
  onMount?: (args: { initialState: SidebarNavStateValue }) => void;
  onUnmount?: () => void;

  // Standard
  className?: string;
  style?: React.CSSProperties;
  "aria-label"?: string;
  id?: string;                                      // hooks up <SidebarNavTrigger aria-controls>
  skipLinkTarget?: string;
  skipLinkLabel?: string;
  ref?: Ref<SidebarNavHandle>;
}

export interface SidebarNavHandle {
  toggleCollapse(): void;
  setCollapsed(next: boolean): void;
  isCollapsed(): boolean;
  openMobile(): void;
  closeMobile(): void;
  toggleMobile(): void;
  isMobileOpen(): boolean;
  toggleSection(sectionId: string): void;
  expandSection(sectionId: string): void;
  collapseSection(sectionId: string): void;
  expandAllSections(): void;
  collapseAllSections(): void;
  isSectionCollapsed(sectionId: string): boolean;
  getItems(): ReadonlyArray<NavEntry>;
  getItemById(id: string): NavItem | undefined;
  getActiveItem(): NavItem | undefined;
  focusItem(id: string): void;
  focusFirstItem(): void;
  focusLastItem(): void;
  getState(): SidebarNavStateValue;
}

export interface SidebarNavStateValue extends SidebarNavHandle {
  collapsed: boolean;
  mobileOpen: boolean;
  collapsedSectionIds: ReadonlySet<string>;
  activeItemId: string | null;
  activeItem: NavItem | null;
  visibleEntries: ReadonlyArray<NavEntry>;
}

// ─── Companion + hook ───────────────────────────────────────────

export interface SidebarNavTriggerProps {
  controls?: Ref<SidebarNavHandle> | SidebarNavHandle | null;  // explicit escape (else context)
  className?: string;
  children?: ReactNode;                              // custom icon (defaults to Menu / X swap)
  "aria-label"?: string;                             // default "Open navigation" / "Close navigation"
  asChild?: boolean;                                 // shadcn-style asChild
}

export function SidebarNavTrigger(props: SidebarNavTriggerProps): JSX.Element;

export function useSidebarNavState(options?: {
  defaultCollapsed?: boolean;
  defaultMobileOpen?: boolean;
  defaultCollapsedSectionIds?: ReadonlyArray<string>;
  items?: ReadonlyArray<NavEntry>;
  currentPath?: string;
  isActive?: (item: NavItem, currentPath: string) => boolean;
  permissions?: ReadonlySet<string>;
  storageKey?: string;
}): SidebarNavStateValue;

// ─── Exported prefab parts ──────────────────────────────────────

export function NavBadge(props: NavBadgeConfig & { className?: string }): JSX.Element | null;
export function NavBrand(props: NavBrandConfig & { className?: string }): JSX.Element;
export function NavPrimaryAction(props: NavPrimaryActionConfig & { className?: string }): JSX.Element;
export function NavUser(props: NavUserConfig & { className?: string }): JSX.Element;
```

---

## 5. Example usages

### 5.1 — Minimal (the kasder-style recipe ported clean)

```tsx
import { SidebarNav, type NavItem } from "@ilinxa/sidebar-nav-01";
import { Home, Search, MessageCircle, Bell, User, Briefcase, PlusSquare } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items: NavItem[] = [
  { id: "home",   label: "Ana Sayfa",     icon: Home,           href: "/social/home" },
  { id: "explore", label: "Keşfet",       icon: Search,         href: "/social/explore" },
  { id: "chat",   label: "Mesajlar",      icon: MessageCircle,  href: "/social/chat",   badge: 3 },
  { id: "notif",  label: "Bildirimler",   icon: Bell,           href: "/social/notifications", badge: 5 },
  { id: "prof",   label: "Profil",        icon: User,           href: "/social/profile" },
  { id: "biz",    label: "İşletme",       icon: Briefcase,      href: "/social/business" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <SidebarNav
        items={items}
        currentPath={pathname}
        linkComponent={({ href, children, ...rest }) => <Link href={href} {...rest}>{children}</Link>}
        brand={{ logo: <KSquare />, label: "Kasder", href: "/" }}
        primaryAction={{ icon: PlusSquare, label: "Paylaş", onClick: () => openPostComposer() }}
        footer={{
          user: { name: "Ahmet Kaya", handle: "@ahmetkaya", avatarUrl: "...", status: "online" },
          menuItems: [
            { kind: "item", icon: User, label: "Profil", href: "/sosyal/profil" },
            { kind: "item", icon: Settings, label: "Ayarlar", href: "/sosyal/ayarlar" },
            { kind: "separator" },
            { kind: "item", icon: LogOut, label: "Çıkış Yap", variant: "destructive", onClick: logout },
          ],
        }}
        storageKey="kasder.sidebar"
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

### 5.2 — With sections + permissions

```tsx
import type { NavEntry } from "@ilinxa/sidebar-nav-01";

const items: NavEntry[] = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "inbox", label: "Inbox", icon: Inbox, href: "/inbox", badge: 12 },
  { kind: "separator", id: "sep-1" },
  {
    kind: "section",
    id: "workspace",
    title: "Workspace",
    collapsible: true,
    items: [
      { id: "projects", label: "Projects", icon: FolderKanban, href: "/projects" },
      { id: "team",     label: "Team",     icon: Users,        href: "/team" },
      { id: "docs",     label: "Docs",     icon: BookText,     href: "/docs" },
    ],
  },
  {
    kind: "section",
    id: "admin",
    title: "Admin",
    permission: "admin",                         // section hidden if user lacks "admin"
    items: [
      { id: "settings", label: "Settings", icon: Settings, href: "/admin/settings" },
      { id: "billing",  label: "Billing",  icon: CreditCard, href: "/admin/billing", permission: "billing:read" },
    ],
  },
];

<SidebarNav
  items={items}
  currentPath={pathname}
  permissions={new Set(["admin"])}  // billing:read missing → Billing item filtered out
  activeVariant="left-bar"
/>
```

### 5.3 — Mobile-drawer with companion trigger

```tsx
import { SidebarNav, SidebarNavTrigger } from "@ilinxa/sidebar-nav-01";

export function AppShell({ children }) {
  return (
    <>
      <header className="lg:hidden sticky top-0 flex items-center gap-2 p-3 border-b">
        <SidebarNavTrigger aria-label="Open navigation" />
        <h1>My App</h1>
      </header>
      <div className="flex">
        <SidebarNav
          items={items}
          currentPath={pathname}
          mobileBreakpoint="lg"
          autoCloseMobileOnNavigate
        />
        <main className="flex-1">{children}</main>
      </div>
    </>
  );
}
```

### 5.4 — Fully headless via the hook (BYO chrome)

```tsx
import { SidebarNav, useSidebarNavState } from "@ilinxa/sidebar-nav-01";

export function CustomShell({ children }) {
  const state = useSidebarNavState({
    items,
    currentPath: pathname,
    storageKey: "myapp.sidebar",
  });

  return (
    <div className="flex">
      <SidebarNav state={state} headerSlot={<WorkspaceSwitcher />} renderItem={MyCustomRow} />
      <main>
        <MyHeader collapsed={state.collapsed} onToggle={state.toggleCollapsed} />
        {children}
      </main>
    </div>
  );
}
```

### 5.5 — Themed via CSS variables (no prop drilling)

```css
/* anywhere in the consumer's stylesheet */
.brand-themed {
  --ilinxa-sidebar-w-collapsed: 4rem;
  --ilinxa-sidebar-w-expanded: 18rem;
  --ilinxa-nav-active-bg: oklch(0.7 0.15 250);   /* brand blue */
  --ilinxa-nav-active-fg: white;
  --ilinxa-nav-active-bar-w: 4px;
}
```

```tsx
<div className="brand-themed">
  <SidebarNav items={items} currentPath={pathname} activeVariant="left-bar" />
</div>
```

---

## 6. Success criteria

1. Render an array of `NavEntry`s with the locked three-zone layout (header / brand → nav list → user footer).
2. Sections + separators render correctly; collapsible sections toggle their items' visibility.
3. Active detection: `pathname === item.path` (default exact); `isActive` predicate wins when supplied; per-item `match: "prefix"` works.
4. Collapse: width morphs 80↔256px (or CSS-var-overridden values); brand label / row labels hide; badges reposition to corner; primary action collapses to icon; footer dropdown align flips.
5. Tooltip-on-collapsed renders for every row with label + optional shortcut + description; suppressed for active row's description (label still shown for a11y).
6. Mobile-drawer mode engages below `mobileBreakpoint`; `<SidebarNavTrigger>` opens/closes; auto-closes on navigate (when enabled).
7. Controlled + uncontrolled + headless-via-hook all work; switching modes mid-life is supported.
8. `storageKey` persists collapse + collapsed-sections to localStorage; rehydrates on reload; SSR-safe.
9. CSS variables override at any scope (root, `.dark`, themed wrapper); props write to vars on the root element.
10. All 5 `activeVariant`s render distinctly; `renderItem` slot wins when both supplied.
11. All 12 slot props render correctly; prefab parts (`<NavBrand>`, `<NavUser>`, `<NavPrimaryAction>`, `<NavBadge>`) work standalone OR via shorthand configs.
12. Permissions: items / sections with un-granted permissions filter out before render; `onPermissionDenied` fires.
13. Loading state: `loading: true` renders 6 shimmer rows respecting reduced-motion.
14. Imperative handle: all 22 methods work; `state` lifted via `useSidebarNavState` round-trips correctly.
15. F-cross-13 pre-emption: Tooltip + Sheet + DropdownMenu callbacks defensively typed (path-b smoke clean on first run).
16. Keyboard nav: ArrowDown/Up moves focus; Home/End jumps; Enter activates; ArrowLeft/Right collapses/expands sections.
17. A11y: `aria-current="page"` on active row; tooltip on collapsed icons; skip-link works; focus rings visible; reduced-motion respected.
18. SSR: no hydration mismatch; matchMedia returns server-safe value during SSR + first client render.
19. Live demo on `/components/sidebar-nav-01` shows: minimal recipe (5.1), sections + permissions (5.2), mobile-drawer + trigger (5.3), headless hook (5.4), CSS-var theming (5.5), all 5 `activeVariant`s side-by-side, dark-mode parity.
20. F-cross-11 path-b consumer-tsc smoke clean for `@ilinxa/sidebar-nav-01` install.

---

## 7. Locked decisions (L1–L26, recorded pre-sign-off)

| # | Lock | Notes |
|---|---|---|
| L1 | Slug = `sidebar-nav-01`, category = `navigation` | Category exists; no `categories.ts` edit. |
| L2 | Two sibling procomps; `sidebar-nav-01` is the senior (owns shared schema + `<NavBadge>` part). `bottom-tab-bar-01` ships next, imports via relative paths per F-S1 lock. | Audit ML1. |
| L3 | Single feature-complete v0.1 — no v0.2 / v0.3 deferrals | Dynamicity-primacy memory + audit ML10. |
| L4 | Items schema = discriminated union `NavEntry = NavItem \| NavSection \| NavSeparator`. Default `kind: "item"`. Flat `NavItem[]` accepted (implicit kind). Sections are 1-level only (no nested sub-items). | Audit ML14. |
| L5 | `NavItem` schema: `id`, `label`, `icon? (ReactNode \| ComponentType)`, `href?` + `onClick?` (one required), `badge?`, `match?`, `shortcut?`, `description?`, `accessory?`, `tooltipContent?`, `target?`/`rel?`, `permission?`, `disabled?`, `hidden?`, `className?`, `data-testid?` | Audit ML13. |
| L6 | Three-zone layout: brand row (with `headerSlot` ABOVE + `navAccessorySlot` right) → scrollable nav list (with primary action below) → user footer | Per source DNA + audit ML10 (scrollability). |
| L7 | Collapse: uncontrolled + controlled + headless-hook. Defenses 1+2 only (Defense 3 N/A for discrete boolean). | Analysis C-1 correction. |
| L8 | Mobile-drawer mode via shadcn `<Sheet>` below `mobileBreakpoint`; controlled+uncontrolled pair; `<SidebarNavTrigger>` companion for the trigger. | Audit ML2 + ML12. |
| L9 | `currentPath: string` required; active-detection ordered `isActive` > `item.match` > `defaultMatch` (default `"exact"`). | Audit ML6. |
| L10 | `linkComponent` with concrete `NavLinkProps` interface exported; default = built-in `<a href>` wrapper. | Audit ML15. |
| L11 | CSS-variable theme surface (`--ilinxa-sidebar-*`) — widths, transition, row-height, active bg/fg, active-bar-width, badge size, indent step. Props write to vars; consumer CSS > prop > default. | Audit ML16. |
| L12 | `activeVariant?: "fill" \| "left-bar" \| "right-bar" \| "outline" \| "subtle"` default `"fill"` matches source. | Audit ML17. |
| L13 | Slot priority rule: render-prop slot wins over prop variant for same surface. | Audit ML18 + todo-tree L15 parity. |
| L14 | 12 slots total (4 named + 6 render-prop + 2 prefab-shorthand-configs): `headerSlot`, `brandSlot`, `navAccessorySlot`, `primaryActionSlot`, `footerSlot`, `drawerHeaderSlot`, `renderItem`, `renderBadge`, `renderTooltipContent`, `renderSection`, `renderLoading`, `renderEmptyState`. | Audit ML22-f + g. |
| L15 | 4 prefab parts shipped: `<NavBadge>` (shared with `bottom-tab-bar-01` via relative-path import — F-S1), `<NavBrand>`, `<NavPrimaryAction>`, `<NavUser>` (with status dot + discriminated-union menuItems). | Audit ML7 + ML22-a + b. |
| L16 | Headless `useSidebarNavState` hook ships; consumers using slots heavily OR building BYO chrome lift state via this. Bare `<SidebarNav>` uses it internally. | Audit ML11. |
| L17 | `<SidebarNavTrigger>` companion ships in same package; two wiring modes (context-bridge default, explicit `controls` escape); dev-only warn if neither wired. | Audit ML12. |
| L18 | Tooltip-on-collapsed for sidebar icon-only state via shadcn `<Tooltip>`; F-cross-13 defensive (dual-name `delayDuration` + `delay`; callback contravariance). | Audit ML9. |
| L19 | F-cross-13 pre-emption locked at GATE 2: Tooltip + Sheet + DropdownMenu primitives — defensive callback contravariance; widen narrow callback unions to typeof-guards; drop divergent prop names where possible. | Audit R7. |
| L20 | All events use object-args (post-F-cross-12 convention). 16 events listed. | Per project convention. |
| L21 | Imperative handle ~22 methods covering collapse / mobile / sections / items / focus / state snapshot. | Listed in §2. |
| L22 | Permissions: simple membership `permissions: ReadonlySet<string>` + per-entry `permission?: string`; rich gating is consumer responsibility. | Audit R8. |
| L23 | `storageKey?` opt-in localStorage persist (collapse + collapsedSectionIds); uncontrolled mode only; SSR-safe; schema-versioned JSON. | Audit ML21. |
| L24 | `autoCloseMobileOnNavigate?` default `true` — taps an item in mobile drawer → drawer closes after microtask defer. | Audit ML20. |
| L25 | `side?: "left" \| "right"` (default `"left"`); affects border, dropdown align, scrollbar position, mobile-drawer side default. RTL-aware. | Audit ML22-c. |
| L26 | Loading state: `loading?: boolean` + 6-row shimmer; `renderLoading` slot; reduced-motion respected (static muted rows). | Audit ML22-e. |

---

## 8. Open questions to lock during sign-off

Pre-answered where the answer is obvious from project precedent. Only items where I want explicit user confirmation remain as Qs:

| # | Question | Suggested answer |
|---|---|---|
| Q1 | **Section nesting depth** — flat (1-level sections only) OR ship 2-level (sections containing sub-sections)? | **Flat (1-level).** Nested sub-items beyond a section group is what `command-palette` or a `treeview-nav` procomp is for. 2-level adds substantial state + a11y + focus-mgmt complexity for a niche feature. |
| Q2 | **`<SidebarNavTrigger>` icon default** — Menu ↔ X swap (kasder source) OR something fresher (PanelLeft ↔ PanelLeftClose lucide icons)? | **PanelLeft / PanelLeftClose** — these are the modern lucide pair purpose-built for sidebars. Menu icon is generic. Override via `children` slot regardless. |
| Q3 | **`activeVariant` default** — `"fill"` (matches kasder) OR `"left-bar"` (more current, less visually aggressive)? | **`"fill"`** to honor the migration-origin visual. Switching default would be a silent breaking change for anyone porting the kasder recipe verbatim. Easy to change via prop. |
| Q4 | **Section collapse persistence** — when `storageKey` is set, ALSO persist `collapsedSectionIds`, OR only `isCollapsed`? | **Persist both.** Otherwise consumers reinvent half the persist hook. Schema versioning handles the migration. |
| Q5 | **Mobile-drawer side default** — same as `side` prop OR always `"left"`? | **Same as `side`.** If consumer puts sidebar on right, drawer slides from right. Symmetry. Override via `mobileDrawerSide` prop. |
| Q6 | **`<NavBadge>` "pulse" variant — animate-ping built-in OR opt-in?** | **Built-in.** Pulse variant exists to mean "this badge demands attention." Self-defeating to ship it as static. Always gated `motion-safe:` for reduced-motion users. |
| Q7 | **`onItemClick` vs `onItemNavigate` semantics** — which fires when? | `onItemClick` fires on every click (including `event.preventDefault()` cases). `onItemNavigate` fires AFTER `onItemClick` only if `event.defaultPrevented === false` — i.e., navigation actually happened. Consumer wires analytics on `onItemNavigate` to avoid logging cancelled navigations. |
| Q8 | **Status dot palette** — five values (`online` / `offline` / `busy` / `away` / `invisible`) OR open-ended (`status?: string` + token mapping consumer-supplied)? | **Five fixed values.** Common social-app vocabulary. If a consumer needs a 6th, they use the `accessory` slot on `<NavUser>` and skip status. Avoids ambiguity. |
| Q9 | **Skip-link** — default rendered (always shows on focus) OR opt-in via `skipLinkTarget` prop? | **Opt-in via `skipLinkTarget` prop.** Not every app has a `#main-content` anchor; rendering an always-on link to a non-existent target is worse than not having one. |
| Q10 | **Section header click semantics** — clicking the section title (1) toggles collapse, (2) does nothing, OR (3) navigates to section.href if supplied? | **(1) toggles collapse** when `collapsible: true`; otherwise does nothing. Sections don't have `href` (intentional — keeps the model clean). If consumer wants a clickable section heading, they use a normal NavItem + a separator. |

---

## 9. Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | **Discriminated-union `NavEntry` typing bloats consumer ergonomics** vs simple `NavItem[]`. | Two exports: `BasicNavItems = ReadonlyArray<NavItem>` (auto-narrows) + `SidebarNavItems = ReadonlyArray<NavEntry>`. Examples lead with the flat case; sections introduced in a "More options" section. |
| R2 | **`linkComponent` is unusual in shadcn-land** — every other procomp assumes internal `<a>` or no router. Consumer confusion likely. | `usage.tsx` ships 3 adapters (Next.js, React Router, TanStack Router) as one-liner recipes. Default `<a href>` covers static-HTML use. |
| R3 | **Mobile-drawer Sheet integration adds a shadcn primitive dep** that consumers may not have. | Add `sheet`, `tooltip`, `separator` to `dependencies.shadcn` in `meta.ts`. `pnpm dlx shadcn add @ilinxa/sidebar-nav-01` installs them transitively. Document install footprint in guide.md. |
| R4 | **`currentPath` prop forces consumer to compute it** — easy in Next.js but invisible in other routers. | `usage.tsx` ships `useCurrentPath()` recipes for Next, React Router, TanStack. None baked into the registry source. |
| R5 | **Triple source-of-truth (props / lifted-hook / parent-controlled)** if consumer passes both `state` AND `isCollapsed` props. | Resolution rule (locked L7): `state` wins over individual props when both supplied. Dev-only `console.warn` flags the conflict. |
| R6 | **`<SidebarNavTrigger>` context-bridge can fail silently** if consumer mounts trigger but no sidebar. | Trigger renders disabled + dev-only `console.warn` when neither context nor `controls` ref is connected. |
| R7 | **F-cross-13 has bitten the last 3 procomps consistently.** This one uses Tooltip + Sheet + DropdownMenu — three potential carriers. | GATE 2 plan locks defensive callback contravariance on all three; F-cross-11 path-b smoke run BEFORE close. Same-day v0.1.1 patch budget expected. |
| R8 | **CSS-variable theme surface is new to this lib** — first procomp to ship one. Risk of inconsistent naming with future procomps. | Lock the `--ilinxa-<slug>-<token>` convention here; future procomps inherit. Document the naming rule in the guide. |
| R9 | **Headless hook + `state` prop pattern is more complex than bare props.** Most consumers don't need it. | Lead `usage.tsx` with bare-props examples (5.1, 5.2, 5.3). Headless hook (5.4) is presented as "advanced." |
| R10 | **`autoCloseMobileOnNavigate` timing edge case** — consumer's `onClick` triggers React state update + the drawer-close trigger fires before route change, causing a flash. | Implementation defers via `queueMicrotask` to let the consumer's React batch settle first. GATE 2 plan locks the exact order. |
| R11 | **localStorage `storageKey` collisions** between multiple `<SidebarNav>` instances in the same app (rare but possible — e.g., admin app with main + secondary sidebars). | Consumer-responsibility — `storageKey` is opt-in; consumer chooses unique keys. Document in guide. |
| R12 | **Section collapse + permissions interaction** — section has 3 items, all filtered out by permissions. Section header still renders as empty. | Default: section with zero visible items auto-hides (collapses + hides header). Override via `keepEmptySections?: boolean` prop (defaults `false`). Lock at GATE 2. |
| R13 | **`useMatchMedia` + first client render hydration** — sidebar always renders desktop mode during SSR + first client render, then switches to mobile-drawer mode after `useEffect` runs. Brief flash on initial mobile load. | Two options for GATE 2: (a) accept the flash (current todo-tree precedent), (b) hide sidebar contents during the first paint via `style={{ visibility: 'hidden' }}` with a flag. Pick (a) — flash is sub-100ms, acceptable. Document the trade. |

---

## 10. Definition of "done" for THIS document (stage gate)

- [x] All 26 locks (L1–L26) understood.
- [ ] All 10 Qs in §8 answered with explicit picks (defaults pre-filled; user confirms or overrides).
- [ ] No scheduled v0.2 / v0.3 work — explicit single-version ship lock (L3).
- [ ] No new top-level scope additions during plan-stage (loud deviations only — fold in §7 of THIS doc on next update).
- [ ] User explicitly closes GATE 1 — date TBD.

---

## 11. GATE-1 re-validation audit (2026-05-22)

> Self-audit per [`feedback_re_validation_pass_catches_real_issues`](../../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/feedback_re_validation_pass_catches_real_issues.md). Re-read the doc above end-to-end against: (1) `todo-tree` v0.1.2 description doc structure + lock conventions; (2) all 22 ML locks from the migration analysis; (3) project memory hooks (controlled-mode, F-cross-13, F-S1 cross-procomp imports, slot-priority); (4) HTML5 semantic spec; (5) Tailwind v4 + React 19 + Next 16 stack realities.
>
> 22 findings (B1–B22) across 5 categories. All folded back as new locks L27–L40 + new open questions Q11–Q14 + 2 inline corrections (`<nav>` root + tighter slot signatures — applied above).

### Findings (severity-ordered)

| # | Sev | Finding | Category | Resolution |
|---|---|---|---|---|
| B1 | ⚠️ High | **`disabled` per-item behavior not locked.** Schema has `disabled?: boolean` but didn't specify visual / pointer / click semantics. Without lock, ambiguous between "click silently does nothing" vs "click fires onClick but no navigation" vs "renders but is fully inert." | API rigor | **L27** below. |
| B2 | ⚠️ High | **Click → navigate → close sequence not precisely ordered.** Description names `onItemClick`, `onItemNavigate`, `autoCloseMobileOnNavigate`, and per-item `onClick` but doesn't lock the firing order or how `event.preventDefault()` interacts with each. | API rigor | **L28** below — explicit sequence. |
| B3 | ⚠️ High | **`renderItem` / `renderSection` slot signatures were too thin.** Missing useful context that consumers reaching for the slot will need: section ID, visible-item count, focus state, disabled state, badge position. Inline-corrected above; locked here. | API completeness | ✅ Corrected inline in §4 API sketch. **L29** locks the new shape. |
| B4 | ⚠️ High | **Root element ambiguous** — wrote "`<aside role="navigation">` (or `<nav>` directly)" in §2. Pick one. `<nav>` is the spec-correct element. | A11y rigor | ✅ Corrected inline in §2. **L31** locks. |
| B5 | ⚠️ High | **`id` prop must default via `useId()`** for `<SidebarNavTrigger aria-controls>` wiring + multi-instance safety. Description shows `id?: string` but doesn't lock the default behavior. | A11y rigor | **L32** below. |
| B6 | ⚠️ High | **`useSidebarNavState` items vs `<SidebarNav items>` precedence undefined.** When consumer passes BOTH `state` (from hook) AND `items` to the component, which wins? | API rigor | **L30** — `state` wins entirely (hook is source-of-truth when provided); `items` prop ignored with dev-only warn. |
| B7 | 🔸 Medium | **`<NavBadge> position` prop precedence (manual vs context auto-resolve) not explicit in API sketch.** `<NavBadge>` config + part both have `position?: "inline-end" \| "corner"`. Context auto-resolves based on collapsed state. Manual prop must win. | API rigor | **L33** below. |
| B8 | ⚠️ High | **Items[] reference stability requirement not documented.** Consumer passing a new array literal each render causes O(N) active-item re-derivation. Standard React idiom but easy to miss; document in guide. | Perf | **L34** below — `items` must be referentially stable; guide.md teaches `useMemo`. |
| B9 | 🔸 Medium | **`<NavUser>` avatar fallback chain not locked.** If `avatarUrl` 404s AND `avatarFallback` not supplied → fall back to initials of `user.name`. Common pattern but worth pinning. | API completeness | **L35** below. |
| B10 | 🔹 Low | **Hover-expand-on-collapsed pattern (Linear/Notion)** not explicitly ruled out. Some reviewers will wonder. | Scope clarity | **Added to v0.1 out-of-scope** — explicit deliberate exclusion. |
| B11 | 🔸 Medium | **Section `defaultCollapsed` field default unspecified.** Should be `false` (sections expanded by default). | API rigor | **L36** — `defaultCollapsed?: boolean` default `false`. |
| B12 | 🔸 Medium | **Section header keyboard focus behavior undefined** — does ArrowDown skip section headers or include them? | A11y rigor | **L37** — ArrowDown/Up INCLUDE collapsible-section headers in focus traversal; ArrowRight expands focused header, ArrowLeft collapses. Non-collapsible headers (no `collapsible: true`) are NOT focusable — pure labels. |
| B13 | 🔸 Medium | **`permissions` Set ref changes** — should `onPermissionDenied` fire for all currently-filtered items, or only for newly-filtered items (diff)? Firing for all on every mount = noisy diagnostics. | Robustness | **L38** — `onPermissionDenied` fires once per item on the initial filter + on each NEW item joining the filtered-out set (diff-based). Items entering the filtered set re-fire only when they previously rendered. |
| B14 | 🔸 Medium | **Empty `items` vs `loading=true` branching unclear.** Three states: loading, empty (no items), empty (all permission-filtered). | Robustness | **L39** — explicit precedence: `loading=true` wins → `renderLoading`; else `items.length === 0` → `renderEmptyState({reason: "no-items"})`; else all-items-filtered → `renderEmptyState({reason: "all-filtered-by-permission"})`; else normal render. (`"all-filtered-by-loading"` reason added for the rare async-permissions case where items + loading both arrive empty-and-filtered.) |
| B15 | 🔸 Medium | **Multi-instance same-page context conflicts.** Two `<SidebarNav>` instances → two `<SidebarNavProvider>` contexts → `<SidebarNavTrigger>` ambiguity. | Robustness | **L40** — each `<SidebarNav>` creates an isolated provider scoped to its subtree; `<SidebarNavTrigger>` reads the NEAREST provider (standard React context behavior). Multi-instance requires nesting triggers inside their respective sidebars' subtrees OR using explicit `controls` ref. Documented in guide. |
| B16 | 🔹 Low | **`<SidebarNavTrigger>` desktop-mode behavior unclear** — does it auto-hide or always render? | UX rigor | Consumer-responsibility (wrap with `lg:hidden`); component itself always renders + toggles state. Documented in §2 below "L17" addendum. Added to Q12. |
| B17 | 🔹 Low | **`shortcut` field activation behavior unclear** — does pressing the shortcut actually trigger the item? | Scope clarity | **DISPLAY ONLY in v0.1.** Activating shortcuts = consumer's job (wire keyboard handler). Added to v0.1 out-of-scope explicit list. |
| B18 | 🔹 Low | **External-link items (`target="_blank"`)** — should default render include an external-link indicator icon next to the label? | UX completeness | Added to Q13 — soft default vs opt-in. |
| B19 | 🔸 Medium | **`<NavUser>` name-click vs avatar-click** — both open dropdown by default in source? Or click-name → go-to-profile? | API decision | Added to Q14. Default proposal: BOTH open dropdown (matches source). Consumer wanting click-name → profile uses footerSlot for full override. |
| B20 | 🔹 Low | **`asChild` prop on `<SidebarNavTrigger>`** named but not defined. | API completeness | **L17 addendum** — shadcn-style `asChild` via `@radix-ui/react-slot`: when `true`, trigger renders no `<button>` and instead applies its props (`aria-controls`, `aria-expanded`, `onClick`) to the consumer's child element. Useful for custom triggers (avatar, branded button). |
| B21 | 🔹 Low | **`"use client"` directive not explicit** in scope. | Convention parity | All registry components ship `"use client"` at the top of their entry file. Implicit; called out in L29 addendum. |
| B22 | 🔹 Low | **Scroll-position persistence not explicitly out-of-scope.** Some consumers may expect it bundled with `storageKey`. | Scope clarity | Added to v0.1 deliberate-exclusion list — scroll position is volatile UI state, not user preference. |

### New locks (L27–L40)

| # | Lock | Source |
|---|---|---|
| **L27** | **`disabled` item behavior** — renders, `aria-disabled="true"`, `tabindex="-1"`, `cursor-not-allowed`, `opacity-50`, `pointer-events-none` (prevents click + hover). Tooltip still works on focus (`<Tooltip>` wraps the wrapper, not the link). `onClick` does NOT fire, navigation does NOT happen, `onItemClick`/`onItemNavigate` do NOT fire. | B1 |
| **L28** | **Click → navigate → close-mobile firing order:** (1) consumer's `item.onClick(event)` fires SYNC; (2) `onItemClick({item, isActive, event})` fires SYNC; (3) if `event.defaultPrevented === false` → `linkComponent` href-navigation proceeds (or `item.onClick` is the entire action if no href); (4) `queueMicrotask` → `onItemNavigate({item})` fires + `onActiveItemChange` fires (when path changes via prop); (5) if `autoCloseMobileOnNavigate && isMobileOpen` → `setMobileOpen(false)` via `onMobileOpenChange({open: false, reason: "item-click"})`. Disabled items short-circuit at step 1. | B2 |
| **L29** | **Render-prop slot signatures expanded** (`renderItem`, `renderBadge`, `renderTooltipContent`, `renderSection`, `renderLoading`, `renderEmptyState`) — additional context fields (sectionId, indexInSection, isFocused, isDisabled, badge position, visibleItemCount, etc.) per inline correction in §4. Locked shape is authoritative. | B3 |
| **L30** | **`state` prop (lifted hook) wins over individual props.** When `<SidebarNav state={state} items={...}>` AND items differ from `state.items`, `state` wins entirely; component's `items` prop is ignored + dev-only `console.warn` fires once. Same for `isCollapsed` / `isMobileOpen` / `currentPath` — `state` is the single source of truth when provided. | B6 |
| **L31** | **Root element = `<nav aria-label={...}>`** (NEVER `<aside>`). HTML5 semantic correctness. | B4 |
| **L32** | **`id` prop defaults via `useId()`** — auto-generated; `<SidebarNavTrigger aria-controls>` reads it via context (no consumer wiring needed unless using explicit `controls` ref). Consumer-supplied `id` overrides. | B5 |
| **L33** | **`<NavBadge> position` precedence:** explicit `position` prop wins → context auto-resolve (`"corner"` when sidebar collapsed, `"inline-end"` when expanded) → default `"inline-end"`. | B7 |
| **L34** | **Items reference stability requirement** — consumers must pass referentially-stable `items` arrays (memoize). New array reference each render causes O(N) re-derivation + invalidates active-item memo + may re-fire `onPermissionDenied`. Documented loudly in guide.md and usage.tsx; component does shallow-equal opt-in via `React.memo` on `<NavRow>`. | B8 |
| **L35** | **`<NavUser>` avatar fallback chain:** `avatarUrl` (with `onError` retry-once) → `avatarFallback` (if supplied) → auto-initials from `user.name` (first two characters of first two words, uppercased; "Ahmet Kaya" → "AK"). | B9 |
| **L36** | **`NavSection.defaultCollapsed`** default `false` (sections start expanded). Persisted via `storageKey` if set. | B11 |
| **L37** | **Section header keyboard nav:** collapsible-section headers are focusable (`<button>`); ArrowDown/Up include them; ArrowRight expands, ArrowLeft collapses. Non-collapsible section headers are not focusable (pure labels). | B12 |
| **L38** | **`onPermissionDenied` diff-based firing** — fires once per item on initial filter; re-fires only for newly-filtered items on `permissions` Set ref change (not for items already in the filtered-out set). | B13 |
| **L39** | **Empty / loading branching precedence:** `loading=true` → `renderLoading`; else `items.length === 0` → `renderEmptyState({reason: "no-items"})`; else `visibleEntries.length === 0` → `renderEmptyState({reason: "all-filtered-by-permission"})`; else normal render. | B14 |
| **L40** | **Multi-instance context isolation:** each `<SidebarNav>` creates its own provider scoped to its React subtree; `<SidebarNavTrigger>` consumes the nearest provider. Explicit `controls` ref bypasses context entirely. | B15 |

### Added open questions (Q11–Q14)

| # | Question | Suggested answer |
|---|---|---|
| Q11 | **Disabled item tooltip behavior** — when collapsed AND disabled, does the tooltip still show? | **Yes** — tooltip wraps the row wrapper, not the link element; `pointer-events-none` on the link doesn't block hover on the wrapper. Disabled items in collapsed mode would otherwise be unidentifiable. |
| Q12 | **`<SidebarNavTrigger>` desktop visibility** — auto-hide above breakpoint OR always render and let consumer wrap with `lg:hidden`? | **Consumer wraps.** Component doesn't know the breakpoint at render time (only the matchMedia hook does, and that's effect-gated for SSR safety). Consumer puts `<SidebarNavTrigger className="lg:hidden">` where they want it. |
| Q13 | **External-link items default visual** — auto-render external-link icon next to label when `target="_blank"`? | **No auto-icon.** Consumer uses the `accessory?: ReactNode` field to add an `ExternalLink` lucide icon if they want it. Auto-adding is opinionated; keep it opt-in via the accessory slot. |
| Q14 | **`<NavUser>` name + avatar click behavior** — both open dropdown (kasder source) OR name → profile, avatar → dropdown? | **Both open dropdown** (matches kasder source). Consumer wanting click-name → go-to-profile uses `footerSlot` for full override. The trigger covers the entire trigger area; splitting target zones inside a single component complicates focus management + a11y. |

### Updated out-of-scope (deliberate exclusions; NOT future deferrals)

Originals retained; new additions tagged ★ from audit:

- Nested sub-items beyond a flat section group
- Command-palette integration (separate procomp)
- Swipe-to-close on mobile drawer (Sheet primitive doesn't ship it)
- Pull-to-refresh
- Haptic feedback
- Workspace-switcher UI (covered by `headerSlot`)
- Direct edit-in-row of nav items
- Multi-select on nav items
- Drag-to-reorder nav items
- **★ Hover-expand-on-collapsed (Linear/Notion pattern)** — different interaction model, complex UX, not in source. v0.1 keeps the explicit click-to-toggle model.
- **★ Shortcut activation** — `shortcut?: string` on items is DISPLAY ONLY. Pressing the shortcut to activate the item is consumer responsibility (wire via their own keyboard handler at the app level).
- **★ Scroll-position persistence** — `storageKey` persists collapse state + section-collapse state ONLY. Scroll position is volatile UI state, not user preference.

### Inline corrections (already applied above)

| # | Original claim | Corrected claim |
|---|---|---|
| C-3 | "Root: `<aside role="navigation" aria-label={...}>` (or `<nav>` directly)." (§2 ambiguous wording) | "Root: `<nav aria-label={...}>` (NEVER `<aside>`)." Locked at L31. |
| C-4 | `renderItem` / `renderSection` / etc. slot signatures had minimal context fields | Expanded with section context, focus/disabled state, visible-item count, badge position. Locked at L29. |

### Audit summary

**Convention parity:** description already matched todo-tree's structure cleanly — no major omissions vs that precedent. All 22 MLs from the analysis folded back as L1–L26 ✓.

**API rigor:** 6 findings (B1, B2, B3, B5, B6, B7) — locks for behavior previously underspecified. These are the highest-value audit catches: each would have surfaced as a finding in GATE 2 plan review or GATE 3 spot-check otherwise.

**A11y rigor:** 2 findings (B4, B12) — `<nav>` root + section-header keyboard nav.

**Robustness:** 5 findings (B8, B9, B13, B14, B15) — edge cases consumers will hit but weren't pinned.

**Scope clarity:** 4 findings (B10, B17, B18, B22 + B16, B19 as Qs) — explicit lock vs explicit exclusion; closes ambiguities that would otherwise reach implementation.

**API completeness:** 2 findings (B20, B21) — small.

**Net effect on the v0.1 surface:** ZERO new features added. The audit was about RIGOR, not scope expansion — locking behaviors that were already implicit. File count + slot count + event count + handle method count unchanged from §2's estimates. **Lock count grows L1–L26 → L1–L40** (14 new locks).

**Recommendation stands:** **proceed** to user sign-off on this description (Q1–Q14 picks). Then GATE 2 plan doc.

---

## Appendix A — Migration-origin DNA preserved verbatim

Three pieces of the kasder source are subtle enough to call out so the plan + implementation honor them:

**Badge-position branching by collapsed mode** (kasder `SocialSidebar.tsx:101–113`) — ports to `<NavBadge position={isCollapsed ? "corner" : "inline-end"}>`. Corner position is `absolute top-1 right-1` on the icon container; inline-end is `right-3` on the row.

**Tone shift on active row** — kasder switches badge from destructive (red) to accent (lime) when the row is active. Ports to `tone={isActive ? "accent" : "destructive"}` resolver. Quiet on highlighted rows.

**Dropdown align flip** (kasder `SocialSidebar.tsx:151`) — `align={isCollapsed ? "center" : "end"}`. Ports to `<NavUser>` internal logic reading the sidebar's collapsed state via context.

## Appendix B — Sibling-procomp scope teaser (informational, not part of THIS gate)

`bottom-tab-bar-01` ships AFTER `sidebar-nav-01` closes (GATE 3 pass). Its description doc opens as a separate GATE 1 then. Anticipated scope: ~16 files, 5 slots, 7 events, no imperative handle. Imports `<NavBadge>` + `NavItem` type from `sidebar-nav-01` via relative paths. Owns `bottomActiveVariant: "scale-dot" | "lifted-pill" | "top-edge-line" | "color-only"` (default `"scale-dot"` from kasder) and `hideOnScroll?` opt-in.
