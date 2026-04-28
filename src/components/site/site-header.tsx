"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const NAV = [{ href: "/components", label: "Components" }] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-6 px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          aria-label="ilinxa-ui-pro home"
        >
          <span
            aria-hidden
            className="block size-2 rounded-[2px] bg-primary transition-transform group-hover:scale-125"
          />
          <span className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              ilinxa
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              /ui-pro
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <nav className="flex items-center">
            {NAV.map(({ href, label }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors outline-none",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                    "focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-1 rounded-full transition-all duration-200",
                      active
                        ? "bg-primary opacity-100 scale-100"
                        : "bg-transparent opacity-0 scale-50",
                    )}
                  />
                  {label}
                </Link>
              );
            })}
          </nav>

          <span aria-hidden className="hidden h-4 w-px bg-border/80 sm:block" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
