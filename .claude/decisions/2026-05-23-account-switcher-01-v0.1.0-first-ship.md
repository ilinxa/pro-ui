---
date: 2026-05-23
session: account-switcher-01-v0.1.0-first-ship
phase: shipping
type: feat
commits:
  - 6dd2eb6  # C1 scaffold + types
  - df8f4c4  # C2 pure lib helpers
  - 0090c99  # C3 useControllableState hook
  - 38f8f06  # C4 main component + parts
  - 92b8cdc  # C5 dummy data + manifest + meta deps
  - 27915db  # C6 demo (5 tabs) + usage (5 patterns)
  - (this commit)  # C7 registry + guide + GATE 3 + STATUS + ship
components:
  - account-switcher-01 (v0.1.0 ✅ SHIPPED — 49th component)
status: shipped
---

# `account-switcher-01` v0.1.0 SHIPPED — 49th component, full C1→C7 chain (2026-05-23)

> Implementation complete in a single session immediately after GATE 1 + GATE 2 closure earlier the same day. 7 commits land the full sealed-folder primitive: types → pure lib helpers → controllable-state hook → main component + 4 parts → fixtures + manifest + meta deps → 5-tab demo + 5-pattern usage → registry + guide + GATE 3 spotcheck + STATUS + this decision file. **GATE 3 verdict: Pass with follow-ups** (3 non-blocking findings, all v0.1.x bump targets).

## Surface delivered

**9 public props** (locked from GATE 2 description, with L13 + L14 promoted during GATE 1 re-validation):

```tsx
<AccountSwitcher01
  // Data
  items={items}                          // ReadonlyArray<SwitcherItem>; L1, L2
  activeKey={activeKey}                  // string | null; L4
  onSelect={(item) => {}}                // L6 active-click no-op

  // Optional shape
  fallbackActiveItem={fallback}          // SwitcherItem; L4, I-1
  footerSlot={<CreateButton />}          // ReactNode; L5, Q7, PQ5
  isCollapsed={false}                    // boolean; L10
  collapsedPopoverSide="right"           // PQ1; "right" default
  aria-label="..."                       // L12
  ariaCurrent="true"                     // L14, PQ3 data-active hook

  // Controlled-open triplet (L13)
  open={open}
  defaultOpen={false}
  onOpenChange={setOpen}                 // F-cross-13 typeof-guarded internally

  className="..."
/>
```

**11 sealed-folder files** (10 ship + 1 fixture):
- `account-switcher-01.tsx` — main composition
- `parts/switcher-trigger.tsx` — forwardRef trigger (expanded + collapsed branches)
- `parts/switcher-item-row.tsx` — row with Check + aria-current resolver
- `parts/empty-placeholder.tsx` — disabled placeholder (Q1, I-2)
- `parts/render-icon.tsx` — ReactNode | ComponentType | forwardRef icon helper
- `hooks/use-controllable-state.ts` — controlled+uncontrolled mode-lock (Finding 1)
- `lib/resolve-active-item.ts` — 4-level priority resolver (discriminated union)
- `lib/enforce-unique-keys.ts` — dev-warn + strip dedup (L3, Q2)
- `types.ts` — 4 exported types
- `index.ts` — barrel
- `dummy-data.ts` — 6-item multi-context fixture (fixtures bundle)

**Plus docs-only (not shipped via registry):**
- `meta.ts`, `demo.tsx`, `usage.tsx`

## Locks + PQs delivered

| Lock/PQ | Implementation site |
|---|---|
| L1 SwitcherItem shape | `types.ts:7-26` |
| L2 single items, consumer ordering | main component (no library sort) |
| L3 + Q2 dedup with dev-warn | `lib/enforce-unique-keys.ts` |
| L4 + I-1 fallbackActiveItem | `lib/resolve-active-item.ts` |
| L5 + Q7 + PQ5 footer outside listbox | `account-switcher-01.tsx:120-125` |
| L6 active-click no-op | `account-switcher-01.tsx:72-79` |
| L7 combobox + listbox aria | `parts/switcher-trigger.tsx` + `account-switcher-01.tsx:107` |
| L8 shadcn Popover | direct import |
| L9 width-matches-trigger | `account-switcher-01.tsx:89` `--radix-popover-trigger-width` |
| L10 + PQ1 collapsed-mode + override | `parts/switcher-trigger.tsx` + `account-switcher-01.tsx:88` |
| L11 + L13 F-cross-13 typeof-guard | `account-switcher-01.tsx:62-67` |
| L12 + PQ4 aria-label composition | `parts/switcher-trigger.tsx:38-40` |
| L13 controlled-open triplet | `hooks/use-controllable-state.ts` (the whole file) |
| L14 + PQ3 ariaCurrent + data-active | `parts/switcher-item-row.tsx:48-54` |
| Q1 empty-state placeholder | `parts/empty-placeholder.tsx` |
| Q4 right-then-flip default | `account-switcher-01.tsx:88` |
| Q8 Enter + Space activation | native `<button>` browser semantics |

