"use client";

import type { TodoPerson } from "../../todo-rich-card/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface TodoTreePersonLabelProps {
  person: TodoPerson;
  /** Default "right" puts the label on the row's right edge with avatar trailing. */
  layout?: "right" | "compact";
  className?: string;
}

/**
 * Avatar + name. `layout="compact"` drops the name text (avatar-only) for
 * narrow rows; the full name is preserved as a `title` so hover reveals it.
 */
export function TodoTreePersonLabel({
  person,
  layout = "right",
  className,
}: TodoTreePersonLabelProps) {
  const initials = computeInitials(person.name);
  return (
    <span
      title={person.name}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      {layout === "right" && (
        <span className="truncate max-w-[120px]">{person.name}</span>
      )}
      <Avatar className="size-5">
        {person.avatar && (
          <AvatarImage src={person.avatar} alt={person.name} />
        )}
        <AvatarFallback className="text-[10px] font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
    </span>
  );
}

function computeInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
