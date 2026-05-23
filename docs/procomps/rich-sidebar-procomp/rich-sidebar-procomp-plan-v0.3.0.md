# `rich-sidebar` v0.3.0 — Plan Addendum (Stage 2)

> **Stage:** 2 of 3 · **Status:** ✅ Signed off 2026-05-23 — C1 in progress
> **Slug:** `rich-sidebar` (unchanged) · **Target version:** `0.3.0`
> **Companion to:** [`rich-sidebar-procomp-description-v0.3.0.md`](rich-sidebar-procomp-description-v0.3.0.md) (GATE 1 v0.3.0, closed 2026-05-23)
> **Base plan:** [`rich-sidebar-procomp-plan.md`](rich-sidebar-procomp-plan.md) (v0.1 — still authoritative for everything NOT touched here)
> **Prior addendum:** [`rich-sidebar-procomp-plan-v0.2.0.md`](rich-sidebar-procomp-plan-v0.2.0.md) (v0.2.0 plan)

This is the **plan addendum** for v0.3.0. It documents only the **delta** v0.2.4 → v0.3.0. The base plan + the v0.2.0 addendum still define the architecture, file structure, state model, mobile-drawer strategy, CSS-variable theme surface, F-cross-13 pre-emption pattern, three-defenses controlled-mode wiring, and every internal subsystem. This file extends only the surfaces that change. When v0.3.0 ships, this addendum is FOLDED INTO the base plan and removed.

---

## 1. Inherited inputs (delta)

From the v0.3.0 description addendum (GATE 1 closed 2026-05-23):

- **4 new locks (L53–L56)** — on top of v0.1's L1–L40 and v0.2's L41–L52.
- **4 Q-Ps resolved** — Q23 (export named alias — overridden YES), Q24 (TooltipWrapper-wrapped demo — default), Q25 (custom-trigger recommend `"trigger"` — default), Q26 (cross-grep + fix — overridden YES; grep returned 1 hit total so trivial).
- **11 review findings to close** — 2 ⚠️ High, 3 🔸 Medium, 6 🔹 Low. Originally surfaced by the v0.2.4 A- code review; revalidated against current source 2026-05-23.
- **1 BREAKING TypeScript change** — `NavUserMenuItem.onClick` widening (F10); migration note in guide.md.
- **1 new public type export** — `NavUserMenuItemSelectEvent` (Q23 override).

**1 BREAKING change at the TypeScript level; zero behavior breakage at runtime.**

---

## 2. Final API delta (locked from description addendum)

### 2.1 Type changes — `types.ts`

**Widen (BREAKING) `NavUserMenuItem.onClick`** (F10 + L56):

```ts
export interface NavUserMenuItem {
  // ... v0.1/v0.2 fields unchanged ...
  /**
   * v0.3.0 — widened from `React.MouseEvent` to `Event | React.MouseEvent`
   * to honestly type the event arg passed by Radix's `DropdownMenuItem.onSelect`
   * (which may be a plain `Event` or `MouseEvent` depending on input modality
   * and primitive vendor). v0.2.x consumers reading MouseEvent-only fields
   * narrow with `if (event instanceof MouseEvent) { … }` or cast.
   */
  onClick?: (event: NavUserMenuItemSelectEvent) => void;
}

/**
 * v0.3.0 — Event union for `NavUserMenuItem.onClick` callbacks. The underlying
 * primitive (`DropdownMenuItem.onSelect`) passes a plain `Event` for keyboard
 * activations and a `React.MouseEvent` for clicks. Use this alias to type
 * custom `onClick` handlers without spelling out the union.
 */
export type NavUserMenuItemSelectEvent = Event | React.MouseEvent;
```

**Extend (ADDITIVE) `RichSidebarHandle` mobile methods** (F2 + L54):

```ts
export interface RichSidebarHandle {
  // ... other methods unchanged ...

  /** Open the mobile drawer. v0.3.0 — optional `reason` for `mobileOpenChange` discriminator. Default `"imperative"`. */
  openMobile(reason?: RichSidebarMobileOpenReason): void;

  /** Close the mobile drawer. v0.3.0 — optional `reason`. Default `"imperative"`. */
  closeMobile(reason?: RichSidebarMobileOpenReason): void;

  /** Toggle the mobile drawer. v0.3.0 — optional `reason`. Default `"imperative"`. */
  toggleMobile(reason?: RichSidebarMobileOpenReason): void;
}
```

**Annotate (no signature change) `onCollapsedChange` + `collapseAllSections`** (F6 + F9 → C6):

JSDoc additions documenting two existing-but-undocumented behaviors:
- `onCollapsedChange`: does NOT fire on storage rehydration mount.
- `collapseAllSections`: operates on currently-visible sections only.

### 2.2 Reducer state — `lib/sidebar-reducer.ts`

**Add (internal, never exported) `lastMobileOpenReason`** (F2 + L53):

