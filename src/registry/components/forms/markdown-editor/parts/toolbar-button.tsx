import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ToolbarCtx, ToolbarItem } from "../types";

interface ToolbarButtonProps {
  item: ToolbarItem;
  ctx: ToolbarCtx;
  disabled?: boolean;
}

export function ToolbarButton({ item, ctx, disabled }: ToolbarButtonProps) {
  const isActive = item.isActive ? item.isActive(ctx) : false;
  const tooltipLabel = item.shortcut ? `${item.label} (${item.shortcut})` : item.label;

  // F-cross-13: no `asChild` — the trigger IS the toolbar button (buttonVariants styling).
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label={item.label}
        aria-pressed={item.isActive ? isActive : undefined}
        aria-keyshortcuts={item.shortcut}
        disabled={disabled}
        onClick={() => item.run?.(ctx)}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "text-muted-foreground hover:text-foreground",
          isActive && "bg-muted text-foreground",
        )}
      >
        {item.icon}
      </TooltipTrigger>
      <TooltipContent>{tooltipLabel}</TooltipContent>
    </Tooltip>
  );
}
