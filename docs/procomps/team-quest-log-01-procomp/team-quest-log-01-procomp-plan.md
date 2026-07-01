# `team-quest-log-01` — Pro-component Plan (Stage 2 / GATE 2)

> **Stage 2 of 3 · Status: DRAFT — pending GATE 2 sign-off**
> **Slug:** `team-quest-log-01` · **Category:** `gamification` · **Tier:** pro-component · **Structure:** shadcn-style compound (light)
> **Predecessor:** [`team-quest-log-01-procomp-description.md`](./team-quest-log-01-procomp-description.md) (GATE 1, signed off)
> **System:** element **E5** of the [`gamification-system`](../../systems/gamification-system/gamification-system-description.md) — Team Narrative Framing (Autonomy + Relatedness).

This is the **how** — the contract the implementation must follow. Once signed off (**GATE 2**), the `gamification` category is plumbed (system **D-01** / **D-A6** — one-off, see §3.4) and then `pnpm new:component gamification/team-quest-log-01` scaffolds the folder. Nothing here re-opens GATE-1 decisions (system D-03/05/06/07/08/09/13/15 + component D-A1/A2); it operationalises them and resolves the open recommendations (D-A3/A4/A5/A7) to locked defaults.

> **Reviewer focus:** the never-forced quest-name resolution (§6 — the most load-bearing constraint), the deterministic beat-state derivation (§7), the fire-once visibility telemetry (§8), and the compound export surface (§5).

---

## 1. Summary of what we're building

A **light team narrative overlay** — two distinct mountable surfaces over one team + its milestones:

1. a **quest-name editor** — display the resolved title (`questName?.trim() || name`) with an inline display↔edit toggle; clearing/saving blank reverts to the team's literal name (**skip path, never forced**); a quiet "name your quest" invitation when on the default; and
2. a **milestone-chapter timeline** — one chapter beat per `NarrativeChapter`, ordered, each framing a milestone, with deterministic **done / current / upcoming** beat states derived from `Milestone.done`.

Controlled, prop-driven, zero internal data store. Emits `narrative.chapter-viewed` telemetry once per chapter per mount. Ships as a **compound**: `TeamQuestLogRoot` (headless) + flat à-la-carte parts (`TeamQuestNameEditor`, `TeamQuestChapters`, optional `TeamQuestHeader`) + Tier-C primitives + `TeamQuestLog01` assembly. **Light compound — no `React.lazy`** (no heavy dep; the compound is for subset adoption, not weight shedding — D-A7).

This is deliberately **lighter than `gantt-timeline-01` / `calendar-01`** — chapters, not a time axis; story framing, not scheduling. It consumes **no** `TodoItem[]`, draws **no** continuous time axis, and imports **no other registry component** (system **D-03** — own `types.ts` slice).

---

## 2. Client vs server

