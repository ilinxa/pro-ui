---
date: 2026-05-23
session: rich-sidebar-v0.2.0-additive-expansion
phase: shipping
type: feat
commits:
  - 7ac9824  # C1 types extension
  - 1399cef  # C2 lib/href-resolver.ts
  - 2a0f295  # C3 derive-visible-entries extension
  - ef66f9d  # C4 useFilteredNavSections hook + export
  - fc68fed  # C5 wire topSlot + href resolution + thread v0.2 gates
  - (this commit)  # C6 demo + usage + meta bump + registry + GATE 3 + STATUS + ship
components:
  - rich-sidebar (v0.1.1 → v0.2.0 ✅ SHIPPED)
status: shipped
---

# `rich-sidebar` v0.2.0 SHIPPED — additive expansion (topSlot + filter helpers + {key} templates) (2026-05-23)

> Strictly additive minor bump on v0.1.x. Zero breaking changes — every existing v0.1 consumer compiles + runs unchanged. Completes the same-day full-lifecycle session: GATE 1 → GATE 2 → C1–C6 implementation, on top of earlier `account-switcher-01` v0.1.0 ship which provides the canonical `topSlot` occupant.

## Surface delivered

**6 new optional `RichSidebarProps`** (locked L41–L52 + Q21):

```tsx
<RichSidebar
  // ... all v0.1 props unchanged ...
  topSlot={<AccountSwitcher01 ... />}            // L41
  hrefTemplateValues={{ slug: "acme" }}           // L42
  resolveHref={(item, vals) => /* ... */}        // L43 — wins precedence
  isOwner={membership.is_owner}                   // L52 — pairs with NavItem.ownerOnly
  currentMaxMembers={membership.account_max_members}  // L52 — pairs with NavItem.minMembers
  bypassFiltering={context.type === "personal"}  // Q21 — applies at BOTH section + item levels
/>
```

**2 new optional `NavItem` fields:**
- `ownerOnly?: boolean` (L44) — paired with `isOwner` sidebar prop
- `minMembers?: number` (L45) — paired with `currentMaxMembers` sidebar prop

**2 new public exports:**
- `type NavContext` (L48 + I-6) — discriminated union covering personal / business / platform / governance / cms-platform / cms-business
- `useFilteredNavSections({...})` (L47) — pure hook, items-only return per PQ1, memoized over 5 inputs per Q16

**Files touched (additive only):**
- 2 new files: `lib/href-resolver.ts` + `hooks/use-filtered-nav-sections.ts`
- 8 modified: `types.ts`, `lib/derive-visible-entries.ts`, `hooks/use-active-detection.ts`, `rich-sidebar.tsx`, `parts/sidebar-nav-list.tsx`, `parts/sidebar-nav-row.tsx`, `index.ts`, `meta.ts`, `demo.tsx`, `usage.tsx`, `registry.json`

## Re-validation findings delivered

All 6 findings from GATE 2 re-validation pass landed in code at the expected sites:

| Finding | Severity | Where delivered |
|---|---|---|
| F1 useControllableState mode-lock (account-switcher-01) | ⚠️ HIGH | (closed in sibling ship earlier today) |
| F2 §3.4 wording precision (account-switcher-01) | 🔸 Medium | (closed in sibling ship earlier today) |
| **F3 Set-based dedup for substituteTemplate** | ⚠️ HIGH | `lib/href-resolver.ts:39-65` |
| **F4 bypassFiltering at BOTH section + item levels** | 🔸 Medium | `lib/derive-visible-entries.ts` — shared `passesItemGates()` helper + section branch wrapped in `if (!bypassFiltering)` |
| **F5 Explicit defaults for new derive-visible-entries params** | 🔸 Medium | `lib/derive-visible-entries.ts:67-72` destructuring defaults |
| **F6 R16 reframe to Set reference instability** | 🔹 Low | `hooks/use-filtered-nav-sections.ts` JSDoc R16 callout |

## Why this matters

v0.2 lifts the missing app-shell substrate from kasder's socialmedia-adv-nav-system that v0.1 (migrated from the wrong source) didn't have. Specifically:

1. **Multi-context support** — `topSlot` makes the sidebar a true app-shell rather than a single-context primitive. Mounts `<AccountSwitcher01>` (just shipped) or any custom widget. Geographically distinct from v0.1's `headerSlot` (L41).

2. **Dynamic href templating** — `hrefTemplateValues` + `resolveHref` lets consumers maintain ONE `items` array across all contexts instead of N parallel arrays per business. Set-based dedup (Finding 3) avoids redundant `replaceAll` calls on duplicate placeholders.

3. **Three-gate filtering** — `ownerOnly` + `minMembers` join the existing `permission` gate (L46 intersection). Critical for plan-tier / role-aware nav. `bypassFiltering` provides a personal-context shortcut that applies coherently at both levels (Finding 4 prevents "section hidden, items visible" semantic inconsistency).

4. **Exportable helpers** — `type NavContext` + `useFilteredNavSections` let consumers stop hand-rolling the same 30-line filter logic per app. Hook is pure, memoized, and NOT coupled to `<RichSidebar>` — works standalone.

