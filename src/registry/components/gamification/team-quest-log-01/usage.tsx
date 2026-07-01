export default function TeamQuestLog01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>TeamQuestLog01</code> to give a team a light sense of{" "}
        <strong>story</strong> over its journey — a name for the quest and
        milestone beats framed as chapters. It is the <strong>E5</strong>{" "}
        (Autonomy + Relatedness) surface of the gamification pack. The narrative
        is <strong>optional and skippable</strong>: a blank quest name falls back
        to the team&apos;s literal name, and the chapter timeline degrades quietly
        when no chapters are authored. It is deliberately lighter than the Gantt /
        calendar — chapters, not a time axis.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { TeamQuestLog01 } from "@/components/team-quest-log-01"

<TeamQuestLog01
  team={team}               // { id, name, questName? }
  milestones={milestones}   // host-owned shared spine
  chapters={chapters}       // { id, title, milestoneId, order }
  onQuestNameChange={(name) => saveQuestName(team.id, name)} // "" reverts to team name
  onEvent={(e) => analytics.track(e.type, e)}                // narrative.chapter-viewed
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Never forced</h3>
      <p className="text-muted-foreground">
        The displayed title is <code>questName?.trim() || name</code>. Clearing
        the field (saving blank) reverts to the literal team name — a first-class{" "}
        <strong>skip</strong> path, no required-field validation, no nag. On the
        default name a quiet <em>Name your quest</em> invitation shows (never a
        blocking prompt).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Beat states</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>done</strong> — the milestone is complete (check marker).
        </li>
        <li>
          <strong>current</strong> — the first not-done beat by order (the{" "}
          <em>you are here</em> pin).
        </li>
        <li>
          <strong>upcoming</strong> — later not-done beats (hollow marker).
        </li>
      </ul>
      <p className="text-muted-foreground">
        State is derived from milestones and conveyed by icon + color (never color
        alone). An unresolved <code>milestoneId</code> renders gracefully (as
        upcoming) and dev-warns — it never crashes.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Compose a lighter version
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { TeamQuestLogRoot, TeamQuestChapters } from "@/components/team-quest-log-01"

// Timeline-only — the name-editor code never enters this bundle:
<TeamQuestLogRoot team={team} milestones={milestones} chapters={chapters} onEvent={track}>
  <TeamQuestChapters />
</TeamQuestLogRoot>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Telemetry.</strong> <code>onEvent</code> emits{" "}
          <code>narrative.chapter-viewed</code> once per chapter per mount, when a
          beat first scrolls into view (IntersectionObserver). Omit{" "}
          <code>onEvent</code> and no observer attaches.
        </li>
        <li>
          <strong>Imperative handle.</strong> A ref exposes{" "}
          <code>focusNameEditor()</code> and{" "}
          <code>scrollToChapter(id)</code> for onboarding / deep-link hosts.
        </li>
        <li>
          <strong>Team-scoped.</strong> Only this team&apos;s narrative — no
          comparison, no other team&apos;s data.
        </li>
        <li>
          <strong>Portable.</strong> No <code>next/*</code>, own{" "}
          <code>types.ts</code> slice, no other registry import; only the shadcn{" "}
          <code>input</code> / <code>button</code> primitives + lucide.
        </li>
      </ul>
    </div>
  );
}
