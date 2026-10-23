import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { TemplateLabels, TemplateProps } from "./types";

/** English defaults; consumers override any subset through `labels` (C2). */
export const defaultTemplateLabels: TemplateLabels = {
  itemCount: (count) => (count === 1 ? "1 item" : `${count} items`),
};

export function Template({
  title,
  description,
  count,
  labels: labelsInput,
  locale = "en",
  className,
}: TemplateProps) {
  // Merge over the defaults; `undefined` values never erase a default.
  const labels = useMemo<TemplateLabels>(() => {
    const merged = { ...defaultTemplateLabels };
    for (const [key, value] of Object.entries(labelsInput ?? {})) {
      if (value !== undefined) (merged as Record<string, unknown>)[key] = value;
    }
    return merged;
  }, [labelsInput]);
  // Formatters are created inside the component and memoised on the locale — never at
  // module scope, never with an `undefined` locale (C3).
  const formatCount = useMemo(() => new Intl.NumberFormat(locale || "en"), [locale]);

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card p-6 text-card-foreground",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold text-foreground">{title}</span>
        {description ? (
          <span className="text-sm text-muted-foreground">{description}</span>
        ) : null}
        {count != null ? (
          // The visible number is decorative; assistive tech reads the label sentence
          // (an aria-label on a role-less <span> is not reliably announced).
          <span className="text-sm tabular-nums">
            <span aria-hidden="true">{formatCount.format(count)}</span>
            <span className="sr-only">{labels.itemCount(count)}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
