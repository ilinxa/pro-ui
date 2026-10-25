"use client";

import { Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ResolvedStoryComposerLabels } from "../types";

export interface ComposerPublishBarProps {
  isPublishing: boolean;
  canPublish: boolean;
  /**
   * Show the publish CTA. Defaults to true. The parent passes false during the
   * capture stage — nothing has been captured yet, so a disabled Publish button
   * just crowds the mode pill on narrow (9:16) widths.
   */
  showPublish?: boolean;
  /**
   * Show the close (X) button. Defaults to true. The parent passes false in the
   * edit stage when the editor renders its own Back arrow in the same corner —
   * Back replaces close (Instagram convention). Edit-only consumers with no
   * capture mode keep close, since there's no Back to fall back to.
   */
  showClose?: boolean;
  labels: ResolvedStoryComposerLabels;
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
  showPublish = true,
  showClose = true,
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
      {showClose ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label={labels.close}
          disabled={isPublishing}
          // Matches the editor's Back arrow (dark scrim circle) so the
          // top-left action looks identical across capture + edit stages.
          className="rounded-full bg-media-overlay text-media-overlay-foreground backdrop-blur hover:bg-media-overlay hover:text-media-overlay-foreground"
        >
          <X className="size-5" />
        </Button>
      ) : null}

      {showPublish ? (
        <Button
          type="button"
          onClick={onPublish}
          disabled={!canPublish || isPublishing}
          aria-busy={isPublishing}
          className={cn(
            // ms-auto keeps Publish pinned right even when the close button is
            // hidden (otherwise justify-between would pull a lone child left).
            "ms-auto rounded-full gap-1.5 px-4",
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
      ) : null}
    </div>
  );
}
