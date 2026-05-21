"use client";

import { useId, useMemo, type ReactElement } from "react";
import { FormProvider } from "react-hook-form";
import { cn } from "@/lib/utils";

import { useRegistrationForm } from "./hooks/use-registration-form";
import { mergeRegistrationLabels } from "./parts/labels";
import { EmailField } from "./parts/email-field";
import { PasswordField } from "./parts/password-field";
import { ConsentCheckbox } from "./parts/consent-checkbox";
import { HoneypotField } from "./parts/honeypot-field";
import { OptionalFieldsFieldset } from "./parts/optional-fields-fieldset";
import { StepIndicator } from "./parts/step-indicator";
import { StepShell } from "./parts/step-shell";
import { ServerError } from "./parts/server-error";
import { SuccessScreen } from "./parts/success-screen";
import { SubmitRow } from "./parts/submit-row";
import { SignInLink } from "./parts/sign-in-link";
import { OauthRow } from "./parts/oauth-row";
import { StrengthMeter } from "./parts/strength-meter";
import type { RegistrationForm01Props } from "./types";

import "./registration-form-01.css";

/**
 * Schema-driven sign-up surface — hand-rolled on RHF v7 + zod v4. Two
 * flow variants (single-step / two-step) × two password strategies
 * (password / magic-link) × two densities (compact / default) × optional
 * OAuth row + declarative optional-fields bag + off-screen honeypot.
 *
 * See `docs/procomps/registration-form-01-procomp/` for the GATE 1 +
 * GATE 2 contract and `usage.tsx` (C6) for the consumer guide. The
 * load-bearing public-API surfaces are:
 *
 * 1. The **discriminated submit payload**: `onSubmit` receives one of
 *    three envelope shapes (`stepCompleted: "single" | "step1" | "step2"`).
 *    Consumers MUST switch on the discriminant. Narrowing optional
 *    profile fields as `| undefined` was rejected because it silently
 *    lets naïve destructuring send `undefined` values to backend APIs.
 *
 * 2. The **status mutual-exclusion contract**: if `status` is provided,
 *    internal state is read-only — the component reads `status` as
 *    source of truth and fires `onStatusChange` for observers only.
 *    Mixing the two (passing `status` AND expecting internal
 *    transitions) is a contract violation.
 *
 * 3. The **honeypot two-key duality**: HTML `name="website"` (spam-bait)
 *    + RHF register key `_honeypot` (clean values shape). Off-screen
 *    rendering is load-bearing — `display: none` is bot-detectable.
 */
export function RegistrationForm01(props: RegistrationForm01Props): ReactElement {
  const {
    heading,
    subheading,
    headingAs: HeadingTag = "h2",
    flow = "single-step",
    passwordStrategy = "password",
    density = "default",
    skippableStepTwo = true,
    fields = {},
    passwordPolicy,
    strengthCalculator,
    consent,
    oauthProviders = [],
    oauthIcons,
    onOAuthClick,
    submitButton,
    signInHref,
    errorMessage,
    successMessage,
    status,
    onStatusChange,
    onSubmit,
    labels: labelsOverride,
    className,
    style,
  } = props;

  const headingId = useId();
  const labels = useMemo(
    () => mergeRegistrationLabels(labelsOverride),
    [labelsOverride],
  );

  const {
    form,
    status: effectiveStatus,
    step,
    goBack,
    submit,
    skip,
  } = useRegistrationForm({
    flow,
    passwordStrategy,
    skippableStepTwo,
    fields,
    passwordPolicy,
    consent,
    labels,
    status,
    onStatusChange,
    onSubmit,
  });

  const showStrengthMeter =
    passwordStrategy === "password" &&
    (passwordPolicy?.showStrengthMeter ?? true);
  const showPasswordField = passwordStrategy === "password";
  const showOptionalFields =
    flow === "single-step" ||
    (flow === "two-step" && step === "step2");
  const showStep1Fields =
    flow === "single-step" ||
    (flow === "two-step" && step === "step1");
  const isSubmitting = effectiveStatus === "submitting";
  const isSuccess = effectiveStatus === "success";
  const submitLabel =
    submitButton?.label ?? labels.createAccountLabel;

  if (isSuccess) {
    return (
      <section
        aria-labelledby={heading ? headingId : undefined}
        className={cn(
          "flex w-full flex-col gap-4",
          density === "compact" ? "max-w-sm" : "max-w-md",
          className,
        )}
        style={style}
      >
        {heading ? (
          <HeadingTag
            id={headingId}
            className="text-xl font-semibold text-foreground"
          >
            {heading}
          </HeadingTag>
        ) : null}
        <SuccessScreen
          message={successMessage ?? labels.successDefaultMessage}
        />
      </section>
    );
  }

  return (
    <section
      aria-labelledby={heading ? headingId : undefined}
      className={cn(
        "flex w-full flex-col",
        density === "compact" ? "max-w-sm gap-3" : "max-w-md gap-4",
        className,
      )}
      style={style}
    >
      {heading ? (
        <HeadingTag
          id={headingId}
          className={cn(
            "font-semibold text-foreground",
            density === "compact" ? "text-lg" : "text-xl",
          )}
        >
          {heading}
        </HeadingTag>
      ) : null}
      {subheading ? (
        <p className="-mt-2 text-sm text-muted-foreground">{subheading}</p>
      ) : null}

      {flow === "two-step" ? (
        <StepIndicator
          current={step === "step1" ? 1 : 2}
          total={2}
          labels={labels}
        />
      ) : null}

      {errorMessage ? <ServerError message={errorMessage} /> : null}

      <OauthRow
        providers={oauthProviders}
        icons={oauthIcons}
        labels={labels}
        disabled={isSubmitting}
        onClick={(provider) => onOAuthClick?.({ provider })}
      />

      <FormProvider {...form}>
        <form
          noValidate
          className={cn(
            "flex flex-col",
            density === "compact" ? "gap-3" : "gap-4",
          )}
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <StepShell step={step}>
            {showStep1Fields ? (
              <>
                <EmailField labels={labels} />
                {showPasswordField ? (
                  <PasswordField
                    labels={labels}
                    strengthMeter={
                      showStrengthMeter ? (
                        <StrengthMeter
                          calculator={strengthCalculator}
                          labels={labels}
                        />
                      ) : null
                    }
                  />
                ) : null}
                <ConsentCheckbox consent={consent} labels={labels} />
              </>
            ) : null}
            {showOptionalFields ? (
              <OptionalFieldsFieldset
                fields={fields}
                labels={labels}
                density={density}
              />
            ) : null}
          </StepShell>

          <HoneypotField labels={labels} />

          <SubmitRow
            status={effectiveStatus}
            flow={flow}
            step={step}
            skippableStepTwo={skippableStepTwo}
            submitLabel={submitLabel}
            submitVariant={submitButton?.variant}
            labels={labels}
            onBack={goBack}
            onSkip={() => void skip()}
          />
        </form>
      </FormProvider>

      {signInHref ? (
        <SignInLink href={signInHref} labels={labels} />
      ) : null}
    </section>
  );
}
