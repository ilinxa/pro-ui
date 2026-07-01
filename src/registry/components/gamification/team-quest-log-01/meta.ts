import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "team-quest-log-01",
  name: "Team Quest Log",
  category: "gamification",

  description:
    "A light team narrative overlay: an editable, skippable quest name (a blank name falls back to the team's literal name) plus a milestone-chapter timeline with deterministic done / current / upcoming beats. Team-scoped, controlled, never forced.",
  context:
    "The Team Narrative Framing surface of the gamification pack (E5, Autonomy + Relatedness). Two mountable surfaces over one team + its milestones: (a) a quest-name editor — display the resolved title (questName?.trim() || name) with an inline display↔edit toggle; clearing/saving blank reverts to the literal team name (the skip path, never forced); a quiet 'name your quest' invitation on the default; and (b) a milestone-chapter timeline — one vertical-rail beat per NarrativeChapter, ordered, each framing a milestone, with done / current ('you are here') / upcoming states derived from Milestone.done (current = the first not-done beat; unresolved milestoneId renders gracefully + dev-warns, never crashes). Deliberately lighter than gantt-timeline-01 / calendar-01 — chapters, not a time axis; it consumes no TodoItem[] and imports no other registry component. Emits narrative.chapter-viewed once per chapter per mount when a beat first scrolls into view (one IntersectionObserver, fire-once Set, SSR-guarded, click fallback). Ships as a light shadcn-style compound (no React.lazy) — headless TeamQuestLogRoot (title resolution + draft/edit state + beat derivation + telemetry + a forwardRef handle: focusNameEditor / scrollToChapter) + flat parts (TeamQuestNameEditor, TeamQuestChapters) + context-free primitives (QuestTitle, QuestNameField, ChapterRail, ChapterBeat, EmptyNarrative) + the TeamQuestLog01 assembly — so a timeline-only or name-only subset falls out. Controlled (D-06); portable — zero next/*, own types.ts slice; SSR-safe. Sixth and final component of the gamification-system.",
  features: [
    "Skippable quest name — displayed title = questName?.trim() || name; clearing reverts to the team name (never forced, no validation)",
    "Milestone-chapter timeline — one vertical-rail beat per chapter, done / current / upcoming derived from milestones",
    "Deterministic beat states — current = first not-done by order; all-done has no current; unresolved milestone renders gracefully + dev-warns",
    "narrative.chapter-viewed telemetry — one IntersectionObserver, fire-once per chapter per mount, SSR-guarded with a click fallback",
    "Non-color state cues (check / you-are-here pin / hollow) + accessible beat names — state reads without color",
    "Light compound — headless Root + flat TeamQuestNameEditor / TeamQuestChapters + context-free primitives; timeline-only + name-only subsets fall out",
    "Imperative handle — focusNameEditor() + scrollToChapter(id) for onboarding / deep-link hosts",
  ],
  tags: [
    "team-quest-log",
    "gamification",
    "narrative",
    "milestones",
    "timeline",
    "team",
    "cooperative",
    "telemetry",
  ],

  version: "0.1.1",
  status: "alpha",
  createdAt: "2026-07-01",
  updatedAt: "2026-07-01",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: ["button", "input"],
    npm: {
      "lucide-react": "^1.11.0",
    },
    internal: [],
  },

  related: ["team-progress-bar-01", "cooperative-challenge-01", "gantt-timeline-01"],
};
