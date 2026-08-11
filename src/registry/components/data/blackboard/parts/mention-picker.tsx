"use client";

import { cn } from "@/lib/utils";
import type { BlackboardMember } from "../types";

export interface MentionPickerProps {
  members: BlackboardMember[];
  highlight: number;
  onHighlight: (i: number) => void;
  onSelect: (member: BlackboardMember) => void;
  className?: string;
}

/**
 * The `@`-mention candidate list. Dumb + context-free; rendered by the composer
 * (anchored to it, NOT a Popover primitive). Uses `onMouseDown` + preventDefault
 * so picking doesn't blur the textarea first.
 */
export function MentionPicker({
  members,
  highlight,
  onHighlight,
  onSelect,
  className,
}: MentionPickerProps) {
  if (members.length === 0) return null;
  return (
    <ul
      role="listbox"
      aria-label="Mention a teammate"
      className={cn(
        "max-h-48 w-56 overflow-auto rounded-lg border border-white/10 bg-[oklch(0.22_0.02_250)] p-1 shadow-xl",
        className,
      )}
    >
      {members.map((member, i) => {
        const active = i === highlight;
        return (
          <li
            key={member.id}
            role="option"
            aria-selected={active}
            onMouseEnter={() => onHighlight(i)}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(member);
            }}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/80",
              active ? "bg-white/12 text-white" : "hover:bg-white/8",
            )}
          >
            <span
              aria-hidden
              className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[0.65rem] font-medium uppercase text-white/70"
            >
              {member.name.charAt(0)}
            </span>
            <span className="truncate">{member.name}</span>
          </li>
        );
      })}
    </ul>
  );
}
