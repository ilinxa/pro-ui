"use client";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { 
  Home, 
  Search, 
  MessageCircle, 
  Bell, 
  User, 
  Briefcase,
  Menu,
  X,
  PlusSquare,
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  { icon: MessageCircle, label: "Mesajlar", path: "/social/chat", badge: 3 },
  { icon: Bell, label: "Bildirimler", path: "/social/notifications", badge: 5 },
  { icon: User, label: "Profil", path: "/social/profile" },
  { icon: Briefcase, label: "İşletme", path: "/social/business" },
];

export function SocialSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
//   const location = useLocation();
  const pathname = usePathname();

//   const isActive = (path: string) => {
//     if (path === "/sosyal") return location.pathname === path;
//     return location.pathname.startsWith(path);
//   };
    

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen bg-card border-r border-border sticky top-0 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo & Toggle */}
      <div className="flex items-center justify-around p-4ss border-border min-h-17 ">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="text-accent-foreground font-heading font-bold text-sm">K</span>
            </div>
            <span className="font-heading font-semibold text-lg">Kasder</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="shrink-0  flex items-center justify-center "
        >
          {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
        const isActive = pathname === item.path;
            return (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative",
              isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-foreground"
            )}
          >
            <item.icon className={cn("h-5 w-5 shrink-0", isCollapsed && "mx-auto")} />
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
            {item.badge && item.badge > 0 && (
              <span
                className={cn(
                  "absolute flex items-center justify-center min-w-5 h-5 text-white text-xs font-medium rounded-full",
                  isCollapsed ? "top-1 right-1" : "right-3",
                  isActive
                    ? "bg-accent text-accent-foregroundd text-white "
                    : "bg-destructive text-destructive-foregroundd text-white "
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        )})}

        {/* Create Post Button */}
        <Button
          className={cn(
            "w-full mt-4 gap-2",
            isCollapsed && "px-0"
          )}
        >
          <PlusSquare className="h-5 w-5" />
          {!isCollapsed && <span>Paylaş</span>}
        </Button>
      </nav>

      {/* User Section */}
      <div className="p-3  border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg w-full hover:bg-muted transition-colors",
                isCollapsed && "justify-center"
              )}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100" />
                <AvatarFallback>AK</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 text-left ">
                  <p className="text-sm font-medium">Ahmet Kaya</p>
                  <p className="text-xs text-muted-foreground">@ahmetkaya</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isCollapsed ? "center" : "end"} className="w-56  z-9999">
            <DropdownMenuItem asChild>
              <Link href="/sosyal/profil" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Profil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/sosyal/ayarlar" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Ayarlar</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              <span>Çıkış Yap</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
