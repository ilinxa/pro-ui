import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { UNREAD_RED } from "../lib/palette";

export interface UnreadCountProps {
  count: number;
  /** Aria label builder, e.g. (n) => `${n} unread notes`. */
  ariaLabel?: (n: number) => string;
  /** Handwriting font var to render the number in. Default chalk-red Kalam. */
  fontVar?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * The handwritten red unread marker — a chalk-red number, slightly rotated like
 * a teacher's tally. Pure + context-free. Renders nothing when `count` ≤ 0.
 */
export function UnreadCount({
  count,
  ariaLabel,
  fontVar = "--bb-font-kalam",
  onClick,
  className,
}: UnreadCountProps) {
  if (count <= 0) return null;
  const label = ariaLabel ? ariaLabel(count) : `${count} unread`;
  const style: CSSProperties = {
    color: UNREAD_RED,
    fontFamily: `var(${fontVar})`,
    textShadow: "0 0.5px 0.6px rgba(255,255,255,0.08)",
  };

  const content = (
    <span
      className="select-none text-2xl font-bold leading-none -rotate-6 tabular-nums"
      style={style}
    >
      {count > 99 ? "99+" : count}
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          "inline-flex cursor-pointer items-center rounded-md p-1 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
          className,
        )}
      >
        {content}
      </button>
    );
  }
  return (
    <span role="status" aria-label={label} className={cn("inline-flex items-center p-1", className)}>
      {content}
    </span>
  );
}
