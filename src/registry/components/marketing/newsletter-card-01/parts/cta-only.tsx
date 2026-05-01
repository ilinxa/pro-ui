import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ResolvedPartProps } from "../types";
import { resolveTone } from "./tone";
import { StatusMessage } from "./status-message";

/**
 * CTA-only variant — full-width Subscribe button without an email input.
 * For "click to open the signup flow elsewhere" patterns; consumer's
 * `onSubmit` typically opens a modal or navigates.
 *
 * onSubmit is called with an empty string ('') since no email is captured here.
 */
export function CtaOnlyPart({
  tone,
  headingAs,
  status,
  labels,
  onSubmit,
  className,
  buttonClassName,
  titleId,
  bodyId,
}: ResolvedPartProps) {
  const HeadingTag = headingAs;
  const toneClasses = resolveTone(tone);

  return (
    <div
      role="region"
      aria-labelledby={titleId}
      className={cn(
        "rounded-2xl border p-6",
        toneClasses.frame,
        className,
      )}
    >
      <HeadingTag
        id={titleId}
        className={cn("mb-2 font-serif text-lg font-bold", toneClasses.heading)}
      >
        {labels.title}
      </HeadingTag>
      <p id={bodyId} className="mb-4 text-sm text-muted-foreground">
        {labels.body}
      </p>

      <Button
        type="button"
        onClick={onSubmit}
        disabled={status === "pending"}
        aria-busy={status === "pending"}
        className={cn("w-full", buttonClassName)}
      >
        {labels.button}
      </Button>

      <StatusMessage status={status} labels={labels} />
    </div>
  );
}
