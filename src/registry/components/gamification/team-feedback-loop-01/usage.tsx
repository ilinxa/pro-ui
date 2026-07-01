export default function TeamFeedbackLoop01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>TeamFeedbackLoop01</code> to close the cooperative
        feedback loops: a <strong>brief, skippable, NON-BLOCKING</strong>{" "}
        celebration when the host says &quot;team progress just advanced,&quot;
        followed by a gentle next-task nudge. It owns <strong>no</strong>{" "}
        milestone/badge/task state — the host triggers it, it renders the moment
        and gets out of the way. Every reward is about the{" "}
        <strong>team, never an individual</strong> (D-08).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        The cardinal constraint: non-blocking (D-10)
      </h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>The board stays fully interactive during a celebration — clicks pass through.</li>
        <li>Never moves or traps focus; the skip button is the only clickable element.</li>
        <li>
          Auto-dismisses in <strong>&lt; 1s</strong> — <code>celebrationDurationMs</code>{" "}
          is clamped to <code>[200, 999)</code>, so a lingering modal is impossible.
        </li>
        <li>Skip with a click on ✕ or <kbd>Esc</kbd> at any time.</li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Two trigger paths (one reducer)</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { TeamFeedbackLoop01 } from "@/components/team-feedback-loop-01"

// Controlled (declarative hosts): set event → open; null → close.
<TeamFeedbackLoop01
  teamId={team.id}
  event={lastEvent}                 // { kind: "milestone", title: "Your team…" }
  enableConfetti
  nextTask={nextTask}               // { taskId, label: "Pick up: wire the win screen" }
  onNextTask={(s) => openTask(s.taskId)}
/>

// Imperative (event-driven hosts): fire from a callback.
const ref = useRef<TeamFeedbackLoopHandle>(null)
ref.current?.celebrate({ kind: "task-complete", title: "Your team cleared the column" })`}</code>
      </pre>
      <p className="text-muted-foreground">
        Both funnel into one internal reducer — identical behavior regardless of
        entry point. Newest event wins; overlays never stack.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Confetti + reduced motion</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>enableConfetti</code> (default off) adds a lazy{" "}
          <code>canvas-confetti</code> burst for <code>milestone</code>/
          <code>badge</code> only. The default CSS flourish keeps the confetti
          chunk out of the bundle entirely.
        </li>
        <li>
          Under <code>prefers-reduced-motion: reduce</code> the celebration renders
          static — no movement, no confetti — still time-boxed and skippable.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">D-16 celebration ownership</h3>
      <p className="text-muted-foreground">
        If you also use <code>team-trophy-shelf-01</code>, route each event kind to
        exactly one celebrator: set the shelf&apos;s{" "}
        <code>animateAward=&#123;false&#125;</code> and push{" "}
        <code>badge</code>/<code>milestone</code> here, OR let the shelf own the
        in-place reveal and don&apos;t push that kind here. Neither component
        triggers the other.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Compound: drop <code>TeamFeedbackCelebration</code> or{" "}
          <code>TeamFeedbackNudge</code> for a subset. <code>onEvent</code> is
          accepted for symmetry but E6 emits nothing.
        </li>
        <li>
          Portable + SSR-safe: no <code>next/*</code>, no animation on first paint;
          only the shadcn <code>button</code> primitive + lucide + the lazy confetti dep.
        </li>
      </ul>
    </div>
  );
}
