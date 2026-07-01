# `team-progress-bar-01` — Pro-component Plan (Stage 2 / GATE 2)

> **Stage:** 2 of 3 · **Status: DRAFT — pending GATE 2 sign-off**
> **Slug:** `team-progress-bar-01` · **Category:** `gamification` · **Tier:** pro-component · **Structure:** shadcn-style compound (light)
> **Predecessor:** [`team-progress-bar-01-procomp-description.md`](./team-progress-bar-01-procomp-description.md) (GATE 1, signed off)
> **System contract:** [`gamification-system-description.md`](../../systems/gamification-system/gamification-system-description.md) (GATE 1 signed off 2026-07-01). This plan honors §4 (domain model), §5 (cooperative-only), §6 (telemetry union), and the §8 locked decisions — **including D-15 (team prop) and D-16**.

This is the **how**. It is the contract the implementation must follow. Once signed off (**GATE 2**), `pnpm new:component gamification/team-progress-bar-01` scaffolds the folder and code begins. Nothing here re-opens GATE-1 decisions (the inherited D-rows + the resolved Q-rows); it operationalises them. This is the **simplest** component in the gamification pack and the **first** to build (system §10) — the plan stays correspondingly tight.

> **Reviewer focus:** the resolved-percentage chokepoint (§5), the light-compound export surface (§4 — does the `Root`+2-parts shape earn its keep, or does the Q-1 single-widget fallback win?), the telemetry "viewed once per mount" firing (§8), and the cooperative-only guard (no comparison surface anywhere — system §5.3 / D-08).

---

## 0. Open-question resolutions (carried from description §7)

The description left five open Qs with recommended defaults. **All five are resolved to their recommended default and LOCKED here**; the prose below treats them as fixed. The one item still genuinely needing a human nod at GATE-2 sign-off is flagged.

| # | Question | Resolution (this plan) | State |
|---|---|---|---|
| **Q-1** | Light compound vs single sealed widget | **Light compound** — `TeamProgressBarRoot` + `TeamProgressBarTrack` + `TeamProgressBarLabel` + `ProgressTrack` primitive + `TeamProgressBar01` assembly. The subset trigger (bar-only header inline vs bar+label vs bar+ticks) is real and the parts stay genuinely thin. | 🔒 LOCKED |
| **Q-2** | Input: `Milestone[]` vs direct `value` | **Both.** `value` (0–100) wins if both supplied; dev-warn on the redundancy. `milestones` enables ticks + the `"fraction"` readout. | 🔒 LOCKED |
| **Q-3** | Readout format | `labelFormat: "percent" \| "fraction"`, default `"percent"`. `"fraction"` requires `milestones`; if requested without them, **fall back to `"percent"` + dev-warn** (never render `"NaN / NaN"`). | 🔒 LOCKED |
| **Q-4** | When does `progress-bar.checked` fire? | **Once per mount, on first in-viewport reveal** (IntersectionObserver, ≥ 1 px visible), double-emit-guarded, SSR-safe. NOT on hover/focus (kept a pure "feature-viewed" event, not a storm). | 🔒 LOCKED |
| **Q-5** | Animate the fill on `value` change | **Yes** — a short CSS `width`/`transform` transition on the fill, gated by `prefers-reduced-motion` (no transition when reduced). Not a celebration overlay (that is E6 / `team-feedback-loop-01`). | 🔒 LOCKED |

> **For GATE-2 sign-off — one confirm:** Q-1. The plan commits to the light compound, but per the description's standing offer the **single-sealed-widget fallback** (`team-progress-bar` widget with `showLabel`/`showTicks`/`labelFormat` props, no exported `Root`/parts) remains available if the reviewer judges the parts add ceremony without value. See §11 for the exact fallback shape. Everything else is locked.

---

## 1. Summary of what we're building

A **read-only, always-visible** single progress bar that reports **one team's milestone-completion %** for a team-board header. It takes either a `Milestone[]` (computes `done`/total) or a direct `value` (0–100), draws a signal-lime fill on a shadcn `progress` track, optionally renders per-milestone tick marks and a numeric/fraction readout, animates its fill on change, and emits `progress-bar.checked` once when first viewed. It ships as a **light compound**: `TeamProgressBarRoot` (headless — resolves %, owns telemetry + context) + two flat context parts (`TeamProgressBarTrack`, `TeamProgressBarLabel`) + a context-free `ProgressTrack` primitive + the `TeamProgressBar01` assembly. **No comparison, no ranking, no second series, ever** (system §5.3 / D-08). Zero registry imports, zero `next/*`, SSR-safe.

