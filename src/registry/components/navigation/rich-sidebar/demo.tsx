"use client";

import {
  BarChart3,
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  Crown,
  FileText,
  Globe,
  Home,
  LogOut,
  PlusSquare,
  Settings,
  User as UserIcon,
  Users,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { AccountSwitcher01 } from "../account-switcher-01/account-switcher-01";
import type { SwitcherItem } from "../account-switcher-01/types";
import { RichSidebar } from "./rich-sidebar";
import { useFilteredNavSections } from "./hooks/use-filtered-nav-sections";
import { RichSidebarTrigger } from "./parts/sidebar-nav-trigger";
import {
  SIDEBAR_NAV_01_DUMMY_ITEMS,
  SIDEBAR_NAV_01_DUMMY_SECTIONED,
} from "./dummy-data";
import type {
  NavEntry,
  RichSidebarHandle,
  RichSidebarProps,
} from "./types";

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
  const kasderRecipeRef = useRef<RichSidebarHandle>(null);
  const flatListRef = useRef<RichSidebarHandle>(null);
  const sectionedRef = useRef<RichSidebarHandle>(null);

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
        <div className="flex min-h-72 overflow-hidden rounded-lg border border-border bg-background lg:h-136">
          <RichSidebar
            ref={kasderRecipeRef}
            items={SIDEBAR_NAV_01_DUMMY_ITEMS}
            currentPath={recipePath}
            onItemClick={interceptClick(setRecipePath)}
            activeVariant={variant}
            brand={{ logo: <KSquareLogo />, label: "Kasder", href: "/" }}
            primaryAction={{
              icon: PlusSquare,
              label: "Post",
              onClick: () => alert("Open post composer"),
            }}
            footer={{
              user: {
                name: "Alex Morgan",
                handle: "@alexmorgan",
                status: "online",
              },
              menuItems: [
                { kind: "item", icon: UserIcon, label: "Profile", onClick: () => alert("profile") },
                { kind: "item", icon: Settings, label: "Settings", onClick: () => alert("settings") },
                { kind: "item", icon: Briefcase, label: "Business", onClick: () => alert("business") },
                { kind: "separator" },
                { kind: "item", icon: LogOut, label: "Log out", variant: "destructive", onClick: () => alert("logout") },
              ],
            }}
            aria-label="Full recipe"
          />
          <div className="flex flex-1 flex-col items-start gap-3 p-4 sm:items-center sm:justify-center sm:p-6">
            <RichSidebarTrigger
              controls={kasderRecipeRef}
              aria-label="Open navigation"
              className="lg:hidden"
            />
            <p className="text-sm text-muted-foreground sm:text-center">
              Active path: <span className="font-mono">{recipePath}</span>
              <br />
              <span className="text-xs">
                Toggle collapse (top-right at <code>lg</code>+) to see
                brand/labels hide, badges flip to corner, tooltip shows on
                hover, footer dropdown align flips to center. Below{" "}
                <code>lg</code> the sidebar opens as a drawer — tap the
                hamburger above.
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
        <div className="flex min-h-56 overflow-hidden rounded-lg border border-border bg-background lg:h-96">
          <RichSidebar
            ref={flatListRef}
            items={SIDEBAR_NAV_01_DUMMY_ITEMS}
            currentPath={path}
            onItemClick={interceptClick(setPath)}
            activeVariant={variant}
            aria-label="Flat nav demo"
          />
          <div className="flex flex-1 flex-col items-start gap-3 p-4 sm:items-center sm:justify-center sm:p-6">
            <RichSidebarTrigger
              controls={flatListRef}
              aria-label="Open flat nav"
              className="lg:hidden"
            />
            <p className="text-sm text-muted-foreground sm:text-center">
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
        <div className="flex min-h-56 overflow-hidden rounded-lg border border-border bg-background lg:h-96">
          <RichSidebar
            ref={sectionedRef}
            items={SIDEBAR_NAV_01_DUMMY_SECTIONED}
            currentPath={sectionedPath}
            onItemClick={interceptClick(setSectionedPath)}
            activeVariant={variant}
            aria-label="Sectioned nav demo"
          />
          <div className="flex flex-1 flex-col items-start gap-3 p-4 sm:items-center sm:justify-center sm:p-6">
            <RichSidebarTrigger
              controls={sectionedRef}
              aria-label="Open sectioned nav"
              className="lg:hidden"
            />
            <p className="text-sm text-muted-foreground sm:text-center">
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

      <V02MultiContextDemo />
      <V02HeadlessFilterDemo />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// v0.2.0 — Multi-context demo (topSlot + {slug} + ownerOnly + minMembers + bypass)
//
// Demonstrates the *real* v0.2 power: switching contexts in the topSlot
// account-switcher changes BOTH the nav-item catalog AND the {slug} value
// fed into href substitution. Each context has its own item set — matches
// the source app-shell pattern (analysis §8.2 NavContext discriminant).
// ─────────────────────────────────────────────────────────────────────────

type V02ContextKey = "personal" | "biz-acme" | "biz-globex" | "platform";

const V02_SWITCHER_ITEMS: ReadonlyArray<SwitcherItem> = [
  { key: "personal", label: "Personal", icon: UserIcon, href: "/home" },
  { key: "biz-acme", label: "Acme Corp", icon: Building2, href: "/bconsole/acme" },
  { key: "biz-globex", label: "Globex Industries", icon: Building2, href: "/bconsole/globex" },
  { key: "platform", label: "Platform", icon: Globe, href: "/pconsole/overview" },
];

// Per-context nav catalogs. Switching contexts swaps the entire item set;
// {slug} substitution applies only when the context provides a slug.
const V02_NAV_BY_CONTEXT: Record<V02ContextKey, ReadonlyArray<NavEntry>> = {
  personal: [
    { id: "home", label: "Home", icon: Home, href: "/home" },
    { id: "profile", label: "Profile", icon: UserIcon, href: "/profile" },
    { id: "notifications", label: "Notifications", icon: Bell, href: "/notifications", badge: 3 },
    { id: "saved", label: "Saved items", icon: Bookmark, href: "/saved" },
  ],
  "biz-acme": [
    { id: "dashboard", label: "Dashboard", icon: Briefcase, href: "/bconsole/{slug}/dashboard" },
    { id: "posts", label: "Posts", icon: FileText, href: "/bconsole/{slug}/posts" },
    { id: "team", label: "Team", icon: Users, href: "/bconsole/{slug}/team", minMembers: 2 },
    { id: "analytics", label: "Analytics", icon: BarChart3, href: "/bconsole/{slug}/analytics", ownerOnly: true },
    { id: "settings", label: "Settings", icon: Settings, href: "/bconsole/{slug}/settings", ownerOnly: true },
    { id: "billing", label: "Billing", icon: Crown, href: "/bconsole/{slug}/billing", ownerOnly: true },
  ],
  "biz-globex": [
    { id: "dashboard", label: "Dashboard", icon: Briefcase, href: "/bconsole/{slug}/dashboard" },
    { id: "posts", label: "Posts", icon: FileText, href: "/bconsole/{slug}/posts" },
    { id: "team", label: "Team", icon: Users, href: "/bconsole/{slug}/team", minMembers: 2 },
    { id: "analytics", label: "Analytics", icon: BarChart3, href: "/bconsole/{slug}/analytics", ownerOnly: true },
    { id: "settings", label: "Settings", icon: Settings, href: "/bconsole/{slug}/settings", ownerOnly: true },
    { id: "billing", label: "Billing", icon: Crown, href: "/bconsole/{slug}/billing", ownerOnly: true },
  ],
  platform: [
    { id: "overview", label: "Overview", icon: Globe, href: "/pconsole/overview" },
    { id: "users", label: "All users", icon: Users, href: "/pconsole/users", ownerOnly: true },
    { id: "audit", label: "Audit log", icon: FileText, href: "/pconsole/audit", ownerOnly: true },
    { id: "platform-settings", label: "Platform settings", icon: Settings, href: "/pconsole/settings", ownerOnly: true },
  ],
};

const V02_DEFAULT_PATH_BY_CONTEXT: Record<V02ContextKey, string> = {
  personal: "/home",
  "biz-acme": "/bconsole/acme/dashboard",
  "biz-globex": "/bconsole/globex/dashboard",
  platform: "/pconsole/overview",
};

function V02MultiContextDemo() {
  const [activeContextKey, setActiveContextKey] = useState<V02ContextKey>("biz-acme");
  const [isOwner, setIsOwner] = useState(true);
  const [maxMembers, setMaxMembers] = useState(5);
  const [bypass, setBypass] = useState(false);
  const [currentPath, setCurrentPath] = useState(V02_DEFAULT_PATH_BY_CONTEXT["biz-acme"]);
  // Lift collapsed state so it threads to BOTH <RichSidebar> AND the slotted
  // <AccountSwitcher01> — the canonical collapse-aware composition recipe.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const v02SidebarRef = useRef<RichSidebarHandle>(null);

  // Items + slug derive purely from the current context.
  const items = V02_NAV_BY_CONTEXT[activeContextKey];

  const slug = activeContextKey.startsWith("biz-")
    ? activeContextKey.slice(4)
    : undefined;

  const templateValues = useMemo(
    () => (slug ? { slug } : undefined),
    [slug],
  );

  const handleContextSwitch = (item: SwitcherItem) => {
    const next = item.key as V02ContextKey;
    setActiveContextKey(next);
    setCurrentPath(V02_DEFAULT_PATH_BY_CONTEXT[next]);
  };

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        v0.2.0 — multi-context: topSlot + &#123;slug&#125; templates + ownerOnly + minMembers + bypassFiltering
      </p>
      <div className="mb-3 flex flex-wrap items-center gap-4 rounded-md border border-border bg-card p-3 text-xs">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isOwner}
            onChange={(e) => setIsOwner(e.target.checked)}
          />
          isOwner
        </label>
        <label className="flex items-center gap-2">
          currentMaxMembers:
          <input
            type="number"
            min={0}
            max={50}
            value={maxMembers}
            onChange={(e) => setMaxMembers(Number(e.target.value) || 0)}
            className="w-16 rounded border border-border bg-background px-2 py-0.5"
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={bypass}
            onChange={(e) => setBypass(e.target.checked)}
          />
          bypassFiltering
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={sidebarCollapsed}
            onChange={(e) => setSidebarCollapsed(e.target.checked)}
          />
          collapse sidebar
        </label>
        <span className="ml-auto font-mono text-muted-foreground">
          context: <code>{activeContextKey}</code>
          {slug ? (
            <>
              {" "}· slug: <code>{slug}</code>
            </>
          ) : null}
        </span>
      </div>
      <div className="flex min-h-72 overflow-hidden rounded-lg border border-border bg-background lg:h-136">
        <RichSidebar
          ref={v02SidebarRef}
          items={items}
          currentPath={currentPath}
          isCollapsed={sidebarCollapsed}
          onCollapsedChange={({ collapsed }) => setSidebarCollapsed(collapsed)}
          onItemClick={({ item, event }) => {
            if (item.href) {
              event.preventDefault();
              setCurrentPath(item.href);
            }
          }}
          topSlot={
            <AccountSwitcher01
              items={V02_SWITCHER_ITEMS}
              activeKey={activeContextKey}
              onSelect={handleContextSwitch}
              isCollapsed={sidebarCollapsed}
            />
          }
          hrefTemplateValues={templateValues}
          isOwner={isOwner}
          currentMaxMembers={maxMembers}
          bypassFiltering={bypass}
          aria-label="v0.2 multi-context demo"
        />
        <div className="flex flex-1 flex-col gap-2 p-4 text-sm text-muted-foreground sm:p-6">
          <RichSidebarTrigger
            controls={v02SidebarRef}
            aria-label="Open v0.2 multi-context nav"
            className="self-start lg:hidden"
          />
          <p>Active context: <code className="font-mono">{activeContextKey}</code></p>
          <p>Active path: <code className="font-mono break-all">{currentPath}</code></p>
          <p className="text-xs">Items in this context: <code>{items.length}</code></p>
          <ul className="ml-4 list-disc space-y-1 text-xs">
            <li>Switch context in the popover — items + default path swap</li>
            <li>Business contexts use <code>&#123;slug&#125;</code> in hrefs (Acme vs Globex)</li>
            <li><code>Analytics</code> / <code>Settings</code> / <code>Billing</code> hide unless <code>isOwner</code></li>
            <li><code>Team</code> hidden unless <code>currentMaxMembers ≥ 2</code></li>
            <li><code>bypassFiltering</code> reveals everything (still respects <code>hidden:true</code>)</li>
            <li>
              <code>collapse sidebar</code> threads <code>isCollapsed</code> into BOTH
              <code>&lt;RichSidebar&gt;</code> AND the slotted{" "}
              <code>&lt;AccountSwitcher01&gt;</code> — switcher trigger flips to
              icon-only along with the rest of the sidebar
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// v0.2.0 — Headless useFilteredNavSections (standalone, no <RichSidebar>)
// ─────────────────────────────────────────────────────────────────────────

function V02HeadlessFilterDemo() {
  const [isOwner, setIsOwner] = useState(false);
  const filtered = useFilteredNavSections({
    sections: V02_NAV_BY_CONTEXT["biz-acme"],
    isOwner,
    currentMaxMembers: 10,
  });
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        v0.2.0 — headless useFilteredNavSections (no &lt;RichSidebar&gt;)
      </p>
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-sm">
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={isOwner}
            onChange={(e) => setIsOwner(e.target.checked)}
          />
          isOwner (toggle to flip Settings + Billing visibility)
        </label>
        <ul className="flex flex-col gap-1">
          {filtered.map((entry, index) =>
            entry.kind === "section" ? null : entry.kind === "separator" ? (
              <li key={entry.id ?? `sep-${index}`} className="my-1 h-px bg-border" />
            ) : (
              <li
                key={entry.id}
                className="flex flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2"
              >
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">[{entry.id}]</span>
                  <span>{entry.label}</span>
                </span>
                <span className="min-w-0 text-xs text-muted-foreground sm:ml-auto">
                  href:{" "}
                  <code className="break-all">{entry.href}</code>
                </span>
              </li>
            ),
          )}
        </ul>
        <p className="text-xs text-muted-foreground">
          Renders consumer-owned UI; library helper just does the filter math.
        </p>
      </div>
    </div>
  );
}
