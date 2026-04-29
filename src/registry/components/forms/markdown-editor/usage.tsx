function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
      <code>{children}</code>
    </pre>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 first:mt-0">
      <h3 className="mb-2 text-base font-semibold">{title}</h3>
      {description ? (
        <p className="mb-3 text-muted-foreground">{description}</p>
      ) : null}
      {children}
    </section>
  );
}

export default function MarkdownEditorUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <Section
        title="When to use"
        description="Reach for MarkdownEditor when a host needs a controlled markdown surface with wikilink autocomplete + decoration, a slot-able toolbar, and an edit / split / preview toggle. CodeMirror 6 is the substrate (decision #19); the editor is graph-aware via wikilinkCandidates but functions standalone."
      >
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>
            <strong>Controlled-only</strong> — host owns <code>value</code> and listens
            to <code>onChange</code>. Pure CM6 internals; React just mirrors.
          </li>
          <li>
            <strong>GFM by default</strong> — tables, strikethrough, task lists
            (non-interactive in v0.1), autolink.
          </li>
          <li>
            <strong>Save</strong> via{" "}
            <kbd className="rounded bg-muted px-1 py-0.5 text-[10px]">⌘S</kbd> /{" "}
            <kbd className="rounded bg-muted px-1 py-0.5 text-[10px]">Ctrl+S</kbd>{" "}
            when an <code>onSave</code> handler is wired; browser default save fires
            otherwise.
          </li>
        </ul>
      </Section>

      <Section
        title="Quick start"
        description="Minimum viable: controlled value/onChange, default toolbar, edit-only view."
      >
        <CodeBlock>{`import { useState } from "react";
import { MarkdownEditor } from "@/registry/components/forms/markdown-editor";

export function NoteEditor() {
  const [value, setValue] = useState("# Hello\\n\\nStart typing…");
  return <MarkdownEditor value={value} onChange={setValue} />;
}`}</CodeBlock>
      </Section>

      <Section
        title="With wikilinks"
        description="Pass a stable wikilinkCandidates array (memoized or module-scope per §11.1.1 reference-stability footgun). Resolved labels render with accent styling; unresolved render dashed/destructive. Wire onWikilinkClick to navigate."
      >
        <CodeBlock>{`import { useMemo, useState } from "react";
import { MarkdownEditor } from "@/registry/components/forms/markdown-editor";
import type { WikilinkCandidate, KindMeta } from "@/registry/components/forms/markdown-editor";

const KINDS: Record<string, KindMeta> = {
  person: { label: "Person", color: "oklch(0.62 0.18 250)" },
  doc: { label: "Doc", color: "oklch(0.62 0.18 60)" },
};

export function GraphAwareEditor({ graphNodes }: { graphNodes: WikilinkCandidate[] }) {
  const [value, setValue] = useState("");
  const candidates = useMemo(() => graphNodes, [graphNodes]);
  return (
    <MarkdownEditor
      value={value}
      onChange={setValue}
      wikilinkCandidates={candidates}
      kinds={KINDS}
      onWikilinkClick={(target) => {
        // resolve target → graph node id; navigate or open detail-panel
      }}
      initialView="split"
    />
  );
}`}</CodeBlock>
      </Section>

      <Section
        title="force-graph v0.5 integration recipe"
        description="When force-graph v0.5 ships, doc-node selection mounts the editor inside DetailPanel.Body. The editor's onSave fires force-graph's reconcileWikilinks action (decision #36 — reconciliation lives in force-graph, not here). Scaffold for the eventual cascade:"
      >
        <CodeBlock>{`<DetailPanel selection={selectedDoc}>
  <DetailPanel.Header>{selectedDoc.title}</DetailPanel.Header>
  <DetailPanel.Body>
    <MarkdownEditor
      value={selectedDoc.body}
      onChange={(v) => actions.updateNode(selectedDoc.id, { body: v })}
      onSave={(v) => actions.reconcileWikilinks(selectedDoc.id, v)}
      wikilinkCandidates={graph.allDocsAndPeople}
      kinds={KINDS}
      initialView="split"
    />
  </DetailPanel.Body>
</DetailPanel>`}</CodeBlock>
        <p className="mt-3 text-xs text-muted-foreground">
          DetailPanel re-keys on selection change, remounting the editor cleanly between
          documents — no stale state. See{" "}
          <code>detail-panel</code> §4 for the re-key contract.
        </p>
      </Section>

      <Section
        title="Custom toolbar"
        description="Spread defaultMarkdownToolbar and append items. Each item receives ToolbarCtx with the live EditorView, current value, and 3 dispatch helpers."
      >
        <CodeBlock>{`import { Sparkles } from "lucide-react";
import {
  MarkdownEditor,
  defaultMarkdownToolbar,
  type ToolbarItem,
} from "@/registry/components/forms/markdown-editor";

const toolbar: ReadonlyArray<ToolbarItem> = [
  ...defaultMarkdownToolbar,
  { id: "sep-2", label: "", run: () => {} },
  {
    id: "callout",
    label: "Insert callout",
    icon: <Sparkles />,
    run: (ctx) => ctx.insertText("\\n> [!note]\\n> "),
  },
];

<MarkdownEditor value={value} onChange={setValue} toolbar={toolbar} />`}</CodeBlock>
      </Section>

      <Section
        title="Reference stability"
        description="Same footgun as filter-stack categories and entity-picker items. React Compiler memoizes JSX-literal arrays in-repo, but NPM consumers without it must memoize manually."
      >
        <CodeBlock>{`// ✓ Module-scope (preferred for static lists)
const CANDIDATES = [/* ... */] satisfies WikilinkCandidate[];
<MarkdownEditor wikilinkCandidates={CANDIDATES} ... />

// ✓ useMemo (for derived lists)
const candidates = useMemo(() => deriveFromGraph(graph), [graph]);
<MarkdownEditor wikilinkCandidates={candidates} ... />

// ✗ Inline literal (NPM consumer without React Compiler — extra dispatch per render)
<MarkdownEditor wikilinkCandidates={[...]} ... />`}</CodeBlock>
      </Section>

      <Section
        title="Imperative handle"
        description="React 19 ref-as-prop. The handle proxies CM6 history (undo/redo), inserts text at the caret, and exposes the underlying EditorView via getView() for escape-hatch use."
      >
        <CodeBlock>{`const ref = useRef<MarkdownEditorHandle>(null);

<MarkdownEditor ref={ref} value={value} onChange={setValue} />

// Drive from outside:
ref.current?.focus();
ref.current?.insertText("✨ ");
ref.current?.undo();
const { from, to, text } = ref.current?.getSelection() ?? {};
const view = ref.current?.getView(); // escape hatch (substrate-leak risk acknowledged)`}</CodeBlock>
      </Section>

      <Section
        title="Notes"
        description="Things that are non-obvious from the prop types."
      >
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>
            <strong>Wikilink target</strong> is the part BEFORE the pipe: in{" "}
            <code>[[label|alias]]</code>, the click handler receives <code>label</code>.
            Aliased rendering shows alias; resolution uses label (case-insensitive +
            trimmed).
          </li>
          <li>
            <strong>Image embeds</strong> (<code>![[image.png]]</code>) are NOT
            parsed in v0.1 — they render as literal text. Real images use{" "}
            <code>![alt](src)</code>.
          </li>
          <li>
            <strong>Wikilink anchors</strong> (<code>[[label#anchor]]</code>) are NOT
            supported in v0.1. The anchor portion is treated as part of the label;
            v0.2 adds anchor parsing.
          </li>
          <li>
            <strong>Cmd+S</strong> only suppresses the browser&apos;s native save when an{" "}
            <code>onSave</code> handler is wired. Otherwise the browser dialog fires.
            Payload is the live CM6 doc, not the React <code>value</code> prop (avoids
            stale-by-React-batching).
          </li>
          <li>
            <strong>Extension precedence</strong>: user-supplied{" "}
            <code>extensions</code> are appended LAST in the CM6 stack — earlier
            entries have HIGHER default precedence. To override our keymap, wrap with{" "}
            <code>Prec.high(...)</code> from <code>@codemirror/state</code>.
          </li>
          <li>
            <strong>GFM task lists</strong> render as static disabled checkboxes.
            Toggling requires write-back to source — deferred to v0.2.
          </li>
        </ul>
      </Section>
    </div>
  );
}
