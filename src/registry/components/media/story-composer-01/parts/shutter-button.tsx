"use client";

import { cn } from "@/lib/utils";

export interface ShutterButtonProps {
  /** Photo: simple tap. Video / record-ring behavior lands in C5. */
  onPress: () => void;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
}

/**
 * C4 shutter — round white button, center-bottom of capture surface.
 *
 * C5 will add long-press hold + tap-to-toggle for video, plus a ring
 * that fills around the button as the recording duration progresses.
 */
export function ShutterButton({
  onPress,
  disabled = false,
  ariaLabel,
  className,
}: ShutterButtonProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "size-[68px] rounded-full bg-white text-black",
        "ring-4 ring-white/30 ring-offset-2 ring-offset-transparent",
        "transition-transform active:scale-95",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-white",
        className,
      )}
    >
      <span className="sr-only">{ariaLabel}</span>
    </button>
  );
}
