---
date: 2026-05-23
session: gate-2-plans-account-switcher-and-rich-sidebar-v0.2
phase: planning
type: doc-only
commits:
  - 9a9ff0b  # GATE 1 close (prior in this session)
  - (this commit)  # GATE 2 plans drafted + re-validated + closed + signed off
components:
  - account-switcher-01 (v0.1.0 GATE 2 ✅ closed)
  - rich-sidebar (v0.2.0 GATE 2 ✅ closed)
status: gate-2-closed
---

# GATE 2 plans closed — `account-switcher-01` v0.1.0 + `rich-sidebar` v0.2.0 (2026-05-23)

> Authored two GATE 2 plan documents in parallel after GATE 1 closure earlier in the same session. Re-validation pass surfaced 6 findings (2 ⚠️ HIGH + 3 🔸 Medium + 1 🔹 Low); all applied in-place before sign-off. User signed off "Accept all 10 PQ defaults — close both GATE 2s". Both implementation chains (C1–C7 for account-switcher-01; C1–C6 for rich-sidebar v0.2.0) unblocked.

## Plans drafted

| Plan | File | LOC | Commits | New files | Modified files |
|---|---|---|---|---|---|
| account-switcher-01 v0.1.0 | [`docs/procomps/account-switcher-01-procomp/account-switcher-01-procomp-plan.md`](../../docs/procomps/account-switcher-01-procomp/account-switcher-01-procomp-plan.md) | ~870 | 7 (C1–C7) | 11 (sealed folder from scratch) | — |
| rich-sidebar v0.2.0 (addendum) | [`docs/procomps/rich-sidebar-procomp/rich-sidebar-procomp-plan-v0.2.0.md`](../../docs/procomps/rich-sidebar-procomp/rich-sidebar-procomp-plan-v0.2.0.md) | ~440 (addendum) | 6 (C1–C6) | 2 (`lib/href-resolver.ts` + `hooks/use-filtered-nav-sections.ts`) | 8 |

## Re-validation pass — 6 findings applied

### account-switcher-01 plan (2 findings)

**Finding 1 (⚠️ HIGH) — `useControllableState` mode-lock**
- Issue: Hook re-evaluated `isControlled = value !== undefined` per render. Consumer flickering `open` between undefined ↔ boolean would silently switch modes — classic React controlled/uncontrolled anti-pattern.
- Fix applied: Added `wasControlledRef` + `useEffect` dev-warn on mode transitions. Plus a second dev-warn when controlled mode is used without `onChange` (popover would appear frozen). Both warns dev-only (tree-shaken in prod).

**Finding 2 (🔸 Medium) — §3.4 wording precision**
- Issue: "Popover content rendering is identical in collapsed vs expanded mode" misleading; positioning + width DO differ.
- Fix applied: Clarified to "list rows + footer slot render identically; only positioning + width differ."

### rich-sidebar v0.2.0 plan (4 findings)

**Finding 3 (⚠️ HIGH) — `substituteTemplate` efficiency + diagnostic dedup**
- Issue: Loop iterated `matchAll` results, calling `replaceAll` per match → duplicate placeholders triggered redundant calls; missing-keys dev-warn could double-log.
- Fix applied: Set-based dedup of placeholders + missing keys. Work scales with distinct placeholders, not total occurrences.

**Finding 4 (🔸 Medium) — `bypassFiltering` scope inconsistency**
- Issue: Plan §6 documented item-level branch but didn't state `bypassFiltering` also applies to section-level permission gate. Without that, a section with `permission` could drop while items remain → "section disappears, children stay" inconsistency.
- Fix applied: New §6.3 explicit on `bypassFiltering` wrapping BOTH section + item perm gates. Semantics: "bypass = show everything not explicitly `hidden: true`" at both levels.

**Finding 5 (🔸 Medium) — Explicit defaults for new params**
- Issue: §6 added 3 new optional params but didn't specify body-level defaults. C3 verification ("v0.1 callers unchanged") relies on defaults; should be explicit.
- Fix applied: New §6.1 documents destructuring defaults `isOwner = false`, `currentMaxMembers = Infinity`, `bypassFiltering = false`.

**Finding 6 (🔹 Low) — R16 reframe**
- Issue: R16 covered "Popover outside-click closes on sidebar clicks" — by-design Radix behavior, not a v0.2 risk.
- Fix applied: R16 replaced with the real Medium risk: `permissions: ReadonlySet<string>` rebuilt per render invalidates the `useFilteredNavSections` memo. Mitigation = consumer-side `useMemo` guidance in demo + guide.md.

## 10 plan-stage Q-Ps resolved at default

### account-switcher-01 PQ1–PQ5

| # | Resolution |
|---|---|
| **PQ1** | ✅ Expose `collapsedPopoverSide?` prop (dynamicity-positive; 1-line cost; default `"right"`) |
| **PQ2** | ✅ Do NOT expose `disableKeyValidation?` (out of v0.1 scope) |
| **PQ3** | ✅ Emit `data-active="true"` on row regardless of `ariaCurrent` value (CSS-hook continuity) |
| **PQ4** | ✅ Compose trigger `aria-label` with active label ("..., current: <label>") |
| **PQ5** | ✅ Render footer OUTSIDE the listbox `<ul>` (keyboard nav scope discipline) |

