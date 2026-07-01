export default function CooperativeChallenge01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>CooperativeChallenge01</code> when a team app wants a{" "}
        <strong>safe-by-design cooperative challenge</strong> — one shared goal,
        collective progress, and a whole-team reward, with a{" "}
        <strong>penalty-free opt-in</strong>. It is the{" "}
        <strong>Relatedness</strong> surface of the gamification pack. The single
        rule it exists to protect: <strong>never-forced</strong> — opting in is a
        deliberate team choice, refusing is cost-free and neutral, and the reward
        belongs to the <em>whole team equally, never an individual.</em>
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { CooperativeChallenge01 } from "@/components/cooperative-challenge-01"

export function TeamChallengeZone({ challenge, team }) {
  return (
    <CooperativeChallenge01
      challenge={challenge}   // { label, optedIn, progress, reward, done }
      team={team}             // { name, members }
      onOptInChange={(optedIn) => persistOptIn(team.id, challenge.id, optedIn)}
      onEvent={(e) => analytics.track(e.type, e)} // host adds the envelope
    />
  )
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Controlled opt-in (never forced)
      </h3>
      <p className="text-muted-foreground">
        <code>challenge.optedIn</code> is the value — the host owns it. Joining is
        a prominent invite; leaving is{" "}
        <strong>one click, no confirm, no guilt</strong>. Omit{" "}
        <code>onOptInChange</code> and the control hides entirely — a read-only
        progress + reward card falls out for free.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Compose a lighter version
      </h3>
      <p className="text-muted-foreground">
        It ships as a light shadcn-style compound. Drop the card chrome and keep
        only the penalty-free toggle (or the bare avatar pile):
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { OptInToggle, TeamMemberStack } from "@/components/cooperative-challenge-01"

// A context-free toggle, droppable on any surface:
<OptInToggle optedIn={challenge.optedIn} onOptInChange={join} />

// …or just the identity pile:
<TeamMemberStack members={team.members} />`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Collective progress only.</strong> One bar +{" "}
          <code>current / target</code> — never a per-member breakdown or ranking.
          The avatar stack is identity, not a progress display.
        </li>
        <li>
          <strong>Whole-team reward.</strong> The reward reads as{" "}
          <em>the team earns / earned</em> — never first-person, never per-member.
        </li>
        <li>
          <strong>Done is a lightweight inline ack.</strong> A{" "}
          <em>Completed together</em> pill (non-blocking, no modal). The heavy
          celebration overlay is <code>team-feedback-loop-01</code> (E6) — compose
          it alongside; neither triggers the other.
        </li>
        <li>
          <strong>Telemetry.</strong> <code>onEvent</code> emits{" "}
          <code>challenge.opened</code> once on first mount (StrictMode-safe) and{" "}
          <code>challenge.opt-in</code> on toggle. No SDK, no <code>next/*</code>.
        </li>
        <li>
          <strong>Portable.</strong> Own <code>types.ts</code> slice, no other
          registry import — only the shadcn <code>progress</code>,{" "}
          <code>avatar</code>, <code>button</code>, <code>badge</code>, and{" "}
          <code>skeleton</code> primitives.
        </li>
      </ul>
    </div>
  );
}
