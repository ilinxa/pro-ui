import {
  Globe,
  Lock,
  MoreHorizontal,
  User,
  UserCheck,
  Users,
  Users2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostVisibility } from "../types";

export interface VisibilityBadgeLabels {
  visibilityPublic: string;
  visibilityFollowers: string;
  visibilityFriends: string;
  visibilityCircle: string;
  visibilityOnlyMe: string;
  visibilityPrivate: string;
  visibilityCustom: string;
}

export interface VisibilityBadgeProps {
  visibility: PostVisibility;
  labels: VisibilityBadgeLabels;
  className?: string;
}

const ICON_BY_VISIBILITY = {
  public: Globe,
  followers: Users,
  friends: UserCheck,
  circle: Users2,
  "only-me": User,
  private: Lock,
} as const;

const LABEL_KEY_BY_VISIBILITY = {
  public: "visibilityPublic",
  followers: "visibilityFollowers",
  friends: "visibilityFriends",
  circle: "visibilityCircle",
  "only-me": "visibilityOnlyMe",
  private: "visibilityPrivate",
} as const satisfies Record<
  keyof typeof ICON_BY_VISIBILITY,
  keyof VisibilityBadgeLabels
>;

/**
 * Sealed RSC-compatible visibility icon rendered next to the post timestamp.
 *
 * Renders one of 6 lucide icons for the known base values; falls back to
 * `MoreHorizontal` + the `visibilityCustom` label for any custom string value.
 * Pure render; no interactivity (the "Change visibility" affordance lives in
 * the kebab and is host-driven per Q-P42).
 */
export function VisibilityBadge({
  visibility,
  labels,
  className,
}: VisibilityBadgeProps) {
  const knownIcon =
    ICON_BY_VISIBILITY[visibility as keyof typeof ICON_BY_VISIBILITY];
  const Icon = knownIcon ?? MoreHorizontal;
  const labelKey =
    LABEL_KEY_BY_VISIBILITY[visibility as keyof typeof LABEL_KEY_BY_VISIBILITY];
  const label = labelKey ? labels[labelKey] : labels.visibilityCustom;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center text-muted-foreground",
        className,
      )}
      role="img"
      aria-label={label}
      title={label}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
    </span>
  );
}

VisibilityBadge.displayName = "VisibilityBadge";
