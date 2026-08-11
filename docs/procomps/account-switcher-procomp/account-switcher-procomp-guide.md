# `account-switcher` — Consumer Guide

> Doc 3 of 3. **Pair this with**: [`description`](account-switcher-procomp-description.md) (what & why, locks L1–L14) + [`plan`](account-switcher-procomp-plan.md) (how, commit chain C1–C7).
>
> **Installed via:** `pnpm dlx shadcn@latest add @ilinxa/account-switcher` (or `@ilinxa/account-switcher-fixtures` to also pull the demo data).

This guide is the consumer-facing usage notes — what to import, how to wire it, the common recipes, and the gotchas. The description + plan are upstream-of-this; if anything in this guide contradicts them, the upstream docs win.

---

## 1. What you get

```ts
import {
  AccountSwitcher,
  // types
  type AccountSwitcherProps,
  type AccountSwitcherAriaCurrent,
  type CollapsedPopoverSide,
  type SwitcherItem,
} from "@/components/account-switcher";
```

Plus the optional fixtures bundle (`@ilinxa/account-switcher-fixtures`):

```ts
import {
  ACCOUNT_SWITCHER_DUMMY_ITEMS,
  ACCOUNT_SWITCHER_DUMMY_ACTIVE_KEY,
  ACCOUNT_SWITCHER_DUMMY_FALLBACK,
} from "@/components/account-switcher/dummy-data";
```

**No other public exports.** No hooks, no part components, no context. The sealed-folder primitive is a single composed `<AccountSwitcher>`.

---

## 2. Minimum viable usage

```tsx
"use client";

import { useState } from "react";
import { Building2, User } from "lucide-react";
import { AccountSwitcher } from "@/components/account-switcher";

export function MySwitcher() {
  const [activeKey, setActiveKey] = useState("personal");

  return (
    <AccountSwitcher
      items={[
        { key: "personal", label: "Personal", icon: User, href: "/home" },
        { key: "biz-acme", label: "Acme Corp", icon: Building2, href: "/biz/acme" },
      ]}
      activeKey={activeKey}
      onSelect={(item) => {
        setActiveKey(item.key);
        // optional: also route
        if (item.href) router.push(item.href);
      }}
    />
  );
}
```

That's the whole shape. The library renders the popover, the active row, the chevron, the aria attrs. Consumer derives `items` + `activeKey` and handles `onSelect`.

---

## 3. The mental model (consumer responsibilities)

The procomp is **deliberately minimal**. Five things are YOUR job, not the library's:

| Your job | Why |
|---|---|
| **Derive `items`** from your auth/membership store | Library can't (and shouldn't) couple to your auth shape (I-8). |
| **Derive `activeKey`** from your router/URL | Library is router-agnostic — works in Next.js, TanStack Router, plain `location`, etc. |
| **Wire routing in `onSelect`** | Library fires the event; you decide whether to `router.push` / set state / both. |
| **Pre-filter `items`** by permissions / role / plan-tier | If a user can't access a context, just don't include it in `items`. No `permission` prop. |
| **Render `footerSlot` content** | Library doesn't model "Create new" state machines. Drop in whatever widget fits. |

This is the same shape as `app-sidebar` and every other procomp in this library — render here, derive there.

---

## 4. Recipes

### 4.1 Workspace switcher with a "Create new" button

```tsx
<AccountSwitcher
  items={items}
  activeKey={activeKey}
  onSelect={onSelect}
  footerSlot={
    canCreate ? (
      <Button onClick={openCreateDialog} variant="ghost" className="w-full justify-start">
        <Plus className="mr-2 h-4 w-4" />
        Create Business
      </Button>
    ) : null
  }
/>
```

When `canCreate` is `false`, no separator + no footer renders (Q7). Equivalent to the source's `can_create_business` gate.

### 4.2 Multi-state "Create / Request access / Pending review" footer

The footer is just `ReactNode` — drop a full state-machine widget if you need one:

```tsx
<AccountSwitcher
  items={items}
  activeKey={activeKey}
  onSelect={onSelect}
  footerSlot={
    <BusinessCreationRequestButton
      state={creationRequest.state}
      onRetry={refetch}
      availableAt={creationRequest.availableAt}
    />
  }
/>
```

The library doesn't inspect children. Mount whatever widget your domain needs.

### 4.3 Avoiding the "governance shows as Personal" mis-label (I-1)

The source's bug: when `activeKey` falls outside the items array, the trigger silently falls back to `items[0]` — mislabeling governance contexts as "Personal." Fix it with `fallbackActiveItem`:

```tsx
<AccountSwitcher
  items={items}
  activeKey={derivedKey}  // might not match any item
  fallbackActiveItem={{
    key: "fallback",
    label: "Select context",
    icon: User,
  }}
  onSelect={onSelect}
/>
```

