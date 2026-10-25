import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface ViewerShellProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  ariaLabel: string;
  className?: string;
  /**
   * The card lets its children overflow (the "outside" nav-arrow placement). The media stage
   * (`data-story-stage`) then clips to the rounded card itself.
   */
  overflowVisible?: boolean;
  /** Keydown on the dialog content (the viewer wraps Tab here when no layer is open). */
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
  children: React.ReactNode;
}

/**
 * Modal surface — owns the v0.1 CSS animation seam and the Radix
 * Dialog wiring. v0.4.1 — hardened mobile sizing: shadcn's DialogContent
 * ships `sm:max-w-sm` which caps width at 384px on viewports ≥640px,
 * overriding our `max-w-none`. We push the desktop break to `md:` and
 * explicitly clear the `sm:` caps with `sm:max-w-none sm:rounded-none`
 * so the modal stays truly full-screen across the entire mobile range.
 */
export function ViewerShell({
  isOpen,
  onOpenChange,
  ariaLabel,
  className,
  overflowVisible = false,
  onKeyDown,
  children,
}: ViewerShellProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  // Focus the dialog itself on open, not its first tabbable (the visually hidden "Previous
  // item" button, or a nav arrow on desktop). Both Radix and Base UI auto-focus inside the
  // dialog after it mounts, so this runs two frames later and takes over from that auto-focus
  // (nobody has moved focus by hand yet). Not `onOpenAutoFocus`: that prop is Radix-only
  // (F-cross-13). Close still returns focus to the opener (dialog default).
  useEffect(() => {
    if (!isOpen) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        const content = contentRef.current;
        if (!content) return;
        const active = document.activeElement;
        if (!active || active === document.body || content.contains(active)) {
          content.focus({ preventScroll: true });
        }
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [isOpen]);
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        aria-label={ariaLabel}
        aria-describedby={undefined}
        ref={contentRef}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={cn(
          // Reset shadcn defaults: no card chrome, no padding, no ring, no rounded.
          "block gap-0 bg-black p-0 text-media-overlay-foreground ring-0",
          overflowVisible ? "overflow-visible" : "overflow-hidden",
          // Mobile + intermediate (< md, i.e. < 768px): TRULY full screen.
          // `!` (Tailwind v4 important suffix) forces our utilities to win
          // over shadcn DialogContent's baked-in `max-w-[calc(100%-2rem)]`
          // and `sm:max-w-sm`. Without `!`, CSS cascade order determines
          // the winner — which on Turbopack/v4 builds shadcn wins, leaving
          // the modal floating at 384px wide with page chrome bleeding
          // through the dialog's `bg-black/10` overlay.
          "h-dvh! w-screen! max-w-none! rounded-none!",
          "sm:h-dvh! sm:w-screen! sm:max-w-none! sm:rounded-none!",
          // Desktop (md+): portrait modal centered. 0.6.0 (SV14): the card size comes from
          // `--story-viewer-card-w` / `--story-viewer-card-h` (defaults 400px / 700px, the 0.5.x
          // size) and never exceeds the window height. Set the variables on a wrapper, `:root`
          // or `contentClassName`. Same `!` strategy so md utilities cleanly win on desktop.
          "md:h-[var(--story-viewer-card-h,700px)]! md:w-[var(--story-viewer-card-w,400px)]! md:max-w-[var(--story-viewer-card-w,400px)]! md:max-h-[calc(100dvh-2rem)]! md:rounded-2xl!",
          // F-cross-13 — suppress the dialog's default close button across
          // both producer (Radix v4 with showCloseButton toggle) and consumer
          // (older Radix that always renders a direct-child button). The
          // default close button (in both backends) is rendered as a direct
          // `<button class="absolute …">` child positioned top-right; the
          // viewer ships its own close affordance inside ViewerHeader (which
          // is wrapped in a div, so this selector doesn't hit it).
          "[&>button.absolute:not([data-story-nav-arrow])]:hidden",
          className,
        )}
      >
        <DialogTitle className="sr-only">{ariaLabel}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
