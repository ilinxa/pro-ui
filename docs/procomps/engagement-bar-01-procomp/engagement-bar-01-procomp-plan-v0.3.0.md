# `engagement-bar-01` v0.3.0 — Plan Addendum (Stage 2)

> **Stage:** 2 of 3 · **Status:** 🟡 Drafted + re-validated (2026-05-28) — 6 findings (2 HIGH, 2 MEDIUM, 2 LOW) folded back into Q-PP locks. Awaiting sign-off.
>
> **Re-validation findings absorbed:** F-01 Q-P2 self-contradiction (no-op vs. open-picker) — picker is canonical fallback. F-02 F-cross-13 Slot trap on picker `anchor` prop — restructured so ReactionAction owns the full popover with a plain `<button>` under asChild. F-03 onCountClick split-target undefined — icon/count 2-zone DOM mirrors `like-action.tsx`. F-04 optimistic count merge rule undefined — `state.reactionCounts[k.key] ?? k.count` is the live read. F-05 demo state shape — rely on internal mirror, no demo-side useState re-derive. F-06 Q-PP-5 neutral-icon override confusing — hardcode lucide Smile.
> **Slug:** `engagement-bar-01` (unchanged) · **Target version:** `0.3.0`
> **Depends on:** [engagement-bar-01-procomp-description-v0.3.0.md](./engagement-bar-01-procomp-description-v0.3.0.md) (GATE 1 ✅ signed off — Q-P1=(b), Q-P2=(c), Q-P3=(a))
> **Cross-procomp dependent:** `post-card-01` v0.3.0 (own description + plan; ships after this one)
>
> This addendum is the **implementation contract** for engagement-bar-01 v0.3.0 — *how* the reaction kind + reactionsPreview slot land. 8 commits + GATE 3. Surface area is larger than v0.2.0 (new behavior, new state machine, new picker UI), so the commit chain is sliced finer: types → state → picker → action → wire → demo → meta → review.

---

## 1. Q-P locks (carries description-locked + plan-only)

### 1.1 Description-locked (recap)

| # | Lock | Source |
|---|---|---|
| **Q-P1** | `EngagementReactionKind` shape: `{ key, icon, label, count, color? }`. Single `kinds: EngagementReactionKind[]` field on the action. No parallel `counts: Record<>` / `availableKinds: string[]`. | Description §5 Q-P1=(b) |
| **Q-P2** | `clearOnTap?: boolean` default `true` on the action. **Tap behavior matrix:** `clearOnTap=true` + `viewerReaction!=null` + tap → `onSelect(null)` (clear). `clearOnTap=true` + `viewerReaction===null` + tap → **open picker**. `clearOnTap=false` + tap (any viewer state) → **open picker**. Long-press → opens picker regardless of `clearOnTap` or viewer state. Picker's `Remove` button is the clear escape under `clearOnTap=false`. **F-01 fix:** "no-op" wording from initial draft was wrong; picker open is the consistent fallback. | Description §5 Q-P2=(c); F-01 re-validation fix |
| **Q-P3** | `actions` array may freely contain both `kind: "like"` and `kind: "reaction"` entries. No enforcement. Both render in array order. Hybrid UIs are blessed. | Description §5 Q-P3=(a) |

### 1.2 Plan-only locks

