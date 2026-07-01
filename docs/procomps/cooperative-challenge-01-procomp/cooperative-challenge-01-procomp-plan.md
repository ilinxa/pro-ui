# `cooperative-challenge-01` — Pro-component Plan (Stage 2 / GATE 2)

> **Stage 2 of 3 · Status: DRAFT — pending GATE 2 sign-off**
> **Slug:** `cooperative-challenge-01` · **Category:** `gamification` · **Tier:** pro-component · **Structure:** light shadcn-style compound
> **Predecessor:** [`cooperative-challenge-01-procomp-description.md`](./cooperative-challenge-01-procomp-description.md) (GATE 1, signed off)
> **System:** E3 of the [`gamification-system`](../../systems/gamification-system/gamification-system-description.md) — Relatedness. Honors system §4 (domain model), §5 (cooperative-only / never-forced), §6 (telemetry), §8 (locked decisions incl. **D-15**).

This is the **how** — the implementation contract. Once signed off (**GATE 2**), `pnpm new:component gamification/cooperative-challenge-01` scaffolds the folder and code begins. Nothing here re-opens GATE-1 decisions (D-C1…D-C6 resolved below to LOCKED defaults); it operationalises them. Where this plan and the [system description](../../systems/gamification-system/gamification-system-description.md) disagree, the system doc wins — flag it back there.

> **Reviewer focus:** the **never-forced** literal-UI contract (§6 — the load-bearing rule of the whole component), the compound export surface (§4), the controlled-echo opt-in chokepoint + double-emit telemetry guard (§5), and the E6 done-state seam (§6.4). These are where a cooperative-challenge surface drifts.

---

## 0. Pre-build dependency (system D-01) — `gamification` category plumbing

`gamification` is **not yet a registry category** ([`src/registry/types.ts`](../../../src/registry/types.ts) `ComponentCategorySlug` and [`src/registry/categories.ts`](../../../src/registry/categories.ts) `CATEGORIES` both stop at `auth`). Per system **D-01**, this one-off plumbing PR must land **before** `pnpm new:component gamification/...` is run:

1. Add `"gamification"` to `ComponentCategorySlug` (`src/registry/types.ts`).
2. Add the `gamification` entry to `CATEGORIES` (`src/registry/categories.ts`) — `{ slug, label: "Gamification", description: "Cooperative, team-scoped motivation surfaces — progress, badges, challenges, quests.", order: 11 }`.
3. Confirm `scripts/new-component.mjs` accepts the new category (it validates against `ComponentCategorySlug` / `CATEGORIES`).

This is shared system plumbing, not component-specific; the first gamification component to build owns it. **Not blocking GATE 2 sign-off** of this plan, but blocking the scaffold step.

---

## 1. Summary of what we're building

A **safe-by-design cooperative challenge card**: renders **one** `Challenge` for **one** `Team` (D-C1) — label + member stack, a **collective** progress meter (`current / target`, never per-member, D-C2), a **whole-team** reward chip (D-08), and a **penalty-free, team-level opt-in control** where opted-out is a neutral first-class "joinable" state (D-C3, the never-forced rule made literal). On `done`, a **lightweight inline earned acknowledgement** — the heavy celebration is deferred to E6 `team-feedback-loop-01` (D-C4). Opt-in is **controlled-only** (D-C6); omitting `onOptInChange` collapses to a read-only card. Emits `challenge.opened` (first reveal, double-emit-guarded) + `challenge.opt-in` via `onEvent` (system §6).

Ships as a **light compound**: `CooperativeChallengeRoot` (headless) + flat context parts + Tier-C standalone primitives + `CooperativeChallenge01` assembly. Flat exports, **no `React.lazy`** (no heavy dep). Own `types.ts` slice — imports **no** other registry component (D-03).

---

## 2. Client vs server

**`"use client"` on the assembly, the Root, and every context part + hook** — i.e. `cooperative-challenge-01.tsx`, all `parts/*` that read context or hold the controlled-echo / telemetry effects, and `hooks/*`. The Tier-C primitives that take a click handler (`OptInToggle`) are client; the purely-presentational Tier-C cores (`ChallengeProgressMeter`, `ChallengeRewardChip`, `TeamMemberStack`) carry **no** directive and are importable from a server component's render position. Pure `lib/*` (derivation math, the event factory) and `types.ts` are **framework-free, no directive**.

Justification: the controlled opt-in toggle (`onClick`/`onChange` → `onOptInChange`), the `challenge.opened` mount-effect, and the StrictMode-safe double-emit guard all require the client. The component still server-renders (client components SSR + hydrate in Next 16). **SSR determinism** is preserved by construction: there is **no `Date.now()` / `new Date()` / `Math.random()` during render** — all rendered values derive purely from the `challenge` + `team` props, so server and first client render match (the `rich-card` hydration-mismatch lesson). The `challenge.opened` emit fires from a client `useEffect`, never during render.

---

## 3. Dependencies

### 3.1 — shadcn primitives (all already in `src/components/ui/`)

