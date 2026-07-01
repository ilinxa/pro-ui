# team-quest-log-01 — consumer guide

> The **Team Narrative Framing** surface of the [`gamification-system`](../../systems/gamification-system/gamification-system-description.md) (E5, Autonomy + Relatedness). A light overlay: a skippable quest name + a milestone-chapter timeline. The **sixth and final** component of the pack.

Install: `pnpm dlx shadcn@latest add @ilinxa/team-quest-log-01` (add `@ilinxa/team-quest-log-01-fixtures` for sample data).

## When to use

- A team dashboard that wants a "your team's story so far" panel — a quest name + milestone beats as chapters.
- A gamification host page wiring the narrative to the same team/milestone state the progress bar + trophy shelf read.
- A team-settings surface that wants only the "name your quest" editor (use the `TeamQuestNameEditor` subset).

## When NOT to use

- **Scheduling** — no time axis, no drag-to-reschedule, no date grid → `gantt-timeline-01` / `calendar-01`.
- **Defining milestones** — milestones are host-owned; this reads them, never authors them.
- **Inter-team / competitive** narrative — excluded by design. Team-scoped only.

## Quick start

```tsx
import { TeamQuestLog01 } from "@/components/team-quest-log-01";

<TeamQuestLog01
  team={team}               // { id, name, questName? }
  milestones={milestones}   // host-owned shared spine: { id, label, done, doneAt?, order }
  chapters={chapters}       // { id, title, milestoneId, order }
  onQuestNameChange={(name) => saveQuestName(team.id, name)} // "" reverts to the team name
  onEvent={(e) => analytics.track(e.type, e)}                // narrative.chapter-viewed
/>
```

## Never forced (the load-bearing rule)

The displayed title is `questName?.trim() || name`:

- A **blank or whitespace-only** quest name falls back to the literal team name.
- **Clearing the field** (saving blank) is a **first-class skip/revert** — no required-field validation, no nag, no blocking prompt.
- On the default name, a quiet **"Name your quest"** invitation shows (an inline affordance, never a modal).

`editableName={false}` renders a display-only title (no input mounts). The edit affordance is gated on `editableName && onQuestNameChange` (capability-gating).

## Beat states

Derived from milestones (`milestoneId` → `Milestone.done`), deterministic and order-independent:

| State | Meaning | Marker |
|---|---|---|
| **done** | milestone complete | check (lime) |
| **current** | first not-done beat by order — "you are here" | pin (lime ring) |
| **upcoming** | later not-done beats | hollow circle (muted) |

All-done → every beat done, **no current**. None-done → the first beat is current. An **unresolved `milestoneId`** renders gracefully (as upcoming/current) and dev-warns — it never crashes. State is conveyed by icon **and** color (never color alone); each beat's accessible name is `"<title> — <state>"`.

## Composition (light compound)

```tsx
// Timeline-only — the name-editor code + the input primitive never enter this bundle:
import { TeamQuestLogRoot, TeamQuestChapters } from "@/components/team-quest-log-01";
<TeamQuestLogRoot team={team} milestones={milestones} chapters={chapters} onEvent={track}>
  <TeamQuestChapters />
</TeamQuestLogRoot>

// Name-only — never pulls beat derivation or the IntersectionObserver:
import { TeamQuestLogRoot, TeamQuestNameEditor } from "@/components/team-quest-log-01";
<TeamQuestLogRoot team={team} milestones={[]} chapters={[]} onQuestNameChange={save}>
  <TeamQuestNameEditor />
</TeamQuestLogRoot>
```

`show*` props on the assembly (`showNameEditor`, `showChapters`) map to mounting/not-mounting parts. It is a **light compound** — no `React.lazy` (no heavy dep); tree-shaking is module-level dead-code elimination. `resolveQuestTitle` and `deriveBeats` are exported so a hand-assembly resolves identically. The context-free primitives (`QuestTitle`, `QuestNameField`, `ChapterRail`, `ChapterBeat`, `EmptyNarrative`) are usable standalone.

## Telemetry

`onEvent` (optional) emits `{ type: "narrative.chapter-viewed", teamId, chapterId }` **once per chapter per mount**, when a beat first scrolls ≥ 50% into view (one IntersectionObserver over all beats, fire-once Set). Re-render / scroll-back never re-emits. When IntersectionObserver is unavailable (SSR/jsdom/ancient), it falls back to firing on `onChapterClick` (still fire-once). Omit `onEvent` and no observer attaches.

## Imperative handle

A ref on `TeamQuestLog01` (or `TeamQuestLogRoot`) exposes:

```tsx
const ref = useRef<TeamQuestLogHandle>(null);
ref.current?.focusNameEditor();        // enter edit mode + focus the input (onboarding)
ref.current?.scrollToChapter("c3");    // scroll a beat into view (deep-link)
```

## Accessibility

- The chapter rail is `role="list"`; each beat `role="listitem"` announces `"<title> — <state>"` (state reads without color/icon).
- The name editor is a labelled, keyboard-operable field: `Enter` saves, `Escape` cancels; focus moves to the input on edit.
- The assembly is a labelled `<section>` (`aria-label` defaults to "<title> — team quest log").
- One orchestrated `reveal-up` entrance; respects `prefers-reduced-motion`.

## Portability

Zero `next/*`, no app context, no other registry import. Own `types.ts` slice (D-03). SSR-safe (title is a pure prop function; no `Date`/random during render; IO in an effect, guarded). Only the shadcn `input` / `button` primitives + `lucide-react`.
