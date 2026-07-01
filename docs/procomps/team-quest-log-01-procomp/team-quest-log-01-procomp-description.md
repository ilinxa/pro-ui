# `team-quest-log-01` — Pro-component Description (Stage 1 / GATE 1)

> **Stage:** 1 of 3 · **Status: DRAFT — pending GATE 1 sign-off**
> **Slug:** `team-quest-log-01` · **Category:** `gamification` · **Tier:** pro-component (ships as a **shadcn-style compound** — see §0)
> **System:** part of the signed-off [`gamification-system`](../../systems/gamification-system/gamification-system-description.md) (element **E5** — Team Narrative Framing; upstream extraction **C7 + C8** in the [elements catalogue](../../systems/gamification-system/gamification-elements-catalogue.md)).
> **SDT need:** Autonomy + Relatedness.

This is the **description** doc (the "what & why"). Its job: pin down what we're building and why, inventory the data it visualizes + the states it must cover, surface the open design decisions, and earn sign-off before any planning or code. It honors the system contract; where this doc and the [system description](../../systems/gamification-system/gamification-system-description.md) disagree, **the system description wins** — flag it back there.

> 🎯 **Read-me-first.** This is a **light team narrative overlay**, not a heavyweight timeline. Two surfaces: (a) a **quest-name editor** — the team picks a short "quest name" for its journey — and (b) a **milestone-chapter timeline** — milestone beats framed as **chapters**. The narrative is **optional and skippable** (system §5.2): an **empty quest name defaults to the team's literal name**, and the chapter timeline degrades gracefully when no chapters are authored. Chapters are **team-scoped** — never inter-team comparison (system §5.1 / D-08).

---

## 0. Compound-structure declaration (mandated)

`team-quest-log-01` trips the compound trigger ([`.claude/rules/compound-component-structure.md`](../../../.claude/rules/compound-component-structure.md)): it has **two distinct mountable surfaces** (quest-name editor + chapter timeline) and **a consumer could reasonably want only one** (a host that wants just the chapter beats but assigns the quest name elsewhere, or just the inline name editor in a team-settings panel). Per system **D-05** it ships as a shadcn-style compound — headless `Root` provider + flat à-la-carte parts + standalone primitives + one logic-free assembly. **Flat exports** (`TeamQuestLogRoot`, `TeamQuestNameEditor`, `TeamQuestChapters`, …), never a `Name.Root` namespace.

This is a **light** compound — no heavy dep, no `React.lazy` boundary expected (no charting / virtualization / pdf engine). The compound shape is about **subset adoption**, not weight.

**Rough part inventory** (precise tier split + names locked at GATE 2):

| Tier | Members (rough) | Role |
|---|---|---|
| **B — headless Root** | `TeamQuestLogRoot` | Owns the resolved quest title (`questName?.trim() || name`), edit/draft state for the name, chapter ordering + done/current/upcoming derivation from milestones, the `onEvent` emitter + chapter-view tracking, the optional imperative handle, and the context. Renders `children`. No internal data store — controlled (D-06). |
| **B — context parts** (flat) | `TeamQuestNameEditor` · `TeamQuestChapters` (· optional `TeamQuestHeader`) | One module per surface; each reads `useTeamQuestLog()` — no prop-drilling. |
| **C — standalone primitives** (context-free) | `QuestTitle` · `ChapterBeat` · `ChapterRail` · `QuestNameField` · `EmptyNarrative` | Dumb, prop-driven; usable anywhere (e.g. a single `ChapterBeat` in another surface). |
| **A — assembly** | `TeamQuestLog01` | `Root` + the parts above, gated by `show*` toggles (`showNameEditor`, `showChapters`). Contains no logic the parts don't. Demo + screenshot use this. |

**Tree-shaking story:** each part is its own module re-exported from the barrel. A consumer who mounts only `TeamQuestChapters` never pulls the name-editor's edit-state code; a consumer who mounts only `TeamQuestNameEditor` never pulls chapter derivation. The chapter-only and name-only subsets must fall out for free.

