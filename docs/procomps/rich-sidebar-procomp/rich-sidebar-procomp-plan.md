# `rich-sidebar` — Pro-component Plan (Stage 2)

> **Stage:** 2 of 3 · **Status:** ✅ Signed off (GATE 2 closed 2026-05-22 — PQ1–PQ8 all defaults confirmed)
> **Slug:** `rich-sidebar` · **Category:** `navigation` · **Target version:** `v0.1.0`
> **Inherited from GATE 1:** [`rich-sidebar-procomp-description.md`](./rich-sidebar-procomp-description.md) — 40 locks (L1–L40), 14 confirmed Qs (Q1–Q14), 13 risks (R1–R13). All defaults accepted at GATE 1 sign-off.
>
> **🔁 GATE-2 re-validation pass — 2026-05-22.** Plan re-audited per `feedback_re_validation_pass_catches_real_issues` ("3–5 substantive refinements per Stage 2 plan"). **17 findings** across 4 categories (P1–P17) — folded back as L44–L48 new locks + PQ7–PQ8 added open questions + **4 inline corrections** (mobile SSR strategy, click sequence timing, React.memo drop, commit chain C7/C8 merge). Full audit at §25 below. **2 net-new UX features added: F1 auto-expand-section-on-active, F2 auto-scroll-active-into-view.**

This is the **plan** doc. Its job is to convert the description's WHAT into a HOW — architecture, file layout, state model, dependency wiring, commit chain. No code yet; just the build map.

---

## 1. Inherited inputs (one paragraph)

`rich-sidebar` is a registry-portable, framework-agnostic app-shell sidebar with built-in mobile-drawer mode, a 12-slot composition surface, 4 exported prefab parts (`<NavBadge>` / `<NavBrand>` / `<NavPrimaryAction>` / `<NavUser>`), a `<SidebarNavTrigger>` companion for mobile-drawer wiring outside the sidebar's subtree, and a `useSidebarNavState` headless hook. Items use a discriminated union (`NavItem | NavSection | NavSeparator`) supporting flat-or-grouped lists with optional `collapsible` sections. Active route detected via `currentPath` + optional `isActive` predicate + per-item `match`. Link primitive abstracted via `linkComponent` (default `<a href>`) typed as `NavLinkComponent`. CSS-variable theme surface (`--ilinxa-sidebar-*` + `--ilinxa-nav-*`) exposes widths / transitions / active colors at any DOM scope. Five `activeVariant` styles (`"fill" | "left-bar" | "right-bar" | "outline" | "subtle"`). Permissions = simple membership Set. Controlled / uncontrolled / headless-via-hook all supported (with `state` prop winning over individual props). `storageKey` opt-in localStorage persist for collapse + collapsed-sections. F-cross-13 carriers locked: Tooltip + Sheet + DropdownMenu — defensive callback contravariance pre-applied.

---

## 2. Final API (locked from description; this is the spec)

### 2.1 Types — `types.ts`

```ts
import type { ComponentType, ReactNode, Ref } from "react";

// ─── Items schema (L4 + L5 + L36) ───────────────────────────────

export interface NavItem {
  kind?: "item";
  id: string;
  label: string;
  icon?: ReactNode | ComponentType<{ className?: string }>;
  href?: string;
  onClick?: (event: React.MouseEvent) => void;
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
  defaultCollapsed?: boolean;                       // L36 — default false
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

// ─── Link primitive (L10) ───────────────────────────────────────

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

// ─── Prefab configs (L14, L15) ──────────────────────────────────

export interface NavBadgeConfig {
  value: number | string | ReactNode;
  max?: number;                                     // default 9
  variant?: "number" | "dot" | "pulse";             // default "number"
  tone?: "default" | "accent" | "destructive" | "muted";
  position?: "inline-end" | "corner";               // L33 — explicit wins; else context auto-resolve
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
    avatarFallback?: string;                        // L35 — chain: avatarUrl → avatarFallback → auto-initials
    status?: "online" | "offline" | "busy" | "away" | "invisible";
  };
  menuItems: ReadonlyArray<NavUserMenuItem | { kind: "separator" }>;
  onTriggerOpen?: (args: { open: boolean }) => void;
}

// ─── Events + state ─────────────────────────────────────────────

export type SidebarNavMobileOpenReason =
  | "trigger" | "item-click" | "outside-click" | "escape" | "imperative";

export interface SidebarNavStateValue extends SidebarNavHandle {
  collapsed: boolean;
  mobileOpen: boolean;
  collapsedSectionIds: ReadonlySet<string>;
  activeItemId: string | null;
  activeItem: NavItem | null;
  visibleEntries: ReadonlyArray<NavEntry>;
}

// SidebarNavProps + SidebarNavHandle + SidebarNavTriggerProps — full shapes
// are in description §4 API sketch. Plan does not duplicate; it locks
// the shape verbatim. See description's "## 4. Rough API sketch".
```

### 2.2 Type-export contract

| Exported name | Purpose |
|---|---|
| `NavItem` | Single item shape (default discriminator) |
| `NavSection` | Group with optional collapsibility |
| `NavSeparator` | Divider line |
| `NavEntry` | Union of the above three |
| `BasicNavItems = ReadonlyArray<NavItem>` | Convenience for flat-list consumers |
| `SidebarNavItems = ReadonlyArray<NavEntry>` | Convenience for grouped-list consumers |
| `NavLinkProps`, `NavLinkComponent` | Adapter contract |
| `NavBadgeConfig`, `NavBrandConfig`, `NavPrimaryActionConfig`, `NavUserConfig`, `NavUserMenuItem` | Prefab part configs |
| `SidebarNavProps`, `SidebarNavHandle`, `SidebarNavStateValue` | Main component types |
| `SidebarNavTriggerProps` | Companion |
| `SidebarNavMobileOpenReason` | Discriminator for `onMobileOpenChange` reason field |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  <SidebarNav>  (top-level entry; "use client")                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  useSidebarNavState (internal)                             │ │
│  │  ├── useReducer (sidebar-reducer.ts)                       │ │
│  │  ├── useStorageSync (storage.ts)                           │ │
│  │  ├── useMatchMedia (match-media.ts)                        │ │
│  │  └── useActiveDetection (active-detection.ts)              │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  <SidebarNavContext.Provider value={state, dispatch}>      │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │  Desktop render path (matchMedia false)             │   │ │
│  │  │  <nav>                                              │   │ │
│  │  │   ├── <SidebarHeader>                               │   │ │
│  │  │   ├── <SidebarNavList>                              │   │ │
│  │  │   │    └── (NavItem | NavSection | NavSeparator)*  │   │ │
│  │  │   └── <SidebarFooter>                               │   │ │
│  │  │  </nav>                                             │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │  Mobile render path (matchMedia true)               │   │ │
│  │  │  <Sheet>                                            │   │ │
│  │  │   <SheetContent>                                    │   │ │
│  │  │    <SidebarDrawerHeader />                          │   │ │
│  │  │    <SidebarNavList /> (same component)              │   │ │
│  │  │    <SidebarFooter />                                │   │ │
│  │  │   </SheetContent>                                   │   │ │
│  │  │  </Sheet>                                           │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

  ↕ Context bridge (auto-isolated per <SidebarNav> instance)

┌─────────────────────────────────────────────────────────────────┐
│  <SidebarNavTrigger>  (rendered anywhere in same React tree)    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Resolves via:                                             │ │
│  │  1. controls?: Ref<SidebarNavHandle> (explicit escape)     │ │
│  │  2. useContext(SidebarNavContext) (default)                │ │
│  │  3. else: disabled + dev-only console.warn                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**

1. **Single component, two render paths** — desktop and mobile-drawer share the SAME inner list + footer components; only the OUTER chrome differs (`<nav>` vs `<Sheet>`). This avoids duplicating the items-rendering logic.
2. **Reducer-driven state** — `useReducer` over `useState` because the state machine has multiple concerns (collapse, mobileOpen, collapsedSectionIds, focused-item-id) that mutate via discrete actions. Reducer also enables the headless `useSidebarNavState` hook to expose `dispatch` as an escape hatch (TBD — see plan-stage Q-Ps).
3. **Context-isolated per instance** — `SidebarNavContext` is created INSIDE `<SidebarNav>` (not at module scope), so multi-instance pages get isolated contexts naturally. `<SidebarNavTrigger>` consumes the nearest provider (L40).
4. **`useImperativeHandle` for the ref** — `SidebarNavHandle` mirrors the reducer's actions as methods. State getters (`isCollapsed()`, `getActiveItem()`) read from the reducer's current state via `useLatestRef`.
5. **Effect-gated mobile detection** — `useMatchMedia` returns `false` during SSR + first client render; transitions to real value after mount. Mobile-drawer DOM is gated behind a `mounted` flag to avoid hydration mismatch.

---

## 4. File structure

Sealed folder per `data-table` shape. Files NOT shipped via registry marked with [DOCS-ONLY].