### rich-sidebar v0.2.0 PQ1–PQ5

| # | Resolution |
|---|---|
| **PQ1** | ✅ `useFilteredNavSections` returns items-only (no diagnostics) |
| **PQ2** | ✅ `resolveHref` strict `string` return type |
| **PQ3** | ✅ Wrap `topSlot` in unlabeled `<div>` (no role / aria-label) |
| **PQ4** | ✅ No boundary warn on empty `hrefTemplateValues={}` (only at substitution site) |
| **PQ5** | ✅ `bypassFiltering` + `keepEmptySections` independent / composable |

## Why this matters

These two plans set the implementation contracts for the day's work-in-progress:

1. **account-switcher-01 is a new procomp** mounted as the canonical occupant of rich-sidebar's new `topSlot`. Per the dynamicity-primacy rule (and the GATE 1 re-validation findings earlier in this session), the controlled-open triplet ships from v0.1 with proper mode-lock dev-warns — preventing the subtle React anti-pattern of silent controlled↔uncontrolled mode-flip that Finding 1 surfaced.

2. **rich-sidebar v0.2.0 is strictly additive** — every v0.1.x consumer compiles unchanged. The plan addendum sits on top of the existing v0.1 plan; only the delta is documented. Finding 4 caught a subtle semantic inconsistency in the `bypassFiltering` semantic (sections vs items) that would have surfaced as a real UX bug if shipped (section disappears while items remain).

3. **The two procomps compose without coupling.** Zero hard registry dependency: `internal: []` on both `meta.ts` files. The composition lives at the consumer's app code (drop `<AccountSwitcher01>` into `<RichSidebar topSlot={...} />`). Matches the `todo-rich-card ↔ todo-tree` sibling pattern from 2026-05-20/21.

## What unblocks now

Implementation chains:

### account-switcher-01 (C1–C7, ~7 commits)

```
C1: scaffold + types (pnpm new:component navigation/account-switcher-01)
C2: pure lib helpers (resolve-active-item.ts, enforce-unique-keys.ts)
C3: useControllableState hook (with mode-lock + onChange-missing dev-warns)
C4: main component + parts (account-switcher-01.tsx + 3 parts files)
C5: dummy data + manifest.ts + meta.ts deps
C6: demo + usage + dev page renders
C7: registry.json entries + GATE 3 spotcheck + v0.1.0 ship + decision file + STATUS
```

### rich-sidebar v0.2.0 (C1–C6, ~6 commits)

```
C1: v0.2.0 types (NavContext + ownerOnly + minMembers + new RichSidebarProps)
C2: lib/href-resolver.ts (new file)
C3: extend derive-visible-entries.ts (3 new gates; v0.1 callers unchanged)
C4: useFilteredNavSections hook + export
C5: wire topSlot + href resolution into render path
C6: v0.2.0 demo + usage + version bump + registry + ship + GATE 3 spotcheck
```

Both chains can run in parallel or sequentially; account-switcher-01 ships first will let the rich-sidebar v0.2.0 demo (C6) consume the published artifact directly. Sequential order (switcher first, then v0.2) is the safer default unless the user wants concurrent commits.

## Files touched this commit

- `docs/procomps/account-switcher-01-procomp/account-switcher-01-procomp-plan.md` — new (~870 LOC)
- `docs/procomps/rich-sidebar-procomp/rich-sidebar-procomp-plan-v0.2.0.md` — new (~440 LOC)
- `.claude/STATUS.md` — Recent activity pointer + queue rows
- `.claude/decisions/2026-05-23-gate-2-plans-account-switcher-and-rich-sidebar-v0.2.md` — this file
- Memory: `project_rich_sidebar_v02_and_account_switcher_gate_1.md` (renamed/updated to cover GATE 2 closure too)

## Validator state at close

- `pnpm tsc --noEmit` — clean (doc-only changes).
- `pnpm validate:meta-deps` — 48/48 clean.
- Working tree post-commit: 4 commits ahead of `origin/master` (rename + state-lock + GATE 1 close + GATE 2 close).

## References

- Prior decision (GATE 1 close): [`2026-05-23-gate-1-close-account-switcher-and-rich-sidebar-v0.2.md`](2026-05-23-gate-1-close-account-switcher-and-rich-sidebar-v0.2.md)
- Pre-pause decision: [`2026-05-23-rich-sidebar-rename-plus-v0.2-gate-1-drafts.md`](2026-05-23-rich-sidebar-rename-plus-v0.2-gate-1-drafts.md)
- v0.1 plan (base for v0.2 addendum): [`rich-sidebar-procomp-plan.md`](../../docs/procomps/rich-sidebar-procomp/rich-sidebar-procomp-plan.md)
- Migration analysis: [`docs/migrations/socialmedia-adv-nav-system/analysis.md`](../../docs/migrations/socialmedia-adv-nav-system/analysis.md)
- Component-readiness review rule (GATE 3 awaits): [`.claude/rules/component-readiness-review.md`](../rules/component-readiness-review.md)