---

## 1. Problem

A team-management app wants to give a team a **light sense of story** over its journey — a name for the quest and milestone beats framed as chapters — to support **Autonomy** (the team *chooses* its own framing) and **Relatedness** (a shared narrative the whole team owns). This is element **E5** of the [gamification system](../../systems/gamification-system/gamification-system-description.md).

What's missing today is the primitive that:

1. lets a team **name its quest** with a short, editable label — **skippable**, with a sane default (the team's literal name) so the narrative is never forced (system §5.2),
2. lays the team's **milestone beats out as chapters** — done beats vs. upcoming beats — on a single team-scoped surface,
3. stays **light** — this is narrative framing, not a scheduling Gantt or a calendar. Each chapter ties to a milestone (`milestoneId`, system D-09); the milestone is the shared spine the rest of the pack also reads.

> **Lineage / what this is NOT.** This is *conceptually adjacent* to [`gantt-timeline-01`](../gantt-timeline-01-procomp/gantt-timeline-01-procomp-description.md) and `calendar-01` (date-ordered beats), but it is a **deliberately lighter, narrative surface** — chapters, not time-axis bars; story framing, not scheduling. It does **not** consume `TodoItem[]`, does **not** draw a continuous time axis, and per system **D-03** **imports no other registry component** (own `types.ts` slice).

### Release strategy — phased

| Version | Scope |
|---|---|
| **v1 (this doc)** | Quest-name editor (display + inline edit, skippable, default-to-team-name resolution) + milestone-chapter timeline (done / current / upcoming beats, team-scoped). Controlled, prop-driven, `onEvent` telemetry. Standalone-usable; compound subsets fall out. |
| **v2 (candidate)** | Chapter-level narrative copy (per-chapter blurb), reorder affordance for chapters, richer beat transitions. Deferred until v1 proves the surface. |

v1 alone is a registerable, contract-honoring narrative overlay.

---

## 2. In scope / Out of scope

### v1 — in scope

**Quest-name editor (surface A — C7)**
- **Display** the resolved quest title: `questName?.trim() || name` (the team's literal name when no quest name is set or it's blank — system §5.2).
- **Inline edit**: a control to set / change / clear the quest name. Clearing (or saving blank) reverts to the literal team name — the narrative is **skippable, never forced**.
- A **subtle "give your quest a name" affordance** when the team is still on its default literal name (invitation, not a requirement).
- Emits the change up via a callback; the component does **not** persist (controlled — D-06).

**Milestone-chapter timeline (surface B — C8)**
- One **chapter beat per `NarrativeChapter`**, ordered by `order`, each framing a milestone via `milestoneId`.
- Each beat's state derives from its milestone: **done** (milestone `done`), **current** (the first not-done beat — the team's "you are here"), **upcoming** (later not-done beats). Visually distinct (system §10 coverage).
- **Team-scoped only** — this team's beats, no comparison number, no other team's narrative (system §5.1 / D-08).
- A chapter whose `milestoneId` resolves to a done milestone shows its completion affordance (e.g. a check / filled beat); upcoming beats read as not-yet-reached.
- Graceful **empty narrative** state (no chapters authored) — a quiet placeholder, not an error.

**Telemetry (system §6 / D-07)**
- Optional `onEvent` callback. Emits `{ type: "narrative.chapter-viewed"; teamId; chapterId }` when a chapter beat is **viewed** (see D-A3 for the firing rule). No env-specific code, no analytics SDK.

**Portability**
- Zero `next/*`, no `process.env`, no app context. Registry-import rules: only `react`, `@/components/ui/*`, `@/lib/utils`, and explicitly-declared third-party deps. **Imports no other registry component** (D-03). SSR-safe.

**States**
- Display title (default vs. custom), editing title, empty/blank-while-editing, empty narrative (no chapters), single chapter, many chapters, all-done narrative, none-done narrative.

