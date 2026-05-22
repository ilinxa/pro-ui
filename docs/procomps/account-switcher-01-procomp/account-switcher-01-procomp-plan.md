# `account-switcher-01` — Pro-component Plan (Stage 2)

> **Stage:** 2 of 3 · **Status:** 🟡 Drafted, awaiting sign-off
> **Slug:** `account-switcher-01` · **Category:** `navigation`
> **Companion to:** [`account-switcher-01-procomp-description.md`](account-switcher-01-procomp-description.md) (GATE 1, closed 2026-05-23)
> **Sibling-of:** `rich-sidebar` v0.2.0 (GATE 2 plan: [`../rich-sidebar-procomp/rich-sidebar-procomp-plan-v0.2.0.md`](../rich-sidebar-procomp/rich-sidebar-procomp-plan-v0.2.0.md))

This is the **plan** doc. Its job is to translate the description's locks (L1–L14) and resolved Q-Ps into a concrete implementation contract: types, files, state-machine, dependencies, commit chain. Implementation does not start until the plan is signed off.

---

## 1. Inherited inputs

From the description (GATE 1, closed 2026-05-23):

- **14 locks (L1–L14)** — see description §7.
- **8 Q-Ps resolved** — Q1/Q2/Q4/Q7/Q8 at default; Q3 → L6, Q5 → L14, Q6 → L13 (promoted during re-validation).
- **9 public props** — `items`, `activeKey`, `onSelect`, `fallbackActiveItem?`, `footerSlot?`, `isCollapsed?`, `aria-label?`, `ariaCurrent?` (L14), `open?` / `defaultOpen?` / `onOpenChange?` (L13 triplet), `className?`.
- **Migration origin:** [`docs/migrations/socialmedia-adv-nav-system/original/components/AccountSwitcher.tsx`](../../migrations/socialmedia-adv-nav-system/original/components/AccountSwitcher.tsx) — 172-LOC source; 30% direct port / 70% generalization.

---

## 2. Final API (locked from description; this is the spec)

### 2.1 Types — `types.ts`

```ts
import type { ComponentType, ReactNode } from "react";

/**
 * Single item in the switcher list.
 *
 * Dual-entry items for the same conceptual account (e.g., business-mode +
 * cms-sub-mode of the same business) use distinct keys like `biz-acme` +
 * `cms-biz-acme`. Library enforces key uniqueness at render (L3).
 */
export interface SwitcherItem {
  /** Stable unique key. */
  key: string;
  /** Trigger + row label. Library does NOT i18n; consumer pre-translates. */
  label: string;
  /**
   * Optional icon. Library accepts both ReactNode (already-rendered JSX) and
   * ComponentType (lucide-react icons, custom icon components, etc.) so
   * consumers aren't forced into a single icon library (I-4).
   */
  icon?: ReactNode | ComponentType<{ className?: string }>;
  /**
   * Optional href. The switcher fires `onSelect(item)` regardless of href —
   * consumer wires routing inside `onSelect` (router.push for SPA, anchor for
   * SSR fallbacks, or both). Library does not render `<a>` tags itself.
   */
  href?: string;
}

/**
 * Value of `aria-current` applied to the active item. Default `"true"`
 * (generic active-state semantic, correct for a switcher per L14). Consumers
 * using the switcher as primary navigation pick `"page"`; stepper-style
 * usages pick `"step"`. Pass `false` to omit the attribute.
 */
export type AccountSwitcherAriaCurrent =
  | "true"
  | "page"
  | "step"
  | "location"
  | "date"
  | "time"
  | false;

export interface AccountSwitcher01Props {
  /** Ordered list. Consumer controls ordering (L2). */
  items: ReadonlyArray<SwitcherItem>;
  /**
   * Currently-active item's key. When null OR not found in items, falls back
   * to `fallbackActiveItem` (if provided) then to `items[0]`. Empty items +
   * no fallback → disabled placeholder button (L4, Q1).
   */
  activeKey: string | null;
  /** Fires on item click. Active-item clicks are no-ops at library level (L6). */
  onSelect: (item: SwitcherItem) => void;

  /** Shown in trigger when `activeKey` doesn't resolve (L4, I-1). */
  fallbackActiveItem?: SwitcherItem;
  /** Rendered below items, separated by divider when present (L5, Q7). */
  footerSlot?: ReactNode;
  /** When true, trigger collapses to icon-only mode (L10). */
  isCollapsed?: boolean;
  /** Trigger ARIA label. Default `"Switch account context"` (L12). */
  "aria-label"?: string;
  /** Value applied to active item's `aria-current`. Default `"true"` (L14). */
  ariaCurrent?: AccountSwitcherAriaCurrent;

  /** Controlled-open state (L13). When provided, makes the popover controlled. */
  open?: boolean;
  /** Initial open state for uncontrolled mode (L13). Default `false`. */
  defaultOpen?: boolean;
  /** Fires when popover open state changes (L13). F-cross-13 typeof-guarded. */
  onOpenChange?: (next: boolean) => void;

  /** Pass-through to trigger element (L1 surface contract). */
  className?: string;
}
```

