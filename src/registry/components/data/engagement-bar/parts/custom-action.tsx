"use client";

import { memo, useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  EngagementActionEvent,
  EngagementBarSize,
  EngagementBarVariant,
  EngagementCount,
} from "../types";
import { DISABLED_ACTION_CLASS, useActionName, touchTarget } from "../lib/action-name";

interface CustomActionProps {
  variant: EngagementBarVariant;
  id: string;
  label: string;
  icon: ReactNode;
  count: EngagementCount;
  active?: boolean;
  disabled?: boolean;
  onClick?: (event: EngagementActionEvent) => void;
  /** Disclosure state (0.7.0): rendered as aria-expanded; wins over `active`. */
  expanded?: boolean;
  /** aria-controls target, rendered only while `expanded === true`. */
  controls?: string;
  format: (n: number) => string;
  actionClassName?: string;
  size?: EngagementBarSize;
}

function CustomActionInner({
  variant,
  id,
  label,
  icon,
  count,
  active,
  disabled = false,
  onClick,
  expanded,
  controls,
  format,
  actionClassName,
  size,
}: CustomActionProps) {
  const hasCount = count !== null;
  const name = useActionName(hasCount);
  const stacked = variant === "stacked";
  const handleClick = (event: EngagementActionEvent) => {
    if (disabled) return;
    onClick?.(event);
  };

  // `expanded` wins over `active`: a button is not both a toggle and a disclosure. Dev-only, once per mount.
  const conflict = expanded !== undefined && active === true;
  const warnedRef = useRef(false);
  useEffect(() => {
    if (!conflict || warnedRef.current || process.env.NODE_ENV === "production") return;
    warnedRef.current = true;
    console.warn(
      `[EngagementBar] custom action "${id}" has both 'active' and 'expanded'; 'expanded' wins (aria-expanded, no aria-pressed).`,
    );
  }, [conflict, id]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-labelledby={name.labelledBy}
      aria-pressed={expanded === undefined && active ? true : undefined}
      aria-expanded={expanded}
      aria-controls={expanded === true ? controls : undefined}
      aria-disabled={disabled || undefined}
      onClick={handleClick}
      className={cn(
        stacked
          ? "flex h-auto flex-col items-center gap-0.5 px-2 py-1"
          : hasCount
            ? "gap-2 px-2"
            : "px-2",
        active && "text-primary",
        touchTarget(size),
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
