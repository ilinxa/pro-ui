"use client";
import { cn } from "@/lib/utils";
import { Home, Search, PlusSquare, Bell, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Ana Sayfa", path: "/social/home" },
  { icon: Search, label: "Keşfet", path: "/social/explore" },
  { icon: PlusSquare, label: "Paylaş", path: "/social/post" },
  { icon: Bell, label: "Bildirimler", path: "/social/notifications", badge: 5 },
  // { icon: Bell, label: "Bildirimler", path: "/social/notifications", badge: 5 },
  { icon: User, label: "Profil", path: "/social/profile" },
];

export function SocialBottomNav() {

    const pathname = usePathname();

//   const isActive = (path: string) => {
//     if (path === "/sosyal") return location.pathname === path;
//     return location.pathname.startsWith(path);
//   };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
        const isActive = pathname === item.path;
            return (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-lg transition-colors relative",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="relative">
              <item.icon
                className={cn(
                  "h-6 w-6 transition-transform",
                  isActive && "scale-110"
                )}
              />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-medium rounded-full bg-destructive text-destructive-foreground">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
            {isActive && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
            )}
          </Link>
        )})}
      </div>
    </nav>
  );
}
