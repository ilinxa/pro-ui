"use client";

import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import type {
  PropertiesFormHandle,
  PropertiesFormProps,
  SubmitResult,
} from "./types";
import { useFormReducer } from "./hooks/use-form-reducer";
import { useIdFactory } from "./hooks/use-id-factory";
import { useSubmitSpinner } from "./hooks/use-submit-spinner";
import { resolveFieldPermission } from "./lib/resolve-permission";
import {
  safeRunFormValidate,
  validateAllFields,
} from "./lib/validate";
import { ErrorSummary } from "./parts/error-summary";
import { FieldRow, type FocusTarget } from "./parts/field-row";
import { SubmitActions } from "./parts/submit-actions";
import { cn } from "@/lib/utils";

const SCHEMA_INSTABILITY_THRESHOLD = 5;

export function PropertiesForm<T extends Record<string, unknown> = Record<string, unknown>>(
  props: PropertiesFormProps<T>,
) {
  const {
    schema,
    values,
    mode = "read",
    onModeChange,
    onChange,
    onSubmit,
    onCancel,
    resolvePermission,
    validate,
    showSubmitActions = true,
    submitLabel = "Save",
    cancelLabel = "Cancel",
    ariaLabel,
    className,
    ref,
  } = props;

  const reactFormId = useId();
  const formElementId = `${reactFormId}-form`;

  const [state, dispatch] = useFormReducer(values);
  const getIds = useIdFactory();

  const valuesRef = useRef(values);
  const schemaRef = useRef(schema);
  const onChangeRef = useRef(onChange);
  const onSubmitRef = useRef(onSubmit);
  const validateRef = useRef(validate);
  const onCancelRef = useRef(onCancel);
  const onModeChangeRef = useRef(onModeChange);

  useEffect(() => {
    valuesRef.current = values;
    schemaRef.current = schema;
    onChangeRef.current = onChange;
    onSubmitRef.current = onSubmit;
    validateRef.current = validate;
    onCancelRef.current = onCancel;
    onModeChangeRef.current = onModeChange;
  });

  const submitIdRef = useRef(0);
  const focusTargetsRef = useRef<Map<string, FocusTarget>>(new Map());

  const registerFocusTarget = useCallback(
    (key: string, target: FocusTarget | null) => {
      if (target) focusTargetsRef.current.set(key, target);
      else focusTargetsRef.current.delete(key);
    },
    [],
  );

  const focusField = useCallback((key: string) => {
    const target = focusTargetsRef.current.get(key);
    const dev = process.env.NODE_ENV !== "production";
    if (!target) {
      if (!schemaRef.current.some((f) => f.key === key)) {
        if (dev) {
          console.error(
            `[properties-form] focusField("${key}") — unknown field key.`,
          );
        }
        return;
      }
      const field = schemaRef.current.find((f) => f.key === key);
      if (field) {
        const perm = resolveFieldPermission(
          field,
          valuesRef.current,
          resolvePermission as never,
        );
        if (perm === "hidden" && dev) {
          console.warn(
            `[properties-form] focusField("${key}") — field is hidden; no-op.`,
          );
        }
      }
      return;
    }
    target.focus();
  }, [resolvePermission]);

  const handleFieldChange = useCallback(
    (
      _key: string,
      nextValues: Record<string, unknown>,
      error: string | undefined,
    ) => {
      dispatch({
        type: "field-changed",
        key: _key,
        nextValues,
        error,
      });
      onChangeRef.current?.(nextValues as T);
    },
    [dispatch],
  );

  const handleFieldBlur = useCallback(
    (key: string, error: string | undefined) => {
      dispatch({ type: "field-blurred", key, error });
    },
    [dispatch],
  );

  const handleSpinnerShow = useCallback(() => {
    dispatch({ type: "submit-spinner-show" });
  }, [dispatch]);

  useSubmitSpinner(state.pending, handleSpinnerShow);

  const focusFirstErrorKey = useCallback(
    (errors: Record<string, string>) => {
      const firstKey = schemaRef.current.find((f) => errors[f.key])?.key;
      if (firstKey) focusField(firstKey);
    },
    [focusField],
  );

  const submit = useCallback(async (): Promise<SubmitResult> => {
    const submitId = ++submitIdRef.current;
    const currentValues = valuesRef.current;
    const fieldErrors = validateAllFields(schemaRef.current, currentValues);
    const formResult = safeRunFormValidate(validateRef.current, currentValues);
    const merged: Record<string, string> = { ...formResult.errors };
    for (const [k, v] of Object.entries(fieldErrors)) {
      merged[k] = v;
    }

    dispatch({ type: "submit-started" });

    if (Object.keys(merged).length > 0 || formResult.formError) {
      dispatch({
        type: "submit-failed",
        errors: merged,
        formError: formResult.formError,
      });
      focusFirstErrorKey(merged);
      return { ok: false, errors: merged };
    }

    const handler = onSubmitRef.current;
    if (!handler) {
      dispatch({
        type: "submit-succeeded",
        cleanSnapshot: currentValues,
      });
      return { ok: true };
    }

    try {
      const result = await handler(currentValues as T);
      if (submitId !== submitIdRef.current) {
        return result;
      }
      if (result.ok) {
        dispatch({
          type: "submit-succeeded",
          cleanSnapshot: valuesRef.current,
        });
      } else {
        const errors = result.errors ?? {};
        dispatch({
          type: "submit-failed",
          errors,
          formError: undefined,
        });
        focusFirstErrorKey(errors);
      }
      return result;
    } catch (err) {
      if (submitId !== submitIdRef.current) {
        return { ok: false };
      }
      const message =
        err instanceof Error ? err.message : "Unknown error";
      if (process.env.NODE_ENV !== "production") {
        console.error("[properties-form] onSubmit rejected:", err);
      }
      dispatch({
        type: "submit-failed",
        errors: {},
        formError: `Submit failed: ${message}`,
      });
      return { ok: false };
    }
  }, [dispatch, focusFirstErrorKey]);

  const handleSubmitEvent = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      void submit();
    },
    [submit],
  );

  const handleCancel = useCallback(() => {
    submitIdRef.current++;
    dispatch({ type: "reset", cleanSnapshot: state.cleanSnapshot });
    onChangeRef.current?.(state.cleanSnapshot as T);
    onCancelRef.current?.();
    onModeChangeRef.current?.("read");
  }, [dispatch, state.cleanSnapshot]);

  const reset = useCallback(() => {
    submitIdRef.current++;
    dispatch({ type: "reset", cleanSnapshot: state.cleanSnapshot });
    onChangeRef.current?.(state.cleanSnapshot as T);
  }, [dispatch, state.cleanSnapshot]);

  const markClean = useCallback(() => {
    dispatch({
      type: "mark-clean",
      cleanSnapshot: valuesRef.current,
    });
  }, [dispatch]);

  const isDirty = useCallback(
    () => state.version !== state.cleanVersion,
    [state.version, state.cleanVersion],
  );

  useImperativeHandle(
    ref,
    (): PropertiesFormHandle => ({
      isDirty,
      markClean,
      reset,
      focusField,
      submit,
    }),
    [isDirty, markClean, reset, focusField, submit],
  );

  const editWithoutOnChangeRef = useRef(false);
  useEffect(() => {
    if (mode === "edit" && !onChange) {
      if (!editWithoutOnChangeRef.current) {
        editWithoutOnChangeRef.current = true;
        if (process.env.NODE_ENV !== "production") {
          console.error(
            "[properties-form] mode=\"edit\" requires `onChange` — value commits will be no-ops.",
          );
        }
      }
    } else {
      editWithoutOnChangeRef.current = false;
    }
  }, [mode, onChange]);

  const schemaInstabilityRef = useRef({ last: schema, count: 0, warned: false });
  useEffect(() => {
    const tracker = schemaInstabilityRef.current;
    if (tracker.last === schema) {
      tracker.count = 0;
      return;
    }
    tracker.last = schema;
    tracker.count++;
    if (
      tracker.count > SCHEMA_INSTABILITY_THRESHOLD &&
      !tracker.warned &&
      process.env.NODE_ENV !== "production"
    ) {
      tracker.warned = true;
      console.warn(
        "[properties-form] `schema` prop is changing every render. " +
          "Wrap with `useMemo` or hoist to module scope to avoid memo invalidation.",
      );
    }
  }, [schema]);

  const visibleSchema = useMemo(
    () =>
      schema.filter((f) => {
        const perm = resolveFieldPermission(
          f,
          values,
          resolvePermission as never,
        );
        return perm !== "hidden";
      }),
    [schema, values, resolvePermission],
  );

  const errorVisibleFor = useCallback(
    (key: string): boolean =>
      state.submitAttempted || !!state.blurredWithError[key],
    [state.submitAttempted, state.blurredWithError],
  );

  return (
    <form
      id={formElementId}
      noValidate
      aria-label={ariaLabel}
      aria-busy={state.pending || undefined}
      onSubmit={handleSubmitEvent}
      className={cn("flex flex-col gap-4", className)}
    >
      {state.submitAttempted ? (
        <ErrorSummary
          schema={visibleSchema}
          errors={state.errors}
          formError={state.formError}
          onFocusField={focusField}
        />
      ) : null}
      <div className="flex flex-col gap-4">
        {visibleSchema.map((field) => (
          <FieldRow
            key={field.key}
            field={field}
            values={values}
            mode={mode}
            error={state.errors[field.key]}
            errorVisible={errorVisibleFor(field.key)}
            pending={state.pending}
            hostResolver={resolvePermission as never}
            ids={getIds(field.key)}
            onFieldChange={handleFieldChange}
            onFieldBlur={handleFieldBlur}
            registerFocusTarget={registerFocusTarget}
          />
        ))}
      </div>
      {showSubmitActions && mode === "edit" ? (
        <SubmitActions
          submitLabel={submitLabel}
          cancelLabel={cancelLabel}
          pending={state.pending}
          showSpinner={state.showSpinner}
          onCancel={handleCancel}
          canCancel={!state.pending}
        />
      ) : null}
    </form>
  );
}
