"use client";

import { memo, useId, useMemo } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  DEFAULT_REGISTRATION_CARD_LABELS,
  type RegistrationCard01Labels,
  type RegistrationCard01Props,
  type RegistrationStatus,
} from "./types";
import { deriveRegistrationStatus } from "./lib/registration-status";
import { defaultFormatSpotsLeftSuffix } from "./lib/format-default";

function getCtaConfig(
  status: RegistrationStatus,
  hasOnRegister: boolean,
  labels: Required<RegistrationCard01Labels>,
): {
  label: string;
  variant: "default" | "secondary";
  disabled: boolean;
} {
  if (!hasOnRegister) {
    return {
      label: labels.ctaUnavailable,
      variant: "secondary",
      disabled: true,
    };
  }
  if (status === "full") {
    return { label: labels.ctaSoldOut, variant: "secondary", disabled: true };
  }
  if (status === "closed") {
    return { label: labels.ctaClosed, variant: "secondary", disabled: true };
  }
  return { label: labels.ctaRegister, variant: "default", disabled: false };
}

function RegistrationCard01Inner({
  capacity,
  registered,
  closed = false,
  statusOverride,
  lastSpotsRatio = 0.8,
  urgentSpotsCount = 10,
  formatSpotsLeftSuffix,
  heading,
  headingAs = "h3",
  framed = true,
  onRegister,
  onShare,
  actions,
  labels: labelsProp,
  className,
  headingClassName,
  barClassName,
  ctaClassName,
}: RegistrationCard01Props) {
  const headingId = useId();
  const HeadingTag = headingAs;

  const labels = useMemo<Required<RegistrationCard01Labels>>(
    () => ({ ...DEFAULT_REGISTRATION_CARD_LABELS, ...labelsProp }),
    [labelsProp],
  );

  const spotsLeftSuffixFormatter = useMemo<(count: number) => string>(() => {
    if (formatSpotsLeftSuffix) return formatSpotsLeftSuffix;
    if (labelsProp?.spotsLeftSuffix !== undefined) {
      const suffix = labelsProp.spotsLeftSuffix;
      return () => suffix;
    }
    return defaultFormatSpotsLeftSuffix;
  }, [formatSpotsLeftSuffix, labelsProp]);

  const status = useMemo<RegistrationStatus>(
    () =>
      statusOverride ??
      deriveRegistrationStatus({
        capacity,
        registered,
        closed,
        lastSpotsRatio,
      }),
    [statusOverride, capacity, registered, closed, lastSpotsRatio],
  );

  const hasQuota = capacity != null && registered != null;
  const spotsLeft = hasQuota ? Math.max(0, capacity - registered) : 0;
  const percent = hasQuota
    ? capacity === 0
      ? 100
      : Math.min(100, (registered / capacity) * 100)
    : 0;
  const isUrgent = hasQuota && spotsLeft > 0 && spotsLeft <= urgentSpotsCount;

  const cta = getCtaConfig(status, onRegister != null, labels);

  return (
    <section
      aria-labelledby={heading ? headingId : undefined}
      className={cn(
        framed &&
          "bg-card rounded-2xl p-6 border border-border/50 shadow-lg",
        className,
      )}
    >
      {heading && (
        <HeadingTag
          id={headingId}
          className={cn(
            "text-lg font-semibold text-foreground mb-4",
            headingClassName,
          )}
        >
          {heading}
        </HeadingTag>
      )}

      {hasQuota && (
        <div className={cn("mb-6", barClassName)}>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">{labels.capacityLabel}</span>
            <span
              className={cn(
                "font-medium",
                isUrgent ? "text-destructive" : "text-foreground",
              )}
            >
              {spotsLeft > 0
                ? `${spotsLeft} ${spotsLeftSuffixFormatter(spotsLeft)}`
                : labels.spotsLeftFull}
            </span>
          </div>
          <Progress
            value={percent}
            className="h-3"
            aria-label={labels.ariaLabel}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>
              {registered} {labels.registeredSuffix}
            </span>
            <span>
              {capacity} {labels.capacitySuffix}
            </span>
          </div>
        </div>
      )}

      <Button
        type="button"
        className={cn("w-full", ctaClassName)}
        size="lg"
        variant={cta.variant}
        disabled={cta.disabled}
        onClick={cta.disabled ? undefined : onRegister}
      >
        {cta.label}
      </Button>

      {actions ? (
        <div className="mt-3">{actions}</div>
      ) : onShare ? (
        <Button
          type="button"
          variant="outline"
          className="w-full mt-3 gap-2"
          onClick={onShare}
        >
          <Share2 aria-hidden="true" className="w-4 h-4" />
          {labels.ctaShare}
        </Button>
      ) : null}
    </section>
  );
}

const RegistrationCard01 = memo(RegistrationCard01Inner);
RegistrationCard01.displayName = "RegistrationCard01";

export { RegistrationCard01 };
export default RegistrationCard01;
