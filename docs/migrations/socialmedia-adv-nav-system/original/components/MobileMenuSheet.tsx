"use client";

import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AccountSwitcher } from "@/components/navigation/AccountSwitcher";
import { SidebarNav } from "@/components/navigation/SidebarNav";
import { useNavContext } from "@/hooks/use-nav-context";
import { useFilteredNav } from "@/hooks/use-filtered-nav";
import { useLogout } from "@/features/auth/hooks/use-auth-mutations";

interface MobileMenuSheetProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenuSheet({ children, open, onOpenChange }: MobileMenuSheetProps) {
  const context = useNavContext();
  const sections = useFilteredNav();
  const logout = useLogout();
  const { setTheme, theme } = useTheme();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-xl p-0">
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <ScrollArea className="h-full">
          <div className="space-y-4 p-4">
            <AccountSwitcher />
            <Separator />
            <SidebarNav sections={sections} context={context} />
            <Separator />
            <div className="space-y-1">
              <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Appearance
              </p>
              <div className="flex gap-1 px-3">
                <Button
                  variant={theme === "light" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="mr-1.5 h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="mr-1.5 h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setTheme("system")}
                >
                  <Monitor className="mr-1.5 h-4 w-4" />
                  Auto
                </Button>
              </div>
            </div>
            <Separator />
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
