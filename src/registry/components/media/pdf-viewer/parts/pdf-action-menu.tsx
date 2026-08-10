"use client";

import { Download, MoreVertical, Printer, RotateCw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { usePdfViewer } from "../hooks/use-pdf-viewer-context";

interface PdfActionMenuProps {
  /** Force compact mode (overflow). Default: respects viewer's `compact` flag. */
  compact?: boolean;
  className?: string;
}

export function PdfActionMenu({ compact, className }: PdfActionMenuProps) {
  const ctx = usePdfViewer();
  const { actions, labels, status, allowDownload, allowPrint } = ctx;
  const useCompact = compact ?? ctx.compact;
  const disabled = status !== "ready";

  // F-cross-13: no `asChild` — triggers render their own <button> in both
  // backends; Button look inlined via buttonVariants.
  if (useCompact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          type="button"
          disabled={disabled}
          aria-label={typeof labels.more === "string" ? labels.more : "More actions"}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            className,
          )}
        >
          <MoreVertical />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => actions.rotate()}>
            <RotateCw aria-hidden="true" />
            {labels.rotate}
          </DropdownMenuItem>
          {allowDownload ? (
            <DropdownMenuItem onSelect={() => actions.download()}>
              <Download aria-hidden="true" />
              {labels.download}
            </DropdownMenuItem>
          ) : null}
          {allowPrint ? (
            <DropdownMenuItem onSelect={() => actions.print()}>
              <Printer aria-hidden="true" />
              {labels.print}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <Tooltip>
        <TooltipTrigger
          type="button"
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          onClick={() => actions.rotate()}
          disabled={disabled}
          aria-label={typeof labels.rotate === "string" ? labels.rotate : "Rotate"}
        >
          <RotateCw />
        </TooltipTrigger>
        <TooltipContent>{labels.rotate}</TooltipContent>
      </Tooltip>
      {allowDownload ? (
        <Tooltip>
          <TooltipTrigger
            type="button"
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            onClick={() => actions.download()}
            disabled={disabled}
            aria-label={typeof labels.download === "string" ? labels.download : "Download"}
          >
            <Download />
          </TooltipTrigger>
          <TooltipContent>{labels.download}</TooltipContent>
        </Tooltip>
      ) : null}
      {allowPrint ? (
        <Tooltip>
          <TooltipTrigger
            type="button"
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            onClick={() => actions.print()}
            disabled={disabled}
            aria-label={typeof labels.print === "string" ? labels.print : "Print"}
          >
            <Printer />
          </TooltipTrigger>
          <TooltipContent>{labels.print}</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
