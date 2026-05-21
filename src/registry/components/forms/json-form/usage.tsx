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
          Field renderers receive <code>{`{ field, value, onChange, onBlur, error, disabled, readOnly, allValues, formApi, ariaProps }`}</code>{" "}
          and return a <code>ReactNode</code> (single element, fragment, or
          array — whatever fits). Spread <code>ariaProps.id</code> and the{" "}
          <code>aria-*</code> attributes onto the native form control so{" "}
          <code>label[for]</code> binds correctly; for group-style controls
          (<code>role=&quot;radiogroup&quot;</code> /{" "}
          <code>&quot;group&quot;</code>), attach{" "}
          <code>aria-labelledby={`{ariaProps.labelledBy}`}</code> to the
          group root. The <code>ariaProps</code> bridge replaced the v0.1.0
          <code>Slot.Root</code> strategy in v0.1.2 — <code>Slot.Root</code>{" "}
          silently failed on Popover-wrapped controls and on non-form group
          roots.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Performance — narrow-deps with <code>dependsOn</code></h3>
        <p className="text-muted-foreground">
          Field renderers receive an <code>allValues</code> snapshot of the whole form. In v0.1.x every <code>FieldWrapper</code> subscribed to the full values bag to keep that snapshot live, so every field re-rendered on every keystroke anywhere in the form. Custom renderers that don&apos;t read <code>allValues</code> — most of them — paid this cost for nothing. As of v0.2.0 the subscription is resolved per-field:
        </p>
        <ul className="ml-5 mt-2 list-disc space-y-1 text-muted-foreground">
          <li><strong>Built-in renderers</strong> (<code>text</code>, <code>radio-group</code>, <code>checkbox</code>, etc.) — audited not to read <code>allValues</code>, so they skip the subscription automatically; <code>allValues</code> is a <code>getValues()</code> snapshot taken at render. <strong>No <code>dependsOn</code> declaration needed.</strong></li>
          <li><strong>Custom renderer with <code>dependsOn: [&quot;a&quot;, &quot;b&quot;]</code></strong> — narrow watch. Re-renders only when those paths change. The renderer&apos;s <code>allValues</code> contains exactly the named paths, rebuilt via <code>setByPath</code>.</li>
          <li><strong>Custom renderer with <code>dependsOn: []</code></strong> — explicit opt-out. Skip the watch entirely; <code>allValues</code> is a <code>getValues()</code> snapshot.</li>
          <li><strong>Custom renderer without <code>dependsOn</code></strong> — legacy full-bag watch. Preserves v0.1.x behavior so unmigrated renderers keep working.</li>
        </ul>
        <pre className="overflow-x-auto mt-3 rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
          <code>{`{
  name: "summary",
  type: "summary",  // custom renderer reading firstName + lastName
  dependsOn: ["firstName", "lastName"],
}

{
  name: "color",
  type: "color",    // custom renderer doesn't read allValues at all
  dependsOn: [],    // → no subscription; receives a getValues() snapshot
}`}</code>
        </pre>
        <p className="mt-2 text-muted-foreground">
          The whitelist check resolves on the <strong>final renderer identity</strong>, not on <code>field.type</code> alone — a custom renderer registered at the <code>text</code> slot correctly opts back into full-bag unless it sets <code>dependsOn</code>. <code>validateSchemaDev</code> warns when <code>dependsOn</code> references a field name that doesn&apos;t exist in <code>schema.fields[].name</code>.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">What changed in v0.2</h3>
        <p className="text-muted-foreground">
          The v0.2 arc is the behavioral + ergonomic counterpart to the
          additive v0.1.7 substrate work. All changes are auto-applied —
          zero consumer code changes required.
        </p>
        <h4 className="mt-3 mb-1 text-sm font-semibold">v0.2.0</h4>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li><strong>Default-registry watch drop (A2).</strong> Every built-in renderer skips the FieldWrapper-level <code>useWatch({"{ control }"})</code> subscription (audited against <code>BUILTIN_RENDERER_TYPES_SKIPPING_ALL_VALUES</code>; identity-checked against <code>defaultJsonFormRegistry</code>). On a 20-field form, FieldWrapper renders per keystroke drop from 20 down to 1–4 (only fields whose <code>useConditional</code> / <code>useComputed</code> narrow-deps reference the typed field). Custom renderers without <code>dependsOn</code> are unchanged.</li>
          <li><strong>Deep-merge <code>defaultValues</code> (B1).</strong> Form-level <code>defaultValues</code> now overlays per-field defaults <strong>per leaf</strong>, not per top-level key. <code>defaultValues = {"{ address: { city: 'NYC' } }"}</code> no longer drops sibling per-field defaults at <code>address.country</code>, <code>address.zip</code>, etc.</li>
          <li><strong>Conditional-count warn threshold</strong> bumped from 50 → 200 in <code>validateSchemaDev</code>; the per-keystroke render count no longer scales with conditional count.</li>
        </ul>
        <h4 className="mt-3 mb-1 text-sm font-semibold">v0.2.1</h4>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>JSDoc + devtools patch: <code>dependsOn</code> stable-identity guidance, <code>allValues</code> snapshot-freshness contract documented across the three subscription modes, <code>&lt;JsonFormDevtools&gt;</code> renders a soft-warning panel when no <code>&lt;JsonFormProvider&gt;</code> is in the tree (instead of crashing), BigInt-safe <code>prettyReplacer</code> in the devtools body.</li>
        </ul>
        <h4 className="mt-3 mb-1 text-sm font-semibold">v0.2.3</h4>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>Richtext controlled-mode echo loop fixed at the substrate — depends on <code>@ilinxa/article-body-01@^0.2.2</code>, which now uses content-equality (JSON-stringified Plate-tree key) in its sync effect instead of reference-equality. The earlier v0.2.2 consumer-side band-aid in <code>parts/field-richtext.tsx</code> was reverted; the field is back to its simple v0.2.1 shape.</li>
        </ul>
        <h4 className="mt-3 mb-1 text-sm font-semibold">v0.2.4</h4>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li><strong>Headless <code>&lt;FormProvider&gt;</code> bridge.</strong> <code>&lt;JsonFormProvider&gt;</code> now wraps children in <code>&lt;FormProvider {"{...value.rhf}"}&gt;</code> internally. The documented headless pattern (<code>&lt;JsonFormProvider value={"{{ ...handle, rhf: form, ... }}"}&gt;</code>) no longer requires consumers to also wrap with RHF&apos;s <code>&lt;FormProvider&gt;</code>. Pre-v0.2.4 code that wraps with both still works — the inner wins, identical form instance.</li>
        </ul>
        <h4 className="mt-3 mb-1 text-sm font-semibold">v0.2.5</h4>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li><strong><code>&lt;FieldRadioGroup&gt;</code> always-controlled.</strong> Renderer now passes <code>value=&quot;&quot;</code> (Radix-canonical &quot;no selection&quot;) instead of <code>undefined</code> when the field has no value, so the underlying RadioGroup stays controlled. React no longer logs <em>&quot;RadioGroup is changing from uncontrolled to controlled&quot;</em> on the first interaction of a radio-group field without a <code>defaultValue</code>.</li>
        </ul>
        <p className="mt-3 text-muted-foreground">
          If you were relying on the v0.1.x shallow <code>defaultValues</code> replace to clear nested per-field defaults, see the FAQ entry below.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Typed renderer authoring — <code>defineFieldRenderer&lt;T&gt;</code></h3>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
          <code>{`import { defineFieldRenderer, defaultJsonFormRegistry } from "@ilinxa/json-form";

interface ColorConfig {
  palette?: string[];
}

const ColorSwatch = defineFieldRenderer<string, ColorConfig>({
  displayName: "ColorSwatch",
  impl: ({ value, onChange, field, disabled }) => {
    const palette = field.config?.color?.palette ?? ["#FF595E", "#FFCA3A"];
    return (
      <div className="flex gap-1">
        {palette.map((c) => (
          <button key={c} type="button" disabled={disabled}
            onClick={() => onChange(c)}
            style={{ background: c, opacity: value === c ? 1 : 0.5 }}
          />
        ))}
      </div>
    );
  },
});

const registry = { ...defaultJsonFormRegistry, color: ColorSwatch };`}</code>
        </pre>
        <p className="mt-2 text-muted-foreground">
          <code>defineFieldRenderer&lt;TValue, TConfig&gt;</code> narrows the renderer args at the type level. <strong>It&apos;s type-narrowing only</strong>{" — there’s no runtime narrowing, because RHF values aren’t statically known. The factory attaches a "}<code>displayName</code> (used by <code>&lt;JsonFormDevtools&gt;</code>) as a non-enumerable property.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Headless single-field reads — <code>useJsonFormFieldValue</code></h3>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
          <code>{`import { useJsonFormFieldValue, useJsonFormFieldsValue } from "@ilinxa/json-form";

function Summary() {
  // Single-field, narrow-deps (re-renders only when "country" changes)
  const country = useJsonFormFieldValue<string>("country");
  return <p>You selected {country}</p>;
}

function NamePreview() {
  // Multi-field, narrow-deps (re-renders only when one of these changes)
  const { firstName, lastName } = useJsonFormFieldsValue<{
    firstName: string;
    lastName: string;
  }>(["firstName", "lastName"]);
  return <p>{firstName} {lastName}</p>;
}`}</code>
        </pre>
        <p className="mt-2 text-muted-foreground">
          Both hooks are pure ergonomic wrappers around RHF&apos;s <code>useWatch</code> scoped to the active <code>&lt;JsonFormProvider&gt;</code>. The generic <code>&lt;T&gt;</code> is <strong>consumer-asserted</strong>{" — RHF values aren’t statically known, so this is typed convenience, not a runtime guarantee."}
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Devtools panel — <code>&lt;JsonFormDevtools&gt;</code></h3>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
          <code>{`import { JsonForm, JsonFormDevtools } from "@ilinxa/json-form";

export function MyForm() {
  return (
    <>
      <JsonForm schema={schema} onSubmit={...} />
      <JsonFormDevtools />
    </>
  );
}`}</code>
        </pre>
        <p className="mt-2 text-muted-foreground">
          Floating panel with four tabs: <strong>Schema</strong> (collapsible JSON), <strong>Values</strong> (live RHF values), <strong>Conditionals</strong> (per-field visible / enabled / required booleans), <strong>Errors</strong>. Toggle the floating panel with <code>Ctrl+Shift+J</code> (override via <code>shortcut</code> prop). Use <code>&lt;JsonFormDevtools inline /&gt;</code> for inline-block placement.
        </p>
        <p className="mt-2 text-muted-foreground">
          <strong>Prod no-op:</strong> in production builds, the component returns <code>null</code> automatically (gated on <code>process.env.NODE_ENV</code>). For <strong>true bundler-level dead-code-elimination</strong>, wrap the usage:
        </p>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
          <code>{`{process.env.NODE_ENV !== "production" && <JsonFormDevtools />}`}</code>
        </pre>
        <p className="mt-2 text-muted-foreground">
          The panel body itself is <code>React.lazy()</code>-boundary-isolated — the ~250 LOC body chunk only fetches when the component actually mounts to a non-null state, so even without the consumer-side guard the body never ships to prod users. Override via <code>force</code> prop for prod-debug.
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-base font-semibold">Headless usage</h3>
        <p className="mb-2 text-muted-foreground">
          <strong>v0.2.4:</strong> <code>&lt;JsonFormProvider&gt;</code>{" "}
          bridges RHF&apos;s <code>&lt;FormProvider&gt;</code> internally,
          so you do <strong>not</strong> need to wrap with both providers.
          Construct a <code>ctx</code> object that satisfies{" "}
          <code>JsonFormContextValue</code> and hand it to{" "}
          <code>&lt;JsonFormProvider value={`{ctx}`}&gt;</code>; the
          standalone parts resolve their RHF context through that bridge.
        </p>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs">
          <code>{`import {
  useJsonForm,
  JsonFormProvider,
  JsonFormField,
  JsonFormSubmitButton,
  defaultJsonFormRegistry,
  defaultJsonFormStrings,
} from "@ilinxa/json-form";

function Custom({ schema, onValid }) {
  const { form, zodSchema, handle } = useJsonForm(schema);
  const ctx = {
    ...handle,
    rhf: form,
    schema,
    zodSchema,
    strings: defaultJsonFormStrings,
    formId: "my-form",
    hasSubmitted: false,
    fieldRegistry: defaultJsonFormRegistry,
  };
  return (
    <JsonFormProvider value={ctx}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit(onValid)(e);
        }}
      >
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
          <li><code>aria-required</code>, <code>aria-invalid</code>, <code>aria-describedby</code> forwarded onto the control via the <code>ariaProps</code> bridge passed in <code>FieldRendererArgs</code> (v0.1.2 replaced the original <code>Slot.Root</code> strategy)</li>
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

          <dt className="font-medium text-foreground">When does <code>requiredWhen</code> surface its error?</dt>
          <dd>
            <code>requiredWhen</code> is enforced via a Zod <code>superRefine</code>, which only re-runs when RHF triggers validation. Under the default <code>validationMode: &quot;onTouched&quot;</code> that means the error appears on the field&apos;s next blur or on the next submit attempt — flipping the trigger field doesn&apos;t synchronously re-flag the conditional field. Set <code>validationMode=&quot;onChange&quot;</code> for eager surfacing, or call <code>formApi.trigger(name)</code> from a custom watcher.
          </dd>

          <dt className="font-medium text-foreground">Does <code>onChange</code> loop when piped back through <code>values</code>?</dt>
          <dd>
            No. <code>JsonForm</code> hashes the values bag before invoking <code>onChange</code> and skips structurally-identical re-emissions, so the controlled-mode round-trip (consumer <code>onChange</code> → <code>setState</code> → new <code>values</code> prop → RHF re-sync) terminates after one tick. The default <code>onChangeDebounce</code> of 100ms is an additional smoothing layer, not the loop-breaker.
          </dd>

          <dt className="font-medium text-foreground">Do I still need to wrap headless trees with RHF&apos;s <code>&lt;FormProvider&gt;</code>?</dt>
          <dd>
            No, as of v0.2.4 <code>&lt;JsonFormProvider&gt;</code> wraps its children in <code>&lt;FormProvider {"{...value.rhf}"}&gt;</code> internally. The documented headless pattern (<code>&lt;JsonFormProvider value={"{{ ...handle, rhf: form, ... }}"}&gt;</code>) is now self-contained — standalone parts (<code>&lt;JsonFormField&gt;</code>, <code>&lt;JsonFormSubmitButton&gt;</code>, etc.) see RHF&apos;s context through the bridge. Pre-v0.2.4 code that wraps with both providers still works (the inner wins; same form instance).
          </dd>

          <dt className="font-medium text-foreground">What changed about Zod compilation in v0.1.7?</dt>
          <dd>
            Internal refactor only. The single <code>compileSchema(schema, strings)</code> call is now split behind the scenes into <code>compileStructural(schema)</code> (cheap, schema-keyed) + <code>injectStrings(structural, strings)</code> (Zod chain construction, strings-keyed). <code>useJsonForm</code> caches each step independently, so changing only the <code>strings</code> prop (locale switch, error-message overrides) skips the structural re-walk. <strong>No public API change</strong>{" — the helpers are internal and not exported from the package barrel."}
          </dd>

          <dt className="font-medium text-foreground">My v0.1.x form passed <code>defaultValues = {"{ address: {} }"}</code> to clear nested per-field defaults — what do I do in v0.2.0?</dt>
          <dd>
            v0.2.0 deep-merges <code>defaultValues</code> per leaf instead of replacing per top-level key, so an empty object at <code>address</code> no longer wipes <code>address.country</code> / <code>address.zip</code> defaults. To clear them you now need to be explicit per leaf — either via a nested <code>defaultValues</code> shape (<code>{"{ address: { country: '', zip: '' } }"}</code>) or by setting the per-field <code>defaultValue</code> to <code>&quot;&quot;</code> directly on the schema field. The audit found no shipping consumer relying on the old shallow-replace, but if you hit this case, an empty string per leaf is the safest port.
          </dd>
        </dl>
      </section>
    </div>
  );
}
