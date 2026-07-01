---
date: 2026-07-01
session: gamification-system implementation (component 5 of 6)
phase: implementation
type: first-ship
commits: []   # built + gated; committed on ship
components:
  - task-choice-control-01
findings: "GATE 3 Pass-with-follow-ups (rotating dim Copy / never-forced + no-penalty). Pre-push Base UI (base-nova) local-registry smoke ran CLEAN (consumer tsc 0) — de-risked the popover/command/switch divergence class that broke the sibling (getValueLabel). F-01 production round-trip confirmation owed (Med→Low, expected clean). F-02 live never-forced/no-penalty walkthrough owed (Low). Single-unit control (no Root/context); never-forced structural (no mandatory state in the type system); release folds into onAssigneeChange(undefined), neutral ghost styling + neutral aria-live."
status: shipped
---

# task-choice-control-01 v0.1.0 — 5th gamification component (E4 Autonomy)

## What

The **fifth** component of the [`gamification-system`](../../docs/systems/gamification-system/gamification-system-description.md) — the 62nd pro-component and the pack's **single-unit exception** (no Root/compound). **E4 (Autonomy):** a small, droppable control for one team task — an "open for anyone" toggle, an "I'll take this" volunteer/claim action, and an assignee chip with a **neutral, no-penalty** release + a searchable reassign picker. Built per its signed-off [description](../../docs/procomps/task-choice-control-01-procomp/task-choice-control-01-procomp-description.md) (GATE 1) + [plan](../../docs/procomps/task-choice-control-01-procomp/task-choice-control-01-procomp-plan.md) (GATE 2), decisions D1–D12 + D7/D8/D9 locked to plan defaults.

## How it was built (matches the plan's single-unit structure)

**Single-unit control (NOT a Root/context compound)** per plan §4 — flat à-la-carte sub-parts (`OpenForAnyoneToggle` / `ClaimButton` / `AssigneeChip`) under a **logic-free** `TaskChoiceControl01` assembly, **no headless Root, no React context, no `hooks/`** (the only internal state — `pickerOpen` — lives in `AssigneeChip`). Pure `lib/state.ts` (`resolveTaskChoiceState`, exported) + `lib/members.ts` (`resolveMember`/`initialsFor`). Deps: shadcn `switch`/`button`/`avatar`/`popover`/`command` + `lucide-react`; own `types.ts` slice, imports no other registry component (D-03).

## Key decisions / deviations (loud, not silent)

- **Never-forced + no-penalty made structural (the core, system §5.2).** No `disabled`/`required`/`mustAssign` prop and no "you must choose" branch exists in the type system — choice is the default; `readOnly` is the only (opt-in) non-interactive path. **Release folds into `onAssigneeChange(undefined)`** (one chokepoint, no separate `onRelease`, D10). The no-penalty ban list is honored: Release is `variant="ghost"` + `text-muted-foreground` (**never** destructive/red), copy is **"Release"** (never "Drop"/"Abandon"), no ✕-on-a-person glyph, and the `aria-live` sentence is neutral ("Unassigned" — never "X dropped this").
- **Member picker = `popover` + `command`** (searchable, keyboard-nav, team-scoped) — mirrors the proven `content-composer-01` `field-author-picker`: `PopoverTrigger` used **directly** (no `asChild`), `onCheckedChange`/`onOpenChange` typed `(boolean) => void`, `CommandItem value/onSelect`. This is the cross-backend-safe surface.
- **Telemetry wrapper.** The assembly wraps each host callback to emit `task-choice.interaction` **after** a committed interaction (toggle/claim/reassign/release) — never on render/hover/picker-open. An omitted base callback ⇒ omitted wrapper ⇒ the affordance capability-gates off.
- **`isOpenFlagVisible` dropped (deviation).** The plan listed an always-`true` helper; it was never called (the assembly always mounts the toggle) and its unused param tripped `no-unused-vars` → removed as dead code; intent enforced structurally + documented in `state.ts`. `resolveTaskChoiceState` remains exported.
- **Command default filter** (not the author-picker's `shouldFilter={false}`): the member list is synchronous + bounded, `CommandItem value={displayName}` enables name search. `cmdk` is backend-agnostic.

## Verification

`tsc` **0** · ESLint (folder) **0** · `validate:meta-deps` **62/62 clean** · `pnpm build` **71 pages (no SSR error)** · `registry:build` ✓. **D-03 import audit (grep): no `@/registry/` or escaping `../../` import in any shipped file.** Artifact: 8 files, **0 forbidden**, targets locked-convention, `registryDependencies: [switch,avatar,button,popover,command]`, `dependencies: [lucide-react]`, `internal: []`; fixtures resolve `@ilinxa/task-choice-control-01`.

**🔑 Pre-push cross-backend smoke (proactive, given the sibling's just-caught `getValueLabel` break):** served `public/r` locally, `shadcn add` into the **base-nova / Base UI** consumer (installed the `command`+`input-group` it lacked), consumer `tsc` → **0 errors**. The popover/command/switch divergence surface held — the proven controlled pattern worked. (The sibling proved this class is real; here it's clean by construction.)

## Follow-ups

| # | Sev | Item | Target |
|---|---|---|---|
| F-01 | 🔸→🔹 | production round-trip smoke confirmation (pre-push Base UI smoke already CLEAN) | v0.1.0 post-deploy |
| F-02 | 🔹 Low | live never-forced / no-penalty visual walkthrough | v0.1.x post-deploy |

## Resume

**Next: component 6 `team-quest-log-01`** (E5 Autonomy + Relatedness) — the final gamification component (a compound). After it, revisit the deferred shared `gamification-kit` (D-04): `resolveTaskChoiceState`/`resolveMember`/`initialsFor` join `cooperative-challenge`'s `derive` + the event factories as clear extraction candidates across 5 components.
