"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClearButtonProps {
  onClick: () => void;
  ariaLabel: string;
  variant?: "icon" | "text";
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function ClearButton({
  onClick,
  ariaLabel,
  variant = "icon",
  label = "Clear all",
  disabled,
  className,
}: ClearButtonProps) {
  if (variant === "icon") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          "size-7 p-0 text-muted-foreground hover:text-foreground",
          className,
        )}
      >
        <X aria-hidden="true" className="size-3.5" />
      </Button>
    );
  }
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className={className}
    >
      <X aria-hidden="true" className="size-3" />
      {label}
    </Button>
  );
}
