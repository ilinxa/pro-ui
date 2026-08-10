"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useFileManager } from "../hooks/use-file-manager-context";
import type { FileManagerIconSize } from "../types";

/**
 * Plain-button segmented control. Deliberately NOT shadcn ToggleGroup — its
 * value model diverges between Radix (single: string) and Base UI (string[]),
 * an F-cross-13 carrier (calendar-01 v0.2.1 precedent; toggle-group dep
 * dropped). Each segment is the TooltipTrigger itself — no `asChild`, which
 * Base UI triggers reject.
 */
export function FileManagerIconSizeControl() {
  const { actions, state, labels } = useFileManager();
  if (state.viewMode !== "grid") return null;

  const dotSize: Record<FileManagerIconSize, string> = {
    sm: "size-1.5",
    md: "size-2",
    lg: "size-2.5",
  };

  return (
    <div role="group" className="flex shrink-0 items-center">
      {(["sm", "md", "lg"] as const).map((size) => {
        const label =
          size === "sm"
            ? labels.iconSizeSmall
            : size === "md"
              ? labels.iconSizeMedium
              : labels.iconSizeLarge;
        return (
          <Tooltip key={size}>
            <TooltipTrigger
              type="button"
              aria-pressed={state.iconSize === size}
              aria-label={label}
              onClick={() => actions.setIconSize(size)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "size-7 rounded-none first:rounded-l-lg last:rounded-r-lg",
                state.iconSize === size && "bg-muted",
              )}
            >
              <span
                className={`rounded-full bg-current ${dotSize[size]}`}
                aria-hidden="true"
              />
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
