"use client";

import { cn } from "@/lib/utils";
import { useRichSidebarContextOrNull } from "../contexts/sidebar-nav-context";
import type { NavBrandConfig } from "../types";
import { DefaultLink } from "./default-link";

/**
 * Default brand zone (logo + label + optional href).
 *
 * Collapse-aware: when ancestor sidebar is collapsed (read via context),
 * the label hides and only the logo renders.
 *
 * Use via:
 *   <RichSidebar brand={{ logo: <Logo/>, label: "Acme", href: "/" }} />
 * Or directly inside brandSlot:
 *   <RichSidebar brandSlot={<NavBrand label="Acme" />} />
 */
export function NavBrand({
  logo,
  label,
  href,
  linkComponent,
  className,
}: NavBrandConfig & { className?: string }) {
  const ctx = useRichSidebarContextOrNull();
  const isCollapsed = ctx?.state.collapsed ?? false;

  const renderLogo = () => {
    if (!logo) return null;
    if (typeof logo === "object" && logo !== null && "src" in logo) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo.src}
          alt={logo.alt ?? label}
          className="h-8 w-8 rounded-md object-contain"
        />
      );
    }
    return <span className="flex h-8 w-8 items-center justify-center">{logo}</span>;
  };

  const content = (
    <span className={cn("flex items-center gap-2 min-w-0", className)}>
      {renderLogo()}
      {!isCollapsed && (
        <span className="truncate text-base font-semibold text-foreground">
          {label}
        </span>
      )}
    </span>
  );

  if (!href) {
    return content;
  }

  const LinkComponent = linkComponent ?? DefaultLink;
  return (
    <LinkComponent
      href={href}
      className="-m-1 rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={label}
    >
      {content}
    </LinkComponent>
  );
}
