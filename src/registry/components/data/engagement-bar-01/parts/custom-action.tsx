"use client";

import { memo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EngagementBar01Variant } from "../types";

interface CustomActionProps {
  variant: EngagementBar01Variant;
  id: string;
  label: string;
  icon: ReactNode;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  format: (n: number) => string;
  actionClassName?: string;
}

function CustomActionInner({
  variant,
  label,
  icon,
  count,
  active,
  onClick,
  format,
  actionClassName,
}: CustomActionProps) {
  const showCount = count !== undefined;

  if (variant === "stacked") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label={label}
        aria-pressed={active ? true : undefined}
        onClick={onClick}
        className={cn(
          "flex h-auto flex-col items-center gap-0.5 px-2 py-1",
          active && "text-primary",
          actionClassName,
        )}
      >
        {icon}
        {showCount ? (
          <span className="text-xs font-medium tabular-nums">
            {format(count)}
          </span>
        ) : null}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={label}
      aria-pressed={active ? true : undefined}
      onClick={onClick}
      className={cn(
        showCount ? "gap-2 px-2" : "px-2",
        active && "text-primary",
        actionClassName,
      )}
    >
      {icon}
      {showCount ? (
        <span className="text-sm font-medium tabular-nums">
          {format(count)}
        </span>
      ) : null}
    </Button>
  );
}

export const CustomAction = memo(CustomActionInner);
CustomAction.displayName = "CustomAction";
