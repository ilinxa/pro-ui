"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { usePdfViewer } from "../hooks/use-pdf-viewer-context";

interface PdfPageNavProps {
  className?: string;
}

export function PdfPageNav({ className }: PdfPageNavProps) {
  const { page, numPages, actions, labels, status } = usePdfViewer();
  const disabled = status !== "ready" || numPages === 0;

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => actions.goToPrevPage()}
            disabled={disabled || page <= 1}
            aria-label={typeof labels.prevPage === "string" ? labels.prevPage : "Previous page"}
          >
            <ChevronLeft />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{labels.prevPage}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => actions.goToNextPage()}
            disabled={disabled || page >= numPages}
            aria-label={typeof labels.nextPage === "string" ? labels.nextPage : "Next page"}
          >
            <ChevronRight />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{labels.nextPage}</TooltipContent>
      </Tooltip>
    </div>
  );
}
