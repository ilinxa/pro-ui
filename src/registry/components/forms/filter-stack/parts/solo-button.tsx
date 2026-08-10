"use client";

import { Crosshair } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SoloButtonProps {
  optionLabel: string;
  onClick: () => void;
}

export function SoloButton({ optionLabel, onClick }: SoloButtonProps) {
  const ariaLabel = `Show only ${optionLabel}`;
  // No delayDuration — Radix-only prop; Base UI's TooltipProvider rejects it (F-cross-13).
  // No `asChild` either — the trigger IS the button (styled via buttonVariants).
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          type="button"
          aria-label={ariaLabel}
          onClick={onClick}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "size-6 p-0 text-muted-foreground/70 hover:text-foreground",
          )}
        >
          <Crosshair aria-hidden="true" className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent side="left">Solo: {optionLabel}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
