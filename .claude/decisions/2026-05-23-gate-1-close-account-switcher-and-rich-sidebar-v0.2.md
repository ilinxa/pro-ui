---
date: 2026-05-23
session: rich-sidebar-v0.2-and-account-switcher-gate-1-close
phase: planning
type: doc-only
commits:
  - 66072fd  # rename: sidebar-nav-01 → rich-sidebar (prior session)
  - 95ffa0c  # pause state lock + GATE 1 drafts (prior session)
  - (this commit)  # GATE 1 close — both procomps, dynamicity-primacy re-validation findings applied
components:
  - rich-sidebar (v0.2.0 GATE 1 ✅ closed)
  - account-switcher-01 (v0.1.0 GATE 1 ✅ closed; new procomp)
status: gate-1-closed
---

# GATE 1 close — `account-switcher-01` v0.1.0 + `rich-sidebar` v0.2.0 (2026-05-23)

> Resumed from the prior session's pause state-lock (`95ffa0c`). Re-validated the 13 Q-P defaults against the **A+ / performance / fully-dynamic-and-customizable** bar before sign-off. Two findings surfaced (both on account-switcher-01) and were applied in-place. User signed off "Apply both — then accept all defaults". GATE 1 is closed on both procomps.

## Resume validation (start-of-session)

- `git log --oneline -3` → tip `95ffa0c` (pause state-lock) → `66072fd` (rename) → `1dcc93e` (rich-sidebar v0.1.1 hydration fix). Matches the HANDOFF expected state.
- Working tree clean. 2 commits ahead of `origin/master`.
- `pnpm tsc --noEmit` → clean.
- `pnpm validate:meta-deps` → 48/48 clean.
- HANDOFF doc + prior decision file both present.

## Re-validation pass on the 13 Q-P defaults

Per `feedback_re_validation_pass_catches_real_issues`, the proposed defaults were stress-tested against:

1. **Dynamicity-primacy** — `feedback_dynamicity_reusability_primacy`: "default to open API surfaces; 'add it later' is a breaking change."
2. **Performance** — referentially-stable outputs, memoization, downstream re-render impact.
3. **A+ component grade** — semver hygiene, semantic correctness, full keyboard/aria coverage.
4. **Customizability** — every behavior with plausible consumer-side variation should be an open prop, not a hardcoded internal.

**Outcome:** 11 of 13 defaults validated as best-in-class. 2 defaults flagged (both on account-switcher-01) and changed before close.

### Findings applied

**Finding 1 — Q6: Controlled-open triplet (🚫 dynamicity violation)**
- Original default: keep open-state internal-only in v0.1; expose controlled props in v0.2 if asked.
- **Why it failed the bar:** The dynamicity-primacy rule explicitly calls out "add it later is a breaking change." Shipping a popover primitive in v0.1 with NO programmatic open path forces consumers wanting Cmd+K openers / onboarding flows / multi-switcher sync / test harnesses to either fork or wait for v0.2. The cost to expose is ~5 lines (Radix Popover already supports controlled+uncontrolled natively).
- **Resolution:** Promoted Q6 to **L13**: ship the canonical Radix-pattern triplet `open?: boolean` / `defaultOpen?: boolean` / `onOpenChange?: (next: boolean) => void` from v0.1. Uncontrolled by default. `onOpenChange` F-cross-13 typeof-guarded per L11.

