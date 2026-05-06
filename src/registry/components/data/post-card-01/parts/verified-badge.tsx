import { cn } from "@/lib/utils";

export interface VerifiedBadgeProps {
  className?: string;
  ariaLabel?: string;
}

export function VerifiedBadge({
  className,
  ariaLabel = "Verified account",
}: VerifiedBadgeProps) {
  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 fill-current text-primary", className)}
    >
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
  );
}