### v1 — out of scope (deferred)

- **Per-chapter narrative copy / blurbs, chapter reorder UI** → v2.
- **Defining or editing milestones** — milestones are **host-owned** (system D-09); this component reads them, never authors them.
- **Persistence / backend** — host owns data (system §11).
- **Inter-team / public narrative** — excluded by design (system §5.3); never built.
- **Celebration animation on chapter completion** — that's element E6 (`team-feedback-loop-01`); this component shows static done/upcoming state, not a celebration overlay.

### Deliberate non-goals (any version)

- **Not a scheduler / Gantt / calendar.** No time axis, no drag-to-reschedule, no date-grid. (Those are `gantt-timeline-01` / `calendar-01`.)
- **Not a milestone editor.** It frames milestones; the host defines them.
- **Not competitive.** No inter-team comparison, no ranking, no leaderboard (system §5.3 / D-08).
- **Not a server-state synchroniser.** Consumer wires data + persistence + the `onEvent` transport.

---

## 3. Target consumers

| Archetype | Example | What they need |
|---|---|---|
| **Gamification host page** *(primary)* | The `gamification-system` Tier-host zone | Quest name + chapter beats wired to the same team/milestone state the progress bar + trophy shelf read |
| **Team dashboard / home** *(primary)* | A "your team's story so far" panel on the board | The chapter rail showing done vs. upcoming beats, team-scoped |
| **Team-settings surface** *(secondary)* | "Name your quest" in a settings form | Just the `TeamQuestNameEditor` subset (compound drop) |
| **Onboarding / kickoff** *(secondary)* | First-run team setup | The skippable quest-name affordance + an empty/early narrative |

Non-targets: time-axis schedules (→ `gantt-timeline-01`), date grids (→ `calendar-01`), single-task detail (→ `todo-rich-card`), inter-team / public anything (excluded by design).

---

## 4. Data structure — what each surface is drawn from

Per system **D-03**, this component **re-declares the slice it needs in its own `types.ts`** — it imports no shared module and no other registry component. The slice below is the contract (source of truth: [gamification system §4](../../systems/gamification-system/gamification-system-description.md)). The full `Team` / `Milestone` in the system carry more fields; this component consumes only what it renders.

```ts
// Re-declared locally in team-quest-log-01/types.ts (D-03). NOT imported.

interface Team {
  id: string;
  name: string;            // → fallback quest title when questName is blank
  questName?: string;      // → the chosen quest title; empty/blank → falls back to `name`
}

interface Milestone {
  id: string;
  label: string;           // → chapter's milestone label (subtitle / aria)
  done: boolean;           // → drives the beat's done / current / upcoming state
  doneAt?: string;         // ISO 8601 — optional "completed on" affordance in a beat
  order: number;           // milestone sequence (tie-break / fallback ordering)
}

interface NarrativeChapter {
  id: string;              // → chapterId in the telemetry event
  title: string;           // → the chapter beat's headline
  milestoneId: string;     // → links the beat to its Milestone (the shared spine, D-09)
  order: number;           // → beat order on the rail
}
```

### Field → visual mapping (the design table)

| Field | Where it shows | Notes for design |
|---|---|---|
| `Team.questName` (trimmed) → else `Team.name` | **Resolved quest title** (display + edit value) | `questName?.trim() || name`. Blank custom name is treated as "no quest name." |
| `Team.name` | Default / fallback title; the "name your quest" invitation context | The narrative is never forced — default is dignified, not a nag |
| `NarrativeChapter.title` | **Chapter beat headline** | Truncate gracefully; full title in tooltip/aria |
| `NarrativeChapter.order` | **Beat order** on the rail | Primary sort; `Milestone.order` is the tie-break/fallback |
| `NarrativeChapter.milestoneId` → `Milestone.done` | **Beat state** (done / current / upcoming) | done = milestone done; current = first not-done beat; upcoming = rest |
| `Milestone.label` | Beat subtitle / aria label | The "what this chapter is about" |
| `Milestone.doneAt` | Optional "completed" affordance in a done beat | Render ISO in the host's display TZ; optional |
| `NarrativeChapter.id` | The `chapterId` in `narrative.chapter-viewed` | Stable id |

