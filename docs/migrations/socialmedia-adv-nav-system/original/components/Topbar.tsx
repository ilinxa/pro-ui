"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { UserMenu } from "@/components/navigation/UserMenu";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { useIsAuthenticated, useIsInitialized } from "@/stores/auth-store";

interface TopbarProps {
  variant: "public" | "authenticated";
}

const PUBLIC_NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Topbar({ variant }: TopbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuthenticated = useIsAuthenticated();
  const isInitialized = useIsInitialized();

  if (variant === "authenticated") {
    return (
      <header className="flex h-14 shrink-0 items-center border-b border-border bg-background px-4">
        <Link href="/home" className="text-lg font-semibold">
          SocialMedia Adv
        </Link>
        <div className="flex-1" />
        <NotificationBell />
        <UserMenu />
      </header>
    );
  }

  // Public variant
  const showAuthUser = isInitialized && isAuthenticated;

  return (
    <header className="sticky  top-0 z-40 flex h-14 items-center border-b border-border bg-background px-4">
      <Link href="/" className="text-lg font-semibold">
        SocialMedia Adv
      </Link>

      {/* Desktop nav links */}
      <nav aria-label="Main navigation" className="ml-8 hidden items-center  gap-6 md:flex">
        {PUBLIC_NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Right side: auth buttons or user menu */}
      {showAuthUser ? (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
            <Link href="/home">Go to App</Link>
          </Button>
          <UserMenu />
        </div>
      ) : (
        <>
          {/* Desktop auth buttons */}
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Register</Link>
            </Button>
          </div>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex flex-col gap-4 p-6">
                {PUBLIC_NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="border-t border-border pt-4">
                  <Button variant="ghost" size="sm" asChild className="w-full justify-start">
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button size="sm" asChild className="mt-2 w-full">
                    <Link href="/register" onClick={() => setMobileOpen(false)}>
                      Register
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </header>
  );
}
