"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  PublishFields,
  ResolvedStoryComposerLabels,
  StoryComposerProps,
} from "../types";

export interface PublishDetailsStepProps {
  labels: ResolvedStoryComposerLabels;
  /** BCP-47 locale for the caption counter. Invalid tags fall back to "en". */
  locale?: string;
  /** `caption` prop config; the caption field renders only when set. */
  caption?: StoryComposerProps["caption"];
  value: PublishFields;
  onChange: (next: PublishFields) => void;
  /** Host fields (output of `renderPublishFields`). */
  children?: ReactNode;
  /** Publish enabled (caption rules AND the host's `canPublish`). */
  canPublish: boolean;
  /** Back to the editor. Also fired by Escape inside the step. */
  onBack: () => void;
  onPublish: () => void;
  className?: string;
}

/** First-focus candidates for a step without a caption field. */
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const numberFormats = new Map<string, Intl.NumberFormat>();

/** Cached decimal formatter; default "en" (SSR-deterministic), invalid tags fall back to "en". */
function numberFormat(locale: string | undefined): Intl.NumberFormat {
  const key = locale ?? "en";
  let fmt = numberFormats.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat(key);
    } catch {
      fmt = new Intl.NumberFormat("en");
    }
    numberFormats.set(key, fmt);
  }
  return fmt;
}

/**
 * The details step: caption + host fields + Back / Publish. Mounted through
 * media-editor's `overlay` prop, so it sits inside the editor surface (inside
 * the dialog content in dialog presentation). Escape inside the step is Back.
 */
export function PublishDetailsStep({
  labels,
  locale,
  caption,
  value,
  onChange,
  children,
  canPublish,
  onBack,
  onPublish,
  className,
}: PublishDetailsStepProps) {
  const captionId = useId();
  const titleId = useId();
  const counterId = useId();
  const reasonId = useId();
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [touched, setTouched] = useState(false);
  const text = typeof value.caption === "string" ? value.caption : "";
  const numbers = numberFormat(locale);

  const maxLength = caption?.maxLength;
  const tooLong = maxLength !== undefined && text.length > maxLength;
  const missing = Boolean(caption?.required) && text.trim().length === 0;
  const invalid = tooLong || (missing && touched);
  // Why Publish is disabled, when the caption is the reason.
  const reason = !canPublish
    ? tooLong
      ? labels.captionTooLong(numbers.format(maxLength ?? 0))
      : missing
        ? labels.captionRequired
        : null
    : null;

  useEffect(() => {
    // Caption first; without one, the first host field.
    const target =
      captionRef.current ??
      contentRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    target?.focus({ preventScroll: true });
  }, []);

  const describedBy =
    [maxLength !== undefined ? counterId : null, reason ? reasonId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    // No `defaultPrevented` check: a dialog's dismiss layer calls
    // preventDefault() on every Escape it sees, so the flag cannot tell a
    // host control's own use from the dialog's.
    if (e.key === "Escape") onBack();
  };

  return (
    <section
      aria-labelledby={titleId}
      onKeyDown={onKeyDown}
      className={cn(
        "absolute inset-0 z-40 flex flex-col gap-4 rounded-[inherit] bg-media-overlay px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] text-media-overlay-foreground backdrop-blur-md backdrop-brightness-40",
        className,
      )}
    >
      <h2 id={titleId} className="text-base font-medium">
        {labels.detailsTitle}
      </h2>

      <div
        ref={contentRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto"
      >
        {caption ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={captionId} className="text-sm font-medium">
              {labels.captionLabel}
            </label>
            <Textarea
              ref={captionRef}
              id={captionId}
              value={text}
              maxLength={caption.maxLength}
              required={caption.required}
              aria-required={caption.required ? true : undefined}
              aria-invalid={invalid ? true : undefined}
              aria-describedby={describedBy}
              placeholder={caption.placeholder ?? labels.captionPlaceholder}
              onChange={(e) => {
                setTouched(true);
                onChange({ ...value, caption: e.target.value });
              }}
              onBlur={() => setTouched(true)}
              className="min-h-24 border-media-overlay-foreground/30 text-media-overlay-foreground placeholder:text-media-overlay-foreground/70"
            />
            {maxLength !== undefined ? (
              <p
                id={counterId}
                className="text-end font-mono text-xs tabular-nums text-media-overlay-foreground/80"
              >
                {/* bdi isolates the "n / max" run so RTL pages don't reverse it */}
                <bdi dir="ltr">
                  {labels.captionCounter(
                    numbers.format(text.length),
                    numbers.format(maxLength),
                  )}
                </bdi>
              </p>
            ) : null}
          </div>
        ) : null}
        {children}
      </div>

      {reason ? (
        <p id={reasonId} className="text-sm text-media-overlay-foreground/80">
          {reason}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="text-media-overlay-foreground/80 hover:bg-media-overlay-foreground/10 hover:text-media-overlay-foreground"
        >
          {labels.detailsBack}
        </Button>
        <Button
          type="button"
          onClick={onPublish}
          disabled={!canPublish}
          aria-describedby={reason ? reasonId : undefined}
          className="gap-1.5 rounded-full px-4"
        >
          <Send className="size-4" />
          <span>{labels.publish}</span>
        </Button>
      </div>
    </section>
  );
}