### Beat-state resolution (deterministic — lock this in design)

```
For each chapter, resolve its milestone by milestoneId:
  done     = milestone.done === true
  current  = the FIRST chapter (by order) whose milestone is not done   // "you are here"
  upcoming = a not-done chapter that is not the current one
A chapter whose milestoneId resolves to no milestone → render as upcoming (graceful), and surface as a design/data warning, not a crash.
displayed quest title = team.questName?.trim() || team.name
```

---

## 5. Rough API sketch (NOT final — that's the plan stage)

Illustrative. The canonical shape lands in `team-quest-log-01/types.ts` at plan stage; defer to it on naming. All domain types are **locally declared** (D-03) — no import from another registry component.

```ts
import type { GamificationEvent } from "./types"; // local re-declaration of the §6 slice

export type TeamQuestLogProps = {
  /** The team — supplies the literal name (fallback) + the optional quest name. */
  team: Team;
  /** Host-owned milestones — the shared spine; chapters reference these. */
  milestones: Milestone[];
  /** The narrative beats; each frames a milestone. Empty → quiet empty state. */
  chapters: NarrativeChapter[];

  // Quest-name editing (controlled — skippable, default-to-team-name)
  /** Allow inline name editing. Default true. When false → display-only title. */
  editableName?: boolean;
  /** Fires on save. Empty/blank string ⇒ revert to the team's literal name (never forced). */
  onQuestNameChange?: (questName: string) => void;

  // Telemetry (system §6 / D-07)
  onEvent?: (e: GamificationEvent) => void; // emits "narrative.chapter-viewed"

  // Assembly toggles (compound)
  showNameEditor?: boolean;   // default true
  showChapters?: boolean;     // default true

  // Read-only interaction
  /** Fires when a chapter beat is activated (consumer wires what opens). */
  onChapterClick?: (chapter: NarrativeChapter) => void;
  /** Override an individual beat's render. */
  renderChapter?: (ctx: { chapter: NarrativeChapter; state: "done" | "current" | "upcoming" }) => React.ReactNode;

  className?: string;
  "aria-label"?: string;
};

// Imperative handle (light; optional — confirm need at plan stage)
export type TeamQuestLogHandle = {
  focusNameEditor(): void;
  scrollToChapter(chapterId: string): void;
};
```

**Surface budget:** small. Counting feature concepts (excluding `className` / `aria-label`): ~9–11 concepts — comfortably under the ~25 ceiling. This is a light overlay; if a real v1 blows past ~15 concepts, the API is wrong and we restart this section.

---

## 6. Example usages

### 6.1 — The full overlay (primary consumer)

```tsx
import { TeamQuestLog01 } from "@/registry/components/gamification/team-quest-log-01";

function TeamStory({ team, milestones, chapters }) {
  return (
    <TeamQuestLog01
      team={team}                          // questName?.trim() || name resolves the title
      milestones={milestones}              // host-owned shared spine
      chapters={chapters}                  // milestone beats as chapters
      onQuestNameChange={(name) => saveQuestName(team.id, name)}  // "" ⇒ revert to team name
      onEvent={track}                      // "narrative.chapter-viewed"
    />
  );
}
```

A blank `questName` (or one the team clears) shows the team's literal name — the narrative is never forced. Done milestones light their chapter beats; the first not-done beat reads as "current."

### 6.2 — Timeline-only (no name editor) — proves the compound subset

```tsx
import { TeamQuestLogRoot, TeamQuestChapters } from "@/registry/components/gamification/team-quest-log-01";

// A host that names the quest elsewhere wants only the chapter rail:
<TeamQuestLogRoot team={team} milestones={milestones} chapters={chapters} onEvent={track}>
  <TeamQuestChapters />
</TeamQuestLogRoot>
```

