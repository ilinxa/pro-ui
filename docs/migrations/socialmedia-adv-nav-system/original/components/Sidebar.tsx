"use client";

import { AccountSwitcher } from "@/components/navigation/AccountSwitcher";
import { SidebarNav } from "@/components/navigation/SidebarNav";
import { GovernanceSessionBar } from "@/features/governance/components/GovernanceSessionBar";
import { useNavContext } from "@/hooks/use-nav-context";
import { useFilteredNav } from "@/hooks/use-filtered-nav";

export function Sidebar() {
  const context = useNavContext();
  const sections = useFilteredNav();

  return (
    <aside className="hidden overflow-y-auto border-r border-sidebar-border bg-sidebar md:block md:w-64 md:shrink-0">
      <div className="space-y-6 p-4 ">
        <AccountSwitcher />
        {context.type === "governance" && <GovernanceSessionBar />}
        <SidebarNav sections={sections} context={context} />
      </div>
    </aside>
  );
}
