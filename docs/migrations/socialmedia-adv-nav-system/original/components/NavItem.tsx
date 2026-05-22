"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import type { NavContext, NavItem as NavItemType } from "@/types/navigation";
import { resolveHref } from "@/lib/navigation-config";

interface NavItemProps {
  item: NavItemType;
  context: NavContext;
  active: boolean;
}

export function NavItem({ item, context, active }: NavItemProps) {
  const href = resolveHref(item.href, context);
  const Icon = item.icon;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}
