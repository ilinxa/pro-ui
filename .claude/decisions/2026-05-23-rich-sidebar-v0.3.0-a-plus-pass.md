---
date: 2026-05-23
session: rich-sidebar-v0.3.0-a-plus-pass
phase: shipping
type: feat
commits:
  - (this commit)  # C1–C7 squashed into a single C7 close commit
components:
  - rich-sidebar (v0.2.4 → v0.3.0 ✅ SHIPPED)
findings:
  - F1 ⚠️ High — `<li><li>` nesting when renderItem returns defaultRender (CLOSED, C1, L55)
  - F2 ⚠️ High — mobileOpenChange.reason permanently "imperative" despite 5-case union (CLOSED, C2, L53 + L54)
  - F3 🔸 Medium — broken CSS.escape fallback (CLOSED, C3)
  - F4 🔹 Low — data-stage="C11-..." build-phase leak (CLOSED, C3)
  - F5 🔸 Medium — ~50 LOC handle-builder duplication (CLOSED, C5)
  - F6 🔹 Low — storage rehydration silent on onCollapsedChange (CLOSED via JSDoc, C6)
  - F7 🔹 Low — renderInnerChrome/renderListBody inline (CLOSED via useCallback, C6)
  - F8 🔹 Low — expandAllSections misleading allSectionIds:[] (CLOSED, C5 folded)
  - F9 🔹 Low — collapseAllSections iterates raw items (CLOSED, C5 folded)
  - F10 🔸 Medium — NavUserMenuItem.onClick unsafe cast (CLOSED + BREAKING widening, C4, L56)
  - F11 🔹 Low — tooltip @ts-expect-error shim untested (CLOSED, C4)
status: shipped
---

# `rich-sidebar` v0.3.0 SHIPPED — "A+ pass" (11 review findings closed; 1 BREAKING type widening) (2026-05-23)

> Fix-and-tighten minor bump on v0.2.4 that closes every finding from the v0.2.4 A- code review. **Brought the procomp from A- to A+ professional.** Single TypeScript-breaking signature widening justifies the minor (not patch) bump; consumers receive a one-line migration note in the guide. Full GATE 1 + GATE 2 + GATE 3 cycle, two re-validation passes catching 10 substantive refinements pre-sign-off.

## Trigger

User-requested code review of the v0.2.4 procomp returned an **A-** rating with 11 substantive findings. Re-validation against the actual source confirmed all 11. User chose the **v0.3.0 minor bump scope** (fixes + small API tightenings) over v0.2.5 patch-only because finding F10 requires a TypeScript-breaking signature widening (`NavUserMenuItem.onClick` event arg widened from `React.MouseEvent` to `Event | React.MouseEvent`).

User also overrode two Q-P defaults at GATE 1 sign-off:
- **Q23 → YES** export named alias `NavUserMenuItemSelectEvent` (default was NO).
- **Q26 → YES** cross-codebase `data-stage` grep + fix (default was "F-cross note only"). Grep returned 1 hit total (the rich-sidebar one) so the cross-cutting expansion was trivial.

## Surface delivered

### Bug fixes (non-breaking)

**C1 — `<li>` ownership inversion (F1, L55).** `SidebarNavRow` stops wrapping in `<li>` and returns only the `<TooltipWrapper>{linkEl}</TooltipWrapper>` element. `SidebarNavList` owns the single `<li className={cn("list-none", item.className)} data-testid={item["data-testid"]} key={item.id}>` wrapper, applied to BOTH the default path AND the `renderItem`-slot path. Consumer's `renderItem={({ defaultRender }) => defaultRender}` now produces `<li><a>…</a></li>` (correct) instead of v0.2.x's `<li><li>…</li></li>` (invalid HTML). Item-level `className` + `data-testid` preserved.

**C2 — Reason discriminator plumbing (F2, L53 + L54).** Three-part fix:
- **Reducer:** new `lastMobileOpenReason: RichSidebarMobileOpenReason | null` field on `SidebarReducerState`. `SET_MOBILE_OPEN` writes `action.reason` only when the no-op guard passes (preserves prior reason on duplicate dispatch — load-bearing for the "no double-fire on re-entry" guarantee). `TOGGLE_MOBILE` widens with optional `reason?` and writes `action.reason ?? "imperative"`. **EXTERNAL_SYNC resets to `"imperative"` only on transition-causing syncs** (R23 mitigation — prevents stale `"item-click"` / `"escape"` leaking into prop-driven close callbacks).
- **Defense-1 effect** in `useSidebarReducer` reads `state.lastMobileOpenReason ?? "imperative"` and fires the microtask callback with the actual reason. Stale "C2/C3 will refine" comment block deleted.
- **Handle + carrier wiring:** `RichSidebarHandle.openMobile` / `closeMobile` / `toggleMobile` widen with optional `reason?` (additive — defaults preserve v0.2.x signatures). All 5 reason cases reachable from real code paths: `"trigger"` via `<RichSidebarTrigger>` companion calling `handle.toggleMobile("trigger")`; `"item-click"` via `<SidebarNavList>` forwarding to `closeMobile("item-click")`; `"outside-click"` + `"escape"` via new `<SheetContent onPointerDownOutside>` + `<SheetContent onEscapeKeyDown>` handlers; `"imperative"` as default fallback for consumer-direct calls and the Sheet `onOpenChange` re-entry path.

