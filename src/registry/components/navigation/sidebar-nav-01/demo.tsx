import { SidebarNav01 } from "./sidebar-nav-01";
import {
  SIDEBAR_NAV_01_DUMMY_CURRENT_PATH,
  SIDEBAR_NAV_01_DUMMY_ITEMS,
} from "./dummy-data";

export default function SidebarNav01Demo() {
  return (
    <div className="flex h-120 overflow-hidden rounded-lg border border-border bg-background">
      <SidebarNav01
        items={SIDEBAR_NAV_01_DUMMY_ITEMS}
        currentPath={SIDEBAR_NAV_01_DUMMY_CURRENT_PATH}
        aria-label="Demo sidebar"
      />
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">
          Main content area (placeholder).
        </p>
      </div>
    </div>
  );
}
