import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ResolvedPartProps } from "../types";
import { resolveTone } from "./tone";
import { StatusMessage } from "./status-message";

/**
 * Inline-form variant — email input + Subscribe button in a row.
 * The default for sidebar / footer CTAs that capture email inline.
 */
export function InlineFormPart({
  tone,
  headingAs,
  email,
  onEmailChange,
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

      <form onSubmit={onSubmit} className="flex gap-2">
        <Input
          type="email"
          required
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder={labels.placeholder}
          aria-label={labels.emailLabel}
          aria-describedby={bodyId}
          aria-invalid={status === "error"}
          disabled={status === "pending"}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={status === "pending"}
          aria-busy={status === "pending"}
          className={buttonClassName}
        >
          {labels.button}
        </Button>
      </form>

      <StatusMessage status={status} labels={labels} />
    </div>
  );
}