The name-editor code never enters this consumer's bundle.

### 6.3 — Name-editor-only (team settings) — the other subset

```tsx
import { TeamQuestLogRoot, TeamQuestNameEditor } from "@/registry/components/gamification/team-quest-log-01";

<TeamQuestLogRoot team={team} milestones={[]} chapters={[]} onQuestNameChange={save}>
  <TeamQuestNameEditor />
</TeamQuestLogRoot>
```

Just the skippable "name your quest" affordance, dropped into a settings form.

---

## 7. Decisions

Locked rows reflect the system contract (inherited) + this session's GATE-1 answers; open rows recommend a default and confirm at sign-off / plan stage.

### Inherited from the system (locked — see [system §8](../../systems/gamification-system/gamification-system-description.md))

| # | Decision |
|---|---|
| **D-03** | 🔒 **Independent at the registry level.** Own `types.ts` slice; imports **no** other registry component. No shared foundation package yet (deferred). |
| **D-05** | 🔒 **Ships as a compound** — `Root` + flat `TeamQuestNameEditor` + flat `TeamQuestChapters` + primitives + logic-free `TeamQuestLog01` assembly. Flat exports. (§0) |
| **D-06** | 🔒 **Prop-driven, controlled, self-sufficient.** No provider/store required; the host owns data + persistence. |
| **D-07** | 🔒 **Telemetry via optional `onEvent`.** Emits `{ type: "narrative.chapter-viewed"; teamId; chapterId }`. No env-specific code. |
| **D-08** | 🔒 **Cooperative-only + team-scoped.** Team narrative only; **never inter-team comparison** or per-individual narrative. |
| **D-09** | 🔒 **Milestone is the shared spine.** Each chapter frames a milestone (`milestoneId`); beat state derives from `Milestone.done`. Host defines milestones. |
| **D-13** | 🔒 **Design-system mandate.** Onest / JetBrains Mono, signal-lime accent, OKLCH, [globals.css](../../../src/app/globals.css) tokens, no hard-coded colors, `reveal-up` for the reveal. |

### Component-specific

| # | Question | Decision |
|---|---|---|
| **D-A1** | **Quest-name resolution + skip UX** | 🔒 **Displayed title = `questName?.trim() || name`.** A blank or whitespace-only custom name is treated as "no quest name" → falls back to the literal team name. Clearing the field (saving empty) is the **skip / revert** path — explicitly supported, no penalty, no nag. When on the default name, show a quiet, optional **"name your quest"** invitation, never a blocking prompt. (System §5.2 — never-forced.) |
| **D-A2** | **Chapter beat states** | 🔒 **Three states, milestone-derived:** **done** (`milestone.done`), **current** (first not-done beat by `order` — "you are here"), **upcoming** (rest). A chapter with an unresolved `milestoneId` renders **upcoming** + surfaces as a data warning, never a crash. (D-09 spine.) |
| **D-A3** | **How a chapter "views" fires telemetry** | 🔹 **Recommend: visibility-based** — emit `narrative.chapter-viewed` once per chapter when its beat first becomes visible (IntersectionObserver, fire-once per `chapterId` per mount), matching the catalogue's "feature-view" semantics. Falls back to an explicit fire on `onChapterClick` where IO is unavailable. *Confirm the firing model at GATE 1; lock the exact mechanism at plan stage.* |
| **D-A4** | **Name editing primitive** | 🔹 **Recommend: inline `input` (shadcn `input`) with display ↔ edit toggle**, not a modal — keeps the overlay light. Confirm primitive choice at plan stage; declare any new primitive as a `registryDependency` + watch the F-cross-13 Radix↔Base-UI divergence trap. |
| **D-A5** | **Chapter rail orientation** | 🔹 **Recommend: vertical rail** (story reads top→bottom; scales with chapter count; mobile-friendly), with a horizontal variant deferred to v2. Confirm at plan stage. |
| **D-A6** | **Slug / category** | 🔒 `gamification/team-quest-log-01`. `-01` suffix per house convention. Requires the new `gamification` category plumbing (system **D-01**) before scaffold. |
| **D-A7** | **Compound weight** | 🔒 **Light compound — no `React.lazy` boundary** (no heavy dep). The compound is for subset adoption (name-only / timeline-only), not weight shedding. |

