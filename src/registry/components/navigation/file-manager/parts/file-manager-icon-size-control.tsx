"use client";

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFileManager } from "../hooks/use-file-manager-context";
import type { FileManagerIconSize } from "../types";

export function FileManagerIconSizeControl() {
  const { actions, state, labels } = useFileManager();
  if (state.viewMode !== "grid") return null;

  const dotSize: Record<FileManagerIconSize, string> = {
    sm: "size-1.5",
    md: "size-2",
    lg: "size-2.5",
  };

  return (
    <ToggleGroup
      type="single"
      value={state.iconSize}
      onValueChange={(v) => {
        if (v === "sm" || v === "md" || v === "lg")
          actions.setIconSize(v);
      }}
      className="shrink-0"
    >
      {(["sm", "md", "lg"] as const).map((size) => {
        const label =
          size === "sm"
            ? labels.iconSizeSmall
            : size === "md"
              ? labels.iconSizeMedium
              : labels.iconSizeLarge;
        return (
          <Tooltip key={size}>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value={size}
                aria-label={label}
                className="size-7"
              >
                <span
                  className={`rounded-full bg-current ${dotSize[size]}`}
                  aria-hidden="true"
                />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </ToggleGroup>
  );
}
