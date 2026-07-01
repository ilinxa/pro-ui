# `team-trophy-shelf-01` — Pro-component Plan (Stage 2 / GATE 2)

> **Stage 2 of 3 · Status: DRAFT — pending GATE 2 sign-off**
> **Slug:** `team-trophy-shelf-01` · **Category:** `gamification` · **Tier:** pro-component · **Structure:** shadcn-style compound
> **Element / SDT need:** E2 (Team Milestone Badges) / **Competence + Relatedness**
> **Predecessor:** [`team-trophy-shelf-01-procomp-description.md`](./team-trophy-shelf-01-procomp-description.md) (GATE 1)
> **System:** member of the [`gamification-system`](../../systems/gamification-system/gamification-system-description.md). Where this plan and the system description disagree, **the system description wins** — flag it back there.

This is the **how** — the implementation contract. Once signed off (**GATE 2**), `pnpm new:component gamification/team-trophy-shelf-01` scaffolds the folder and code begins. Nothing here re-opens GATE-1 decisions (D-03..D-16, D-a..D-h); it operationalises them. The `gamification` category plumbing (system **D-01**) is a one-off PR that must land before scaffolding.

> **Reviewer focus:** the compound export surface (§4), the diff-driven SSR-safe award seam (§6 — the heart of the build, and the same set-state-in-effect/hydration trap calendar-01 + rich-card solved), the lazy `BadgeAwardOverlay` boundary (§4.2), and the double-celebration guard against E6 (§11, D-16).

---

## 1. Summary of what we're building

A **team trophy shelf** — a gallery of the team's earned milestone badges, with honest **locked/empty slots** for what's ahead, an optional header (title + earned count), and a **brief (< 1s), skippable, non-blocking award reveal** when a badge transitions not-earned → earned. Plus the load-bearing standalone deliverable: the **`TeamMilestoneBadge`** token (earned + locked), usable inline anywhere with zero shelf scaffolding. Ships as a **compound**: `TeamTrophyShelfRoot` (headless) + flat context parts + Tier-C primitives + `TeamTrophyShelf01` assembly. The award diff is **diff-driven + SSR-safe** (no hydration flash where every badge "awards" on load); the richer confetti reveal lives behind a `React.lazy` boundary so the bare-token path and `animateAward={false}` drop it entirely. **Imports no other registry component** (D-03) — declares its own `Badge`/`Team`/`GamificationEvent` slice in its own `types.ts`.

---

## 2. Client vs server

**`"use client"` on every module that holds state, refs, or effects** — i.e. `team-trophy-shelf-01.tsx`, the Tier-B `parts/*` (Root holds the diff + telemetry; Grid/Header/Empty read context), the Tier-C `BadgeAwardOverlay` (animation + lazy chunk), and `hooks/*`. The **Tier-C `TeamMilestoneBadge`** is dumb + prop-driven but is bundled with the client parts; it carries `"use client"` only if it owns hover/focus state worth a directive — otherwise it stays directive-free for maximal reuse (decided at build; default: directive-free, the shelf supplies interactivity). Pure `lib/*` (resolution, diff) and `types.ts` are **framework-free, no directive** (importable from a server component's type position).

**Justification + SSR determinism:** the award trigger compares the incoming `badges` against the previous render (`prevBadgesRef`) and animates only the newly-earned — a client concern. **First paint is the settled state** (no animation): the diff is gated on a `mounted` flag set in a post-mount effect, and `prevBadgesRef` is initialised to the **first** render's badges, so on hydration `prev === current` for every badge → **nothing animates on load** (the calendar-01 / rich-card SSR-determinism lesson — never `Date.now()`/`new Date()` during render, never set state in an effect that the server can't reproduce). The component still server-renders the shelf + tokens in their settled state; only the reveal is deferred to the client.

---

## 3. Dependencies

### 3.1 — shadcn primitives (all already in `src/components/ui/` — no new primitive)

| Primitive | Used by | Purpose |
|---|---|---|
| `tooltip` | `TeamMilestoneBadge` (Tier C) | awarded-date on hover/focus for earned badges; full label when truncated. |
| `avatar` | — | **Not used.** Team-owned badges carry no per-person avatar (D-08); listed only to record the deliberate omission. |
| `badge` | `TeamTrophyShelfHeader` | the "4 / 9" earned-count pill. |
| `separator` | `TeamTrophyShelfHeader` | optional rule between title and count. |
| `skeleton` | — | **Not used** in v1; empty/locked states are designed surfaces, not skeletons. |

**Glyph source:** `lucide-react` (already a transitive dep across the library) for the default badge glyph (`Trophy` earned / `Lock` locked) and the `Flag`-style cue — overridable via `renderBadgeIcon`. No new npm.

