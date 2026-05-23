# `rich-sidebar` v0.3.0 — Description Addendum (Stage 1)

> **Stage:** 1 of 3 · **Status:** ✅ Signed off 2026-05-23
> **Slug:** `rich-sidebar` (unchanged) · **Target version:** `0.3.0`
> **Release model:** **fix-and-tighten minor bump** — primarily internal refactors + bug fixes; one TypeScript-breaking signature widening (justifies the minor). v0.2.x consumers receive a one-line migration note.
> **Premise:** A code review of v0.2.4 (4,096 LOC, 37 files) returned an **A-** rating with 11 substantive findings — 2 ⚠️ High, 3 🔸 Medium, 6 🔹 Low. Re-validation confirmed all 11 against the actual source. v0.3.0 closes every finding and brings the procomp to **A+ professional**.
>
> **This addendum** documents only the **delta** v0.2.4 → v0.3.0. The base description ([`rich-sidebar-procomp-description.md`](rich-sidebar-procomp-description.md)) + the v0.2.0 addendum ([`rich-sidebar-procomp-description-v0.2.0.md`](rich-sidebar-procomp-description-v0.2.0.md)) still define the load-bearing surface; this file extends them with one new lock category (reason-discriminator plumbing) and audits 11 existing surfaces against the review findings. When v0.3.0 ships, this file is FOLDED into the base description and removed.

---

## 1. Problem (delta)

v0.2.4 ships a feature-complete sidebar but the GATE-3-style code audit revealed a class of issues that the rolling spotcheck reviews had missed because they targeted the new surface area at each minor bump rather than re-auditing the legacy substrate:

