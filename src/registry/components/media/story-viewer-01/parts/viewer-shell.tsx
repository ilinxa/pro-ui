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
          // Mobile + intermediate (< md, i.e. < 768px): TRULY full screen.
          // `!` (Tailwind v4 important suffix) forces our utilities to win
          // over shadcn DialogContent's baked-in `max-w-[calc(100%-2rem)]`
          // and `sm:max-w-sm`. Without `!`, CSS cascade order determines
          // the winner — which on Turbopack/v4 builds shadcn wins, leaving
          // the modal floating at 384px wide with page chrome bleeding
          // through the dialog's `bg-black/10` overlay.
          "h-dvh! w-screen! max-w-none! rounded-none!",
          "sm:h-dvh! sm:w-screen! sm:max-w-none! sm:rounded-none!",
          // Desktop (md+): portrait modal centered (kasder-exact 400×700).
          // Same `!` strategy so md utilities cleanly win on desktop.
          "md:h-175! md:w-100! md:max-w-100! md:rounded-2xl!",
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
