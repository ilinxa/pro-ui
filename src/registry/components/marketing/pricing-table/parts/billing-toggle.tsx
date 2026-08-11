import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import type { BillingPeriod, ResolvedLabels, ResolvedTone } from "../types";

interface BillingToggleProps {
  billing: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
  labels: ResolvedLabels;
  toneClasses: ResolvedTone;
  className?: string;
}

const SEGMENTS: ReadonlyArray<BillingPeriod> = ["monthly", "annual"];

export function BillingToggle({
  billing,
  onChange,
  labels,
  toneClasses,
  className,
}: BillingToggleProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([null, null]);

  const focusSegment = (index: number) => {
    const next = (index + SEGMENTS.length) % SEGMENTS.length;
    const period = SEGMENTS[next];
    refs.current[next]?.focus();
    onChange(period);
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusSegment(index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusSegment(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusSegment(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusSegment(SEGMENTS.length - 1);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={labels.toggleGroupLabel}
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-muted/40 p-1 text-sm",
        className,
      )}
    >
      {SEGMENTS.map((period, index) => {
        const active = billing === period;
        const segmentLabel =
          period === "monthly" ? labels.monthlyLabel : labels.annualLabel;
        return (
          <button
            key={period}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(period)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "rounded-full px-4 py-1.5 font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? cn(toneClasses.toggleActiveBg, toneClasses.toggleActiveText)
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {segmentLabel}
          </button>
        );
      })}
    </div>
  );
}
