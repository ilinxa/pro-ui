# Structure audit — app-sidebar v0.4.0 (2026-08-11)

verdict: findings-logged
artifact: 178.3 KB / budget not declared in meta.ts (see Owners)

## 1. Compound compliance (.claude/rules/compound-component-structure.md)

Compliant. `AppSidebarContext` (`contexts/sidebar-nav-context.tsx`) is a real headless-provider-style
context, and the parts that genuinely make sense standalone — `NavBadge`, `NavBrand`,
`NavPrimaryAction`, `NavUser`, `AppSidebarTrigger` — all read it (confirmed via grep: these 5 files
are the only ones under `parts/` importing `AppSidebarContext`/`useContext`) and are correctly
flat-exported from `index.ts:2-6`. The list-rendering internals (`SidebarNavList`/`SidebarNavRow`/
`SidebarNavSection`/`SidebarEmptyState`/etc.) are prop-driven and NOT exported — correctly so, since
they're tightly coupled to the keyboard-traversal/active-detection machinery and aren't plausible
standalone primitives (unlike e.g. `task-tree`'s equivalent gap in this same audit batch). No heavy
npm dep to gate (only `lucide-react`). No findings.

## 2. Dead / orphaned public API

None found. `lib/build-handle.ts` is the single source of truth shared by both the ref handle and
the headless `useAppSidebarState()` hook (v0.3.0/C5 consolidation, per its own doc comment) — and its
history shows real bug-fixing, not abandonment: `focusFirstItem`/`focusLastItem` were previously
silent no-ops and were fixed in the v0.3.1 review pass (`lib/build-handle.ts:99-102`) to resolve
against the actual keyboard-traversal sequence.

## 3. Undocumented prop semantics

**Finding — stale pre-ship scaffold commentary survives in two places, unremoved through 3+ shipped
minor versions.** `usage.tsx`'s very first section, titled "Status" (`usage.tsx:4-9`), reads:

> "C1 (scaffold + types) landed. Items + collapse + drawer + slots roll out across C2–C13. The full
> `AppSidebarProps` surface is already typed — your call sites compile against the final shape now."

This is the FIRST thing a consumer reads on the docs page, and it describes the component as an
early, still-under-construction scaffold — despite `meta.ts` showing `version: "0.4.0"`,
`createdAt: "2026-05-22"`, `updatedAt: "2026-08-11"`, and an extensive shipped v0.2/v0.3/v0.3.2
feature set. The same class of leftover checkpoint-label commentary also sits in the component's own
source directly above its definition (`app-sidebar.tsx:58-64`: *"C3 — items rendering + active
detection... Sections render their items inline (full section UI with header lands C4)..."*) — both
describe a mid-build state (checkpoints "C1"–"C13") that is long since complete. This isn't a
speculative nitpick: it's actively misleading content still live on the public docs page.

## 4. A11y baseline

No findings — skip-link wired (`app-sidebar.tsx:794`, `:848` — `<SidebarSkipLink onActivated=.../>`),
matches `meta.ts`'s "Full WAI-ARIA pattern, keyboard nav, skip-link, reduced-motion respect" claim,
and the v0.3.2 entry (`meta.ts:27`) documents a deliberate F-cross-13 defensive rewrite of the
collapsed-rail tooltip (dropped the shadcn Tooltip primitive for a local implementation specifically
to fix cross-backend delay-honoring) — evidence of active a11y/interop maintenance, not drift.

## 5. Weight & slice candidacy

Core folder (excl. `demo.tsx`/`dummy-data.ts`/`usage.tsx`/`meta.ts`): **4,254 LOC**. Top-3 files:
`app-sidebar.tsx` 818 (19.2% — the assembly/shell itself), `types.ts` 471 (11.1%),
`parts/nav-user.tsx` 250 (5.9%).

No coherent opt-in-capability axis clears the ≥20% bar — reported honestly rather than forced. The
mobile drawer is CSS-gated (both rail and drawer render from the same JSX tree; visibility toggles
via Tailwind breakpoint classes per `app-sidebar.tsx:42-56`), not a separable code path, so it isn't
LOC-attributable the way DnD/editing axes are in the other audited components. The collapsed-rail
tooltip (`parts/tooltip-wrapper.tsx`, 186 LOC, ~4.4%) is the closest thing to an optional capability
and is well under threshold. **Not a feature-slice candidate.**

## Owners

| Finding | Severity (🚫/⚠️/🔸/🔹) | Owner target |
|---|---|---|
| Stale pre-ship "C1 landed... C2–C13 roll out" scaffold commentary is the first thing shown in `usage.tsx`, plus matching leftover checkpoint labels in `app-sidebar.tsx`'s own doc comment | ⚠️ High | Next PATCH touch — delete both, replace with a real status line reflecting v0.4.0 |
| `meta.ts` has no `artifactBudgetKB` field (present on `card-tree`/`task-tree`/`story-viewer`/`gantt-timeline`, absent here); `src/registry/types.ts`'s `ComponentMeta` itself did not declare this field at time of audit — likely in-flight P3 work, not `app-sidebar`-specific | 🔸 Medium | Next PATCH touch — add once the P3 budget-field rollout lands on `types.ts` |
