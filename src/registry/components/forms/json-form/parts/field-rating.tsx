"use client";

import { useRef, type KeyboardEvent } from "react";
import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldRenderer } from "../types";

export const FieldRating: FieldRenderer = ({
  field,
  value,
  onChange,
  onBlur,
  disabled,
  ariaProps,
}) => {
  const stars = field.config?.rating?.stars ?? 5;
  const current = typeof value === "number" ? value : Number(value) || 0;
  const groupRef = useRef<HTMLDivElement | null>(null);

  function setValue(n: number) {
    onChange(Math.max(0, Math.min(stars, n)));
  }

  function handleKey(e: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      setValue(current + 1);
      return;
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      setValue(current - 1);
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setValue(1);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      setValue(stars);
      return;
    }
    const n = Number(e.key);
    if (Number.isFinite(n) && n >= 1 && n <= stars) {
      e.preventDefault();
      setValue(n);
    }
  }

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-labelledby={ariaProps.labelledBy}
      aria-required={ariaProps["aria-required"]}
      aria-invalid={ariaProps["aria-invalid"]}
      aria-disabled={ariaProps["aria-disabled"]}
      aria-describedby={ariaProps["aria-describedby"]}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKey}
      onBlur={onBlur}
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-md p-0.5 outline-none ring-ring/50 focus-visible:ring-3",
        disabled && "opacity-60",
      )}
    >
      {Array.from({ length: stars }, (_, i) => {
        const n = i + 1;
        const filled = n <= current;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === current}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            disabled={disabled}
            onClick={() => setValue(n)}
            tabIndex={-1}
            className={cn(
              "p-0.5 transition-colors",
              filled ? "text-primary" : "text-muted-foreground/40",
              !disabled && "hover:text-primary",
            )}
          >
            <StarIcon
              className="size-5"
              fill={filled ? "currentColor" : "none"}
            />
          </button>
        );
      })}
    </div>
  );
};

export default FieldRating;