- **Two ⚠️ High bugs hit consumers immediately.** `<li><li>` nesting fires the moment any consumer uses the documented `renderItem={({ defaultRender }) => defaultRender}` slot pattern — invalid HTML, fails a11y scans, hydration warnings. `mobileOpenChange.reason` has been stuck on `"imperative"` since v0.1's C2 — the entire 5-case `RichSidebarMobileOpenReason` union is a lie to consumers who wired analytics or routing decisions to the reason discriminator.
- **Three 🔸 Medium quality issues.** A broken CSS.escape fallback (escapes only `"` and `\`), ~50 LOC of imperative-handle builder duplicated between `rich-sidebar.tsx` and `use-sidebar-nav-state.ts` (already drifted once between v0.2.x bumps), and an unsafe `eventArg as React.MouseEvent` cast in `NavUser.onSelect`.
- **Six 🔹 Low polish issues.** A `data-stage="C11-keyboard-skiplink-permissions"` build-phase tag leaking into shipped DOM, an undocumented storage-rehydration silence on `onCollapsedChange`, `renderInnerChrome` / `renderListBody` redefined every render (React-Compiler implicit, not portable), `expandAllSections` dispatching a misleading empty `allSectionIds: []` payload, `collapseAllSections` iterating raw `items` not visible entries, a stale `@ts-expect-error` on the tooltip `delay` shim.

None of these would have been caught by tsc / lint / validate-meta-deps / registry-build / per-page render — they're a class of issue that only structured code review surfaces. Per the readiness-review rule, every component now passes a GATE 3 spotcheck before push; this v0.3.0 cycle also runs a full audit pass to clear the backlog and reset the bar.

### Why this isn't a v0.2.x patch

One change — widening `NavUserMenuItem.onClick` from `(event: React.MouseEvent) => void` to `(event: Event | React.MouseEvent) => void` — is a **TypeScript-breaking change** (input contravariance: consumers' `(event: MouseEvent) => …` callbacks now error if they accessed MouseEvent-only fields like `e.clientX`). Per project convention this triggers a minor bump and migration note in the guide. All other fixes are non-breaking.

The handle-method widening from `closeMobile()` → `closeMobile(reason?: RichSidebarMobileOpenReason)` is ADDITIVE (optional parameter, default `"imperative"` preserves v0.2.x signatures); not breaking.

---

## 2. In scope / Out of scope (delta to v0.2.4)

### v0.3.0 — in scope (11 findings → 7 commits C1–C7)

**Bug fixes (non-breaking):**

1. **F1 ⚠️ `<li>` ownership inversion** (C1). `SidebarNavRow` stops wrapping in `<li>`; `SidebarNavList` owns wrapping for both the default path AND the `renderItem` slot path. Result: `renderItem={({ defaultRender }) => defaultRender}` produces correct `<li><a>…</a></li>`, and `renderItem={({ defaultRender }) => <Custom/>}` produces correct `<li><Custom/></li>`. Item-level `className` + `data-testid` preserved on the wrapper.

2. **F2 ⚠️ Reason discriminator plumbing** (C2). Add `lastMobileOpenReason` field to reducer state; SET / TOGGLE write it; Defense-1 effect reads `state.lastMobileOpenReason ?? "imperative"` for the microtask callback. Extend `RichSidebarHandle.openMobile` / `closeMobile` / `toggleMobile` with optional `reason?` parameter (additive). Wire reason at every carrier site: `item-click` (sidebar-nav-list click handler), `outside-click` + `escape` (Sheet's `onPointerDownOutside` + `onEscapeKeyDown`), `trigger` (companion `<RichSidebarTrigger>` button).

3. **F3 🔸 / F4 🔹 CSS.escape fallback + data-stage leak** (C3). Drop the broken-by-design fallback (`replace(/(["\\])/g, "\\$1")` escapes only 2 of the dozens of selector-illegal characters); CSS.escape is universal in modern browsers. Delete the `data-stage="C11-..."` attribute.

**API tightening (one breaking change):**

4. **F10 🔸 `NavUserMenuItem.onClick` signature widening (BREAKING)** (C4). Drop the unsafe `as React.MouseEvent` cast; type the callback parameter as `Event | React.MouseEvent` matching the actual runtime value passed by `DropdownMenuItem.onSelect`.

5. **F11 🔹 Tooltip `@ts-expect-error` shim audit** (C4). Read the installed `@/components/ui/tooltip` to confirm whether shadcn 4.6.0 currently ships Radix (`delayDuration`) or Base UI (`delay`). If Radix-only: delete the line. If Base UI: keep with a sharper comment citing concrete evidence.

**DRY refactor (internal):**

6. **F5 🔸 Extract `buildHandle()` helper** (C5). New `lib/build-handle.ts` factory consumed by both `rich-sidebar.tsx` and `use-sidebar-nav-state.ts`. ~50 LOC eliminated; ends the silent-drift risk between the two paths. Folds in two polish items (F8 `expandAllSections` action discriminant cleanup + F9 `collapseAllSections` visible-entries source).

**Polish + docs:**

7. **F6 🔹 / F7 🔹 useCallback + JSDoc** (C6). `renderInnerChrome` + `renderListBody` wrapped with `useCallback` for non-React-Compiler portability. JSDoc on `onCollapsedChange` documenting the storage-rehydration silence; JSDoc on `collapseAllSections` documenting visible-only scope. New `renderItem` regression-demo tab in `demo.tsx` anchors the C1 contract.

### v0.3.0 — explicitly OUT of scope

- **`React.memo` on `<SidebarNavList>` + downstream parts.** Performance audit deferred to v0.3.1 unless GATE 3 spotcheck surfaces evidence of unnecessary re-renders.
- **Cross-cutting `useCallback` audit beyond `renderInnerChrome` / `renderListBody`.** Limited to the two flagged in F7.
- **Firing `onCollapsedChange` on storage rehydration.** Documented as intended behavior, not fixed. Revisit only if a consumer files a feature request.
- **Reason-discriminator on `EXTERNAL_SYNC` path.** External-state consumers wiring `onMobileOpenChange` via `<RichSidebar onMobileOpenChange={…} state={lifted} />` still see `reason: "imperative"` because the internal Defense-1 effect on the lifted hook doesn't see the consumer's callback. Acceptable for v0.3 — consumer can read state directly from the lifted hook. Tracked but not closed.
- **Replacing the F-cross-13 defensive `(next: boolean | undefined)` callback narrowing in NavUser / Sheet.** Project-wide convention; not in scope here.
- **Renaming any v0.2 public prop.** Zero renames; only the `NavUserMenuItem.onClick` signature widens.

---

## 3. Target consumers (delta to v0.2.4)

Unchanged. All v0.1 + v0.2 target audiences keep working. The migration impact for the breaking change:

- Consumers using `NavUserMenuItem.onClick` who **only** call `event.preventDefault()` / `event.stopPropagation()` (the methods present on every Event subtype) → ZERO migration. tsc still green.
- Consumers reading MouseEvent-only fields (`e.clientX`, `e.currentTarget` cast as HTMLElement, etc.) → one-line narrow: `if (event instanceof MouseEvent) { /* MouseEvent fields */ }` or explicit cast `(event as React.MouseEvent).clientX`. Documented in guide migration line.

No consumer is excluded. No runtime behavior change for the widening — only the type contract gets honest.

---

## 4. Rough API sketch (delta)

The full v0.2.x surface stays. Three SIGNATURE deltas:

```tsx
// types.ts — additive, non-breaking
interface RichSidebarHandle {
  openMobile(reason?: RichSidebarMobileOpenReason): void;   // was: openMobile(): void
  closeMobile(reason?: RichSidebarMobileOpenReason): void;  // was: closeMobile(): void
  toggleMobile(reason?: RichSidebarMobileOpenReason): void; // was: toggleMobile(): void
  // … all other methods unchanged
}

// types.ts — BREAKING
interface NavUserMenuItem {
  onClick?: (event: Event | React.MouseEvent) => void;  // was: (event: React.MouseEvent) => void
}
```

NEW developer-observable BEHAVIOR (no API change required to opt in):

```tsx
<RichSidebar
  items={items}
  currentPath={pathname}
  onMobileOpenChange={({ open, reason }) => {
    // v0.2.x: `reason` was always "imperative"
    // v0.3.0: now correctly fires "trigger" / "item-click" / "outside-click" / "escape" / "imperative"
    track("nav-drawer-toggled", { open, reason });
  }}
  // … all other props unchanged
/>
```

No new props. No new exports.

---

## 5. Example usages (delta)

No new demo tabs except the C6 `renderItem` regression-demo (single tab showing the slot contract working post-fix). All existing demo tabs continue to render unchanged.

---

## 6. Success criteria (delta to v0.2.4)

All v0.1 + v0.2 success criteria stand. New v0.3.0 criteria:

15. **`renderItem={({ defaultRender }) => defaultRender}` produces ONE `<li>` per row** (DevTools Elements panel inspection). No `<li><li>` nesting anywhere in the rendered tree. Item-level `className` + `data-testid` survive the refactor visibly on the `<li>` wrapper.
16. **`onMobileOpenChange.reason` fires correctly for all 5 cases** in browser testing: `trigger` (hamburger click), `item-click` (nav row click in drawer), `outside-click` (backdrop click), `escape` (Esc key), `imperative` (direct `handle.closeMobile()` call from consumer button).
17. **Zero non-additive runtime behavior changes** for v0.2.x consumers not using `renderItem` and not reading `mobileOpenChange.reason`. Existing consumer code compiles cleanly except for the documented `onClick` widening migration.
18. **`pnpm validate:meta-deps` stays clean** with no new shadcn primitives added to `meta.ts.dependencies.shadcn`.
19. **Imperative handle is built by a single shared `buildHandle()` factory** — `git diff` shows the same factory consumed in both `rich-sidebar.tsx` and `use-sidebar-nav-state.ts` (proves the drift risk is closed).
20. **GATE 3 spotcheck verdict ≥ `Pass with follow-ups`** with rotating dimension = Public API.

---

## 7. Locked decisions (L53–L55, continuing from v0.2's L41–L52)

| # | Lock |
|---|---|
| **L53** | **Reason-discriminator carried in reducer state, not in event-queue ref.** `SidebarReducerState` gains a `lastMobileOpenReason: RichSidebarMobileOpenReason \| null` field that `SET_MOBILE_OPEN` writes from `action.reason` and `TOGGLE_MOBILE` writes as `"imperative"`. Value OVERWRITES on each transition — no clear-action / no second reducer pass. **`EXTERNAL_SYNC` does NOT touch the field** — safe because (a) `mobileOpen` is never persisted ([use-storage-sync.ts §L19 comment](../../../src/registry/components/navigation/rich-sidebar/hooks/use-storage-sync.ts#L19)), so storage rehydration never causes mobile-drawer transitions, and (b) controlled-prop `isMobileOpen` changes come from consumer code that should pair them with explicit `handle.closeMobile(reason)` calls if they need a specific reason discriminator. Rationale for state-not-ref: simpler than a parallel ref-queue, exhaustive `never` check catches missed action types at compile time, **the existing no-op guard at [sidebar-reducer.ts:67-69](../../../src/registry/components/navigation/rich-sidebar/lib/sidebar-reducer.ts#L67) (`if (state.mobileOpen === action.open) return state;`) already guarantees that any re-entry from Sheet's `onOpenChange` callback after a dedicated `onPointerDownOutside` / `onEscapeKeyDown` handler is a no-op — so `lastMobileOpenReason` keeps its specific value through to the Defense-1 effect**. |
| **L54** | **Handle methods carry optional `reason?` param.** `openMobile(reason?)`, `closeMobile(reason?)`, `toggleMobile(reason?)`. Default `"imperative"`. Additive — v0.2.x callers `handle.closeMobile()` still type-check and fire `reason: "imperative"` exactly as before. Carrier sites inside the library pass specific reasons (`"item-click"`, `"outside-click"`, `"escape"`, `"trigger"`); consumer code calling the handle directly defaults to `"imperative"`. |
| **L55** | **`<li>` wrapping is owned by `SidebarNavList`, not `SidebarNavRow`.** Both default and `renderItem`-slot paths apply `<li className={cn("list-none", item.className)} data-testid={item["data-testid"]} key={item.id}>` wrapping. `SidebarNavRow` returns only the link element. Contract: consumer's `renderItem` return value is wrapped in `<li>` by the library — consumer must NOT return an `<li>`. Documented in guide.md migration line + comment in sidebar-nav-list.tsx. |
| **L56** | **Export `type NavUserMenuItemSelectEvent = Event \| React.MouseEvent`** (Q23 sign-off override). Added to `types.ts` and re-exported from `index.ts`. Consumers type custom dropdown `onClick` handlers as `(event: NavUserMenuItemSelectEvent) => void` instead of spelling out the union. One new public type export; recorded in the guide.md migration line as the recommended pattern alongside the inline-union alternative. |

---

## 8. Open questions — RESOLVED at GATE 1 sign-off (2026-05-23)

> Q23 (Sheet event sequencing) was **struck during re-validation pass** — the existing no-op guard at [sidebar-reducer.ts:67-69](../../../src/registry/components/navigation/rich-sidebar/lib/sidebar-reducer.ts#L67) already guarantees the second-pass `onOpenChange` dispatch returns the same state object, so `lastMobileOpenReason` keeps its specific value and Defense-1 fires the callback ONCE with the right reason. Codified in L53. Q-list re-indexed (Q23 → Q26 → Q23–Q25).

| # | Q | Resolution |
|---|---|---|
| **Q23** | Export named type alias for the widened `NavUserMenuItem.onClick` event arg? | ✅ **YES — export `type NavUserMenuItemSelectEvent = Event \| React.MouseEvent`** from `types.ts` and re-export from `index.ts`. New L56 codifies this. Adds one type export; documented as the recommended way to type custom `onClick` handlers in the guide migration line. |
| **Q24** | renderItem regression-demo tab content — bare or richer? | ✅ **Richer pattern — wrap `defaultRender` in the existing internal `TooltipWrapper` part.** Reuses sealed-folder `parts/tooltip-wrapper.tsx`; ZERO new shadcn primitives needed (tooltip already in `meta.ts.dependencies.shadcn`); demo file is docs-only per locked target convention. Demo body: `renderItem={({ defaultRender, item }) => <TooltipWrapper content={`Item: ${item.label}`} side="right" disabled={false}>{defaultRender}</TooltipWrapper>}`. |
| **Q25** | Custom-trigger guidance — recommend explicit `"trigger"` reason? | ✅ **YES — recommend `handle.toggleMobile("trigger")` in the guide.** Pure docs nudge; no behavior change. Guide migration line: "If you wire your own hamburger trigger button, pass `"trigger"` to keep analytics-style reason discriminators aligned with the built-in companion." |
| **Q26** | Cross-codebase `data-stage` sweep + fix in C3? | ✅ **YES — fix everywhere in C3.** Grep run 2026-05-23 returned ONE hit total across `src/` (the rich-sidebar one). C3 scope expansion is therefore trivial in practice: deleting one attribute IS the cross-cutting sweep. Record in commit message that the grep was run and rich-sidebar was the sole offender; no `F-cross-NN` entry needed because there is no cross-cutting class. |

---

## 9. Risks (delta to v0.2.4)

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| **R15** | The `<li>` ownership refactor (C1) could subtly change the layout-tree for consumers who CSS-style based on `li > a` or `li.list-none > a` selectors. | Low | Both old and new paths produce the same outer DOM (`<li>` wrapping `<a>`); only the source file ownership differs. CSS selectors targeting `li.list-none > a` still match. Browser interaction test step 8 confirms. |
| **R16** | The `onPointerDownOutside` + `onEscapeKeyDown` handlers (C2) are Radix-specific props on `<SheetContent>`. If shadcn 4.x migrates to Base UI in a future release, these handler names may change OR the event-shape passed may differ. | Medium | The C2 plan keeps the existing `onOpenChange` fallback wired — if the dedicated handlers don't fire (Base UI shape mismatch), `onOpenChange`'s `closeMobile()` still fires with default `"imperative"` reason. Graceful degradation: discriminator quality drops, behavior preserved. F-cross-13 pattern. |
| **R17** | Wrapping `renderInnerChrome` / `renderListBody` in `useCallback` (C6) may shift the timing of memoization vs. React Compiler's auto-memoization — could cause subtle re-render-count changes in profiling. | Low | Functional behavior identical; only reference-stability semantics tighten. Browser test step 8 confirms no visible regression. |
| **R18** | The `lastMobileOpenReason` field addition (C2) breaks ANY consumer who happens to be persisting reducer state directly (e.g., via JSON.stringify) — old persisted shapes lack the field. | Very Low | Internal type, never exported. Storage rehydration goes through `EXTERNAL_SYNC` action which uses the existing `collapsed` / `mobileOpen` shape only. Persisted JSON unchanged. |
| **R19** | The `EXPAND_ALL_SECTIONS` action discriminant change (C5) — dropping the `allSectionIds: ReadonlyArray<string>` field — would break ANY consumer that hand-dispatches to the internal reducer. | Very Low | Reducer is not exported. Field was already unused inside the reducer (reducer always clears the set regardless of payload). Pure cleanup. |

---

## 10. Definition of "done" for THIS document (stage gate) — ✅ CLOSED 2026-05-23

GATE 1 for v0.3.0 is **closed**:

- [x] All 4 active Q-Ps (Q23–Q26) resolved. Q23 (Sheet event sequencing) struck during pre-close re-validation; existing reducer no-op guard handles it. Q-list re-indexed.
- [x] All 3 new locks (L53–L55) confirmed. L56 added at GATE 1 sign-off to codify Q23 (named type alias export).
- [x] Re-validation pass (2026-05-23) — 5 substantive findings on addendum applied: (1) Q23 struck as already-handled by existing code, (2) L53 rationale strengthened with use-storage-sync.ts + sidebar-reducer.ts cross-refs, (3) Q23 (then Q24)'s rationale fixed (`Parameters<…>[0]` recipe replaces incorrect `NonNullable<…>` recipe), (4) Q25 added for custom-trigger guidance, (5) Q24 (demo wrapping) clarified — TooltipWrapper is sealed-folder, zero new shadcn deps.
- [x] User signed off 2026-05-23 — overrides on Q23 (export the alias) and Q26 (cross-sweep — grep + fix; grep returned 1 hit so effectively trivial).

When closed, GATE 2 plan authoring begins at [`rich-sidebar-procomp-plan-v0.3.0.md`](rich-sidebar-procomp-plan-v0.3.0.md) (companion to this addendum). The plan will lock the C1–C7 chain, the file-touch matrix, the verification ladder, and the GATE 3 spotcheck framing.

---

## Appendix A — Findings → Commits → Locks crossref

| Finding | Severity | Commit | Lock |
|---|---|---|---|
| F1 `<li><li>` nesting | ⚠️ High | C1 | L55 |
| F2 reason discriminator | ⚠️ High | C2 | L53 + L54 |
| F3 CSS.escape fallback | 🔸 Medium | C3 | — |
| F4 `data-stage` leak | 🔹 Low | C3 | — |
| F5 handle-builder duplication | 🔸 Medium | C5 | — |
| F6 storage rehydration silence | 🔹 Low | C6 (JSDoc) | — |
| F7 inline render-function memoization | 🔹 Low | C6 | — |
| F8 `expandAllSections` payload | 🔹 Low | C5 (folded) | — |
| F9 `collapseAllSections` source | 🔹 Low | C5 (folded) | — |
| F10 `NavUserMenuItem.onClick` widening | 🔸 Medium | C4 | — (BREAKING — migration note) |
| F11 tooltip `@ts-expect-error` shim | 🔹 Low | C4 | — |

---

## Appendix B — Semver tooth-grinding

We're going `0.2.4 → 0.3.0`. One TypeScript-breaking change (F10's `NavUserMenuItem.onClick` widening) justifies the minor bump per project convention. All other changes are additive or internal. **GATE 3 is required** because we touch the public API surface (handle method signatures widen with optional params; `NavUserMenuItem.onClick` type changes).

If a subsequent bump after v0.3.0 needs further breaking changes (e.g., removing the `RichSidebar.defaultMatch` prop or renaming `linkComponent`), that's the v0.x → v1.0.0 conversation — not on the near roadmap.

---

## Appendix C — Foldback plan

When v0.3.0 ships:

1. This addendum's §2 (in/out of scope) merges into the base description's §2.
2. L53–L55 inline-append the base description's L1–L52.
3. Q23–Q26 become resolved Q-Ps in the base description's §8 (kept as historical record).
4. R15–R19 merge into base description's §9.
5. This file (`rich-sidebar-procomp-description-v0.3.0.md`) AND its companion plan (`rich-sidebar-procomp-plan-v0.3.0.md`) are **deleted** as part of the v0.3.0 close commit; their content lives in the merged base description + plan.

Until that close, the base description + v0.2.0 addendum remain authoritative for v0.2.x behavior, and this addendum is the v0.3.0 spec. Three files reading together = the current intent (until the close commit collapses them).