Priority: matched item → fallback → `items[0]` → disabled empty placeholder.

### 4.4 Controlled-open from a keyboard shortcut

```tsx
const [open, setOpen] = useState(false);

useHotkeys("mod+k", () => setOpen(true));

<AccountSwitcher
  items={items}
  activeKey={activeKey}
  onSelect={onSelect}
  open={open}
  onOpenChange={setOpen}
/>
```

**Don't switch modes mid-life.** If you pass `open` once, keep passing it (even if just `open={undefined}` will silently flip to uncontrolled and the library will dev-warn). Pick one mode at mount.

If you want a one-off programmatic open without committing to controlled mode, wrap the whole thing in your own ref-based imperative API — but the simpler answer is "use the controlled triplet."

### 4.5 Inside a collapsed icon-only sidebar

```tsx
<aside className={sidebar.collapsed ? "w-16" : "w-64"}>
  <AccountSwitcher
    items={items}
    activeKey={activeKey}
    onSelect={onSelect}
    isCollapsed={sidebar.collapsed}
    collapsedPopoverSide="right"  // default; flip to "left" on right-edge sidebars
  />
  {/* rest of the sidebar */}
</aside>
```

`isCollapsed={true}` renders a 40×40 icon-only trigger. The popover content still shows full labels — only positioning + width differ.

### 4.6 Slotting into `app-sidebar` v0.2.0's topSlot (canonical pairing)

The full collapse-aware composition. `app-sidebar` owns the collapsed
state; the slotted switcher receives the same flag so its trigger flips
to icon-only in lockstep with the rest of the sidebar.

```tsx
function MyAppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  // ... derive activeContextKey, items, etc., from your auth/router

  return (
    <AppSidebar
      items={navItems}
      currentPath={pathname}
      // ── controlled-collapse: lift state so the switcher can read it too
      isCollapsed={sidebarCollapsed}
      onCollapsedChange={({ collapsed }) => setSidebarCollapsed(collapsed)}
      // v0.2 features
      hrefTemplateValues={{ slug: currentBusinessSlug }}
      isOwner={membership?.is_owner ?? false}
      currentMaxMembers={membership?.account_max_members}
      // ── canonical topSlot occupant — THREAD isCollapsed through
      topSlot={
        <AccountSwitcher
          items={switcherItems}
          activeKey={activeContextKey}
          onSelect={(item) => item.href && router.push(item.href)}
          isCollapsed={sidebarCollapsed}      // ← collapse passthrough
          footerSlot={<CreateBusinessButton />}
        />
      }
    />
  );
}
```

