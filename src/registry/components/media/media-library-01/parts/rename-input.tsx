"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Inline rename / new-folder editor. Enter commits, Escape cancels, blur commits. */
export function RenameInput({
  initial,
  error,
  placeholder,
  onSubmit,
  onCancel,
  className,
}: {
  initial: string;
  error?: string | null;
  placeholder?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  className?: string;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  return (
    <Input
      ref={ref}
      value={value}
      placeholder={placeholder}
      aria-invalid={error ? true : undefined}
      aria-label={placeholder}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onSubmit(value);
        } else if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
        e.stopPropagation();
      }}
      onBlur={() => onSubmit(value)}
      className={cn("h-7 px-2 text-sm", error && "border-destructive", className)}
    />
  );
}
