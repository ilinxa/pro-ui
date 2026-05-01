"use client";

import { memo, useCallback, useId, useMemo, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import { CtaOnlyPart } from "./parts/cta-only";
import { InlineFormPart } from "./parts/inline-form";
import {
  DEFAULT_LABELS,
  type NewsletterCardProps,
  type NewsletterCardStatus,
  type ResolvedPartProps,
} from "./types";

/**
 * NewsletterCard01 — brand-tinted CTA card with email signup.
 *
 * Two variants via the `variant` prop:
 * - `inline-form` (default) — email input + Subscribe button.
 * - `cta-only` — full-width button only; for "click to open signup flow" patterns.
 *
 * Form state can be controlled (`value` + `onChange`) or uncontrolled
 * (`defaultValue`). Status (`idle | pending | success | error`) can be
 * controlled (`status` prop) or auto-tracked from a Promise-returning
 * `onSubmit`. Fully i18n via the `labels` prop.
 */
function NewsletterCard01Impl(props: NewsletterCardProps) {
  const {
    variant = "inline-form",
    tone = "primary",
    headingAs = "h3",
    value: controlledValue,
    defaultValue = "",
    onChange,
    onSubmit,
    status: controlledStatus,
    onStatusChange,
    labels: labelsProp,
    className,
    buttonClassName,
    id: idProp,
  } = props;

  const generatedId = useId();
  const baseId = idProp ?? generatedId;
  const titleId = `${baseId}-title`;
  const bodyId = `${baseId}-body`;

  const labels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...labelsProp }),
    [labelsProp],
  );

  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const email = isControlled ? controlledValue : internalValue;

  const handleEmailChange = useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  const [internalStatus, setInternalStatus] = useState<NewsletterCardStatus>("idle");
  const status = controlledStatus ?? internalStatus;

  const setStatus = useCallback(
    (next: NewsletterCardStatus) => {
      if (controlledStatus === undefined) setInternalStatus(next);
      onStatusChange?.(next);
    },
    [controlledStatus, onStatusChange],
  );

  const handleSubmit = useCallback(
    (event: FormEvent | MouseEvent) => {
      event.preventDefault();
      if (status === "pending") return;
      if (!onSubmit) return;

      const result = onSubmit(email);

      if (result instanceof Promise) {
        setStatus("pending");
        result
          .then(() => setStatus("success"))
          .catch(() => setStatus("error"));
      }
    },
    [email, onSubmit, setStatus, status],
  );

  const partProps: ResolvedPartProps = {
    variant,
    tone,
    headingAs,
    email,
    onEmailChange: handleEmailChange,
    status,
    labels,
    onSubmit: handleSubmit,
    className,
    buttonClassName,
    titleId,
    bodyId,
  };

  if (variant === "cta-only") return <CtaOnlyPart {...partProps} />;
  return <InlineFormPart {...partProps} />;
}

export const NewsletterCard01 = memo(NewsletterCard01Impl);
NewsletterCard01.displayName = "NewsletterCard01";

export default NewsletterCard01;