```
src/registry/components/navigation/rich-sidebar/
├── rich-sidebar.tsx                 [SHIPPED] — entry; "use client"; default export <SidebarNav>
├── types.ts                           [SHIPPED]
├── index.ts                           [SHIPPED] — barrel; named exports
│
├── parts/
│   ├── sidebar-header.tsx             [SHIPPED] — brand row (header / brand / accessory)
│   ├── sidebar-nav-list.tsx           [SHIPPED] — renders NavEntry[] (items / sections / separators)
│   ├── sidebar-nav-row.tsx            [SHIPPED] — single item row; React.memo'd
│   ├── sidebar-nav-section.tsx        [SHIPPED] — section header + body wrapper
│   ├── sidebar-nav-separator.tsx      [SHIPPED] — thin divider line
│   ├── sidebar-footer.tsx             [SHIPPED] — footer slot/config dispatcher
│   ├── sidebar-drawer-header.tsx      [SHIPPED] — mobile drawer top chrome
│   ├── sidebar-skip-link.tsx          [SHIPPED] — sr-only:focus:not-sr-only skip link
│   ├── sidebar-loading-skeleton.tsx   [SHIPPED] — 6 shimmer rows
│   ├── sidebar-empty-state.tsx        [SHIPPED] — empty-state default
│   ├── sidebar-nav-trigger.tsx        [SHIPPED] — <SidebarNavTrigger> companion (export)
│   ├── nav-badge.tsx                  [SHIPPED] — <NavBadge> (shared w/ bottom-tab-bar-01 via relative import)
│   ├── nav-brand.tsx                  [SHIPPED] — <NavBrand>
│   ├── nav-primary-action.tsx         [SHIPPED] — <NavPrimaryAction>
│   ├── nav-user.tsx                   [SHIPPED] — <NavUser> (with status dot + dropdown)
│   ├── default-link.tsx               [SHIPPED] — default linkComponent (built-in <a href> wrapper)
│   ├── tooltip-wrapper.tsx            [SHIPPED] — F-cross-13 defensive Tooltip wrapper
│   └── icon.tsx                       [SHIPPED] — renders ReactNode | ComponentType<{className?}>
│
├── hooks/
│   ├── use-sidebar-nav-state.ts       [SHIPPED] — public headless hook
│   ├── use-sidebar-reducer.ts         [SHIPPED] — internal reducer hook
│   ├── use-match-media.ts             [SHIPPED] — SSR-safe matchMedia
│   ├── use-active-detection.ts        [SHIPPED] — items[] + currentPath → activeItem
│   ├── use-storage-sync.ts            [SHIPPED] — localStorage opt-in persist (storageKey)
│   ├── use-id-with-default.ts         [SHIPPED] — wraps React.useId for id-with-override pattern
│   └── use-latest-ref.ts              [SHIPPED] — stable-ref to mutable value (imperative handle)
│
├── lib/
│   ├── sidebar-reducer.ts             [SHIPPED] — pure reducer fn + actions + initial state
│   ├── derive-visible-entries.ts      [SHIPPED] — items[] + permissions[] → filtered entries
│   ├── compute-active-item.ts         [SHIPPED] — currentPath + isActive + match → active item
│   ├── flatten-entries.ts             [SHIPPED] — NavEntry[] → flat list for keyboard nav
│   ├── derive-css-vars.ts             [SHIPPED] — prop overrides → style object
│   ├── derive-avatar-fallback.ts      [SHIPPED] — name → initials (L35)
│   ├── active-variant-classes.ts      [SHIPPED] — activeVariant → Tailwind class composition
│   ├── badge-format.ts                [SHIPPED] — value/max → display string ("9+")
│   ├── storage-schema.ts              [SHIPPED] — localStorage JSON schema + version
│   └── keyboard-handler.ts            [SHIPPED] — Arrow/Home/End/Enter/Space/Esc dispatcher
│
├── contexts/
│   └── sidebar-nav-context.tsx        [SHIPPED] — React Context (created per <SidebarNav> instance)
│
├── dummy-data.ts                      [SHIPPED in -fixtures item ONLY]
├── demo.tsx                           [DOCS-ONLY]
├── usage.tsx                          [DOCS-ONLY]
└── meta.ts                            [DOCS-ONLY]
```

**File-count estimate:** **31 files** in the sealed folder. 28 shipped via registry base item. 1 shipped via `-fixtures` sibling item (`dummy-data.ts`). 3 docs-only (`demo.tsx`, `usage.tsx`, `meta.ts`). Matches the ~32-file audit estimate.

**Cross-procomp import:** `bottom-tab-bar-01` imports the following from `rich-sidebar` via **relative paths** (F-S1 lock):

```ts
// In bottom-tab-bar-01/bottom-tab-bar-01.tsx:
import { NavBadge } from "../rich-sidebar/parts/nav-badge";

// In bottom-tab-bar-01/types.ts:
import type { NavItem, NavLinkProps, NavLinkComponent } from "../rich-sidebar/types";
```

Never via `@ilinxa/rich-sidebar` alias in shipped source.

---

## 5. State model

### 5.1 Reducer state shape

```ts
interface SidebarReducerState {
  collapsed: boolean;
  mobileOpen: boolean;
  collapsedSectionIds: Set<string>;                  // mutable Set internally, exposed as ReadonlySet
  focusedItemId: string | null;                      // tracked for arrow-key navigation
  lastSyncedSnapshot: {                              // L7 Defense-2 content-equality
    collapsed: boolean;
    mobileOpen: boolean;
  };
}
```

### 5.2 Actions

```ts
type SidebarReducerAction =
  | { type: "SET_COLLAPSED"; collapsed: boolean }
  | { type: "TOGGLE_COLLAPSED" }
  | { type: "SET_MOBILE_OPEN"; open: boolean; reason: SidebarNavMobileOpenReason }
  | { type: "TOGGLE_MOBILE" }
  | { type: "SET_SECTION_COLLAPSED"; sectionId: string; collapsed: boolean }
  | { type: "TOGGLE_SECTION"; sectionId: string }
  | { type: "EXPAND_ALL_SECTIONS"; allSectionIds: ReadonlyArray<string> }
  | { type: "COLLAPSE_ALL_SECTIONS"; allSectionIds: ReadonlyArray<string> }
  | { type: "FOCUS_ITEM"; itemId: string | null }
  | { type: "EXTERNAL_SYNC"; collapsed: boolean; mobileOpen: boolean }       // controlled-mode prop change
  | { type: "RESET" };
```

`EXTERNAL_SYNC` is fired by the controlled-mode effect when `isCollapsed` or `isMobileOpen` props change — Defense 2 (content-equality short-circuit) gates whether the action is dispatched at all.

### 5.3 Source-of-truth precedence (L30)

```
state? (lifted from useSidebarNavState)
  ├── if provided → state.collapsed, state.mobileOpen are SOLE source of truth
  └── individual props (isCollapsed, isMobileOpen) IGNORED + dev-only console.warn

else if isCollapsed is provided (controlled) → external value drives state via EXTERNAL_SYNC effect
else → use defaultCollapsed (uncontrolled); state managed internally
```

### 5.4 Defense 1 + Defense 2 wiring (L7 controlled-mode)

```ts
// Inside useSidebarReducer():
useEffect(() => {
  if (isCollapsed === undefined) return;  // uncontrolled mode — skip
  // Defense 2: content-equality (here === for boolean)
  if (state.lastSyncedSnapshot.collapsed === isCollapsed) return;
  // Dispatch sync
  dispatch({ type: "EXTERNAL_SYNC", collapsed: isCollapsed, mobileOpen: state.mobileOpen });
}, [isCollapsed]);

// Defense 1: microtask-defer onCollapsedChange
const fireCollapsedChange = useCallback((collapsed: boolean) => {
  queueMicrotask(() => onCollapsedChangeRef.current?.({ collapsed }));
}, []);
```

**Defense 3 NOT applied** (L7) — discrete boolean has no continuous flow to suppress.

### 5.5 `useSidebarNavState` headless hook

```ts
export function useSidebarNavState(options: UseSidebarNavStateOptions = {}): SidebarNavStateValue {
  const [state, dispatch] = useReducer(sidebarReducer, options, initSidebarReducer);

  // Storage sync (effect-gated; only when storageKey set)
  useStorageSync(state, dispatch, options.storageKey);

  // Active-item derivation (memoized; recomputes on items / currentPath / isActive / permissions change)
  const { activeItemId, activeItem, visibleEntries } = useActiveDetection({
    items: options.items ?? [],
    currentPath: options.currentPath ?? "",
    isActive: options.isActive,
    permissions: options.permissions,
  });

  // Imperative handle methods bound here
  const handle = useMemo<SidebarNavHandle>(() => ({
    toggleCollapse: () => dispatch({ type: "TOGGLE_COLLAPSED" }),
    setCollapsed: (next) => dispatch({ type: "SET_COLLAPSED", collapsed: next }),
    isCollapsed: () => state.collapsed,
    openMobile: () => dispatch({ type: "SET_MOBILE_OPEN", open: true, reason: "imperative" }),
    closeMobile: () => dispatch({ type: "SET_MOBILE_OPEN", open: false, reason: "imperative" }),
    toggleMobile: () => dispatch({ type: "TOGGLE_MOBILE" }),
    isMobileOpen: () => state.mobileOpen,
    toggleSection: (id) => dispatch({ type: "TOGGLE_SECTION", sectionId: id }),
    // ... etc for all 22 methods
    getState: () => ({ ...state /* + derived fields */ }),
  }), [state]);

  return { ...handle, collapsed: state.collapsed, mobileOpen: state.mobileOpen, /* ... */ } satisfies SidebarNavStateValue;
}
```

---

## 6. Mobile-drawer architecture (revised post-audit P1 — CSS-gated, NOT JS-gated)

### 6.1 Strategy — CSS-controlled render-path branching (audit P1)

> **Revised from original v1 of this plan.** Original plan gated desktop-vs-Sheet rendering via JS (`useMatchMedia` returns `false` during SSR → desktop always renders first → switches to Sheet after mount → flash on mobile). On mobile devices the desktop sidebar's 256px width briefly pushes content off-screen — CLS hit. **L44 — CSS-only breakpoint gating; JS only tracks mobileOpen state.**

