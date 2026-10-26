"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import type { CarouselComposerLabels, MediaCarouselItem } from "../types";

export interface AltFieldProps {
  /** The selected item; the field shows for images only. */
  item: MediaCarouselItem | null;
  maxLength: number;
  labels: Pick<CarouselComposerLabels, "altLabel" | "altPlaceholder" | "altCounter">;
  onChange: (id: string, alt: string) => void;
}

/** Alt-text input for the selected image, with a visible counter. */
export function AltField({ item, maxLength, labels, onChange }: AltFieldProps) {
  const id = useId();
  const counterId = `${id}-counter`;
  if (!item || item.kind !== "image") return null;
  const value = item.alt ?? "";
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-foreground">
        {labels.altLabel}
      </label>
      <Input
        id={id}
        value={value}
        maxLength={maxLength}
        aria-describedby={counterId}
        placeholder={labels.altPlaceholder}
        onChange={(e) => onChange(item.id, e.target.value.slice(0, maxLength))}
      />
      <span id={counterId} className="self-end text-xs text-muted-foreground">
        {labels.altCounter(value.length, maxLength)}
      </span>
    </div>
  );
}
