"use client";

import * as React from "react";
import { Hand } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ClaimButtonProps } from "../types";

/**
 * À-la-carte sub-part — the "I'll take this" volunteer/claim action. Warm,
 * volitional, autonomy-flavored (D8). Capability-gated: no `onClaim` (or
 * `readOnly`) → renders nothing (no dead button). If there is no `memberId` to
 * claim as (no viewer supplied), the click is a guarded no-op — the button
 * still renders so the affordance is discoverable, but the host must supply a
 * subject (documented in the guide).
 */
export function ClaimButton({
  memberId,
  onClaim,
  label = "I'll take this",
  readOnly = false,
  density = "comfortable",
  className,
}: ClaimButtonProps) {
  if (readOnly || typeof onClaim !== "function") return null;

  const compact = density === "compact";

  return (
    <Button
      type="button"
      size={compact ? "icon" : "sm"}
      variant="default"
      aria-label={label}
      title={compact ? label : undefined}
      onClick={() => {
        if (memberId != null) onClaim(memberId);
      }}
      className={cn(compact && "size-8", className)}
    >
      <Hand aria-hidden />
      {compact ? null : label}
    </Button>
  );
}
