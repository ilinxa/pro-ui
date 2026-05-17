export default function RichCardInFlowUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>@ilinxa/rich-card-in-flow</code> when each
        flow-canvas-01 node should carry a rich-card JSON tree as its data —
        agent workflow editors, schema/config canvases, decision or runbook
        maps. The viewer paints a read-only summary (title + first 3 flat
        fields + nested-card outlines with their own ports); clicking opens a
        consumer-owned dialog with the full <code>RichCard</code> editor. At
        most ONE rich-card editor instance is mounted at any moment regardless
        of node count.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Canonical wiring</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FlowCanvas, updateNodeData } from "@ilinxa/flow-canvas-01";
import { RichCard, type RichCardHandle } from "@ilinxa/rich-card";
import { richCardViewerRenderer } from "@ilinxa/rich-card-in-flow";

const RENDERERS = [richCardViewerRenderer]; // module-scope!

export function MyCanvas() {
  const [canvas, setCanvas] = useState(initialData);
  const [editing, setEditing] = useState<
    { nodeId: string; subPath?: string } | null
  >(null);
  const richCardRef = useRef<RichCardHandle>(null);

  return (
    <>
      <FlowCanvas
        data={canvas}
        onChange={setCanvas}
        renderers={RENDERERS}
        onEditRequest={(nodeId, subPath) => setEditing({ nodeId, subPath })}
      />
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          {editing && (
            <RichCard
              key={editing.nodeId}                       // clean remount
              ref={richCardRef}
              defaultValue={canvas.nodes.find(n => n.id === editing.nodeId)!.data}
              editable={true}
              onChange={(next) =>
                setCanvas((prev) => updateNodeData(prev, editing.nodeId, next))
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Subcard-level edit targeting (the <code>subPath</code> model)
      </h3>
      <p className="text-muted-foreground">
        The renderer fires <code>ctx.onEditRequest?.(subPath?)</code> where
        <code>subPath</code> is the clicked subcard&apos;s <code>__rcid</code>{" "}
        (rich-card&apos;s canonical card identifier). The host bubbles to{" "}
        <code>FlowCanvasProps.onEditRequest?.(nodeId, subPath)</code> verbatim
        — pass it through to your dialog. Inside the dialog, focus the
        targeted subcard via the imperative ref:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`// Run after the dialog opens + RichCard has mounted.
useEffect(() => {
  if (editing?.subPath) richCardRef.current?.focusCard(editing.subPath);
}, [editing?.subPath, editing?.nodeId]);`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        F-02 lock — <code>RichCard</code> doesn&apos;t expose an
        <code>initialFocusCardId</code> prop today; the imperative
        <code>RichCardHandle.focusCard(id)</code> via ref is the only way to
        pre-focus a specific subcard. A v0.2 polish on rich-card may add a
        prop if consumers signal friction.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        When <code>__rcid</code> is missing on a subcard
      </h3>
      <p className="text-muted-foreground">
        Rich-card auto-attaches <code>__rcid</code> on parse — so a
        consumer-defined fixture that hasn&apos;t been through{" "}
        <code>&lt;RichCard&gt;</code> once may carry subcards without IDs. The
        viewer renders them normally but disables click-to-focus on those
        subcards; clicking falls through to the root edit. Dev mode logs a{" "}
        <code>console.warn</code> pointing at the affected subcard. Pass the
        canvas data through <code>&lt;RichCard&gt;</code> once at boot OR
        attach IDs manually with rich-card&apos;s ID helper.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Multi-select on the canvas
      </h3>
      <p className="text-muted-foreground">
        n8n-style multi-select (marquee + shift-click) works out of the box —
        flow-canvas-01 hosts the selection. Clicking-to-edit on the
        clicked node opens the dialog on THAT node; the other selected nodes
        stay selected for canvas-level operations (move, delete, duplicate).
        Bulk EDIT (single op applied across selection) is deferred to v0.2.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">v0.1 viewer limits</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Title</strong> — <code>data.title</code> if non-empty string,
          else first non-reserved string flat field, else
          &quot;Untitled rich-card&quot;.
        </li>
        <li>
          <strong>Flat fields</strong> — first 3 entries that are{" "}
          <code>boolean</code> / <code>number</code> / ISO-8601 date string /
          plain string (by <code>Object.entries</code> order). Numbers
          right-aligned, dates formatted via{" "}
          <code>Intl.DateTimeFormat</code>, booleans as ✓ / —.
        </li>
        <li>
          <strong>Nested cards</strong> — up to 4 subcards painted as outlines
          with their own port handles; one level deep. v0.2 may make these
          configurable via <code>RichCardViewerOptions</code>.
        </li>
        <li>
          <strong>Edit trigger</strong> — single click. v0.2 escape hatch
          (<code>editTrigger?: &quot;click&quot; | &quot;doubleClick&quot;</code>) if a consumer surfaces real conflict.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Port editing (v0.2 — <code>&lt;PortEditorStrip&gt;</code>)
      </h3>
      <p className="text-muted-foreground">
        v0.2 ships an opt-in <code>PortEditorStrip</code> for editing the
        <code>ports[]</code> array of a card or subcard inline. Mount it
        alongside <code>&lt;RichCard editable&gt;</code> inside your dialog
        — the strip is uncontrolled (operates on the canvas prop) and
        live-saves on every mutation.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import {
  PortEditorStrip,
  type PortEditorPermissions,
} from "@ilinxa/rich-card-in-flow";

// inside the dialog body — strip above RichCard per Q1 lock
{editing && (
  <>
    <PortEditorStrip
      nodeId={editing.nodeId}
      subPath={editing.subPath}     // targets root if undefined; subcard by __rcid
      canvas={canvas}
      onChange={setCanvas}
      editable={true}
      // optional — gates affordances when supplied
      permissions={{
        canAddPort: (cardId) => true,
        canRemovePort: (cardId, portId) => portId !== "p-locked-port",
        canEditPortField: (cardId, portId, field) =>
          field !== "id" || portId.startsWith("p-user-"),
      }}
    />
    <RichCard editable defaultValue={...} onChange={...} />
  </>
)}`}</code>
      </pre>
      <p className="mt-3 text-muted-foreground">
        Direction multi-select on add: check <code>[✓in]</code>,
        <code>[✓out]</code>, or both. Both creates two atomic ports
        sharing type / side / multi / label with <code>-in</code> /
        <code>-out</code> id suffixes. After save, the two ports are
        independent rows in the editor — no auto-grouping (Q3 lock).
      </p>
      <p className="mt-2 text-muted-foreground">
        <strong>Doc-port type</strong> (v0.2.5 of flow-canvas-01 — new
        built-in <code>&quot;doc&quot;</code> port type): forced to{" "}
        <code>side: &quot;bottom&quot;</code> in the editor picker.
        Targets (doc files) don&apos;t exist yet — doc-typed ports are
        orphan slots until a future doc-file procomp ships.
      </p>
      <p className="mt-2 text-muted-foreground">
        <strong>Live-save model:</strong> every change calls{" "}
        <code>onChange(updatedCanvas)</code>. No commit/cancel button.
        Selects + checkbox commit on change; id and label inputs commit
        on blur (id renames have edge implications). Renaming a port
        with live edges surfaces a tooltip warning; the rename still
        commits but the consumer must update edge references manually.
      </p>
      <p className="mt-2 text-muted-foreground">
        <strong>Custom port-type registration in the strip&apos;s
        picker</strong> is deferred to v0.3 with proper shared-context
        plumbing — v0.2 uses the 6 defaults only. <strong>Per-field
        ports</strong> (a flat field IS a port) is also a v0.3 lift; in
        v0.2 you add ports via the strip&apos;s &quot;+ add port&quot;
        affordance independently from any field.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Footguns</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Port IDs must be unique within the node</strong> — including
          across subcards. flow-canvas-01&apos;s port-walker returns the first
          match for a given ID; duplicates silently mis-route edges. Dev mode
          warns when a duplicate is detected on viewer mount.
        </li>
        <li>
          <strong>
            <code>position: relative</code> is load-bearing
          </strong>{" "}
          at every DOM level (NodeShell, RichCardViewer outer, SubcardBlock) —
          xyflow&apos;s <code>&lt;Handle&gt;</code> is{" "}
          <code>position: absolute</code> and anchors to the nearest
          positioned ancestor. If you fork the viewer and drop{" "}
          <code>relative</code>, subcard handles silently fly to the wrong
          parent.
        </li>
        <li>
          <strong>Don&apos;t use Radix <code>&lt;Dialog.Portal forceMount&gt;</code></strong> —
          it defeats the &quot;at most one editor mounted&quot; property.
          shadcn&apos;s default <code>&lt;Dialog&gt;</code> unmounts content
          on close, which is what makes the perf claim hold.
        </li>
        <li>
          <strong>Subcards aren&apos;t drag-extractable in v0.1</strong> —
          they&apos;re part of one rich-card tree per node by design (Q1
          lock); flow-canvas-01&apos;s <code>data-draggable-subobject</code>{" "}
          pattern won&apos;t work on subcards. v0.2 candidate if a consumer
          asks.
        </li>
      </ul>

      <p className="mt-6 text-xs text-muted-foreground">
        Full reference:{" "}
        <code>docs/procomps/rich-card-in-flow-procomp/</code> (description,
        plan, guide). Companion components:{" "}
        <code>@ilinxa/flow-canvas-01@^0.2.1</code> (host; requires v0.2.1+ for{" "}
        <code>onEditRequest</code>) and <code>@ilinxa/rich-card@^0.4.0</code>{" "}
        (editor).
      </p>
    </div>
  );
}
