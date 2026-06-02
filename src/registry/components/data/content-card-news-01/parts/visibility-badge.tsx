import { Globe, Users, BadgeCheck, Shield, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NewsVisibility, ContentCardNewsLabels } from "../types";

interface VisibilityBadgeProps {
  visibility: NewsVisibility | undefined;
  labels: Required<ContentCardNewsLabels>;
  className?: string;
}

/**
 * Visibility / access-tier badge. Renders for any visibility value EXCEPT
 * `"public"` (the implicit default — no badge for free, public content)
 * and `undefined`.
 *
 * RSC-compatible.
 */
export function VisibilityBadge({
  visibility,
  labels,
  className,
}: VisibilityBadgeProps) {
  if (!visibility || visibility === "public") return null;

  const { label, Icon } = (() => {
    switch (visibility) {
      case "members":
        return { label: labels.visibilityMembers, Icon: Users };
      case "subscribers":
        return { label: labels.visibilitySubscribers, Icon: BadgeCheck };
      case "staff":
        return { label: labels.visibilityStaff, Icon: Shield };
      case "unlisted":
        return { label: labels.visibilityUnlisted, Icon: EyeOff };
      default:
        // Branded extension — custom string value
        return { label: labels.visibilityCustom, Icon: Globe };
    }
  })();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-1.5 py-0.5 text-[10px] font-medium",
        className,
      )}
      title={label}
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}