| Primitive | Used by | Purpose | Chosen? |
|---|---|---|---|
| `progress` | `ChallengeProgressMeter` | the collective meter bar fill (`current / target`) | ✅ — accessible track/fill with `aria-valuenow`/`max`; we pass the numeric count label alongside (mono). Beats a hand-rolled `div` width hack. |
| `avatar` | `TeamMemberStack` | member avatar pile + initials fallback | ✅ — house-standard avatar (used by gantt gutter / cards); gives initials fallback + image. |
| `button` | `OptInToggle`, header overflow | the opt-in/opt-out affordance + any disclosure | ✅ — the opt-in affordance is a **button-toggle**, not a `switch` (see decision below). |
| `badge` | `ChallengeRewardChip`, header | reward chip + "Earned" / "Optional" state badges | ✅ — token-based chip; no ad-hoc green. |
| `skeleton` | `CooperativeChallengeSkeleton` | empty/loading silhouette (card + meter shimmer) | ✅ — loading is a **Tier-C component**, not a `loading` prop (gantt precedent, §9). |

**Opt-in control: `button`-toggle, NOT `switch` — justified.** The description's API offers `switch` *or* button-toggle; we lock **button-toggle** because:
- The two states are **semantically labelled actions** ("Join this challenge" / "Leave challenge"), not a generic on/off — a labelled button reads the never-forced framing far better than a bare switch thumb (a switch invites "default state = expected state" reading, which subtly implies a *correct* answer; the whole point of D-C3 is that **neither** answer is penalised).
- A button lets the **label text itself** carry the `joinLabel` / `leaveLabel` copy override and sit beside the `noPenaltyHint` — central to making "no penalty" literal.
- `switch` is reserved as a future opt-in skin if a host wants the compact form; not v1. (Risk note §11.)

