export default function PropertiesFormUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>PropertiesForm</code> whenever you have a flat record
        of typed fields — a task, a settings page, a node-properties drawer —
        and want a controlled read/edit surface with built-in validation,
        permissions, and a small custom-renderer escape hatch. It is
        intentionally generic over <code>T</code>; the host owns the data
        shape.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import {
  PropertiesForm,
  type PropertiesFormField,
} from "@/registry/components/forms/properties-form";

interface Task {
  title: string;
  done: boolean;
}

const SCHEMA: ReadonlyArray<PropertiesFormField> = [
  { key: "title", type: "string", label: "Title", required: true },
  { key: "done", type: "boolean", label: "Done" },
];

export function TaskCard() {
  const [values, setValues] = useState<Task>({ title: "", done: false });

  return (
    <PropertiesForm<Task>
      schema={SCHEMA}
      values={values}
      onChange={setValues}
      onSubmit={async (next) => ({ ok: true })}
      mode="edit"
    />
  );
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Field types</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>string</code> — single-line text via <code>Input</code>.
        </li>
        <li>
          <code>number</code> — right-aligned monospaced input;{" "}
          <code>onChange</code> sees a JS number when parseable.
        </li>
        <li>
          <code>boolean</code> — read renders <code>Check</code>/<code>X</code>;
          edit renders shadcn <code>Switch</code>.
        </li>
        <li>
          <code>date</code> — native <code>{`<input type="date">`}</code> for v0.1
          (shadcn <code>Calendar</code> upgrade is non-breaking, planned for
          v0.2).
        </li>
        <li>
          <code>select</code> — shadcn <code>Select</code> driven by{" "}
          <code>field.options</code>.
        </li>
        <li>
          <code>textarea</code> — multi-line; preserves whitespace in read mode.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Permissions</h3>
      <p className="text-muted-foreground">
        Each field resolves to <code>editable</code> /{" "}
        <code>read-only</code> / <code>hidden</code>, in this order:
      </p>
      <ol className="ml-5 list-decimal space-y-1 text-muted-foreground">
        <li>
          <code>resolvePermission(field, values)</code> — host predicate,
          returning <code>undefined</code> defers.
        </li>
        <li>
          Declarative <code>field.permission</code>.
        </li>
        <li>
          Default <code>editable</code>.
        </li>
      </ol>
      <p className="mt-2 text-muted-foreground">
        Read-only fields show <code>field.permissionReason</code> in a
        tooltip. Hidden fields are omitted from the DOM and from the error
        summary, but their value is preserved in <code>values</code> — the
        host owns the shape.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Validation</h3>
      <p className="text-muted-foreground">
        Two layers, both synchronous in v0.1:
      </p>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Per-field — <code>field.validate(value, allValues)</code> runs on
          every commit; throws are caught and logged.
        </li>
        <li>
          Form-level — <code>validate(values)</code> on the form runs only on
          submit attempts.
        </li>
      </ul>
      <p className="mt-2 text-muted-foreground">
        Errors render after submit OR after a field is blurred-with-error.
        On submit failure, focus moves to the first invalid field. Expensive
        validators should be wrapped in <code>useMemo</code> or debounced — they
        run on every keystroke for text inputs.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Imperative handle</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const formRef = useRef<PropertiesFormHandle>(null);
// ...
<PropertiesForm ref={formRef} ... />

formRef.current?.isDirty();        // boolean
formRef.current?.markClean();      // snapshot current values as clean
formRef.current?.reset();          // restore last cleanSnapshot
formRef.current?.focusField("title");
const result = await formRef.current?.submit();`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom renderers</h3>
      <p className="text-muted-foreground">
        Set <code>field.renderer</code> to opt out of built-in rendering. The
        renderer receives <code>FieldRendererProps</code>:{" "}
        <code>value</code>, <code>onChange</code>, <code>field</code>,{" "}
        <code>allValues</code>, <code>mode</code>, <code>error</code>,{" "}
        <code>disabled</code>, <code>fieldId</code>, <code>errorId</code>. Wire{" "}
        <code>fieldId</code> on your input and <code>errorId</code> via{" "}
        <code>aria-describedby</code> so it participates in the same a11y
        graph as built-ins.
      </p>
      <p className="mt-2 text-muted-foreground">
        When <code>renderer</code> is set, <code>field.type</code> is
        advisory only — properties-form does NOT validate that{" "}
        <code>value</code> matches the declared type.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Schema reference stability
      </h3>
      <p className="text-muted-foreground">
        Inline <code>schema={`{[...]}`}</code> rebuilds field objects on every
        render and invalidates internal memoization. Hoist to module scope or
        wrap with <code>useMemo</code>:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`const SCHEMA = [/* ... */] satisfies PropertiesFormField[];
<PropertiesForm schema={SCHEMA} ... />

// or, when derived:
const schema = useMemo(() => buildSchema(node), [node]);`}</code>
      </pre>
      <p className="mt-2 text-muted-foreground">
        In-repo, the React Compiler memoizes inline literals at the call
        site. The two patterns above matter most for the eventual NPM
        extraction where consumers may not have the Compiler enabled.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">What ships in v0.2+</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>Async validation hook.</li>
        <li>
          Conditional <code>visible</code> predicate (sibling of{" "}
          <code>permission</code>).
        </li>
        <li>Sections / fieldsets and column layouts.</li>
        <li>
          shadcn <code>Calendar</code> upgrade for the date field.
        </li>
        <li>
          Slot-able <code>submitActions</code> with localized defaults.
        </li>
      </ul>
    </div>
  );
}
