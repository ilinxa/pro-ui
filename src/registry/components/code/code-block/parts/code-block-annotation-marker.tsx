"use client";
import { CircleAlert, CircleX, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  CodeBlockAnnotation,
  CodeBlockAnnotationRenderArgs,
} from "../types";

interface CodeBlockAnnotationMarkerProps {
  annotation: CodeBlockAnnotation;
  renderAnnotation?: (args: CodeBlockAnnotationRenderArgs) => React.ReactNode;
}

const ICON_BY_TYPE = {
  info: Info,
  warn: CircleAlert,
  error: CircleX,
} as const;

const COLOR_BY_TYPE = {
  info: "text-blue-500 dark:text-blue-400",
  warn: "text-amber-500 dark:text-amber-400",
  error: "text-destructive",
} as const;

export function CodeBlockAnnotationMarker({
  annotation,
  renderAnnotation,
}: CodeBlockAnnotationMarkerProps) {
  const Icon = ICON_BY_TYPE[annotation.type];
  const colorClass = COLOR_BY_TYPE[annotation.type];

  const defaultMarker = (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex size-3.5 items-center justify-center align-middle outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring rounded",
            colorClass,
          )}
          aria-label={`${annotation.type}: ${annotation.message}`}
        >
          <Icon className="size-3.5" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs text-xs">
        {annotation.message}
      </TooltipContent>
    </Tooltip>
  );

  if (renderAnnotation) {
    return <>{renderAnnotation({ annotation, defaultMarker })}</>;
  }
  return defaultMarker;
}
