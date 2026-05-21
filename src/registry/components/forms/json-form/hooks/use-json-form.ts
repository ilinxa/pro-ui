"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  FormSchema,
  JsonFormHandle,
  JsonFormStrings,
  UseJsonFormOptions,
  UseJsonFormReturn,
} from "../types";
import { compileStructural, injectStrings } from "../lib/schema-compiler";
import { mergeStrings } from "../lib/strings";
import { validateSchemaDev } from "../lib/validate-schema";

/**
 * Headless factory hook. Builds the Zod schema, instantiates `useForm`
 * with the resolver, returns everything needed to render the form
 * yourself (or for `<JsonForm>` to render it for you).
 */
export function useJsonForm<TValues extends Record<string, unknown> = Record<string, unknown>>(
  schema: FormSchema,
  options: UseJsonFormOptions<TValues> = {},
): UseJsonFormReturn<TValues> {
  const strings: JsonFormStrings = useMemo(() => mergeStrings(options.strings), [options.strings]);

  // Run dev-only schema sanity checks once per schema identity
  useMemo(() => {
    validateSchemaDev(schema);
  }, [schema]);

  // v0.1.7 (C1) — two-memo compile pipeline. The structural step (field-list
  // extraction + schema reference) caches on schema identity; the strings
  // injection (Zod chain construction + outer refinements) caches on the
  // structural + strings pair. Strings-only changes (locale switch, error
  // template overrides) skip the schema re-walk.
  const structural = useMemo(() => compileStructural(schema), [schema]);
  const zodSchema = useMemo(
    () => injectStrings(structural, strings),
    [structural, strings],
  );

  const defaultValues = useMemo(() => {
    return mergeDefaultValues<TValues>(schema, options.defaultValues);
  }, [schema, options.defaultValues]);

  const form = useForm<TValues>({
    // `zodSchema as never` bypasses zodResolver's overload matching.
    // The resolver has 4 overloads (v3/v4 × raw/non-raw); consumer-side
    // overload-resolution behavior depends on which sub-zod the bundler
    // picks for the resolver's `zod/v4/core` import, and that can vary
    // between producer and consumer trees even with identical pinned
    // versions (path-b smoke 2026-05-13 surfaced this). Casting the
    // argument removes the choice; runtime behavior is identical
    // (resolver dispatches at runtime via instanceof checks).
    resolver: zodResolver(zodSchema as never) as never,
    mode: options.validationMode ?? "onTouched",
    defaultValues: defaultValues as never,
    values: options.values as never,
  });

  const handle = useFormHandle(form);

  return {
    form,
    zodSchema,
    fieldList: schema.fields,
    isValid: form.formState.isValid,
    isSubmitting: form.formState.isSubmitting,
    handle,
  };
}

/**
 * Merge per-field `defaultValue` with form-level `defaultValues`.
 * Form-level wins on conflict (P-09 recommendation).
 */
function mergeDefaultValues<TValues extends Record<string, unknown>>(
  schema: FormSchema,
  formLevel: Partial<TValues> | undefined,
): Partial<TValues> {
  const out: Record<string, unknown> = {};
  for (const field of schema.fields) {
    if (field.defaultValue !== undefined) {
      // dot-path set
      const segments = field.name.split(".");
      let cur: Record<string, unknown> = out;
      for (let i = 0; i < segments.length - 1; i++) {
        const seg = segments[i];
        if (!(seg in cur) || typeof cur[seg] !== "object" || cur[seg] === null) {
          cur[seg] = {};
        }
        cur = cur[seg] as Record<string, unknown>;
      }
      cur[segments[segments.length - 1]] = field.defaultValue;
    }
  }
  // Form-level overrides per top-level key
  if (formLevel) {
    for (const key of Object.keys(formLevel)) {
      out[key] = (formLevel as Record<string, unknown>)[key];
    }
  }
  return out as Partial<TValues>;
}

/** Stable imperative-handle factory; methods read fresh RHF state per call. */
function useFormHandle<TValues extends Record<string, unknown>>(
  form: UseFormReturn<TValues>,
): JsonFormHandle<TValues> {
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const submit = useCallback(async () => {
    let result: { ok: boolean; values?: TValues; errors?: Record<string, string> } = { ok: false };
    await formRef.current.handleSubmit(
      (values) => {
        result = { ok: true, values: values as TValues };
      },
      (errors) => {
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(errors)) {
          if (v && typeof v === "object" && "message" in v) {
            flat[k] = String((v as { message?: unknown }).message ?? "");
          }
        }
        result = { ok: false, errors: flat };
      },
    )();
    return result;
  }, []);

  const reset = useCallback((values?: Partial<TValues>) => {
    formRef.current.reset(values as never);
  }, []);
  const setValue = useCallback((name: string, value: unknown) => {
    formRef.current.setValue(name as never, value as never);
  }, []);
  const getValue = useCallback((name: string) => {
    return formRef.current.getValues(name as never);
  }, []);
  const getValues = useCallback(() => formRef.current.getValues() as TValues, []);
  const setError = useCallback((name: string, message: string) => {
    formRef.current.setError(name as never, { message });
  }, []);
  const clearErrors = useCallback((name?: string) => {
    formRef.current.clearErrors(name as never);
  }, []);
  const trigger = useCallback((name?: string | string[]) => {
    return formRef.current.trigger(name as never);
  }, []);
  const focus = useCallback((name: string) => {
    formRef.current.setFocus(name as never);
  }, []);
  const isDirty = useCallback(() => formRef.current.formState.isDirty, []);
  const isValid = useCallback(() => formRef.current.formState.isValid, []);
  const isSubmitting = useCallback(() => formRef.current.formState.isSubmitting, []);

  return useMemo<JsonFormHandle<TValues>>(
    () => ({
      submit, reset, setValue, getValue, getValues,
      setError, clearErrors, trigger, focus,
      isDirty, isValid, isSubmitting,
    }),
    [submit, reset, setValue, getValue, getValues, setError, clearErrors, trigger, focus, isDirty, isValid, isSubmitting],
  );
}
