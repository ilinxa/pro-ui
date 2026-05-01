import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_ARIA, DEFAULT_ICONS } from "./icons";
import type { ShareTarget } from "../types";

export type CopyState = "idle" | "success" | "error";

interface ShareButtonProps {
  target: ShareTarget;
  state: CopyState;
  onClick: () => void;
  buttonClassName?: string;
  copyAriaLabel?: string;
}

export function ShareButton({
  target,
  state,
  onClick,
  buttonClassName,
  copyAriaLabel,
}: ShareButtonProps) {
  const isCopy = target.kind === "copy";
  const isCustom = target.kind === "custom";

  const Icon =
    isCopy && state === "success"
      ? Check
      : isCopy && state === "error"
        ? X
        : target.icon ??
          (isCustom ? null : DEFAULT_ICONS[target.kind]);

  const ariaLabel = isCustom
    ? target.ariaLabel
    : isCopy
      ? target.ariaLabel ?? copyAriaLabel ?? DEFAULT_ARIA.copy
      : target.ariaLabel ?? DEFAULT_ARIA[target.kind];

  return (
    <li>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={cn(
          "rounded-full",
          isCopy && state === "success" && "text-primary",
          isCopy && state === "error" && "text-destructive",
          buttonClassName
        )}
        title={ariaLabel}
        aria-label={ariaLabel}
        onClick={onClick}
      >
        {Icon ? <Icon className="w-4 h-4" /> : null}
      </Button>
    </li>
  );
}