```tsx
return (
  <SidebarNavContext.Provider value={contextValue}>
    {/* Desktop render path — CSS-hidden below breakpoint */}
    <nav
      className={cn(
        "hidden",
        mobileBreakpointClasses[mobileBreakpoint] /* e.g., "lg:flex" */,
        side === "left" ? "border-r" : "border-l"
      )}
    >
      <DesktopSidebarChrome {...props} />
    </nav>

    {/* Sheet render path — CSS-hidden ABOVE breakpoint */}
    <div className={cn(mobileBreakpointHideClasses[mobileBreakpoint] /* e.g., "lg:hidden" */)}>
      <Sheet open={mobileOpen} onOpenChange={(open: boolean | undefined) => {
        if (typeof open === "boolean") {
          dispatch({ type: "SET_MOBILE_OPEN", open, reason: "outside-click" });
        }
      }}>
        <SheetContent side={mobileDrawerSide ?? side} className="p-0">
          <MobileSidebarChrome {...props} />
        </SheetContent>
      </Sheet>
    </div>
  </SidebarNavContext.Provider>
);
```

**Why this is correct:** both DOM trees render on initial paint, but CSS hides one based on the breakpoint. SSR-correct (no JS needed to decide which renders). Hydration-clean (server + first client paint match exactly). No flash. Slight DOM overhead — both trees mount; the hidden tree's `useEffect`s still run but its visual cost is zero. Sheet's `<SheetContent>` is portal-rendered so the hidden wrapper just prevents the trigger area + portal-trigger from rendering on desktop.

### 6.2 Breakpoint → Tailwind class mapping

```ts
const mobileBreakpointClasses = {
  sm: "sm:flex",   // ≥640px → desktop
  md: "md:flex",
  lg: "lg:flex",   // default
  xl: "xl:flex",
} as const;

const mobileBreakpointHideClasses = {
  sm: "sm:hidden",
  md: "md:hidden",
  lg: "lg:hidden",
  xl: "xl:hidden",
} as const;
```

Mapping is build-time-static; Tailwind's content scanner sees all 4 classes per direction and includes them in the bundle.

### 6.3 `useMatchMedia` — narrowed responsibility

Still ships at `hooks/use-match-media.ts` but **only used for JS state's mobile flag** — e.g., `autoCloseMobileOnNavigate` needs to know if the consumer is on mobile to decide whether to close. CSS gates the visual; JS gates the behavior. Implementation same as before:

```ts
export function useMatchMedia(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}
```

Returns `false` during SSR → mobile-only effects deferred until after hydration. No layout impact since CSS owns the layout decision.

### 6.4 `autoCloseMobileOnNavigate` implementation (L28)

```ts
const handleItemClick = (item: NavItem) => (e: React.MouseEvent) => {
  if (item.disabled) return;                                          // L27 short-circuit
  item.onClick?.(e);                                                  // step 1
  onItemClickRef.current?.({ item, isActive: ..., event: e });       // step 2
  if (e.defaultPrevented) return;                                     // step 3a — cancelled
  // step 3b — navigation proceeds via linkComponent's <a href>
  queueMicrotask(() => {                                              // step 4
    onItemNavigateRef.current?.({ item });
    // NOTE (audit P4): onActiveItemChange does NOT fire here.
    // It fires via useEffect([activeItem.id]) when consumer's `currentPath` prop updates.
    if (autoCloseMobileOnNavigate && isMobileFromMatchMedia && state.mobileOpen) {  // step 5
      dispatch({ type: "SET_MOBILE_OPEN", open: false, reason: "item-click" });
    }
  });
};
```

### 6.4 `autoCloseMobileOnNavigate` implementation (L28)

```ts
const handleItemClick = (item: NavItem) => (e: React.MouseEvent) => {
  if (item.disabled) return;                                          // L27 short-circuit
  item.onClick?.(e);                                                  // step 1
  onItemClickRef.current?.({ item, isActive: ..., event: e });       // step 2
  if (e.defaultPrevented) return;                                     // step 3a — cancelled
  // step 3b — navigation proceeds via linkComponent's <a href> (default browser behavior)
  queueMicrotask(() => {                                              // step 4 — microtask-defer
    onItemNavigateRef.current?.({ item });
    if (autoCloseMobileOnNavigate && state.mobileOpen) {              // step 5
      dispatch({ type: "SET_MOBILE_OPEN", open: false, reason: "item-click" });
    }
  });
};
```

---

## 7. Active-route detection algorithm

```ts
function computeActiveItem(args: {
  items: ReadonlyArray<NavItem>;        // flattened (sections expanded; separators dropped)
  currentPath: string;
  isActive?: (item: NavItem, currentPath: string) => boolean;
  defaultMatch?: "exact" | "prefix";
}): NavItem | null {
  for (const item of args.items) {
    if (item.hidden || item.disabled) continue;
    // Custom predicate wins (L9)
    if (args.isActive) {
      if (args.isActive(item, args.currentPath)) return item;
      continue;
    }
    // Per-item match → default match (L9)
    const matchMode = item.match ?? args.defaultMatch ?? "exact";
    if (matchMode === "exact" && item.href === args.currentPath) return item;
    if (matchMode === "prefix" && item.href && args.currentPath.startsWith(item.href)) return item;
  }
  return null;
}
```

**Memoization:** `useMemo` keyed by `[items, currentPath, isActive, defaultMatch]`. Items reference stability (L34) is critical — non-memoized items array invalidates the active-item memo every render.

**Tie-breaking for prefix matches:** if multiple items have prefix-matching hrefs (e.g., `/admin` and `/admin/users` both prefix-match `/admin/users`), the LONGEST match wins. The loop above takes the FIRST match in items[] order — must update to track longest. **Plan Q-P below.**

---

## 8. Section state machine

Section collapse state lives in `collapsedSectionIds: Set<string>`. Initial values from:

1. `defaultCollapsedSectionIds?: ReadonlyArray<string>` prop (uncontrolled init), OR
2. localStorage rehydration (if `storageKey` set), OR
3. Each section's `defaultCollapsed: boolean` (L36 — default `false`) — applied per-section at first render.

```ts
function initSectionState(args: {
  items: ReadonlyArray<NavEntry>;
  defaultCollapsedSectionIds?: ReadonlyArray<string>;
  storedIds?: ReadonlyArray<string>;
}): Set<string> {
  // Priority: stored > explicit prop > per-section defaultCollapsed
  if (args.storedIds) return new Set(args.storedIds);
  if (args.defaultCollapsedSectionIds) return new Set(args.defaultCollapsedSectionIds);
  const fromItems = args.items.flatMap((e) =>
    e.kind === "section" && e.defaultCollapsed ? [e.id] : []
  );
  return new Set(fromItems);
}
```

Reducer actions `TOGGLE_SECTION` / `EXPAND_ALL_SECTIONS` / `COLLAPSE_ALL_SECTIONS` mutate the Set immutably (return new Set).

---

## 9. CSS-variable theme surface (L11)

### 9.1 Vars exposed

```css
/* On the <nav> root element, inline style: */
--ilinxa-sidebar-w-collapsed: 5rem;
--ilinxa-sidebar-w-expanded: 16rem;
--ilinxa-sidebar-transition-duration: 300ms;
--ilinxa-sidebar-row-h: 2.75rem;
--ilinxa-sidebar-row-gap: 0.25rem;
--ilinxa-sidebar-px: 0.75rem;
--ilinxa-nav-active-bg: var(--primary);
--ilinxa-nav-active-fg: var(--primary-foreground);
--ilinxa-nav-active-bar-w: 3px;
--ilinxa-nav-badge-size: 1.25rem;
--ilinxa-nav-indent-step: 0.75rem;
```

### 9.2 Resolution order (L11)

```
1. Consumer CSS (`.themed-wrapper { --ilinxa-nav-active-bg: ... }`)  — WINS via cascade
2. Component props (collapsedWidth, expandedWidth, transitionDuration) → inline style on root
3. Component defaults → inline style on root
```

Component sets all vars unconditionally on the root (with defaults if no prop). Consumer CSS at any ancestor scope overrides via standard CSS cascade.

### 9.3 Implementation — `derive-css-vars.ts`

```ts
export function deriveCssVars(props: Pick<SidebarNavProps,
  "collapsedWidth" | "expandedWidth" | "transitionDuration"
>): React.CSSProperties {
  return {
    "--ilinxa-sidebar-w-collapsed": props.collapsedWidth ?? "5rem",
    "--ilinxa-sidebar-w-expanded": props.expandedWidth ?? "16rem",
    "--ilinxa-sidebar-transition-duration": props.transitionDuration ?? "300ms",
    "--ilinxa-sidebar-row-h": "2.75rem",
    "--ilinxa-sidebar-row-gap": "0.25rem",
    "--ilinxa-sidebar-px": "0.75rem",
    "--ilinxa-nav-active-bg": "var(--primary)",
    "--ilinxa-nav-active-fg": "var(--primary-foreground)",
    "--ilinxa-nav-active-bar-w": "3px",
    "--ilinxa-nav-badge-size": "1.25rem",
    "--ilinxa-nav-indent-step": "0.75rem",
  } as React.CSSProperties;
}
```

### 9.4 Tailwind utilities

Width morph uses `w-[var(--ilinxa-sidebar-w-collapsed)]` / `w-[var(--ilinxa-sidebar-w-expanded)]` via `data-collapsed` attribute selector:

```tsx
<nav
  data-collapsed={collapsed}
  className="data-[collapsed=true]:w-[var(--ilinxa-sidebar-w-collapsed)] data-[collapsed=false]:w-[var(--ilinxa-sidebar-w-expanded)] motion-safe:transition-[width] motion-safe:duration-[var(--ilinxa-sidebar-transition-duration)]"
  style={cssVars}
>
```

