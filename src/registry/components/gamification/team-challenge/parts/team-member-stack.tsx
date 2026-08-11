"use client";

import * as React from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { initialsFromName } from "../../_shared/gamification-kit";
import type { TeamMemberStackProps } from "../types";

/**
 * Tier C — dumb avatar pile of `team.members`: image with an initials fallback,
 * `max` (default 5) then a `+N` overflow chip. **Identity only** — this is the
 * ONLY member-level surface (system §6.3); it reinforces *shared goal*, never a
 * per-member progress/contribution display (no per-avatar checkmark/state). The
 * pile is one accessible label ("5 team members"), not N announcements; the
 * avatars themselves are decorative (`aria-hidden`).
 */
export function TeamMemberStack({
  members,
  max = 5,
  className,
}: TeamMemberStackProps) {
  if (members.length === 0) return null;

  const shown = members.slice(0, max);
  const overflow = members.length - shown.length;

  return (
    <div
      role="group"
      aria-label={`${members.length} team ${members.length === 1 ? "member" : "members"}`}
      className={cn("inline-flex", className)}
    >
      <AvatarGroup aria-hidden>
        {shown.map((member) => (
          <Avatar key={member.id}>
            {member.avatarUrl ? (
              <AvatarImage src={member.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback>{initialsFromName(member.displayName)}</AvatarFallback>
          </Avatar>
        ))}
        {overflow > 0 ? <AvatarGroupCount>+{overflow}</AvatarGroupCount> : null}
      </AvatarGroup>
    </div>
  );
}
