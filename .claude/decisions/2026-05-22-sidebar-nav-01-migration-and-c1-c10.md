---
date: 2026-05-22
session: sidebar-nav-01 build out (migration intake → C10/13)
phase: in-progress (paused at C10)
type: migration + new-component build
commits:
  - 39a03bc  # C1 scaffold + types + intake + GATE 1/2 docs
  - b35acce  # C2 reducer + state hook + context provider
  - 2676cfd  # C3 items rendering + active detection
  - e59349a  # C4 sections
  - 980f15c  # C5 collapse + CSS vars + activeVariant matrix
  - 5f7dd89  # C6 NavBadge + tooltip-on-collapsed
  - ed2e7d9  # fix C7 quote escaping
  - 7062c16  # C7 mobile drawer + SidebarNav01Trigger
  - 11d77ff  # fix duplicate header rows
  - f6e1b0e  # fix useImperativeHandle + simplify trigger
  - 0a09379  # C8 prefab parts
  - e198bf0  # fix Slot composition in NavUser
  - fcf79bf  # C9 loading + empty + L39 branching
  - 8952fb7  # C10 storage + headless hook + state precedence + F1/F2
components:
  - sidebar-nav-01
findings: 62-finding-cumulative-pause
status: paused, resume via HANDOFF-2026-05-22-sidebar-nav-01-paused-after-c10
---

# sidebar-nav-01 — migration + C1–C10 (paused 2026-05-22)

Active handoff: [`HANDOFF-2026-05-22-sidebar-nav-01-paused-after-c10.md`](../HANDOFF-2026-05-22-sidebar-nav-01-paused-after-c10.md). This decision file is the long-form record.

## What this session covered

A from-zero procomp build:

1. **Migration intake** (`docs/migrations/social-nav-system/`) from kasder's social-nav files
2. **GATE 1 description** (40 locks across 26 core + 14 audit-pass extensions)
3. **GATE 2 plan** (50 locks across 43 inheritance + 7 plan-stage additions including 2 net-new UX features)
4. **C1–C10 of the 13-commit chain** (10 commits + 6 inline fixups)

Total: **62 substantive findings** surfaced and folded back across 4 audit passes (migration analysis + GATE 1 + GATE 2 + plan revalidation). Validators clean across every commit. Component visually-real on the docs page at pause.

## Decisions that matter for resume / future ports

### Migration architecture

- Two sibling procomps in `navigation/` category, NOT a single shell — `sidebar-nav-01` + `bottom-tab-bar-01` (queued after this closes). Shared `<NavBadge>` + `NavItem` schema live in `sidebar-nav-01/parts/` and `sidebar-nav-01/types`; `bottom-tab-bar-01` imports via **relative paths** per F-S1 lock (battle-tested across todo-rich-card↔todo-tree and rich-card-in-flow).
- 80% rewrite / 20% direct visual port. Design DNA preserved verbatim (collapse rhythm, badge corner-flip-on-collapse, badge tone-shift-on-active, dropdown align-flip, triple-signal bottom-nav active state). Structure + dynamism + a11y + portability fully rewritten.

### v0.1 surface — locked feature-complete

50 locks total. Single feature-complete v0.1 — no v0.2/v0.3 deferrals. Same posture as todo-tree.

- Items as discriminated union `NavEntry = NavItem | NavSection | NavSeparator`
- 12 slots / 4 prefab parts / 16 events / 22-method imperative handle
- 5 `activeVariant` modes / 11 CSS variables for theming
- localStorage opt-in via `storageKey` with versioned schema
- Headless `useSidebarNav01State` hook
- F1 autoExpandActiveSection (default true) — net-new in the plan audit
- F2 autoScrollActiveIntoView (default true) — net-new in the plan audit

### The architectural seam — context bridge vs explicit ref

`SidebarNav01Context.Provider` is rendered INSIDE `<SidebarNav01>`'s own subtree, so siblings can't read it. Mobile-drawer trigger pattern (the primary use case) requires `<SidebarNav01Trigger controls={ref}>` with an explicit ref to the sidebar.

A future `<SidebarNav01Provider>` wrapper (consumer wraps both sidebar + trigger as descendants) would enable cross-tree context-bridge triggers. Not blocking v0.1. Documented in `parts/sidebar-nav-trigger.tsx` JSDoc.

### CSS-gated mobile breakpoint (L44)

Original plan had JS-gated rendering via `useMatchMedia`. Mobile devices would flash desktop sidebar before useEffect ran. Audit P1 caught this; rewrote to CSS-only (`hidden lg:flex` + `lg:hidden`). Both DOM trees render; CSS hides one. `useMatchMedia` narrowed to JS BEHAVIOR gating only (`autoCloseMobileOnNavigate`).

### React Compiler 19 — no manual `React.memo`

`todo-tree/parts/` has zero `React.memo` usages despite being the largest procomp. The compiler handles row-level memoization automatically. Plan §18.1 originally specified `React.memo` on `<SidebarNavRow>`; dropped at C5 polish.

### F-cross-13 — three carriers pre-emptively defensive

Tooltip + Sheet + DropdownMenu all wired with the project's defensive pattern:
- Tooltip: passes BOTH `delayDuration` (Radix) AND `delay` (Base UI) with `@ts-expect-error`
- Sheet: `onOpenChange` runtime typeof-check before mutating
- DropdownMenu: `onOpenChange` typeof-check; `onSelect` arg typed `unknown`

C13 path-b smoke expected to surface 1–3 carrier hits per the established same-day-patch pattern.

### Three-defenses correction (audit C-1)

