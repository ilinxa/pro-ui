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
  defaultAccountSwitcherLabels,
  // types
  type AccountSwitcherProps,
  type AccountSwitcherAriaCurrent,
  type AccountSwitcherLabels,
  type CollapsedPopoverSide,
  type SwitcherGroup,
  type SwitcherItem,
  type SwitcherItemRenderState,
} from "@/components/account-switcher";
```

Plus the optional fixtures bundle (`@ilinxa/account-switcher-fixtures`):

```ts
import {
  ACCOUNT_SWITCHER_DUMMY_ITEMS,
  ACCOUNT_SWITCHER_DUMMY_ACTIVE_KEY,
  ACCOUNT_SWITCHER_DUMMY_FALLBACK,
  ACCOUNT_SWITCHER_DUMMY_GROUPED_ITEMS, // + _GROUPS / _GROUPS_TR / _LABELS_TR
  ACCOUNT_SWITCHER_DUMMY_ITEMS_AR,      // + _GROUPS_AR / _LABELS_AR
} from "@/components/account-switcher/dummy-data";
```

**No other public exports** besides `defaultAccountSwitcherLabels`. No hooks, no part components, no context. The sealed-folder primitive is a single composed `<AccountSwitcher>`.

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
        <Plus className="me-2 h-4 w-4" />
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
    collapsedPopoverSide="end"  // default: toward the content (right in LTR, left in RTL); "start" for an inline-end sidebar
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
- Popover content opens BELOW the trigger, width matches the trigger on both
  shadcn backends (`--radix-popover-trigger-width`, else Base UI's `--anchor-width`)

**Same in collapsed mode** (`sidebarCollapsed === true`):
- Sidebar shrinks to icon-only (~80px); switcher trigger renders as a
  40×40 square icon-only button (no label, no chevron)
- Popover content opens to the inline-end SIDE of the trigger, toward the
  content (collision-aware flip); content-sized, list rows + footer slot
  render identically to expanded mode

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

There's intentionally no `allowActiveSelfClick` prop. If you genuinely need this, file an issue.

### 4.8 Grouped "post as" picker with avatars

```tsx
<AccountSwitcher
  items={[
    { key: "me", label: "Ayşe Yılmaz", description: "@ayse", icon: <Avatar … />, group: "personal" },
    { key: "biz-kahve", label: "Kahve Durağı", description: "Owner", icon: <Avatar … />, group: "business" },
    { key: "console", label: "Platform console", description: "Staff", icon: Globe, group: "platform" },
  ]}
  groups={[
    { id: "personal", label: "Personal" },
    { id: "business", label: "Businesses" },
    { id: "platform", label: "Platform" },
  ]}
  itemSize="lg"            // 32 px avatar box, two-line rows
  activeKey={activeKey}
  onSelect={onSelect}
/>
```

- `groups` decides the headings and their order; items without a `group` render first. A group with no items
  is not rendered. An item naming a group missing from `groups` dev-warns and renders ungrouped.
- Each group is `role="group"` named by its heading. Keyboard order always follows what is on screen.
- `description` is a second line in the row (not in the trigger).
- `renderItem={(item, { active }) => …}` replaces the row's content when the built-in layout doesn't fit. The
  option element, `aria-selected`, keyboard and selection stay the library's — don't put buttons or links inside.

### 4.9 Labels (Turkish, or any locale)

```tsx
<AccountSwitcher
  labels={{
    trigger: (current) => (current === null ? "Hesap değiştir" : `Hesap değiştir, şu anki: ${current}`),
    list: "Hesaplar",
    empty: "Hesap yok",
  }}
  …
