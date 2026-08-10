# ⏸ HANDOFF — rich-sidebar renamed + v0.2.0 / account-switcher-01 GATE 1 drafted (2026-05-23)

> **Status:** paused with two GATE 1 description docs drafted + revalidation-passed + improvements-over-source sections appended. Awaiting user sign-off on the Q-Ps in both docs before authoring GATE 2 plans. The rename (sidebar-nav-01 → rich-sidebar) is committed locally as `66072fd` but **not pushed**.

## Read-first on resume

1. **This file** (the punch list)
2. [`docs/procomps/account-switcher-01-procomp/account-switcher-01-procomp-description.md`](../docs/procomps/account-switcher-01-procomp/account-switcher-01-procomp-description.md) — new procomp v0.1.0 description (~300 lines)
3. [`docs/procomps/rich-sidebar-procomp/rich-sidebar-procomp-description-v0.2.0.md`](../docs/procomps/rich-sidebar-procomp/rich-sidebar-procomp-description-v0.2.0.md) — additive v0.2 addendum to existing v0.1 base (~310 lines)
4. [`docs/migrations/socialmedia-adv-nav-system/analysis.md`](../docs/migrations/socialmedia-adv-nav-system/analysis.md) — the deep-dive analysis the GATE 1 docs are built on (~700 lines, includes re-validation log §11)

## Where we are

| Item | State |
|---|---|
| Hard rename `sidebar-nav-01` → `rich-sidebar` (slug + folder + all exports + procomp docs + STATUS + component-versions + memory) | ✅ Committed `66072fd`. **Not pushed.** |
| Migration intake `docs/migrations/socialmedia-adv-nav-system/` (14 source files + source-notes + analysis) | ✅ Committed (was uncommitted, folded into the rename commit) |
| Re-validation pass on analysis.md (11 findings — all applied) | ✅ Committed |
| account-switcher-01 GATE 1 description drafted | ✅ Local, uncommitted |
| rich-sidebar v0.2.0 description addendum drafted | ✅ Local, uncommitted |
| Self-revalidation pass on GATE 1 drafts (9 findings — all applied) | ✅ Applied in-place |
| Cross-consistency check (description vs original source) | ✅ Done; 8 + 7 deliberate improvements documented as Appendix A in each doc |
| account-switcher-01 GATE 1 sign-off (7 Q-Ps) | ⏸ Pending user |
| rich-sidebar v0.2.0 GATE 1 sign-off (6 Q-Ps) | ⏸ Pending user |
| GATE 2 plans (both procomps) | ⏸ Not started — blocked on sign-off |
| Implementation | ⏸ Not started — blocked on GATE 2 plans |

## Pending Q-Ps awaiting user sign-off

### account-switcher-01 (7 Q-Ps; Q3 was promoted to L6 lock during revalidation)

| # | Question | My default |
|---|---|---|
| Q1 | Empty `items` + no `fallbackActiveItem` — what shows? | Disabled button with placeholder text |
| Q2 | Duplicate-key violation behavior | dev-warn + strip duplicates |
| Q4 | Collapsed-mode popover side | right-then-flip (Radix auto-collision) |
| Q5 | `aria-current` value on active item | `"true"` |
| Q6 | Expose controlled-open prop? | Internal-only in v0.1 |
| Q7 | Footer separator — always or only when slot present? | Only when present |
| Q8 | `Enter` AND `Space` both activate items? | Both |

### rich-sidebar v0.2.0 (6 Q-Ps; Q18 + Q20 struck during revalidation)

| # | Question | My default |
|---|---|---|
| Q15 | Final slot name (`topSlot` vs alternatives) | `topSlot` |
| Q16 | `useFilteredNavSections` memoized hook vs pure function? | Memoized hook |
| Q17 | `resolveHref` callback signature — pass `templateValues` as 2nd arg? | Yes |
| Q19 | Dev-warn on `{xxx}` placeholders without matching values? | Yes, warn on missing (not on unused) |
| Q21 | `bypassFiltering` bypass ALL gates or just permission gates? | Three permission gates only; `hidden: true` still respected |
| Q22 | Ship `validateNavContextConfig()` runtime helper? | No — v0.3+ candidate |

**Quick sign-off form:** `"Accept all defaults across both docs"` closes both GATE 1s and unblocks GATE 2 plan authoring. Or call out specific Q-Ps you'd answer differently.

