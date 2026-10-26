"use client";

import { useMemo, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { resolveLocale, toDate } from "../../comment-thread/lib/format-time";

export interface EditedSuffixProps {
  /** Visible label text (e.g. "(edited)"). */
  label: string;
  /** Exact edit timestamp — rendered as the `title` attribute for a hover tooltip. */
  editedAt: Date | string | number;
  /** BCP 47 locale of the tooltip. Default "en". */
  locale?: string;
  /** IANA time zone of the tooltip. Default: the runtime's (read after mount, so the server and the first client render agree). */
  timeZone?: string;
  className?: string;
}

const noopSubscribe = () => () => {};

function formatExact(
  input: Date | string | number,
  locale: string | undefined,
  timeZone: string | undefined,
): string | undefined {
  const date = toDate(input);
  if (Number.isNaN(date.getTime())) return undefined;
  try {
    return new Intl.DateTimeFormat(resolveLocale(locale), {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
    }).format(date);
  } catch {
    // An invalid `timeZone` falls back to the runtime's.
    return new Intl.DateTimeFormat(resolveLocale(locale), {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }
}

/**
 * Sealed "(edited)" suffix rendered inline with the post timestamp when `post.editedAt` is set.
 * The `title` attribute exposes the exact edit timestamp on hover (browser-native tooltip).
 */
export function EditedSuffix({ label, editedAt, locale, timeZone, className }: EditedSuffixProps) {
  // Without an explicit time zone the text depends on where the code runs, so it is left out of
  // the server render and the first client render.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const title = useMemo(
    () => (timeZone || mounted ? formatExact(editedAt, locale, timeZone) : undefined),
    [editedAt, locale, timeZone, mounted],
  );
  return (
    <span className={cn("shrink-0 text-muted-foreground", className)} title={title}>
      {label}
    </span>
  );
}

EditedSuffix.displayName = "EditedSuffix";
