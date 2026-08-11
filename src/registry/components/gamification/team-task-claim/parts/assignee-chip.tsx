"use client";

import * as React from "react";
import { Check, UserRoundPlus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { initialsFor, resolveMember } from "../lib/members";
import type { AssigneeChipProps } from "../types";

/**
 * À-la-carte sub-part — the assignee chip (avatar + name) with a **neutral**
 * Release + a reassign picker. The no-penalty core (§6): Release is a
 * `variant="ghost"` muted action reading "Release" — **never** destructive/red,
 * **never** "Drop"/"Abandon", **never** a penalty glyph or motion. The prior
 * assignee is never named in a negative frame. A stale `assigneeId` (not in
 * `members`) degrades to id-initials, no crash. The picker is `popover` +
 * `command` (searchable, keyboard-nav, team-scoped) — `PopoverTrigger` is used
 * directly (no `asChild`) to stay clear of the Radix↔Base-UI divergence class.
 */
export function AssigneeChip({
  value,
  members,
  onAssigneeChange,
  readOnly = false,
  density = "comfortable",
  releaseLabel = "Release",
  reassignLabel = "Reassign…",
  className,
}: AssigneeChipProps) {
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const assigneeId = value.assigneeId;
  const member = resolveMember(assigneeId, members);
  const displayName = member?.displayName ?? assigneeId ?? "Unassigned";
  const interactive = !readOnly && typeof onAssigneeChange === "function";
  const compact = density === "compact";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex min-w-0 items-center gap-2">
        <Avatar size={compact ? "sm" : "default"}>
          {member?.avatarUrl ? (
            <AvatarImage src={member.avatarUrl} alt="" />
          ) : null}
          <AvatarFallback>
            {initialsFor(member, assigneeId ?? "?")}
          </AvatarFallback>
        </Avatar>
        <span
          title={displayName}
          className={cn(
            "truncate text-foreground",
            compact ? "max-w-24 text-xs" : "text-sm",
          )}
        >
          {/* SR-readable, neutral framing — never "X dropped this". */}
          <span className="sr-only">Assigned to </span>
          {displayName}
        </span>
      </div>

      {interactive ? (
        <div className="flex items-center gap-1">
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger
              aria-label={reassignLabel}
              title={reassignLabel}
              className={cn(
                "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground",
                "hover:bg-muted hover:text-foreground",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              )}
            >
              <UserRoundPlus className="size-4" aria-hidden />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-0">
              <Command>
                <CommandInput placeholder="Reassign to…" />
                <CommandList>
                  <CommandEmpty>No teammates to assign.</CommandEmpty>
                  <CommandGroup>
                    {members.map((m) => (
                      <CommandItem
                        key={m.id}
                        value={m.displayName}
                        onSelect={() => {
                          onAssigneeChange?.(m.id);
                          setPickerOpen(false);
                        }}
                      >
                        <Avatar size="sm">
                          {m.avatarUrl ? (
                            <AvatarImage src={m.avatarUrl} alt="" />
                          ) : null}
                          <AvatarFallback>
                            {initialsFor(m, m.id)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 truncate">{m.displayName}</span>
                        {m.id === assigneeId ? (
                          <Check className="size-4" aria-hidden />
                        ) : null}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Neutral, no-penalty release — folds into onAssigneeChange(undefined). */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => onAssigneeChange?.(undefined)}
          >
            {releaseLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