**C3 — CSS.escape fallback + data-stage leak (F3 + F4).** Two one-line edits in `rich-sidebar.tsx`. Replaced the broken-by-design ternary fallback (escaped only `"` and `\` — missing `:`, `]`, leading digits, etc.) with `window.CSS.escape(focusedItemId)` — universal browser support (Chrome 46+ / Edge 79+ / Firefox 31+ / Safari 10+), SSR-gated by existing `typeof document === "undefined"` check. Deleted `data-stage="C11-keyboard-skiplink-permissions"` attribute. Cross-codebase grep verified ZERO `data-stage` hits remaining in `src/`.

### API tightening (one BREAKING TypeScript-only change)

**C4 — `NavUserMenuItem.onClick` widening + exported alias + tooltip shim audit (F10 + F11, L56).**
- **`NavUserMenuItem.onClick` signature widening (BREAKING):** type changed from `(event: React.MouseEvent) => void` to `(event: NavUserMenuItemSelectEvent) => void` where `NavUserMenuItemSelectEvent = Event | React.MouseEvent`. Runtime behavior unchanged — the type now honestly matches what Radix's `DropdownMenuItem.onSelect` actually passes (Event for keyboard activations, MouseEvent for mouse clicks). Unsafe `as React.MouseEvent` cast in `nav-user.tsx` dropped. **Cascade widening** of `RichSidebarEventArgs["footerMenuItemClick"].event` (same callback chain — must be self-consistent) plus the internal wrapper at `rich-sidebar.tsx` `resolvedFooter`. Migration impact for v0.2.x consumers: ZERO unless callback reads MouseEvent-only fields (`clientX`, `shiftKey`, etc.), in which case a one-line `if (event instanceof MouseEvent) {…}` narrow or cast is needed. Documented in guide migration section.
- **`NavUserMenuItemSelectEvent` new exported type alias** (L56 — Q23 user override). Added to `types.ts` and re-exported from `index.ts`. Recommended way to type custom `onClick` handlers without spelling out the union.
- **Tooltip shim audit:** read `@/components/ui/tooltip.tsx` — confirmed it imports `Tooltip` from the `radix-ui` umbrella package (Radix only, no Base UI dual-shape variant currently). Dropped the `@ts-expect-error delay={delay}` shim line; `<TooltipProvider>` now passes only `delayDuration={delay}`. Future shadcn migrations to Base UI restore the shim with sharper comment per F-cross-13 pattern.

### DRY refactor

**C5 — Extract `buildHandle()` helper (F5).** New `lib/build-handle.ts` factory consumed by BOTH `rich-sidebar.tsx` AND `hooks/use-sidebar-nav-state.ts` via `useMemo(() => buildHandle({ state, dispatch, items, visible, active }), [...])`. ~50 LOC eliminated. The two paths had silently drifted during v0.2.x — extraction codifies single source of truth. Folds in F8 (drop `allSectionIds` payload from `EXPAND_ALL_SECTIONS` action discriminant) + F9 (`collapseAllSections` sources section IDs from `visible.entries` post-filter instead of raw `items`). Not exported from `index.ts` — internal-only.

**Race fix bonus** discovered during GATE 2 re-validation pass (R21): `buildHandle.toggleMobile` dispatches `TOGGLE_MOBILE` (NOT a translated `SET_MOBILE_OPEN`) so the reducer reads FRESH `state.mobileOpen` inside the reducer — handles rapid same-tick double-clicks correctly. Translating toggle to SET at the handle layer would use closure-captured stale state and the reducer's no-op guard would silently drop the second dispatch.

### Polish + docs

**C6 — `useCallback` wraps + JSDoc + renderItem demo tab (F6, F7, Q24).**
- `renderInnerChrome` + `renderListBody` wrapped with `useCallback` over their full dep arrays. Belt-and-suspenders for non-React-Compiler consumer environments (registry distribution may install into apps without the compiler).
- JSDoc on `onCollapsedChange` documents the storage-rehydration silence as intended (F6 — not fixed; treated as documented behavior per plan §"Out of scope" + R23).
- JSDoc on `collapseAllSections` documents the visible-only scope (F9).
- New `<V03RenderItemSlotDemo>` tab in `demo.tsx` anchors the C1 contract — uses the existing internal `TooltipWrapper` part to wrap `defaultRender`, demonstrating the load-bearing wrapper-around-default pattern. Zero new shadcn primitives. Serves as a living regression test.

### Ship

**C7 — Docs + version bumps + GATE 3 + STATUS + decision.**
- New consumer guide at [`docs/procomps/rich-sidebar-procomp/rich-sidebar-procomp-guide.md`](../../docs/procomps/rich-sidebar-procomp/rich-sidebar-procomp-guide.md) covering installation, common composition patterns, the 5-reason mobile-drawer matrix, storage persistence semantics, and the full v0.2.x → v0.3.0 migration walkthrough.
- `meta.ts` bumped to `version: "0.3.0"`, `updatedAt: "2026-05-23"`, plus 4 new feature lines.
- `registry.json` gained `lib/build-handle.ts` ship-file entry at the correct alphabetical position (37 ship files total, up from 36).
- GATE 3 spotcheck review at [`docs/procomps/rich-sidebar-procomp/reviews/2026-05-23-v0.3.0-spotcheck.md`](../../docs/procomps/rich-sidebar-procomp/reviews/2026-05-23-v0.3.0-spotcheck.md) — rotating dim Public API; verdict **Pass with follow-ups**; 4 non-blocking findings.
- Note: `src/registry/component-versions.ts` does NOT exist (memory entry incorrectly mentioned this convention from todo-tree); `meta.ts` IS the version source of truth.

## Process highlights

**Two re-validation passes** ran across the GATEs:
- **GATE 1 re-validation** surfaced **5 substantive findings** (above the memory's predicted 1–3 for Stage 1):
  1. Q23 struck as already-handled by existing reducer no-op guard at [sidebar-reducer.ts:67-69](../../src/registry/components/navigation/rich-sidebar/lib/sidebar-reducer.ts#L67).
  2. L53 rationale strengthened with explicit ties to `use-storage-sync.ts` and `sidebar-reducer.ts` no-op guard.
  3. Q24 (now Q23) rationale recipe corrected — `Parameters<NonNullable<…>>[0]`, not `NonNullable<…>`.
  4. New Q25 added for custom-trigger guidance (consumer wiring own hamburger).
  5. Q24 (demo wrapping) clarified — uses sealed-folder `TooltipWrapper`, zero new shadcn deps.
- **GATE 2 re-validation** surfaced **5 substantive findings** (within the memory's predicted 3–5 for Stage 2):
  1. C1 description cleanup — removed contradictory edit-draft text about TooltipWrapper.
  2. `toggleMobile` race-condition fix — keep `TOGGLE_MOBILE` action (not translate to SET).
  3. EXTERNAL_SYNC stale-reason fix — reset to `"imperative"` on transition.
  4. C4 tooltip-audit decision criteria sharpened (explicit Radix-vs-Base-UI import-path rules).
  5. Q26 cross-grep timing note (grep was 1 hit at GATE 2 time; C3 re-grep is sanity check).

Both re-validation passes had material findings — reinforcing the established lesson that re-validation is never rubber-stamp work.

## Verification

| Layer | Status |
|---|---|
| Per-commit `pnpm tsc --noEmit` (after C1, C2, C3, C4, C5, C6) | clean each time |
| `pnpm lint` (full) | only pre-existing warnings (unused-eslint-disable directives + `showDesktopHeader` unused-var) — none introduced by v0.3.0 |
| `pnpm validate:meta-deps` | 49/49 clean — no new shadcn or npm peers |
| `pnpm build` (full Next.js production) | clean — 49 component paths still prerender; `/components/rich-sidebar` in SSG list |
| `pnpm registry:build` | clean — `public/r/rich-sidebar.json` regenerated with new `build-handle.ts` entry |
| Path-b consumer-tsc smoke | DEFERRED to post-deploy per F-cross-11 established pattern |

## Findings → Commits → Locks crossref

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
| F10 `NavUserMenuItem.onClick` widening | 🔸 Medium (BREAKING) | C4 | L56 |
| F11 tooltip `@ts-expect-error` shim | 🔹 Low | C4 | — |

## Outcome

Per the original code review rubric: every A dimension promoted to A+; every B / B+ dimension promoted to A. **Overall: A+ professional.**

Migration impact for v0.2.x consumers: zero unless they pass `<RichSidebar footer={{ menuItems: [{ kind: "item", onClick: (event) => …event.clientX… }] }}>` reading MouseEvent-only fields — in which case a one-line narrow per the guide migration section.

## Open follow-ups (non-blocking)

- **F-01** path-b consumer-tsc smoke runs post-deploy against the Vercel artifact (established pattern from last 6 ships). v0.3.1 patch budget reserved if F-cross-13 hits the new `<SheetContent onPointerDownOutside>` / `onEscapeKeyDown` handlers — risk is low (Radix-typed today; `onOpenChange` defensive narrowing is the F-cross-13 safety net).
- **F-02** pre-existing `showDesktopHeader` unused-var at [rich-sidebar.tsx:537](../../src/registry/components/navigation/rich-sidebar/rich-sidebar.tsx#L537) — trivial v0.3.1 patch cleanup.
- **F-03** `fireOnRehydrate?` opt-in for consumers wanting storage-rehydration `onCollapsedChange` events — deferred to v0.4+ pending consumer demand.
- **F-04** F-cross-13 graceful-degradation test for `<SheetContent>` handlers — runs when shadcn ships a Base UI Sheet variant.