## Locked decisions (just so they're easy to see at-a-glance)

### account-switcher-01 (L1–L12)

L1 SwitcherItem `{key, label, icon?, href?}` · L2 single items array (consumer ordering) · L3 dual-entry via distinct keys (Q2 picks violation behavior) · L4 `fallbackActiveItem?` prop · L5 arbitrary `footerSlot: ReactNode` · L6 library no-ops on active clicks · L7 combobox + button-list aria · L8 Popover primitive · L9 width-matches-trigger · L10 `isCollapsed?` icon-only trigger · L11 F-cross-13 typeof-guard from day one · L12 generic naming.

### rich-sidebar v0.2.0 (L41–L52, continuing v0.1's L1–L40)

L41 single `topSlot` (geographically distinct from v0.1 `headerSlot`) · L42 `{key}` arbitrary placeholder via `String.replaceAll` · L43 prop + callback (callback wins) · L44 `ownerOnly` paired with `isOwner` · L45 `minMembers` paired with `currentMaxMembers` · L46 three intersection gates · L47 `useFilteredNavSections({ sections, permissions?, isOwner?, currentMaxMembers?, bypassFiltering? })` · L48 `type NavContext` re-exported, no `useNavContext` hook · L49 collapse-to-icon mode stays (ilinxa extension) · L50 permission-drift asymmetric (BE→FE) · L51 no URL routing in library · L52 raw scalars (not opaque membership).

## Improvements over source documented

Both descriptions now have explicit "Improvements over source" appendices that enumerate every deliberate deviation:

- **account-switcher-01 Appendix B** — 8 improvements (I-1 through I-8). Examples: `fallbackActiveItem` avoids governance-mislabel, F-cross-13 pre-emption from day one, icon type widened beyond LucideIcon, `aria-current` added (source has none).
- **rich-sidebar v0.2.0 Appendix A** — 7 improvements (I-1 through I-7). Examples: generalized `{key}` template (source `{slug}` only), `resolveHref` callback escape hatch, pure helper hook with explicit inputs, raw scalar props instead of opaque membership object, exported `NavContext` type.

These appendices are the audit trail — if a reviewer later asks "why does the library do X when the source did Y?", the answer is in those tables.

## What remains (post-sign-off)

1. **GATE 2 plan for account-switcher-01** — file layout, commit chain, internal types, default value resolutions, demo plans. Probably 6-8 commits (smaller than rich-sidebar's 13).
2. **GATE 2 plan for rich-sidebar v0.2.0** — additive file changes (new `lib/href-resolver.ts`, expand `derive-visible-entries.ts`, new `hooks/use-filtered-nav-sections.ts`, slot wiring, demo update). 5-8 commits expected.
3. **Implementation in commit chains** — both procomps land in the same session likely.
4. **Push** — 1+ uncommitted commits already (the rename + this work). Plus future GATE 2 + impl commits. Push gated on user "go".

## Validator state at pause

- `pnpm tsc --noEmit` ✅ clean (last verified post-rename commit)
- `pnpm validate:meta-deps` ✅ 48/48 clean (last verified post-rename commit)
- `pnpm lint --quiet "src/registry/components/navigation/rich-sidebar/**/*.{ts,tsx}"` ✅ clean
- `pnpm build` ✅ clean (57 static pages, `/components/rich-sidebar` in route table)
- Dev server: `/components/rich-sidebar` → 200, `/components/sidebar-nav-01` → 404 (intended)

## Pause reason

User-requested pause. Two non-trivial GATE 1 description docs are complete + cross-checked against the original source + revalidation-passed + improvements-over-source documented. The next step is a small synchronous decision (Q-P sign-off) that the user prefers to handle in a fresh session.

## Quick-resume checklist

```bash
cd e:/2026/ilinxaDOC/ilinxa-ui-pro
git log --oneline -3
# Expected: pause-state-lock commit ATOP 66072fd rename ATOP 1dcc93e v0.1.1
pnpm tsc --noEmit && pnpm validate:meta-deps | tail -3
# Expected: tsc clean + 48/48 meta-deps clean
```

Then:
1. Read this file.
2. Read both descriptions.
3. Either sign off the Q-Ps ("accept defaults") OR call out the ones you'd answer differently.
4. After sign-off → author GATE 2 plans.
