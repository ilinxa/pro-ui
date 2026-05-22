"use client";

import { usePathname } from "next/navigation";

import { NavItem } from "@/components/navigation/NavItem";
import { isNavActive, resolveHref } from "@/lib/navigation-config";
import type { NavContext, NavSection } from "@/types/navigation";

interface SidebarNavProps {
  sections: NavSection[];
  context: NavContext;
}

export function SidebarNav({ sections, context }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Sidebar navigation" className="space-y-6 ">
      {sections.map((section) => (
        <div key={section.label} className="space-y-1 ">
          <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {section.label}
          </p>
          {section.items.map((item) => (
            <NavItem
              key={item.key}
              item={item}
              context={context}
              active={isNavActive(pathname, resolveHref(item.href, context), item.activeMatch)}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}
