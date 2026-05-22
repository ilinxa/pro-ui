"use client";

import {
  Briefcase,
  LogOut,
  PlusSquare,
  Settings,
  User as UserIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { RichSidebar } from "./rich-sidebar";
import { RichSidebarTrigger } from "./parts/sidebar-nav-trigger";
import {
  SIDEBAR_NAV_01_DUMMY_ITEMS,
  SIDEBAR_NAV_01_DUMMY_SECTIONED,
} from "./dummy-data";
import type { RichSidebarHandle, RichSidebarProps } from "./types";

const KSquareLogo = () => (
  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-(--ilinxa-nav-active-bg) text-(--ilinxa-nav-active-fg) text-sm font-bold">
    K
  </span>
);

export default function RichSidebarDemo() {
  const [path, setPath] = useState("/social/home");
  const [sectionedPath, setSectionedPath] = useState("/projects");
  const [recipePath, setRecipePath] = useState("/social/home");
  const [variant, setVariant] =
    useState<NonNullable<RichSidebarProps["activeVariant"]>>("fill");
  const drawerRef = useRef<RichSidebarHandle>(null);

  const interceptClick =
    (setter: (p: string) => void) =>
    ({ item, event }: { item: { href?: string }; event: React.MouseEvent }) => {
      if (item.href) {
        event.preventDefault();
        setter(item.href);
      }
    };

  return (
    <div className="flex flex-col gap-6">
      {/* Live activeVariant switcher */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          activeVariant:
        </span>
        {(
          ["fill", "left-bar", "right-bar", "outline", "subtle"] as const
        ).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVariant(v)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              variant === v
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Full kasder recipe — brand + items + primary action + footer */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Full kasder recipe — brand · items · primary action · user footer
        </p>
        <div className="flex h-136 overflow-hidden rounded-lg border border-border bg-background">
          <RichSidebar
            items={SIDEBAR_NAV_01_DUMMY_ITEMS}
            currentPath={recipePath}
            onItemClick={interceptClick(setRecipePath)}
            activeVariant={variant}
            brand={{ logo: <KSquareLogo />, label: "Kasder", href: "/" }}
            primaryAction={{
              icon: PlusSquare,
              label: "Paylaş",
              onClick: () => alert("Open post composer"),
            }}
            footer={{
              user: {
                name: "Ahmet Kaya",
                handle: "@ahmetkaya",
                status: "online",
              },
              menuItems: [
                { kind: "item", icon: UserIcon, label: "Profil", onClick: () => alert("profile") },
                { kind: "item", icon: Settings, label: "Ayarlar", onClick: () => alert("settings") },
                { kind: "item", icon: Briefcase, label: "İşletme", onClick: () => alert("business") },
                { kind: "separator" },
                { kind: "item", icon: LogOut, label: "Çıkış Yap", variant: "destructive", onClick: () => alert("logout") },
              ],
            }}
            aria-label="Full recipe"
          />
          <div className="flex flex-1 items-center justify-center p-6">
            <p className="text-sm text-muted-foreground">
              Active path: <span className="font-mono">{recipePath}</span>
              <br />
              <span className="text-xs">
                Toggle collapse (top-right) to see brand/labels hide,
                badges flip to corner, tooltip shows on hover, footer
                dropdown align flips to center.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Flat list */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Flat list (no chrome)
        </p>
        <div className="flex h-96 overflow-hidden rounded-lg border border-border bg-background">
          <RichSidebar
            items={SIDEBAR_NAV_01_DUMMY_ITEMS}
            currentPath={path}
            onItemClick={interceptClick(setPath)}
            activeVariant={variant}
            aria-label="Flat nav demo"
          />
          <div className="flex flex-1 items-center justify-center p-6">
            <p className="text-sm text-muted-foreground">
              Active path: <span className="font-mono">{path}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Sectioned variant */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Sections + separators + collapsible groups
        </p>
        <div className="flex h-96 overflow-hidden rounded-lg border border-border bg-background">
          <RichSidebar
            items={SIDEBAR_NAV_01_DUMMY_SECTIONED}
            currentPath={sectionedPath}
            onItemClick={interceptClick(setSectionedPath)}
            activeVariant={variant}
            aria-label="Sectioned nav demo"
          />
          <div className="flex flex-1 items-center justify-center p-6">
            <p className="text-sm text-muted-foreground">
              Active path: <span className="font-mono">{sectionedPath}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Mobile drawer (
          <code className="font-mono text-[10px]">
            mobileBreakpoint=&quot;2xl&quot;
          </code>{" "}
          forced so it&apos;s reachable on a desktop viewport)
        </p>
        <div className="flex min-h-32 items-center gap-3 rounded-lg border border-border bg-background p-3">
          <RichSidebarTrigger
            controls={drawerRef}
            aria-label="Open navigation"
          />
          <span className="text-sm text-muted-foreground">
            Trigger uses <code className="font-mono text-[10px]">controls</code>{" "}
            ref to open drawer.
          </span>
        </div>
        <RichSidebar
          ref={drawerRef}
          items={SIDEBAR_NAV_01_DUMMY_ITEMS}
          currentPath={path}
          onItemClick={interceptClick(setPath)}
          mobileBreakpoint="2xl"
          aria-label="Drawer demo"
        />
      </div>
    </div>
  );
}
