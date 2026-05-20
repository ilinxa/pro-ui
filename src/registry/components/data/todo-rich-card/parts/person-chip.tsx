"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { TodoPerson } from "../types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PersonChip({
  person,
  variant = "target",
  className,
}: {
  person: TodoPerson;
  variant?: "target" | "creator";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs",
        className,
      )}
    >
      <Avatar className="size-5">
        {person.avatar ? <AvatarImage src={person.avatar} alt={person.name} /> : null}
        <AvatarFallback className="text-[10px]">{initials(person.name)}</AvatarFallback>
      </Avatar>
      <span className="font-medium">{person.name}</span>
      {variant === "creator" ? (
        <span className="text-muted-foreground">(creator)</span>
      ) : null}
    </span>
  );
}
