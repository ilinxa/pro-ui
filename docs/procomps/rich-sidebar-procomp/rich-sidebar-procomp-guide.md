# `rich-sidebar` — Consumer guide

> **Stage:** 3 of 3 (Consumer-facing usage + migration notes)
> **Current version:** `0.3.0` · **Status:** alpha
> **Companion docs:** [base description](rich-sidebar-procomp-description.md) · [v0.2.0 addendum](rich-sidebar-procomp-description-v0.2.0.md) · [v0.3.0 addendum](rich-sidebar-procomp-description-v0.3.0.md)

This guide covers consumer-facing concerns: installation, common composition patterns, version migration. The base description + addenda are the canonical API reference.

---

## Installation

```bash
pnpm dlx shadcn@4.6.0 add @ilinxa/rich-sidebar
# Optional — adds the demo dummy data:
pnpm dlx shadcn@4.6.0 add @ilinxa/rich-sidebar-fixtures
```

Required peer: `lucide-react` (already a project dep in most setups).

Required shadcn primitives auto-installed by the registry: `tooltip` · `sheet` · `avatar` · `button` · `dropdown-menu`.

---

## Common composition patterns

### Minimal

```tsx
<RichSidebar
  items={[
    { id: "home", label: "Home", icon: Home, href: "/" },
    { id: "profile", label: "Profile", icon: User, href: "/profile" },
  ]}
  currentPath={pathname}
/>
```

### Mobile-aware with hamburger trigger

The `<RichSidebar>` itself is CSS-hidden below the `mobileBreakpoint` (default `lg`). To open the drawer from your app header, mount `<RichSidebarTrigger>`:

```tsx
import { RichSidebar, RichSidebarTrigger } from "@/components/rich-sidebar";

function AppShell() {
  return (
    <>
      <header>
        <RichSidebarTrigger className="lg:hidden" />
        {/* …other header bits… */}
      </header>
      <RichSidebar items={items} currentPath={pathname} />
    </>
  );
}
```

If `<RichSidebarTrigger>` is in a separate React subtree from `<RichSidebar>` (e.g., sibling of the sidebar, not descendant), pass an explicit `controls` ref:

```tsx
const sidebarRef = useRef<RichSidebarHandle>(null);

<RichSidebarTrigger controls={sidebarRef} />
<RichSidebar ref={sidebarRef} items={items} currentPath={pathname} />
```

### Custom hamburger (not the companion)

If you wire your own hamburger button, call `handle.toggleMobile("trigger")` so analytics-style reason discriminators stay aligned with the built-in companion:

```tsx
<button onClick={() => sidebarRef.current?.toggleMobile("trigger")}>
  <Menu />
</button>
```

Passing no argument (`toggleMobile()`) is valid — it defaults to `"imperative"` — but `"trigger"` is the better choice for a UI trigger.

### Render-prop slots — wrapping the default

To add an affordance per row (hover card, tooltip, badge overlay) without rebuilding the row, use the `renderItem` slot:

```tsx
<RichSidebar
  items={items}
  currentPath={pathname}
  renderItem={({ defaultRender, item }) => (
    <TooltipWrapper content={item.description} side="right">
      {defaultRender}
    </TooltipWrapper>
  )}
/>
```

**Important (v0.3.0+ contract):** return arbitrary content; the library wraps it in `<li>` for you. **Do NOT return an `<li>` yourself** — that would produce invalid nested `<li><li>` markup. Item-level `className` + `data-testid` are applied to the library's `<li>` wrapper automatically.

---

## Analytics-style reason discriminators

`onMobileOpenChange` fires with a `reason` field that distinguishes how the drawer transitioned:

| Reason | When it fires |
|---|---|
| `"trigger"` | The companion `<RichSidebarTrigger>` was clicked (or a custom trigger called `toggleMobile("trigger")`). |
| `"item-click"` | A nav item inside the drawer was clicked AND `autoCloseMobileOnNavigate` is `true`. |
| `"outside-click"` | The drawer backdrop was clicked. |
| `"escape"` | The Escape key was pressed while the drawer was open. |
| `"imperative"` | Direct `handle.openMobile()` / `closeMobile()` / `toggleMobile()` call from consumer code, OR a controlled-prop change to `isMobileOpen`. |

```tsx
<RichSidebar
  items={items}
  currentPath={pathname}
  onMobileOpenChange={({ open, reason }) => {
    analytics.track("nav-drawer-toggled", { open, reason });
  }}
/>
```

You can also pass an explicit reason when calling handle methods directly:

```tsx
sidebarRef.current?.openMobile("trigger");
sidebarRef.current?.closeMobile("escape");
sidebarRef.current?.toggleMobile("trigger");
```

---

## Storage persistence

Pass `storageKey` to opt in to localStorage persistence for `collapsed` + section-collapse state. `mobileOpen` is **never** persisted (transient UI):

```tsx
<RichSidebar
  items={items}
  currentPath={pathname}
  storageKey="my-app-sidebar"
/>
```