Original analysis claimed all three defenses apply to controlled-mode wiring. Audit revealed: for **discrete boolean state** (collapse / mobileOpen), only Defenses 1 + 2 apply. Defense 3 (suppress-mid-flow) has no continuous flow to suppress for a discrete toggle. The 300ms CSS transition is decorative, not an event source.

### Slot composition pitfalls (caught at C8 review)

`asChild` + `<TooltipWrapper>` (custom non-Slot-aware component) — Radix Slot can't propagate trigger props through arbitrary React components. **Fix:** drop the Tooltip wrap; aria-label is the a11y net.

`asChild` + `<Fragment>` containing IIFE — Slot requires a single React element child; Fragment isn't one. **Fix:** drop the Fragment wrapper; render the IIFE result directly.

### State precedence trade-off (L30 + L47)

When external `state` provided to `<SidebarNav01>`, the external value wins for all derived references. Internal reducer still computed for hooks-rules compliance but output discarded.

**Trade-off:** Sheet `onOpenChange` and auto-close-on-navigate route through `finalHandle.closeMobile()` which uses reason `"imperative"`. Loses the `"outside-click"` and `"item-click"` reason discriminators. Polish for a follow-up via `setMobileOpenWithReason` handle method.

## Methodology learnings worth memorializing

### Re-validation pass is non-negotiable

Per `feedback_re_validation_pass_catches_real_issues`: 4 audit passes ran in this session (migration analysis, GATE 1, GATE 2, GATE 2 plan revalidation) and ALL surfaced substantive findings:
- Migration analysis: 23 findings → folded as ML1–ML22 locks
- GATE 1 audit: 22 findings → folded as L27–L40 + Q11–Q14
- GATE 2 audit: 17 findings → folded as L41–L48 + PQ7–PQ8 (including F1 + F2 net-new features)
- C5/C6/C7 review: 2 real bugs caught (duplicate header rows + ref-not-wired)
- C8 review: 2 more bugs caught (DropdownMenu Slot composition + Fragment around LinkComponent)
- C9 review: clean (1 forward-compat note)
- C10 review: pending (paused before)

Total **62 findings** across the 4 audit passes + 4 inline-fix passes. Every audit produced real changes. The user's repeated request to "review the previous step and confirm everything is perfectly matched and consistent" reinforced this discipline. **Never rubber-stamp.**

### Inline corrections + appendix pattern

For long planning docs that go through audit passes, the pattern that worked well was:
1. **Inline corrections** for narrow wording fixes — applied directly to the body text via Edit
2. **Appendix at end** with the full finding-by-finding table + corrections list + locks + Q-Ps
3. Header note at top of doc pointing to the appendix

Keeps the original analysis readable as a snapshot of initial thinking; appendix records the delta as a clear-to-review block. Don't rewrite the body wholesale.

## File inventory at pause

```
src/registry/components/navigation/sidebar-nav-01/
├── sidebar-nav-01.tsx
├── types.ts
├── index.ts                    # exports SidebarNav01 / Trigger / NavBadge / NavBrand / NavPrimaryAction / NavUser / useSidebarNav01State + 22 types
├── meta.ts                     # 5 shadcn deps (tooltip, sheet, avatar, button, dropdown-menu), 1 npm (lucide-react@^1.11.0)
├── dummy-data.ts               # flat + sectioned variants + currentPath
├── demo.tsx                    # 4 demo blocks (activeVariant switcher + kasder recipe + flat + sectioned + mobile drawer)
├── usage.tsx                   # C1-era; final polish in C13
├── contexts/
│   └── sidebar-nav-context.tsx
├── hooks/
│   ├── use-active-detection.ts
│   ├── use-match-media.ts            # SSR-safe useSyncExternalStore
│   ├── use-sidebar-nav-state.ts      # public hook
│   ├── use-sidebar-reducer.ts        # Defense 1+2 wiring
│   └── use-storage-sync.ts           # opt-in localStorage with debounce
├── lib/
│   ├── active-variant-classes.ts     # 5 variants
│   ├── badge-format.ts
│   ├── compute-active-item.ts        # L42 longest-prefix tie-break
│   ├── derive-avatar-fallback.ts     # initials per L35
│   ├── derive-css-vars.ts            # 11 vars
│   ├── derive-visible-entries.ts     # permissions + hidden filter
│   ├── sidebar-reducer.ts            # 11 actions exhaustive
│   └── storage-schema.ts             # versioned
└── parts/
    ├── default-link.tsx              # <a href> wrapper
    ├── icon.tsx                      # ReactNode | ComponentType render
    ├── nav-badge.tsx                 # SHARED — bottom-tab-bar-01 will import via relative
    ├── nav-brand.tsx                 # collapse-aware
    ├── nav-primary-action.tsx        # collapse-aware
    ├── nav-user.tsx                  # status dot + DropdownMenu (F-cross-13)
    ├── sidebar-empty-state.tsx       # 4 reason variants
    ├── sidebar-loading-skeleton.tsx  # 6 shimmer rows
    ├── sidebar-nav-list.tsx          # NavEntry rendering + click sequence
    ├── sidebar-nav-row.tsx           # full L29 args
    ├── sidebar-nav-section.tsx       # collapsible header
    ├── sidebar-nav-separator.tsx
    ├── sidebar-nav-trigger.tsx       # companion; controls ref or context
    └── tooltip-wrapper.tsx           # F-cross-13 defensive
```

**31 files in sealed folder** (matches plan §4 estimate).

## Next session (resume)

Per HANDOFF: C11 (keyboard handler + skip link + permissions diff) → C12 (deferred event wiring + RTL polish) → C13 (registry.json + STATUS + spotcheck + path-b smoke). Estimated ~25-30 more tool calls + 3 commits + 1-2 same-day patch commits for F-cross-13 fallout.