/>
```

`trigger(current)` is the trigger's accessible name (`current` is the active label, or `null` for the empty
placeholder). Any key you leave out — or pass as `undefined` — keeps its English default
(`defaultAccountSwitcherLabels`). The old `aria-label` prop still works but is deprecated: it names the list and
builds `"<aria-label>, current: <label>"` unless `labels` sets those.

### 4.10 Right-to-left

Nothing to do in an RTL app: the switcher reads the trigger's direction after mount. The list is portaled to
`<body>`, so it carries that direction itself — an RTL section of an LTR page still gets an RTL list. In collapsed
mode the default side `"end"` opens toward the content (left in RTL). Pass `dir` when the direction can change at
runtime without a remount.

---

## 5. ARIA + keyboard

- Trigger is a `button` with `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls` (the list's id, only while
  open), and the accessible name `labels.trigger(current)` (default `"Switch account context, current: Acme Corp"`).
- The list is `role="listbox"` named by `labels.list`; groups are `role="group"` named by their heading. The popover
  around it is a dialog with the same name.
- Each row is `role="option"` with `aria-selected` (`true` on the active row) and `aria-current` set per the
  `ariaCurrent` prop (default `"true"`).
- `data-active="true"` is also emitted on the active row regardless of `ariaCurrent` value (PQ3), so consumer CSS hooks work without ARIA noise.

| Key | Where | Does |
|---|---|---|
| Enter / Space / click | trigger | open |
| ↓ / ↑ | trigger | open |
| — | on open | focus the active item (else the first) |
| ↓ / ↑ | list | next / previous item, in on-screen order (no wrap) |
| Home / End | list | first / last item |
| Enter / Space | list | select (the active item just closes — L6) → close → focus the trigger |
| Escape | list / footer | close → focus the trigger |
| Tab / Shift+Tab | list / footer | move between the list (one Tab stop) and the footer slot; focus cycles inside the open popover — Escape (or a selection) closes it |

### Migrating from 0.2.x (breaking in 0.3.0)

The trigger is no longer `role="combobox"`: a combobox keeps focus on itself, which left the footer slot
unreachable by keyboard. Tests that query `getByRole("combobox")` should use
`getByRole("button", { name: /Switch account context/ })` (or your `labels.trigger` text). Accessible names are
unchanged by default.

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
- No observers and no global listeners — the only key handlers sit on the trigger and the list.

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
| Footer slot inside the listbox | AT confusion | None — library renders footer OUTSIDE the listbox (PQ5); Tab reaches it from the list. |
| Popover content too narrow vs trigger | Looks weird | The popover matches the trigger width exactly (expanded mode only, both shadcn backends) — a narrow trigger gives a narrow list; long labels truncate. If you want a different width, wrap in a sized container. Collapsed mode is content-sized (at least 14rem). |
| Interactive content in `renderItem` | Nested-interactive a11y error; keys misfire | Keep rows non-interactive; put actions in `footerSlot`. |
| Popover flips to the other side | Near the viewport edge | Collision handling always applies and isn't configurable; constrain the trigger's container for strict positioning. |

---

## 8. What this primitive doesn't do

- **No search/filter** in the popover. For >10 items, compose `cmdk` `Command` instead. Possible future addition.
- **No type-ahead** (jumping to an item by typing its first letters). Arrow keys, Home and End only.
- **No async items loading.** Pre-resolve consumer-side; pass a skeleton via `fallbackActiveItem` if needed.
- **No multi-select / checkbox mode.** This is a SWITCHER, not a multi-picker.
- **No URL routing logic.** `onSelect` fires; consumer routes. (Same pattern as `app-sidebar`.)

If you need any of these and have a real use case, file an issue.

---

## 9. Versioning

Follows project convention — `0.x.x` while the public API may evolve, `1.x.x` once stable. While `0.x`, patch bumps
are non-breaking and a breaking change bumps the minor (it is called out in CHANGELOG and in a migration note).

Current: **v0.3.0** (2026-10-24 — keyboard, labels, groups, RTL; see §5 "Migrating from 0.2.x"). History in
`CHANGELOG.md`.

---

## 10. Where to read more

| Question | File |
|---|---|
| What does the component do and why does it exist? | [`account-switcher-procomp-description.md`](account-switcher-procomp-description.md) |
| How was it implemented (file layout, commit chain, internal decisions)? | [`account-switcher-procomp-plan.md`](account-switcher-procomp-plan.md) |
| What did the GATE 3 review find? | [`reviews/2026-05-23-v0.1.0-spotcheck.md`](reviews/2026-05-23-v0.1.0-spotcheck.md) · 0.3.0: [`reviews/2026-10-24-v0.3.0-hardening.md`](reviews/2026-10-24-v0.3.0-hardening.md) |
| What changed in 0.3.0 and why? | [`account-switcher-loop.md`](account-switcher-loop.md) |
| How does it compose with `app-sidebar`? | [`../app-sidebar-procomp/app-sidebar-procomp-description-v0.2.0.md`](../app-sidebar-procomp/app-sidebar-procomp-description-v0.2.0.md) Appendix D |
