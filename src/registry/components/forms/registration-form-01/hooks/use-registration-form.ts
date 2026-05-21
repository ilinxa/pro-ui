"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  buildSchema,
  type SchemaLabels,
} from "../lib/build-schema";
import {
  HONEYPOT_RHF_KEY,
  isHoneypotTripped as computeHoneypotTripped,
} from "../lib/honeypot";
import type {
  OptionalFieldConfig,
  OptionalFieldName,
  RegistrationForm01Props,
  RegistrationFormStatus,
  RegistrationLabels,
  RegistrationStep1Values,
  RegistrationStep2Values,
  RegistrationSubmitPayload,
} from "../types";
import { useFormStep, type FormStep } from "./use-form-step";

const DEFAULT_POLICY = {
  minLength: 8,
  requireUppercase: false,
  requireNumber: false,
  requireSymbol: false,
};

export interface UseRegistrationFormArgs {
  flow: "single-step" | "two-step";
  passwordStrategy: "password" | "magic-link";
  skippableStepTwo: boolean;
  fields: Partial<Record<OptionalFieldName, OptionalFieldConfig>>;
  passwordPolicy: RegistrationForm01Props["passwordPolicy"];
  consent: RegistrationForm01Props["consent"];
  labels: RegistrationLabels;
  status?: RegistrationFormStatus;
  onStatusChange?: (status: RegistrationFormStatus) => void;
  onSubmit: (payload: RegistrationSubmitPayload) => void | Promise<void>;
}

export interface UseRegistrationFormReturn {
  form: UseFormReturn<RegistrationStep2Values>;
  status: RegistrationFormStatus;
  step: FormStep;
  /** Step1 → step2 (two-step). Returns whether the transition succeeded. */
  goNext: () => Promise<boolean>;
  /** Step2 → step1 (two-step). */
  goBack: () => void;
  /** Submit the form. Validates first; transitions status; calls onSubmit with the envelope. */
  submit: () => Promise<void>;
  /** Skip-for-now: submit with step-1 values only (`stepCompleted: "step1"`). Two-step + skippable only. */
  skip: () => Promise<void>;
}

/**
 * Substrate hook. Owns the RHF + Zod glue, the status state machine,
 * and the discriminated submit envelope assembly.
 *
 * **Mutual-exclusion contract (Q5 lock):** if `props.status` is provided,
 * the internal `setStatus` is a no-op for the internal state — the
 * component reads `props.status` as source of truth. `onStatusChange`
 * fires on every computed transition regardless (so observers can react
 * to "what the status WOULD be" in controlled mode).
 */