**No new shadcn primitive is introduced → no F-cross-13 "new primitive" smoke risk** (the 4-ship pattern's trigger doesn't fire). `tooltip` (Radix-vs-Base-UI divergence) is already exercised by shipped components (calendar-01 v0.2.1 closed the divergence findings); we follow their proven usage — `<Tooltip>` with a real trigger element, `delayDuration` set, no controlled-open hacks.

### 3.2 — npm

- **Core reveal: zero new dep.** The settled-state reveal is **CSS only** — the `reveal-up` keyframe (already in [`globals.css`](../../../src/app/globals.css), line ~161) plus a short scale/opacity "pop" applied to a newly-earned token. This satisfies D-10 (< 1s, non-blocking) with no bundle cost and evaporates the lazy-boundary risk for the common case.
- **Richer celebration (optional, lazy only):** if a confetti/spark flourish is wanted on top of the CSS pop, it is isolated in `BadgeAwardOverlay` and either (a) hand-rolled with a tiny canvas/SVG burst (no dep, preferred) or (b) `canvas-confetti` declared in `meta.npm` + `registry.json` **and imported only inside the lazy chunk**. **Decision (LOCKED, D-e):** v1 ships the **hand-rolled SVG/CSS burst in the lazy overlay** — no npm animation dep. `canvas-confetti` is a documented v0.2 escalation if the burst reads as too plain. So **v1 declares no npm animation package.**

### 3.3 — internal registry dependencies

**None.** Per system **D-03** this component imports NO other registry component and declares its own `Badge` / `Team` / `GamificationEvent` slice locally in `types.ts`. There is therefore **no `registryDependency`** entry, and `validate:meta-deps` has no internal dep to reconcile — only the shadcn primitives (§3.1) + `lucide-react` must appear in `meta.ts` and be actually imported.

> **Contrast with the gantt precedent (the meta-deps trap, inverted):** gantt-timeline-01 *did* import `todo-rich-card` and had to declare `@ilinxa/todo-rich-card` in both `meta.ts` and `registry.json` (the content-composer-01 F-01 lesson). Here the opposite discipline applies — **resist "helpfully" importing the sibling's `Badge`/`Team` types** from `team-progress-bar-01` or the system folder. The minor type duplication is the deliberate price of distribution safety (description §8, system D-03/D-04). The MEMORY lesson "`internal:[]` ≠ registry.json `registryDependencies`" cuts the other way too: with genuinely zero runtime cross-imports, both must stay empty — do not add a phantom dep.

---

## 4. Composition pattern — the compound (export surface)

Per [`.claude/rules/compound-component-structure.md`](../../../.claude/rules/compound-component-structure.md). **Flat exports, never a `TeamTrophyShelf.Root` namespace.** Each part module co-locates a **dumb Tier-C core** + a **thin Tier-B context wrapper** (the media-library-01 one-file-two-exports pattern). This is a **small** compound (one heavy-ish concern — the award overlay — and one genuinely-reusable primitive — the badge token).

### 4.1 — Tier inventory (the GATE-2 enumeration the rule requires) — **LOCK**

| Export | Tier | Module | Reads context? | Role |
|---|---|---|---|---|
| `TeamTrophyShelfRoot` | **B (provider)** | `parts/team-trophy-shelf-root.tsx` | provides | Owns ALL state: derives the badge list (earned + locked slots from `showLocked`), computes the **newly-earned diff** (`prevBadgesRef` + `mounted` flag), owns hover/focus + opened-badge state, fires `onEvent` (`badges.viewed`) per the once-per-view model, holds `TeamTrophyShelfContext`. Renders `children`. **No layout opinion.** |
| `TeamTrophyShelfGrid` | **B** | `parts/team-trophy-shelf-grid.tsx` | yes | Responsive grid/row of `TeamMilestoneBadge` tokens; reads the resolved (earned + locked) list + `size` + the per-badge `isNewAward` flag, wraps newly-earned tokens in `BadgeAwardOverlay` when `animateAward`. |
| `TeamTrophyShelfHeader` | **B** | `parts/team-trophy-shelf-header.tsx` | yes | Optional title (`title` ?? `${team.name} trophies`) + earned-count `badge` ("4 / 9"). |
| `TeamTrophyShelfEmpty` | **B** | `parts/team-trophy-shelf-empty.tsx` | yes | The designed empty state (no badges defined / none earned yet) — encouraging, not an error. Renders only when the resolved list is empty. |
| `TeamMilestoneBadge` | **C** | `parts/team-milestone-badge.tsx` | no | **The load-bearing standalone deliverable.** Dumb, prop-driven token: earned (full color/glyph + awarded-date tooltip) vs locked (desaturated + lock cue) + `sm`/`md` + `renderIcon` slot + `onOpen`. Usable with zero shelf scaffolding (description §6.2). |
| `BadgeAwardOverlay` | **C (lazy host)** | `parts/badge-award-overlay.tsx` | no | The brief reveal flourish (hand-rolled SVG/CSS burst). The **only** weight-bearing module; mounted via `React.lazy` so the bare-token path + `animateAward={false}` never pull it. Wraps its `children` (the settling token); honors `prefers-reduced-motion` → renders children in settled state, no burst. |
| `TeamTrophyShelf01` | **A (assembly)** | `team-trophy-shelf-01.tsx` | no (composes B parts) | `Root` + `Header?` + (`Grid` | `Empty`) gated by `showHeader` / emptiness. **Contains no logic the parts don't.** Demo + screenshot use this. |
| `useTeamTrophyShelf` | hook | `hooks/use-team-trophy-shelf.ts` | — | context consumer for hand-assembled layouts (throws outside Root). |