5. **Zero breaking changes** — Every v0.1.x consumer compiles + runs unchanged. The plan's strictly-additive contract held throughout; the C3 derive-visible-entries extension uses destructuring defaults (Finding 5) so v0.1 callers get byte-identical behavior.

## GATE 3 spot-check

[`docs/procomps/rich-sidebar-procomp/reviews/2026-05-23-v0.2.0-spotcheck.md`](../../docs/procomps/rich-sidebar-procomp/reviews/2026-05-23-v0.2.0-spotcheck.md)

**Verdict:** Pass with follow-ups. 4 findings; F-04 closed in-review:

- **F-01 🔸 Medium:** path-b consumer-tsc smoke deferred to post-deploy per project pattern; v0.2.1 patch reserved if F-cross-13 surfaces (none expected — no new shadcn primitives added)
- **F-02 🔹 Low:** v0.2 demo blocks appended after v0.1 demos; reorder at next major polish pass
- **F-03 🔹 Low:** `useFilteredNavSections` JSDoc could include `@example` block; v0.2.1 docs batch
- **F-04 🔹 Low ✅ CLOSED in-review:** demo `as never` cast replaced with proper `ReadonlyArray<SwitcherItem>` annotation before commit

**Rotating dimension chosen:** Public API. Reasoning: v0.2 is an additive minor bump touching public API in 6 ways + adding 2 new exports + 2 new NavItem fields. The contract must be (a) zero-breaking for v0.1.x consumers AND (b) honor Finding 4's "bypassFiltering applies at BOTH section + item levels" structural fix. Both verified.

## Validator state at C6 close

- `pnpm tsc --noEmit` — clean
- `pnpm lint` — clean for all rich-sidebar files
- `pnpm validate:meta-deps` — 49/49 clean (no new shadcn primitives or npm peers in v0.2; same surface as v0.1)
- `pnpm build` — clean (49 component paths prerender; rich-sidebar in the static list)
- `pnpm registry:build` — clean; rich-sidebar.json regenerated with the 2 new file paths

## Sibling-of relationship

`account-switcher-01` v0.1.0 (shipped earlier this same session) is the canonical occupant of `topSlot`. Composition demonstrated in the new V02MultiContextDemo. Both procomps are **independently installable** via the shadcn registry — `internal: []` on both `meta.ts`. The cross-procomp composition happens at the consumer's app code, matching the `todo-rich-card ↔ todo-tree` pattern from 2026-05-20/21.

## What unblocks now

1. **Push to origin/master** — 17 commits ahead (rename + state-lock + GATE 1 close + GATE 2 plans + 7 account-switcher-01 C1–C7 + STATUS refresh + 5 rich-sidebar v0.2 C1–C5 + this C6 ship). Vercel auto-deploy will regenerate the catalog + publish the v0.2.0 artifact at `https://ilinxa-proui.vercel.app/r/rich-sidebar.json`.
2. **Path-b smoke against the live Vercel artifact** — both `rich-sidebar` v0.2.0 AND `account-switcher-01` v0.1.0 will run smoke; same-day F-cross-13 patch loop reserved for v0.2.1 / v0.1.1 respectively if hits surface.
3. **Foldback** — when convenient, fold the v0.2.0 description + plan addenda back into the base description + plan files per Appendix C of each addendum. Not blocking; can be a separate housekeeping commit.

## References

- v0.2.0 description addendum: [`docs/procomps/rich-sidebar-procomp/rich-sidebar-procomp-description-v0.2.0.md`](../../docs/procomps/rich-sidebar-procomp/rich-sidebar-procomp-description-v0.2.0.md)
- v0.2.0 plan addendum: [`docs/procomps/rich-sidebar-procomp/rich-sidebar-procomp-plan-v0.2.0.md`](../../docs/procomps/rich-sidebar-procomp/rich-sidebar-procomp-plan-v0.2.0.md)
- GATE 1 close (combined): [`2026-05-23-gate-1-close-account-switcher-and-rich-sidebar-v0.2.md`](2026-05-23-gate-1-close-account-switcher-and-rich-sidebar-v0.2.md)
- GATE 2 plans close (combined): [`2026-05-23-gate-2-plans-account-switcher-and-rich-sidebar-v0.2.md`](2026-05-23-gate-2-plans-account-switcher-and-rich-sidebar-v0.2.md)
- Sibling ship (same session): [`2026-05-23-account-switcher-01-v0.1.0-first-ship.md`](2026-05-23-account-switcher-01-v0.1.0-first-ship.md)
- GATE 3 spot-check: [`docs/procomps/rich-sidebar-procomp/reviews/2026-05-23-v0.2.0-spotcheck.md`](../../docs/procomps/rich-sidebar-procomp/reviews/2026-05-23-v0.2.0-spotcheck.md)
- Migration analysis: [`docs/migrations/socialmedia-adv-nav-system/analysis.md`](../../docs/migrations/socialmedia-adv-nav-system/analysis.md)
- Component-readiness review rule: [`.claude/rules/component-readiness-review.md`](../rules/component-readiness-review.md)
