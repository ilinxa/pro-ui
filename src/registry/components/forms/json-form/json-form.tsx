"use client";

import {
  Fragment,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FormProvider, useFormState, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

import { useJsonForm } from "./hooks/use-json-form";
import { useDebouncedCallback } from "./hooks/use-debounced-callback";
import { mergeStrings } from "./lib/strings";
import { defaultJsonFormRegistry } from "./lib/default-registry";
import { flattenRhfErrorsToRecord } from "./lib/flatten-errors";
import { isValueField } from "./lib/validate-schema";
import { JsonFormProvider, useJsonFormContext } from "./json-form-context";
import { FieldWrapper } from "./parts/field-wrapper";
import { FieldFallback } from "./parts/field-fallback";
import { FormHeader } from "./parts/form-header";
import { JsonFormErrorSummary } from "./parts/error-summary";
import { JsonFormSubmitButton } from "./parts/submit-button";
import { JsonFormResetButton } from "./parts/reset-button";
import type {
  FieldDefinition,
  FieldRenderer,
  JsonFormContextValue,
  JsonFormProps,
} from "./types";

/**
 * Top-level component. Composes our `<JsonFormProvider>` + RHF's
 * `<FormProvider>` + a layout shell that walks `schema.fields` and renders
 * each via the resolver chain (`renderField` → `fieldRegistry` → default).
 */
export function JsonForm<
  TValues extends Record<string, unknown> = Record<string, unknown>,
>({
  schema,
  defaultValues,
  values,
  onSubmit,
  onSubmitError,
  onSubmitAttempt,
  onChange,
  onChangeDebounce = 100,
  onValidationChange,
  onReady,
  columns = 1,
  labelPosition = "top",
  showSummary,
  summaryStrategy = "post-submit",
  showSchemaHeader = true,
  submitButton,
  resetButton,
  fieldRegistry,
  renderField,
  validationMode = "onTouched",
  strings: stringsOverride,
  className,
  style,
  ref,
}: JsonFormProps<TValues>) {
  const formId = useId();
  const strings = useMemo(() => mergeStrings(stringsOverride), [stringsOverride]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const { form, zodSchema, handle } = useJsonForm<TValues>(schema, {
    defaultValues,
    values,
    validationMode,
    strings: stringsOverride,
  });

  // Merge consumer registry with the default.
  const mergedRegistry = useMemo<Record<string, FieldRenderer>>(
    () => ({ ...defaultJsonFormRegistry, ...(fieldRegistry ?? {}) }),
    [fieldRegistry],
  );

  // `hasSubmitted` deliberately lives on a sibling context (provided to
  // `<JsonFormProvider>` as a prop) — keeping it OUT of this memo means the
  // first-submit flip doesn't invalidate the main context and re-render every
  // field. The compat field on the value (set to `false` here) is overwritten
  // by `useJsonFormContext` reads, which merge in the narrow context.
  const ctx = useMemo<JsonFormContextValue<TValues>>(
    () => ({
      ...handle,
      rhf: form,
      schema,
      zodSchema,
      strings,
      formId,
      hasSubmitted: false,
      fieldRegistry: mergedRegistry,
    }),
    [handle, form, schema, zodSchema, strings, formId, mergedRegistry],
  );

  useImperativeHandle(ref, () => handle, [handle]);

  // T3.7 — fire `onReady` once after mount + defaults applied. Stored in a
  // ref so a parent re-render that passes a fresh callback identity doesn't
  // re-fire (the contract is "once per form lifetime"). Ref-write happens
  // inside an effect (React Compiler bans mutation during render).
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);
  const readyFiredRef = useRef(false);
  useEffect(() => {
    if (readyFiredRef.current) return;
    readyFiredRef.current = true;
    onReadyRef.current?.({ formApi: handle });
  }, [handle]);

  // Debounced onChange that subscribes to the values bag.
  const debouncedChange = useDebouncedCallback((vals: Record<string, unknown>) => {
    onChange?.({ values: vals as TValues, formApi: handle });
  }, onChangeDebounce);

  return (
    <FormProvider {...form}>
      <JsonFormProvider value={ctx as JsonFormContextValue} hasSubmitted={hasSubmitted}>
        <form
          noValidate
          className={cn("flex flex-col gap-4", className)}
          style={style}
          onSubmit={(e) => {
            e.preventDefault();
            setHasSubmitted(true);
            // T3.6 — fires unconditionally before validation runs.
            onSubmitAttempt?.({ formApi: handle });
            void form.handleSubmit(
              async (vals) => {
                await onSubmit({
                  values: vals as TValues,
                  formApi: handle,
                });
              },
              (errs) => {
                const flat = flattenRhfErrorsToRecord(errs);
                onSubmitError?.({
                  errors: flat,
                  formApi: handle,
                });
                onValidationChange?.({
                  isValid: false,
                  errors: flat,
                });
                // T2.2 — focus the first focusable invalid field in DOM
                // order (schema.fields order). Skip non-focusable types
                // (`computed` is `<output>`, `hidden`/`section`/`divider`
                // render no control); falling through to the next errored
                // field beats a silent no-op `setFocus` call.
                const focusTarget = schema.fields.find(
                  (f) =>
                    isValueField(f) &&
                    f.type !== "computed" &&
                    f.type !== "hidden" &&
                    flat[f.name] !== undefined,
                );
                if (focusTarget) {
                  try {
                    form.setFocus(focusTarget.name as never);
                  } catch {
                    // Fall through — non-registered name (rare; safer to
                    // skip than to throw out of a submit handler).
                  }
                }
              },
            )(e);
          }}
        >
          <ChangeBridge
            onChange={onChange ? debouncedChange : undefined}
            onValidationChange={onValidationChange}
          />

          {showSchemaHeader ? <FormHeader /> : null}

          {showSummary ? (
            <JsonFormErrorSummary strategy={summaryStrategy} />
          ) : null}

          <FieldList
            fields={schema.fields}
            registry={mergedRegistry}
            renderField={renderField}
            columns={columns}
            labelPosition={labelPosition}
          />

          {(submitButton !== false || resetButton) ? (
            <SubmitRow
              submitButton={submitButton}
              resetButton={resetButton}
            />
          ) : null}
        </form>
      </JsonFormProvider>
    </FormProvider>
  );
}

// ─── Change + validation bridge ──────────────────────────────────────────────

function ChangeBridge({
  onChange,
  onValidationChange,
}: {
  onChange?: (vals: Record<string, unknown>) => void;
  onValidationChange?: (args: {
    isValid: boolean;
    errors: Record<string, string>;
  }) => void;
}) {
  const values = useWatch();
  const { isValid, errors } = useFormState();
  const rendered = useRef(0);
  const lastValuesKey = useRef<string | null>(null);
  const lastValidity = useRef<{ isValid: boolean; errorKey: string } | null>(null);

  useEffect(() => {
    // Skip first synthetic emit (initial mount) so we don't fire onChange
    // before the user has touched anything.
    if (rendered.current === 0) {
      rendered.current++;
      lastValuesKey.current = stableStringify(values);
      return;
    }
    // Structural-equality guard breaks the controlled-mode echo loop: when
    // a consumer pipes `onChange` back through the `values` prop, RHF
    // re-runs `useWatch` and produces a new reference for the same payload.
    // Without this guard the debounced fire-out would still leak, defeating
    // defense #2 of the controlled-mode three-defenses pattern.
    const next = stableStringify(values);
    if (next === lastValuesKey.current) return;
    lastValuesKey.current = next;
    onChange?.((values ?? {}) as Record<string, unknown>);
  }, [values, onChange]);

  useEffect(() => {
    if (!onValidationChange) return;
    const flat = flattenRhfErrorsToRecord(errors as Record<string, unknown>);
    const errorKey = `${Object.keys(flat).length}:${Object.keys(flat).join(",")}`;
    const last = lastValidity.current;
    if (last && last.isValid === isValid && last.errorKey === errorKey) return;
    lastValidity.current = { isValid, errorKey };
    onValidationChange({ isValid, errors: flat });
  }, [isValid, errors, onValidationChange]);

  return null;
}

// ─── Field-list layout (sections / dividers / rows) ──────────────────────────

interface FieldListProps {
  fields: ReadonlyArray<FieldDefinition>;
  registry: Record<string, FieldRenderer>;
  renderField?: (args: {
    field: FieldDefinition;
    defaultRender: () => ReactNode;
  }) => ReactNode;
  columns: 1 | 2;
  labelPosition: "top" | "left";
}

function FieldList({
  fields,
  registry,
  renderField,
  columns,
  labelPosition,
}: FieldListProps) {
  const gridClass =
    columns === 2 ? "grid grid-cols-1 gap-4 md:grid-cols-2" : "flex flex-col gap-4";

  // Walk fields linearly. Section/divider are inline siblings — they break the
  // grid rhythm (full-width) but don't introduce nested DOM groups, keeping
  // the layout simple for v0.1.0.
  return (
    <div className={gridClass}>
      {fields.map((field) => {
        if (field.type === "section") {
          return (
            <section
              key={field.name}
              data-jsonform-section={field.name}
              className={cn("col-span-full mt-2 flex flex-col gap-1", columns === 2 && "md:col-span-2")}
            >
              {field.label ? (
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {field.label}
                </h3>
              ) : null}
              {field.description ? (
                <p className="text-xs text-muted-foreground">
                  {field.description}
                </p>
              ) : null}
            </section>
          );
        }

        if (field.type === "divider") {
          return (
            <div
              key={field.name}
              data-jsonform-divider={field.name}
              className={cn("col-span-full", columns === 2 && "md:col-span-2")}
            >
              <Separator />
            </div>
          );
        }

        const renderer = registry[field.type] ?? registry["__fallback__"] ?? FieldFallback;
        const defaultRender = () => (
          <FieldWrapper
            field={field}
            renderer={renderer}
            formLabelPosition={labelPosition}
          />
        );

        return (
          <Fragment key={field.name}>
            {renderField
              ? renderField({ field, defaultRender })
              : defaultRender()}
          </Fragment>
        );
      })}
    </div>
  );
}

// ─── Submit row ──────────────────────────────────────────────────────────────

function SubmitRow({
  submitButton,
  resetButton,
}: {
  submitButton: JsonFormProps["submitButton"];
  resetButton: JsonFormProps["resetButton"];
}) {
  if (typeof submitButton === "function") {
    return (
      <SubmitFunctionRow render={submitButton} resetButton={resetButton} />
    );
  }

  const cfg = submitButton ?? {};
  const align = (cfg && typeof cfg === "object" ? cfg.align : "right") ?? "right";
  const alignClass =
    align === "left"
      ? "justify-start"
      : align === "center"
        ? "justify-center"
        : "justify-end";

  return (
    <div className={cn("flex items-center gap-2 pt-1", alignClass)}>
      {resetButton ? (
        <JsonFormResetButton
          label={resetButton.label}
          variant={resetButton.variant}
        />
      ) : null}
      {submitButton !== false ? (
        <JsonFormSubmitButton
          label={cfg && typeof cfg === "object" ? cfg.label : undefined}
          variant={cfg && typeof cfg === "object" ? cfg.variant : undefined}
          disableWhenInvalid={
            cfg && typeof cfg === "object"
              ? cfg.disableWhenInvalid
              : undefined
          }
        />
      ) : null}
    </div>
  );
}

function SubmitFunctionRow({
  render,
  resetButton,
}: {
  render: Extract<
    JsonFormProps["submitButton"],
    (args: { isSubmitting: boolean; isValid: boolean }) => ReactNode
  >;
  resetButton: JsonFormProps["resetButton"];
}) {
  // Read isSubmitting / isValid via context-aware atoms.
  return (
    <div className="flex items-center justify-end gap-2 pt-1">
      {resetButton ? (
        <JsonFormResetButton
          label={resetButton.label}
          variant={resetButton.variant}
        />
      ) : null}
      <SubmitRenderProxy render={render} />
    </div>
  );
}

function SubmitRenderProxy({
  render,
}: {
  render: (args: { isSubmitting: boolean; isValid: boolean }) => ReactNode;
}) {
  const ctx = useJsonFormContext();
  return (
    <>
      {render({
        isSubmitting: ctx.rhf.formState.isSubmitting,
        isValid: ctx.rhf.formState.isValid,
      })}
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Key-sorted JSON stringify so `{ a: 1, b: 2 }` and `{ b: 2, a: 1 }` hash to
 * the same key. Used by `ChangeBridge` to detect echo-loop re-emissions of a
 * structurally-identical values bag.
 */
function stableStringify(input: unknown): string {
  if (input === null || typeof input !== "object") return JSON.stringify(input);
  if (Array.isArray(input)) return `[${input.map(stableStringify).join(",")}]`;
  const keys = Object.keys(input as Record<string, unknown>).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify((input as Record<string, unknown>)[k])}`)
    .join(",")}}`;
}

// ─── Tail type re-exports (cross-procomp consumers) ──────────────────────────
// Procomps that compose json-form must import these types from THIS component-
// file path, not `./types`: the shadcn path rewriter preserves the component-
// file path but mangles `/types` cross-procomp imports (F-S1).
export type {
  FormSchema,
  Condition,
  ConditionOrFn,
  FieldDefinition,
  FieldOptionsResolver,
  FieldRenderer,
  JsonFormHandle,
  FieldConfig,
} from "./types";
