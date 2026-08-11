"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PublishCtaArm } from "../lib/publish-cta";

export interface PublishBarProps {
  arms: PublishCtaArm[];
  onSaveDraft: () => void;
  onPublish: () => void;
  onSchedule: () => void;
  /** local datetime-local string ("" until picked) */
  scheduleValue: string;
  onScheduleValueChange: (value: string) => void;
}

/**
 * Renders the resolved publish arms (`config.publishModes` → buttons). When a
 * `schedule` arm is present, a `datetime-local` input precedes the buttons; the
 * schedule arm stays disabled until a future time is picked (resolved upstream
 * via `scheduleReady`).
 */
export function PublishBar({
  arms,
  onSaveDraft,
  onPublish,
  onSchedule,
  scheduleValue,
  onScheduleValueChange,
}: PublishBarProps) {
  const hasSchedule = arms.some((a) => a.mode === "schedule");
  const handlers: Record<PublishCtaArm["mode"], () => void> = {
    draft: onSaveDraft,
    publish: onPublish,
    schedule: onSchedule,
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {hasSchedule && (
        <Input
          type="datetime-local"
          aria-label="Schedule publish time"
          value={scheduleValue}
          onChange={(e) => onScheduleValueChange(e.target.value)}
          className="h-8 w-auto"
        />
      )}
      {arms.map((arm) => (
        <Button
          key={arm.mode}
          type="button"
          variant={arm.variant}
          disabled={arm.disabled}
          onClick={handlers[arm.mode]}
        >
          {arm.busy && <Loader2 className={cn("size-4 animate-spin")} />}
          {arm.label}
        </Button>
      ))}
    </div>
  );
}
