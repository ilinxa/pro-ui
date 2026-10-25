import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_ICONS } from "./icons";
import type { ShareTarget } from "../types";

export type CopyState = "idle" | "success" | "error";

interface ShareButtonProps {
  target: ShareTarget;
  state: CopyState;
  /** Resolved accessible name (also the tooltip). */
  label: string;
  onClick: () => void;
  buttonClassName?: string;
}

export function ShareButton({
  target,
  state,
  label,
  onClick,
  buttonClassName,
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
        title={label}
        aria-label={label}
        disabled={target.disabled}
        onClick={onClick}
      >
        {Icon ? <Icon className="w-4 h-4" /> : null}
      </Button>
    </li>
  );
}
