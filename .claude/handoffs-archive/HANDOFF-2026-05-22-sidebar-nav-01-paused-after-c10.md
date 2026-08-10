# ⏸ HANDOFF — sidebar-nav-01 paused after C10/13 (2026-05-22)

> **Status:** paused mid-implementation. 10 of 13 commits landed. Validators clean across every commit. Component is visually-real on the docs page; remaining work is keyboard a11y + minor polish + the registry-distribution close.

## Read-first on resume

1. This file (the punch list + the architectural notes that matter)
2. [`.claude/decisions/2026-05-22-sidebar-nav-01-migration-and-c1-c10.md`](decisions/2026-05-22-sidebar-nav-01-migration-and-c1-c10.md) (the long-form narrative)
3. [`docs/procomps/sidebar-nav-01-procomp/sidebar-nav-01-procomp-plan.md`](../docs/procomps/sidebar-nav-01-procomp/sidebar-nav-01-procomp-plan.md) §20 commit chain (the source of truth for what's next)

## Where we are

| Item | State |
|---|---|
| Migration intake | ✅ [`docs/migrations/social-nav-system/`](../docs/migrations/social-nav-system/) — both originals (kasder SocialSidebar.tsx + SocialBottomNav.tsx) copied; source-notes filled; **23-finding** deep audit on `analysis.md` |
| GATE 1 description | ✅ Signed off — 26 + 14 audit-pass locks (L1–L40) + 10 + 4 Qs (Q1–Q14) confirmed |
| GATE 2 plan | ✅ Signed off — +43 from inheritance + 17 audit-pass findings folded as L41–L48 (incl. L48-b F1 + L48-c F2) + 6 + 2 PQs confirmed |
| C1 scaffold + types | ✅ `39a03bc` — 32 exported types from `types.ts` |
| C2 reducer + state hook + context | ✅ `b35acce` — 11-action exhaustive reducer + Defense-1/2 wiring + per-instance context |
| C3 items rendering + active detection | ✅ `2676cfd` — flat NavItem rendering; computeActiveItem with L42 longest-prefix tie-break |
| C4 sections | ✅ `e59349a` — collapsible groups + separators + per-section defaultCollapsed |
| C5 collapse + CSS vars + activeVariant | ✅ `980f15c` — 11 `--ilinxa-*` vars + 5 activeVariant modes + side=left/right border swap |
| C6 NavBadge + tooltip-on-collapsed | ✅ `5f7dd89` — first F-cross-13 carrier (Tooltip) defensively wired |
| C7 mobile drawer + trigger | ✅ `7062c16` — CSS-gated render path (L44) + SidebarNav01Trigger + Sheet F-cross-13 |
| C8 prefab parts | ✅ `0a09379` — NavBrand / NavPrimaryAction / NavUser; DropdownMenu F-cross-13 (carrier #3) |
| C9 loading + empty states | ✅ `fcf79bf` — L39 branching + 4-reason empty state |
| C10 storage + headless hook + state precedence + F1/F2 | ✅ `8952fb7` — useSidebarNav01State exported; storageKey opt-in; F1 autoExpandActiveSection; F2 autoScrollActiveIntoView |

Fixup commits (interspersed): `ed2e7d9` quote escaping · `11d77ff` duplicate header rows · `f6e1b0e` useImperativeHandle missing + trigger simplification · `e198bf0` DropdownMenu+Slot/Fragment composition bugs.

## What remains — 3 commits

### C11 — keyboard handler + skip link + permissions diff (estimated ~6-8 tool calls)

- `lib/keyboard-handler.ts` + `lib/flatten-entries.ts` — Arrow/Home/End/Enter/Esc dispatch; section headers included in focus traversal (L37); ArrowRight/Left expand/collapse focused section header
- `parts/sidebar-skip-link.tsx` — `sr-only:focus:not-sr-only` per L31 + `skipLinkTarget` prop
- `onPermissionDenied` diff-based firing (L38) — fires once per item on initial filter + on each NEW item entering the filtered-out set. Implement via ref-tracking previous filteredByPermission ids
- Wire focus state via reducer (`FOCUS_ITEM` action already exists)

### C12 — deferred event wiring + RTL polish + reduced-motion sweep (estimated ~6 tool calls)

- Wire `onBrandClick` / `onPrimaryActionClick` / `onFooterTriggerOpen` / `onFooterMenuItemClick` through prefab configs (TODO already in source)
- RTL — verify `dir="rtl"` mirrors paddings/borders/dropdown align correctly; add data-side flip
- Reduced-motion sweep — audit every `motion-safe:` site; verify reduced-motion users get instant snaps not just absent animations

### C13 — close (estimated ~10-15 tool calls)

- Add to `registry.json` (base item + `sidebar-nav-01-fixtures` sibling item) — every file `type: "registry:component"`, target `components/sidebar-nav-01/<sub-path>`. Don't ship `demo.tsx` / `usage.tsx` / `meta.ts`. Ship `dummy-data.ts` via the fixtures sibling.
- `pnpm registry:build` to regenerate `public/r/sidebar-nav-01.json`
- Author GATE 3 spotcheck review at `docs/procomps/sidebar-nav-01-procomp/reviews/<date>-v0.1.0-spotcheck.md` — rotating dim recommendation: Public API (F-cross-13 surface is the biggest risk area)
- F-cross-11 path-b smoke from `e:/tmp/ilinxa-smoke-consumer/` after deploy
- Update STATUS.md row: in-progress → alpha 0.1.0
- Update `docs/component-versions.md`
- Author final decision file
- Push

## Architectural notes worth remembering on resume

### Context bridge limitation (NOT broken — documented)

`SidebarNav01Context.Provider` is rendered INSIDE `<SidebarNav01>`'s own subtree. Triggers as **siblings** can't read it. Mobile-drawer pattern requires the consumer to pass `<SidebarNav01Trigger controls={ref}>` with an explicit ref. Trigger-INSIDE-sidebar (rare) reads via context fine. Documented in `parts/sidebar-nav-trigger.tsx` JSDoc.

Future: a `<SidebarNav01Provider>` wrapper (consumer wraps both sidebar + trigger as children) would enable cross-tree triggers properly. Not blocking v0.1.

### State precedence trade-off

When external `state` provided (from `useSidebarNav01State` hook), `closeMobile` and `Sheet.onOpenChange` route through `finalHandle.closeMobile()` which uses reason `"imperative"`. **Loses the `"outside-click"` and `"item-click"` reason discriminators.** Polish for a follow-up via a `setMobileOpenWithReason` handle method. Acceptable for v0.1.

### F-cross-13 surface

Three primitive carriers all defensively wired:
- **Tooltip** — `TooltipProvider` passes BOTH `delayDuration` (Radix) AND `delay` (Base UI). `@ts-expect-error` annotated.
- **Sheet** — `onOpenChange` runtime typeof-check before mutating.
- **DropdownMenu** (inside NavUser) — `onOpenChange` typeof-check; `onSelect` arg typed `unknown` + cast at consumer callback boundary.

Expect F-cross-13 hits when C13 path-b smoke runs. **Same-day patch budget allocated.** Three consecutive procomps have followed this exact pattern (todo-rich-card v0.1.0→v0.1.1, todo-tree v0.1.0→v0.1.1, sidebar-nav-01 v0.1.0→likely v0.1.1).

### Slot composition pitfalls (resolved in `e198bf0`)

Two real bugs caught during C8 review:
- `<DropdownMenuTrigger asChild>` wrapping `<TooltipWrapper>` (a custom non-Slot-aware component): Radix Slot can't propagate trigger props through arbitrary React components. **Fix:** dropped Tooltip on NavUser. `aria-label` carries a11y.
- `<DropdownMenuItem asChild>` with a `<Fragment>` containing a single LinkComponent IIFE: Slot requires a single React element child; Fragment isn't one. **Fix:** removed the Fragment wrapper.

Apply the same scrutiny to any new prefab parts: **Radix `asChild` + your-own-React-component = won't work.** Stick to Slot-aware primitives.

### React Compiler 19 — no manual memo

`todo-tree/parts/` has zero `React.memo` usages despite being the largest procomp; the compiler handles row-level memoization automatically. Plan §18.1 originally specified `React.memo` on `<SidebarNavRow>`; that was DROPPED at C5 polish (`980f15c`). Don't re-add.

### CSS-gated mobile branching (L44)

Original plan had JS-gated rendering via `useMatchMedia` → flash on mobile devices (sub-100ms desktop sidebar before useEffect runs and switches to Sheet). Audit P1 caught this; rewrote to CSS-only (`hidden lg:flex` desktop / `lg:hidden` mobile wrapper). Both DOM trees render; CSS hides one. `useMatchMedia` narrowed to JS BEHAVIOR gating only (autoCloseMobileOnNavigate). No SSR flash. Don't revert.

## Validator state at pause

- `pnpm tsc --noEmit` ✅ clean
- `pnpm validate:meta-deps` ✅ **48/48 clean** (sidebar-nav-01 declares `tooltip`, `sheet`, `avatar`, `button`, `dropdown-menu`, `lucide-react`)
- `pnpm lint --quiet "src/registry/components/navigation/sidebar-nav-01/**/*.{ts,tsx}"` ✅ clean
- `pnpm lint` repo-wide ⚠️ 21 errors + 4 warnings — **all pre-existing** in `pricing-table-01/usage.tsx` (unescaped entities) + `file-tree/use-tree-virtual.ts` (React Compiler virtualizer warnings). NOT my code. Confirmed via `git log` on the affected files.
- `pnpm build` not run since C7. Re-run before C13 close.

## Components at-pause snapshot

- File count: **31 files** in `src/registry/components/navigation/sidebar-nav-01/` (matches plan §4 estimate)
- 12 prefab/render-prop slots (L14 — all 12 wired)
- 16 events declared (L20 — 12 wired; 4 deferred to C12)
- 22-method imperative handle (L21 — all 22 wired)
- 5 prefab parts exported (`<SidebarNav01>` + `<SidebarNav01Trigger>` + `<NavBadge>` + `<NavBrand>` + `<NavPrimaryAction>` + `<NavUser>` + `useSidebarNav01State`)
- 32 exported types

## Quick-resume command (sanity check)

```bash
cd e:/2026/ilinxaDOC/ilinxa-ui-pro && \
git log --oneline -15 | head -15 && \
pnpm tsc --noEmit && \
pnpm validate:meta-deps | tail -3
```

Expected: tip `8952fb7`; tsc clean; 48/48 meta-deps clean.

## Pause reason

User asked to pause for spot-check + lock the state. C10 was a substantial commit (5 interlocking pieces: storage + hook + state precedence + F1 + F2); good natural pause point before the C11 keyboard work (different concern, also substantial).