### 2.2 Type-export contract

`index.ts` re-exports:

```ts
export { AccountSwitcher01 } from "./account-switcher-01";
export type {
  SwitcherItem,
  AccountSwitcher01Props,
  AccountSwitcherAriaCurrent,
} from "./types";
```

No additional exports from v0.1. The component is a single sealed primitive; consumers either use the whole thing or compose from shadcn `Popover` directly.

---

## 3. Architecture

### 3.1 Component composition

```
<AccountSwitcher01>
└─ <Popover open=... onOpenChange=...>          ← controlled+uncontrolled via L13 triplet
   ├─ <PopoverTrigger asChild>
   │  └─ <button role="combobox">              ← shadcn Button variant="outline"
   │     ├─ ActiveIcon (if active item has icon)
   │     ├─ ActiveLabel (or fallback label)
   │     ├─ <ChevronsUpDown />                  ← hidden when isCollapsed
   │     └─ (hidden in collapsed mode)
   ├─ <PopoverContent
   │    side="bottom" | "right"                ← right when isCollapsed
   │    sideOffset=4
   │    style={{ width: "var(--radix-popover-trigger-width)" }}>
   │  ├─ <ul role="listbox">                    ← combobox+button-list per L7
   │  │  └─ <li> for each item
   │  │     └─ <button aria-current={...}>     ← active row marker
   │  │        ├─ Icon
   │  │        ├─ Label
   │  │        └─ <Check /> (active only)
   │  └─ (footer separator + footerSlot if present)
   │     ├─ <hr />                             ← conditional per Q7
   │     └─ {footerSlot}
```

### 3.2 Controlled-open state machine

Three modes:

1. **Uncontrolled** (no `open` prop, no `defaultOpen` prop) — internal `useState(false)`. `onOpenChange` fires on every change (informational).
2. **Uncontrolled with default** (`defaultOpen={true}`, no `open`) — internal `useState(defaultOpen)`. `onOpenChange` fires on every change.
3. **Controlled** (`open={...}`) — internal state ignored. Library mirrors `open` prop. Consumer must wire `onOpenChange` to update their own state, else the popover is stuck.

Implementation uses a single `useControllableState` helper inline (no external dep — too small to abstract). See §5.

### 3.3 Active-item resolution priority

```
1. items.find((i) => i.key === activeKey)
2. fallbackActiveItem  ← from props
3. items[0]
4. (none — render disabled placeholder per Q1)
```

### 3.4 Collapsed-mode rendering

`isCollapsed={true}` changes ONLY the trigger:
- Icon-only 40×40px square button
- No chevron
- No label
- `aria-label` still applied (screen-reader users hear "Switch account context")
- `aria-expanded` still toggles

Popover **list rows + footer slot render identically** in collapsed vs expanded mode (same DOM tree below the popover root). What differs is positioning + width: collapsed-mode popover opens to the side (`side="right"` with auto-flip per Q4) and is content-sized, while expanded-mode opens below the trigger with width matching the trigger via `--radix-popover-trigger-width`.

---

## 4. File structure

Sealed folder following the project convention:

