export default function DetailPanelUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>DetailPanel</code> when a host has a selection-driven
        secondary surface — a side panel paired with a list or canvas that
        shows the focused entity in detail, with read/edit/loading/error
        states. The component handles compound layout (sticky header + scrollable
        body + sticky footer actions), composite re-keying on selection
        change so slotted forms remount cleanly, mode toggling under three
        configurations, focus management, and ARIA wiring. Hosts own the data,
        the slotted content per entity type, and the actions.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { DetailPanel } from "@/registry/components/feedback/detail-panel";

export function NodeDetail({ node }) {
  return (
    <DetailPanel
      selection={node ? { type: "node", id: node.id } : null}
      ariaLabel={node?.label}
    >
      <DetailPanel.Header>
        <span className="font-semibold">{node.label}</span>
      </DetailPanel.Header>
      <DetailPanel.Body>
        <NodeReadView node={node} />
      </DetailPanel.Body>
      <DetailPanel.Actions>
        {({ mode, setMode, canEdit }) =>
          mode === "read" ? (
            <Button disabled={!canEdit} onClick={() => setMode("edit")}>
              Edit
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setMode("read")}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </>
          )
        }
      </DetailPanel.Actions>
    </DetailPanel>
  );
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Compound API</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>{`<DetailPanel.Header sticky?>`}</code> — sticky-top by default;
          opt out with <code>sticky={"{false}"}</code>.
        </li>
        <li>
          <code>{`<DetailPanel.Body>`}</code> — scrollable content area;
          receives focus via <code>focusBody()</code>.
        </li>
        <li>
          <code>{`<DetailPanel.Actions position?>`}</code> — sticky-bottom by
          default (<code>{`position="footer"`}</code>); set{" "}
          <code>{`position="header"`}</code> to render inline inside the header
          band (place it right after <code>{`<DetailPanel.Header>`}</code> in
          children for visual alignment).
        </li>
        <li>
          Children <code>{`<Actions>`}</code> may be a render-fn that receives{" "}
          <code>{"{ mode, setMode, canEdit }"}</code> for read/edit-aware
          buttons.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Mode configurations</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <strong>Uncontrolled</strong> — omit both <code>mode</code> and{" "}
          <code>onModeChange</code>. Panel manages mode state internally;
          auto-resets to <code>{`"read"`}</code> on{" "}
          <code>selection.id</code> / <code>type</code> change.
        </li>
        <li>
          <strong>Controlled</strong> — supply both{" "}
          <code>mode</code> and <code>onModeChange</code>. Host owns mode;
          panel calls <code>{`onModeChange("read")`}</code> on selection change so
          the auto-reset contract still holds.
        </li>
        <li>
          <strong>Locked (anti-pattern)</strong> — supply <code>mode</code>{" "}
          without <code>onModeChange</code>. Dev-only{" "}
          <code>console.warn</code> fires; panel cannot auto-reset; setMode
          is a no-op.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Re-key on selection</h3>
      <p className="text-muted-foreground">
        Children remount whenever <code>selection.type</code> or{" "}
        <code>selection.id</code> changes — composite key{" "}
        <code>{"`${type}:${id}`"}</code>. This wipes any internal state in
        slotted forms (controlled values are unaffected because the host owns
        them). The mechanism is an invisible{" "}
        <code>{`<div className="contents">`}</code> wrapper that holds a React{" "}
        <code>key</code> without injecting layout.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Composing with properties-form (the showcase)
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { DetailPanel } from "@/registry/components/feedback/detail-panel";
import {
  PropertiesForm,
  type PropertiesFormHandle,
} from "@/registry/components/forms/properties-form";

const formRef = useRef<PropertiesFormHandle>(null);

function handleSelectionChange(next) {
  if (formRef.current?.isDirty()) {
    if (!confirm("Discard unsaved changes?")) return;
  }
  setSelection(next);  // detail-panel re-keys; properties-form remounts clean
}

<DetailPanel selection={selection} ariaLabel={entity?.label}>
  <DetailPanel.Header>...</DetailPanel.Header>
  <DetailPanel.Body>
    <PropertiesForm
      ref={formRef}
      schema={schemaFor(entity.type)}
      values={entity.values}
      onChange={setValues}
      mode="edit"
      showSubmitActions={false}  // host renders Save/Cancel via Actions
    />
  </DetailPanel.Body>
  <DetailPanel.Actions>
    {({ mode, setMode }) => (
      mode === "read" ? <EditButton onClick={() => setMode("edit")} /> : (
        <SaveCancelButtons formRef={formRef} setMode={setMode} />
      )
    )}
  </DetailPanel.Actions>
</DetailPanel>`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        Two contracts to honor: (1) host intercepts selection change BEFORE
        propagating, calls <code>formRef.current?.isDirty()</code>; (2) save
        button calls <code>formRef.current?.submit()</code> and switches mode
        on success. Detail-panel does not import properties-form at the
        registry level — composition is host code only.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Lifecycle states</h3>
      <p className="text-muted-foreground">
        Precedence is{" "}
        <strong>error → loading → content → empty</strong>. When{" "}
        <code>error</code> is set the error UI wins regardless of{" "}
        <code>loading</code> or <code>selection</code>. Set{" "}
        <code>error.retry</code> to render a Try-again button.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Sticky positioning</h3>
      <p className="text-muted-foreground">
        Header sticky-top and footer-Actions sticky-bottom both rely on the
        panel&apos;s outer container having a constrained height. Wrap the panel
        in <code>h-full</code> inside a flex parent (or any{" "}
        <code>height: X</code> ancestor); without it, sticky collapses to
        static.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Imperative handle</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const panelRef = useRef<DetailPanelHandle>(null);

panelRef.current?.focusBody();    // moves focus into body's first focusable
panelRef.current?.resetMode();    // forces back to "read"`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">What ships in v0.2+</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>{`<DetailPanel.MultiSelection>`}</code> companion for
          multi-select.
        </li>
        <li>
          <code>{`<DetailPanel.Skeleton>`}</code> custom slot for layouts that
          deviate from the default.
        </li>
        <li>
          <code>selectionLabel?</code> for richer selection-change ARIA
          announcements.
        </li>
        <li>Selection-change cross-fade animation.</li>
      </ul>
    </div>
  );
}
