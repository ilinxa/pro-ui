"use client";

import { Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StoryComposer01Labels } from "../types";

export interface ComposerPublishBarProps {
  isPublishing: boolean;
  canPublish: boolean;
  labels: Required<StoryComposer01Labels>;
  onPublish: () => void;
  onClose: () => void;
  className?: string;
}

/**
 * Top bar — close (left) + publish CTA (right).
 *
 * Replaces the C3-era right-slot placeholder. Mounted by the parent only
 * when stage === "edit"; the capture stage keeps its own simple top bar.
 */
export function ComposerPublishBar({
  isPublishing,
  canPublish,
  labels,
  onPublish,
  onClose,
  className,
}: ComposerPublishBarProps) {
  return (
    <div
      className={cn(
        "absolute top-[max(0.75rem,env(safe-area-inset-top))] left-3 right-3 z-30 flex items-center justify-between",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        aria-label={labels.close}
        disabled={isPublishing}
        className="text-white hover:bg-white/10 hover:text-white"
      >
        <X className="size-5" />
      </Button>

      <Button
        type="button"
        onClick={onPublish}
        disabled={!canPublish || isPublishing}
        aria-busy={isPublishing}
        className={cn(
          "rounded-full bg-white text-black hover:bg-white/90 gap-1.5 px-4",
          "disabled:opacity-50",
        )}
      >
        {isPublishing ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>{labels.publishing}</span>
          </>
        ) : (
          <>
            <Send className="size-4" />
            <span>{labels.publish}</span>
          </>
        )}
      </Button>
    </div>
  );
}