```ts
export interface SidebarReducerState {
  collapsed: boolean;
  mobileOpen: boolean;
  collapsedSectionIds: ReadonlySet<string>;
  focusedItemId: string | null;
  lastSyncedSnapshot: { collapsed: boolean; mobileOpen: boolean };
  /**
   * v0.3.0 — Reason of the most-recent mobile-drawer transition. Drained by
   * the Defense-1 microtask effect in `useSidebarReducer`. OVERWRITES on each
   * transition (no explicit clear). `EXTERNAL_SYNC` does NOT touch this field
   * (mobileOpen is never persisted; controlled-prop changes default to
   * "imperative" reason since the consumer originated them outside the
   * carrier sites that know specific reasons).
   */
  lastMobileOpenReason: RichSidebarMobileOpenReason | null;
}
```

**Drop the unused `allSectionIds` payload from `EXPAND_ALL_SECTIONS` action discriminant** (F8 → C5):

```ts
// Before (v0.2.x):
| { type: "EXPAND_ALL_SECTIONS"; allSectionIds: ReadonlyArray<string> }
// After (v0.3.0):
| { type: "EXPAND_ALL_SECTIONS" }
```

The reducer always cleared the set regardless of payload — the field was dead weight. Action is internal (not exported); removal is safe.

### 2.3 New shared factory — `lib/build-handle.ts`

```ts
export function buildHandle(deps: {
  state: SidebarReducerState;
  dispatch: React.Dispatch<SidebarReducerAction>;
  items: ReadonlyArray<NavEntry>;
  visible: VisibleEntriesResult;
  active: ActiveItemResult;
}): RichSidebarHandle
```

Pure synchronous factory. No React hooks inside. Called from inside `useMemo` at both consumption sites. Not exported from `index.ts` (internal-only). Folds in C5's `collapseAllSections` visible-source change and the new `closeMobile(reason)` / `openMobile(reason)` / `toggleMobile(reason)` signatures from C2.

### 2.4 Re-exports — `index.ts`

**Add one new type re-export** (L56):

```ts
export type {
  // ... existing exports unchanged ...
  NavUserMenuItemSelectEvent, // v0.3.0
} from "./types";
```

No new component / function exports. `buildHandle` stays internal.

---

## 3. Architecture — what changes per commit

The v0.3.0 cycle is **fixes + tightening, not new features**. The architecture established in v0.1/v0.2 stands:

- Sealed-folder distribution model — unchanged.
- Three-defenses controlled-mode pattern — extended by C2 with `lastMobileOpenReason` state field (Defense-1 effect reads it for the callback).
- F-cross-13 defensive callback widening — extended by C2's `<SheetContent onPointerDownOutside>` + `<SheetContent onEscapeKeyDown>` wiring (Radix-typed today, defensive fallback through `onOpenChange`).
- Imperative-handle factory pattern — formalized by C5 into a shared `lib/build-handle.ts` (was duplicated inline).
- `<ul>`-`<li>` DOM invariants — re-anchored by C1 with `<li>` ownership moved into `SidebarNavList` (single owner; both default and slot paths consistent).

No architectural pattern is invented. No new dependency, no new state machine, no new sealed-folder convention.

---

## 4. Commit chain (C1 → C7, locked)

### C1 — `<li>` ownership inversion (F1, L55)

**Files touched:**
- `src/registry/components/navigation/rich-sidebar/parts/sidebar-nav-row.tsx`
- `src/registry/components/navigation/rich-sidebar/parts/sidebar-nav-list.tsx`