```
src/registry/components/navigation/account-switcher-01/
├── account-switcher-01.tsx          ← main component (~180 LOC, single file)
├── parts/
│   ├── switcher-trigger.tsx         ← trigger element (expanded + collapsed branches)
│   ├── switcher-item-row.tsx        ← single row with Check + aria-current
│   └── empty-placeholder.tsx        ← disabled placeholder for empty-items state
├── hooks/
│   └── use-controllable-state.ts    ← controlled+uncontrolled state-machine helper
├── lib/
│   ├── resolve-active-item.ts       ← pure: activeKey + items + fallback → resolved item
│   └── enforce-unique-keys.ts       ← dev-warn + strip duplicates (L3, Q2)
├── types.ts                         ← public type exports
├── dummy-data.ts                    ← demo fixtures (REGISTRY-SHIPPED)
├── demo.tsx                         ← docs-site only (NOT shipped)
├── usage.tsx                        ← docs-site only (NOT shipped)
├── meta.ts                          ← docs-site only (NOT shipped)
└── index.ts                         ← public barrel; ships
```

**11 source files total** (8 ship via registry + 3 docs-only). Demo + usage + meta NEVER ship per project convention.

---

## 5. State model

### 5.1 `useControllableState` — `hooks/use-controllable-state.ts`

```ts
import { useCallback, useEffect, useRef, useState } from "react";

interface UseControllableStateOpts<T> {
  /** Controlled value. When provided, state is fully controlled by parent. */
  value?: T;
  /** Initial value for uncontrolled mode. */
  defaultValue: T;
  /** Fires on every state change (both modes). */
  onChange?: (next: T) => void;
  /** Component name used in dev warnings. */
  componentName: string;
  /** Prop name(s) used in dev warnings. */
  valuePropName: string;
}

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
  componentName,
  valuePropName,
}: UseControllableStateOpts<T>): readonly [T, (next: T) => void] {
  const [internal, setInternal] = useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Re-validation finding 1 (⚠️ HIGH): lock the controlled/uncontrolled
  // mode on first render. Consumers that flicker between controlled and
  // uncontrolled (`open={undefined}` → `open={false}` or vice-versa) hit
  // the classic React anti-pattern. We do NOT switch modes silently; we
  // dev-warn ONCE per transition.
  const wasControlledRef = useRef(isControlled);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (wasControlledRef.current !== isControlled) {
      // eslint-disable-next-line no-console
      console.warn(
        `[${componentName}] \`${valuePropName}\` switched from ${wasControlledRef.current ? "controlled" : "uncontrolled"} ` +
          `to ${isControlled ? "controlled" : "uncontrolled"}. Components should not switch modes; choose one at mount.`,
      );
      wasControlledRef.current = isControlled;
    }
  }, [isControlled, componentName, valuePropName]);

  // Dev-warn when controlled mode is used without an onChange handler
  // (popover would be stuck in whatever state the consumer initialized).
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (isControlled && !onChangeRef.current) {
      // eslint-disable-next-line no-console
      console.warn(
        `[${componentName}] \`${valuePropName}\` is controlled but no onChange was provided. ` +
          `State will appear frozen. Pass \`onOpenChange\` (or use \`defaultOpen\` for uncontrolled mode).`,
      );
    }
  }, [isControlled, componentName, valuePropName]);

  const current = isControlled ? (value as T) : internal;

  const set = useCallback(
    (next: T) => {
      if (!isControlled) setInternal(next);
      onChangeRef.current?.(next);
    },
    [isControlled],
  );

  return [current, set] as const;
}
```

Internal helper; not exported. Inline because the pattern is too small to justify a peer dep, and the project doesn't ship `@radix-ui/react-use-controllable-state` as a peer. Adds two dev-warns (controlled↔uncontrolled transition + controlled-without-onChange) per re-validation finding 1.

### 5.2 F-cross-13 wrapper on `onOpenChange`

Per L13, the consumer-supplied `onOpenChange` must be F-cross-13 typeof-guarded. The shadcn primitive in `src/components/ui/popover.tsx` may receive a non-boolean value from Base UI primitives at consumer-install time. The library composes a single wrapped handler:

```ts
const handleOpenChange = useCallback(
  (next: unknown) => {
    if (typeof next !== "boolean") return;          // F-cross-13 guard
    setOpen(next);                                  // updates controllable state
    // (consumer's onOpenChange already wired via useControllableState's onChange)
  },
  [setOpen],
);
```

This wraps **once**; `setOpen` from `useControllableState` already calls the consumer's `onOpenChange`. So the guard sits at the boundary with the shadcn primitive, not between library and consumer.

---

## 6. Active-item resolution — `lib/resolve-active-item.ts`

Pure function. Returns the resolved item OR a sentinel for the empty-state branch:

```ts
import type { SwitcherItem } from "../types";

