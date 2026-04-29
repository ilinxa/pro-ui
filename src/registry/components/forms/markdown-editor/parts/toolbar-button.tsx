import { Button } from "@/components/ui/button";
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

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={item.label}
          aria-pressed={item.isActive ? isActive : undefined}
          aria-keyshortcuts={item.shortcut}
          disabled={disabled}
          onClick={() => item.run(ctx)}
          className={cn(
            "text-muted-foreground hover:text-foreground",
            isActive && "bg-muted text-foreground",
          )}
        >
          {item.icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltipLabel}</TooltipContent>
    </Tooltip>
  );
}