---

## 8. Risks

- **Never-forced regression.** The most load-bearing constraint (system §5.2): a blank/cleared quest name MUST fall back to the team name with no penalty and no blocking prompt. Easy to accidentally ship a "name required" validation or a nag. Plan + GATE 3 verify the skip path explicitly. **(D-A1.)**
- **Beat-state ambiguity.** "Current" = first not-done beat; with out-of-order or partially-done milestones the derivation must be deterministic (D-A2). Design must show done / current / upcoming as visually distinct (system §10).
- **Unresolved `milestoneId`.** A chapter referencing a missing milestone must degrade (render upcoming + warn), never crash. Spell out in the plan.
- **Telemetry double-fire.** Visibility-based `narrative.chapter-viewed` (D-A3) must fire **once per chapter per mount** — IntersectionObserver re-entry / re-render must not re-emit. Known pattern; lock a fire-once ref at plan.
- **Team-scope leak.** No comparison number, no other team's data may sneak in (system §5.1 / D-08) — verify at GATE 3.
- **Independence vs. duplication (D-03).** Re-declaring `Team`/`Milestone`/`NarrativeChapter` locally duplicates the system slice; accepted as the price of registry independence + `shadcn add` safety (system §7.3). Keep the local slice minimal (only rendered fields) and reference the system doc as source of truth.
- **New-primitive divergence (F-cross-13).** If the name editor pulls a new shadcn primitive (`input` etc.), the Radix↔Base-UI consumer divergence trap applies — the [4-ship smoke pattern](../../../.claude/STATUS.md) is expected on first ship. Declare every primitive as a `registryDependency` in `meta.ts` **and** `registry.json`.
- **Design "light" vs. "thin."** This must read as a polished narrative surface, not a stub — yet stay lighter than the Gantt/calendar siblings. Hold the design tokens; one orchestrated `reveal-up`, not per-beat reveals.

---

## 9. Success criteria

v1 ships when:

1. **Quest-name resolution is correct** — displayed title = `questName?.trim() || name`; a blank custom name falls back to the team name. **(D-A1.)**
2. **Skip / revert works with no penalty** — clearing the name reverts to the literal team name; no required-field validation, no blocking prompt; the "name your quest" affordance is a quiet invitation. **(System §5.2.)**
3. **Chapters render as beats** — one beat per `NarrativeChapter`, ordered by `order`, each framing its milestone.
4. **Beat states are distinct + deterministic** — done / current / upcoming derive from milestones per D-A2 and are visually unmistakable.
5. **Team-scoped** — only this team's narrative; no comparison number, no other team's data. **(D-08.)**
6. **Telemetry** — `narrative.chapter-viewed` emits per the locked firing model (D-A3), once per chapter per mount, via the optional `onEvent`. **(D-07.)**
7. **Compound is real** — flat exports; the timeline-only (§6.2) and name-only (§6.3) subsets render hand-assembled; the demo includes a "lighter / composed" example. **(D-05.)**
8. **States** — default vs. custom title, editing, blank-while-editing, empty narrative, single / many chapters, all-done, none-done — all designed + built.
9. **Independence** — own `types.ts` slice; imports no other registry component; `shadcn add @ilinxa/team-quest-log-01` is self-contained. **(D-03.)**
10. **A11y** — the chapter rail is a navigable list; beats announce title + state (done/current/upcoming); the name editor is a labelled, keyboard-operable field with a clear edit↔display transition.
11. **Portability** — no `next/*`, no `process.env`, SSR-safe, registry-import-clean.
12. **Design system** — every color maps to a globals.css token; Onest / JetBrains Mono; one orchestrated `reveal-up`. **(D-13.)**
13. **Demo + (deferred) tests** — demo exercises both surfaces + all states; quest-name resolution + beat-state derivation are unit-testable (Vitest informed-defer per house convention).

