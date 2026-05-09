"use client";

import { ChevronDown, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  PDF_VIEWER_MAX_SCALE,
  PDF_VIEWER_MIN_SCALE,
} from "../lib/clamp-scale";
import { usePdfViewer } from "../hooks/use-pdf-viewer-context";

const PRESETS: number[] = [0.5, 0.75, 1, 1.25, 1.5, 2];

interface PdfZoomControlsProps {
  className?: string;
}

export function PdfZoomControls({ className }: PdfZoomControlsProps) {
  const { scale, fitMode, actions, labels, status } = usePdfViewer();
  const disabled = status !== "ready";

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => actions.zoomOut()}
            disabled={disabled || scale <= PDF_VIEWER_MIN_SCALE + 1e-3}
            aria-label={typeof labels.zoomOut === "string" ? labels.zoomOut : "Zoom out"}
          >
            <Minus />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{labels.zoomOut}</TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="min-w-[4.5rem] gap-1 font-mono tabular-nums"
          >
            {fitMode === "fit-width"
              ? labels.fitWidth
              : fitMode === "fit-page"
                ? labels.fitPage
                : labels.scalePercent(scale)}
            <ChevronDown className="size-3 opacity-60" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="min-w-36">
          <DropdownMenuItem onSelect={() => actions.setScale("fit-width")}>
            {labels.fitWidth}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => actions.setScale("fit-page")}>
            {labels.fitPage}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset}
              onSelect={() => actions.setScale(preset)}
              className="font-mono tabular-nums"
            >
              {labels.scalePercent(preset)}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => actions.resetZoom()}>
            {labels.resetZoom}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => actions.zoomIn()}
            disabled={disabled || scale >= PDF_VIEWER_MAX_SCALE - 1e-3}
            aria-label={typeof labels.zoomIn === "string" ? labels.zoomIn : "Zoom in"}
          >
            <Plus />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{labels.zoomIn}</TooltipContent>
      </Tooltip>
    </div>
  );
}
