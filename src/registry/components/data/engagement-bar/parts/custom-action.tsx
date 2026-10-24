"use client";

import { memo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EngagementBarVariant, EngagementCount } from "../types";
import { DISABLED_ACTION_CLASS, useActionName } from "../lib/action-name";

interface CustomActionProps {
  variant: EngagementBarVariant;
  id: string;
  label: string;
  icon: ReactNode;
  count: EngagementCount;
  active?: boolean;
  disabled?: boolean;
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
  disabled = false,
  onClick,
  format,
  actionClassName,
}: CustomActionProps) {
  const hasCount = count !== null;
  const name = useActionName(hasCount);
  const stacked = variant === "stacked";
  const handleClick = () => {
    if (disabled) return;
    onClick?.();
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-labelledby={name.labelledBy}
      aria-pressed={active ? true : undefined}
      aria-disabled={disabled || undefined}
      onClick={handleClick}
      className={cn(
        stacked
          ? "flex h-auto flex-col items-center gap-0.5 px-2 py-1"
          : hasCount
            ? "gap-2 px-2"
            : "px-2",
        active && "text-primary",
        DISABLED_ACTION_CLASS,
        actionClassName,
      )}
    >
      {icon}
      <span id={name.labelId} className="sr-only">
        {label}
      </span>
      {hasCount ? (
        <span
          id={name.countId}
          className={cn("font-medium tabular-nums", stacked ? "text-xs" : "text-sm")}
        >
          {format(count)}
        </span>
      ) : null}
    </Button>
  );
}

export const CustomAction = memo(CustomActionInner);
CustomAction.displayName = "CustomAction";
