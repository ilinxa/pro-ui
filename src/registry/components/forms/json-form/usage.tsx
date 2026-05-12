"use client";

export default function JsonFormUsage() {
  return (
    <div className="max-w-none space-y-6 text-sm leading-relaxed text-foreground">
      <section>
        <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
        <p className="text-muted-foreground">
          Reach for <code>JsonForm</code> when the same surface needs to render
          many variants of a form, when the schema is driven by a backend or an
          AI agent, or when you want declarative validation without hand-rolling
          a RHF form. For one-off, deeply bespoke flows the existing{" "}
          <code>properties-form</code> pattern is still the right choice.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Basic example</h3>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
          <code>{`import { JsonForm, type FormSchema } from "@ilinxa/json-form";

const schema: FormSchema = {
  meta: { title: "Create account" },
  fields: [
    { name: "email", type: "email", label: "Email", validators: { required: true } },
    { name: "password", type: "password", label: "Password", validators: { required: true, minLength: 8 } },
  ],
};

export function Signup() {
  return (
    <JsonForm
      schema={schema}
      onSubmit={({ values }) => console.log(values)}
    />
  );
}`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Validators</h3>
        <p className="text-muted-foreground">
          The <code>validators</code> block compiles to a Zod chain at mount.
          Each rule accepts either a primitive value or a{" "}
          <code>{`{ value, message }`}</code> object for custom messages.
        </p>
        <ul className="ml-5 mt-2 list-disc space-y-1 text-muted-foreground">
          <li><code>required</code> — <code>boolean | string</code> (string overrides default message)</li>
          <li><code>min</code> / <code>max</code> — number bounds (for <code>number</code>, <code>slider</code>, <code>rating</code>)</li>
          <li><code>minLength</code> / <code>maxLength</code> — string-length bounds</li>
          <li><code>pattern</code> — regex source string</li>
          <li><code>email</code> / <code>url</code> — built-in format checks</li>
        </ul>
        <p className="mt-2 text-muted-foreground">
          For custom logic, use <code>validate</code> (sync) or{" "}
          <code>validateAsync</code> (debounced; default 400ms). Sync runs first
          and short-circuits async on failure.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Conditional fields</h3>
        <p className="text-muted-foreground">
          Use the 11-operator Condition DSL, or a function for anything beyond
          the operators.
        </p>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
          <code>{`{
  name: "vatId",
  type: "text",
  label: "VAT ID",
  visibleWhen: { field: "country", in: ["DE", "FR", "IT", "ES"] },
  requiredWhen: ({ values }) => values.cadence === "annually",
}`}</code>
        </pre>
        <p className="mt-2 text-muted-foreground">
          When <code>visibleWhen</code> flips to <code>false</code> the field
          unmounts and its value is dropped from submission unless{" "}
          <code>keepValueWhenHidden: true</code>. <code>type: {'"hidden"'}</code>{" "}
          fields ALWAYS submit (CSRF-token use case).
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Computed fields</h3>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
          <code>{`{ name: "displayName", type: "computed", label: "Display name", expression: "{firstName} {lastName}" }

// or with a function:
{
  name: "total",
  type: "computed",
  label: "Total",
  compute: ({ values }) => Number(values.qty) * Number(values.unitPrice),
}`}</code>
        </pre>
        <p className="mt-2 text-muted-foreground">
          <code>expression</code> is pure interpolation — no operators, no
          conditionals. <code>compute</code> is the escape hatch for anything
          richer. Both are deps-tracked: only re-runs when referenced fields
          change.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Custom field types</h3>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
          <code>{`import { defaultJsonFormRegistry, type FieldRenderer } from "@ilinxa/json-form";

const MyColor: FieldRenderer = ({ value, onChange, disabled }) => (
  <input type="color" value={String(value ?? "#000")} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
);

const registry = { ...defaultJsonFormRegistry, color: MyColor };

<JsonForm schema={schema} fieldRegistry={registry} onSubmit={...} />`}</code>
        </pre>
        <p className="mt-2 text-muted-foreground">
          Field renderers receive <code>{`{ field, value, onChange, onBlur, error, disabled, readOnly, allValues, formApi }`}</code>{" "}
          and must return a SINGLE React element — the wrapper uses{" "}
          <code>Slot.Root</code> to forward <code>id</code> +{" "}
          <code>aria-*</code> attributes onto it.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Headless usage</h3>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
          <code>{`import { useJsonForm, JsonFormProvider, JsonFormField, JsonFormSubmitButton } from "@ilinxa/json-form";

function Custom() {
  const { form, zodSchema, handle } = useJsonForm(schema);
  const ctx = { ...handle, rhf: form, schema, zodSchema, strings, formId: "x", hasSubmitted: false, fieldRegistry };
  return (
    <JsonFormProvider value={ctx}>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(onValid)(e); }}>
        <JsonFormField name="email" />
        <JsonFormField name="password" />
        <JsonFormSubmitButton />
      </form>
    </JsonFormProvider>
  );
}`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Accessibility</h3>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>Deterministic SSR-stable field ids via React 19 <code>useId()</code>; <code>label[for]</code> matches the input id</li>
          <li><code>aria-required</code>, <code>aria-invalid</code>, <code>aria-describedby</code> forwarded onto the control via <code>Slot.Root</code></li>
          <li><code>{`role="alert"`}</code> on every error message + on the error summary; summary is <code>{`aria-live="polite"`}</code></li>
          <li>Focus moves to the first invalid field on submit failure (DOM order)</li>
          <li>Radio groups + checkbox groups have keyboard nav (arrow keys, space) via the underlying Radix primitive</li>
          <li>Rating widget is <code>{`role="radiogroup"`}</code>; arrow keys cycle, number keys jump, Home/End jump to first/last</li>
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Value-shape per type</h3>
        <div className="overflow-x-auto rounded-md border border-border bg-muted/40">
          <table className="w-full text-xs">
            <thead className="bg-muted">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium">Type</th>
                <th className="px-2 py-1.5 text-left font-medium">Submitted value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr><td className="px-2 py-1"><code>text / email / password / url / tel / textarea</code></td><td className="px-2 py-1"><code>string</code></td></tr>
              <tr><td className="px-2 py-1"><code>number / slider / rating</code></td><td className="px-2 py-1"><code>number</code></td></tr>
              <tr><td className="px-2 py-1"><code>checkbox / switch</code></td><td className="px-2 py-1"><code>boolean</code></td></tr>
              <tr><td className="px-2 py-1"><code>select / radio-group</code></td><td className="px-2 py-1"><code>unknown</code> (option.value, type preserved)</td></tr>
              <tr><td className="px-2 py-1"><code>multi-select / checkbox-group</code></td><td className="px-2 py-1"><code>unknown[]</code></td></tr>
              <tr><td className="px-2 py-1"><code>date / time / datetime</code></td><td className="px-2 py-1"><code>string</code> (ISO 8601)</td></tr>
              <tr><td className="px-2 py-1"><code>date-range</code></td><td className="px-2 py-1"><code>{`{ start: string; end: string }`}</code></td></tr>
              <tr><td className="px-2 py-1"><code>code</code></td><td className="px-2 py-1"><code>string</code></td></tr>
              <tr><td className="px-2 py-1"><code>richtext</code></td><td className="px-2 py-1"><code>{`Array<{ type, children }>`}</code> (Plate JSON). For the canonical empty default, import <code>ARTICLE_BODY_EMPTY_VALUE</code> from <code>@ilinxa/article-body-01</code>. Serialize via <code>serializeArticleBodyToHtml</code> at export boundaries.</td></tr>
              <tr><td className="px-2 py-1"><code>computed</code></td><td className="px-2 py-1">whatever <code>expression</code> / <code>compute</code> returns</td></tr>
              <tr><td className="px-2 py-1"><code>hidden</code></td><td className="px-2 py-1">defaultValue (unchanged)</td></tr>
              <tr><td className="px-2 py-1"><code>section / divider</code></td><td className="px-2 py-1">— (excluded from submission)</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">FAQ</h3>
        <dl className="space-y-2 text-muted-foreground">
          <dt className="font-medium text-foreground">Why isn&apos;t the submit button disabled when the form is invalid?</dt>
          <dd>That&apos;s an a11y anti-pattern — users get no feedback on what&apos;s wrong. The button is enabled; submit triggers validation, errors surface inline + in the summary. Opt in via <code>{`submitButton: { disableWhenInvalid: true }`}</code>.</dd>

          <dt className="font-medium text-foreground">Why does submit fire on Enter inside <code>{`<input>`}</code> but not <code>{`<textarea>`}</code>?</dt>
          <dd>Standard browser behavior — Enter in textarea inserts a newline. Enter in any other text input fires the form&apos;s <code>{`<button type="submit">`}</code>.</dd>

          <dt className="font-medium text-foreground">Can I pin <code>zod@^3</code> in my app?</dt>
          <dd>No. <code>JsonForm</code> requires <code>zod@^4</code> (the resolver chain uses v4 APIs). Upgrade or build your form by hand.</dd>

          <dt className="font-medium text-foreground">Why does my form re-mount when the schema reference changes?</dt>
          <dd>RHF re-initializes on schema identity change. Memoize your schema (<code>useMemo</code> or module-scope const) so the reference is stable across renders.</dd>
        </dl>
      </section>
    </div>
  );
}