**Note (v0.3.0):** `onCollapsedChange` does NOT fire on the initial mount when localStorage rehydration restores a persisted `collapsed: true`. The persisted state is already reflected in the first paint — firing the callback would be confusing (the consumer didn't request the change). The callback only fires on user-initiated transitions (toggle, controlled-prop change, imperative handle call).

---

## Migration v0.2.x → v0.3.0

### 1. `renderItem` slot — DOM contract clarified (no API change)

**v0.2.x behavior (BUG):** consumers returning `defaultRender` produced `<li><li>…</li></li>` (invalid nested list items). Custom non-`<li>` returns wrapped correctly as `<li><CustomNode/></li>`.

**v0.3.0 behavior (FIXED):** the library always wraps the return value in a single `<li>`. Consumer code does NOT need to change unless it was already returning an `<li>` wrapper to compensate for the bug — in which case drop the outer wrapper:

```tsx
// v0.2.x compensating workaround (REMOVE in v0.3.0):
renderItem={({ defaultRender }) => (
  <li className="my-row-wrapper">{defaultRender}</li>  // ← BAD, drop this
)}

// v0.3.0 — just return content. Use `className`/`data-testid` on the NavItem
// itself if you need per-row attributes (those apply to the library's <li>).
renderItem={({ defaultRender }) => defaultRender}
```

### 2. `onMobileOpenChange.reason` discriminator now works (no API change)

v0.2.x stuck on `"imperative"` for every transition; v0.3.0 fires the actual reason. If your callback branches on `reason`, the branches that were previously dead code will now execute. Review your analytics dashboards for the new reason distribution.

### 3. `openMobile` / `closeMobile` / `toggleMobile` accept optional `reason?` (ADDITIVE)

Existing callers without an argument keep working (default `"imperative"`). Pass an explicit reason if your custom trigger / external close path wants to identify itself for analytics:

```tsx
// Both work:
handle.closeMobile();          // reason: "imperative"
handle.closeMobile("escape");  // reason: "escape"
```

### 4. `NavUserMenuItem.onClick` signature widening (TypeScript-BREAKING)

The callback parameter type widened from `React.MouseEvent` to `Event | React.MouseEvent` (exported as `NavUserMenuItemSelectEvent`). The runtime arg is the same — only the type contract got honest about what Radix `DropdownMenuItem.onSelect` actually passes (Event for keyboard, MouseEvent for mouse).

**If your callback only uses methods present on `Event` (i.e., `preventDefault`, `stopPropagation`, etc.) — no migration needed.**

**If your callback reads MouseEvent-only fields** (`event.clientX`, `event.button`, `event.shiftKey`, etc.), narrow at the call site:

```tsx
import { type NavUserMenuItemSelectEvent } from "@/components/rich-sidebar";

// Option A — instanceof narrow (preferred):
onClick: (event: NavUserMenuItemSelectEvent) => {
  if (event instanceof MouseEvent) {
    console.log(event.clientX);
  }
}

// Option B — cast at call site:
onClick: (event: NavUserMenuItemSelectEvent) => {
  console.log((event as React.MouseEvent).clientX);
}
```

The new named alias `NavUserMenuItemSelectEvent` is re-exported from `@/components/rich-sidebar` and is the recommended type for custom `onClick` callbacks.

### 5. Tooltip primitive shim removed (no consumer-visible change)

v0.2.x carried a dual-prop `delay` / `delayDuration` shim in `parts/tooltip-wrapper.tsx` to defend against a hypothetical shadcn migration from Radix to Base UI. v0.3.0 dropped it because the current `@/components/ui/tooltip` (audited 2026-05-23) is Radix-based. No consumer impact. If shadcn migrates to Base UI in a future version, the shim will be restored with a sharper comment citing concrete evidence (per the F-cross-13 pattern).

---

## Common gotchas

- **`items` must be a stable reference** (memoize with `useMemo`) — otherwise active-detection memoization invalidates every render. The library exposes a dev-only warning if it detects a new `items` reference every render at scale.
- **`<RichSidebarTrigger>` is a sibling-aware companion**, not a wrapper. Place it anywhere in your header; it resolves the handle via React context (when nested inside `<RichSidebar>`'s subtree) or an explicit `controls` ref (when outside).
- **The mobile drawer is CSS-gated, not JS-gated.** No SSR flash. The breakpoint defaults to `lg` — pass `mobileBreakpoint="md"` or similar to change.
- **`activeVariant`** has 5 modes (`fill` / `left-bar` / `right-bar` / `outline` / `subtle`). All are CSS-variable themed via `--ilinxa-nav-*` tokens defined in your app's `globals.css`.

---

## Related

- [`@ilinxa/account-switcher-01`](../account-switcher-01-procomp/account-switcher-01-procomp-description.md) — canonical occupant of `topSlot` for multi-context SaaS shells.
- [`@ilinxa/bottom-tab-bar-01`](../bottom-tab-bar-01-procomp/bottom-tab-bar-01-procomp-description.md) — sibling navigation procomp sharing `NavBadge` + `NavItem` shape.
