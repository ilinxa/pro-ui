import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ValidationError } from "../lib/validate-edit";

export function InlineError({
  errors,
  className,
}: {
  errors: ValidationError[];
  className?: string;
}) {
  if (errors.length === 0) return null;
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "mt-1 inline-flex items-start gap-1.5 rounded-sm bg-destructive/10 px-1.5 py-0.5 text-[11px] text-destructive",
        className,
      )}
    >
      <AlertCircle className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
      <span>
        {errors.length === 1
          ? errors[0]?.message
          : errors.map((e) => e.message).join(" · ")}
      </span>
    </div>
  );
}