> Flat names only (`TeamTrophyShelfGrid`, never `TeamTrophyShelf.Grid`). The Tier-C `TeamMilestoneBadge` is the reason the compound exists — it must fall out for free with nothing else in the graph.

### 4.2 — Tree-shaking story (must be real)

- Each part is its own module re-exported from `index.ts`. Dropping `TeamTrophyShelfHeader` drops its code.
- **`BadgeAwardOverlay` enters the graph ONLY via `React.lazy(() => import("./parts/badge-award-overlay"))`**, referenced solely from `TeamTrophyShelfGrid`, and only *invoked* when `animateAward !== false` AND a newly-earned badge exists. A consumer importing only `TeamMilestoneBadge`, or mounting the shelf with `animateAward={false}`, **never loads the overlay chunk** → the burst code stays out of their bundle. **Verified at GATE 3** by inspecting the built lazy-chunk boundary (the compound rule's lazy-boundary check; the media-library-01 / calendar-01 precedent).
- `tooltip`/`badge`/`separator` are imported only by the modules that use them; the bare-token path pulls just `tooltip` (+ `lucide-react` glyph) — nothing else.

### 4.3 — Root holds context; assembly is logic-free

`TeamTrophyShelfRoot` is the single source of state + the diff + the telemetry firing. `TeamTrophyShelf01` is a fixed child tree with `showHeader` + emptiness gating and **zero** state of its own — so a hand-assembled layout (description §6.3) gets identical behavior. A reviewer rejects any logic that lives in the assembly but not the parts.

---

## 5. The earned-vs-locked resolution + telemetry (`lib/resolve.ts`, pure where possible)

### 5.1 — Deterministic resolution (`lib/resolve.ts`, pure)

```ts
// awardedAt is the SINGLE source of truth (description §4).
isEarned(b)   = b.awardedAt != null
isLocked(b)   = b.awardedAt == null
// resolveSlots applies showLocked: showLocked=false drops locked badges from the rendered list.
resolveSlots(badges, showLocked) = showLocked ? badges : badges.filter(isEarned)
earnedCount(badges)   = badges.filter(isEarned).length      // header "4 / 9"
totalCount(badges)    = badges.length
```

### 5.2 — Newly-earned diff (`lib/diff.ts`, pure function consumed by the Root)

```ts
// prevById built from the previous render's badges (Root holds prevBadgesRef).
// mounted=false (first paint / SSR) → NO new awards, ever (settled state).
newlyEarned(current, prevById, mounted): Set<string> =
  !mounted ? EMPTY
  : new Set(current.filter(b => isEarned(b) && prevById.get(b.id)?.awardedAt == null).map(b => b.id))
```

This is the SSR-safe seam: a **pure** function the Root calls with `mounted` + the ref'd previous list, never `Date.now()`. See §6 for how the Root wires it without a set-state-in-effect.

### 5.3 — Telemetry firing model (D-h, LOCKED)

- `{ type: "badges.viewed"; teamId }` (no `badgeId`) fires **once** on first meaningful view of the shelf — gated by a `firedViewRef` boolean set in a post-mount effect (fires on mount when visible; **not** on every render, **not** on hover). v1 treats "mounted" as "viewed" (an `IntersectionObserver`-gated variant is a documented v0.2 refinement, kept out to stay lean).
- `{ type: "badges.viewed"; teamId; badgeId }` (with `badgeId`) fires on `onBadgeOpen` — i.e. when a badge is opened/inspected. **Never on hover.**
- `teamId` comes from `team.id`; `badgeId` from `badge.id`. The event shape is the system §6 union narrowed to `badges.viewed`, declared locally in `types.ts`.

---

## 6. State model — the SSR-safe award seam (the heart of the build)

- **Data:** fully controlled (`badges`, `team`) — the source of truth; the shelf is read-only (description §2: no editing/awarding from the UI). There is no uncontrolled data mode. The only owned UI state is `openedBadgeId` (selection/inspect) + the diff machinery.
- **The diff machinery (no set-state-in-effect, no hydration flash):**
  - `prevBadgesRef = useRef<Badge[]>(badges)` — initialised to the **first** render's badges, so on the initial/SSR render `prev === current` for every id.
  - `mountedRef` / a `mounted` state set **once** in a post-mount `useEffect(() => setMounted(true), [])`. Before mount, `newlyEarned` returns the empty set unconditionally → **first paint is the settled state**, server === client.
  - On each commit, after paint, an effect updates `prevBadgesRef.current = badges` **for the next diff** — but the *current* render's `newlyEarned` is computed from the ref's value captured at render time, so the comparison is always "this render vs the last". This avoids the trap where reading + writing the ref in the same pass makes everything diff against itself.
  - `animateAward={false}` short-circuits: `newlyEarned` is never computed, `BadgeAwardOverlay` is never referenced → its lazy chunk never loads (§4.2).
- **No reducer needed** (small surface): the Root uses `useState` for `openedBadgeId` + `mounted`, `useRef` for `prevBadgesRef` + `firedViewRef`, and `useMemo` for `resolveSlots` / `earnedCount` / the `newlyEarned` set. The "reconcile via `useMemo`, not a prune effect" lesson (blackboard-01) applies — derive, don't store-then-sync.
- **Why this is SSR-safe (explicit):** the entire animation decision is a pure function of (`badges`, `prevBadgesRef`, `mounted`). `mounted` is `false` on the server and on the client's first render, so both produce identical markup. The reveal only appears after a *subsequent* controlled `badges` update flips a badge's `awardedAt` from absent → present — exactly the host action D-d describes.

---

## 7. File-by-file plan

Sealed folder under `src/registry/components/gamification/team-trophy-shelf-01/` (compound layout; `parts/` co-locates Tier-B wrappers + Tier-C cores per the house pattern):

| File | Contents |
|---|---|
| `team-trophy-shelf-01.tsx` | **Tier A** `TeamTrophyShelf01` assembly — `"use client"`; `Root` + `showHeader`-gated `Header` + (`Grid` | `Empty`). The only public default-layout entry. No logic the parts lack. |
| `index.ts` | Barrel — flat exports (every Tier A/B/C name + `useTeamTrophyShelf` + all public types: `TeamTrophyShelfProps`, `TeamTrophyShelfRootProps`, `TeamMilestoneBadgeProps`, `BadgeAwardOverlayProps`, `Badge`, `Team`, `GamificationEvent`). **No re-export from another registry component** (D-03). |
| `types.ts` | Framework-free. Local `Badge` / `Team` / `GamificationEvent` slice (D-03 — NOT imported from anywhere) + `TeamTrophyShelfProps`, `TeamTrophyShelfRootProps`, `TeamMilestoneBadgeProps`, `BadgeAwardOverlayProps`, the context value type. |
| `parts/team-trophy-shelf-root.tsx` | **Tier B** provider — diff machinery (§6), telemetry firing (§5.3), `openedBadgeId` state, `useMemo` resolution, `TeamTrophyShelfContext.Provider`. |
| `parts/team-trophy-shelf-grid.tsx` | **Tier B** `TeamTrophyShelfGrid` — responsive grid; wraps newly-earned tokens in lazy `BadgeAwardOverlay` when `animateAward`. |
| `parts/team-trophy-shelf-header.tsx` | **Tier B** `TeamTrophyShelfHeader` — title + earned-count `badge` (+ optional `separator`). |
| `parts/team-trophy-shelf-empty.tsx` | **Tier B** `TeamTrophyShelfEmpty` — designed empty/none-earned state. |
| `parts/team-milestone-badge.tsx` | **Tier C** `TeamMilestoneBadge` — the bare token (earned + locked, `sm`/`md`, `renderIcon`, `onOpen`, awarded-date `tooltip`). The standalone deliverable. |
| `parts/badge-award-overlay.tsx` | **Tier C (lazy)** `BadgeAwardOverlay` — hand-rolled SVG/CSS burst wrapping its settling-token `children`; reduced-motion → settled, no burst. The only module behind `React.lazy`. |
| `hooks/use-team-trophy-shelf.ts` | `TeamTrophyShelfContext` + `useTeamTrophyShelf()` (throws if used outside Root). |
| `lib/resolve.ts` | `isEarned` / `isLocked` / `resolveSlots` / `earnedCount` / `totalCount` (pure). |
| `lib/diff.ts` | `newlyEarned(current, prevById, mounted)` (pure). |
| `dummy-data.ts` | `Badge[]` + `Team` fixtures exercising every state: empty, all-locked, all-earned, mixed, a stale `milestoneId`, long labels (truncation). **Fixtures registry item.** |
| `demo.tsx` | Docs demo — tabs: **Shelf** (mixed earned/locked + header), **States** (empty / all-locked / all-earned / single / dense), **Award reveal** (a button flips a badge's `awardedAt` to play the in-place reveal; reduced-motion + `animateAward={false}` toggles), **Bare token** (inline `TeamMilestoneBadge` next to a milestone — proves §6.2), **Composed / lighter** (hand-assembled `Root` + `Grid`, no header, `animateAward={false}` — proves the compound + dropped lazy chunk). |
| `usage.tsx` | Consumer usage notes (React component; MDX not wired). |
| `meta.ts` | Full `ComponentMeta`; **no `registryDependencies`** (D-03); dep list = shadcn primitives (`tooltip`, `badge`, `separator`) + `lucide-react`; `category: "gamification"`. |

**Out of the shipped registry** (docs-site only, per convention): `demo.tsx`, `usage.tsx`, `meta.ts`.

---

## 8. Final API (locked surface)

Flat exported names: `TeamTrophyShelf01` · `TeamTrophyShelfRoot` · `TeamTrophyShelfGrid` · `TeamTrophyShelfHeader` · `TeamTrophyShelfEmpty` · `TeamMilestoneBadge` · `BadgeAwardOverlay` · `useTeamTrophyShelf`, plus the public types.

```ts
import type * as React from "react";

// --- Local domain slice (D-03 — declared here, imported from NOTHING) ---
export interface Badge {
  id: string;            // React key; telemetry badgeId; diff identity
  label: string;         // badge label ("First playable build")
  awardedAt?: string;    // ISO 8601; undefined → NOT earned (locked slot) — the single discriminator
  milestoneId?: string;  // the milestone that earned it (shared spine, D-09); optional link target
}

// D-15: renders team-identity TEXT (name) → takes a `team` OBJECT subset of §4 Team,
// declaring only the fields it renders. `name` is OPTIONAL (D-15 + below).
export interface Team {
  id: string;            // telemetry teamId + scope
  name?: string;         // optional header-title fallback (`${name} trophies`)
}

// System §6 union narrowed to badges.viewed (declared locally).
export type GamificationEvent = { type: "badges.viewed"; teamId: string; badgeId?: string };

// --- The full shelf (Tier A assembly) ---
export type TeamTrophyShelfProps = {
  /** This team's badges — earned AND (optionally) not-yet-earned slots. */
  badges: Badge[];
  /** The owning team (telemetry teamId + optional header-title fallback). D-15. */
  team: { id: string; name?: string };

  // Display
  /** Render not-yet-earned badges as locked slots. Default true (D-c). */
  showLocked?: boolean;
  /** Render the shelf header (title + earned count). Default true. */
  showHeader?: boolean;
  /** Override the header title; defaults to `${team.name} trophies` (or "Team trophies" if no name). */
  title?: string;
  /** Token size in the shelf. Default "md". */
  size?: "sm" | "md";

  // Award animation (non-blocking, < 1s, skippable — D-10)
  /**
   * Animate newly-earned badges (diff vs previous render). Default true.
   * D-16: a host routing badge/milestone events to `team-feedback-loop-01` (E6)
   * MUST set this `false` so the moment is not celebrated twice. Neither component
   * triggers the other; the host wires exactly one path per event kind. See §11.
   */
  animateAward?: boolean;

  // Telemetry (system D-07 / §6; firing model D-h / §5.3)
  onEvent?: (e: GamificationEvent) => void;

  // Interaction (optional)
  /** Fired when a badge is opened/inspected; consumer wires what opens (e.g. its milestone). */
  onBadgeOpen?: (badge: Badge) => void;

  // Slots (optional, advanced)
  /** Custom badge artwork by glyph or full render; falls back to a lucide glyph + label. */
  renderBadgeIcon?: (badge: Badge) => React.ReactNode;

  className?: string;
  "aria-label"?: string;
};

// Root = the full props minus the assembly-only header toggle, plus children.
export type TeamTrophyShelfRootProps =
  Omit<TeamTrophyShelfProps, "showHeader"> & { children: React.ReactNode };

// --- Tier-C bare token — usable with zero shelf scaffolding ---
export type TeamMilestoneBadgeProps = {
  badge: Badge;
  size?: "sm" | "md";              // default "md"
  /** Render the locked state when not earned. Default true. */
  showLocked?: boolean;
  onOpen?: (badge: Badge) => void;
  renderIcon?: (badge: Badge) => React.ReactNode;
  className?: string;
};

// --- Tier-C lazy reveal overlay ---
export type BadgeAwardOverlayProps = {
  /** The settling token to wrap. */
  children: React.ReactNode;
  /** Run the burst (the Grid passes true only for a newly-earned id). Default false. */
  active?: boolean;
  /** Called when the < 1s reveal completes (for chaining / cleanup). */
  onDone?: () => void;
  className?: string;
};
```

- `showLocked` default **true** (D-c); `showHeader` default **true**; `size` default **"md"**; `animateAward` default **true** (D-d/D-16); `title` default `${team.name} trophies` → `"Team trophies"` when `name` is absent.
- **`team.name` is OPTIONAL** — D-15 says a component rendering team-identity text takes a `team` object subset; here the name only feeds an *optional* header title, so the object is `{ id: string; name?: string }`. The Root still needs `team.id` for telemetry/scope. (Flagged below as a refinement of the description's `name: string`.)
- **Generics:** none. `Badge`/`Team` are fixed local schemas.

Feature-concept count (excluding `className` / `aria-label` boilerplate): shelf **~9**, bare token **~5** — comfortably under the ~25 ceiling. ✅

---

## 9. Edge cases

| Case | Handling |
|---|---|
| **Empty** (no badges defined at all) | `resolveSlots` → `[]` → `TeamTrophyShelfEmpty` renders an encouraging "No trophies yet — milestones you complete will land here" surface (not an error, not a dead panel; Competence-positive). Header (if shown) reads "0 / 0". |
| **All-locked** (none earned yet) | With `showLocked` (default) → a full grid of locked slots (the journey ahead); header "0 / N". With `showLocked={false}` → resolves to `[]` → `Empty` state. |
| **All-earned** | Full grid of earned tokens; header "N / N"; no locked slots. |
| **Mixed** | Earned + locked interleaved in array order (host controls order; no in-shelf reorder, description §2 out-of-scope). |
| **Stale `milestoneId`** (points at a milestone the host no longer has) | The badge still renders (label + state are self-contained); `onBadgeOpen` fires with the badge — the **host** decides what (if anything) opens. The component never resolves `milestoneId` itself → no crash on a dangling id. |
| **Lazy chunk late vs dismiss** | If the user navigates away / `badges` updates again before the `BadgeAwardOverlay` chunk resolves: the lazy boundary's `Suspense` fallback is the **settled token** (never a spinner), so a late chunk simply means "no burst played" — never a flash of empty space, never a stuck overlay. If `active` flips false before the chunk loads, the overlay mounts settled and no-ops. |
| **Long label** | Truncate with ellipsis in the token; full label in `tooltip` (earned) / `title` attr (locked). |
| **`prefers-reduced-motion`** | Both the `reveal-up` entrance and the award burst skip to the settled state (not merely shortened) — verified at GATE 3. |
| **RTL / mobile** | Grid is a wrapping flex/grid → reflows. v1 LTR-tested; RTL is token-mirroring only (no axis math) so it works, documented as "tested LTR". `sm` size for narrow/inline. |
| **`onEvent` absent** | Telemetry is a no-op; no throw. |

---

## 10. Accessibility

- **Structure:** the shelf is a **navigable list** — `TeamTrophyShelfGrid` renders `role="list"`; each badge is a `role="listitem"`. The region carries `aria-label` (`aria-label` prop ?? "Team trophies").
- **Each badge announces:** its `label`, its **earned/locked** state, and (if earned) the **awarded date**. Concretely: an `aria-label` on each token like `"First playable build — earned 12 Mar 2026"` or `"First playable build — locked"`. The lock cue is **not color-only** (a `Lock` glyph + the aria text carry it), and earned uses the `Trophy` glyph + lime accent — so state reads without color vision (the gantt "color is not the only signal" discipline).
- **Interaction:** if `onOpen`/`onBadgeOpen` is wired, the token is a real `<button>` (keyboard-focusable, `Enter`/`Space` activate, `focus-visible` ring); if not, it is a non-interactive `listitem` with no tab stop (no dead focus targets — the todo-tree dead-permission-matrix lesson: don't ship affordances that do nothing). The awarded-date `tooltip` opens on hover **and** keyboard focus.
- **Award reveal is non-blocking + reduced-motion-safe:** the burst is `aria-hidden`, never traps focus, never steals it, and is purely decorative over the already-announced token — input/scroll are never blocked (D-10). With `prefers-reduced-motion` the badge simply appears settled; the state change is still conveyed because the token's `aria-label` already says "earned …".
- **Entrance:** one orchestrated `reveal-up` on first mount (60ms stagger across tokens), reduced-motion-aware — not a per-badge independent reveal (design mandate).

---

## 11. registry.json shipping plan

Per [`docs/component-guide.md §11.5`](../../component-guide.md#115-shipping-via-the-registry) + the `shadcn-registry-pro` skill. **Two items**, locked target convention: every file `type: "registry:component"`, `target: "components/team-trophy-shelf-01/<sub-path>"`. **Never ship `demo.tsx`, `usage.tsx`, or `meta.ts`.**

**Base item — `team-trophy-shelf-01`:**
- `team-trophy-shelf-01.tsx`, `index.ts`, `types.ts`
- `parts/team-trophy-shelf-root.tsx`, `parts/team-trophy-shelf-grid.tsx`, `parts/team-trophy-shelf-header.tsx`, `parts/team-trophy-shelf-empty.tsx`, `parts/team-milestone-badge.tsx`, `parts/badge-award-overlay.tsx`
- `hooks/use-team-trophy-shelf.ts`
- `lib/resolve.ts`, `lib/diff.ts`
- `registryDependencies`: **none** (D-03). `dependencies` (npm): `lucide-react`. shadcn primitives (`tooltip`, `badge`, `separator`) are referenced as `registryDependencies` to shadcn's own registry per house convention (they install from `@shadcn`), **not** as `@ilinxa/*` items.

**Fixtures sibling — `team-trophy-shelf-01-fixtures`:**
- `dummy-data.ts` only; `registryDependencies: ["@ilinxa/team-trophy-shelf-01"]` (depends on the base, adds the fixture). Target `components/team-trophy-shelf-01/dummy-data.ts`.

Smoke (F-cross-11 path-b, recommended on first ship): `pnpm dlx shadcn add @ilinxa/team-trophy-shelf-01` into a tmp consumer → consumer-side `pnpm tsc --noEmit` clean. Because there's **no internal registry dep**, the cross-procomp rewriter traps (content-composer-01 F-01 / gantt §3.3) do not apply here — but the **lazy `./parts/badge-award-overlay` relative import** must survive the rewriter (it's a relative dynamic `import()`, which the rewriter leaves untouched per the rewriter-import-rules) → verify the lazy chunk resolves in the consumer artifact.

---

## 12. Risks & alternatives

Carried from description §8 (all still apply): locked-vs-earned visual coherence, award-must-not-block-or-flash, lazy-boundary correctness, reduced-motion, **team-scope leakage**, telemetry over-firing, independence-vs-duplication, empty-state honesty.

**Plan-stage additions / resolutions:**

- **Lazy-boundary correctness (the compound-rule check).** Risk: `BadgeAwardOverlay` gets statically imported somewhere (e.g. a careless `import { BadgeAwardOverlay }` in the Grid) → its weight enters every consumer's bundle, defeating §4.2. **Mitigation:** the Grid references it **only** through `React.lazy(() => import("./parts/badge-award-overlay"))`; `index.ts` re-exports the *type* + a lazy-wrapped value for standalone use, never a static value import into the Grid. GATE 3 inspects the built chunk graph. Because the core reveal is CSS (`reveal-up` + a pop), even if a consumer drops the overlay entirely the award still reads — the overlay is pure enhancement.
- **Double-celebration vs E6 (D-16) — the cross-component risk.** Risk: a host mounts the shelf (`animateAward` default true) AND routes the same badge/milestone event to `team-feedback-loop-01` → the moment is celebrated twice. **Mitigation (contract, not code):** documented loudly on `animateAward` (JSDoc above + the guide) — set `animateAward={false}` to let the feedback-loop own the moment, OR don't push that kind to E6. **Neither component triggers the other** (system §7.4); the component carries no hook into E6 and exposes no "celebrate elsewhere" coupling. GATE 3 verifies the JSDoc + guide call this out.
- **Team-scope leak.** Risk: accidentally adding a per-person "awarded to <name>", an `avatar`, or a count that implies inter-team comparison. **Mitigation:** `avatar` is deliberately unused (§3.1); the `Team` slice has **no `members`**; no prop accepts a person; the header count is "N of this team's M", never a rank. GATE 3 verifies no per-individual / inter-team affordance anywhere (system §5.3 hard constraint).
- **SSR hydration flash (every badge "awards" on load).** Resolved by the `mounted`-gated pure diff (§6) — the single most important correctness seam, lifted directly from the calendar-01 + rich-card precedent. Alternative considered: an imperative `playAward(id)` handle (description D-d "nice-to-have") — **deferred to v0.2**; the diff-driven default covers the common case and an imperative handle adds a `useImperativeHandle` + ref surface not worth v1 weight.
- **Telemetry over-firing.** `badges.viewed` (no id) fires once via `firedViewRef`; the with-`badgeId` variant fires only on `onBadgeOpen`. Alternative (`IntersectionObserver` "meaningful view") deferred to v0.2 (lean surface).
- **Animation weight.** Chosen: **CSS core + hand-rolled lazy burst, zero npm** (§3.2). Alternative: `canvas-confetti` behind the lazy boundary — rejected for v1 (added dep for a < 1s flourish), documented as a v0.2 escalation if the burst reads plain.

---

## 13. Resolved decisions (D-a..D-h) + open Qs

System-inherited rows (**D-03..D-16**) are locked upstream and operationalised above. The component-specific questions resolve to recommended defaults — **LOCKED** unless flagged:

| # | Question | Resolution (LOCKED unless flagged) |
|---|---|---|
| **D-a** | Compound shape | **Compound** (D-05). Tier split §4.1. **LOCKED.** |
| **D-b** | Bare badge — own procomp or a part? | **A Tier-C part of this one** (system Q2). No separate `milestone-badge-01`. **LOCKED.** |
| **D-c** | Earned vs locked slots | **`showLocked` default true** — render locked slots (the journey). `awardedAt` is the discriminator (§5.1). **LOCKED.** |
| **D-d** | Award-animation trigger | **Diff-driven**, SSR-safe (§6); `animateAward={false}` opts out; imperative `playAward` handle **deferred to v0.2**. **LOCKED.** |
| **D-e** | Animation weight / dependency | **CSS `reveal-up` + pop for the core; hand-rolled SVG/CSS burst in the lazy `BadgeAwardOverlay`; ZERO npm animation dep in v1.** `canvas-confetti` = documented v0.2 escalation. **LOCKED.** |
| **D-f** | Badge artwork source | **Host `renderBadgeIcon` slot + lucide default** (`Trophy`/`Lock`). No artwork pipeline (out of scope). **LOCKED.** |
| **D-g** | Slug / category | `gamification/team-trophy-shelf-01`. Category plumbing (D-01) lands before scaffold. **LOCKED.** |
| **D-h** | Telemetry firing model | `badges.viewed` (no id) **once** on first view via `firedViewRef`; with `badgeId` on `onBadgeOpen`; never on hover (§5.3). **LOCKED.** |

**Open Qs needing GATE-2 sign-off:**

1. **`team.name` optionality (refines the description).** The description §4/§5 typed `Team.name: string` (required). D-15 says a name-rendering component takes a `team` object subset; since `name` here only feeds an **optional** header title, this plan types it **`name?: string`** (falling back to `"Team trophies"`). This is a *narrowing for ergonomics*, not a contract break — but it deviates from the description's literal `name: string`. **Confirm the optional `name`** (recommended), or revert to required if host wiring always supplies it.
2. **Richer celebration in v1?** Plan locks D-e to a hand-rolled burst, **no `canvas-confetti`**. Confirm we're comfortable shipping the lighter burst in v1 (recommended) vs pulling `canvas-confetti` (lazy) now. If confetti is wanted at v1, it adds one npm dep declared in `meta.npm` + `registry.json` behind the lazy chunk.
3. **Imperative `playAward(id)` handle** — deferred to v0.2 (diff-driven covers the common case). Confirm the defer (recommended).

Everything else is locked by the system + description.

---

## 14. Verification plan (pre-GATE-3)

1. `pnpm tsc --noEmit` clean · `pnpm lint` clean · `pnpm validate:meta-deps` clean (shadcn primitives + `lucide-react` declared AND imported; **no internal registry dep** to reconcile). **meta-deps gotcha:** in any file with side-effect imports, place the dep-declaring `from`-import FIRST; never reference a dep name only inside a comment (blackboard-01 + content-composer-01 lessons).
2. `pnpm build` succeeds.
3. Docs render at `/components/team-trophy-shelf-01`; all demo tabs interactive (the **Award reveal** tab must visibly play < 1s, non-blocking, and stop under `prefers-reduced-motion` / `animateAward={false}`).
4. `pnpm registry:build`; spot-check `public/r/team-trophy-shelf-01.json` + `team-trophy-shelf-01-fixtures.json` (targets follow `components/team-trophy-shelf-01/<sub>`; no demo/usage/meta shipped; **no `@ilinxa/*` registryDependency**).
5. **Compound proof:** the demo's "Composed / lighter" tab renders a hand-assembled `Root` + `Grid` (no header, `animateAward={false}`); bundle inspection confirms the `BadgeAwardOverlay` lazy chunk is **absent** from that path and from the bare-`TeamMilestoneBadge` path.
6. **SSR proof:** first server render === first client render (no badge animates on load); a subsequent controlled `badges` update flipping `awardedAt` plays exactly one reveal for the newly-earned badge.
7. **Unit-testable seams (Vitest informed-defer per house convention; pure `lib/*` written test-ready):** `resolveSlots` / `earnedCount`, `newlyEarned` diff (incl. `mounted=false` → empty), once-per-view firing.
8. GATE 3: [`docs/reviews/templates/review-spotcheck.md`](../../reviews/templates/review-spotcheck.md), 5 dims; rotating dim = **Robustness** (the SSR/lazy/diff seam is the risk surface) or **Accessibility** — pick at review.

---

## 15. Definition of "done" for THIS document (stage gate)

- [ ] Final API locked (§8); compound export surface enumerated (§4.1); tree-shaking + Root-holds-context stated (§4.2/4.3).
- [ ] SSR-safe diff-driven award seam specified (§6); lazy `BadgeAwardOverlay` boundary specified (§4.2).
- [ ] File-by-file plan (§7) mirrors the sealed-folder + compound house pattern.
- [ ] Dependencies locked — **no internal registry dep** (§3.3, D-03); shadcn primitives + `lucide-react` only.
- [ ] Telemetry firing model (§5.3) + cooperative-only/team-scope constraints (§12) carried as hard requirements.
- [ ] Double-celebration guard vs E6 documented (§11 D-16).
- [ ] D-a..D-h resolved (§13); 3 open Qs flagged for sign-off.
- [ ] registry.json shipping plan (§11); client/server, edge cases, a11y, risks, verification covered.
- [ ] **User approved to proceed** → scaffold `gamification/team-trophy-shelf-01` (after the D-01 category plumbing) + implementation.

After sign-off, deviations from this plan are loud and intentional, not silent.
