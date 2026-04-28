import { cn } from "@/lib/utils";

/**
 * Same-level (between-siblings) drop indicator: thin horizontal line at the drop position.
 */
export function BetweenDropIndicator({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "h-0.5 -my-px rounded-full transition-colors",
        active ? "bg-primary" : "bg-transparent",
        className,
      )}
    />
  );
}

/**
 * Cross-level (into-card) drop indicator: outline highlight on the target card.
 * Renders as a wrapper. The Card component conditionally applies it.
 */
export function IntoDropOutline({
  active,
  rejected,
  className,
}: {
  active: boolean;
  rejected?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 rounded-md ring-2 ring-offset-1 ring-offset-background transition-opacity",
        active ? "opacity-100" : "opacity-0",
        rejected ? "ring-destructive" : "ring-primary",
        className,
      )}
    />
  );
}
