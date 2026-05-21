"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JsonForm } from "./json-form";
import {
  JsonFormProvider,
  useJsonFormContext,
} from "./json-form-context";
import { JsonFormField } from "./parts/json-form-field";
import { JsonFormSubmitButton } from "./parts/submit-button";
import { JsonFormDevtools } from "./parts/json-form-devtools";
import { useJsonForm } from "./hooks/use-json-form";
import { useJsonFormFieldsValue } from "./hooks/use-json-form-field-value";
import { defaultJsonFormRegistry } from "./lib/default-registry";
import { defineFieldRenderer } from "./lib/define-field-renderer";
import { defaultStrings as defaultJsonFormStrings } from "./lib/strings";
import type {
  FieldRenderer,
  FormSchema,
  JsonFormHandle,
} from "./types";
import {
  adminUserFormSchema,
  computedFormSchema,
  conditionalFormSchema,
  contactFormSchema,
  mockFetchSchema,
  registrationFormSchema,
  richFieldsFormSchema,
} from "./dummy-data";

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {caption ? (
          <p className="text-xs text-muted-foreground">{caption}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function LastSubmittedPanel({
  payload,
}: {
  payload: Record<string, unknown> | null;
}) {
  if (!payload) {
    return (
      <p className="text-xs italic text-muted-foreground">
        Nothing submitted yet.
      </p>
    );
  }
  return (
    <pre className="overflow-x-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed">
      {JSON.stringify(payload, null, 2)}
    </pre>
  );
}

// ─── Tab 1 — Registration ─────────────────────────────────────────────────────

function RegistrationTab() {
  const [last, setLast] = useState<Record<string, unknown> | null>(null);
  return (
    <Section
      title="Registration form"
      caption="Five fields, required-with-min-length validation, password masking, ToS acceptance gate."
    >
      <JsonForm
        schema={registrationFormSchema}
        columns={2}
        onSubmit={({ values }) => setLast(values)}
      />
      <LastSubmittedPanel payload={last} />
    </Section>
  );
}

// ─── Tab 2 — Backend-driven ──────────────────────────────────────────────────

function BackendDrivenTab() {
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [last, setLast] = useState<Record<string, unknown> | null>(null);
  const [pick, setPick] = useState<"registration" | "contact" | "rich" | "admin">(
    "registration",
  );

  function load(id: "registration" | "contact" | "rich" | "admin") {
    setPick(id);
    setSchema(null);
    setLoading(true);
  }

  useEffect(() => {
    let cancelled = false;
    void mockFetchSchema(pick).then((fetched) => {
      if (cancelled) return;
      setSchema(fetched);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [pick]);

  return (
    <Section
      title="Backend-driven"
      caption="Schema arrives async (mock 800ms). Pick a fixture; the form re-mounts cleanly."
    >
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["registration", "Registration"],
            ["contact", "Contact"],
            ["rich", "Rich fields"],
            ["admin", "Admin user"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            variant={pick === id ? "default" : "outline"}
            onClick={() => load(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : schema ? (
        <JsonForm
          schema={schema}
          columns={2}
          onSubmit={({ values }) => setLast(values)}
        />
      ) : null}

      <LastSubmittedPanel payload={last} />
    </Section>
  );
}

// ─── Tab 3 — Conditional ─────────────────────────────────────────────────────

function ConditionalTab() {
  const [last, setLast] = useState<Record<string, unknown> | null>(null);
  return (
    <Section
      title="Conditional fields"
      caption="`visibleWhen`, `enabledWhen`, `requiredWhen` adapt to user input. `validationMode='onChange'` makes the `requiredWhen` asterisk surface its error immediately on toggle — the default `onTouched` would wait until next blur."
    >
      <JsonForm
        schema={conditionalFormSchema}
        validationMode="onChange"
        onSubmit={({ values }) => setLast(values)}
      />
      <LastSubmittedPanel payload={last} />
    </Section>
  );
}

// ─── Tab 4 — Computed + sections ─────────────────────────────────────────────

function ComputedTab() {
  const [last, setLast] = useState<Record<string, unknown> | null>(null);
  return (
    <Section
      title="Computed fields + sections"
      caption="`displayName` interpolates from `firstName` + `lastName`; `domain` derives via a `compute` function."
    >
      <JsonForm
        schema={computedFormSchema}
        columns={2}
        onSubmit={({ values }) => setLast(values)}
      />
      <LastSubmittedPanel payload={last} />
    </Section>
  );
}

// ─── Tab 5 — Rich fields ─────────────────────────────────────────────────────

function RichFieldsTab() {
  const [last, setLast] = useState<Record<string, unknown> | null>(null);
  return (
    <Section
      title="Rich fields"
      caption="`code` (lazy-loads CodeMirror via `@ilinxa/code-block`), `richtext` (lazy-loads Plate via `@ilinxa/article-body-01`), `slider`, and `rating`."
    >
      <JsonForm
        schema={richFieldsFormSchema}
        onSubmit={({ values }) => setLast(values)}
      />
      <LastSubmittedPanel payload={last} />
    </Section>
  );
}

// ─── Tab 6 — Imperative API ──────────────────────────────────────────────────

function ImperativeTab() {
  const handleRef = useRef<JsonFormHandle | null>(null);
  const [last, setLast] = useState<Record<string, unknown> | null>(null);

  return (
    <Section
      title="Imperative API"
      caption="Submit / reset / setValue from outside the form via the imperative handle."
    >
      <div className="flex flex-wrap gap-1.5">
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            const r = await handleRef.current?.submit();
            if (r?.ok) setLast(r.values ?? null);
          }}
        >
          Programmatic submit
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleRef.current?.reset()}
        >
          Reset
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            handleRef.current?.setValue("topic", "billing")
          }
        >
          Set topic → billing
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleRef.current?.focus("email")}
        >
          Focus email
        </Button>
      </div>
      <JsonForm
        ref={handleRef}
        schema={contactFormSchema}
        submitButton={false}
        onSubmit={({ values }) => setLast(values)}
      />
      <LastSubmittedPanel payload={last} />
    </Section>
  );
}

// ─── Tab 7 — Custom registry ─────────────────────────────────────────────────

const ColorSwatchRenderer: FieldRenderer = ({
  value,
  onChange,
  onBlur,
  disabled,
}) => {
  const palette = ["#FF595E", "#FFCA3A", "#8AC926", "#1982C4", "#6A4C93"];
  return (
    <div className="flex items-center gap-1" onBlur={onBlur}>
      {palette.map((c) => (
        <button
          key={c}
          type="button"
          disabled={disabled}
          onClick={() => onChange(c)}
          aria-label={`Pick ${c}`}
          className={
            "size-6 rounded-md ring-offset-2 transition-all hover:scale-105 " +
            (value === c
              ? "ring-2 ring-primary ring-offset-background"
              : "ring-1 ring-border")
          }
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
};

const customRegistry: Record<string, FieldRenderer> = {
  ...defaultJsonFormRegistry,
  "color-swatch": ColorSwatchRenderer,
};

const customSchema: FormSchema = {
  meta: {
    title: "Custom field types",
    description:
      "`color-swatch` is registered via the `fieldRegistry` prop. Built-in types continue to work alongside.",
  },
  fields: [
    {
      name: "name",
      type: "text",
      label: "Label name",
      validators: { required: true },
    },
    {
      name: "color",
      type: "color-swatch",
      label: "Label color",
      defaultValue: "#1982C4",
    },
    {
      name: "shared",
      type: "switch",
      label: "Shared across the team",
    },
  ],
};

function CustomRegistryTab() {
  const [last, setLast] = useState<Record<string, unknown> | null>(null);
  return (
    <Section
      title="Custom registry"
      caption="Register your own field types by spreading `defaultJsonFormRegistry` and adding entries — they slot in alongside the built-ins."
    >
      <JsonForm
        schema={customSchema}
        fieldRegistry={customRegistry}
        onSubmit={({ values }) => setLast(values)}
      />
      <LastSubmittedPanel payload={last} />

      <details className="rounded-md border border-border bg-muted/30 p-2 text-xs">
        <summary className="cursor-pointer font-medium">
          Fully-headless variant (standalone parts)
        </summary>
        <div className="pt-2">
          <HeadlessExample />
        </div>
      </details>
    </Section>
  );
}

function HeadlessExample() {
  const { form, zodSchema, handle } = useJsonForm(contactFormSchema);
  const [last, setLast] = useState<Record<string, unknown> | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  return (
    <JsonFormProvider
      value={{
        ...handle,
        rhf: form,
        schema: contactFormSchema,
        zodSchema,
        strings: defaultJsonFormStrings,
        formId: "headless-demo",
        hasSubmitted: false,
        fieldRegistry: defaultJsonFormRegistry,
      }}
      hasSubmitted={hasSubmitted}
    >
      <HeadlessForm onSubmit={setLast} onSubmitAttempt={() => setHasSubmitted(true)} />
      <LastSubmittedPanel payload={last} />
    </JsonFormProvider>
  );
}

function HeadlessForm({
  onSubmit,
  onSubmitAttempt,
}: {
  onSubmit: (vals: Record<string, unknown>) => void;
  onSubmitAttempt: () => void;
}) {
  const ctx = useJsonFormContext();
  return (
    <form
      noValidate
      className="flex flex-col gap-3 pt-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmitAttempt();
        void ctx.rhf.handleSubmit((v) =>
          onSubmit(v as Record<string, unknown>),
        )(e);
      }}
    >
      <JsonFormField name="topic" />
      <JsonFormField name="email" />
      <JsonFormField name="message" />
      <div className="flex justify-end">
        <JsonFormSubmitButton />
      </div>
    </form>
  );
}

// ─── Tab 8 — Devtools + perf (v0.1.7) ───────────────────────────────────────

// Extract as an uppercase-named component so rules-of-hooks lint accepts
// the `useJsonFormFieldsValue` call inside.
function SummaryImpl() {
  // narrow-deps via the new headless hook — re-renders only when the
  // declared dependsOn fields change. Mirrors what a real consumer would
  // write for a derived-summary surface.
  const { firstName, lastName } = useJsonFormFieldsValue<{
    firstName: string;
    lastName: string;
  }>(["firstName", "lastName"]);
  const display = `${firstName ?? ""} ${lastName ?? ""}`.trim() || "—";
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
      Live preview: <span className="font-medium text-foreground">{display}</span>
    </div>
  );
}

const SummaryRenderer = defineFieldRenderer<unknown, unknown>({
  displayName: "SummaryRenderer",
  impl: () => <SummaryImpl />,
});

const devtoolsDemoSchema: FormSchema = {
  meta: { title: "Devtools + narrow-deps perf" },
  fields: [
    { name: "firstName", type: "text", label: "First name", validators: { required: true } },
    { name: "lastName", type: "text", label: "Last name", validators: { required: true } },
    // Custom renderer using dependsOn — v0.1.7 ships this as typed metadata
    // (runtime watch-gating ships in v0.2.0). Setting it now is forward-
    // compatible authoring.
    {
      name: "summary",
      type: "summary",
      label: "Summary",
      dependsOn: ["firstName", "lastName"],
    },
    { name: "role", type: "select", label: "Role", options: [
      { value: "admin", label: "Admin" },
      { value: "editor", label: "Editor" },
      { value: "viewer", label: "Viewer" },
    ] },
    { name: "notes", type: "textarea", label: "Notes", rows: 3 },
  ],
};

function DevtoolsPerfTab() {
  const [last, setLast] = useState<Record<string, unknown> | null>(null);
  const registry = useMemo(
    () => ({ ...defaultJsonFormRegistry, summary: SummaryRenderer }),
    [],
  );
  return (
    <Section
      title="Devtools + narrow-deps"
      caption="Custom `summary` renderer reads firstName + lastName via `useJsonFormFieldsValue`. `dependsOn: ['firstName', 'lastName']` is forward-compatible typed metadata (runtime gating ships in v0.2.0). Inline `<JsonFormDevtools />` shows live schema / values / conditionals / errors below the form."
    >
      <JsonForm
        schema={devtoolsDemoSchema}
        columns={2}
        fieldRegistry={registry}
        onSubmit={({ values }) => setLast(values)}
      />
      <JsonFormDevtools inline />
      <LastSubmittedPanel payload={last} />
    </Section>
  );
}

// ─── Tab shell ───────────────────────────────────────────────────────────────

export default function JsonFormDemo() {
  return (
    <Tabs defaultValue="registration" className="w-full">
      <TabsList className="flex w-full flex-wrap">
        <TabsTrigger value="registration">Registration</TabsTrigger>
        <TabsTrigger value="backend">Backend-driven</TabsTrigger>
        <TabsTrigger value="conditional">Conditional</TabsTrigger>
        <TabsTrigger value="computed">Computed</TabsTrigger>
        <TabsTrigger value="rich">Rich fields</TabsTrigger>
        <TabsTrigger value="imperative">Imperative</TabsTrigger>
        <TabsTrigger value="custom">Custom registry</TabsTrigger>
        <TabsTrigger value="devtools">Devtools + perf</TabsTrigger>
      </TabsList>

      <TabsContent value="registration" className="pt-3">
        <RegistrationTab />
      </TabsContent>
      <TabsContent value="backend" className="pt-3">
        <BackendDrivenTab />
      </TabsContent>
      <TabsContent value="conditional" className="pt-3">
        <ConditionalTab />
      </TabsContent>
      <TabsContent value="computed" className="pt-3">
        <ComputedTab />
      </TabsContent>
      <TabsContent value="rich" className="pt-3">
        <RichFieldsTab />
      </TabsContent>
      <TabsContent value="imperative" className="pt-3">
        <ImperativeTab />
      </TabsContent>
      <TabsContent value="custom" className="pt-3">
        <CustomRegistryTab />
      </TabsContent>
      <TabsContent value="devtools" className="pt-3">
        <DevtoolsPerfTab />
      </TabsContent>

      <span className="hidden">
        {/* Reference admin schema so it's not dead in dummy-data. */}
        {adminUserFormSchema.fields.length}
      </span>
    </Tabs>
  );
}