**Finding 2 — Q5: Programmable `aria-current` value (🔸 dynamicity polish)**
- Original default: hardcode `aria-current="true"` on the active item.
- **Why it failed the bar:** `"true"` IS the correct default value (switcher isn't navigation in the page sense), but hardcoding it kills dynamicity for a one-line cost. Consumers using the switcher for nav-style sub-mode flows would want `"page"`; stepper-style usages would want `"step"`; rare cases want to suppress the attribute entirely.
- **Resolution:** Promoted Q5 to **L14**: expose `ariaCurrent?: "true" | "page" | "step" | "location" | "date" | "time" | false` with `"true"` default. Default semantic unchanged; consumer override is now possible.

### Validated as best-in-class (11 of 13)

| Q | Default | Rationale |
|---|---|---|
| **Q1** | (b) disabled placeholder when items empty + no fallback | Only non-crashing option; `fallbackActiveItem` is the configurable escape hatch |
| **Q2** | dev-warn + strip duplicates | Matches React's own key-warning semantics; throw too aggressive, silent hides bugs |
| **Q4** | `right-then-flip` collapsed-mode popover side | Radix collision-aware default; GATE 2 plan may expose `collapsedPopoverSide?` override |
| **Q7** | Footer separator only when slot present | Empty separator looks broken |
| **Q8** | Enter AND Space both activate | WAI-ARIA APG button pattern; shadcn baseline |
| **Q15** | `topSlot` slot name | Terse; geographically distinct from v0.1's `headerSlot` per L41 |
| **Q16** | `useFilteredNavSections` is a memoized hook | R14 explicitly identifies non-memo as ⚠️ Medium perf risk |
| **Q17** | `resolveHref` receives `templateValues` as 2nd arg | Strict superset of default behavior; dynamicity-positive |
| **Q19** | Warn on missing placeholder values, not unused | Missing = broken URLs (real bug); unused = common multi-sidebar pattern (noise) |
| **Q21** | `bypassFiltering` skips perm gates only, NOT `hidden:true` | `hidden:true` is explicit consumer intent; never override |
| **Q22** | Defer `validateNavContextConfig()` to v0.3+ | Scope discipline; no demand signal yet |

## State at GATE 1 close

| Component | Version | GATE 1 status | Locks | Q-Ps |
|---|---|---|---|---|
| `account-switcher-01` | v0.1.0 (new) | ✅ Closed 2026-05-23 | L1–L14 (12 original + L13 + L14) | Q1/Q2/Q4/Q7/Q8 default; Q3→L6, Q5→L14, Q6→L13 promoted |
| `rich-sidebar` | v0.2.0 (additive on v0.1.x) | ✅ Closed 2026-05-23 | L41–L52 (12 net-new on top of v0.1's L1–L40) | Q15/Q16/Q17/Q19/Q21/Q22 default; Q18/Q20 redundant strike |

## Surface delta from the re-validation findings

**account-switcher-01 surface grew from 6 props → 9 props.**

Net-new public API:
- `open?: boolean`
- `defaultOpen?: boolean`
- `onOpenChange?: (next: boolean) => void`
- `ariaCurrent?: "true" | "page" | "step" | "location" | "date" | "time" | false`

The "improvements over source" appendix grew from 8 → 9 entries:
- **I-5** rewritten to "Programmable `aria-current`" (default `"true"` + `ariaCurrent?` prop).
- **I-9** added: "Controlled-open triplet from v0.1" (`open` / `defaultOpen` / `onOpenChange`).
- **I-6** referenced L13 alongside L11 for the F-cross-13 guard applied to consumer-supplied `onOpenChange`.

Description doc header updated: "single feature-complete v0.1" with "six props" → "nine props (six render/data + three dynamicity-mandate ergonomics)".

## What unblocks now

GATE 2 plan authoring for both procomps:

1. **`account-switcher-01-procomp-plan.md`** (new file) — file structure, internal types, controlled+uncontrolled state-machine, F-cross-13 guard placement, demo plans. ~6-8 commits expected.
2. **`rich-sidebar-procomp-plan-v0.2.0.md`** (new file, companion to the v0.2.0 description addendum) — additive file changes, new `lib/href-resolver.ts`, expand `derive-visible-entries.ts`, new `hooks/use-filtered-nav-sections.ts`, slot wiring, demo update. ~5-8 commits expected.

After GATE 2 plans are signed off → implementation in commit chains → GATE 3 spot-check reviews → push.

## Files touched this commit

- `docs/procomps/account-switcher-01-procomp/account-switcher-01-procomp-description.md` — added L13 + L14 locks, expanded component surface, struck Q5 + Q6 as promoted, updated header surface count (6 → 9 props), rewrote I-5 + added I-9 in Appendix B, ticked §10 close boxes.
- `docs/procomps/rich-sidebar-procomp/rich-sidebar-procomp-description-v0.2.0.md` — marked Q15/Q16/Q17/Q19/Q21/Q22 resolved at default, ticked §10 close boxes.
- `.claude/STATUS.md` — Recent activity pointer + queue rows.
- `.claude/decisions/2026-05-23-gate-1-close-account-switcher-and-rich-sidebar-v0.2.md` — this file.
- Memory `project_rich_sidebar_v02_and_account_switcher_gate_1.md` — GATE 1 closure noted.

## Validator state at close

- `pnpm tsc --noEmit` — clean (no source changes; doc-only commit).
- `pnpm validate:meta-deps` — 48/48 clean.
- Working tree post-commit: 3 commits ahead of `origin/master` (rename + state-lock + this).

## Open items going into GATE 2

None blocking. Two notes for the plan stage:

1. **account-switcher-01 plan §X** — consider exposing `collapsedPopoverSide?` as a prop (carried over from Q4's "GATE 2 plan may expose override" hedge).
2. **account-switcher-01 plan §X** — the F-cross-13 typeof-guard now applies to BOTH the internal popover handler AND the consumer-supplied `onOpenChange`. Plan should specify how they compose (single shared `wrappedOnOpenChange` that calls both).

## References

- HANDOFF (prior session): [`HANDOFF-2026-05-23-rich-sidebar-rename-plus-v0.2-gate-1-drafts.md`](../HANDOFF-2026-05-23-rich-sidebar-rename-plus-v0.2-gate-1-drafts.md)
- Prior decision: [`2026-05-23-rich-sidebar-rename-plus-v0.2-gate-1-drafts.md`](2026-05-23-rich-sidebar-rename-plus-v0.2-gate-1-drafts.md)
- account-switcher-01 description: [`docs/procomps/account-switcher-01-procomp/account-switcher-01-procomp-description.md`](../../docs/procomps/account-switcher-01-procomp/account-switcher-01-procomp-description.md)
- rich-sidebar v0.2.0 description addendum: [`docs/procomps/rich-sidebar-procomp/rich-sidebar-procomp-description-v0.2.0.md`](../../docs/procomps/rich-sidebar-procomp/rich-sidebar-procomp-description-v0.2.0.md)
- Migration analysis: [`docs/migrations/socialmedia-adv-nav-system/analysis.md`](../../docs/migrations/socialmedia-adv-nav-system/analysis.md)
- Component-readiness review rule: [`.claude/rules/component-readiness-review.md`](../rules/component-readiness-review.md)
