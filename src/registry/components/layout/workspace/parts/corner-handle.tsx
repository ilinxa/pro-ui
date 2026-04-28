"use client";

import { cn } from "@/lib/utils";

export type CornerPosition = "tl" | "tr" | "bl" | "br";

const POSITION_CLASSES: Record<CornerPosition, string> = {
  tl: "top-0 left-0 cursor-crosshair",
  tr: "top-0 right-0 cursor-crosshair",
  bl: "bottom-0 left-0 cursor-crosshair",
  br: "bottom-0 right-0 cursor-crosshair",
};

const PATTERN_CLASSES: Record<CornerPosition, string> = {
  tl: "[background:radial-gradient(currentColor_1px,transparent_1px)_0_0/4px_4px] [mask-image:linear-gradient(135deg,black,transparent_60%)]",
  tr: "[background:radial-gradient(currentColor_1px,transparent_1px)_0_0/4px_4px] [mask-image:linear-gradient(225deg,black,transparent_60%)]",
  bl: "[background:radial-gradient(currentColor_1px,transparent_1px)_0_0/4px_4px] [mask-image:linear-gradient(45deg,black,transparent_60%)]",
  br: "[background:radial-gradient(currentColor_1px,transparent_1px)_0_0/4px_4px] [mask-image:linear-gradient(315deg,black,transparent_60%)]",
};

export function CornerHandle({
  position,
  disabled,
  onPointerDown,
}: {
  position: CornerPosition;
  disabled?: boolean;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={-1}
      aria-label="Split or merge area"
      aria-disabled={disabled || undefined}
      onPointerDown={
        disabled
          ? undefined
          : (e) => {
              e.preventDefault();
              onPointerDown(e);
            }
      }
      className={cn(
        "absolute z-10 size-3.5 touch-none select-none text-muted-foreground/40 transition-colors hover:text-foreground/70",
        POSITION_CLASSES[position],
        PATTERN_CLASSES[position],
        disabled && "cursor-default opacity-30 hover:text-muted-foreground/40",
      )}
      data-corner={position}
    />
  );
}