| # | Lock | Rationale |
|---|---|---|
| **Q-PP-1** | Picker UI uses **shadcn `<Popover>` primitive** (already in `src/components/ui/popover.tsx`). NOT `<DropdownMenu>` (semantically wrong — these are toggles, not menu commands) and NOT `<Tooltip>` (not interactive). **Structure** (F-02 fix): `<ReactionAction>` owns the FULL popover assembly — `<Popover open onOpenChange><PopoverTrigger asChild><button>…</button></PopoverTrigger><PopoverContent><ReactionPicker .../></PopoverContent></Popover>`. The `asChild` child is a **plain `<button>` DOM element** (safe under Radix Slot per `project_radix_slot_aschild_custom_component` memory — Slot's asChild trap fires only when wrapping a custom React component). `<ReactionPicker>` is ONLY the kinds-row content + optional `Remove` button — no popover wrapping, no `anchor` prop. | F-cross-13 — popover is the cleanest interactive overlay primitive; well-tested in the project (account-switcher-01 uses it). F-02 re-validation fix locks the structure to avoid the Slot trap. |
| **Q-PP-2** | **Long-press detection** is custom (no lib dep). `pointerdown` starts a 350ms timer; `pointerup` / `pointermove` (>10px) / `pointercancel` clears it. If timer fires, opens picker + sets a `longPressRef = true` flag that suppresses the next `click` handler so tap-clear doesn't fire after long-press-open. Long-press OPENS the picker regardless of `clearOnTap` value. | Custom is cheaper than adding `react-use-gesture` for one event. 350ms matches FB Reactions. |
| **Q-PP-3** | **Controlled-mode defenses:** Defenses 1 + 2 apply (microtask-deferred notify + structural resync guard). Defense 3 (continuous-flow suppression) does NOT apply — reactions are discrete tap events, no drag/type/resize continuous flow. | Per `project_controlled_mode_two_defenses` memory — boolean/discrete state needs Defenses 1+2 only. |
| **Q-PP-4** | **State mirror**: when an `actions` entry has `kind: "reaction"`, the reducer initializes `reactionCounts` from `kinds.reduce((acc, k) => ({ ...acc, [k.key]: k.count }), {})`, `reactionTotalCount` from action's `totalCount`, `viewerReaction` from action's `viewerReaction ?? null`. When NO reaction entry → all three fields stay `null`. **F-04 fix — source-of-truth rule:** after init, `state.reactionCounts[key]` is the live tally for display; `action.kinds[i].count` is the SEED only. Renderers (action button label, picker per-kind count) MUST read `state.reactionCounts[k.key] ?? k.count` for each kind in `action.kinds`. Without this rule, optimistic taps snap back on next render. Reset via `triggerReaction(null)` clears `viewerReaction` and decrements `reactionCounts[oldKind]` (optimistic). Picking a different kind decrements old, increments new, `reactionTotalCount` unchanged. Realtime `reaction-changed` delta replaces all three (server authoritative). `reactor-added` / `reactor-removed` deltas pass through to host (the bar doesn't manage reactor lists; that's the host's `reactionsPreview` slot). | Mirrors the existing `like` mirror pattern (`liked` / `likeCount`). F-04 re-validation fix locks the merge rule. |
| **Q-PP-5** | **Action button render** (mirrors `parts/like-action.tsx` structure — F-03 + F-06 fix): the action is a **2-zone clickable**: (i) **icon zone** — handles tap (per Q-P2 matrix) + long-press (per Q-PP-2) for reaction-toggle / picker-open logic; (ii) **count zone** — a separate sibling clickable that fires `action.onCountClick?.()` when set, otherwise is non-interactive text. Same DOM pattern as the existing like-action's heart+count split. **Icon resolution:** when `viewerReaction != null` → render the matching `kinds.find(k => k.key === viewerReaction)?.icon` + `.color` (if set, applied as inline `color` CSS prop on the icon container). When `viewerReaction === null` → render **hardcoded** lucide `<Smile>` icon. **No override** for the neutral icon — F-06 fix dropped the confusing "kinds[0].icon" suggestion (kinds[0] is a reaction, not a neutral state). Hosts wanting a custom neutral icon wrap the bar. **Count label** = `formatCount(reactionTotalCount)`. Hidden when `reactionTotalCount === 0` AND `viewerReaction === null` (matches like's "no zero" convention). | Visual + DOM consistency with `like-action.tsx`. F-03 locks the icon/count split; F-06 drops the neutral-icon override confusion. |
| **Q-PP-6** | **Picker layout**: horizontal `flex` row of `<button>`s, one per kind, with hover-scale (`hover:scale-125`) for affordance, plus optional `Remove` button at the right when `viewerReaction != null`. Each kind button shows `kinds[].icon` + `kinds[].label` as `aria-label`. Click selects + closes picker. | Matches FB / LinkedIn pattern. Hover-scale is CSS-only, no motion lib. |
| **Q-PP-7** | **`reactionsPreview` slot placement**: rendered below the action row in ALL THREE variants (`default`, `compact`, `stacked`) — same spots as `likersPreview` (lines 127 + 179 in current `engagement-bar-01.tsx`). When BOTH `likersPreview` and `reactionsPreview` are passed, both render (host's call to deduplicate if both feature would be redundant). | Mirrors existing slot convention. |
| **Q-PP-8** | **F-cross-13 (Radix → Base UI primitive divergence) audit**: shadcn `<Popover>` ships via Radix in producer but Base UI in consumer. Producer uses `<Popover>` / `<PopoverTrigger>` / `<PopoverContent>` — same names across both. **No callback contravariance traps** (popover only has `open` / `onOpenChange` — `boolean → void`, same shape in both). Safe to use directly. | Pre-flight per `project_shadcn_primitive_radix_baseui_divergence` memory. |
| **Q-PP-9** | **GATE 3 spotcheck rotating dim = Public API** (largest additive surface in the procomp's history; matches v0.2.0's choice). Author at `docs/procomps/engagement-bar-01-procomp/reviews/<YYYY-MM-DD>-v0.3.0-spotcheck.md`. | Readiness-review rule. |
| **Q-PP-10** | **F-cross-07 meta-deps**: bump `dependencies.shadcn` to add `popover` (currently `["button", "avatar", "input"]` after v0.2.0). `validate:meta-deps` will fail otherwise. Also add `lucide-react` icon names to features list. | F-cross-07 audit lock. |

---

## 2. Implementation order (8 commits + GATE 3)

| Commit | Scope | Files touched | Verification |
|---|---|---|---|
| **C1** | **Type expansion + minimal no-op runtime stubs** (revised post-impl-audit) — add `EngagementReactionKind` interface, `kind: "reaction"` variant to `EngagementAction`, 3 new `EngagementDelta` variants, 3 new `EngagementState` fields (nullable), `reaction-select` variant to `EngagementLocalAction`, 4 new label keys + their defaults, `EngagementBar01Handle` gains `triggerReaction` + `getCurrentReaction`, `EngagementBar01Props` gains `reactionsPreview?: ReactNode`. **Runtime stubs needed to keep tsc green (the type union additions break existing exhaustive switches):** (a) `INITIAL_EMPTY_STATE` gains the 3 null fields; (b) `deriveStateFromActions` effective-state useMemo passes through `internalState.reactionCounts / reactionTotalCount / viewerReaction`; (c) `engagementReducer` outer switch gets a `"reaction-select"` no-op case (returns state); (d) inner reducer switch gets 3 no-op cases for the new delta variants; (e) `isControlledForDelta` gets 3 cases returning `false`; (f) `<ActionButton>` switch gets a `case "reaction": return null;` no-op; (g) `useImperativeHandle` adds `triggerReaction: () => {}` no-op + `getCurrentReaction: () => stateRef.current.viewerReaction`. **Real reaction logic lands in C2/C4** — C1's job is keep the type union widening tsc-green without breaking existing consumers. | `engagement-bar-01/types.ts` + `engagement-bar-01/hooks/use-engagement-state.ts` + `engagement-bar-01/engagement-bar-01.tsx` + `engagement-bar-01/parts/action-button.tsx` | `pnpm tsc --noEmit` clean repo-wide |
| **C2** | **Reducer + hook extension** — extend `engagementReducer` switch with `reaction-select` action + 3 new delta variants (`reaction-changed` / `reactor-added` / `reactor-removed`). Extend `useEngagementState` initial-state derivation to read reaction fields from `actions.find(a => a.kind === "reaction")`. Add `getCurrentReaction()` to handle. Add `triggerReaction()` to handle. Note: `reactor-added` / `reactor-removed` pass-through (state mirror doesn't track reactor lists). | `engagement-bar-01/hooks/use-engagement-state.ts` + `engagement-bar-01/engagement-bar-01.tsx` (handle methods only) | tsc clean; no behavior visible yet |
| **C3** | **Picker content part** (F-02 fix — no popover wrapping) — new file `parts/reaction-picker.tsx` exporting `<ReactionPicker>`. Props: `kinds: EngagementReactionKind[]`, `mergedCounts: Record<string, number>` (per Q-PP-4 source-of-truth rule — host passes the live merged map, not raw kinds[].count), `viewerReaction: string \| null`, `onSelect: (kind: string \| null) => void`, `labels: Required<EngagementBarLabels>`. **No `<Popover>` wrap; no `open`/`onOpenChange`/`anchor` props.** Renders ONLY the picker content: horizontal `flex` row of kind `<button>`s + optional `Remove` button on the right when `viewerReaction != null`. Hover-scale via Tailwind (`hover:scale-125 transition-transform`). Each kind button: `aria-label={kinds[i].label}` + inline `color: kinds[i].color` if set + per-kind count badge underneath reading `mergedCounts[k.key] ?? 0`. Click → `onSelect(key)`. Remove button → `onSelect(null)`. Parent (ReactionAction) owns the popover open/close + closes on selection. | `engagement-bar-01/parts/reaction-picker.tsx` (new) | tsc + lint clean; renders standalone in a test render (no portal needed for unit-render) |
| **C4** | **Action part** (F-01 + F-02 fix — owns full popover) — new file `parts/reaction-action.tsx` exporting `<ReactionAction>`. Props: action variant fields + `state: EngagementState` (reads `viewerReaction` + `reactionTotalCount` + `reactionCounts`) + `dispatch` + `labels`. Internal state: `pickerOpen: boolean`; `longPressRef: { fired: boolean }` ref. **Structure:** renders `<Popover open={pickerOpen} onOpenChange={setPickerOpen}><PopoverTrigger asChild><button onPointerDown={…} onClick={…}>{icon}{count}</button></PopoverTrigger><PopoverContent><ReactionPicker {...props} onSelect={handlePick} /></PopoverContent></Popover>`. The `asChild` child is a plain `<button>` element (Slot-safe). **Tap matrix (Q-P2 + F-01 lock):** `pointerdown` resets `longPressRef.fired = false`, starts 350ms timer; if timer fires → set `longPressRef.fired = true` + `setPickerOpen(true)`. `pointerup`/`pointermove>10px`/`pointercancel` clears timer. `click` reads `longPressRef.fired`: if true → clear ref + early return (suppress). Else: if `viewerReaction != null && clearOnTap !== false` → `dispatch({ kind: "reaction-select", reactionKind: null })` + microtask-deferred `action.onSelect?.(null)` (Defense 1). Else → `setPickerOpen(true)`. **handlePick:** dispatches `reaction-select` with the chosen kind + microtask-deferred `action.onSelect?.(key)` + `setPickerOpen(false)`. **Count zone (Q-PP-5 / F-03 lock):** rendered as a sibling clickable to the icon button when `onCountClick` is set; otherwise inline non-interactive text inside the icon button. Both zones share the same parent flex row visually. **Icon zone:** reads `kinds.find(k => k.key === viewerReaction)?.icon ?? <Smile />`. | `engagement-bar-01/parts/reaction-action.tsx` (new) | tsc + lint clean; standalone render verifies all 4 cells of the tap matrix + long-press path |
| **C5** | **Wire into main component** — `engagement-bar-01.tsx` switch (existing `kind === "like" / "comment" / "share" / "bookmark" / "view-count" / "custom"`) gets a new `kind === "reaction"` branch rendering `<ReactionAction>` from C4. Pass `state` + `dispatch` + `labels` down. Add `reactionsPreview` slot render in all 3 variants below the action row (mirrors `likersPreview` placement at current lines 127 + 179). | `engagement-bar-01/engagement-bar-01.tsx` | tsc + lint + dev-server render works for a reaction-wired action |
| **C6** | **Demo extension** (F-05 fix — rely on internal mirror) — add a "Reactions" tab to `demo.tsx`. Uses 5 FB-style kinds (`love`, `laugh`, `wow`, `sad`, `angry`) with lucide icons (`Heart`, `Laugh`, `PartyPopper`, `Frown`, `Angry`). Fixture data: static `kinds` array with realistic seed counts (`love: 124, laugh: 38, wow: 12, sad: 5, angry: 2`, total = 181, `viewerReaction: "love"`). **Demo provides the initial `kinds` + a `console.log` `onSelect`** — visual updates flow through the bar's internal mirror (per the source-of-truth rule in Q-PP-4). NO local `useState`-driven re-derive of `kinds[]` on every render; that's redundant with the mirror and adds demo complexity for marginal value. Same pattern as the existing demo tabs (like/comment/share) which all rely on internal optimistic state. Includes a second sub-demo: hybrid layout (both `like` AND `reaction` per Q-P3 lock) to prove coexistence. | `engagement-bar-01/demo.tsx` | dev-server `/components/engagement-bar-01` renders both demos; tap-clear works; long-press opens picker; picker selection updates the trigger via internal mirror |
| **C7** | **Meta + registry** — `engagement-bar-01/meta.ts`: version `0.2.1 → 0.3.0`, `updatedAt: 2026-05-28`, features list += `"Reaction kind — FB/LinkedIn-style multi-kind reactions with picker, hybrid-with-like support"` + `"reactionsPreview slot"`, tags += `"reactions"`, `dependencies.shadcn += ["popover"]`. `registry.json` engagement-bar-01 base item: add 2 new file entries (`parts/reaction-picker.tsx` + `parts/reaction-action.tsx`) with locked target convention; bump version. | `engagement-bar-01/meta.ts` + `registry.json` (repo root) | `pnpm validate:meta-deps` clean; `pnpm registry:build` regenerates `public/r/engagement-bar-01.json` cleanly |
| **C8** | **GATE 3 + smoke** — author spotcheck review file (fixed core 4 dims + rotating Public API). Run smoke harness for `engagement-bar-01` (F-cross-11 path-b: install + consumer-tsc clean). Manual interaction verification: hybrid layout demo (like + reaction coexisting); long-press in 3 browsers (Chromium, Firefox, Safari); keyboard nav (Tab to picker buttons; Enter selects; Esc closes). | `docs/procomps/engagement-bar-01-procomp/reviews/2026-05-28-v0.3.0-spotcheck.md` (new) + smoke harness | Verdict ≥ `Pass with follow-ups`; smoke install + tsc clean; interactions work in all 3 browsers |

**Estimated time:** ~1.5 days end-to-end.
- C1: ~30min (types only)
- C2: ~45min (reducer + hook + handle)
- C3: ~1h (picker part)
- C4: ~1.5h (action part — long-press is fiddly)
- C5: ~30min (wire-in)
- C6: ~1h (demo with realistic fixtures)
- C7: ~15min (meta + registry)
- C8: ~1h (spotcheck + smoke + manual interaction in 3 browsers)

Total ≈ 6.5h coding + 1h verification = ~1 day, padded to 1.5d for unknowns.

---

## 3. Critical workflow notes

### 3.1 No host-side ripple on this ship

The post-card-01 v0.3.0 ripple (extending `Post` + `onReact` handler + default action helper) is in a SEPARATE description + plan doc (queued, not authored yet). engagement-bar-01 v0.3.0 ships standalone — any host can wire `kind: "reaction"` manually using the new exports. Post-card-01 v0.3.0 then layers convenience on top.

### 3.2 No breaking changes to existing behavior

Every v0.2.x consumer continues working unchanged. Specifically:
- `EngagementBar01` with `actions: [{ kind: "like", ... }]` → renders the same heart action as before.
- `EngagementBar01Handle.triggerLike` / `triggerBookmark` → unchanged.
- `engagementReducer` with `kind: "like-toggle"` / `bookmark-toggle` → unchanged.
- `EngagementDelta` discriminated union → strictly extended (new variants), not modified.
- `EngagementState` → strictly extended (3 new nullable fields).
- `EngagementLikeUser` / `EngagementLikerProfile` / `LikersStrip` / `ShareMenu` → unchanged.

The widened type unions are source-compatible: existing `switch` exhaustive-checks on `EngagementAction["kind"]` or `EngagementDelta["kind"]` will fail tsc if they don't add the new arms — but that's TypeScript working as intended, and the consumer fixes are mechanical (add a `case "reaction":` no-op, or a `default:` catch-all).

### 3.3 Defense-pattern wiring (Q-PP-3)

Reactions are discrete events. Apply Defenses 1 + 2 (per `project_controlled_mode_two_defenses` memory):

- **Defense 1 (microtask-deferred consumer notify):** when `triggerReaction(kind)` is called via handle, schedule `onSelect(kind)` in a `queueMicrotask` so the local mirror is committed first.
- **Defense 2 (structural resync guard):** when `actions[i].viewerReaction` changes via prop, sync local mirror only if `viewerReaction !== localViewerReaction` (reference-equality is fine — strings).
- **Defense 3 (continuous-flow suppression):** N/A. Picker doesn't have continuous interaction; no flow to suppress.

### 3.4 Out-of-scope for this minor (locked)

- Animation polish (FB-style bounce on picker open).
- Reactors-list panel UI (host-owned via `reactionsPreview` slot).
- Comment reactions (different procomp, future v0.3+).
- Per-kind keyboard shortcuts in the picker (arrow keys nav-only, no number-key shortcuts).
- Touch haptics (no `navigator.vibrate` call).

---

## 4. Test plan

### 4.1 Automated

- `pnpm tsc --noEmit` clean after every commit.
- `pnpm lint` clean.
- `pnpm validate:meta-deps` clean (F-cross-07).
- `pnpm registry:build` produces `public/r/engagement-bar-01.json` with the 2 new file entries + bumped version.

### 4.2 Smoke (F-cross-11 path-b)

After C7:
```bash
cd e:/tmp/ilinxa-smoke-consumer
pnpm dlx shadcn@4.6.0 add @ilinxa/engagement-bar-01
pnpm tsc --noEmit
```
Expected: install success + consumer-tsc clean.

### 4.3 Manual interaction (after C5/C6)

In dev browser at `/components/engagement-bar-01`:

| Scenario | Expected |
|---|---|
| Reactions demo loads, viewer's current reaction icon + total count visible | ✓ |
| Tap action with `viewerReaction = "love"` and `clearOnTap = true` (default) | Clears reaction; trigger flips to neutral Smile; total count -1; fires `onSelect(null)` |
| Tap action with `viewerReaction = null` | Opens picker |
| Tap action with `viewerReaction = "love"` and `clearOnTap = false` | Opens picker (F-01 lock — picker is the consistent fallback under `clearOnTap=false`; clear via picker's Remove button) |
| Tap action with `viewerReaction = null` and `clearOnTap = false` | Opens picker (same path) |
| Click count zone with `onCountClick` set | Fires `onCountClick`; does NOT open picker; does NOT touch reaction state (F-03 split-target lock) |
| Click count zone with `onCountClick` unset | No-op (count is non-interactive text inside the icon button; tap there bubbles to icon-zone handler) |
| Long-press action (350ms hold) with `viewerReaction = "love"` | Opens picker regardless of `clearOnTap`; click after long-press does NOT fire tap-clear |
| Pick a different kind in picker | Replaces `viewerReaction`; old kind count -1; new kind count +1; total unchanged; fires `onSelect(newKind)` |
| Click `Remove` button inside picker | Clears `viewerReaction`; fires `onSelect(null)`; total -1 |
| Click outside picker | Picker closes; no selection |
| Esc inside picker | Picker closes; no selection |
| Keyboard: Tab to action → Enter | Opens picker |
| Keyboard: arrow-Right inside picker | Focuses next kind button |
| Hybrid demo (like + reaction) | Both render; both interactive independently |
| Variant: compact + reactions | Stacks correctly; picker still works |
| Variant: stacked + reactions | Renders below; picker still works |
| `reactionsPreview` slot | Renders below action row; doesn't conflict with `likersPreview` when both present |

### 4.4 Browser matrix

Chromium + Firefox + Safari (WebKit). Long-press is the cross-browser risk; pointer events are well-supported across all three for ≥6 years but worth confirming.

---

## 5. Risk register

| # | Risk | Mitigation | Severity |
|---|---|---|---|
| **R-1** | Long-press timing inconsistent across input modalities (mouse vs touch vs trackpad) | 350ms is conventional; clearing on `pointermove > 10px` handles trackpad accidental drift; manual test in all 3 browsers per §4.3. | Medium |
| **R-2** | Picker portal escapes parent overflow-hidden contexts (cards) | shadcn Popover uses Radix's portal by default — known good. Verified in account-switcher-01. | Low |
| **R-3** | F-cross-13 latent on shadcn Popover after a future producer-side primitive refresh (Radix → Base UI migration) | Popover's `open` + `onOpenChange` surface is stable; both producers ship the same names. No callback contravariance. Will re-audit if a refresh ships. | Low |
| **R-4** | Reducer state initialization wrong when actions array changes after mount (e.g. host pushes a `reaction` action where there wasn't one before) | `useEngagementState` resync effect uses content-key comparison (JSON.stringify on actions); reaction fields re-derive from the new actions array. Existing pattern handles this. | Medium |
| **R-5** | `viewerReaction` key not present in `kinds[]` (host data drift — backend reaction code not in catalog) | Action renders neutral Smile + warns in dev (`console.warn` once). Total still shown. Picker still opens normally. | Low |
| **R-6** | Hybrid layout (like + reaction) confuses end users in production | Library blesses the layout per Q-P3; guide includes UX warning: "Pick one for most cases; only hybrid when there's a clear product reason." Host's call. | Documentation-only |
| **R-7** | Picker click-outside fires on touch-scroll past the picker (Safari iOS quirk) | Use `<PopoverContent>` defaults; Radix handles this. Verified in production via account-switcher-01. | Low |
| **R-8** | Demo's hardcoded English labels fail F-05 follow-up (post-card-01 v0.2.0 carry-over) | Demo strings ARE meant to be hardcoded English (demo, not library code); F-05 only applies to internal library code. Audit clears. | Low |

---

## 6. Sign-off

| Item | Status |
|---|---|
| Q-P locks (description) carried verbatim | ✅ recap §1.1 |
| Plan-only Q-PPs (10) lock | _awaiting user_ |
| Commit chain (C1–C8) accepted | _awaiting user_ |
| Test plan accepted | _awaiting user_ |
| Risk register understood (R-1 through R-8) | _awaiting user_ |
| Time estimate (~1.5d) acceptable | _awaiting user_ |
| Post-card-01 v0.3.0 ripple deferred to its own description/plan | ✅ §3.1 |
| Out-of-scope items §3.4 acknowledged | _awaiting user_ |

**On sign-off:** start C1 (types only). Each commit lands + tsc-clean + meta-deps-clean before the next begins. GATE 3 spotcheck at C8 closes the ship.

**On `Needs revision`:** re-author specific Q-PPs that need rework; do not start code.

---

**Authored:** 2026-05-28 · **Targets:** engagement-bar-01 v0.2.1 → v0.3.0 · **Procomp tier**
