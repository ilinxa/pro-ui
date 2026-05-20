"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCardContext } from "../hooks/use-card-context";

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const { statusOptions } = useCardContext();

  if (!status) return null;

  const match = statusOptions?.find((o) => o.value === status);
  const label = match?.label ?? status;
  const variant = match?.variant ?? "secondary";

  return (
    <Badge variant={variant} className={cn("font-medium", className)} role="status">
      {label}
    </Badge>
  );
}
