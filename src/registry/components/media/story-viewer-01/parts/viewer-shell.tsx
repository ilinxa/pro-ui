import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface ViewerShellProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  ariaLabel: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Modal surface — owns the v0.1 CSS animation seam and the Radix
 * Dialog wiring. v0.2 will swap pure CSS for framer-motion drag="y"
 * for swipe-to-dismiss; this is the single file that changes.
 */
export function ViewerShell({
  isOpen,
  onOpenChange,
  ariaLabel,
  className,
  children,
}: ViewerShellProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        aria-label={ariaLabel}
        aria-describedby={undefined}
        className={cn(
          // Reset shadcn defaults: no card chrome, no padding, no ring, no rounded.
          "block gap-0 overflow-hidden bg-black p-0 text-white ring-0",
          // Mobile: full screen.
          "h-dvh w-screen max-w-none rounded-none",
          // Desktop: portrait modal centered (kasder-exact 400×700).
          "md:h-175 md:w-100 md:max-w-100 md:rounded-2xl",
          // F-cross-13 — suppress the dialog's default close button across
          // both producer (Radix v4 with showCloseButton toggle) and consumer
          // (older Radix that always renders a direct-child button). The
          // default close button (in both backends) is rendered as a direct
          // `<button class="absolute …">` child positioned top-right; the
          // viewer ships its own close affordance inside ViewerHeader (which
          // is wrapped in a div, so this selector doesn't hit it).
          "[&>button.absolute]:hidden",
          className,
        )}
      >
        <DialogTitle className="sr-only">{ariaLabel}</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