**Why pass `isCollapsed` separately?** AccountSwitcher is a primitive — it
does NOT auto-detect being inside a collapsed sidebar (it could equally be
mounted in a topbar or settings page where collapse doesn't apply). The
parent decides; the prop flows down.

**What the user sees** in expanded mode:
- Sidebar at full width; switcher trigger renders as a full-width button
  with chevron + active label
- Popover content opens BELOW the trigger, width matches trigger via
  `--radix-popover-trigger-width`

**Same in collapsed mode** (`sidebarCollapsed === true`):
- Sidebar shrinks to icon-only (~80px); switcher trigger renders as a
  40×40 square icon-only button (no label, no chevron)
- Popover content opens to the SIDE of the trigger (Radix collision-aware
  flip); content-sized, list rows + footer slot render identically to
  expanded mode

**Mobile drawer behavior** (when `app-sidebar`'s viewport drops below
`mobileBreakpoint`): the sidebar becomes a Sheet drawer. The switcher
inside renders in EXPANDED mode within the drawer (because the drawer
opens to full width on mobile) — pass `isCollapsed={false}` OR omit the
prop entirely when inside the drawer's render path. Simplest pattern: tie
the switcher's `isCollapsed` to `sidebarCollapsed && !isMobileDrawerOpen`
if you need finer control.

Both procomps are independently installable (`@ilinxa/account-switcher`
and `@ilinxa/app-sidebar`) — zero registry dep between them. The
composition lives in your app code.

### 4.7 Re-affirming active-item clicks

By default, clicking the already-active item is a no-op (L6). If you want clicks on the active row to fire `onSelect` (e.g., re-route to refresh):

```tsx
<AccountSwitcher
  items={items}
  activeKey={activeKey}
  onSelect={onSelect}
  // To intercept active clicks, wrap with your own onClick handler at a
  // surrounding element OR add a custom button via footerSlot.
/>
```

There's intentionally no `allowActiveSelfClick` prop in v0.1. If you genuinely need this, file an issue — we'll consider it for v0.2.

---

## 5. ARIA + keyboard

- Trigger is `role="combobox"` with `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls={listboxId}` (auto-generated via `useId`), and `aria-label` composed with the active item label (e.g., `"Switch account context, current: Acme Corp"`).
- Popover content has `role="listbox"` with the same `aria-label`.
- Each row is `role="option"` with `aria-selected` on the active row and `aria-current` set per the `ariaCurrent` prop (default `"true"`).
- `data-active="true"` is also emitted on the active row regardless of `ariaCurrent` value (PQ3), so consumer CSS hooks work without ARIA noise.
- Keyboard navigation is provided by the underlying Radix Popover + native button semantics: Enter/Space activate; Tab navigates between rows; Escape closes; focus returns to trigger.

### Overriding `aria-current`

```tsx
// Switcher acts as primary navigation
<AccountSwitcher ariaCurrent="page" ... />

// Switcher is a stepper-style mode toggle
<AccountSwitcher ariaCurrent="step" ... />

// Consumer manages ARIA externally — omit the attribute entirely
<AccountSwitcher ariaCurrent={false} ... />
```

---

## 6. Performance

- Library memoizes the dedup pass + the active-item resolution, so frequent parent re-renders don't re-iterate the items array. But **`items` reference stability is your job** — pass a `useMemo`'d array, not a fresh literal on every render.
- The dev-warn passes (duplicate keys, controlled-mode transitions, missing onChange) are gated on `process.env.NODE_ENV !== "production"` and tree-shake out of prod bundles.
- No internal observers, no event listeners outside Radix Popover's own — the procomp is cheap.

---

## 7. Common gotchas

| Gotcha | Symptom | Fix |
|---|---|---|
| Duplicate `key`s | Dev-console warn; later duplicates silently dropped | Make keys unique. Dual-entry pattern (business + cms-business) needs distinct keys like `biz-acme` + `cms-biz-acme`. |
| Items array re-created per render | Excessive re-renders downstream | Wrap items derivation in `useMemo` with stable deps. |
| Controlled mode without `onChange` | Popover appears frozen — opens once and won't close | Always pair `open` with `onOpenChange`. Dev-warn fires. |
| Switching `open` between defined/undefined | Inconsistent behavior; dev-warn | Pick controlled OR uncontrolled at mount; don't toggle. |
| Passing only `defaultOpen` and expecting `onOpenChange` to drive state | `onOpenChange` fires but doesn't update internal state | Either pass `open` (controlled) or use `defaultOpen` for one-time initial state. |
| Long account names overflow the trigger | Layout breaks | None needed — `truncate min-w-0` baked into the trigger. Test with 50-char names. |
| Footer slot inside `<ul role="listbox">` | AT confusion | None — library renders footer OUTSIDE the listbox (PQ5). |
| Popover content too narrow vs trigger | Looks weird | The popover sets `width: var(--radix-popover-trigger-width)` automatically (expanded mode only). If you want a different width, wrap in a sized container. Collapsed mode is content-sized. |

---

## 8. What this primitive doesn't do

- **No search/filter** in the popover. For >10 items, compose `cmdk` `Command` instead. v0.2 candidate.
- **No groups/sections** within items. Source flat-lists. You can split into multiple switchers if you really need sections.
- **No custom row renderer.** Footer is the escape hatch for custom content; row list is rigid.
- **No async items loading.** Pre-resolve consumer-side; pass a skeleton via `fallbackActiveItem` if needed.
- **No multi-select / checkbox mode.** This is a SWITCHER, not a multi-picker.
- **No URL routing logic.** `onSelect` fires; consumer routes. (Same pattern as `app-sidebar`.)

If you need any of these and have a real use case, file an issue. v0.2 candidates are documented in the description doc § "Out of scope".

---

## 9. Versioning

Follows project convention — `0.x.x` while public API may evolve, `1.x.x` once stable. Patch-level bumps (`0.1.x → 0.1.y`) are non-breaking; minor bumps (`0.1.x → 0.2.0`) may add props but won't remove or rename existing ones; major would be reserved for breaking changes.

Current: **v0.1.0** (first ship, 2026-05-23).

---

## 10. Where to read more

| Question | File |
|---|---|
| What does the component do and why does it exist? | [`account-switcher-procomp-description.md`](account-switcher-procomp-description.md) |
| How was it implemented (file layout, commit chain, internal decisions)? | [`account-switcher-procomp-plan.md`](account-switcher-procomp-plan.md) |
| What did the GATE 3 review find? | [`reviews/2026-05-23-v0.1.0-spotcheck.md`](reviews/2026-05-23-v0.1.0-spotcheck.md) |
| How does it compose with `app-sidebar`? | [`../app-sidebar-procomp/app-sidebar-procomp-description-v0.2.0.md`](../app-sidebar-procomp/app-sidebar-procomp-description-v0.2.0.md) Appendix D |