export function useRegistrationForm(
  args: UseRegistrationFormArgs,
): UseRegistrationFormReturn {
  const {
    flow,
    passwordStrategy,
    skippableStepTwo,
    fields,
    passwordPolicy: rawPolicy,
    consent,
    labels,
    status: controlledStatus,
    onStatusChange,
    onSubmit,
  } = args;

  const isControlled = controlledStatus !== undefined;
  const [internalStatus, setInternalStatus] =
    useState<RegistrationFormStatus>("idle");

  // The onStatusChange callback can change identity every render if the
  // consumer passes an inline arrow function. Stable ref keeps our
  // setStatus identity steady so memoized actions don't re-bind every
  // render.
  const onStatusChangeRef = useRef(onStatusChange);
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const setStatus = useCallback(
    (next: RegistrationFormStatus) => {
      if (!isControlled) setInternalStatus(next);
      onStatusChangeRef.current?.(next);
    },
    [isControlled],
  );

  const status: RegistrationFormStatus = isControlled
    ? controlledStatus!
    : internalStatus;

  // Normalize the password policy: shipped + un-shipped flags both
  // collapse to the same shape used by build-schema.
  const policy = useMemo(
    () => ({
      minLength: rawPolicy?.minLength ?? DEFAULT_POLICY.minLength,
      requireUppercase:
        rawPolicy?.requireUppercase ?? DEFAULT_POLICY.requireUppercase,
      requireNumber: rawPolicy?.requireNumber ?? DEFAULT_POLICY.requireNumber,
      requireSymbol: rawPolicy?.requireSymbol ?? DEFAULT_POLICY.requireSymbol,
    }),
    [
      rawPolicy?.minLength,
      rawPolicy?.requireUppercase,
      rawPolicy?.requireNumber,
      rawPolicy?.requireSymbol,
    ],
  );

  const schemaLabels = useMemo<SchemaLabels>(
    () => ({
      emailRequired: labels.emailRequired,
      emailInvalid: labels.emailInvalid,
      passwordRequired: labels.passwordRequired,
      passwordTooShort: labels.passwordTooShort,
      passwordMissingUppercase: labels.passwordMissingUppercase,
      passwordMissingNumber: labels.passwordMissingNumber,
      passwordMissingSymbol: labels.passwordMissingSymbol,
      consentRequired: labels.consentRequired,
    }),
    [
      labels.emailRequired,
      labels.emailInvalid,
      labels.passwordRequired,
      labels.passwordTooShort,
      labels.passwordMissingUppercase,
      labels.passwordMissingNumber,
      labels.passwordMissingSymbol,
      labels.consentRequired,
    ],
  );

  const schema = useMemo(
    () =>
      buildSchema({
        passwordStrategy,
        passwordPolicy: policy,
        fields,
        consent: { required: consent.required },
        labels: schemaLabels,
      }),
    [passwordStrategy, policy, fields, consent.required, schemaLabels],
  );

  const form = useForm<RegistrationStep2Values>({
    // The resolver-cast pattern matches json-form's
    // `use-json-form.ts` precedent (RHF / Zod overload disambiguation).
    resolver: zodResolver(schema as never) as never,
    mode: "onSubmit",
    defaultValues: {
      email: "",
      password: passwordStrategy === "password" ? "" : undefined,
      consentAccepted: false,
      [HONEYPOT_RHF_KEY]: "",
    } as RegistrationStep2Values,
  });

  const stepHook = useFormStep({
    enabled: flow === "two-step",
    form,
  });

  const submitInternal = useCallback(
    async (stepCompleted: "single" | "step1" | "step2") => {
      setStatus("submitting");
      try {
        // form.handleSubmit returns a function that runs validation +
        // either the valid handler or the invalid handler. We invoke it
        // inline so the `await onSubmit(...)` happens within the same
        // try/catch.
        let didFire = false;
        await new Promise<void>((resolve, reject) => {
          void form.handleSubmit(
            async (values) => {
              didFire = true;
              const honeypotValue =
                (values as unknown as Record<string, unknown>)[HONEYPOT_RHF_KEY] ?? "";
              const isHoneypotTripped = computeHoneypotTripped(
                String(honeypotValue),
              );
              const payload = buildPayload(
                stepCompleted,
                values,
                isHoneypotTripped,
              );
              try {
                await onSubmit(payload);
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            () => {
              // Invalid handler — validation failed. We don't transition
              // to "error" here (that's reserved for onSubmit-throws);
              // RHF surfaces the per-field errors via formState.
              resolve();
            },
          )();
          if (!didFire) {
            // Edge: handleSubmit may resolve synchronously when there's
            // no async work; the resolve() above covers that.
          }
        });
        if (didFire) setStatus("success");
        else setStatus("idle"); // validation failed; back to idle
      } catch {
        setStatus("error");
      }
    },
    [form, onSubmit, setStatus],
  );

  const submit = useCallback(async () => {
    const stepCompleted: "single" | "step2" =
      flow === "single-step" ? "single" : "step2";
    await submitInternal(stepCompleted);
  }, [flow, submitInternal]);

  const skip = useCallback(async () => {
    if (flow !== "two-step" || !skippableStepTwo) return;
    // Validate step-1 fields only.
    const ok = await form.trigger([
      "email",
      "password",
      "consentAccepted",
    ] as const);
    if (!ok) return;
    setStatus("submitting");
    try {
      const values = form.getValues();
      const honeypotValue =
        (values as unknown as Record<string, unknown>)[HONEYPOT_RHF_KEY] ?? "";
      const isHoneypotTripped = computeHoneypotTripped(String(honeypotValue));
      const step1Values: RegistrationStep1Values = {
        email: values.email,
        password: values.password,
        consentAccepted: values.consentAccepted,
        _honeypot: String(honeypotValue),
      };
      await onSubmit({
        stepCompleted: "step1",
        values: step1Values,
        isHoneypotTripped,
      });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, [flow, skippableStepTwo, form, onSubmit, setStatus]);

  return {
    form,
    status,
    step: stepHook.step,
    goNext: stepHook.goNext,
    goBack: stepHook.goBack,
    submit,
    skip,
  };
}

function buildPayload(
  stepCompleted: "single" | "step1" | "step2",
  values: RegistrationStep2Values,
  isHoneypotTripped: boolean,
): RegistrationSubmitPayload {
  if (stepCompleted === "step1") {
    return {
      stepCompleted: "step1",
      values: {
        email: values.email,
        password: values.password,
        consentAccepted: values.consentAccepted,
        _honeypot: values._honeypot,
      },
      isHoneypotTripped,
    };
  }
  return {
    stepCompleted,
    values,
    isHoneypotTripped,
  };
}