export type ResolvedActive =
  | { kind: "resolved"; item: SwitcherItem }
  | { kind: "fallback"; item: SwitcherItem }
  | { kind: "first"; item: SwitcherItem }
  | { kind: "empty" };

export function resolveActiveItem(
  items: ReadonlyArray<SwitcherItem>,
  activeKey: string | null,
  fallback: SwitcherItem | undefined,
): ResolvedActive {
  if (activeKey !== null) {
    const match = items.find((i) => i.key === activeKey);
    if (match) return { kind: "resolved", item: match };
  }
  if (fallback) return { kind: "fallback", item: fallback };
  if (items.length > 0) return { kind: "first", item: items[0]! };
  return { kind: "empty" };
}
```

Discriminated union so `<SwitcherTrigger>` can render differently per branch (e.g., visually mark `kind: "fallback"` differently if the design later wants to).

---

## 7. Key uniqueness enforcement — `lib/enforce-unique-keys.ts`

Per L3 + Q2. Dev-warn + strip duplicates at render. NODE_ENV gate so production builds don't log:

```ts
import type { SwitcherItem } from "../types";

export function enforceUniqueKeys(
  items: ReadonlyArray<SwitcherItem>,
): ReadonlyArray<SwitcherItem> {
  const seen = new Set<string>();
  const deduped: SwitcherItem[] = [];
  const duplicateKeys: string[] = [];
  for (const item of items) {
    if (seen.has(item.key)) {
      duplicateKeys.push(item.key);
      continue;
    }
    seen.add(item.key);
    deduped.push(item);
  }
  if (duplicateKeys.length > 0 && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn(
      `[account-switcher-01] Duplicate item keys stripped: ${duplicateKeys.join(", ")}. ` +
        `Each item must have a unique \`key\`. Source order preserved for first occurrence.`,
    );
  }
  return deduped;
}
```

Called inside `useMemo([items])` in the main component — runs once per items reference change.

---

## 8. Footer slot + separator (Q7, L5)

```tsx
{footerSlot ? (
  <>
    <Separator className="my-1" />        {/* shadcn separator */}
    <div className="px-1 pb-1">{footerSlot}</div>
  </>
) : null}
```

`<Separator>` is the only render path that mounts when `footerSlot` is truthy. Empty/null slot → no separator (Q7 default).

---

## 9. Collapsed-mode behavior (L10, Q4)

### 9.1 Trigger render branch

```tsx
{isCollapsed ? (
  <button
    type="button"
    aria-label={ariaLabel}
    aria-expanded={open}
    role="combobox"
    className="h-10 w-10 ..."
  >
    {iconFor(activeItem)}
  </button>
) : (
  /* full-width trigger with label + chevron */
)}
```

### 9.2 Popover side

```tsx
<PopoverContent
  side={isCollapsed ? "right" : "bottom"}
  align="start"
  sideOffset={4}
  collisionPadding={8}
  style={{ width: isCollapsed ? undefined : "var(--radix-popover-trigger-width)" }}
>
```

- `isCollapsed=true` → popover opens to the right, with Radix's built-in collision-aware flip (this is Q4 default: "right-then-flip"). Width determined by content (not trigger width).
- `isCollapsed=false` → popover opens below, width matches trigger via `--radix-popover-trigger-width`.

### 9.3 collapsedPopoverSide override (plan-stage open question — see §16)

Should v0.1 expose a `collapsedPopoverSide?: "right" | "left" | "top" | "bottom"` prop? Carried over from description Q4's "GATE 2 plan may expose override prop" hedge. **Plan default:** YES, expose. One-line addition; consumer might have a right-edge sidebar where `"left"` is correct. See PQ1.

---

## 10. F-cross-13 pre-emption (R1, L11, L13)

Critical surface: **Popover.onOpenChange**. shadcn@4.6.0 may ship Base UI Popover where the callback signature is `(next: unknown)` instead of Radix's `(next: boolean)`. Pattern:

```tsx
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

// inside AccountSwitcher01:
const [open, setOpen] = useControllableState({
  value: openProp,
  defaultValue: defaultOpen ?? false,
  onChange: onOpenChange,
});

