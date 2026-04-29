"use client";

import { Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SoloButtonProps {
  optionLabel: string;
  onClick: () => void;
}

export function SoloButton({ optionLabel, onClick }: SoloButtonProps) {
  const ariaLabel = `Show only ${optionLabel}`;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={ariaLabel}
            onClick={onClick}
            className="size-6 p-0 text-muted-foreground/70 hover:text-foreground"
          >
            <Crosshair aria-hidden="true" className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Solo: {optionLabel}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
