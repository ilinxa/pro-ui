export default function CardTreeUsage() {
  return (
    <div className="max-w-none space-y-6 text-sm leading-relaxed text-foreground">
      <section>
        <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
        <p className="text-muted-foreground">
          Reach for <code>CardTree</code> when you have <em>JSON-shaped, deeply
          nested, structured content</em> — agent transcripts, configuration
          trees, decision records, runbooks, requirement docs — and want a
          card-tree view with typed-scalar fields, predefined content blocks
          (code, image, table, quote, list), and full keyboard accessibility.
        </p>
        <p className="mt-2 text-muted-foreground">
          Skip it for prose-only writing (use a markdown editor) or flat lists
          (use a table). Markdown source is <strong>not</strong> supported in
          v0.1 — card-tree is JSON-native.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Basic example</h3>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`import { CardTree } from "@/components/card-tree";

export function Example() {
  return (
    <CardTree
      defaultValue={{
        title: "ADR-0042",
        status: "accepted",
        priority: 2,
        codearea: { format: "ts", content: "const x = 1;" },
        context: { reason: "..." },
      }}
    />
  );
}`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Reserved keys</h3>
        <p className="text-muted-foreground">
          <code>__rcid</code>, <code>__rcorder</code>, and <code>__rcmeta</code>{" "}
          are reserved. <code>__rcid</code> auto-generates via{" "}
          <code>crypto.randomUUID()</code> if absent. <code>__rcorder</code>{" "}
          controls sibling order (integer, gaps allowed). <code>__rcmeta</code>{" "}
          is a per-card scalar map exposed via the <code>metaPresentation</code>{" "}
          prop.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Predefined keys</h3>
        <p className="text-muted-foreground">
          Five reserved-name fields render as styled blocks:
        </p>
        <ul className="ml-5 mt-2 list-disc space-y-1 text-muted-foreground">
          <li>
            <code>codearea</code> — <code>{`{ format, content }`}</code>
          </li>
          <li>
            <code>image</code> — <code>{`{ src, alt? }`}</code>
          </li>
          <li>
            <code>table</code> —{" "}
            <code>{`{ headers: string[], rows: scalar[][] }`}</code>
          </li>
          <li>
            <code>quote</code> — a string
          </li>
          <li>
            <code>list</code> — an array of scalars
          </li>
        </ul>
        <p className="mt-2 text-muted-foreground">
          Add a key to <code>disabledPredefinedKeys</code> to opt out — the
          parser then treats it as a flat field instead.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">
          Custom predefined keys{" "}
          <span className="ml-1 rounded bg-muted px-1.5 py-0.5 align-middle font-mono text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
            v0.6
          </span>
        </h3>
        <p className="text-muted-foreground">
          Register additional content blocks at mount via{" "}
          <code>customPredefinedKeys</code>. The prop was declared and
          documented since v0.3 but had no reader anywhere in the parse
          pipeline until v0.6 — a tree that passed it saw the registration
          silently do nothing. As of v0.6 the whole path is wired: classify →
          parse/validate → render/edit → serialize.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`import type { CustomPredefinedKey } from "@/components/card-tree";

const metricKey: CustomPredefinedKey = {
  key: "metric",
  description: "A KPI value with unit",
  defaultValue: () => ({ value: 0, unit: "" }),
  validate: (v) =>
    typeof v === "object" && v !== null
      ? { ok: true }
      : { ok: false, errors: [{ code: "shape-mismatch", message: "..." }] },
  render: (value, ctx) => <MyMetricBlock value={value} cardId={ctx.cardId} />,
  edit: (value, onSave, onCancel) => (
    <MyMetricEditor value={value} onSave={onSave} onCancel={onCancel} />
  ),
};

<CardTree
  defaultValue={data}
  editable
  customPredefinedKeys={[metricKey]}
/>`}</code>
        </pre>
        <p className="mt-2 text-muted-foreground">
          <strong>Precedence:</strong> reserved (<code>__rc*</code>) → built-in
          predefined (<code>codearea</code> / <code>image</code> /{" "}
          <code>table</code> / <code>quote</code> / <code>list</code>) →{" "}
          <strong>custom</strong> → scalar field → child card. A registered
          name is matched <em>before</em> its value is inspected, which is
          what makes an <strong>array-valued</strong> block registrable — an
          editor.js document or a Plate <code>Value</code> is an array of
          nodes, and through v0.5.0 that shape had no way to reach a renderer
          (the child-card branch rejects arrays per the doc above). Ordinary,
          unregistered children still reject arrays — this only opens up for
          names you explicitly register.
        </p>
        <p className="mt-2 text-muted-foreground">
          If <code>edit</code> is omitted, the editor falls back to a
          JSON-textarea. <code>validate</code> runs at parse time and at edit
          commit; a validator that returns <code>{`{ ok: false }`}</code> or
          throws drops that entry (with a diagnostic) instead of breaking the
          rest of the tree.{" "}
          <code>searchableText</code> is optional — supply it to make a
          custom block participate in native search, or omit it and the
          block is simply skipped.
        </p>
        <p className="mt-2 text-muted-foreground">
          Registration is <strong>mount-only</strong>. A name that collides
          with a built-in / reserved key, or that is registered twice, is
          dropped with a <code>console.error</code> — the built-in (or the
          first registration) wins, and the tree still renders.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Field value typing</h3>
        <p className="text-muted-foreground">
          Flat-field values are JSON scalars: <code>string</code>,{" "}
          <code>number</code>, <code>boolean</code>, <code>null</code>. Type is
          inferred at parse time and rendered per type (numbers right-aligned
          mono; booleans as check / dash icons; ISO-8601 date strings formatted
          via <code>Intl.DateTimeFormat</code>; null as a muted em-dash).
        </p>
        <p className="mt-2 text-muted-foreground">
          Pass <code>dateDetection=&quot;never&quot;</code> to disable date
          inference, or a custom predicate function for fine control.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Children</h3>
        <p className="text-muted-foreground">
          Any non-reserved, non-predefined property whose value is a{" "}
          <em>plain object</em> becomes a child card. Arrays of objects are{" "}
          <strong>rejected in v0.1</strong> — convert to object-keyed form
          (e.g. <code>{`{ items: { item_0: a, item_1: b } }`}</code>) or use
          the <code>list</code> predefined key for scalar arrays.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">State model</h3>
        <p className="text-muted-foreground">
          The component is <strong>uncontrolled</strong>:{" "}
          <code>defaultValue</code> is the seed. To reset, remount via the{" "}
          <code>key</code> prop. Read the current state imperatively via a ref:
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`const ref = useRef<CardTreeHandle>(null);
// ...
const json = ref.current?.getValue();   // canonical JSON string
const tree = ref.current?.getTree();    // object form with auto-IDs`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Accessibility</h3>
        <p className="text-muted-foreground">
          The tree implements the full ARIA tree contract:{" "}
          <code>role=&quot;tree&quot;</code>,{" "}
          <code>role=&quot;treeitem&quot;</code>,{" "}
          <code>aria-level</code>, <code>aria-expanded</code>. Keyboard:
          arrows navigate visible cards, <kbd>→</kbd> expands / descends,{" "}
          <kbd>←</kbd> collapses / ascends, <kbd>Home</kbd> / <kbd>End</kbd>{" "}
          jump to first / last, <kbd>Enter</kbd> / <kbd>Space</kbd> toggles
          collapse on a card with children.
        </p>
      </section>
    </div>
  );
}
