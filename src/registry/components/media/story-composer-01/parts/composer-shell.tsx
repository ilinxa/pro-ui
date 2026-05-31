"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface ComposerShellProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** "auto" picks fullscreen <md, modal >=md. */
  presentation?: "auto" | "fullscreen" | "modal";
  /** Hex/CSS color for the canvas surface. Default near-black. */
  background?: string;
  /** Accessible label, fed into a visually-hidden DialogTitle. */
  ariaLabel: string;
  children: ReactNode;
}

/**
 * Mobile-fullscreen / desktop-modal Dialog wrapper.
 *
 * Overrides shadcn's default `sm:max-w-sm` + padding + rounded-xl with `!`-suffixed
 * utilities (the v0.4.1 story-viewer-01 mobile-fullscreen fix pattern) so the
 * composer is full-bleed on mobile and a true 9:16 portrait modal on desktop.
 */
export function ComposerShell({
  isOpen,
  onOpenChange,
  presentation = "auto",
  background = "#000",
  ariaLabel,
  children,
}: ComposerShellProps) {
  const isFullscreenAlways = presentation === "fullscreen";
  const isModalAlways = presentation === "modal";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        // Beat shadcn's `sm:max-w-sm` + p-4 + gap-4 + rounded-xl + bg-popover with `!`.
        className={cn(
          // Reset
          "!gap-0 !p-0 !bg-transparent !ring-0",
          // Sizing
          isFullscreenAlways
            ? "!fixed !inset-0 !top-0 !left-0 !w-screen !h-[100dvh] !translate-x-0 !translate-y-0 !max-w-none !rounded-none"
            : isModalAlways
              ? "!w-100 !h-[44.4375rem] !max-w-none !rounded-2xl !overflow-hidden"
              : // "auto": full-screen <md, 400×711 9:16 modal >=md
                "!fixed !inset-0 !top-0 !left-0 !w-screen !h-[100dvh] !translate-x-0 !translate-y-0 !max-w-none !rounded-none md:!fixed md:!inset-auto md:!top-1/2 md:!left-1/2 md:!w-100 md:!h-[44.4375rem] md:!-translate-x-1/2 md:!-translate-y-1/2 md:!rounded-2xl md:!overflow-hidden",
          // Content surface
          "flex flex-col text-white",
        )}
        style={{ background }}
      >
        <DialogTitle className="sr-only">{ariaLabel}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