const handlePrimitiveOpenChange = useCallback(
  (next: unknown) => {
    if (typeof next !== "boolean") return;     // F-cross-13 guard
    setOpen(next);
  },
  [setOpen],
);

return (
  <Popover open={open} onOpenChange={handlePrimitiveOpenChange}>
    {/* ... */}
  </Popover>
);
```

The guard sits **at the boundary between library and shadcn primitive**, exactly once. The consumer-supplied `onOpenChange` is called by `useControllableState` only after the value has been validated as `boolean` (because `setOpen` only fires from a path that already typeof-guarded).

### 10.1 Path-b smoke (mandatory before close)

Per the established post-2026-05-21 pattern, every new procomp gets a path-b consumer-tsc smoke after first ship:

```bash
cd e:/tmp/ilinxa-smoke-consumer
pnpm dlx shadcn@4.6.0 add @ilinxa/account-switcher-01 @ilinxa/account-switcher-01-fixtures
pnpm tsc --noEmit
```

Any F-cross-13 hit (Popover, Button, Separator) fires a same-day patch loop. Expected carriers based on recent ships: **Popover.onOpenChange** is the primary surface; Separator + Button are passive, no callbacks.

---

## 11. Aria/keyboard implementation

### 11.1 Trigger keyboard handling

`<button role="combobox">` natively gets `Enter` / `Space` activation from the browser. No manual handler needed for the trigger.

`ArrowDown` while focused-and-closed should open the popover. Radix Popover handles this natively when the trigger is `asChild` of `<PopoverTrigger>`.

### 11.2 Item keyboard handling (Q8 default)

Each item is `<button type="button">`, getting native Enter + Space activation. No custom keydown handler.

### 11.3 Active item ARIA (L7, L14)

```tsx
<button
  aria-current={resolveAriaCurrent(isActive, ariaCurrent)}
  className="..."
