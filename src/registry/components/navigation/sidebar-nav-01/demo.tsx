"use client";

import { useRef, useState } from "react";
import { SidebarNav01 } from "./sidebar-nav-01";
import { SidebarNav01Trigger } from "./parts/sidebar-nav-trigger";
import {
  SIDEBAR_NAV_01_DUMMY_ITEMS,
  SIDEBAR_NAV_01_DUMMY_SECTIONED,
} from "./dummy-data";
import type { SidebarNav01Handle, SidebarNav01Props } from "./types";

export default function SidebarNav01Demo() {
  const [path, setPath] = useState("/social/home");
  const [sectionedPath, setSectionedPath] = useState("/projects");
  const [variant, setVariant] =
    useState<NonNullable<SidebarNav01Props["activeVariant"]>>("fill");
  const drawerRef = useRef<SidebarNav01Handle>(null);

  // Intercept item clicks to mimic router behavior on the docs site.
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

      {/* Flat list — kasder recipe */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Flat list (kasder recipe) — collapse toggle in header
        </p>
        <div className="flex h-96 overflow-hidden rounded-lg border border-border bg-background">
          <SidebarNav01
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
          <SidebarNav01
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

      {/* Mobile drawer (simulated — force narrow breakpoint to "2xl"
          so the drawer is reachable even on the desktop docs page) */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Mobile drawer + SidebarNav01Trigger (
          <code className="font-mono text-[10px]">mobileBreakpoint=&quot;2xl&quot;</code>{" "}
          forced so it&apos;s reachable on a desktop viewport — tap the
          hamburger)
        </p>
        <div className="flex min-h-32 items-center gap-3 rounded-lg border border-border bg-background p-3">
          <SidebarNav01Trigger
            controls={drawerRef}
            aria-label="Open navigation"
          />
          <span className="text-sm text-muted-foreground">
            Trigger uses <code className="font-mono text-[10px]">controls</code>{" "}
            ref to open drawer.
          </span>
        </div>
        {/* Hidden sidebar instance — only renders via Sheet because mobileBreakpoint=2xl */}
        <SidebarNav01
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