**`"use client"`** on every module that holds state, refs, effects, or the IntersectionObserver — i.e. `team-quest-log-01.tsx`, all `parts/*`, all `hooks/*`. Pure `lib/*` (resolution, beat-state derivation) and `types.ts` are **framework-free, no directive** (importable from a server component's type position).

Justification: the name draft/edit state (`useState`), the `narrative.chapter-viewed` IntersectionObserver, the fire-once refs, and the optional `useImperativeHandle` all require the client. The component still server-renders (client components SSR + hydrate in Next 16).

**SSR-safe first paint:** the resolved title is a **pure function of props** (`questName?.trim() || name`) — it renders identically on server and client with **no `Date.now()` / random / measurement during render**, so the headline never hydration-mismatches. The IntersectionObserver attaches in a `useEffect` (client-only) and `typeof IntersectionObserver !== "undefined"` is checked before constructing it (SSR + jsdom safety); when unavailable, telemetry falls back to the `onChapterClick` path (§8). No `next/*`, no `process.env` (system D-03 portability).

---

## 3. Dependencies

### 3.1 — shadcn primitives

| Primitive | Used by | Purpose |
|---|---|---|
| `input` | `QuestNameField` (Tier C) → `TeamQuestNameEditor` (Tier B) | inline name editing in the edit state (**D-A4** — LOCKED) |
| `button` | `TeamQuestNameEditor` (edit / save / cancel affordances), `ChapterBeat` (activate) | edit toggle + save/cancel + beat activation |

> **`input` is already installed** (`src/components/ui/input.tsx`) and is a *simple* primitive — NOT a known Radix↔Base-UI divergence carrier (those are complex ones like `Select` / `ToggleGroup` / `Tooltip` that bit `kanban-board-01` / `calendar-01`). F-cross-13 risk here is **LOW**. **Declare `input` (and `button`) in `meta.shadcn` AND in `registry.json`'s `registryDependencies`** (shadcn-namespaced; see §15). Keep the usage **defensive / minimal** anyway — a plain controlled `<input>` with `value` / `onChange` / `onKeyDown` (Enter=save, Escape=cancel) / `onBlur`; no Radix-only escape-hatch props. **Standard first-ship consumer-tsc smoke applies** (as for any component); no special "4-ship" expectation is warranted for these simple primitives.

### 3.2 — npm

- `lucide-react` — already a library dependency. Icons only: the beat-state non-color cues (`Check` done · a "you are here" marker for current · a hollow/`Circle` for upcoming — §10), the "name your quest" invitation affordance (e.g. `Pencil` / `Sparkles`), and the empty-narrative placeholder glyph. No other npm.
- **No date library.** `Milestone.doneAt` (optional "completed on" affordance) is formatted with the built-in `Intl.DateTimeFormat` in the host's display TZ — keeps the bundle lean (matches the `gantt-timeline-01` choice).
- **No charting / virtualization / pdf / Konva** — confirming the **light** classification (D-A7): no `React.lazy` boundary.

### 3.3 — internal registry dependencies

**NONE.** Per system **D-03** this component imports **no other registry component**. The domain slice (`Team` / `Milestone` / `NarrativeChapter` / `GamificationEvent`) is **re-declared locally** in `types.ts` (§9). `meta.internal` is `[]` and `registry.json` carries **no** `registryDependencies` beyond the shadcn primitives in §3.1.

> ⚠️ **Lesson folded in (task-family clipboard unify):** `meta.internal: []` is correct here ONLY because there are genuinely zero runtime imports of another registry component. The cross-check that bit `todo-tree` (omitting `@ilinxa/todo-rich-card` despite runtime imports) does not apply — but the reviewer must confirm at GATE 3 that no `../<other-component>` import sneaks in.

### 3.4 — one-off prerequisite: the `gamification` category (system D-01 / D-A6)

`gamification` is **not yet plumbed** (verified: absent from [`src/registry/categories.ts`](../../../src/registry/categories.ts)). Before `pnpm new:component gamification/team-quest-log-01` can run, the system-level one-off (system **D-01**) must land: update [`categories.ts`](../../../src/registry/categories.ts) (`CATEGORIES` + the `ComponentCategorySlug` in [`types.ts`](../../../src/registry/types.ts)) and [`scripts/new-component.mjs`](../../../scripts/new-component.mjs). This is a **system prerequisite shared by all six components**, not part of this component's build — but it gates the scaffold step here. Flag for GATE-2 sign-off whether the category plumbing lands as its own PR (per system §10 step 3) before this component scaffolds, or alongside this first-of-pack build.

---

## 4. Locked decisions resolved at this plan stage

| # | GATE-1 recommendation | **Plan-stage resolution** |
|---|---|---|
| **D-A1** | Quest-name resolution + skip UX | 🔒 **LOCKED (already).** Displayed title = `questName?.trim() || name`; clearing/saving blank = skip/revert (no validation, no nag); quiet invitation on default. Mechanics in §6. |
| **D-A2** | Three beat states, milestone-derived | 🔒 **LOCKED (already).** done = `milestone.done`; current = first not-done by `order`; upcoming = rest; unresolved `milestoneId` → upcoming + warn, never crash. Mechanics in §7. |
| **D-A3** | Chapter-view telemetry firing model | 🔒 **LOCKED → visibility-based.** `narrative.chapter-viewed` fires via IntersectionObserver, **once per `chapterId` per mount** (fire-once ref Set), threshold ≥ 0.5 visible; SSR/jsdom-safe guard; fallback to `onChapterClick` when IO is unavailable. Mechanics in §8. |
| **D-A4** | Name editing primitive | 🔒 **LOCKED → inline shadcn `input`** (already installed) with display↔edit toggle (not a modal — keeps the overlay light). Simple primitive, low F-cross-13 risk (§3.1). ⚑ *Confirm at sign-off.* |
| **D-A5** | Chapter rail orientation | 🔒 **LOCKED → vertical rail** (story reads top→bottom; scales with chapter count; mobile-friendly). The connecting rail is a vertical spine; done segment vs upcoming segment get distinct token treatments. Horizontal variant deferred to v2. ⚑ *Confirm at sign-off.* |
| **D-A7** | Compound weight | 🔒 **LOCKED → light compound, NO `React.lazy`.** No heavy dep (§3.2). The compound exists for subset adoption (name-only / timeline-only), not weight shedding. |

> **Two rows flagged for explicit GATE-2 sign-off (⚑):** **D-A4** (name primitive = `input`) and **D-A5** (vertical rail orientation). Both are recommended-then-locked here; call them out so the reviewer either confirms or redirects before scaffold.

---

## 5. Composition pattern — the compound (export surface)

Per [`.claude/rules/compound-component-structure.md`](../../../.claude/rules/compound-component-structure.md). **Flat exports, never a `TeamQuestLog.Root` namespace.** Each part module co-locates a **dumb Tier-C core** + a **thin Tier-B context wrapper** (the `media-library-01` one-file-two-exports pattern).

### 5.1 — Tier inventory (the GATE-2 enumeration the rule requires) — **LOCK**

| Export | Tier | Module | Reads context? | Role |
|---|---|---|---|---|
| `TeamQuestLogRoot` | **B (provider)** | `parts/team-quest-log-root.tsx` | provides | Owns ALL state: resolved title (`questName?.trim() || name`), name draft/edit state, beat-state derivation (memoized on `chapters`+`milestones`), the `onEvent` emitter + chapter-view fire-once tracking, the optional imperative handle, and `TeamQuestLogContext`. Renders `children`. **No internal data store — controlled (D-06). No layout opinion.** |
| `TeamQuestNameEditor` | **B** | `parts/team-quest-name-editor.tsx` | yes | The quest-name surface — display title + the quiet invitation + the display↔edit toggle (drives the Tier-C `QuestNameField` in edit state). |
| `TeamQuestChapters` | **B** | `parts/team-quest-chapters.tsx` | yes | The chapter timeline — reads derived beats → renders the `ChapterRail` of `ChapterBeat`s; attaches the IntersectionObserver telemetry; renders `EmptyNarrative` when no chapters. |
| `TeamQuestHeader` *(optional)* | **B** | `parts/team-quest-header.tsx` | yes | Thin convenience wrapper = `TeamQuestNameEditor` framed as a header band; **opt-in, not in the default assembly's required tree.** ⚑ *Include only if it earns its keep — see §5.4.* |
| `QuestTitle` | **C** | `parts/team-quest-name-editor.tsx` | no | Dumb resolved-title display (text + optional "default vs custom" affordance hook). |
| `QuestNameField` | **C** | `parts/team-quest-name-editor.tsx` | no | Dumb controlled `input` + save/cancel buttons; `value` / `onChange` / `onSave` / `onCancel` props; Enter=save, Escape=cancel, blank-save allowed (revert). The only module touching the `input` primitive. |
| `ChapterRail` | **C** | `parts/team-quest-chapters.tsx` | no | Dumb vertical rail container (the spine + done/upcoming segment treatment); maps a `beats[]` array to `ChapterBeat`s. |
| `ChapterBeat` | **C** | `parts/chapter-beat.tsx` | no | Dumb single beat (state marker + non-color cue + title + milestone-label subtitle + optional `doneAt`); `state` / `chapter` / `onClick` props. Usable standalone anywhere. |
| `EmptyNarrative` | **C** | `parts/team-quest-chapters.tsx` | no | Dumb quiet empty-state placeholder (no chapters authored). |
| `TeamQuestLog01` | **A (assembly)** | `team-quest-log-01.tsx` | no (composes B parts) | `Root` + `TeamQuestNameEditor` (gated by `showNameEditor`) + `TeamQuestChapters` (gated by `showChapters`). **Contains no logic the parts don't.** Demo + screenshot use this. |
| `useTeamQuestLog` | hook | `hooks/use-team-quest-log.ts` | — | context consumer for hand-assembled layouts (throws if used outside `Root`). |

### 5.2 — Tree-shaking story (must be real)

- Each part is its own module re-exported from `index.ts`. A consumer who mounts **only `TeamQuestChapters`** (description §6.2) never pulls the name-editor's edit-state code **nor the `input` primitive** (which lives only in `QuestNameField`). A consumer who mounts **only `TeamQuestNameEditor`** (description §6.3) never pulls beat derivation or the IntersectionObserver telemetry.
- No `React.lazy` boundary (light compound — D-A7): there is no heavy dep to defer. Tree-shaking here is **module-level dead-code elimination**, not lazy chunking. State this explicitly so the reviewer doesn't expect a lazy chunk.
- **Verified at GATE 3** by confirming the name-only and timeline-only subsets render hand-assembled (the demo's "Composed / lighter" tab) and that dropping a part drops its imports.

### 5.3 — Root holds context; assembly is logic-free

`TeamQuestLogRoot` is the single source of state + derivation + telemetry. `TeamQuestLog01` is a fixed child tree with `showNameEditor` / `showChapters` toggles and **zero** state of its own — so a hand-assembled layout (description §6.2 / §6.3) gets identical behavior. A reviewer rejects any logic that lives in the assembly but not the parts.

### 5.4 — `TeamQuestHeader` — keep or cut (⚑ sign-off)

`TeamQuestHeader` is **optional** in the inventory. It is a thin framing wrapper over `TeamQuestNameEditor` and risks being logic-free chrome that the assembly + a `className` already cover. **Recommendation: defer it to v2 unless the demo shows a real header/body split need** — ship the four mandatory parts (`Root`, `TeamQuestNameEditor`, `TeamQuestChapters`) + the five Tier-C primitives. Flagging for sign-off so the surface stays minimal.

---

## 6. Quest-name resolution + skip (never-forced) — `lib/resolve-title.ts` + Root state

This is the most load-bearing constraint (system §5.2, D-A1). Get it wrong and we ship a "name required" regression.

### 6.1 — Resolution (pure)

```ts
// lib/resolve-title.ts — framework-free, unit-testable
export function resolveQuestTitle(team: { name: string; questName?: string }): {
  title: string;          // questName?.trim() || name
  isDefault: boolean;     // true when falling back to the literal team name
} {
  const custom = team.questName?.trim();
  return custom ? { title: custom, isDefault: false } : { title: team.name, isDefault: true };
}
```

- A blank or whitespace-only `questName` is treated as **"no quest name"** → falls back to `name`. `isDefault` drives the quiet **"name your quest"** invitation (rendered only when `isDefault && editableName`).

### 6.2 — Edit / draft / skip state (Root)

- `editableName` (default **true**) gates whether the editor can enter edit mode at all; `false` → display-only `QuestTitle` (no input mounts).
- Root holds **draft** state: `{ editing: boolean; draft: string }`. Entering edit seeds `draft` with the current custom value (or `""` if default). The component is **controlled** for the persisted value (`team.questName`) but owns the **transient draft** locally — this is UI state, not data state (D-06 intact).
- **Save** (Enter / save button / blur-with-change) calls `onQuestNameChange(draft.trim())`. **Empty/blank draft ⇒ `onQuestNameChange("")`** — the host clears `questName`, the title reverts to `name`. **This is the explicit skip/revert path** — no validation, no required-field error, no nag, no penalty.
- **Cancel** (Escape / cancel button) discards the draft, returns to display, fires nothing.
- After a save, the editor returns to display mode; the resolved title updates on the next render from the (host-echoed) `team.questName` prop — controlled-echo, no optimistic local title state to drift.

### 6.3 — The never-forced guarantees (verified at GATE 3)

1. No code path makes a quest name required.
2. Saving blank reverts to the team name and is a first-class action (it is the documented "skip").
3. The invitation is a quiet affordance (an inline pencil / "name your quest" link), never a blocking prompt or modal.

---

## 7. Beat-state derivation (LOCK — D-A2) — `lib/derive-beats.ts` (pure)

```ts
// lib/derive-beats.ts — framework-free, unit-testable
type BeatState = "done" | "current" | "upcoming";

interface DerivedBeat {
  chapter: NarrativeChapter;
  milestone?: Milestone;     // resolved by milestoneId; undefined → unresolved
  state: BeatState;
  unresolved: boolean;       // true → milestoneId matched no milestone (render upcoming + warn)
}

export function deriveBeats(
  chapters: NarrativeChapter[],
  milestones: Milestone[],
): DerivedBeat[] {
  const byId = new Map(milestones.map((m) => [m.id, m]));
  // 1. Order chapters by NarrativeChapter.order (primary); Milestone.order is the tie-break/fallback.
  const ordered = [...chapters].sort(
    (a, b) => a.order - b.order
            || (byId.get(a.milestoneId)?.order ?? 0) - (byId.get(b.milestoneId)?.order ?? 0),
  );
  // 2. "current" = the FIRST chapter (in this order) whose milestone is not done.
  let currentAssigned = false;
  return ordered.map((chapter) => {
    const milestone = byId.get(chapter.milestoneId);
    const unresolved = milestone === undefined;
    const done = milestone?.done === true;
    let state: BeatState;
    if (done) {
      state = "done";
    } else if (!currentAssigned) {
      state = "current";          // "you are here"
      currentAssigned = true;
    } else {
      state = "upcoming";
    }
    // unresolved milestone → not done → treated as current/upcoming by the rule above (graceful, never crash)
    return { chapter, milestone, state, unresolved };
  });
}
```

- **done** = `milestone.done === true`. **current** = the first not-done beat by `order` ("you are here"). **upcoming** = the rest.
- **Unresolved `milestoneId`** (no matching milestone) → treated as not-done by the derivation (so it can become current/upcoming) and flagged `unresolved: true`. The part surfaces it as a **dev warning** (`console.warn` once, dev-only) + a non-crashing visual (rendered as the upcoming treatment unless it lands as current). **Never throws.**
- Determinism: a stable sort on `order` with the `Milestone.order` tie-break makes the derivation order-independent of input array order. The whole derivation is **memoized in Root** on `[chapters, milestones]` identity.
- **a11y non-color cue (system §10 / D-13):** each `state` maps to BOTH a token color AND a distinct icon/shape so done/current/upcoming are distinguishable **without color** — `Check` (done) · a filled "you are here" pin/dot with a ring (current) · a hollow circle (upcoming). The beat's accessible name announces title **and** state (§11).

---

## 8. Telemetry (LOCK — D-A3) — `hooks/use-chapter-view-telemetry.ts` (client)

- **Model: visibility-based.** When a `ChapterBeat` first becomes visible, emit `{ type: "narrative.chapter-viewed"; teamId; chapterId }` via the optional `onEvent`. This matches the catalogue's "feature-view" semantics and the system §6 event union.
- **Mechanism:** a single IntersectionObserver in `TeamQuestChapters` (one observer, observing all beat nodes — not one observer per beat), threshold `0.5` (a beat counts as "viewed" when ≥ half visible). Beat nodes are tagged with `data-chapter-id`; the observer callback reads the id off the intersecting target.
- **Fire-once:** a `useRef<Set<string>>` of already-emitted `chapterId`s. On each intersection, if the id is not in the Set, emit + add it. **Re-render, re-entry, and scroll-back never re-emit** (the calendar/story-viewer fire-once pattern). The Set is per-mount (resets on unmount/remount).
- **SSR / availability guard:** the observer is constructed in a `useEffect` (client-only); guarded by `typeof IntersectionObserver !== "undefined"`. When IO is unavailable (SSR snapshot, jsdom, ancient browser), telemetry **falls back to firing on `onChapterClick`** (still fire-once per `chapterId` via the same Set), so a click-driven host still gets the event.
- **`teamId`** for the event comes from `team.id` (Root resolves it from the `team` prop — D-15 `team` object carries `id`).
- **No-op when `onEvent` is undefined:** the observer still attaches (cheap) but emits nothing; or — micro-opt — skip attaching the observer entirely when `onEvent` is undefined AND `onChapterClick` doesn't need it. **Decision: attach only when `onEvent` is provided** (the observer's only job is telemetry).

> **Double-fire risk (description §8) is closed by:** one observer (not per-beat), the fire-once Set, and per-mount reset. Verified at GATE 3 by toggling visibility and confirming exactly one event per chapter.

---

## 9. File-by-file plan

Sealed folder under `src/registry/components/gamification/team-quest-log-01/` (compound layout; `parts/` co-locates Tier-B wrappers + Tier-C cores per the house pattern):

| File | Contents |
|---|---|
| `team-quest-log-01.tsx` | **Tier A** `TeamQuestLog01` assembly — `"use client"`; `Root` + `showNameEditor`/`showChapters`-gated parts; the only public default-layout entry. No logic the parts lack. |
| `index.ts` | Barrel — flat exports: every Tier A/B/C name (`TeamQuestLog01`, `TeamQuestLogRoot`, `TeamQuestNameEditor`, `TeamQuestChapters`, `TeamQuestHeader?`, `QuestTitle`, `QuestNameField`, `ChapterRail`, `ChapterBeat`, `EmptyNarrative`) + `useTeamQuestLog` + all public types. **No re-export from another registry component** (D-03). |
| `types.ts` | Framework-free. **Local re-declaration (D-03)** of the slice: `Team` (`id`/`name`/`questName?` only — the D-15 subset), `Milestone` (`id`/`label`/`done`/`doneAt?`/`order`), `NarrativeChapter` (`id`/`title`/`milestoneId`/`order`), `GamificationEvent` (the `narrative.chapter-viewed` member — local slice of the system §6 union, plus the wider union type for `onEvent` ergonomics). Plus `TeamQuestLogProps`, `TeamQuestLogRootProps`, `TeamQuestLogHandle`, `BeatState`, `DerivedBeat`, the context value type, and the Tier-C primitive prop types. |
| `parts/team-quest-log-root.tsx` | **Tier B** provider — draft/edit state, `resolveQuestTitle` memo, `deriveBeats` memo, `onEvent` emitter, fire-once Set ref, `useImperativeHandle` (if confirmed §12), `TeamQuestLogContext.Provider`. |
| `parts/team-quest-name-editor.tsx` | **Tier B** `TeamQuestNameEditor` + **Tier C** `QuestTitle` + **Tier C** `QuestNameField` (the only `input` consumer). |
| `parts/team-quest-chapters.tsx` | **Tier B** `TeamQuestChapters` (attaches the IO telemetry) + **Tier C** `ChapterRail` + **Tier C** `EmptyNarrative`. |
| `parts/chapter-beat.tsx` | **Tier C** `ChapterBeat` — single beat (state marker + non-color cue + title + subtitle + optional `doneAt`). |
| `parts/team-quest-header.tsx` | **Tier B** `TeamQuestHeader` — *optional; include only if §5.4 confirms.* |
| `hooks/use-team-quest-log.ts` | `TeamQuestLogContext` + `useTeamQuestLog()` (throws outside `Root`). |
| `hooks/use-chapter-view-telemetry.ts` | IntersectionObserver fire-once telemetry hook (§8); SSR-guarded. |
| `lib/resolve-title.ts` | `resolveQuestTitle` (pure, §6.1). |
| `lib/derive-beats.ts` | `deriveBeats` (pure, §7). |
| `dummy-data.ts` | Fixture: a team (with + without `questName`), 5–7 milestones (mix done / not-done, some with `doneAt`, sequential `order`), chapters exercising every state (done, current, upcoming, an unresolved-`milestoneId` beat, all-done set, none-done set, empty set). **Fixtures registry item.** |
| `demo.tsx` | Docs demo — tabs: **Full overlay** (name + chapters), **States** (default vs custom title / editing / blank-while-editing / empty narrative / single / many / all-done / none-done / unresolved beat), **Composed / lighter** (hand-assembled timeline-only + name-only subsets — proves the compound), **Telemetry** (an `onEvent` log panel showing fire-once). |
| `usage.tsx` | Consumer usage notes (React component; MDX not wired). |
| `meta.ts` | Full `ComponentMeta`; `category: "gamification"`; `dependencies.shadcn: ["button", "input"]`; `dependencies.npm: { "lucide-react": ... }`; `dependencies.internal: []`; version `0.1.0`, status `alpha`. |

**Out of the shipped registry** (docs-site only, per convention): `demo.tsx`, `usage.tsx`, `meta.ts`.

---

## 10. Final API (locked surface)

`TeamQuestLogProps` from description §5, with these plan-stage locks. Domain types are **locally declared** (D-03).

```ts
import type {
  Team, Milestone, NarrativeChapter, GamificationEvent, BeatState,
} from "./types"; // all local re-declarations

export type TeamQuestLogProps = {
  /** The team — supplies the literal name (fallback) + the optional quest name. (D-15 subset: id/name/questName?.) */
  team: Team;
  /** Host-owned milestones — the shared spine; chapters reference these. (D-09) */
  milestones: Milestone[];
  /** The narrative beats; each frames a milestone. Empty → quiet empty state. */
  chapters: NarrativeChapter[];

  // Quest-name editing (controlled — skippable, default-to-team-name)
  /** Allow inline name editing. Default true. When false → display-only title (no input mounts). */
  editableName?: boolean;
  /** Fires on save. Empty/blank string ⇒ revert to the team's literal name (never forced). */
  onQuestNameChange?: (questName: string) => void;

  // Telemetry (system §6 / D-07)
  /** Emits "narrative.chapter-viewed" (visibility-based, fire-once per mount). */
  onEvent?: (e: GamificationEvent) => void;

  // Assembly toggles (compound)
  showNameEditor?: boolean;   // default true
  showChapters?: boolean;     // default true

  // Read-only interaction
  /** Fires when a chapter beat is activated (consumer wires what opens). Also drives telemetry fallback when IO is unavailable. */
  onChapterClick?: (chapter: NarrativeChapter) => void;
  /** Override an individual beat's render. */
  renderChapter?: (ctx: { chapter: NarrativeChapter; state: BeatState }) => React.ReactNode;

  className?: string;
  "aria-label"?: string;
};

// Tier-B Root props
export type TeamQuestLogRootProps =
  Omit<TeamQuestLogProps, "showNameEditor" | "showChapters"> & {
    children: React.ReactNode;
  };

// Imperative handle (light; optional — see §12)
export type TeamQuestLogHandle = {
  focusNameEditor(): void;        // enters edit mode + focuses the input
  scrollToChapter(chapterId: string): void;  // scrollIntoView the matching beat
};
```

**Plan-stage locks:**

- `TeamQuestLogRootProps` = `TeamQuestLogProps` **minus** `showNameEditor` / `showChapters` (assembly-only toggles) **plus** `children`. The assembly maps its `show*` props to mounting/not-mounting parts.
- `editableName` default **true**; `showNameEditor` default **true**; `showChapters` default **true**.
- **`renderChapter` overrides the beat body**; when provided, the component still tracks visibility for telemetry (the wrapper node keeps `data-chapter-id`).
- **Generics:** none. `Team` / `Milestone` / `NarrativeChapter` are fixed local schemas — no `<T>`.

**Feature-concept count** (excluding `className` / `aria-label`): `team`, `milestones`, `chapters`, `editableName`, `onQuestNameChange`, `onEvent`, `showNameEditor`, `showChapters`, `onChapterClick`, `renderChapter` (+ the 2 handle methods) ≈ **10–12 concepts** — comfortably under the ~25 ceiling. ✅ Light overlay, as designed.

---

## 11. Edge cases

| Case | Handling |
|---|---|
| **Empty narrative** (`chapters: []`) | `EmptyNarrative` quiet placeholder ("Your team's story will appear here as milestones are reached") — never an error. |
| **Single chapter** | Renders one beat; the rail spine is short but present. |
| **Many chapters** | Vertical rail scrolls within its container (host sizes; `overflow-y-auto` on the rail region); no virtualization (light overlay; chapter counts are small — a team's milestone count, not a task list). |
| **All-done** | Every beat `done`; **no `current`** beat (the "you are here" marker is absent — correct, the journey is complete). Verify the rail still reads coherently. |
| **None-done** | The **first** chapter by `order` is `current`; the rest upcoming. |
| **Blank-while-editing** | Input may be empty mid-edit; **no validation error**; saving blank reverts (§6). |
| **Unresolved `milestoneId`** | Beat renders (as current/upcoming per rule) + dev-only `console.warn` once; never crashes (§7). |
| **`editableName: false`** | `QuestTitle` display-only; no `input` mounts; no invitation. |
| **`questName` whitespace-only** | Treated as blank → falls back to `name` (`resolveQuestTitle`). |
| **No `onQuestNameChange`** while `editableName` | Edit affordance still shows but save is a no-op host-side; **recommend hiding the edit affordance when `onQuestNameChange` is undefined** (capability-gating per the compound rule — omit the handler → hide its affordance). Decision: **edit affordance is gated on `editableName && onQuestNameChange != null`.** |
| **`doneAt` present** | Optional "completed on <date>" formatted via `Intl.DateTimeFormat` in the host TZ; omitted gracefully when absent. |
| **RTL** | Vertical rail is RTL-tolerant (the spine flips side via logical properties); name editor uses logical text alignment. |
| **Mobile / narrow** | Rail + name editor reflow to a single column; beats stack; input goes full-width. |
| **`prefers-reduced-motion`** | The single `reveal-up` entrance respects it (no stagger when reduced). |

---

## 12. Accessibility

- **Chapter rail = navigable list.** The rail is `role="list"`; each `ChapterBeat` is `role="listitem"`. Beats that activate (`onChapterClick`) are buttons (`<button>` inside the item) — keyboard-operable, `Enter`/`Space` activate. (A `role="list"` of items, not a `tree` — there's no hierarchy here, unlike `gantt-timeline-01`'s gutter tree.)
- **Beats announce title + state.** Each beat's accessible name = `"<chapter.title> — <state>"` (e.g. "First playable build — completed", "Beta launch — current", "v1.0 — upcoming"), so the state reads to AT **without** relying on the color or icon alone. The milestone label is the subtitle (`aria-describedby` or visible text).
- **Non-color cue (D-13 / system §10):** done/current/upcoming each carry a distinct icon/shape (§7) — color is never the only signal.
- **Name editor labelled + keyboard edit↔display.**
  - Display: `QuestTitle` with the resolved title; the edit affordance is a labelled button ("Edit quest name").
  - Edit: `QuestNameField`'s `input` has an associated `<label>` (or `aria-label="Quest name"`); `Enter`=save, `Escape`=cancel; focus moves to the input on entering edit and returns to the title/edit button on save/cancel (managed focus).
  - The "name your quest" invitation (default state) is the labelled edit-entry button — not a separate unlabelled affordance.
- **Region labelling:** the assembly root is a labelled region (`role="group"` or `<section>` + `aria-label` / the `"aria-label"` prop), defaulting to something like "Team quest log".
- **Reduced motion** as §11.

---

## 13. Imperative handle — confirm need (⚑ sign-off)

The description offered an optional `TeamQuestLogHandle` (`focusNameEditor` / `scrollToChapter`). **Recommendation: ship it (small, cheap, real use).**

- `focusNameEditor()` — an onboarding/kickoff host (description §3 secondary consumer) wants to jump the user straight into naming the quest; without a handle it can't programmatically open the editor. Real need.
- `scrollToChapter(chapterId)` — a host that deep-links to a chapter (e.g. from a milestone-completed notification) wants to scroll its beat into view. Real need.

Both are trivial (`focus()` after entering edit mode; `scrollIntoView` on the `data-chapter-id` node) and add no weight. **Locked recommendation: include the handle**, exposed via `forwardRef` on `TeamQuestLogRoot` (and forwarded by the assembly). ⚑ *Confirm at sign-off — drop both if you'd rather keep v0.1 handle-free.*

---

## 14. Design system (system D-13)

- **Tokens only** ([`globals.css`](../../../src/app/globals.css)) — no hard-coded colors. Beat-state color→token map (locked at design, exercised at GATE 3):
  - **done** → a muted/secondary success treatment (filled beat marker; the done segment of the rail uses the accent or a "completed" token).
  - **current** ("you are here") → the **signal-lime accent** `oklch(0.80 0.20 132)` light / `oklch(0.86 0.18 132)` dark, paired with near-black `--primary-foreground` (lime is too bright for white text) — the single highest-emphasis beat.
  - **upcoming** → muted/`--muted-foreground` hollow treatment; the upcoming rail segment is `--border`/`--muted`.
- **Fonts:** Onest (sans) for titles/labels; JetBrains Mono only where a mono treatment reads (e.g. an optional `doneAt` timestamp) — not forced.
- **Surfaces:** card/popover lift over the cool off-white canvas; graphite-cool dark surfaces. No pure-white page background.
- **Motion:** **one orchestrated `reveal-up`** on first mount (60ms stagger across the name editor → the chapter rail), **NOT** per-beat reveals. Respects `prefers-reduced-motion`.
- **Forbidden:** pure-white page backgrounds, purple-on-white gradient clichés, neon-saturated lime (chroma ≤ 0.20), Inter/Roboto/Geist/system-font defaults.
- Use the **`frontend-design` skill** when building the visual surface (per project skills mandate).

---

## 15. registry.json shipping plan

Per [`docs/component-guide.md §11.5`](../../component-guide.md) + the [`shadcn-registry-pro`](../../../.claude/skills/shadcn-registry-pro/) skill. **Two items:**

1. **Base — `team-quest-log-01`**: every shipped source file as `type: "registry:component"`, `target: "components/team-quest-log-01/<sub-path>"` (the locked convention). Files: `team-quest-log-01.tsx`, `index.ts`, `types.ts`, all `parts/*`, all `hooks/*`, all `lib/*`. **`registryDependencies`: the shadcn primitives `["button", "input"]`** (shadcn-namespaced as the project's components.json maps them). **No `@ilinxa/*` registry dependency** (D-03 — imports no other component).
2. **Fixtures — `team-quest-log-01-fixtures`**: depends on the base; adds **only `dummy-data.ts`** (`target: "components/team-quest-log-01/dummy-data.ts"`).

**Never ship** `demo.tsx`, `usage.tsx`, or `meta.ts` (docs-site only).

`pnpm registry:build` regenerates `public/r/team-quest-log-01.json` + `team-quest-log-01-fixtures.json` locally; spot-check both before push. `pnpm vercel-build` (`shadcn build && next build`) regenerates production artifacts on deploy → installable via `pnpm dlx shadcn@latest add @ilinxa/team-quest-log-01`.

---

## 16. Risks & alternatives

Carried from description §8 (all still apply): never-forced regression, beat-state ambiguity, unresolved `milestoneId`, telemetry double-fire, team-scope leak, independence-vs-duplication (D-03), new-primitive divergence, "light vs thin" design.

**Plan-stage resolutions / additions:**

- **Never-forced regression (highest).** Closed by §6: no required-field validation, blank-save is the first-class skip path, the invitation is a quiet affordance. **GATE 3 explicitly verifies the skip path** (clear the name → reverts to team name, no error).
- **Beat-state ambiguity.** Closed by the deterministic stable-sort derivation (§7) — `current` is unambiguously the first not-done by `order`; all-done has no current; the derivation is memoized + order-independent.
- **Telemetry double-fire.** Closed by one observer + fire-once Set + per-mount reset (§8).
- **New-primitive (`input`) F-cross-13 divergence.** The Radix↔Base-UI consumer trap. **Mitigation:** defensive plain-controlled `<input>` usage (no backend-specific props); declare `input` in `meta.shadcn` + `registry.json`; **4-ship cross-backend consumer-tsc smoke expected on first ship** (likely v0.1.1). *Alternative considered:* a contentEditable / bare HTML `<input>` (no shadcn primitive) → **rejected** — loses the design-system token styling + a11y wiring the shadcn `input` provides; the divergence cost is the accepted price for consistency with the rest of the library.
- **Vertical-rail orientation (D-A5).** *Alternative:* horizontal rail. **Rejected for v1** — vertical reads top→bottom as a story, scales with chapter count, and is mobile-friendlier. Horizontal is a v2 variant.
- **No `React.lazy` (D-A7).** *Alternative:* a lazy boundary for "future heavy chapter media." **Rejected** — v1 has no heavy dep; adding a lazy boundary now is premature. v2 per-chapter rich copy can introduce one if it lands a heavy renderer.
- **Independence vs duplication (D-03).** Re-declaring the slice locally duplicates the system §4 model; accepted as the price of `shadcn add` independence. Keep the slice minimal (only rendered fields) + reference the system doc as source of truth (§9).

---

## 17. Verification plan (pre-GATE-3)

1. `pnpm tsc --noEmit` clean · `pnpm lint` clean · `pnpm validate:meta-deps` clean (`button` + `input` declared in `meta.shadcn` AND imported; `internal: []` with **no** `../<other-component>` import). **meta-deps gotchas:** in any file with side-effect imports, place the dep-declaring `from`-import FIRST; never reference a dep name only inside a comment (false-positive). (blackboard-01 + content-composer-01 lessons.)
2. `pnpm build` succeeds.
3. Docs render at `/components/team-quest-log-01`; all demo tabs interactive.
4. `pnpm registry:build`; spot-check `public/r/team-quest-log-01.json` + `team-quest-log-01-fixtures.json` (targets follow `components/team-quest-log-01/<sub>`; no demo/usage/meta shipped; `registryDependencies` = `["button", "input"]`, no `@ilinxa/*`).
5. **Compound proof:** the demo's "Composed / lighter" tab renders the timeline-only AND name-only hand-assembled subsets; confirm the name-only subset never pulls the IO telemetry and the timeline-only subset never pulls the `input` primitive.
6. **Never-forced proof:** clear the quest name → title reverts to team name; no validation error, no nag, no blocking prompt.
7. **Pure-lib unit-readiness (Vitest — informed-defer per house convention, but `lib/*` is written test-ready):** `resolveQuestTitle` (blank/whitespace/custom), `deriveBeats` (done/current/upcoming, all-done = no current, none-done = first current, unresolved milestone = graceful, order-independence).
8. **Telemetry proof:** scroll a chapter into view → exactly one `narrative.chapter-viewed`; scroll away + back → no re-emit; IO-unavailable path → `onChapterClick` fires the event once.
9. **First-ship consumer smoke (standard):** `pnpm dlx shadcn add @ilinxa/team-quest-log-01` in a tmp consumer → consumer-side `pnpm tsc --noEmit` clean post-install. `input`/`button` are simple, already-shipped primitives (low F-cross-13 risk), so this is routine verification, not an expected-divergence watch.
10. **GATE 3:** [`docs/reviews/templates/review-spotcheck.md`](../../reviews/templates/review-spotcheck.md), 5 dims (4 shared core + 1 rotating). **Rotating dim recommendation: Robustness** (never-forced skip path + unresolved-milestone graceful degradation are the risk surface) — or **Accessibility** (rail + beat-state announcement + name editor focus management). Pick at review; document the 1-sentence why.

---

## 18. Definition of "done" for THIS document (stage gate)

- [ ] Final API locked (§10); compound export surface enumerated (§5.1); tree-shaking + Root-holds-context stated (§5.2/5.3); light-compound / no-lazy stated (D-A7).
- [ ] Quest-name resolution + skip (never-forced) specified (§6); beat-state derivation specified (§7); fire-once telemetry specified (§8).
- [ ] File-by-file plan (§9) mirrors the sealed-folder + compound house pattern; local domain slice re-declared (D-03).
- [ ] Dependencies locked (§3): shadcn `input` + `button` (both already installed, simple primitives — low F-cross-13 risk); no npm beyond `lucide-react`; **no internal registry dep**; `gamification` category one-off prerequisite flagged (§3.4 / D-01).
- [ ] Client/server (§2), edge cases (§11), a11y (§12), design system (§14), registry shipping (§15), risks (§16), verification (§17) all covered.
- [ ] D-A3/A4/A5/A7 resolved to locked defaults (§4); **⚑ flagged for explicit sign-off:** D-A4 (name primitive = `input`), D-A5 (vertical rail), the imperative handle (§13), `TeamQuestHeader` keep/cut (§5.4), and the category-plumbing PR sequencing (§3.4).
- [ ] **User sign-off** → scaffold (after `gamification` plumbing lands) + implementation.

After sign-off, deviations from this plan are loud and intentional, not silent.