>
```

```ts
function resolveAriaCurrent(
  isActive: boolean,
  override: AccountSwitcherAriaCurrent,
): AccountSwitcherAriaCurrent | undefined {
  if (!isActive) return undefined;            // omit attribute on non-active rows
  if (override === false) return undefined;   // explicit opt-out
  return override ?? "true";                  // default per L14
}
```

### 11.4 Focus return after close (success #3)

Radix Popover natively returns focus to the trigger on close. No additional wiring.

### 11.5 Active-item click → no-op (L6)

```tsx
const handleItemClick = (item: SwitcherItem) => {
  if (item.key === activeItem?.key) {
    setOpen(false);
    return;                                    // L6: no onSelect fire on active
  }
  onSelect(item);
  setOpen(false);                              // close after selection
};
```

---

## 12. Performance / memoization

| Computed value | Memo deps | Reason |
|---|---|---|
| `dedupedItems` | `[items]` | enforceUniqueKeys is O(N) but stable |
| `activeResolution` | `[dedupedItems, activeKey, fallbackActiveItem]` | resolve once per input change |
| `handlePrimitiveOpenChange` | `[setOpen]` | stable callback for Popover prop |
| `handleItemClick` | `[onSelect, activeItem?.key, setOpen]` | stable per dependency change |
| `popoverWidthStyle` | `[isCollapsed]` | object identity stability for `style` prop |

Items reference stability is the **consumer's responsibility** (per description success #1 + §4 sketch). Library does not deep-compare items; it trusts the reference.

---

## 13. Dependencies

### 13.1 npm peers

- `react@^19.0.0` (project baseline)
- `lucide-react@^0.475.0` (icons: `ChevronsUpDown`, `Check`)

### 13.2 Internal (shadcn primitives)

- `popover` — main primitive
- `button` — trigger variant
- `separator` — footer divider (only when footerSlot present)

### 13.3 `dependencies.internal` (meta.ts)

```ts
internal: []  // No cross-procomp deps
```

account-switcher-01 has **zero** dependency on rich-sidebar (per description §10). Sibling-of, not depends-on.

### 13.4 `meta.ts` deps section (final)

```ts
dependencies: {
  shadcn: ["popover", "button", "separator"],
  npm: [{ name: "lucide-react", version: "^0.475.0" }],
  internal: [],
}
```

`pnpm validate:meta-deps` audit grows from 48 → 49 slugs at close (account-switcher-01 added). Lint should be clean immediately.

---

## 14. Implementation order (commit chain)

7 commits, ordered for incremental verifiability. Each commit lands a runnable state — tsc + lint clean at every checkpoint.

| # | Commit | Files touched | Verification at this point |
|---|---|---|---|
| **C1** | `feat(account-switcher-01): scaffold + types` | `pnpm new:component navigation/account-switcher-01` + edit `types.ts` + initial `index.ts` barrel + `meta.ts` stub (empty deps to start, grow per §13 as imports land) | tsc clean; lint clean; new-component scaffolder ran |
| **C2** | `feat(account-switcher-01): pure lib helpers` | `lib/resolve-active-item.ts`, `lib/enforce-unique-keys.ts` | tsc clean; pure functions exercised at import time |
| **C3** | `feat(account-switcher-01): useControllableState hook` | `hooks/use-controllable-state.ts` | tsc clean; hook signature stable; no callers yet |
| **C4** | `feat(account-switcher-01): main component + parts` | `account-switcher-01.tsx`, `parts/switcher-trigger.tsx`, `parts/switcher-item-row.tsx`, `parts/empty-placeholder.tsx` | tsc clean; demo not yet wired; component compiles standalone |
| **C5** | `feat(account-switcher-01): dummy data + manifest + meta deps` | `dummy-data.ts`, edit `src/registry/manifest.ts` (3 lines printed by scaffolder), populate `meta.ts` deps to `["popover","button","separator"]` + lucide-react peer | tsc + lint + `validate:meta-deps` 49/49 clean |
| **C6** | `feat(account-switcher-01): demo + usage + dev page renders` | `demo.tsx`, `usage.tsx` | Dev server: `/components/account-switcher-01` → 200; all 3 demos (workspace-in-sidebar, topbar standalone, collapsed-mode) render |
| **C7** | `feat(account-switcher-01): registry.json entries + GATE 3 spotcheck + v0.1.0 ship` | `registry.json` (base + fixtures items), procomp guide.md, GATE 3 spotcheck review file, STATUS.md, `.claude/decisions/2026-05-23-account-switcher-01-v0.1.0-first-ship.md` | `pnpm registry:build` artifact clean; tsc + lint + meta-deps + build all clean; GATE 3 verdict ≥ Pass with follow-ups |

(Path-b smoke is a post-ship task per project pattern; F-cross-13 patch loop reserved for v0.1.1 if smoke surfaces a hit.)

---

## 15. Smoke harness plan (path-b)

After C7 push + Vercel deploy:

```bash
cd e:/tmp/ilinxa-smoke-consumer
pnpm dlx shadcn@4.6.0 add @ilinxa/account-switcher-01 @ilinxa/account-switcher-01-fixtures
pnpm tsc --noEmit
```

Expected outcomes:
- ✅ Install pulls 8 files (sealed folder source + `dummy-data.ts` fixture). No `demo.tsx` / `usage.tsx` / `meta.ts`.
- ✅ tsc clean. F-S1 lock not triggered (no cross-procomp imports).
- ⚠️ Possible F-cross-13 hit on Popover.onOpenChange — if so, same-day v0.1.1 patch.

---

## 16. Plan-stage open questions — RESOLVED at GATE 2 sign-off (2026-05-23)

All PQs below were signed off at GATE 2 close with defaults accepted. Kept here as historical record.

| # | Q | Resolution |
|---|---|---|
| **PQ1** | Expose `collapsedPopoverSide?: "right" \| "left" \| "top" \| "bottom"` prop in v0.1? Carry-over from description Q4's hedge. | ✅ **Locked YES** — adds dynamicity for right-edge-sidebar consumers; cost is one prop + one conditional in §9.2; defaults to `"right"`. Add to types.ts at C1; thread through §9.2 at C4. |
| **PQ2** | `enforceUniqueKeys` runs inside `useMemo([items])` — should we also expose a `disableKeyValidation?` prop for consumers who pre-validated upstream? | ✅ **Locked NO** — keep it always-on. The cost is O(N) per items change; only matters at very large item counts. Out of scope; can add v0.2 if real demand. |
| **PQ3** | `ariaCurrent` resolver — when consumer passes `false` AND item is active, do we still render any DOM signal? | ✅ **Locked YES** — emit `data-active="true"` on the row regardless of aria value, so consumer CSS hooks still work without ARIA noise. |
| **PQ4** | Should trigger `aria-label` compose with `activeItem.label` for richer screen-reader context? | ✅ **Locked YES** — append ", current: <label>" when an active item resolves. Pure improvement; no API change. Document in guide.md. |
| **PQ5** | Footer slot — render inside listbox `<ul>` or after it? | ✅ **Locked AFTER the listbox** — outside the `<ul>` boundary. Keyboard nav stays within the listbox; footer is a separate focus zone. Matches source. |

---

## 17. Risks (carried from description R1–R7 + plan-stage additions)

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 (desc) | F-cross-13 on Popover.onOpenChange | Medium | §10 wrapper applies the guard at the boundary; path-b smoke in §15 |
| R2 (desc) | Consumer confusion about items derivation | Low | Demo + guide.md lead with "library renders, you derive" |
| R3 (desc) | Long account names overflow | Low | `truncate min-w-0` on label spans; tested in demo with 50-char fake name |
| R4 (desc) | Async activeKey resolution flicker | Low | `fallbackActiveItem` smooths transition |
| R5 (desc) | Collapsed-mode positioning in 80px sidebar | Medium | Demo includes collapsed-in-sidebar scenario; visual QA at C6 |
| R6 (desc) | Search demand for >10 items | Low | Out of scope; guide.md recommends cmdk Command |
| R7 (desc) | Footer slot focus conflicts | Low | Documented in guide.md; PQ5 places footer outside listbox |
| **R8** (plan) | Controlled-mode consumer forgets to wire `onOpenChange` and popover gets stuck | Medium | Dev-warn in `useControllableState` when `open` is provided but `onOpenChange` is not |
| **R9** (plan) | `enforceUniqueKeys` warn fires spuriously when items array is reconstructed unchanged (React StrictMode double-render) | Low | Warn only fires when duplicates actually exist; double-render doesn't add new duplicates |
| **R10** (plan) | `<button>` inside `<li>` inside `<ul role="listbox">` confusing for AT — listbox semantics expect option rows, not buttons | Medium | Switch `<ul role="listbox">` → plain `<div>` with role="group" if AT testing flags it. Combobox+button-list per L7 is the established pattern; keep unless AT verification surfaces real issue. Plan-stage hold. |

---

## 18. Definition of "done" for THIS document (stage gate) — ✅ CLOSED 2026-05-23

GATE 2 is **closed**:

- [x] All 5 plan-stage Q-Ps (PQ1–PQ5) resolved at default per §16.
- [x] Re-validation pass surfaced 2 findings (1 ⚠️ HIGH on `useControllableState` mode-lock + 1 🔸 Medium on §3.4 wording); both applied in-place. See §19.
- [x] Final read-through complete — locks L1–L14 fully threaded through plan sections per Appendix A.
- [x] User signed off 2026-05-23 ("Accept all 10 PQ defaults — close both GATE 2s").

Implementation begins at C1. After C7 closes, GATE 3 spot-check + decision file + STATUS update + push.

---

## 19. Re-validation pass log (2026-05-23, self-audit before sign-off)

Per `feedback_re_validation_pass_catches_real_issues`, the draft of this plan was re-audited against:

1. Description locks alignment (L1–L14)
2. Dynamicity-primacy bar
3. Performance / memoization correctness
4. F-cross-13 surface coverage
5. Plan completeness for the commit chain

**2 findings surfaced; both applied in-place before close.**

### Finding 1 (⚠️ HIGH) — §5.1 useControllableState mode-lock

- **Issue:** Draft hook re-evaluated `isControlled = value !== undefined` per render. Consumer's `open` prop flickering between `undefined` and `boolean` would silently switch modes — classic React controlled/uncontrolled anti-pattern bug, easy to introduce, hard to debug.
- **Fix applied:** Added `wasControlledRef` + `useEffect` that dev-warns on mode transitions (development only — tree-shaken in prod). Plus a second dev-warn when `value` is provided without `onChange` (popover would appear frozen). See §5.1 final code.

### Finding 2 (🔸 Medium) — §3.4 wording precision

- **Issue:** Draft said "Popover content rendering is identical in collapsed vs expanded mode" — misleading, since positioning and width strategies DO differ.
- **Fix applied:** Clarified to "list rows + footer slot render identically; only positioning + width strategy differ." Trivial wording fix; no impl change.

### Validated unchanged

- §6 active-item resolution (4-level priority) — matches L4
- §10 F-cross-13 wrapper boundary placement — correctly at shadcn-primitive boundary, not library-to-consumer
- §11 aria/keyboard — leverages native button + Radix Popover semantics; no custom handlers needed
- §13 deps — separator stays in deps list even when conditionally rendered (correct — runtime conditional rendering still requires the import declaration)
- §14 commit chain — C5's meta-deps timing aligns with manifest visibility
- §16 PQ1–PQ5 — defaults sensible; no challenges

---

## Appendix A — Cross-reference matrix (description L1–L14 ↔ plan sections)

| Lock | Description ref | Plan ref | Implementation file |
|---|---|---|---|
| **L1** | SwitcherItem shape | §2.1 | `types.ts` |
| **L2** | Single items, consumer ordering | §2.1 (items prop) | main component (consumer passes ordered array; no library sort) |
| **L3** | Dual-entry via distinct keys + uniqueness enforcement | §7, §2.1 (key field) | `lib/enforce-unique-keys.ts` |
| **L4** | `fallbackActiveItem` for unresolved active | §6 | `lib/resolve-active-item.ts` |
| **L5** | `footerSlot` arbitrary content | §8 | main component |
| **L6** | Library no-ops on active clicks | §11.5 | main component handler |
| **L7** | Aria pattern: combobox + button-list | §3.1, §11 | `account-switcher-01.tsx` |
| **L8** | shadcn Popover primitive | §3.1, §13.2 | direct import |
| **L9** | Width-matches-trigger via CSS var | §9.2 | `PopoverContent` style |
| **L10** | Collapsed-mode rendering | §3.4, §9 | `parts/switcher-trigger.tsx` |
| **L11** | F-cross-13 pre-emption | §10 | main component wrapper |
| **L12** | Generic naming + overridable aria-label | §2.1 (aria-label default), PQ4 | main component default + override |
| **L13** | Controlled-open triplet from v0.1 | §3.2, §5.1, §10 | `hooks/use-controllable-state.ts` + main component |
| **L14** | `ariaCurrent?` prop with `"true"` default | §2.1, §11.3 | `parts/switcher-item-row.tsx` resolver |

---

## Appendix B — File-LOC budget (sanity check on the 11-file estimate)

| File | LOC budget | Reasoning |
|---|---|---|
| `account-switcher-01.tsx` | ~180 | main composition; absorbs Popover wiring + state + handlers |
| `parts/switcher-trigger.tsx` | ~80 | two branches (expanded vs collapsed) |
| `parts/switcher-item-row.tsx` | ~50 | row with icon + label + check + aria |
| `parts/empty-placeholder.tsx` | ~25 | disabled placeholder for empty-items |
| `hooks/use-controllable-state.ts` | ~30 | minimal helper |
| `lib/resolve-active-item.ts` | ~25 | discriminated union resolver |
| `lib/enforce-unique-keys.ts` | ~25 | dedup + dev-warn |
| `types.ts` | ~80 | exported types + JSDoc |
| `dummy-data.ts` | ~50 | 5-6 sample items + 1 fallback |
| `demo.tsx` | ~120 | 3 demo scenarios |
| `usage.tsx` | ~100 | 4 usage patterns documented |
| `index.ts` | ~10 | barrel |
| `meta.ts` | ~60 | structured meta + JSDoc |

Total: ~835 LOC. ~635 ships via registry (excludes demo + usage + meta).

---

## Appendix C — Source code reference

For traceability, the source's behaviors mapped to plan sections:

| Source behavior | Source file:line (approx) | Plan section |
|---|---|---|
| Popover with combobox role | `AccountSwitcher.tsx` L40-L80 | §3.1, §11 |
| Active item Check icon | `AccountSwitcher.tsx` L120-L130 | §11.3 |
| Width-matches-trigger | `AccountSwitcher.tsx` L90-L95 | §9.2 |
| Items list rendering | `AccountSwitcher.tsx` L100-L150 | §3.1 |
| Footer create-business button | `AccountSwitcher.tsx` L155-L172 | §8 (replaced with arbitrary slot) |
| `useUser` / `useMembershipStore` imports | `AccountSwitcher.tsx` L1-L20 | Removed — library imports zero auth code (I-8) |
| Combobox aria pattern | `AccountSwitcher.tsx` L40-L80 | §11 |