**`sidebar-nav-row.tsx` changes:**
1. Drop the outer `<li className={cn("list-none", item.className)} data-testid={item["data-testid"]}>` wrapper at the current line 174-175.
2. Return `<TooltipWrapper content={tooltipContent} side="right" disabled={!isCollapsed}>{linkEl}</TooltipWrapper>` as the new top-level return. `TooltipWrapper` stays inside `SidebarNavRow` (it's a presentational concern of the row, not the list) — the `<li>` simply wraps whatever `SidebarNavRow` returns when the caller (SidebarNavList) wraps it.

**`sidebar-nav-list.tsx` changes:**
1. In `renderRow` default path: wrap `<SidebarNavRow .../>` in `<li className={cn("list-none", item.className)} data-testid={item["data-testid"]} key={item.id}>...</li>`.
2. In `renderRow` slot path (when `renderItem` provided): wrap the slot's return in the SAME `<li>` wrapper. The existing `<li key={item.id} className="list-none">` at the current line 154 already does this; just preserve `item.className` + `data-testid` to maintain parity with the default path.
3. Update the inline comment block at lines 127-130 to read: `// Renders a single NavItem row. Always wraps the inner content in <li>. // Both the default <SidebarNavRow /> path AND the renderItem slot path // are wrapped — consumer's renderItem return value is the <li> body, not // the <li> itself. The <li> carries item.className + data-testid.`

**Sealed-folder internal refactor. No public-API change.** `SidebarNavRow` is not exported from `index.ts`.

**Tests in C1:** N/A (no unit-test infra). Visual verification at C7 step 8.

### C2 — Reason discriminator plumbing (F2, L53 + L54)

**Files touched:**
- `src/registry/components/navigation/rich-sidebar/lib/sidebar-reducer.ts`
- `src/registry/components/navigation/rich-sidebar/hooks/use-sidebar-reducer.ts`
- `src/registry/components/navigation/rich-sidebar/types.ts`
- `src/registry/components/navigation/rich-sidebar/rich-sidebar.tsx`
- `src/registry/components/navigation/rich-sidebar/parts/sidebar-nav-list.tsx`
- `src/registry/components/navigation/rich-sidebar/parts/sidebar-nav-trigger.tsx`

**`lib/sidebar-reducer.ts` changes:**
1. Add `lastMobileOpenReason: RichSidebarMobileOpenReason | null` to `SidebarReducerState` interface.
2. `createInitialState` initializes it to `null`.
3. `SET_MOBILE_OPEN` case: when transitioning, write `lastMobileOpenReason: action.reason`. When no-op (existing guard `state.mobileOpen === action.open`), return state unchanged (so the field keeps its prior value — load-bearing for the "no double-fire on re-entry" guarantee at L53).
4. `TOGGLE_MOBILE` case: **widen the action discriminant** to accept optional `reason?: RichSidebarMobileOpenReason`. When transitioning, write `lastMobileOpenReason: action.reason ?? "imperative"`. (Note: TOGGLE_MOBILE is retained — NOT collapsed into SET_MOBILE_OPEN — because `handle.toggleMobile()` needs to read FRESH `state.mobileOpen` INSIDE the reducer to handle rapid same-tick double-clicks correctly. Translating toggle to SET at the handle level would let the closure-captured `state.mobileOpen` go stale across rapid dispatches.)
5. `EXTERNAL_SYNC` case: **when the transition actually changes `mobileOpen`** (per the existing Defense-2 short-circuit check), reset `lastMobileOpenReason: "imperative"`. This prevents a stale `"item-click"` / `"outside-click"` / `"escape"` from a prior in-app transition leaking into the callback for the next prop-driven transition. When EXTERNAL_SYNC is a no-op (Defense-2 short-circuit), leave the field alone. Storage rehydration never causes a mobileOpen transition (mobileOpen not persisted), so this code path is exercised only by controlled-prop changes.
6. Other cases (collapse, sections, focus): leave the field alone.
7. The exhaustive `never` check at the default branch keeps working — no new actions added (TOGGLE_MOBILE's discriminant widening is backwards-compatible; existing internal dispatch sites without `reason` field still compile).

**`hooks/use-sidebar-reducer.ts` changes:**
1. Defense-1 effect at lines 79-105: when firing the `onMobileOpenChange` callback, read `reason: state.lastMobileOpenReason ?? "imperative"` (replacing the hardcoded `reason: "imperative"`).
2. Delete the stale comment block at lines 94-96 ("Reason embedded in the action; the effect can't recover it. Workaround: …").

**`types.ts` changes:**
1. Widen `RichSidebarHandle.openMobile` / `closeMobile` / `toggleMobile` with optional `reason?: RichSidebarMobileOpenReason` parameter (default `"imperative"`).

**`rich-sidebar.tsx` changes:**
1. Imperative handle factory (line 238-302) — `openMobile` / `closeMobile` / `toggleMobile` accept `reason?` and pass it through to `dispatch({ type: "SET_MOBILE_OPEN", open: …, reason: reason ?? "imperative" })`.
2. `closeMobile` callback (line 404-407) — accept `reason` parameter, default `"imperative"`.
3. `<SheetContent>` at line 791-810 — add `onPointerDownOutside={() => finalHandle.closeMobile("outside-click")}` and `onEscapeKeyDown={() => finalHandle.closeMobile("escape")}`.
4. The existing `onOpenChange` at line 785-789 stays — it remains the fallback for code paths the dedicated handlers don't catch (e.g., Sheet.onOpenChange(false) called by `<SheetClose>` or external animation events). Per L53 + the reducer no-op guard, the fallback's re-entry returns the same state object → Defense-1 effect doesn't fire → no double-callback.

**`parts/sidebar-nav-list.tsx` changes:**
1. Widen `onCloseMobile: () => void` prop to `onCloseMobile: (reason: RichSidebarMobileOpenReason) => void`.
2. The `queueMicrotask` block at lines 114-119 calls `onCloseMobile("item-click")`.

**`parts/sidebar-nav-trigger.tsx` changes:**
1. The trigger button's onClick handler — if it currently calls `handle.toggleMobile()`, change to `handle.toggleMobile("trigger")`.

**Defense-2 unchanged**, Defense-3 unchanged (N/A for discrete booleans per the established sub-rule).

**Edge case to test in browser**: a consumer's external `onMobileOpenChange` callback receives `reason: "item-click"` only ONCE per drawer close (proves the no-op guard works as L53 describes).

### C3 — Drop CSS.escape fallback + data-stage leak (F3, F4)

**Files touched:**
- `src/registry/components/navigation/rich-sidebar/rich-sidebar.tsx`

**Changes:**
1. Lines 359-362: replace the entire ternary
   ```ts
   const escaped =
     typeof window !== "undefined" && typeof window.CSS?.escape === "function"
       ? window.CSS.escape(focusedItemId)
       : focusedItemId.replace(/(["\\])/g, "\\$1");
   ```
   with
   ```ts
   const escaped = window.CSS.escape(focusedItemId);
   ```
   The surrounding `typeof document === "undefined"` SSR guard at line 356 already gates this code to browser-only contexts.
2. Line 740: delete the `data-stage="C11-keyboard-skiplink-permissions"` attribute.

**Cross-codebase grep verification (Q26 override):** The GATE 2 grep at 2026-05-23 returned **ONE hit total** across `src/` (the line 740 above) — so the cross-cutting "fix everywhere" expansion is effectively trivial. C3's commit message includes a re-run of `grep -rn 'data-stage' src/` as a sanity check; if any additional hits surface they get fixed in the same commit. No `sweep-tracker.md` entry needed because there is no cross-cutting class.

### C4 — `NavUserMenuItem.onClick` widening + named alias + tooltip shim audit (F10, F11, L56)

**Files touched:**
- `src/registry/components/navigation/rich-sidebar/types.ts`
- `src/registry/components/navigation/rich-sidebar/index.ts`
- `src/registry/components/navigation/rich-sidebar/parts/nav-user.tsx`
- `src/registry/components/navigation/rich-sidebar/parts/tooltip-wrapper.tsx` (audit + maybe-edit)

**`types.ts` changes:**
1. Add `export type NavUserMenuItemSelectEvent = Event | React.MouseEvent;` (L56).
2. Change `NavUserMenuItem.onClick?: (event: React.MouseEvent) => void;` → `onClick?: (event: NavUserMenuItemSelectEvent) => void;`.

**`index.ts` changes:**
1. Add `NavUserMenuItemSelectEvent` to the type re-export block.

**`parts/nav-user.tsx` changes:**
1. Lines 131-135: drop the `as React.MouseEvent` cast. Pass `eventArg` through directly:
   ```ts
   onSelect={(eventArg: NavUserMenuItemSelectEvent) => {
     item.onClick?.(eventArg);
   }}
   ```

**`parts/tooltip-wrapper.tsx` audit — decision criteria:**
1. Read `e:/2026/ilinxaDOC/ilinxa-ui-pro/src/components/ui/tooltip.tsx`.
2. Look at the IMPORT statement at the top of the file:
   - If `import * as TooltipPrimitive from "@radix-ui/react-tooltip"` (or equivalent Radix import path): **RADIX confirmed.** Drop the `@ts-expect-error delay={delay}` line at the current 40-44; pass only `delayDuration={delay}`. Commit message records: "Audited `@/components/ui/tooltip` — imports from `@radix-ui/react-tooltip`; `delay` shim no longer needed for our installed shadcn version."
   - If `import { Tooltip } from "@base-ui-components/react/tooltip"` (or equivalent Base UI import path): **BASE UI confirmed.** Keep both prop names with a sharpened comment citing the file path + the divergent prop names. Drop the bare `@ts-expect-error` — replace with explicit `// @ts-expect-error — Base UI uses 'delay'; passing both for forward-compat with Radix-installed consumers per F-cross-13.`
   - If BOTH primitives wrapped (rare unified-shape pattern): KEEP both with comment citing the dual-wrap.
3. Either way, no `@ts-expect-error` left dangling without evidenced reason citing the actual import path. Commit message records the audit result.

### C5 — Extract `buildHandle()` helper + fold polish items (F5, F8, F9)

**Files touched:**
- `src/registry/components/navigation/rich-sidebar/lib/build-handle.ts` (NEW)
- `src/registry/components/navigation/rich-sidebar/rich-sidebar.tsx`
- `src/registry/components/navigation/rich-sidebar/hooks/use-sidebar-nav-state.ts`
- `src/registry/components/navigation/rich-sidebar/lib/sidebar-reducer.ts` (action discriminant change)

**`lib/build-handle.ts` (NEW):**
```ts
import type { ActiveItemResult } from "./compute-active-item";
import type { VisibleEntriesResult } from "./derive-visible-entries";
import type { SidebarReducerAction, SidebarReducerState } from "./sidebar-reducer";
import type { NavEntry, NavItem, RichSidebarHandle, RichSidebarStateValue } from "../types";

export function buildHandle(deps: {
  state: SidebarReducerState;
  dispatch: React.Dispatch<SidebarReducerAction>;
  items: ReadonlyArray<NavEntry>;
  visible: VisibleEntriesResult;
  active: ActiveItemResult;
}): RichSidebarHandle {
  const { state, dispatch, items, visible, active } = deps;

  // Lookup table for getItemById — uses visible.entries so consumers don't
  // see filtered items.
  const itemsLookup = new Map<string, NavItem>();
  for (const entry of visible.entries) {
    if (entry.kind === "section") {
      for (const child of entry.items) itemsLookup.set(child.id, child);
    } else if (entry.kind !== "separator") {
      itemsLookup.set(entry.id, entry);
    }
  }

  const methods: Omit<RichSidebarHandle, "getState"> = {
    // Collapse
    toggleCollapse: () => dispatch({ type: "TOGGLE_COLLAPSED" }),
    setCollapsed: (next) => dispatch({ type: "SET_COLLAPSED", collapsed: next }),
    isCollapsed: () => state.collapsed,

    // Mobile drawer — v0.3.0 reason? plumbing (L54)
    openMobile: (reason) =>
      dispatch({ type: "SET_MOBILE_OPEN", open: true, reason: reason ?? "imperative" }),
    closeMobile: (reason) =>
      dispatch({ type: "SET_MOBILE_OPEN", open: false, reason: reason ?? "imperative" }),
    toggleMobile: (reason) =>
      // Dispatch TOGGLE_MOBILE (NOT a translated SET) so the reducer reads
      // fresh state.mobileOpen — handles rapid same-tick double-clicks
      // correctly (a translated SET would use closure-captured stale state
      // and the reducer's no-op guard would drop the second dispatch).
      dispatch({ type: "TOGGLE_MOBILE", reason }),
    isMobileOpen: () => state.mobileOpen,

    // Section state — v0.3.0 polish (F8 folded)
    toggleSection: (sectionId) => dispatch({ type: "TOGGLE_SECTION", sectionId }),
    expandSection: (sectionId) =>
      dispatch({ type: "SET_SECTION_COLLAPSED", sectionId, collapsed: false }),
    collapseSection: (sectionId) =>
      dispatch({ type: "SET_SECTION_COLLAPSED", sectionId, collapsed: true }),
    expandAllSections: () =>
      dispatch({ type: "EXPAND_ALL_SECTIONS" }), // F8: no allSectionIds field
    collapseAllSections: () => {
      // F9: source from visible.entries (filtered) not raw items
      const ids = visible.entries
        .filter((e) => "kind" in e && e.kind === "section")
        .map((e) => (e as { id: string }).id);
      dispatch({ type: "COLLAPSE_ALL_SECTIONS", allSectionIds: ids });
    },
    isSectionCollapsed: (id) => state.collapsedSectionIds.has(id),

    // Items + active
    getItems: () => items,
    getItemById: (id) => itemsLookup.get(id),
    getActiveItem: () => active.item ?? undefined,

    // Focus
    focusItem: (itemId) => dispatch({ type: "FOCUS_ITEM", itemId }),
    focusFirstItem: () => dispatch({ type: "FOCUS_ITEM", itemId: null }),
    focusLastItem: () => dispatch({ type: "FOCUS_ITEM", itemId: null }),
  };

  const handleObj: RichSidebarHandle = {
    ...methods,
    getState: (): RichSidebarStateValue => ({
      ...handleObj,
      collapsed: state.collapsed,
      mobileOpen: state.mobileOpen,
      collapsedSectionIds: state.collapsedSectionIds,
      activeItemId: active.item?.id ?? null,
      activeItem: active.item,
      visibleEntries: visible.entries,
    }),
  };
  return handleObj;
}
```

**`rich-sidebar.tsx` changes:**
1. Delete the inline imperative-handle builder at lines 238-302.
2. Replace with:
   ```ts
   const handle = useMemo<RichSidebarHandle>(
     () => buildHandle({ state, dispatch, items, visible, active }),
     [state, dispatch, items, visible, active],
   );
   ```

**`hooks/use-sidebar-nav-state.ts` changes:**
1. Delete the inline imperative-handle builder at lines 84-144.
2. Replace with the same `useMemo` call as above.
3. The outer hook's final `useMemo` returning `RichSidebarStateValue` stays (it carries the state fields onto the handle).

**`lib/sidebar-reducer.ts` changes:**
1. Drop `allSectionIds: ReadonlyArray<string>` from `EXPAND_ALL_SECTIONS` discriminant.

**~50 LOC eliminated.** `buildHandle` not exported from `index.ts`.

### C6 — `useCallback` wraps + JSDoc tightening + renderItem demo (F6, F7, Q24)

**Files touched:**
- `src/registry/components/navigation/rich-sidebar/rich-sidebar.tsx`
- `src/registry/components/navigation/rich-sidebar/types.ts`
- `src/registry/components/navigation/rich-sidebar/demo.tsx`

**`rich-sidebar.tsx` changes:**
1. Wrap `renderInnerChrome` (currently inline arrow at line 607) with `useCallback` over its captured deps (`finalCollapsed`, `topSlot`, `mergeAccessoryIntoTopSlot`, `showMobileHeader`, `drawerHeaderSlot`, `headerSlot`, `resolvedBrand`, `resolvedPrimaryAction`, `resolvedFooter`, `desktopAccessory`, `renderListBody`).
2. Wrap `renderListBody` (currently inline arrow at line 549) with `useCallback` over its captured deps (`finalCollapsed`, `loading`, `renderLoading`, `finalVisibleEntries`, `items.length`, `visible.filteredByPermission.length`, `visible.hiddenItemCount`, `renderEmptyState`, plus all `SidebarNavList` props).
3. Alternative implementation (acceptable if more readable): extract both as dedicated small inner components. Functional equivalence either way.

**`types.ts` changes:**
1. Add JSDoc to `onCollapsedChange`:
   ```ts
   /**
    * Fired when the collapsed state changes.
    *
    * Note: does NOT fire during localStorage rehydration on mount — consumer's
    * persisted collapsed state is already reflected in the initial render via
    * the storage-read effect. The callback only fires on user-initiated
    * transitions (toggle, controlled-prop change, or imperative handle call).
    */
   onCollapsedChange?: (args: RichSidebarEventArgs["collapsedChange"]) => void;
   ```
2. Add JSDoc to `collapseAllSections` in `RichSidebarHandle`:
   ```ts
   /**
    * Collapse every currently-VISIBLE section (after permission / ownerOnly /
    * minMembers filtering). Sections hidden by gates are not touched. To
    * collapse a section regardless of visibility, call `collapseSection(id)`
    * directly.
    */
   collapseAllSections(): void;
   ```

**`demo.tsx` changes:**
1. Add a new demo tab named "Render slot" (or similar) that mounts:
   ```tsx
   <RichSidebar
     items={DEMO_ITEMS}
     currentPath="/"
     renderItem={({ defaultRender, item }) => (
       <TooltipWrapper
         content={`Item: ${item.label}`}
         side="right"
         disabled={false}
       >
         {defaultRender}
       </TooltipWrapper>
     )}
   />
   ```
   Where `TooltipWrapper` is imported from the relative path `./parts/tooltip-wrapper` (it's a sealed-folder internal part; demo.tsx is allowed to reach inside since it's docs-only).

**No new shadcn primitive added.** `meta.ts.dependencies.shadcn` unchanged. validate:meta-deps stays clean.

### C7 — Docs + version bumps + GATE 3 + ship

**Files touched:**
- `docs/procomps/rich-sidebar-procomp/rich-sidebar-procomp-guide.md`
- `src/registry/components/navigation/rich-sidebar/meta.ts`
- `src/registry/component-versions.ts`
- `registry.json`
- `docs/procomps/rich-sidebar-procomp/reviews/<YYYY-MM-DD>-v0.3.0-spotcheck.md` (NEW)
- `.claude/STATUS.md`
- `.claude/decisions/<YYYY-MM-DD>-rich-sidebar-v0.3.0-a-plus-pass.md` (NEW)

**`guide.md` migration section** (new — append to existing v0.2 guide):
1. **`renderItem` slot contract:** "Return arbitrary content; the library wraps it in `<li>` for you. Do NOT return an `<li>` yourself — that would produce invalid nested `<li><li>` markup. Item-level `className` and `data-testid` are applied to the library's `<li>` wrapper."
2. **Mobile-drawer reason discriminator:** "`onMobileOpenChange.reason` now fires correctly for all 5 cases: `"trigger"` (companion `<RichSidebarTrigger>` click), `"item-click"` (nav row in drawer), `"outside-click"` (backdrop click), `"escape"` (Esc key), `"imperative"` (direct `handle.openMobile()` / `closeMobile()` / `toggleMobile()` call from consumer code). v0.2.x had this stuck on `"imperative"`."
3. **Custom trigger reason guidance (Q25):** "If you wire your own hamburger trigger button instead of using `<RichSidebarTrigger>`, pass `\"trigger\"` to keep analytics-style reason discriminators aligned with the built-in companion: `handle.toggleMobile(\"trigger\")` instead of `handle.toggleMobile()`."
4. **`openMobile` / `closeMobile` / `toggleMobile` additive `reason?` param:** "Each accepts an optional `RichSidebarMobileOpenReason` arg. Default `\"imperative\"` preserves v0.2.x signatures — `handle.closeMobile()` works exactly as before."
5. **`NavUserMenuItem.onClick` signature widening (BREAKING):** "v0.3.0 widens the callback parameter type from `React.MouseEvent` to `Event | React.MouseEvent` (exported as `NavUserMenuItemSelectEvent`). Runtime behavior unchanged. Migration:
   ```ts
   // v0.2.x:
   onClick: (event: React.MouseEvent) => { console.log(event.clientX); }
   // v0.3.0 — narrow to MouseEvent if you need MouseEvent-only fields:
   onClick: (event: NavUserMenuItemSelectEvent) => {
     if (event instanceof MouseEvent) console.log(event.clientX);
   }
   // or cast at the call site:
   onClick: (event: NavUserMenuItemSelectEvent) => {
     console.log((event as React.MouseEvent).clientX);
   }
   ```
   If your callback only calls `event.preventDefault()` / `event.stopPropagation()` (methods on every Event subtype), no migration needed."
6. **Tooltip shim resolution note** — whatever C4 audit determined.

**`meta.ts` changes:**
- `version: "0.3.0"`
- `updatedAt: "<today>"`
- Append `features` lines for the v0.3 behaviors.

**`src/registry/component-versions.ts` changes:**
- Bump rich-sidebar entry to `0.3.0`.

**`registry.json` changes:**
- Add `lib/build-handle.ts` to the base item's `files` array. Entry shape (matching existing convention):
  ```json
  {
    "path": "src/registry/components/navigation/rich-sidebar/lib/build-handle.ts",
    "type": "registry:component",
    "target": "components/rich-sidebar/lib/build-handle.ts"
  }
  ```

**GATE 3 spotcheck review file (NEW):**
- Path: `docs/procomps/rich-sidebar-procomp/reviews/<YYYY-MM-DD>-v0.3.0-spotcheck.md`
- Template: `docs/reviews/templates/review-spotcheck.md`
- Rotating dim: **Public API** (justified by C2 reason discriminator + C4 onClick widening — both touch user-visible contracts; L54 + L56 both promote new public surface).
- Verdict must be `Pass` or `Pass with follow-ups`. Each `Pass with follow-ups` finding tagged with owner + bump target.

**STATUS.md update:**
- Components-table row: bump version + status note.
- Active queue update.
- "Recent activity" pointer to the decision file.

**Decision file (NEW):**
- Path: `.claude/decisions/<YYYY-MM-DD>-rich-sidebar-v0.3.0-a-plus-pass.md`
- YAML frontmatter per convention.
- Summary of the v0.3.0 cycle, the 11 findings closed, the breaking change with migration note, and rate change (A- → A+).

**Push:** Commit chain `C1..C7` to master. Vercel auto-runs `pnpm vercel-build` → registry regenerated → installable as `pnpm dlx shadcn@4.6.0 add @ilinxa/rich-sidebar` at v0.3.0.

---

## 5. Verification ladder

Per [.claude/rules/component-readiness-review.md](../../../.claude/rules/component-readiness-review.md) closure conditions + project precedent (todo-rich-card, todo-tree, json-form same-day-patch loops):

### Per-commit (run after each C1–C6)
1. `pnpm tsc --noEmit` clean (catches type drift from the discriminant changes + handle widening early).
2. `pnpm lint` clean.

### After C5 (mid-chain checkpoint)
3. `pnpm validate:meta-deps` clean — confirms no new shadcn primitives slipped in.
4. `pnpm dev` — visit `/components/rich-sidebar`, confirm every existing demo tab still renders.

### After C6 (full pre-ship gate)
5. `pnpm registry:build` — `public/r/rich-sidebar.json` regenerated; spot-check (a) `lib/build-handle.ts` appears with `type: "registry:component"` + `target: "components/rich-sidebar/lib/build-handle.ts"`, (b) `demo.tsx` / `usage.tsx` / `meta.ts` still absent.
6. `pnpm build` — full Next.js production build green.
7. New `renderItem` demo tab renders — TooltipWrapper-wrapped slot works visually.

### After C7 (push gate)
8. **Path-b consumer-tsc smoke** at `e:/tmp/ilinxa-smoke-consumer/`: install via `pnpm dlx shadcn@4.6.0 add @ilinxa/rich-sidebar` against the local registry artifact → `pnpm tsc --noEmit` in the consumer tree → clean. Expected no F-cross-13 hits on the new `<SheetContent>` `onPointerDownOutside` / `onEscapeKeyDown` props (Radix-typed today; defensive fallback through `onOpenChange` if shadcn migrates to Base UI in a future release).
9. **Browser interaction tests** (manual, in `/components/rich-sidebar` demo page):
   - **C1 verification:** New `renderItem` demo tab renders ONE `<li>` per row (DevTools Elements panel — no `<li><li>` nesting anywhere, including when consumer's slot returns `defaultRender`). Item-level `className` + `data-testid` visible on the `<li>` wrapper.
   - **C1 regression check:** Existing `renderItem` consumers returning custom non-`<li>` content still wrap correctly as `<li><CustomNode/></li>` — visually unchanged.
   - **C2 verification (5-reason matrix):** Resize to < lg breakpoint, open mobile drawer:
     - Click hamburger trigger → `onMobileOpenChange` fires with `reason: "trigger"`.
     - Click a nav item → `reason: "item-click"`.
     - Press Escape with drawer open → `reason: "escape"`.
     - Click outside the drawer → `reason: "outside-click"`.
     - Call `handle.closeMobile()` from a consumer button → `reason: "imperative"`.
     - Each callback fires exactly ONCE per close event (proves L53 no-op guard works).
   - **C2 regression check:** Keyboard nav (Tab into nav, ArrowDown/Up/Home/End, Right/Left on a collapsible section header) — all behaviors preserved post-`<li>` refactor and post-`useCallback` wrap.
   - **C5 verification:** Sidebar still functions identically; storage-rehydration + auto-expand-active + auto-scroll-into-view all still work (proves `buildHandle` extraction is functionally equivalent).
   - **C6 verification:** With `storageKey="rs-test"` set: collapse sidebar, refresh page → sidebar re-renders collapsed; confirm `onCollapsedChange` does NOT fire on the rehydration mount (matches new documented contract).
   - **C4 verification:** NavUser dropdown menu item click — no console errors; consumer's widened `onClick` callback receives the underlying event correctly.

### Pre-push diff audit (`git diff master..HEAD`)
10. Confirm:
    - No `data-stage` anywhere in the rich-sidebar folder (grep).
    - No `@ts-expect-error` in `parts/tooltip-wrapper.tsx` UNLESS the C4 audit determined Base UI dual-shape — in which case comment cites concrete evidence.
    - No `as React.MouseEvent` in `parts/nav-user.tsx`.
    - No `replace(/(["\\])/g, "\\$1")` fallback in `rich-sidebar.tsx`.
    - `lastMobileOpenReason` field present in `SidebarReducerState`; exhaustive `never` check in reducer's `default` branch still compiles.
    - `buildHandle` is the SAME factory in both `rich-sidebar.tsx` and `use-sidebar-nav-state.ts` (no inline duplication left).
    - `NavUserMenuItemSelectEvent` exported from `index.ts`.

---

## 6. Risks (delta to v0.2.4 + new ones from v0.3.0 scope)

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| **R15** | The `<li>` ownership refactor (C1) could subtly change layout-tree CSS selectors for consumers styling `li > a` or `li.list-none > a`. | Low | Both old and new paths produce the same outer DOM (`<li>` wrapping `<a>`). Browser test step 8 confirms. |
| **R16** | `onPointerDownOutside` + `onEscapeKeyDown` are Radix-specific. Future shadcn migration to Base UI may change names or event shape. | Medium | C2 keeps `onOpenChange` fallback wired — `closeMobile()` still fires with `"imperative"` if dedicated handlers don't trip. F-cross-13 graceful degradation pattern. |
| **R17** | `useCallback` wrapping renderInnerChrome / renderListBody (C6) shifts timing vs React Compiler auto-memoization. | Low | Functional behavior identical; only reference-stability semantics tighten. Browser test step 9 confirms no visible regression. |
| **R18** | `lastMobileOpenReason` field added to `SidebarReducerState` (C2) breaks any consumer persisting reducer state directly via JSON.stringify. | Very Low | Internal type, never exported. Storage rehydration uses EXTERNAL_SYNC with only collapsed + mobileOpen — persisted JSON unchanged. |
| **R19** | `EXPAND_ALL_SECTIONS` action discriminant change (C5) breaks any consumer hand-dispatching to the internal reducer. | Very Low | Reducer + actions not exported. Field was already unused; pure cleanup. |
| **R20** | NEW: `NavUserMenuItem.onClick` widening (C4) BREAKING TypeScript change. Consumers accessing MouseEvent-only fields hit type errors. | Medium | Migration note in guide.md with two recipes (narrow-with-instanceof + cast). Runtime behavior unchanged. Justifies the v0.2.4 → v0.3.0 minor bump. |
| **R21** | NEW: `buildHandle()` extraction (C5) introduces a synchronization risk — IF C2's reason-plumbing isn't reflected inside `buildHandle`, the rich-sidebar.tsx path may fire wrong reasons. | Low | C5 implements the C2 plumbing INSIDE `buildHandle`. Critical detail: `toggleMobile` dispatches `TOGGLE_MOBILE` (NOT a translated SET_MOBILE_OPEN) so the reducer reads fresh `state.mobileOpen` to handle rapid same-tick double-clicks correctly. Browser test step 9's 5-reason matrix verifies both call paths AND includes a rapid double-click scenario to confirm both clicks flip the state. |
| **R23** | NEW: EXTERNAL_SYNC stale-reason carry-over — without resetting `lastMobileOpenReason` on prop-driven transitions, a consumer using BOTH controlled `isMobileOpen` AND `onMobileOpenChange` could see a stale reason from a prior in-app transition reported for a prop-driven close. | Medium | C2 step 5 (EXTERNAL_SYNC case) resets `lastMobileOpenReason: "imperative"` when the transition actually changes mobileOpen. Defense-2's existing short-circuit means no-op syncs don't touch the field. Browser test step 9 includes a "controlled-prop change after item-click" scenario to confirm the reset works. |
| **R22** | NEW: TooltipWrapper used in C6 demo tab is an internal sealed-folder part. If a future refactor moves or renames it, demo breaks. | Very Low | Demo doesn't ship to consumers (docs-only); breakage shows up immediately at `pnpm dev`. Same robustness as any other internal-part-using demo. |

---

## 7. Stage gate

GATE 2 closes when:

- [ ] All file-level changes per commit (C1–C7) cross-checked against the description addendum locks (L53–L56) and the Q-P resolutions (Q23–Q26).
- [ ] Re-validation pass run by assistant; expect 3–5 substantive refinements per the memory.
- [ ] User signs off.

When closed, implementation begins at C1.

---

## 8. Foldback plan

Same as the v0.2.0 foldback plan in description addendum Appendix C, adapted:

1. This plan addendum's §4 (commit chain) merges into the base plan's chronology (or `Implementation History` section if maintained).
2. §2 (Final API delta) collapses into the base plan's API surface table.
3. §6 (risks) merges into base plan §X (risks).
4. This file (`rich-sidebar-procomp-plan-v0.3.0.md`) AND the description addendum (`rich-sidebar-procomp-description-v0.3.0.md`) are **deleted** in the v0.3.0 close commit.
5. The base description + base plan absorb L53–L56 + the Q23–Q26 resolutions.

Until close: three plan files read together (base + v0.2 addendum + v0.3 addendum) = current intent.
