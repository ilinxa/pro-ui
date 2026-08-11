"use client";

import { Textarea } from "@/components/ui/textarea";

export interface BodySubstratePlaintextProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  labelledBy?: string;
  rows?: number;
}

/**
 * Plaintext body substrate — eager shadcn `<Textarea>`. The fallback when a
 * config's `bodySlot.substrate` is `"plaintext"` (e.g. the post config). No
 * Plate bundle cost.
 */
export function BodySubstratePlaintext({
  value,
  onChange,
  placeholder,
  labelledBy,
  rows = 8,
}: BodySubstratePlaintextProps) {
  return (
    <Textarea
      value={value}
      aria-labelledby={labelledBy}
      placeholder={placeholder ?? "Write…"}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className="resize-y"
    />
  );
}