---

## 2. Client vs server

**`"use client"` on every module that holds state, refs, or effects** — i.e. `team-progress-bar-01.tsx`, `parts/team-progress-bar-root.tsx`, `parts/team-progress-bar-track.tsx`, `parts/team-progress-bar-label.tsx`, and `hooks/use-progress-telemetry.ts`. Pure `lib/*` (the percentage resolver) and `types.ts` are **framework-free, no directive** (importable from a server component's type position). The dumb `ProgressTrack` primitive carries `"use client"` only because it lives in the same `parts/` module as the context wrapper (co-located one-file-two-exports); it has no client-only need of its own and stays SSR-safe.

**Justification:** the telemetry hook uses `IntersectionObserver` + a mount ref (client-only); the fill animation reads `prefers-reduced-motion` via a CSS media query (no JS needed, but the part is interactive-adjacent). **No data state, no reducer, no gestures** — this is far lighter than gantt/calendar.

**SSR determinism (the locked seam):**
- The resolved **percentage is pure** — it derives only from props (`value` / `milestones`), never from `Date.now()` or layout. So the **first server paint and first client render are identical** by construction. No `mounted` flag needed for the bar geometry (unlike gantt's `now`-dependent today-line).
- The **telemetry emit** is the only client-only behavior and it lives entirely in an effect (IntersectionObserver subscribes post-mount) → it never runs during render, never desyncs SSR.
- The `reveal-up` entrance is a CSS keyframe on mount (animation, not a layout read) → SSR-safe.

---

## 3. Dependencies

### 3.1 — shadcn primitives

| Primitive | Status | Used by | Purpose |
|---|---|---|---|
| `progress` | **Already installed** (`src/components/ui/progress.tsx`) | `ProgressTrack` (Tier C) | the underlying track + fill bar; we build `ProgressTrack` **on top of** it (style the fill signal-lime, layer ticks over it). |

- **Only one primitive, and it is already installed** (`src/components/ui/progress.tsx` — verified present). Declare it in `meta.shadcn` AND in `registry.json` (`registryDependencies: ["progress"]` — shadcn resolves the bare name against the default registry).
- **F-cross-13 divergence risk is LOW here.** `progress` is a *simple* primitive (a track + fill div) already in the library — it is NOT a known Radix↔Base-UI divergence carrier (those are complex primitives like `tooltip` / `select` / `toggle-group`). Standard first-ship consumer-tsc smoke applies as for any component, but no special "4-ship" alarm is warranted. **Pre-wire defensively anyway** (cheap, good practice): drive the fill via our own inline `width` style off the resolved pct rather than the primitive's internal indicator transform, so the fill is robust regardless of the `Progress` implementation.

> **Verify the `progress` primitive's actual API before implementing** — read the already-present `src/components/ui/progress.tsx` (no `shadcn add` needed). Do not assume the Radix prop shape from training data (AGENTS.md mandate).

### 3.2 — npm

- **None.** No date library, no charting lib, no animation lib. Percentage math is `Math.round`/`Math.min`/`Math.max`; the fill animates via a CSS transition; viewport detection uses the built-in `IntersectionObserver`. Zero new npm packages.

### 3.3 — internal registry dependencies

- **None (D-03).** This component imports **no** other registry component. It re-declares its `Milestone` slice and the `GamificationEvent` union slice locally in `types.ts` (system §4 / §6 are the source of truth — copied, not imported; "minor type duplication across folders is accepted as the price of independence" — system §7.3).
- Consequently `registry.json` carries **no `registryDependencies` to other `@ilinxa/*` items** — only the shadcn `progress` primitive (§3.1). `validate:meta-deps` will pass because the only declared dep (`progress`) is actually imported (transitively, via `ProgressTrack`).

### 3.4 — one-off plumbing prerequisite (system D-01)

The `gamification` category **does not yet exist** in the registry (confirmed: [`src/registry/categories.ts`](../../../src/registry/categories.ts) currently has 10 categories, none named `gamification`). Per system D-01, **before** `pnpm new:component gamification/team-progress-bar-01` can run, the category must be plumbed in:

1. Add `"gamification"` to `ComponentCategorySlug` in [`src/registry/types.ts`](../../../src/registry/types.ts).
2. Add a `gamification` row to `CATEGORIES` in [`src/registry/categories.ts`](../../../src/registry/categories.ts) (suggested: `label: "Gamification"`, `description: "Cooperative team progress, badges, challenges, quests."`, `order: 11`).
3. Confirm [`scripts/new-component.mjs`](../../../scripts/new-component.mjs) accepts the new category slug (it reads from `categories.ts`, so step 2 should suffice — verify).

This is a **one-off PR shared by all six gamification components** (system §10 step 3), not owned by this plan, but it **blocks the scaffold step here** — flag it as a build-order dependency.

---

## 4. Composition pattern — the light compound (export surface)

Per [`.claude/rules/compound-component-structure.md`](../../../.claude/rules/compound-component-structure.md) and system D-05. **Flat exports, never a `TeamProgressBar.Root` namespace.** The track part co-locates a **dumb Tier-C core** (`ProgressTrack`) + a **thin Tier-B context wrapper** (`TeamProgressBarTrack`) — the media-library-01 one-file-two-exports pattern, scaled down.

### 4.1 — Tier inventory (the GATE-2 enumeration the rule requires) — LOCKED

| Export | Tier | Module | Reads context? | Role |
|---|---|---|---|---|
| `TeamProgressBarRoot` | **B (provider)** | `parts/team-progress-bar-root.tsx` | provides | Resolves `pct` from `value`/`milestones` (via `lib/resolve-progress.ts`), owns the `progress-bar.checked` telemetry emit (via `use-progress-telemetry`), holds `TeamProgressBarContext`. Renders `children`. **No data/persistence state, no layout opinion.** Takes `TeamProgressBarRootProps`. Mounts the IntersectionObserver target ref. |
| `TeamProgressBarTrack` | **B** | `parts/team-progress-bar-track.tsx` | yes | Reads `useTeamProgressBar()` → renders the Tier-C `ProgressTrack` with the resolved `pct`, plus optional milestone ticks (when `showTicks` + `milestones`). Carries `role="progressbar"` + ARIA. |
| `TeamProgressBarLabel` | **B** | `parts/team-progress-bar-label.tsx` | yes | Reads context → renders the readout (`"62%"` / `"5 / 8 milestones"`), optionally prefixed with `team.name` (`"Team Aurora — 62%"`). JetBrains Mono for the number. |
| `ProgressTrack` | **C (primitive)** | `parts/team-progress-bar-track.tsx` | no | Dumb, prop-driven fill bar over the shadcn `progress` primitive. Takes `pct: number` (0–100) + optional `ticks` array. Usable anywhere with zero context. The `Track` part is a thin context wrapper over it. |
| `TeamProgressBar01` | **A (assembly)** | `team-progress-bar-01.tsx` | no (composes B parts) | `Root` + `Track` + (`showLabel` ? `Label`). `showTicks` threads to `Track`. Contains **no logic the parts don't.** Demo + screenshot use this. |
| `useTeamProgressBar` | hook | `hooks/use-team-progress-bar.ts` | — | context consumer for hand-assembled layouts; throws if used outside `Root`. |

**Why two parts, not one (Q-1 justification, for the reviewer):** `Track` and `Label` are genuinely separable — a slim header wants `Track` alone (§6.3 of the description: `<TeamProgressBarRoot><TeamProgressBarTrack /></TeamProgressBarRoot>` with no `Label`), and `Label` reads the same resolved `pct` from context without re-deriving it. The `Root` is not ceremony: it is the **single place** the percentage is resolved and the **single place** telemetry fires — both parts and any hand-assembly read one resolved value, so the math + the emit can't drift or double-fire. That is the compound earning its keep at this small size. If the reviewer disagrees, §11's fallback collapses all three into one widget.

### 4.2 — Tree-shaking story (must be real)

- Each part is its own module re-exported from `index.ts`. A consumer importing only `{ TeamProgressBarRoot, TeamProgressBarTrack }` never pulls `TeamProgressBarLabel`'s code → the label (and its mono-font readout formatting) falls out.
- **No heavy dep → no `React.lazy` needed** (system §0 / description §0). The whole component is light by construction; the only third-party weight is the shadcn `progress` primitive, which `ProgressTrack` always needs (it is the floor, not an optional viewer).
- `ProgressTrack` (Tier C) is importable standalone — a consumer wanting a dumb lime bar with no telemetry/context pays nothing for the `Root`'s observer or the resolver.

### 4.3 — Root holds context; assembly is logic-free

`TeamProgressBarRoot` is the single source of the resolved `pct` + the telemetry emit. `TeamProgressBar01` is a fixed child tree (`Track` always; `Label` gated by `showLabel`; `showTicks` threaded to `Track`) with **zero** logic of its own — so a hand-assembled layout (description §6.3) gets identical resolution + identical single-fire telemetry. A reviewer rejects any percentage math or emit logic that lives in the assembly but not the `Root`.

---

## 5. The percentage resolver — the one piece of real logic (`lib/resolve-progress.ts`, pure)

This is the deterministic chokepoint from description §4. It is the **only** non-trivial logic and it is **pure** (test-ready, SSR-safe).

```ts
// All inputs are props; no Date, no layout read → identical on server + client.
export interface ResolvedProgress {
  pct: number;            // clamped 0..100, integer
  doneCount: number | null;   // null in value-only mode
  total: number | null;       // null in value-only mode
  ticks: { done: boolean; label: string }[] | null; // ordered; null unless milestones present
}

export function resolveProgress(args: {
  value?: number;
  milestones?: Milestone[];
}): ResolvedProgress;
```

**Resolution order (deterministic — locked, per description §4):**

```
if value != null:          pct = clamp(round(value), 0, 100); doneCount = total = null; ticks = null
                           // if milestones ALSO supplied → dev-warn (redundant), value wins (Q-2)
else if milestones?.length: total = milestones.length
                           doneCount = milestones.filter(m => m.done).length
                           pct = total === 0 ? 0 : round(doneCount / total * 100)   // total===0 guarded
                           ticks = [...milestones].sort(byOrder).map(m => ({ done: m.done, label: m.label }))
else:                       pct = 0; doneCount = total = null; ticks = null   // empty/uninitialised → 0%, never hidden/NaN
```

- **`clamp(value, 0, 100)`** — a `value` of `-5` or `150` renders 0% / 100%, never an out-of-range fill.
- **`total === 0`** (a `milestones: []` array) → 0%, bar still renders (always-visible rule, system §2 / success criterion 3). Never `NaN`.
- **Tick ordering** — sort a *copy* by `milestone.order` ascending (never mutate the prop array); a filled notch ⟺ `done`.
- **Dev-warnings** (only `process.env.NODE_ENV !== "production"`, guarded so the check is dead-code-eliminated in prod, and **never reading `process.env` at module top-level** — call it inside the function):
  - both `value` and `milestones` supplied → `"[team-progress-bar-01] both `value` and `milestones` supplied; `value` takes precedence."`
  - `labelFormat: "fraction"` requested with no `milestones` → resolver returns `total: null`; the Label part falls back to `"percent"` and warns `"[team-progress-bar-01] labelFormat='fraction' requires `milestones`; falling back to 'percent'."`

> **Note on `process.env` portability (D-03 / registry rule):** registry code must not be env-specific. The `NODE_ENV` guard is the *one* sanctioned exception across the library (it is how every shadcn primitive and existing procomp gates dev-warnings) — it is erased in production builds and is not `next/*`. Keep it inside the function body, never at module scope, never as a side-effect.

---

## 6. State model

Deliberately minimal — **there is almost no state.**

- **No reducer, no data state.** The resolved `pct` is a pure `useMemo(() => resolveProgress({ value, milestones }), [value, milestones])` in the `Root`. Controlled by construction (the host owns `value`/`milestones`).
- **No controlled/uncontrolled UI-state trios** (unlike gantt's zoom/collapse/selection) — there is nothing for the user to toggle. `showLabel`/`showTicks`/`labelFormat` are static display props, not stateful.
- **The only stateful thing** is the telemetry "has-fired" guard, a `useRef<boolean>` inside `use-progress-telemetry` (§8) — never rendered, never causes a re-render.
- **Context value** = `{ pct, doneCount, total, ticks, team, labelFormat, showTicks }` — the resolved progress + the display intent, so `Track` and `Label` read one object. Memoized on the resolved-progress identity + the display props.

There is **no drag seam, no v2 mutation seam** to architect (the bar is read-only forever per system D-06 / §2 out-of-scope). The only forward-looking seam is the **deferred kit** (system §7.3): `resolveProgress` and the event factory are the prime candidates to hoist into `src/lib/gamification/` once 2–3 components prove the surface — so keep them as standalone pure functions, not inlined into the `Root`, to make that future extraction a move-not-rewrite.

---

## 7. File-by-file plan

Sealed folder under `src/registry/components/gamification/team-progress-bar-01/` (compound layout; `parts/` co-locates the Tier-B wrapper + Tier-C core per the house pattern):

| File | Contents | Shipped? |
|---|---|---|
| `team-progress-bar-01.tsx` | **Tier A** `TeamProgressBar01` assembly — `"use client"`; `Root` + `Track` + `showLabel`-gated `Label`; threads `showTicks`/`labelFormat`. The only public default-layout entry. | ✅ |
| `index.ts` | Barrel — flat exports: `TeamProgressBar01`, `TeamProgressBarRoot`, `TeamProgressBarTrack`, `TeamProgressBarLabel`, `ProgressTrack`, `useTeamProgressBar`, + all public types (`TeamProgressBarProps`, `TeamProgressBarRootProps`, `Milestone`, `GamificationEvent`). | ✅ |
| `types.ts` | **Framework-free, no `"use client"`.** Local `Milestone` slice (D-03, re-declared from system §4 — no import) + local `GamificationEvent` union slice (system §6 — at minimum the `progress-bar.checked` member; re-declare the full union for forward-compat or just the one member — **decide at §8**). `TeamProgressBarProps`, `TeamProgressBarRootProps`, context value type, `ProgressTrackProps`, `ResolvedProgress`. | ✅ |
| `lib/resolve-progress.ts` | **Pure, no directive.** `resolveProgress()` (§5) + the `clamp`/`round` helpers + dev-warn calls. Test-ready. | ✅ |
| `lib/event.ts` | **Pure, no directive.** Tiny factory `progressBarCheckedEvent(teamId): GamificationEvent` — the single place the event shape is constructed (kit-extraction candidate). | ✅ |
| `parts/team-progress-bar-root.tsx` | **Tier B** provider — `"use client"`; `useMemo` resolver, `use-progress-telemetry` wiring, IntersectionObserver target ref, `TeamProgressBarContext.Provider`, `reveal-up` wrapper. | ✅ |
| `parts/team-progress-bar-track.tsx` | **Tier B** `TeamProgressBarTrack` (context wrapper, ARIA, ticks) **+ Tier C** `ProgressTrack` (dumb fill bar over shadcn `progress`). One file, two exports, zero duplication. | ✅ |
| `parts/team-progress-bar-label.tsx` | **Tier B** `TeamProgressBarLabel` — readout formatting (`percent`/`fraction`), optional team-name prefix, mono number. | ✅ |
| `hooks/use-team-progress-bar.ts` | `TeamProgressBarContext` + `useTeamProgressBar()` (throws outside `Root`). | ✅ |
| `hooks/use-progress-telemetry.ts` | **`"use client"`.** IntersectionObserver-based "viewed once per mount" emit, double-fire-guarded, SSR-safe (§8). | ✅ |
| `dummy-data.ts` | `Milestone[]` fixtures: an 8-milestone team journey (e.g. 5 done / 3 pending → 62%) exercising ordering + labels; plus an empty `[]` and a direct-`value` example for the demo's edge tab. **Fixtures registry item.** | ✅ (as `-fixtures` sibling) |
| `demo.tsx` | Docs demo — tabs: **Direct value** (`value={62}`), **From milestones + ticks** (`labelFormat="fraction"`, `showTicks`), **Composed / lighter** (hand-assembled `Root`+`Track`, no `Label` — proves the compound), **Edge cases** (`total===0` empty, value+milestones both, 0% / 100%, no team name, reduced-motion note). | ❌ docs-only |
| `usage.tsx` | Consumer usage notes (React component; MDX not wired). | ❌ docs-only |
| `meta.ts` | Full `ComponentMeta`; `category: "gamification"`; `shadcn: ["progress"]`; version `0.1.0`; status `alpha`; today's date. **No `registryDependencies` to `@ilinxa/*` (D-03).** | ❌ docs-only |

**Out of the shipped registry** (docs-site only, per convention): `demo.tsx`, `usage.tsx`, `meta.ts`.

---

## 8. Telemetry firing — `progress-bar.checked` (the one behavior with a footgun)

System §6 / D-07 + description Q-4. The event is `{ type: "progress-bar.checked"; teamId: string }` — emitted via the optional `onEvent` callback. The component emits **only** the semantic event; the host adds the envelope (timestamp, anonymized IDs, app variant) at its transport layer.

**Firing semantics (locked):**
- **Once per mount, on first in-viewport reveal.** An `IntersectionObserver` (threshold `0`, ≥ 1 px visible) watches the `Root`'s wrapper ref. On the first intersection, fire `onEvent(progressBarCheckedEvent(team.id))`, then **disconnect the observer** (it never fires twice).
- **Double-emit guard:** a `useRef<boolean>(false)` `hasFired` flag — set true on emit, checked before emit. Belt-and-suspenders with the disconnect (covers StrictMode double-invoke + observer re-entry).
- **SSR-safe:** the observer is created in a `useEffect` (client-only); it never runs during render or on the server. No layout read on first paint.
- **`teamId` source:** `team.id` (D-15 — the `team` object carries identity for the payload + scope).
- **No `onEvent` → no observer.** If the consumer omits `onEvent`, the hook skips creating the observer entirely (pay-for-what-you-use; no idle observer).
- **Reduced re-renders:** the emit is a side effect; it never sets state, so it never triggers a re-render. `onEvent` is read through a ref (`useEffect`-stable) so a consumer passing an inline `onEvent={e => …}` (new identity each render) does not re-subscribe the observer.
- **NOT fired on hover/focus** (Q-4 locked) — keeping it a pure "feature-viewed" event, not a heartbeat (description risk: telemetry storm).

**`GamificationEvent` type decision (for §7 `types.ts`):** re-declare **only the `progress-bar.checked` member** as the local `GamificationEvent` type — this component emits exactly one event kind, and a narrow local type keeps the surface honest (a consumer's `onEvent` handler is correctly typed to receive only what this bar sends). The full §6 union is the system's contract, not this component's emit surface. *(If the reviewer prefers the full union re-declared for cross-component `onEvent` handler reuse, that is a one-line change — flag at sign-off; default is the narrow member.)*

---

## 9. Edge cases

| Case | Handling |
|---|---|
| `total === 0` (`milestones: []`) | `pct = 0`; bar renders at 0% (always-visible rule). Never hidden, never `NaN`. (§5) |
| `value` **and** `milestones` both supplied | `value` wins (Q-2); dev-warn the redundancy; ticks still render from `milestones` if `showTicks` (the ticks are a visual detail, the fill follows `value`) — **decision: ticks follow `milestones` when present even in value-mode, but the fill width follows `value`.** *(Flag at sign-off: alternative is to suppress ticks entirely in value-mode for strict precedence. Default = show ticks, fill from value.)* |
| `value` out of range (`< 0` / `> 100`) | `clamp(value, 0, 100)` → 0% / 100%. (§5) |
| `labelFormat: "fraction"` with no `milestones` | Fall back to `"percent"` + dev-warn (Q-3); never `"NaN / NaN"`. (§5) |
| No `team.name` | Label renders bare readout (`"62%"`), no `" — "` prefix. Telemetry still fires (uses `team.id`). |
| `onEvent` omitted | No IntersectionObserver created; no emit. (§8) |
| `showTicks` with no `milestones` | No ticks (ticks require milestone data); no warn (it is a benign no-op, documented in guide). |
| Very many milestones (e.g. 40) | Ticks render as thin notches; below a min-spacing they visually merge — acceptable for v1 (document a soft cap ~20 in guide; no hard error). Bar + readout unaffected. |
| Long `team.name` | Label truncates with `text-ellipsis`/`min-w-0` in flex; the numeric readout never truncates (it is the load-bearing value). |
| `prefers-reduced-motion: reduce` | Fill `width`/`transform` transition disabled (CSS media query); `reveal-up` entrance disabled. Bar snaps to value. (Q-5) |
| RTL | Fill grows from the inline-start; ticks order with `order` along the inline axis. Use logical properties (`inline-start`) so RTL works without a flip. v1 tested LTR; RTL is best-effort via logical props (note in guide). |
| Narrow / compact inline (header) | Label can be hidden (`showLabel={false}`) for a bar-only header; `ProgressTrack` is full-width-fluid. |
| SSR first paint | Pure pct → server and client render identical fill; observer + any motion are post-mount. (§2) |

---

## 10. Accessibility

- **The bar is a proper progressbar.** `TeamProgressBarTrack` carries `role="progressbar"` + `aria-valuenow={pct}` + `aria-valuemin={0}` + `aria-valuemax={100}` + an `aria-label` (default `"${team.name ?? 'Team'} progress: ${pct}%"`, overridable via the `aria-label` prop). This is the single accessible representation of the progress value.
- **The numeric readout** (`Label`) is plain text, announced as content; it is **not** redundantly given a role (the progressbar already carries `aria-valuenow`). When `showLabel={false}`, the `aria-label` on the track still conveys the value to AT.
- **Tick marks are decorative + labelled.** Each notch is `aria-hidden` for the live progress reading (the progressbar value is the source of truth), but carries a `title`/`aria-label` from `milestone.label` for hover/inspection, and **a filled vs empty notch is conveyed by shape + a non-color cue** (filled = solid + a subtle inset; empty = outline) so done-state reads without color vision. Ticks never become a second focus-stop list (avoid double-announcing — the gantt "single AT surface" lesson).
- **`prefers-reduced-motion`** respected for both the fill transition and the `reveal-up` entrance (§9, Q-5).
- **Color is not the only signal:** the lime fill vs the muted track is a strong contrast, and the readout text states the % numerically — so the value reads without relying on the fill color alone (success criterion 9).
- **No keyboard interaction** — the bar is read-only (no focus stop needed beyond the progressbar being in the a11y tree). No `tabIndex`. The `Tier-C ProgressTrack` carries `focus-visible` styles only for standalone reuse where a consumer wraps it in an interactive element.
- **Contrast:** lime `--primary` on `--muted` track meets contrast for a graphical object; the readout uses `--foreground`/`--muted-foreground` (token-driven, AA in both themes).

---

## 11. Risks & alternatives

Carried from description §8 (all still apply): scope-creep into comparison, over-engineering the compound, dual-input ambiguity, telemetry storm, `total===0` divide, SSR/reveal determinism, design-token drift.

**Plan-stage additions + resolutions:**

- **Comparison scope-creep guard (the #1 risk).** The API has **no slot for a second series, a second team, or a comparison number** — `TeamProgressBarProps` takes exactly one `team` and one progress source. This is enforced structurally: there is no `compareTo`, no `teams[]`, no `baseline` prop, and the resolver returns one `pct`. **GATE 3 verifies** the rendered output carries no second bar / ranking / per-member split anywhere (system §5.3 / D-08, success criterion 4). If a host asks for "the other team's bar for context," the answer is **no** — out of scope for the system.

- **Single-sealed-widget fallback (Q-1 alternative — the one open confirm).** If the reviewer judges the `Root`+2-parts compound adds ceremony without value, the fallback is **one sealed `team-progress-bar` component** (the `data-table` single-folder shape): one `team-progress-bar-01.tsx` exporting `TeamProgressBar01` with `showLabel`/`showTicks`/`labelFormat` props, the resolver inlined as a `useMemo`, no exported `Root`/`Track`/`Label`/`ProgressTrack`, no context, no `useTeamProgressBar`. This **loses** the §6.3 hand-assembled subset path but **keeps** the standalone API identical (`<TeamProgressBar01 team value />` is unchanged). The plan recommends the compound; the fallback is held ready. **This is the only thing needing a human nod at sign-off.**

- **`progress` primitive (F-cross-13 — LOW risk).** Already installed + a simple track/fill primitive, not a known divergence carrier (unlike tooltip/select/toggle-group). Standard first-ship consumer-tsc smoke suffices; no special 4-ship alarm. Mitigation pre-wired in §3.1 (drive the fill from our own resolved `pct` via inline style) so the fill is robust regardless. Read the installed `progress.tsx` before implementing (§3.1).

- **Dev-warn portability.** The `NODE_ENV` guard for dev-warnings is the one sanctioned env reference (§5) — kept inside function bodies, erased in prod. *Alternative:* a `silent`/`devWarnings` prop. Rejected — adds surface for a dev-only concern every shadcn primitive handles via `NODE_ENV`.

- **Ticks-in-value-mode ambiguity** (§9 row 2) — default chosen (show ticks from `milestones`, fill from `value`); the strict-precedence alternative (suppress ticks in value-mode) is the documented fallback. Flagged for sign-off.

- **Deferred-kit shape.** Keeping `resolveProgress` + `progressBarCheckedEvent` as standalone pure functions (not inlined) is a small upfront cost that makes the system §7.3 kit extraction a move-not-rewrite once 2–3 components land. *Alternative:* inline them for brevity. Rejected — the system explicitly names "progress math" + "the event factory" as the prime kit candidates (§7.3).

---

## 12. Verification plan (pre-GATE-3)

1. **Plumbing first (§3.4):** `gamification` category added to `types.ts` + `categories.ts`; `pnpm new:component gamification/team-progress-bar-01` succeeds.
2. `pnpm tsc --noEmit` clean · `pnpm lint` clean · `pnpm validate:meta-deps` clean (`progress` declared in `meta.shadcn` AND imported via `ProgressTrack`). **meta-deps gotchas:** in any file with side-effect imports, place the dep-declaring `from`-import FIRST (the audit regex stops at the first `from`); never reference a dep name only inside a comment (false-positive). (blackboard-01 + content-composer-01 lessons.)
3. `pnpm build` succeeds.
4. Docs render at `/components/team-progress-bar-01`; all demo tabs interactive; empty (`total===0`) renders a 0% bar (not nothing).
5. `pnpm registry:build`; spot-check `public/r/team-progress-bar-01.json` + `team-progress-bar-01-fixtures.json` (targets follow the locked `components/team-progress-bar-01/<sub>` convention; **no `demo.tsx`/`usage.tsx`/`meta.ts` shipped**; `progress` in `registryDependencies`; **no `@ilinxa/*` dep** per D-03).
6. **Compound proof:** the demo's "Composed / lighter" tab renders a hand-assembled `Root`+`Track` subset (no `Label`); confirm dropping `Label` from the import drops its code.
7. **Resolver unit tests (Vitest — informed-defer per house convention, but `lib/resolve-progress.ts` is written test-ready):** value-only clamp, milestones-only round, both (value wins + warn), `total===0` → 0%, `fraction` without milestones → percent fallback, tick ordering by `order`.
8. **Cooperative-only check (system §5.3 / D-08):** confirm no comparison/second-series/per-member surface in props OR rendered output.
9. **First-ship consumer smoke (standard):** after push, `pnpm dlx shadcn add @ilinxa/team-progress-bar-01` + consumer `pnpm tsc --noEmit` clean. `progress` is a simple, already-shipped primitive (low F-cross-13 risk), so this is routine verification, not an expected-divergence watch.
10. GATE 3: `docs/reviews/templates/review-spotcheck.md`, 5 dims (4 fixed + 1 rotating). Rotating dim = **Design system** (the signal-lime fill token compliance + reveal motion is this component's primary risk surface) or **Accessibility** (progressbar ARIA + tick labelling) — pick at review.

---

## 13. Definition of "done" for THIS document (stage gate)

- [x] Final API locked (§4.1 + §0); compound export surface enumerated (§4.1); tree-shaking + Root-holds-context stated (§4.2/4.3).
- [x] Percentage resolver specified deterministically (§5); minimal state model (§6).
- [x] File-by-file plan (§7) mirrors the sealed-folder + light-compound house pattern.
- [x] Dependencies locked: shadcn `progress` (new), **zero npm**, **zero `@ilinxa/*` registry deps** (D-03); category plumbing prerequisite flagged (§3.4).
- [x] Client/server, telemetry firing, edge cases, a11y, risks, verification all covered.
- [x] System contract honored: §4 domain model (local `Milestone` slice), §5 cooperative-only (no comparison surface), §6 telemetry (single `progress-bar.checked` event), D-03/D-05/D-06/D-07/D-08/D-09/D-13/**D-15** locked. (D-16 is a trophy-shelf/feedback-loop concern; noted as N/A here — this bar triggers no celebration.)
- [x] Description Qs Q-1..Q-5 resolved to recommended defaults + LOCKED (§0).
- [ ] **Open for GATE-2 sign-off:** (a) **Q-1** light-compound vs single-widget fallback (§11); (b) `GamificationEvent` narrow-member vs full-union re-declaration (§8); (c) ticks-in-value-mode default (§9 row 2). Defaults are recommended for all three; confirm or override.
- [ ] **User sign-off** → scaffold `gamification/team-progress-bar-01` (after the §3.4 category plumbing PR) + implementation begins.

After sign-off, deviations from this plan are loud and intentional, not silent.