---

## 10. ActiveVariant rendering matrix (L12)

### 10.1 Class composition per variant

| Variant | Inactive state | Active state |
|---|---|---|
| `"fill"` | `hover:bg-muted text-foreground` | `bg-[var(--ilinxa-nav-active-bg)] text-[var(--ilinxa-nav-active-fg)]` |
| `"left-bar"` | `hover:bg-muted text-foreground relative` | `relative text-[var(--ilinxa-nav-active-bg)] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[var(--ilinxa-nav-active-bar-w)] before:rounded-r-full before:bg-[var(--ilinxa-nav-active-bg)]` |
| `"right-bar"` | `hover:bg-muted text-foreground relative` | `relative text-[var(--ilinxa-nav-active-bg)] after:absolute after:right-0 after:top-1 after:bottom-1 after:w-[var(--ilinxa-nav-active-bar-w)] after:rounded-l-full after:bg-[var(--ilinxa-nav-active-bg)]` |
| `"outline"` | `hover:bg-muted text-foreground` | `ring-2 ring-inset ring-[var(--ilinxa-nav-active-bg)] text-[var(--ilinxa-nav-active-bg)]` |
| `"subtle"` | `hover:bg-muted text-foreground` | `bg-accent/30 text-foreground font-medium` |

### 10.2 `active-variant-classes.ts` helper

```ts
export function getActiveVariantClasses(
  variant: SidebarNavProps["activeVariant"],
  isActive: boolean,
): string {
  if (!isActive) return "hover:bg-muted text-foreground";
  switch (variant ?? "fill") {
    case "fill": return "bg-[var(--ilinxa-nav-active-bg)] text-[var(--ilinxa-nav-active-fg)]";
    case "left-bar": return "relative text-[var(--ilinxa-nav-active-bg)] before:absolute before:left-0 ...";
    // ...
  }
}
```

Slot priority (L13): `renderItem` slot bypasses this helper entirely — the slot is responsible for its own active styling.

---

## 11. localStorage persist implementation (L23)

### 11.1 Schema (versioned)

```ts
// In lib/storage-schema.ts
export const STORAGE_SCHEMA_VERSION = 1;

export interface StoredState {
  v: 1;
  collapsed: boolean;
  collapsedSectionIds: string[];
}

export function isStoredState(value: unknown): value is StoredState {
  return (
    typeof value === "object" && value !== null &&
    (value as any).v === STORAGE_SCHEMA_VERSION &&
    typeof (value as any).collapsed === "boolean" &&
    Array.isArray((value as any).collapsedSectionIds)
  );
}
```

### 11.2 `useStorageSync` hook

```ts
export function useStorageSync(
  state: SidebarReducerState,
  dispatch: React.Dispatch<SidebarReducerAction>,
  storageKey: string | undefined,
): void {
  // Read on mount (effect-gated; SSR-safe)
  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!isStoredState(parsed)) return;
      dispatch({ type: "EXTERNAL_SYNC", collapsed: parsed.collapsed, mobileOpen: state.mobileOpen });
      parsed.collapsedSectionIds.forEach((id) =>
        dispatch({ type: "SET_SECTION_COLLAPSED", sectionId: id, collapsed: true })
      );
    } catch { /* silently fail — corrupted storage */ }
  }, [storageKey]);  // intentionally only on mount + storageKey change

  // Write on state change (debounced via microtask)
  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    const payload: StoredState = {
      v: STORAGE_SCHEMA_VERSION,
      collapsed: state.collapsed,
      collapsedSectionIds: [...state.collapsedSectionIds],
    };
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch { /* quota / serialization failure — silent */ }
  }, [storageKey, state.collapsed, state.collapsedSectionIds]);
}
```

`mobileOpen` is **NOT persisted** (per L23 — persistence is for user-preference state, not transient UI state).

---

## 12. `<SidebarNavTrigger>` companion implementation (L17)

### 12.1 Context shape

```ts
// contexts/sidebar-nav-context.tsx
interface SidebarNavContextValue {
  handle: SidebarNavHandle;
  state: { mobileOpen: boolean; collapsed: boolean };
  sidebarId: string;
}

export const SidebarNavContext = createContext<SidebarNavContextValue | null>(null);
```

### 12.2 Trigger resolution (L17 + L40 + B20 asChild)

```tsx
export function SidebarNavTrigger({
  controls,
  className,
  children,
  "aria-label": ariaLabel,
  asChild,
}: SidebarNavTriggerProps) {
  const ctx = useContext(SidebarNavContext);
  // Priority: explicit controls ref > context > none
  const resolved = controls
    ? (typeof controls === "object" && "current" in controls ? controls.current : controls)
    : ctx?.handle ?? null;
  const mobileOpen = resolved ? resolved.isMobileOpen() : false;
  const sidebarId = ctx?.sidebarId;

  if (!resolved) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[rich-sidebar] <SidebarNavTrigger> rendered with no <SidebarNav> in context and no `controls` ref — renders disabled.");
    }
    return <button disabled className={className}>{children}</button>;
  }

  const onClick = () => resolved.toggleMobile();
  const props = {
    type: "button" as const,
    onClick,
    "aria-controls": sidebarId,
    "aria-expanded": mobileOpen,
    "aria-label": ariaLabel ?? (mobileOpen ? "Close navigation" : "Open navigation"),
    className,
  };

  if (asChild) {
    // shadcn-style: clone child + apply props (uses @radix-ui/react-slot)
    return <Slot {...props}>{children}</Slot>;
  }

  return <button {...props}>{children ?? <DefaultTriggerIcon open={mobileOpen} />}</button>;
}

// Q2 lock: PanelLeft / PanelLeftClose (lucide)
function DefaultTriggerIcon({ open }: { open: boolean }) {
  return open ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />;
}
```

`asChild` uses `@radix-ui/react-slot` — already a transitive dep via shadcn primitives. No new peer.

---

## 13. F-cross-13 pre-emption (R7 + L19)

Three primitives at risk: **Tooltip + Sheet + DropdownMenu**. Pre-applied defensive patterns:

### 13.1 Tooltip wrapper (`parts/tooltip-wrapper.tsx`)

```tsx
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface TooltipWrapperProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "right" | "top" | "bottom" | "left";
  disabled?: boolean;
}

export function TooltipWrapper({ content, children, side = "right", disabled }: TooltipWrapperProps) {
  if (disabled) return <>{children}</>;

  return (
    <TooltipProvider
      // F-cross-13: dual-name delayDuration + delay
      delayDuration={300}
      // @ts-expect-error — Base UI uses `delay`; Radix uses `delayDuration`. Set both defensively.
      delay={300}
    >
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="z-50">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

### 13.2 Sheet defensive callback (`onOpenChange`)

```tsx
<Sheet
  open={mobileOpen}
  // F-cross-13: contravariant — Radix passes (open: boolean); Base UI sometimes (open?: boolean).
  // Type as union; runtime checks defensively.
  onOpenChange={(open: boolean | undefined) => {
    if (typeof open === "boolean") {
      dispatch({ type: "SET_MOBILE_OPEN", open, reason: "outside-click" });
    }
  }}
>
```

### 13.3 DropdownMenu (inside `<NavUser>`)

```tsx
<DropdownMenu
  open={open}
  onOpenChange={(next: boolean | undefined) => {
    if (typeof next === "boolean") setOpen(next);
  }}
>
  <DropdownMenuItem
    onSelect={(e: Event | undefined) => {
      // Radix passes Event; Base UI may pass undefined or different shape
      menuItem.onClick?.(e as unknown as React.MouseEvent);
    }}
  >
```

### 13.4 F-cross-11 path-b smoke (mandatory before close)

Per spotcheck rule: run `e:/tmp/ilinxa-smoke-consumer/` install + `pnpm tsc --noEmit` after publish. Same-day patch budget expected (precedent: todo-tree v0.1.0 → v0.1.1 same-day).

---

## 14. `linkComponent` integration

### 14.1 Default — `parts/default-link.tsx`

```tsx
import { forwardRef } from "react";
import type { NavLinkProps } from "../types";

export const DefaultLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  function DefaultLink({ href, children, ...rest }, ref) {
    return <a ref={ref} href={href} {...rest}>{children}</a>;
  },
);
```

### 14.2 Usage example wiring (for `usage.tsx` docs-only)

```tsx
// Next.js adapter
const NextLinkAdapter: NavLinkComponent = ({ href, children, ...rest }) => (
  <Link href={href} {...rest}>{children}</Link>
);

// React Router adapter
const ReactRouterAdapter: NavLinkComponent = ({ href, children, ...rest }) => (
  <RouterLink to={href} {...rest}>{children}</RouterLink>
);

// TanStack Router adapter
const TanStackAdapter: NavLinkComponent = ({ href, children, ...rest }) => (
  <TanstackLink to={href as TanStackTo} {...rest}>{children}</TanstackLink>
);
```

All three recipes shipped in `usage.tsx`. None baked into the registry source.

---

## 15. Slot props implementation (L13 priority resolver)

### 15.1 Per-slot resolver pattern

```tsx
// Inside SidebarNavList:
const renderEntryRow = (item: NavItem, sectionId: string | null, indexInSection: number) => {
  const defaultRender = <DefaultNavRow item={item} ... />;
  // L13: slot wins over prop variant
  if (renderItem) {
    return renderItem({
      item,
      isActive: activeItemId === item.id,
      isCollapsed: state.collapsed,
      isFocused: state.focusedItemId === item.id,
      isDisabled: item.disabled ?? false,
      sectionId,
      indexInSection,
      defaultRender,
    });
  }
  return defaultRender;
};
```

Same pattern for: `renderBadge` (badge cell), `renderTooltipContent`, `renderSection`, `renderLoading`, `renderEmptyState`.

### 15.2 Brand / Footer / PrimaryAction slot-vs-config

```tsx
// Brand: brandSlot wins over brand config
const brandNode = brandSlot ?? (brand ? <NavBrand {...brand} /> : null);

