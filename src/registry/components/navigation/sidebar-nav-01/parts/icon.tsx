import { isValidElement, type ComponentType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IconProps {
  icon: ReactNode | ComponentType<{ className?: string }> | undefined;
  className?: string;
}

/**
 * Renders either:
 *  - a React component (e.g., lucide-react `Home`) — invoked with className
 *  - a ReactNode (JSX element, string emoji, image, custom mark) — rendered as-is
 *  - undefined — renders nothing
 *
 * Convention: icon components receive a className with sizing (`h-5 w-5` or
 * similar). ReactNode icons are expected to size themselves.
 */
export function Icon({ icon, className }: IconProps) {
  if (icon === undefined || icon === null) return null;

  if (isValidElement(icon)) {
    return <>{icon}</>;
  }

  if (typeof icon === "function") {
    const IconComponent = icon as ComponentType<{ className?: string }>;
    return <IconComponent className={cn("h-5 w-5 shrink-0", className)} />;
  }

  // String / number / fragment — render as-is
  return <>{icon}</>;
}
