export default function TeamProgressBar01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>TeamProgressBar01</code> in a team-board header to answer
        one question at a glance: <em>how far is our team through the journey?</em>{" "}
        It shows a single, always-visible, read-only bar of this team&apos;s
        milestone-completion % — built for <strong>competence</strong> (SDT)
        without tipping into comparison. It is cooperative and team-scoped by
        design: <strong>no other team&apos;s bar, no ranking, no per-member
        split — ever.</strong>
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Two input modes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>milestones</code> — the component computes{" "}
          <code>done / total</code>, enabling tick marks and the{" "}
          <code>&quot;fraction&quot;</code> readout.
        </li>
        <li>
          <code>value</code> — a direct 0–100 number for the simplest drop-in.
          If both are supplied, <code>value</code> wins (and dev-warns).
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { TeamProgressBar01 } from "@/components/team-progress-bar-01"

export function BoardHeader({ team }) {
  return (
    <TeamProgressBar01
      team={{ id: team.id, name: team.name }}
      milestones={team.milestones}   // % = done / total
      showTicks
      labelFormat="fraction"          // "5 / 8 milestones"
      onEvent={(e) => analytics.track(e.type, e)} // host adds the envelope
    />
  )
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Compose a lighter version</h3>
      <p className="text-muted-foreground">
        It ships as a light shadcn-style compound. Drop the parts you don&apos;t
        need — a bar-only header tree-shakes the label away:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import {
  TeamProgressBarRoot, TeamProgressBarTrack,
} from "@/components/team-progress-bar-01"

<TeamProgressBarRoot team={{ id: "T-001" }} milestones={team.milestones}>
  <TeamProgressBarTrack showTicks />   {/* no Label part */}
</TeamProgressBarRoot>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Always visible.</strong> No milestones yet (
          <code>total === 0</code>) renders a 0% bar, never nothing.
        </li>
        <li>
          <strong>Telemetry is a feature-view.</strong> <code>onEvent</code>{" "}
          emits <code>progress-bar.checked</code> once per mount, on first
          in-viewport reveal — not on every render. Omit <code>onEvent</code>{" "}
          and no observer is created.
        </li>
        <li>
          <strong>Accessible.</strong> The bar is a <code>role=&quot;progressbar&quot;</code>{" "}
          with <code>aria-valuenow/min/max</code>; ticks are decorative-but-labelled;
          the fill transition respects <code>prefers-reduced-motion</code>.
        </li>
        <li>
          <strong>Portable.</strong> No <code>next/*</code>, no app context, no
          other registry import — only the shadcn <code>progress</code> primitive.
        </li>
      </ul>
    </div>
  );
}