// Footer: same
const footerNode = footerSlot ?? (footer ? <NavUser {...footer} /> : null);

// PrimaryAction: same
const primaryActionNode = primaryActionSlot ?? (primaryAction ? <NavPrimaryAction {...primaryAction} /> : null);
```

---

## 16. Prefab parts implementation

### 16.1 `<NavBadge>`

```tsx
export function NavBadge({
  value, max = 9, variant = "number", tone = "default", position, showZero = false, className,
}: NavBadgeConfig & { className?: string }) {
  // Resolve position: explicit prop > context auto > default "inline-end"
  const ctx = useContext(SidebarNavContext);
  const resolvedPosition = position ?? (ctx?.state.collapsed ? "corner" : "inline-end");

  // Skip render for zero (L33)
  if (typeof value === "number" && value === 0 && !showZero) return null;

  // Format display
  const display = typeof value === "number" ? (value > max ? `${max}+` : String(value)) : value;

  // ... render with variant + tone + position-based classes
}
```

### 16.2 `<NavUser>` avatar fallback chain (L35)

```tsx
import { deriveAvatarFallback } from "../lib/derive-avatar-fallback";

const initials = deriveAvatarFallback(user.name);  // "Ahmet Kaya" → "AK"

<Avatar>
  {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
  <AvatarFallback>{user.avatarFallback ?? initials}</AvatarFallback>
</Avatar>
{user.status && user.status !== "invisible" && <StatusDot status={user.status} />}
```

### 16.3 `<NavBrand>` collapsed-aware

```tsx
const ctx = useContext(SidebarNavContext);
const isCollapsed = ctx?.state.collapsed ?? false;
// label hidden when collapsed (icon only)
return (
  <Link href={href}>
    {logo}
    {!isCollapsed && <span>{label}</span>}
  </Link>
);
```

---

## 17. Accessibility implementation

### 17.1 ARIA structure

```html
<nav aria-label="Main navigation" id="sidebar-nav-abc123" data-collapsed="false">
  <!-- Skip link -->
  <a href="#main-content" class="sr-only focus:not-sr-only ...">Skip to main content</a>

  <!-- Brand row -->
  <div role="presentation">...</div>

  <!-- Nav list -->
  <ul role="list">
    <li><a href="..." aria-current="page" data-active="true">...</a></li>
    <li>
      <!-- Section -->
      <button aria-expanded="true" aria-controls="section-workspace-body">Workspace</button>
      <ul id="section-workspace-body" role="group" aria-labelledby="...">
        ...
      </ul>
    </li>
  </ul>

  <!-- Footer -->
  <div>...</div>
</nav>
```

### 17.2 Keyboard handler (`lib/keyboard-handler.ts`)

```ts
export function handleSidebarKeydown(e: React.KeyboardEvent, ctx: {
  visibleEntries: ReadonlyArray<NavEntry>;
  focusedId: string | null;
  setFocusedId: (id: string) => void;
  toggleSection: (id: string) => void;
  isSectionCollapsed: (id: string) => boolean;
}) {
  const flat = flattenEntriesForKeyboard(ctx.visibleEntries);  // L37 — includes collapsible headers
  const currentIdx = flat.findIndex(e => e.id === ctx.focusedId);

  switch (e.key) {
    case "ArrowDown": e.preventDefault(); ctx.setFocusedId(flat[currentIdx + 1]?.id ?? flat[0].id); break;
    case "ArrowUp":   e.preventDefault(); ctx.setFocusedId(flat[currentIdx - 1]?.id ?? flat.at(-1)!.id); break;
    case "Home":      e.preventDefault(); ctx.setFocusedId(flat[0].id); break;
    case "End":       e.preventDefault(); ctx.setFocusedId(flat.at(-1)!.id); break;
    case "ArrowRight": {
      const current = flat[currentIdx];
      if (current?.kind === "section-header" && ctx.isSectionCollapsed(current.id)) {
        e.preventDefault();
        ctx.toggleSection(current.id);
      }
      break;
    }
    case "ArrowLeft": {
      const current = flat[currentIdx];
      if (current?.kind === "section-header" && !ctx.isSectionCollapsed(current.id)) {
        e.preventDefault();
        ctx.toggleSection(current.id);
      }
      break;
    }
    // Enter/Space → activate (handled by native button/link click)
  }
}
```

### 17.3 Reduced-motion (L11 + audit B19)

```css
/* Tailwind: motion-safe:transition-[width] motion-safe:duration-... */
/* Equivalent to: */
@media (prefers-reduced-motion: no-preference) {
  .sidebar-nav-root { transition: width var(--ilinxa-sidebar-transition-duration); }
  .nav-icon-active { transform: scale(1.1); }
}
```

---

## 18. Performance

### 18.1 Memoization map

| Surface | Memo strategy |
|---|---|
| `visibleEntries` | `useMemo([items, permissions])` |
| `activeItem` | `useMemo([visibleEntries, currentPath, isActive, defaultMatch])` |
| `<SidebarNavRow>` | **NO manual `React.memo`** (audit P5) — React Compiler 19 auto-memoizes; no-precedent-in-this-lib procomp ships manual memo. Verified by grep against `todo-tree/parts/` — zero hits. Trust the compiler. |
| `cssVars` style obj | `useMemo([collapsedWidth, expandedWidth, transitionDuration])` |
| Imperative handle | `useMemo([reducer state])` — stable refs across renders |

### 18.2 Items reference stability (L34)

Guide.md leads with: "**Memoize your `items` array.** Passing `items={[...]}` inline re-derives active-item + visibleEntries every render."

```tsx
// Bad — new ref every render
<SidebarNav items={[{ id: "h", label: "Home", ... }]} />

// Good — stable ref
const items = useMemo(() => [{ id: "h", label: "Home", ... }], []);
<SidebarNav items={items} />
```

---

## 19. Dependencies

### 19.1 npm peers

| Dep | Version | Purpose | Status |
|---|---|---|---|
| `react` | `>=19.0.0` | Required (peer) | Already a peer |
| `lucide-react` | `>=0.475.0` | Default icons (`PanelLeft`, `PanelLeftClose`, status dots) | Already in lib |

No net-new npm deps.

### 19.2 Internal (shadcn primitives)

| Primitive | Use | Status in this repo |
|---|---|---|
| `button` | Trigger, primary action, footer trigger | Present |
| `avatar` | NavUser | Present |
| `dropdown-menu` | NavUser menu | Present |
| `tooltip` | Collapsed-mode label | **Add via `pnpm dlx shadcn add tooltip`** |
| `sheet` | Mobile drawer | **Add via `pnpm dlx shadcn add sheet`** |
| `separator` | Section / footer separators | Present (verify) |

`meta.ts` declares: `dependencies.shadcn = ["button", "avatar", "dropdown-menu", "tooltip", "sheet", "separator"]`.

### 19.3 `dependencies.internal`

```ts
// meta.ts
dependencies: {
  npm: { "lucide-react": "^0.475.0" },
  shadcn: ["button", "avatar", "dropdown-menu", "tooltip", "sheet", "separator"],
  internal: [],  // No internal procomp deps — rich-sidebar owns the shared NavBadge
}
```

When `bottom-tab-bar-01` ships next, it declares `internal: ["rich-sidebar"]` for the relative-path import.

---

## 20. Implementation order (commit chain)

Single-feature ships break into ~12–14 commits per recent procomps. For rich-sidebar with this surface, plan **14 commits** (C1–C14) — each landing a coherent slice that compiles + the docs-site detail page renders without regression.

| # | Commit | What lands | Validates |
|---|---|---|---|
| **C1** | scaffold + types | `pnpm new:component navigation/rich-sidebar`; populate `types.ts` with all interfaces + type aliases; empty `index.ts` barrel; empty `meta.ts` shell; placeholder `<SidebarNav>` returning null. | tsc clean; `/components/rich-sidebar` 200s. |
| **C2** | reducer + state hook | `lib/sidebar-reducer.ts`, `hooks/use-sidebar-reducer.ts`, `contexts/sidebar-nav-context.tsx`. `<SidebarNav>` wires reducer + context provider. Still renders empty. | tsc clean; reducer unit-test via dev console. |
| **C3** | items rendering + active detection | `lib/derive-visible-entries.ts`, `lib/compute-active-item.ts`, `hooks/use-active-detection.ts`, `parts/sidebar-nav-list.tsx`, `parts/sidebar-nav-row.tsx`, `parts/sidebar-nav-separator.tsx`, `parts/icon.tsx`, `parts/default-link.tsx`. Renders flat items + separators with active state. NO sections, NO collapse, NO mobile. | Demo page shows a flat list; clicking changes active state via consumer-passed `currentPath`. |
| **C4** | sections | `parts/sidebar-nav-section.tsx`; reducer actions for section collapse; `defaultCollapsed` per section honored. Render sections with collapsible headers. | Demo page shows mixed flat + sectioned items; click section header toggles. |
| **C5** | collapse + CSS vars + activeVariant | Collapse state wired; `lib/derive-css-vars.ts`; `lib/active-variant-classes.ts`; row paint switches by `activeVariant`. Width morph with `motion-safe`. | Demo page demonstrates collapse toggle + all 5 variants side-by-side. |
| **C6** | badge + tooltip-on-collapsed | `parts/nav-badge.tsx` (shared part — used in this procomp + later by bottom-tab-bar-01), `parts/tooltip-wrapper.tsx` (F-cross-13 defensive). Wire collapsed-mode tooltips. | Tooltip shows on collapsed-icon hover/focus; badge `"corner"` vs `"inline-end"` positioning works. |
| **C7** | mobile drawer (CSS-gated) + Sheet + trigger companion | `hooks/use-match-media.ts`; CSS-gated render-path branching (L44); Sheet integration; `SET_MOBILE_OPEN` action wired; `autoCloseMobileOnNavigate`; **merged with original C8** (audit P3) so the validator below can actually open the drawer to verify item-tap-closes — original C7 had a chicken-and-egg validation issue. `parts/sidebar-nav-trigger.tsx` with context resolution + explicit `controls` ref escape + `asChild` via `@radix-ui/react-slot` + default `PanelLeft / PanelLeftClose` icon swap (Q2). F-cross-13 defensive `onOpenChange`. | Resize browser → CSS swaps render path with no flash; `<SidebarNavTrigger>` opens drawer; tap item closes drawer (when enabled); resize back → drawer state preserved via mobileOpen. |
| **C9** | prefab parts (Brand / PrimaryAction / User) | `parts/nav-brand.tsx`, `parts/nav-primary-action.tsx`, `parts/nav-user.tsx`. NavUser includes status dot (L35 fallback chain) + discriminated-union menuItems (L15 / ML22-b). F-cross-13 defensive on DropdownMenu callbacks. | Demo page shows kasder-style recipe (brand + primary action + user footer). |
| **C10** | full slot system + render-prop slots | `headerSlot`, `brandSlot`, `navAccessorySlot`, `primaryActionSlot`, `footerSlot`, `drawerHeaderSlot`, `renderItem`, `renderBadge`, `renderTooltipContent`, `renderSection`, `renderLoading`, `renderEmptyState`. Slot priority rule (L13) wired. | Demo page demonstrates renderItem + brandSlot overrides side-by-side with prefab parts. |
| **C11** | persistence + headless hook | `hooks/use-storage-sync.ts`, `lib/storage-schema.ts`, public `hooks/use-sidebar-nav-state.ts`. `state` prop wins over individual props (L30) + dev-only warn. localStorage rehydration. | Reload page → collapse state persists. Headless example renders via lifted state. |
| **C12** | keyboard + skip link + permissions | `lib/keyboard-handler.ts`, `lib/flatten-entries.ts`, `parts/sidebar-skip-link.tsx`. Permissions filter + `onPermissionDenied` diff-firing (L38). Empty state branching (L39). | Keyboard nav works: Arrow up/down, Home/End, ArrowRight/Left on section headers. Skip link visible on focus. |
| **C13** | loading state + edge cases + RTL | `parts/sidebar-loading-skeleton.tsx`, `parts/sidebar-empty-state.tsx`. Side: left/right wiring. RTL-aware paddings. Loading skeleton with reduced-motion. | All edge cases: empty items, all-filtered, loading, side=right, RTL via `dir="rtl"`. |
| **C14** | demo.tsx + usage.tsx + meta.ts + manifest + registry.json + STATUS + spotcheck | All docs-site + registry distribution + STATUS.md update + GATE 3 spotcheck review at `reviews/2026-MM-DD-v0.1.0-spotcheck.md`. F-cross-11 path-b smoke. | Component closes. `/components/rich-sidebar` fully demonstrates all features. Ready to push. |

**Same-day patch budget expected:** v0.1.0 → v0.1.1 same-day for F-cross-13 fallout (precedent: 3 consecutive procomps have hit this). Budget the patch loop into C14.

---

## 21. Smoke harness plan (path-b)

Per F-cross-11 + `project_smoke_harness`. After `pnpm vercel-build` deploys the new `<slug>.json` artifact:

1. `cd e:/tmp/ilinxa-smoke-consumer/` (existing harness).
2. `pnpm dlx shadcn@4.6.0 add @ilinxa/rich-sidebar`.
3. Mount a stub page importing `<SidebarNav>` + `<SidebarNavTrigger>` + `useSidebarNavState`.
4. `pnpm tsc --noEmit` — must pass clean (no F-cross-13 hits).
5. If `tsc` reports callback-contravariance errors → confirm pre-emption locked in C6/C7/C9 worked; if not → patch in v0.1.1.
6. Visual smoke: render in browser, toggle collapse, open mobile drawer, navigate items, verify tooltips, verify localStorage persist.

---

## 22. Risks & alternatives (carried from description R1–R13 + plan-stage additions)

Carried from description (R1–R13); plan-stage additions below.

| # | Risk | Plan-stage mitigation |
|---|---|---|
| R3-plan | shadcn primitive install order on first consumer install. `tooltip` / `sheet` not present in stock shadcn add — must be added separately. | `meta.ts` `dependencies.shadcn` lists both — CLI auto-installs. Smoke harness verifies. |
| R7-plan | F-cross-13 hits across 3 primitives in one procomp = highest exposure. | Pre-emptive defensive patterns coded in C6/C7/C9 (Tooltip + Sheet + DropdownMenu). Path-b smoke in C14. Same-day patch budgeted. |
| R10-plan | `autoCloseMobileOnNavigate` microtask timing — if consumer's navigation triggers route-change before microtask runs, close fires after the page already changed → harmless. If navigation is async (consumer-controlled), close fires before nav completes → drawer closes during nav animation, also harmless. | Both edge cases benign. No additional mitigation. |
| R12-plan | Empty sections after permission filter still rendering header. | Default behavior: section with `visibleItems.length === 0` after filter auto-hides (header + group). Override via `keepEmptySections?: boolean` (locked — added as L41 below). |
| **P1** (NEW) | **Prefix-match tie-breaking** — multiple items with prefix-matching hrefs (e.g., `/admin` AND `/admin/users` both prefix-match `/admin/users`). Description didn't lock. | **L42 (plan-stage lock)** — longest matching `item.href` wins. `compute-active-item.ts` sorts candidates by `href.length` desc, takes first match. |
| **P2** (NEW) | **`autoCloseMobileOnNavigate` + `disabled` item** — disabled items short-circuit at step 1 (L28). Drawer should NOT close on disabled-item tap (no navigation happened). | Confirmed by L28 sequence — step 5 only reachable if not short-circuited. |
| **P3** (NEW) | **`state` lifted hook ALSO uses `storageKey`** — both component AND hook accept `storageKey`. Which wins? Could double-write. | **L43 (plan-stage lock)** — if `state` provided to component, the hook owns `storageKey`; component's `storageKey` prop is ignored + dev-only warn. Single source of truth. |
| **P4** (NEW) | **Section `id` collisions with item `id`** — both share the `id` field; consumer could accidentally collide. | Validated at runtime: items + sections flattened, duplicate IDs trigger dev-only `console.error` (not throw). Production: undefined behavior. |
| **P5** (NEW) | **`renderSection` slot getting `visibleItemCount = 0`** — if consumer doesn't auto-hide empty sections via L41 default, they might render empty groups. | Slot receives `visibleItemCount`; consumer decides. Default behavior (no slot) auto-hides per L41. |

---

## 23. Plan-stage open questions

Pre-answered where the answer is obvious; only items where I want explicit user confirmation remain as Qs.

| # | Question | Suggested answer |
|---|---|---|
| PQ1 | **`dispatch` escape hatch on `useSidebarNavState`?** todo-tree exposes `dispatch` on its hook for advanced reducer customization. Worth it here? | **No** — sidebar's reducer is internal-shape; exposing it locks the action union as public API. Consumers wanting fine-grained control use the imperative handle (already 22 methods). |
| PQ2 | **`keepEmptySections?: boolean` default** — auto-hide empty sections (false = hide; true = keep header) | **`false`** (auto-hide). Cleaner default. L41 locks this. |
| PQ3 | **Items + sections ID-collision behavior** — dev-only warn vs runtime throw | **Dev-only warn**, prod undefined. Mirrors React's key warning posture. |
| PQ4 | **Should bottomTabBar's `<NavBadge>` import be tested via path-b smoke during rich-sidebar's commit chain?** Or wait until bottom-tab-bar-01's commit chain? | **Wait.** rich-sidebar's C14 smoke covers its own surface; cross-procomp resolution tested when bottom-tab-bar-01 lands. |
| PQ5 | **Headless example variant `<HeadlessExample>` in `demo.tsx`?** | **Yes** — todo-tree shipped one. Demonstrates the `useSidebarNavState` + `state` prop path. |
| PQ6 | **`<SidebarNavTrigger>` `asChild` ships with default `false`?** | **Yes** — default render is a `<button>` with the icon. `asChild` is for consumers who want a custom trigger element. |

---

## 24. Definition of "done" for THIS document (stage gate)

- [ ] All 22 sections above understood + accepted as the build map.
- [ ] PQ1–PQ6 answered.
- [ ] Plan-stage locks (L41–L43) confirmed.
- [ ] No new top-level scope additions during implementation (loud deviations only → fold back into §7 of the description doc on next update).
- [ ] User explicitly closes GATE 2 — date TBD.

---

## 25. GATE-2 re-validation audit (2026-05-22)

> Self-audit per [`feedback_re_validation_pass_catches_real_issues`](../../../C:/Users/AsiaData/.claude/projects/e--2026-ilinxaDOC-ilinxa-ui-pro/memory/feedback_re_validation_pass_catches_real_issues.md). Re-read against: (1) actual React 19 + React Compiler behavior in the repo (grepped `React.memo` usage in todo-tree — zero hits, confirming compiler trust); (2) SSR + hydration realities for the mobile-drawer breakpoint; (3) commit-chain validators for chicken-and-egg cycles; (4) timing semantics for derived state callbacks (`onActiveItemChange`); (5) UX expectations that were absent (auto-expand-on-active, auto-scroll-into-view); (6) producer-side build concerns.
>
> 17 findings (P1–P17) across 4 categories. Folded back as new locks L44–L48 + new Qs PQ7–PQ8 + 4 inline corrections (mobile SSR strategy + click sequence timing + React.memo removed + C7/C8 merged). **2 net-new UX features added (F1, F2) — these are not scope creep; they're standard sidebar UX that consumers will expect.**

### Findings (severity-ordered)

| # | Sev | Finding | Category | Resolution |
|---|---|---|---|---|
| P1 | 🚫 Blocker | **Mobile-drawer JS-gated rendering causes layout flash + CLS hit on mobile devices.** Original §6.1 used `useMatchMedia` to decide which DOM tree renders. SSR returns `false` (= desktop) → mobile devices paint 256px-wide desktop sidebar for 1 frame → `useEffect` runs → switches to Sheet. Sub-100ms? On slow mobile CPUs more like 200–400ms. CLS budget blown. | SSR rigor | ✅ **Corrected inline §6.** **L44** — CSS-only render-path gating (`hidden lg:flex` + `lg:hidden`). Both DOM trees render; CSS hides one. SSR-correct + no flash. `useMatchMedia` narrowed to JS behavior gating only (e.g., `autoCloseMobileOnNavigate`). |
| P2 | ⚠️ High | **`onActiveItemChange` timing was wrong** — original §6.4 step 4 fired it synchronously in microtask defer after click. But `activeItem` is derived from `currentPath` (prop), which changes when consumer's router commits. The change is reactive, not click-synchronous. | API correctness | ✅ **Corrected inline §6.4** — note added; `onActiveItemChange` fires via `useEffect([activeItemId])` when prop updates, NOT in click handler. |
| P3 | ⚠️ High | **Commit chain C7/C8 had chicken-and-egg validator:** C7's validator says "tap item closes drawer" but trigger doesn't exist until C8 — drawer can't be opened to tap an item. | Build planning | ✅ **Corrected inline §20** — C7 and C8 merged into one commit (`mobile drawer + trigger companion`). Commit chain compresses from 14 to 13 commits. |
| P4 | 🔸 Medium | **`React.memo` on `<SidebarNavRow>` is anti-pattern in this lib.** React Compiler 19 auto-memoizes; manual `React.memo` is redundant or conflicting. Grepped `todo-tree/parts/` — zero `React.memo` usages despite todo-tree being the largest procomp shipped. | Convention parity | ✅ **Corrected inline §18.1.** **L45** — no manual `React.memo` anywhere in shipped source; trust React Compiler 19. |
| P5 | ⚠️ High | **`<NavBadge>` standalone-use behavior unclear.** When `bottom-tab-bar-01` imports `NavBadge` via relative path, there's no `<SidebarNavContext>` provider above it. The context-read returns `null`. Plan didn't lock the fallback explicitly. | API rigor | **L46** — `<NavBadge>` outside a sidebar context defaults `position` to `"inline-end"`; consumer can override via the explicit `position` prop. `bottom-tab-bar-01` will pass `position="corner"` (or its own resolved value) for badges on its tab items. |
| P6 | ⚠️ High | **State + reducer + hook architecture clarification.** When consumer uses `<SidebarNav state={lifted}>`, the component MUST NOT instantiate a separate reducer (would double the state). But hooks rules require the hook to be called unconditionally. Pattern: hook always runs; output discarded when external state provided. | API rigor | **L47** — component always calls `useSidebarNavState` internally for hooks-rules compliance, but `state` prop (when provided) wins entirely (L30). Internal hook's output is computed but discarded — slight waste, but follows React rules. Document in guide. |
| P7 | 🔸 Medium | **Empty-state branching missed a fourth case** — items all `hidden: true` (manual `hidden` flag, not permission-filtered). Plan's `renderEmptyState` reasons enum doesn't include this. | Robustness | **L48** — add `"all-hidden"` to the `reason` union. Branching: `loading` → `"all-filtered-by-loading"`; `items.length === 0` → `"no-items"`; `visibleEntries.length === 0 && filterCount > 0` → `"all-filtered-by-permission"`; `visibleEntries.length === 0 && hiddenCount > 0` → `"all-hidden"`. |
| P8 | 🔸 Medium | **localStorage write debouncing missed.** Every section toggle writes synchronously. Rapid toggles (expand/collapse spam) thrash localStorage. | Perf | Plan-stage refinement to §11.2 — write effect is debounced 50ms via `setTimeout` ref. Reads remain eager. |
| P9 | 🔸 Medium | **`mobileBreakpoint` enum is constraining** — only `sm / md / lg / xl`. Consumer wanting `2xl` or `(max-width: 900px)` is blocked. | Flexibility | Add to PQ7 — expand enum vs accept raw CSS query. Recommendation below. |
| P10 | 🔸 Medium | **`linkComponent` + `disabled` interaction not specified.** Disabled item still renders `<a href>`. Native HTML `<a>` doesn't support `disabled` attribute. `pointer-events: none` + `aria-disabled="true"` + `tabindex="-1"` needed. | A11y | Plan refinement to §6.4 — wrapper element gets `pointer-events-none cursor-not-allowed opacity-50 aria-disabled="true"`; link itself gets `tabindex="-1" aria-current=undefined`. Tooltip still works because Tooltip wraps the wrapper, not the link (which has no pointer events). |
| P11 | 🔹 Low | **Items inside `NavSection` also need reference stability** — same memoization concern as top-level items[]. Plan only documented top-level. | Perf docs | Guide.md adds the broader rule: ANY array passed to `<SidebarNav>` should be memoized — `items` AND each `section.items`. |
| P12 | ⚠️ High | **F1 (NEW FEATURE) — auto-expand section when active item is inside collapsed section.** When `currentPath` matches an item inside a section that the user has manually collapsed (or `defaultCollapsed: true`), the active item is invisible — user sees no active state. Common pattern (Linear, Notion, VSCode): auto-expand the containing section on mount + on `currentPath` change. Opt-out via `autoExpandActiveSection?: boolean` default `true`. | UX completeness | **L48-b (NEW)** — F1 ships in v0.1. Implementation: in `compute-active-item.ts`, also returns `containingSectionId`; if non-null and section is collapsed, dispatch `SET_SECTION_COLLAPSED { collapsed: false }` after render. Effect-gated to avoid render-time mutation. |
| P13 | ⚠️ High | **F2 (NEW FEATURE) — auto-scroll active item into view on mount + currentPath change.** Long nav lists where the active item is below the fold = user sees no active state. Common pattern. Opt-out via `autoScrollActiveIntoView?: boolean` default `true`. | UX completeness | **L48-c (NEW)** — F2 ships in v0.1. Implementation: ref on the active row's DOM element; `useEffect([activeItemId])` calls `rowEl?.scrollIntoView({ block: "nearest", behavior: motionSafe ? "smooth" : "auto" })`. Respects `prefers-reduced-motion`. |
| P14 | 🔹 Low | **Flatten passes consolidation** — `derive-visible-entries.ts` filters by permissions/hidden; `flatten-entries.ts` flattens for keyboard nav; `compute-active-item.ts` flattens for active detection. Three flatten passes. | Perf | Plan refinement — single shared flatten utility `lib/flatten-entries.ts` returns `{ flat: NavItem[], indexBySectionId: Map<string, number[]> }`. Visible derivation + active computation + keyboard handler all consume the same flat structure (memoized once per `items` change). |
| P15 | 🔹 Low | **PRODUCER-side concerns brief note absent.** When `bottom-tab-bar-01` lands later and consumes `<NavBadge>` via relative import, shadcn 4.6.0's path rewriter must preserve `../rich-sidebar/parts/nav-badge`. Memory `project_cross_procomp_imports` documents this works — but plan should call it out so it's not re-discovered. | Build docs | Plan refinement to §4 cross-procomp import section — added explicit note: "shadcn 4.6.0 path rewriter preserves the literal relative path verbatim; verified by todo-tree → todo-rich-card precedent (memory `project_cross_procomp_imports` F-S1 lock)." |
| P16 | 🔹 Low | **Skip-link target validation graceful failure** — `skipLinkTarget="#main-content"` but no such element. Browser does nothing or jumps to top. | A11y note | Documented as acceptable; no fix needed. Skip link is opt-in (Q9 = opt-in via prop); consumer accepts responsibility for valid target. |
| P17 | 🔹 Low | **`<NavUser>` config-level `onTriggerOpen` vs sidebar-level `onFooterTriggerOpen`** — both fire? Order? When NavUser is mounted via `footer` config inside sidebar, both event sources are alive. | API correctness | Plan refinement — when `<NavUser>` rendered via sidebar's `footer` config, ONLY the sidebar-level `onFooterTriggerOpen` fires; the `<NavUser>` config-level `onTriggerOpen` fires when used standalone (rare). Sidebar's mount-context-aware. Document. |

### New locks (L44–L48)

| # | Lock | Source |
|---|---|---|
| **L44** | **CSS-gated render-path branching for mobile drawer** — `hidden / lg:flex` (or other Tailwind breakpoint) for desktop chrome; `lg:hidden` for Sheet wrapper. Both DOM trees render; CSS hides one. `useMatchMedia` narrowed to JS behavior gating. No SSR flash. | P1 |
| **L45** | **No manual `React.memo` in shipped source.** React Compiler 19 owns memoization. Convention-by-precedent: todo-tree has zero `React.memo` usages despite being the largest procomp. | P4 |
| **L46** | **`<NavBadge>` outside `<SidebarNavContext>`** — defaults `position` to `"inline-end"`. Consumer override via explicit `position` prop. Behavior used by `bottom-tab-bar-01`'s NavBadge consumption. | P5 |
| **L47** | **`useSidebarNavState` always called internally** by `<SidebarNav>` (hooks rules) — but when external `state` provided, internal hook's output is discarded entirely. Document the slight-waste trade in guide. | P6 |
| **L48** | **Empty-state reason enum** = `"no-items" \| "all-filtered-by-permission" \| "all-hidden" \| "all-filtered-by-loading"`. Branching precedence: loading → first reason; items.length===0 → "no-items"; visibleEntries empty due to permission filter → "all-filtered-by-permission"; visibleEntries empty due to hidden flag → "all-hidden". | P7 |
| **L48-b** | **F1 — `autoExpandActiveSection?: boolean` default `true`.** When `currentPath` matches an item inside a collapsed section, the section auto-expands. Effect-gated; idempotent. | P12 |
| **L48-c** | **F2 — `autoScrollActiveIntoView?: boolean` default `true`.** Active row scrolls into view on mount + `currentPath` change. Respects `prefers-reduced-motion`. | P13 |

### Inline corrections (already applied above)

| # | Section | Change |
|---|---|---|
| C-5 | §6 (Mobile-drawer) | Strategy swap: JS-gated → CSS-gated. `useMatchMedia` narrowed to behavior, not visual rendering. Layout flash eliminated. |
| C-6 | §6.4 (click sequence) | `onActiveItemChange` removed from step 4 — fires via useEffect, not synchronously in click. |
| C-7 | §18.1 (memoization map) | `React.memo` on `<SidebarNavRow>` REMOVED; React Compiler 19 owns this. Trust the compiler. |
| C-8 | §20 (commit chain) | C7 + C8 merged into single commit (mobile drawer + trigger together) — eliminates chicken-and-egg validator. Chain compresses to 13 commits (numbering preserved for reference clarity; C8 row vacated). |

### Added plan-stage open questions (PQ7–PQ8)

| # | Question | Suggested answer |
|---|---|---|
| PQ7 | **`mobileBreakpoint` accept raw CSS query?** Current enum `"sm" \| "md" \| "lg" \| "xl"` is constraining. Two options: (a) keep enum + add `2xl`; (b) accept enum OR raw string (`"(max-width: 900px)"`). | **(b) Union type** — `mobileBreakpoint?: "sm" \| "md" \| "lg" \| "xl" \| "2xl" \| string`. Enum values map to Tailwind class via lookup; raw strings bypass Tailwind class composition and use inline `<style>` element for the breakpoint media query. Slight complexity, max flexibility. |
| PQ8 | **F1 + F2 default `true` or default `false`?** Auto-expand + auto-scroll are common-UX but some niche apps want full control. | **Default `true` for both.** Standard sidebar UX. Opt-out via prop. Consumers who hate it pass `false` once; consumers who love it (majority) get the right behavior without thinking. |

### Net effect on the v0.1 surface

| Metric | Before audit | After audit |
|---|---|---|
| Locks | L1–L43 (43) | L1–L48 (50; including L48-b, L48-c sub-locks) |
| Plan-stage Qs | PQ1–PQ6 | PQ1–PQ8 |
| Net-new features | 0 | 2 (F1 autoExpandActiveSection + F2 autoScrollActiveIntoView) |
| Commit chain | 14 commits | 13 commits (C7/C8 merge) |
| File count | 31 | 31 (no new files; F1+F2 implemented via existing hooks) |
| Slot count | 12 | 12 (unchanged) |
| Event count | 16 | 16 (unchanged) |
| Imperative handle methods | ~22 | ~22 (unchanged) |

**Recommendation stands:** **proceed** to user sign-off on PQ1–PQ8 picks. Then GATE 2 closes → implementation at C1.

---

## Appendix A — Cross-reference matrix (description L1–L48 ↔ plan sections)

| Lock | Source | Plan section that implements |
|---|---|---|
| L1 (slug + category) | Description | §4 file structure |
| L2 (two siblings) | Description | §19 dependencies.internal (empty for sidebar; bottom-tab consumes via relative) |
| L3 (single v0.1) | Description | All — no v0.2 deferrals scheduled |
| L4 (NavEntry discriminated union) | Description | §2.1 types |
| L5 (NavItem fields) | Description | §2.1 types |
| L6 (three-zone layout) | Description | §3 architecture |
| L7 (controlled Defenses 1+2) | Description | §5.4 |
| L8 (mobile drawer Sheet) | Description | §6 |
| L9 (active detection) | Description | §7 |
| L10 (linkComponent + NavLinkProps) | Description | §14 |
| L11 (CSS vars) | Description | §9 |
| L12 (activeVariant 5 modes) | Description | §10 |
| L13 (slot priority) | Description | §15 |
| L14 (12 slots) | Description | §15 |
| L15 (4 prefab parts) | Description | §16 |
| L16 (useSidebarNavState) | Description | §5.5 + §11 |
| L17 (SidebarNavTrigger) | Description | §12 |
| L18 (tooltip-on-collapsed F-cross-13) | Description | §13.1 |
| L19 (F-cross-13 pre-emption all 3 primitives) | Description | §13 |
| L20 (16 events object-args) | Description | §2.1 (event types in description) |
| L21 (22-method handle) | Description | §5.5 |
| L22 (permissions Set) | Description | §7 (compute-active-item gates), §17.1 (a11y) |
| L23 (storageKey) | Description | §11 |
| L24 (autoCloseMobileOnNavigate) | Description | §6.4 |
| L25 (side left/right) | Description | C13 commit |
| L26 (loading + skeleton) | Description | C13 commit |
| L27 (disabled item) | Description | C3 + §6.4 step 1 |
| L28 (click sequence) | Description | §6.4 |
| L29 (slot signatures) | Description | §15.1 |
| L30 (state wins) | Description | §5.3 |
| L31 (nav root) | Description | §17.1 |
| L32 (id default useId) | Description | §17.1 |
| L33 (NavBadge position precedence) | Description | §16.1 |
| L34 (items ref stability) | Description | §18.2 |
| L35 (avatar fallback chain) | Description | §16.2 |
| L36 (section defaultCollapsed false) | Description | §8 |
| L37 (section header keyboard) | Description | §17.2 |
| L38 (onPermissionDenied diff) | Description | §7 implementation |
| L39 (empty/loading branching) | Description | §15.1 + C12 |
| L40 (context isolation) | Description | §3 + §12 |
| **L41** (keepEmptySections=false default) | Plan PQ2 | §22 P5 |
| **L42** (prefix match longest wins) | Plan P1 | §7 |
| **L43** (state owns storageKey) | Plan P3 | §11 + §5.5 |

---

## Appendix B — File-LOC budget (sanity check on ~32-file estimate)

| File | Est LOC |
|---|---|
| `rich-sidebar.tsx` | ~200 |
| `types.ts` | ~250 |
| `index.ts` | ~30 |
| `parts/sidebar-header.tsx` | ~80 |
| `parts/sidebar-nav-list.tsx` | ~120 |
| `parts/sidebar-nav-row.tsx` | ~180 (R.memo + variant + tooltip + badge + accessory) |
| `parts/sidebar-nav-section.tsx` | ~100 |
| `parts/sidebar-nav-separator.tsx` | ~20 |
| `parts/sidebar-footer.tsx` | ~40 |
| `parts/sidebar-drawer-header.tsx` | ~60 |
| `parts/sidebar-skip-link.tsx` | ~30 |
| `parts/sidebar-loading-skeleton.tsx` | ~70 |
| `parts/sidebar-empty-state.tsx` | ~40 |
| `parts/sidebar-nav-trigger.tsx` | ~80 |
| `parts/nav-badge.tsx` | ~80 |
| `parts/nav-brand.tsx` | ~60 |
| `parts/nav-primary-action.tsx` | ~80 |
| `parts/nav-user.tsx` | ~180 (avatar + status + dropdown + menuItems) |
| `parts/default-link.tsx` | ~15 |
| `parts/tooltip-wrapper.tsx` | ~40 |
| `parts/icon.tsx` | ~30 |
| `hooks/use-sidebar-nav-state.ts` | ~150 |
| `hooks/use-sidebar-reducer.ts` | ~80 |
| `hooks/use-match-media.ts` | ~30 |
| `hooks/use-active-detection.ts` | ~60 |
| `hooks/use-storage-sync.ts` | ~70 |
| `hooks/use-id-with-default.ts` | ~15 |
| `hooks/use-latest-ref.ts` | ~10 |
| `lib/sidebar-reducer.ts` | ~120 |
| `lib/derive-visible-entries.ts` | ~50 |
| `lib/compute-active-item.ts` | ~40 |
| `lib/flatten-entries.ts` | ~50 |
| `lib/derive-css-vars.ts` | ~30 |
| `lib/derive-avatar-fallback.ts` | ~20 |
| `lib/active-variant-classes.ts` | ~50 |
| `lib/badge-format.ts` | ~20 |
| `lib/storage-schema.ts` | ~30 |
| `lib/keyboard-handler.ts` | ~70 |
| `contexts/sidebar-nav-context.tsx` | ~30 |
| `dummy-data.ts` | ~80 |
| `demo.tsx` | ~250 |
| `usage.tsx` | ~200 |
| `meta.ts` | ~60 |
| **TOTAL** | **~3,400 LOC** |

Comparable to todo-tree (~3,800 LOC across 48 files). Well within complexity envelope.
