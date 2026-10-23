import { cn } from "@/lib/utils";

interface SidebarNavSeparatorProps {
  className?: string;
}

/**
 * Thin horizontal divider between nav groups.
 * Spec'd as separate part so the visual can be themed via consumer CSS.
 */
export function SidebarNavSeparator({ className }: SidebarNavSeparatorProps) {
  return (
    <li role="presentation" className={cn("my-2 px-(--ilinxa-sidebar-px,0.75rem)", className)}>
      <div className="h-px w-full bg-(--ilinxa-sidebar-border,var(--border))" />
    </li>
  );
}
