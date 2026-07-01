export default function TaskChoiceControl01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Drop <code>TaskChoiceControl01</code> onto any team task card to give
        members an <strong>autonomy affordance</strong>: open a task for anyone,
        or volunteer for it — <em>by their own choice, never told to</em>. It is
        the <strong>E4 / Autonomy</strong> surface of the gamification pack. The
        rule that shapes it: <strong>choice is always available, never forced;
        releasing or reassigning never penalizes whoever held it before.</strong>
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { TaskChoiceControl01 } from "@/components/task-choice-control-01"

<TaskChoiceControl01
  teamId={team.id}
  members={team.members}          // this team only
  value={task.choice}             // { taskId, openForAnyone, assigneeId }
  currentMemberId={viewerId}
  onOpenForAnyoneChange={(open) => update(task.id, { openForAnyone: open })}
  onClaim={(id) => update(task.id, { assigneeId: id, openForAnyone: false })}
  onAssigneeChange={(id) => update(task.id, { assigneeId: id })} // undefined = release
  density="compact"
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Three states</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Open</strong> — a friendly 🙌 Open-for-anyone invite plus an
          <em> I&apos;ll take this</em> claim.
        </li>
        <li>
          <strong>Claimed</strong> — an assignee chip + a <strong>neutral</strong>{" "}
          Release + a reassign picker. Release is <code>onAssigneeChange(undefined)</code>
          {" "}— never a penalty.
        </li>
        <li>
          <strong>Unassigned</strong> — Volunteer and Open-for-anyone offered
          side by side.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Capability-gating &amp; read-only
      </h3>
      <p className="text-muted-foreground">
        Each affordance hides when its callback is omitted; <code>readOnly</code>{" "}
        is a global off-switch. They compose — omitting all callbacks produces the
        same display-only render as <code>readOnly</code>. Prefer{" "}
        <code>readOnly</code> to express intent.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">À-la-carte parts</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import {
  OpenForAnyoneToggle, ClaimButton, AssigneeChip,
} from "@/components/task-choice-control-01"

// Mount just the part you need — each is flat-exported, no Root/context.
<OpenForAnyoneToggle open={task.choice.openForAnyone} onOpenChange={setOpen} />`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Controlled.</strong> <code>value</code> drives the render; the
          component holds no source-of-truth choice state.
        </li>
        <li>
          <strong>Team-scoped.</strong> Only <code>members</code> (this team)
          appear in the reassign picker; nothing public/inter-team.
        </li>
        <li>
          <strong>Telemetry.</strong> <code>onEvent</code> emits{" "}
          <code>task-choice.interaction</code> on meaningful interactions only
          (toggle / claim / reassign / release) — not on render.
        </li>
        <li>
          <strong>Portable.</strong> No <code>next/*</code>, no other registry
          import; own <code>types.ts</code> slice; only the shadcn{" "}
          <code>switch</code> / <code>button</code> / <code>avatar</code> /{" "}
          <code>popover</code> / <code>command</code> primitives.
        </li>
      </ul>
    </div>
  );
}