## Re-validation findings delivered

**Finding 1 (⚠️ HIGH from GATE 2):** `useControllableState` mode-lock with two dev-warns:
- Mode transition (controlled ↔ uncontrolled mid-life) — `hooks/use-controllable-state.ts:45-57`
- Controlled mode used without onChange (popover frozen) — `hooks/use-controllable-state.ts:60-71`

Both gate on `process.env.NODE_ENV !== "production"` so they tree-shake from prod bundles.

**Finding 2 (🔸 Medium from GATE 2):** Implementation matches the clarified collapsed-vs-expanded semantic: list rows + footer render identically; only positioning + width differ. Verified in `account-switcher-01.tsx:88-117`.

## C5 surprise — `button` shadcn dep dropped at lint time

The plan §13.2 listed `button` in `meta.shadcn` (for the trigger Button variant). Implementation chose to use raw `<button>` elements with `cn()` for finer control over the icon-only collapsed branch (40×40 square with no shadcn Button styling baked in). The `validate:meta-deps` audit caught the divergence at C5 and surfaced as `over-declared-shadcn: button`. Dropped from meta → 49/49 clean.

This is the producer-side `validate-meta-deps` lint working as designed (F-cross-07 audit). No bug, just a plan vs implementation alignment that the lint caught before commit.

## GATE 3 spot-check

[`docs/procomps/account-switcher-01-procomp/reviews/2026-05-23-v0.1.0-spotcheck.md`](../../docs/procomps/account-switcher-01-procomp/reviews/2026-05-23-v0.1.0-spotcheck.md)

**Verdict:** Pass with follow-ups. 3 findings, all non-blocking:
- **F-01 🔹 Low:** `enforceUniqueKeys` always-allocate; v0.1.x opportunistic optimization
- **F-02 🔸 Medium:** path-b consumer-tsc smoke deferred to post-deploy per project pattern; v0.1.1 patch reserved if F-cross-13 surfaces
- **F-03 🔹 Low:** JSDoc polish on `CollapsedPopoverSide` for next docs batch

**Rotating dimension chosen:** Public API. Reasoning: this procomp landed during a GATE 1 re-validation that explicitly flagged dynamicity violations (Q5 + Q6 → L13 + L14 promoted). The implementation MUST deliver on what those re-validation findings promised. Verified — all locks + PQs threaded through code at the expected sites.

## Validator state at C7 close

- `pnpm tsc --noEmit` — clean
- `pnpm lint` — clean
- `pnpm validate:meta-deps` — 49/49 clean
- `pnpm build` — clean (49 component paths prerender; account-switcher-01 in the static list)
- `pnpm registry:build` — clean (account-switcher-01.json + account-switcher-01-fixtures.json artifacts)

## What unblocks now

1. **rich-sidebar v0.2.0 implementation** — C1-C6 chain ready (GATE 2 plan signed off earlier this session). Demo at C6 can now reference the published `<AccountSwitcher01>` via registry consumption OR direct import from same monorepo.
2. **Push to origin/master** — 12 commits ahead (rename + state-lock + GATE 1 close + GATE 2 plans + 7 C1-C7 commits + this). Vercel will auto-deploy and the v0.1.0 artifact goes live at `https://ilinxa-proui.vercel.app/r/account-switcher-01.json`.
3. **Path-b smoke against live Vercel artifact** — F-cross-13 patch loop reserved for v0.1.1 if Popover.onOpenChange surfaces a hit.

## References

- GATE 1 close decision: [`2026-05-23-gate-1-close-account-switcher-and-rich-sidebar-v0.2.md`](2026-05-23-gate-1-close-account-switcher-and-rich-sidebar-v0.2.md)
- GATE 2 plans close decision: [`2026-05-23-gate-2-plans-account-switcher-and-rich-sidebar-v0.2.md`](2026-05-23-gate-2-plans-account-switcher-and-rich-sidebar-v0.2.md)
- Description: [`docs/procomps/account-switcher-01-procomp/account-switcher-01-procomp-description.md`](../../docs/procomps/account-switcher-01-procomp/account-switcher-01-procomp-description.md)
- Plan: [`docs/procomps/account-switcher-01-procomp/account-switcher-01-procomp-plan.md`](../../docs/procomps/account-switcher-01-procomp/account-switcher-01-procomp-plan.md)
- Guide (consumer-facing): [`docs/procomps/account-switcher-01-procomp/account-switcher-01-procomp-guide.md`](../../docs/procomps/account-switcher-01-procomp/account-switcher-01-procomp-guide.md)
- GATE 3 spot-check: [`docs/procomps/account-switcher-01-procomp/reviews/2026-05-23-v0.1.0-spotcheck.md`](../../docs/procomps/account-switcher-01-procomp/reviews/2026-05-23-v0.1.0-spotcheck.md)
- Component-readiness review rule: [`.claude/rules/component-readiness-review.md`](../rules/component-readiness-review.md)
