import type { PermissionDenialReason } from "../types";
import { cn } from "@/lib/utils";

const REASON_MESSAGES: Record<PermissionDenialReason, string> = {
  "global-editable-false": "Editing is disabled (editable={false}).",
  "meta-locked": "Card is locked via meta (__rcmeta.locked=true).",
  "by-card": "Permissions denied for this card specifically.",
  "by-predefined-key": "Permissions denied for this content type.",
  "by-field-type": "Permissions denied for this field type.",
  "by-level": "Permissions denied at this depth.",
  default: "Permissions denied (default rule).",
  predicate: "Permissions denied (host predicate).",
};

export function PermissionDenialTooltip({
  reason,
  className,
}: {
  reason: PermissionDenialReason;
  className?: string;
}) {
  return (
    <span
      role="status"
      className={cn(
        "inline-block rounded-sm bg-muted/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground",
        className,
      )}
    >
      {REASON_MESSAGES[reason]}
    </span>
  );
}

export function permissionReasonText(reason: PermissionDenialReason): string {
  return REASON_MESSAGES[reason];
}
