"use client";

import { useState } from "react";
import { SidebarNav01 } from "./sidebar-nav-01";
import {
  SIDEBAR_NAV_01_DUMMY_ITEMS,
  SIDEBAR_NAV_01_DUMMY_SECTIONED,
} from "./dummy-data";

export default function SidebarNav01Demo() {
  const [path, setPath] = useState("/social/home");
  const [sectionedPath, setSectionedPath] = useState("/projects");

  // Intercept item clicks to mimic router behavior on the docs site
  // (consumer's router would normally update currentPath via its own hook)
  const interceptClick =
    (setter: (p: string) => void) =>
    ({ item, event }: { item: { href?: string }; event: React.MouseEvent }) => {
      if (item.href) {
        event.preventDefault();
        setter(item.href);
      }
    };

  return (
    <div className="flex flex-col gap-4">
      {/* Flat list — kasder recipe */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Flat list (kasder recipe)
        </p>
        <div className="flex h-96 overflow-hidden rounded-lg border border-border bg-background">
          <SidebarNav01
            items={SIDEBAR_NAV_01_DUMMY_ITEMS}
            currentPath={path}
            onItemClick={interceptClick(setPath)}
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
            aria-label="Sectioned nav demo"
          />
          <div className="flex flex-1 items-center justify-center p-6">
            <p className="text-sm text-muted-foreground">
              Active path: <span className="font-mono">{sectionedPath}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