`switch` is therefore **declared as available but NOT used** in v1 → **omitted from `meta.dependencies.shadcn`** (declare only what's imported — `validate:meta-deps` would flag an unused dep).

**No new shadcn primitive is introduced** beyond what shipped components already exercise → **no F-cross-13 "new primitive" smoke risk** (the 4-ship pattern's trigger doesn't fire). `progress` / `avatar` / `button` / `badge` / `skeleton` are all in `src/components/ui/` already.

### 3.2 — npm

**None.** No date lib, no animation lib (the `reveal-up` entrance is the globals.css keyframe; the brief earned-ack is CSS). Zero npm packages.

### 3.3 — internal registry dependencies

**None (D-03).** This component imports **no** other registry component. It declares its own `Challenge` / `Team` / `GamificationEvent` slice in `types.ts` (§4). `registryDependencies` in both `meta.ts` and `registry.json` is **empty**. (Contrast gantt-timeline-01, which depends on `todo-rich-card`; this component deliberately does not — the type duplication across the pack is the accepted price of registry independence, system D-03/D-04. The deferred `gamification-kit` may dedupe later; do **not** import early.)

> **meta-deps note:** `validate:meta-deps` must pass with `internal: []`. Because there is no internal dep, the only watch-item is keeping `meta.dependencies.shadcn` exactly = the shadcn primitives actually imported (`progress`, `avatar`, `button`, `badge`, `skeleton`) — no more, no less.

---

## 4. Composition pattern — the compound (export surface)

Per [`.claude/rules/compound-component-structure.md`](../../../.claude/rules/compound-component-structure.md) + system **D-05**. **Flat exports, never a `CooperativeChallenge.Root` namespace.** Each part module co-locates a **dumb Tier-C core** + a **thin Tier-B context wrapper** (the media-library-01 one-file-two-exports pattern). It is a **light** compound — the "a reasonable consumer wants a subset" trigger fires (card-body-only, or opt-in-control-only), but no heavy-dep / composed-procomp trigger fires → **no `React.lazy`**.

### 4.1 — Tier inventory (LOCK — the GATE-2 enumeration the rule requires)

| Export | Tier | Module | Reads context? | Role |
|---|---|---|---|---|
| `CooperativeChallengeRoot` | **B (provider)** | `parts/cooperative-challenge-root.tsx` | provides | Owns the **controlled `optedIn` echo** (reads `challenge.optedIn`, never local data state — D-06), derives `progressFraction` + the state machine (`isJoinable`/`isActive`/`isComplete`/`hasReward`), emits **both** telemetry events (`challenge.opened` mount-effect double-emit-guarded + `challenge.opt-in` on toggle), exposes `CooperativeChallengeContext`. Renders `children`. **No layout opinion.** |
| `CooperativeChallengeHeader` | **B** | `parts/cooperative-challenge-header.tsx` | yes | challenge `label` (truncate + title attr) + optional `team.name` + `TeamMemberStack`; gated by `showMemberStack`. |
| `CooperativeChallengeProgress` | **B** | `parts/cooperative-challenge-progress.tsx` | yes | reads derived fraction + count → renders `ChallengeProgressMeter`. Collective only. |
| `CooperativeChallengeReward` | **B** | `parts/cooperative-challenge-reward.tsx` | yes | reads `reward` + `isComplete` → renders `ChallengeRewardChip` (earned vs available framing); auto-hides if no reward; gated by `showReward`. |
| `CooperativeChallengeOptIn` | **B** | `parts/cooperative-challenge-optin.tsx` | yes | the opt-in/opt-out control (catalogue C5); reads `optedIn` + handlers → renders `OptInToggle` + `noPenaltyHint`. Hides if `onOptInChange` is absent (capability-gating → read-only). Gated by `showOptIn`. |
| `ChallengeProgressMeter` | **C** | `parts/cooperative-challenge-progress.tsx` | no | dumb meter: `progress` bar fill from `current`/`target` + mono count label. Prop-driven. |
| `ChallengeRewardChip` | **C** | `parts/cooperative-challenge-reward.tsx` | no | dumb reward chip; `earned?: boolean` switches framing ("The team earns:" → "The team earned:"). |
| `OptInToggle` | **C** | `parts/cooperative-challenge-optin.tsx` | no | dumb, **context-free** opt-in button-toggle (`OptInToggleProps`, description §5); usable on any surface. |
| `TeamMemberStack` | **C** | `parts/team-member-stack.tsx` | no | dumb avatar pile of `team.members` (avatar + initials fallback + `+N` overflow chip); `max?` cap. |
| `CooperativeChallengeSkeleton` | **C** | `parts/cooperative-challenge-skeleton.tsx` | no | loading state — card silhouette + meter shimmer; zero state, composes anywhere (used instead of a `loading` prop, §9). |
| `CooperativeChallenge01` | **A (assembly)** | `cooperative-challenge-01.tsx` | no (composes B parts) | `Root` + `Header` + `Progress` + `Reward?` + `OptIn?`, gated by `show*`. **Contains no logic the parts don't.** Demo + screenshot use this. |
| `useCooperativeChallenge` | hook | `hooks/use-cooperative-challenge.ts` | — | context consumer for hand-assembled layouts (throws outside Root). |

### 4.2 — Tree-shaking story (must be real)

- Each part is its own module re-exported from `index.ts`. A consumer who wants **only** the penalty-free toggle imports `CooperativeChallengeOptIn` (with a Root) or the bare context-free `OptInToggle` — and never pulls the card chrome (`Header`/`Progress`/`Reward` modules don't enter the graph).
- A consumer who wants **only the avatar pile** imports `TeamMemberStack` alone.
- The **read-only progress card** falls out for free: omit `onOptInChange` → `CooperativeChallengeOptIn` renders nothing (capability-gating), no control code paths execute.
- **No `React.lazy`** — there is no heavy dep to defer (no other procomp, no pdf.js/Konva/etc.). The rule's lazy-boundary requirement applies only to heavy deps; this light compound is exempt. State this explicitly so a reviewer doesn't flag a missing lazy boundary.

### 4.3 — Root holds context; assembly is logic-free

`CooperativeChallengeRoot` is the single source of derived state + the telemetry chokepoint + the controlled-echo. `CooperativeChallenge01` is a fixed child tree with `show*` toggles and **zero** state of its own — so a hand-assembled layout (description §6.3) gets identical behavior (same events fire, same never-forced framing). A reviewer rejects any logic that lives in the assembly but not the parts.

---

## 5. State model + the two chokepoints (controlled echo · telemetry)

The component holds **no internal data state** (D-06). Everything rendered derives from props. Two behavioral chokepoints, both in the Root:

### 5.1 — Controlled-echo opt-in (single chokepoint, D-C6 LOCKED controlled-only)

- `challenge.optedIn` **is** the value. The `OptInToggle` reflects it directly; the Root holds **no** local `optedIn` state (the rich-card / calendar controlled-echo lesson — a toggle that holds local state and a controlled prop will desync).
- On toggle: the Root computes `next = !challenge.optedIn`, calls `onOptInChange?.(next)`, then emits `challenge.opt-in` with `{ optedIn: next }` (order: host-callback first, then telemetry — mirrors the family's veto-friendly pattern; though there's no veto here, the host owns the value and re-renders with the new `challenge.optedIn`).
- **No `defaultOptedIn` / uncontrolled mode in v1** (D-C6). If `onOptInChange` is omitted, the control hides entirely (read-only card) — there is no "uncontrolled internal toggle" path. Add `defaultOptedIn` only if a real uncontrolled need surfaces (flagged §11).

### 5.2 — Telemetry (system §6, D-07 — portable, no SDK, no `next/*`)

- **`challenge.opened`** — emitted **once** on first reveal/mount of the card (D-C5), from a client `useEffect`. **Double-emit guard:** a `useRef(false)` `firedRef` set inside the effect, so React 19 StrictMode's double-invoke and any re-render don't re-fire. Re-keys on a **change of `challenge.id`** (a different challenge mounted into the same Root → a new "opened" is correct) — guard is `if (firedRef.current === challenge.id) return; firedRef.current = challenge.id;`. Pure `{ type: "challenge.opened", teamId: team.id, challengeId: challenge.id }`.
- **`challenge.opt-in`** — emitted on toggle (§5.1), `{ type, teamId, challengeId, optedIn: next }`.
- Both built by a tiny pure factory in `lib/events.ts` (`openedEvent(team, challenge)` / `optInEvent(team, challenge, optedIn)`) so the shapes are testable and the union stays single-sourced from `types.ts`.
- All emits flow through `onEvent?.(e)` — optional; absent → no-op. No analytics SDK, no `next/*`.

### 5.3 — Derived values (pure, `lib/derive.ts` — deterministic, no clock)

```
progressFraction = clamp(progress.current / max(progress.target, 1), 0, 1)
countLabel       = `${progress.current} / ${progress.target}`   // mono
isJoinable       = !optedIn && !done       → neutral "Join this challenge" card
isActive         =  optedIn && !done       → active in-progress card
isComplete       =  done                    → earned/completed treatment
hasReward        = reward != null && reward.trim() !== ""
```

`max(progress.target, 1)` divisor avoids divide-by-zero (target 0 edge, §10). No component-invented progress notion (system D-09 spirit) — progress is exactly `challenge.progress`.

---

## 6. Never-forced — the load-bearing rule (system §5.2, description §8)

This is the single most important section to get right; GATE 3 verifies it. The rule is made **literal in the UI**, not just documented.

### 6.1 — Opted-out is a neutral, first-class "joinable" state — NOT greyed-as-failure

- `isJoinable` renders the card at **full opacity** with a **neutral surface** (`--card` / `--muted` accents — **never** `--destructive` or a dimmed/disabled treatment). The goal + reward are shown as *available if you join*, not crossed-out or locked.
- A **prominent, inviting** "Join this challenge" affordance (the `joinLabel`, default `"Join this challenge"`), sized/placed as a primary action — the opted-out state must read as *an open invitation*, never *a thing you've lost / been excluded from*.
- A **visible `noPenaltyHint`** (default `"Optional — no penalty for sitting this one out"`) sits beside the control in **both** states — making cost-free explicit in copy, not just in behavior.

### 6.2 — Opt-out is always available, no guilt/confirm pattern

- When `isActive` (opted-in), the control flips to `leaveLabel` (default `"Leave challenge"`) — a **plain, single-click** action. **No** confirmation dialog, **no** "are you sure you want to abandon?" copy, **no** warning tone. Leaving is as cost-free as joining (system §5.2). The `noPenaltyHint` stays visible.
- There is **no prop, mode, or path** that forces a team into a challenge or blocks leaving (system §5.3, D-08 — verified by the absence of any `required` / `locked` / `mandatory` surface).

### 6.3 — Progress is COLLECTIVE only — never per-member (D-C2)

- `ChallengeProgressMeter` renders **one** bar + **one** `current / target` count. There is **no** per-member row, list, ranking, comparison number, or "you still need to commit" framing anywhere — that would drift toward per-individual tracking (excluded by design, system §5.3; a per-member breakdown would need a researcher check, catalogue Hard Guardrails).
- `TeamMemberStack` is the **only** member-level surface, and it is an *identity* pile (who's on the team), **not** a progress display — no per-avatar checkmark / done-state / contribution badge. It reinforces *shared goal*, nothing more.

### 6.4 — Whole-team reward (D-08) + done = lightweight inline ack; E6 owns the celebration (D-C4) — the seam

- `ChallengeRewardChip` copy frames the reward as the **team's collectively**: *"The team earns: …"* (available) → *"The team earned: …"* (`isComplete`). **Never** first-person ("you'll get") — a first-person framing violates D-08. No per-member reward path exists.
- **`done` treatment is a lightweight inline earned acknowledgement**: signal-lime success accent on the card + meter, reward chip switches to "earned", and a **brief (<1s) non-blocking** acknowledgement (a small inline "Completed together" pill + the `reveal-up`/scale micro-motion, `prefers-reduced-motion`-respecting). **No modal, no blocking overlay** (system D-10 non-blocking ethos).
- **The E6 seam (document it explicitly):** the heavy celebration overlay belongs to **E6 `team-feedback-loop-01`** (catalogue C9, system §7.4). This component's `done` is the *durable inline* surface; a host that wants the *transient flourish* mounts `team-feedback-loop-01` alongside and routes the milestone/challenge-done event there. **Neither component triggers the other** (system D-16 spirit — though D-16 names trophy-shelf+feedback-loop, the same "host wires exactly one celebration path per event" discipline applies). This component **never** imports or invokes E6. The seam is: *host owns the wiring; we provide the inline ack only.* Keeping this lightweight is what prevents done-state scope-creep into E6 (risk §11).

---

## 7. File-by-file plan

Sealed folder under `src/registry/components/gamification/cooperative-challenge-01/` (compound layout; `parts/` co-locates Tier-B wrappers + Tier-C cores per the house pattern):

| File | Contents |
|---|---|
| `cooperative-challenge-01.tsx` | **Tier A** `CooperativeChallenge01` assembly — `"use client"`; `Root` + `Header` + `Progress` + `Reward?` + `OptIn?`, `show*`-gated; the only public default-layout entry. **No logic the parts lack.** |
| `index.ts` | Barrel — flat exports (every Tier A/B/C name + `useCooperativeChallenge` + all public types: `Challenge`, `Team`, `TeamMember`, `GamificationEvent`, `CooperativeChallengeProps`, `CooperativeChallengeRootProps`, `OptInToggleProps`, the Tier-C prop types). **No re-export from another registry component** (D-03). |
| `types.ts` | **Framework-free.** Local slice: `Challenge`, `Team`, `TeamMember` (= `{ id; displayName; avatarUrl? }`), `GamificationEvent` (the local slice of the system §6 union — only the two events this component emits, see §8 note), `CooperativeChallengeProps`, `CooperativeChallengeRootProps`, `OptInToggleProps` + Tier-C prop types, context value type. Imports **nothing** from another registry component. |
| `parts/cooperative-challenge-root.tsx` | **Tier B** provider — controlled-echo, `lib/derive` memo, telemetry chokepoint (mount-effect + double-emit guard via `firedRef`), `CooperativeChallengeContext.Provider`. |
| `parts/cooperative-challenge-header.tsx` | **Tier B** `CooperativeChallengeHeader` (composes Tier-C `TeamMemberStack`). |
| `parts/cooperative-challenge-progress.tsx` | **Tier B** `CooperativeChallengeProgress` + **Tier C** `ChallengeProgressMeter`. |
| `parts/cooperative-challenge-reward.tsx` | **Tier B** `CooperativeChallengeReward` + **Tier C** `ChallengeRewardChip`. |
| `parts/cooperative-challenge-optin.tsx` | **Tier B** `CooperativeChallengeOptIn` + **Tier C** `OptInToggle` (the context-free bare toggle). |
| `parts/team-member-stack.tsx` | **Tier C** `TeamMemberStack` — avatar pile + initials fallback + `+N` overflow. |
| `parts/cooperative-challenge-skeleton.tsx` | **Tier C** `CooperativeChallengeSkeleton` — card + meter shimmer for the loading state (§9). |
| `hooks/use-cooperative-challenge.ts` | `CooperativeChallengeContext` + `useCooperativeChallenge()` (throws if used outside Root). |
| `lib/derive.ts` | pure derivations (§5.3): `progressFraction`, `countLabel`, `isJoinable`/`isActive`/`isComplete`/`hasReward`. |
| `lib/events.ts` | pure event factory: `openedEvent(team, challenge)` / `optInEvent(team, challenge, optedIn)`. |
| `dummy-data.ts` | `Challenge` + `Team` fixtures exercising every state: joinable (opted-out) · active (opted-in, partial progress) · complete (`done`) · no-reward · target-0 edge · single-member team · full-stack (overflow) team · long-label challenge. **Fixtures registry item.** |
| `demo.tsx` | Docs demo — tabs: **States** (joinable / active / complete / no-reward / loading) · **Read-only** (omit `onOptInChange` → control hides) · **Composed / lighter** (hand-assembled bare `OptInToggle` + `TeamMemberStack`, proves the compound) · **Team sizes** (single ↔ full overflow). |
| `usage.tsx` | Consumer usage notes (React component; MDX not wired). |
| `meta.ts` | Full `ComponentMeta`; `category: "gamification"`; `dependencies.shadcn: ["progress","avatar","button","badge","skeleton"]`; `dependencies.internal: []`; `dependencies.npm: {}`. |

**Out of the shipped registry** (docs-site only, per convention): `demo.tsx`, `usage.tsx`, `meta.ts`.

---

## 8. Final API (LOCKED surface)

Per description §5, with these plan-stage locks. **All names flat.**

```ts
// types.ts — declared LOCALLY (D-03). No import from another registry component.

export interface TeamMember {
  id: string;
  displayName: string;
  avatarUrl?: string;
}

export interface Team {                       // D-15: renders team-identity TEXT → takes a `team` object
  id: string;
  name: string;                               // → optional header name + telemetry scope
  members: TeamMember[];                       // → TeamMemberStack avatar pile
}

export interface Challenge {                   // ONE challenge in v1 (D-C1)
  id: string;
  label: string;                              // → header label (truncate + title attr)
  optedIn: boolean;                            // → controlled opt-in value (D-C6); refusing has no penalty
  progress: { current: number; target: number }; // → collective meter ONLY (D-C2)
  reward?: string;                             // → whole-team reward chip (D-08); undefined → hidden
  done: boolean;                               // → lightweight inline earned treatment (D-C4)
}

// Local slice of the system §6 union — ONLY the two events this component emits.
export type GamificationEvent =
  | { type: "challenge.opened";  teamId: string; challengeId: string }
  | { type: "challenge.opt-in";  teamId: string; challengeId: string; optedIn: boolean };

export type CooperativeChallengeProps = {
  /** The shared team goal to render (one challenge in v1, D-C1). */
  challenge: Challenge;
  /** The team that owns the challenge — name + member stack + scope (D-15). */
  team: Team;

  // Opt-in — controlled, team-level, never forced (D-C6 controlled-only)
  /** Fires when the team opts in/out. Omit → read-only card (control hides). */
  onOptInChange?: (optedIn: boolean) => void;

  // Telemetry (system §6, D-07) — emits challenge.opened + challenge.opt-in
  onEvent?: (e: GamificationEvent) => void;

  // Assembly toggles (the parts also stand alone)
  showOptIn?: boolean;          // default true; false → card body only
  showReward?: boolean;         // default true (auto-hides if no reward)
  showMemberStack?: boolean;    // default true

  // Copy overrides (localize the never-forced framing)
  joinLabel?: string;           // default "Join this challenge"
  leaveLabel?: string;          // default "Leave challenge" (penalty-free)
  noPenaltyHint?: string;       // default "Optional — no penalty for sitting this one out"

  className?: string;
  "aria-label"?: string;
};

// Root = everything above MINUS the three assembly-only show* toggles, PLUS children.
export type CooperativeChallengeRootProps =
  Omit<CooperativeChallengeProps, "showOptIn" | "showReward" | "showMemberStack" | "className" | "aria-label">
  & { children: React.ReactNode };

// Tier-C context-free primitive (bare toggle, droppable anywhere)
export type OptInToggleProps = {
  optedIn: boolean;
  onOptInChange?: (optedIn: boolean) => void;
  joinLabel?: string;            // default "Join this challenge"
  leaveLabel?: string;           // default "Leave challenge"
  noPenaltyHint?: string;        // default "Optional — no penalty for sitting this one out"
  disabled?: boolean;
  className?: string;
};

// Tier-C presentational prop shapes (subsets):
export type ChallengeProgressMeterProps = {
  current: number; target: number; className?: string; "aria-label"?: string;
};
export type ChallengeRewardChipProps = {
  reward: string; earned?: boolean; className?: string;
};
export type TeamMemberStackProps = {
  members: TeamMember[]; max?: number; className?: string;  // max default 5 → +N overflow
};
```

**Locks:**
- `CooperativeChallengeRootProps` = `CooperativeChallengeProps` **minus** the three `show*` (assembly-only) + `className`/`aria-label` (the assembly's chrome props) **plus** `children`. The assembly's `show*` map to mounting/not-mounting parts.
- `GamificationEvent` is the **local two-event slice** of the system §6 union, **not** the full six-event union (D-03 — declare only what this component emits; the system doc is the source of truth for the full union, this is a faithful subset). A host wiring all six components widens the type at its own telemetry layer.
- **No generics.** `Challenge`/`Team` are fixed schemas. No `<T>`.
- `TeamMemberStack` `max` default **5** (then `+N`).

Feature-concept count (description §5 method): data (`challenge`+`team`) · controlled opt-in pair · `onEvent` · three `show*` · three copy overrides · `className`/`aria-label` ≈ **~11 concepts**, comfortably under the ~25 ceiling. ✅ A light compound.

---

## 9. Edge cases

| Case | Handling |
|---|---|
| `reward` undefined / empty string | `hasReward` false → `CooperativeChallengeReward` renders **nothing** (auto-hide, §5.3); `showReward` is moot. |
| `progress.target === 0` | Divisor `max(target, 1)` avoids NaN/Infinity; meter shows `0 / 0` (mono) at 0% fill; never crashes. Document as a degenerate-but-safe input. |
| `progress.current > progress.target` | `clamp(…, 0, 1)` caps the bar at 100%; the count label shows the raw `current / target` (host's truth, not silently rewritten). |
| Opted-out vs opted-in vs done | Three first-class treatments (§5.3 state machine): `isJoinable` (neutral/invite), `isActive` (lime accent, in-motion), `isComplete` (earned + inline ack). `done` wins over `optedIn` (a completed challenge shows earned regardless of opt-in flag). |
| Single-member team | `TeamMemberStack` renders one avatar, no `+N`. No "1 / 1" special-casing — the collective meter handles its own count. |
| Full / large team (> `max`) | Stack shows `max` avatars + a `+N` overflow chip; `+N` has an accessible label ("+3 more members"). |
| Long `label` | Truncate with ellipsis (single line / clamp), full text on `title` attr (no tooltip dep needed). |
| Long reward / hint copy | Reward chip wraps; `noPenaltyHint` wraps below the control. |
| Loading / empty | **Tier-C `CooperativeChallengeSkeleton`** (no `loading` prop — gantt precedent). Consumer mounts the skeleton while fetching. |
| `onOptInChange` omitted | Read-only card; `CooperativeChallengeOptIn` renders nothing (capability-gating). |
| Narrow width | Control wraps below the meter; member stack collapses to fewer avatars + `+N`; card is drop-in at varied widths. |
| RTL | Layout is logical-property friendly (flex + `gap`); v1 LTR-verified, RTL note in guide (no hard `left`/`right`). |
| `prefers-reduced-motion` | `reveal-up` entrance + the earned-ack micro-motion respect it (no scale/flash; instant state). |

---

## 10. Accessibility

- **Region:** the card is a labelled region — `role="group"` + `aria-label` (defaults to the challenge label; `aria-label` prop overrides).
- **Opt-in control (the key surface):** a **labelled, keyboard-operable button** (`<button>` from the `button` primitive). The visible text **is** the label (`joinLabel`/`leaveLabel`); state is conveyed by `aria-pressed` (`true` when opted-in) so AT announces "Leave challenge, pressed" vs "Join this challenge, not pressed". `Enter`/`Space` activate (native button). `disabled` → `aria-disabled` + non-focusable. The `noPenaltyHint` is associated via `aria-describedby` so it's announced with the control.
- **Progress meter:** the `progress` primitive carries `role="progressbar"` + `aria-valuenow={current}` / `aria-valuemin={0}` / `aria-valuemax={target}` + an `aria-valuetext` of the `current / target` count (so AT reads "3 of 5", not just a percentage). The mono count label is visible text, also referenced.
- **Member stack:** decorative avatars are `aria-hidden`; the stack carries one `aria-label` summarizing the team ("Team Aurora, 5 members") — not 5 separate announcements. The `+N` chip is part of that single label.
- **Completed state announced non-intrusively:** the earned-ack pill uses `aria-live="polite"` (NOT `assertive` — non-intrusive per system D-10) so the transition to `done` is announced once without stealing focus or blocking. No focus is moved on completion.
- **Color is not the only signal:** `isComplete` adds a check icon + "Completed together" text (not just the lime accent); `isJoinable` reads via the "Join" label + neutral tone (not via a dim/grey that could imply failure) — never-forced legibility without color vision.
- **Focus management:** no focus traps; tab order is header → meter → reward → control (natural DOM order). Focus ring on the control + any interactive avatar (none interactive in v1).

---

## 11. Risks & alternatives

Carried from description §8 (all still apply), with plan-stage resolutions:

- **Never-forced visual drift (THE load-bearing risk).** A greyed opted-out card reads as "you failed / locked out". **Mitigation (§6.1):** opted-out is full-opacity neutral `--card`/`--muted` (never `--destructive`/disabled), with a primary "Join" affordance + visible `noPenaltyHint`. GATE 3 verifies the opted-out state reads as *invitation*, not *failure* — this is the rotating review dimension candidate.
- **Per-individual leak.** Any "who committed" / "you still need to" framing drifts to per-member tracking (excluded, system §5.3). **Mitigation (§6.3):** progress is strictly collective (one bar + one count); `TeamMemberStack` is identity-only (no per-avatar state). No per-member surface exists in the type system — a per-member breakdown would need a researcher check first (catalogue Hard Guardrails), v2+ behind a flag if ever.
- **Done-scope-creep into E6.** The completed treatment must stay a lightweight inline ack; the heavy celebration is `team-feedback-loop-01`'s job. **Mitigation (§6.4):** `done` is durable inline only (<1s non-blocking, no modal); the E6 seam is documented (host wires the overlay alongside; neither triggers the other). GATE 3 verifies the ack is not a celebration overlay.
- **Whole-team reward framing.** Copy must say *the team earns/earned* — never "you'll get". **Mitigation:** `ChallengeRewardChip` copy is team-framed by construction; no first-person path; no per-member reward field in the type.
- **Telemetry double-emit (StrictMode / re-render).** **Mitigation (§5.2):** `firedRef` keyed on `challenge.id`; emit from a client `useEffect`, never during render.
- **Controlled echo desync.** **Mitigation (§5.1):** single chokepoint; no local `optedIn` state; `OptInToggle` reflects `challenge.optedIn` directly.
- **Type duplication across the pack** (declaring `Challenge`/`Team` locally). Accepted as the price of registry independence (D-03/D-04). The deferred `gamification-kit` (system §7.3) may dedupe later; **do not import early.**
- **Design-token discipline.** Success/earned accent = signal-lime (no ad-hoc green); meter track `--muted`, fill `--primary`; reward chip token-based; neutral opted-out `--muted`/`--secondary` (not `--destructive`). No hard-coded colors (D-13).

**Plan-stage alternatives considered:**
- **`switch` vs `button`-toggle for opt-in** — **button chosen** (§3.1): a labelled action reads never-forced better than a bare switch (which implies a "correct" default). `switch` reserved as a future compact skin.
- **Loading prop vs `<CooperativeChallengeSkeleton>`** — **component chosen** (gantt precedent; keeps surface lean, composes).
- **Controlled-only vs `defaultOptedIn`** — **controlled-only** (D-C6); add uncontrolled only if a real need surfaces.
- **One challenge vs `ChallengeList`** — **one** (D-C1); a `ChallengeList` part is a v2 candidate if the recurring need proves out.
- **Full §6 event union vs local two-event slice** — **local slice** (D-03); faithful subset of the system union.

---

## 12. registry.json shipping plan

Per [`.claude/CLAUDE.md` Registry conventions] + the `shadcn-registry-pro` skill. **Two items** (base + fixtures), locked target convention.

**Base item — `cooperative-challenge-01`:**
- Every file `type: "registry:component"`, `target: "components/cooperative-challenge-01/<sub-path>"`.
- Files: `cooperative-challenge-01.tsx`, `index.ts`, `types.ts`, `parts/*` (root, header, progress, reward, optin, team-member-stack, skeleton), `hooks/use-cooperative-challenge.ts`, `lib/derive.ts`, `lib/events.ts`.
- `registryDependencies`: **`[]`** (D-03 — imports no other registry component).
- `dependencies` (shadcn primitives the consumer needs): `progress`, `avatar`, `button`, `badge`, `skeleton` — declared so `shadcn add` pulls them. **No npm deps.**
- **NEVER ship** `demo.tsx`, `usage.tsx`, `meta.ts` (docs-site only).

**Fixtures item — `cooperative-challenge-01-fixtures`:**
- `registryDependencies: ["cooperative-challenge-01"]` (depends on the base).
- One file: `dummy-data.ts`, `target: "components/cooperative-challenge-01/dummy-data.ts"`.

`pnpm registry:build` regenerates `public/r/cooperative-challenge-01.json` + `cooperative-challenge-01-fixtures.json`; spot-check both (targets follow `components/cooperative-challenge-01/<sub>`; no demo/usage/meta; `registryDependencies: []`).

---

## 13. Verification plan (pre-GATE-3)

1. `pnpm tsc --noEmit` clean · `pnpm lint` clean · `pnpm validate:meta-deps` clean (`shadcn: [progress, avatar, button, badge, skeleton]` = actually imported; `internal: []`). **meta-deps gotchas:** in any file with side-effect imports, place a dep-declaring `from`-import FIRST (the audit regex stops at the first `from`); never reference a dep name only inside a comment (false-positive). (blackboard-01 + content-composer-01 lessons.)
2. `pnpm build` succeeds.
3. Docs render at `/components/cooperative-challenge-01`; all demo tabs interactive.
4. `pnpm registry:build`; spot-check `public/r/cooperative-challenge-01.json` + `cooperative-challenge-01-fixtures.json` (locked target convention; no demo/usage/meta; `registryDependencies: []`).
5. **Compound proof:** the demo's "Composed / lighter" tab renders a hand-assembled subset (bare `OptInToggle` + `TeamMemberStack`); the "Read-only" tab proves capability-gating (omit `onOptInChange` → control hides). No `React.lazy` needed (light compound — state explicitly so the reviewer doesn't flag a missing lazy boundary).
6. **Never-forced verification (the load-bearing check):** opted-out renders neutral/inviting (not greyed-as-failure); opt-out is single-click no-confirm; `noPenaltyHint` visible in both states; progress is collective-only (no per-member surface); reward reads whole-team; `done` is inline non-blocking (no modal). This is a GATE-3 must-pass.
7. **Telemetry verification:** `challenge.opened` fires exactly once on mount (StrictMode-safe via `firedRef`), re-fires only on a new `challenge.id`; `challenge.opt-in` fires with `{ optedIn: next }` on toggle.
8. **Pure-lib tests (Vitest — informed-defer per house convention; `lib/derive.ts` + `lib/events.ts` written test-ready):** derivation correctness (target-0, over-100%, state-machine flags), event-factory shapes.
9. **First-ship consumer smoke (F-cross-11 path-b):** `pnpm dlx shadcn add @ilinxa/cooperative-challenge-01` succeeds + consumer `pnpm tsc --noEmit` clean. Because **no new shadcn primitive** is introduced and **no internal dep** exists, the F-cross-13 "new primitive divergence" + the content-composer "type-only-but-still-needs-registryDependency" traps don't fire — but run the smoke anyway (4-ship pattern discipline).
10. GATE 3: [`docs/reviews/templates/review-spotcheck.md`](../../reviews/templates/review-spotcheck.md), 5 dims (4 fixed core + 1 rotating). **Rotating dim = Accessibility** OR **Copy** (the never-forced framing lives in copy + a11y) — pick at review; **Robustness** is the backup if a11y proves trivially clean.

---

## 14. Decision resolutions (D-C1…D-C6 → LOCKED) + open Qs for sign-off

All six description Qs resolve to their recommended defaults, now **LOCKED** by this plan:

| # | Decision | Resolution (LOCKED) |
|---|---|---|
| **D-C1** | One challenge or a list? | **One `Challenge` per component in v1.** `ChallengeList` is a v2 candidate. |
| **D-C2** | How is progress shown? | **Collective meter only** — one bar + `current / target`. No per-member breakdown, ever (§6.3). |
| **D-C3** | Opt-in / opt-out UX | **Opted-out = neutral first-class joinable state; opt-out always available; no guilt/confirm; visible `noPenaltyHint`** (§6.1/6.2). Control = **button-toggle** (not `switch`, §3.1). |
| **D-C4** | Done/completed treatment | **Lightweight inline earned ack** (signal-lime, <1s, non-blocking, no modal); heavy celebration deferred to E6, seam documented (§6.4). |
| **D-C5** | `challenge.opened` emit timing | **On first reveal/mount**, double-emit-guarded via `firedRef` keyed on `challenge.id` (§5.2). |
| **D-C6** | Controlled-only or `defaultOptedIn` too? | **Controlled-only in v1** (§5.1). `defaultOptedIn` only if a real uncontrolled need surfaces. |

**Open Qs for GATE-2 sign-off** (none blocking; confirm or override):
- **Q-P1 (deps):** Confirm the **button-toggle over `switch`** lock for the opt-in control (§3.1) — the strongest never-forced reading, at the cost of a slightly larger control than a switch thumb. (Recommend: accept.)
- **Q-P2 (category plumbing):** Confirm this component (as an early gamification ship) **owns the D-01 `gamification` category plumbing** (§0) if it lands before a sibling — or note that `team-progress-bar-01` (the system's suggested first build, system §10) lands it first. (Recommend: whichever gamification component scaffolds first lands it; reference, don't duplicate.)
- **Q-P3 (event union):** Confirm the **local two-event `GamificationEvent` slice** (§8) rather than re-declaring the full six-event union (D-03 favors the minimal slice; a host widens at its telemetry layer). (Recommend: accept the slice.)
- **Q-P4 (skeleton vs loading prop):** Confirm `<CooperativeChallengeSkeleton>` Tier-C export over a `loading` prop (§9, gantt precedent). (Recommend: accept.)

---

## 15. Definition of "done" for THIS document (stage gate)

- [ ] Final API locked (§8); compound export surface enumerated (§4.1); tree-shaking + Root-holds-context stated (§4.2/4.3); **no `React.lazy`** justified.
- [ ] Never-forced rule made literal (§6 — neutral joinable state, always-available cost-free opt-out, collective-only progress, whole-team reward, inline-ack-not-celebration E6 seam).
- [ ] Controlled-echo + telemetry chokepoints specified (§5); double-emit guard locked.
- [ ] File-by-file plan (§7) mirrors the sealed-folder + light-compound house pattern.
- [ ] Dependencies locked (§3): shadcn `progress`/`avatar`/`button`/`badge`/`skeleton`; **no npm; no internal dep** (D-03).
- [ ] Client/server, edge cases, a11y, risks, registry shipping, verification all covered.
- [ ] D-01 category-plumbing pre-step noted (§0).
- [ ] D-C1…D-C6 resolved to LOCKED defaults (§14); open Qs Q-P1…Q-P4 flagged for sign-off.
- [ ] **User sign-off** → scaffold `gamification/cooperative-challenge-01` (after §0 plumbing) + implementation.

After sign-off, deviations from this plan are loud and intentional, not silent. Where this plan and the [system description](../../systems/gamification-system/gamification-system-description.md) disagree, the system doc wins.