---

## 10. Design coverage checklist (what design must produce)

> Each box is a screen/state to define against the **ilinxa-ui-pro design system** ([`src/app/globals.css`](../../../src/app/globals.css)): **signal-lime** accent `oklch(0.80 0.20 132)` light / `oklch(0.86 0.18 132)` dark (always with near-black `--primary-foreground`), cool off-white `--background` (raised `--card`/`--popover` to pure white), graphite-cool dark surfaces, **Onest** (sans) / **JetBrains Mono** (mono), one orchestrated `reveal-up` entrance (60ms stagger). **Forbidden:** pure-white page backgrounds, purple-on-white gradient clichés, neon-saturated lime (keep chroma ≤ 0.20), Inter/Roboto/Geist/system-font defaults.

**A. Quest-name surface (C7)**
- [ ] Display title on **default** (literal team name) · display title on **custom** quest name · the quiet **"name your quest" invitation** affordance.
- [ ] **Editing** state (input focused) · **blank-while-editing** (the skip/revert path) · save · cancel · clear-to-revert.
- [ ] Disabled / display-only variant (`editableName=false`).

**B. Chapter timeline surface (C8)**
- [ ] **Done** beat · **current** ("you are here") beat · **upcoming** beat — each visually unmistakable (color → token, plus a non-color cue for a11y).
- [ ] Optional `doneAt` "completed" affordance on a done beat · beat hover · beat selected/active.
- [ ] The rail connecting beats (done segment vs. upcoming segment treatment).

**C. States**
- [ ] Empty narrative (no chapters — quiet placeholder, not error) · single chapter · many chapters (scroll/overflow) · all-done · none-done · unresolved-milestone beat (graceful upcoming).

**D. Composition**
- [ ] Full overlay (name + chapters) · timeline-only subset · name-only subset.

**E. Responsive**
- [ ] Wide · medium · narrow (rail + name editor reflow on small screens).

**F. Tokens & motion**
- [ ] Map every color to a design token (done / current / upcoming beat states, the connecting rail, the invitation affordance, the edit input states). One orchestrated `reveal-up` entrance on first mount — **not** per-beat reveals. Color→token table for each beat state, plus a non-color cue (icon/shape) so done/current/upcoming are distinguishable without color.

---

## 11. Definition of "done" for THIS document (stage gate)

- [ ] §§0–10 drafted, reconciled to `ilinxa-ui-pro` conventions (paths, imports, design tokens) and to the [gamification system contract](../../systems/gamification-system/gamification-system-description.md).
- [ ] Domain slice pinned to the system §4 model, **re-declared locally** per D-03 (§4) — no import of another registry component.
- [ ] Compound-structure declared with rough part inventory (§0) — per the mandatory rule + system D-05.
- [ ] Inherited locked decisions (D-03/05/06/07/08/09/13) recorded; component-specific decisions raised (D-A1 quest-name resolution + skip UX, D-A2 beat states, D-A3 chapter-view telemetry firing, D-A4/A5/A7 plan-stage confirmations) (§7).
- [ ] The **never-forced** rule reflected in scope (§2), API (the empty-string ⇒ revert contract, §5/D-A1), and success criteria (§9 #1–#2).
- [ ] **Open for sign-off:** confirm D-A3 (telemetry firing model), and the plan-stage recommendations D-A4 (name primitive) / D-A5 (rail orientation).
- [ ] **User sign-off** → Stage 2 (`team-quest-log-01-procomp-plan.md`, GATE 2).

After sign-off, changes to this doc are loud and intentional, not silent rewrites.
