const H3 = "mb-2 mt-6 text-base font-semibold";
const PRE =
  "mt-2 overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs";

export default function AppSidebarUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">Status</h3>
      <p className="text-muted-foreground">
        v0.5.0 ships the full <code>AppSidebarProps</code> surface: items,
        sections, collapse (controlled, uncontrolled or lifted), a mobile
        drawer that shows full labels, slots and render props, permission
        gates, and a localStorage opt-in. v0.5.0 adds <code>labels</code>,
        badge accessible names, <code>formatBadgeCount</code>, CSS-variable
        theming that ancestors can override (and that reaches the drawer),
        RTL, <code>side=&quot;start&quot; | &quot;end&quot;</code>, a{" "}
        <code>brand</code> badge tone and a corrected controlled-collapse
        toggle.
      </p>

      <h3 className={H3}>When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>AppSidebar</code> for any app shell that needs a
        collapsible navigation column with a mobile drawer fallback. It
        replaces the per-app reinvention of collapse, sections, badges,
        tooltips on the collapsed rail, permission gating, persistence,
        reduced motion and WAI-ARIA.
      </p>

      <h3 className={H3}>Basic example</h3>
      <p className="text-muted-foreground">
        Define the link adapter at <strong>module scope</strong>: a component
        declared inline in render has a new identity on every render, which
        remounts every row.
      </p>
      <pre className={PRE}>
        <code>{`import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppSidebar,
  type NavItem,
  type NavLinkProps,
} from "@/components/app-sidebar";

const items: NavItem[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "inbox", label: "Inbox", href: "/inbox", badge: 12 },
];

// Module scope: stable identity across renders.
function AppLink({ href, children, ...rest }: NavLinkProps) {
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen">
      <AppSidebar items={items} currentPath={pathname} linkComponent={AppLink} />
      <main className="flex-1">{children}</main>
    </div>
  );
}`}</code>
      </pre>

      <h3 className={H3}>Key props</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>items</code> — flat <code>NavItem[]</code> or mixed{" "}
          <code>NavEntry[]</code> (items / sections / separators)
        </li>
        <li>
          <code>currentPath</code> + optional <code>isActive</code> predicate
          drive active-row detection (no router coupling)
        </li>
        <li>
          <code>linkComponent</code> — your router&apos;s link primitive
          (default <code>&lt;a href&gt;</code>)
        </li>
        <li>
          <code>storageKey</code> — opt-in localStorage persistence of collapse
          and section state
        </li>
        <li>
          <code>activeVariant</code> — <code>&quot;fill&quot;</code> (default)
          / <code>&quot;left-bar&quot;</code> / <code>&quot;right-bar&quot;</code>{" "}
          / <code>&quot;outline&quot;</code> / <code>&quot;subtle&quot;</code>
        </li>
      </ul>

      <h3 className={H3}>Controlled collapse + cookie (no flash)</h3>
      <p className="text-muted-foreground">
        The server reads a cookie and passes <code>isCollapsed</code>, so the
        first paint already has the right width.{" "}
        <code>onCollapsedChange</code> writes the cookie. With{" "}
        <code>isCollapsed</code> defined, <code>storageKey</code> no longer
        reads or writes <code>collapsed</code> (section state still persists),
        and the toggle requests <code>!isCollapsed</code> — the rendered width
        changes only when your prop does.
      </p>
      <pre className={PRE}>
        <code>{`// app/layout.tsx (server)
import { cookies } from "next/headers";
import { Shell } from "./shell";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const collapsed = (await cookies()).get("sidebar-collapsed")?.value === "1";
  return <Shell initialCollapsed={collapsed}>{children}</Shell>;
}

// app/shell.tsx (client)
"use client";
import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { items, AppLink } from "./nav"; // AppLink lives at module scope

export function Shell({
  initialCollapsed,
  children,
}: {
  initialCollapsed: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  return (
    <div className="flex min-h-screen">
      <AppSidebar
        items={items}
        currentPath="/"
        linkComponent={AppLink}
        isCollapsed={collapsed}
        onCollapsedChange={({ collapsed: next }) => {
          setCollapsed(next);
          document.cookie = "sidebar-collapsed=" + (next ? "1" : "0") + "; path=/; max-age=31536000";
        }}
        storageKey="app-sidebar" // sections persist; collapsed is left alone
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}`}</code>
      </pre>
      <p className="mt-2 text-xs text-muted-foreground">
        The same rule applies to <code>isMobileOpen</code> /{" "}
        <code>onMobileOpenChange</code>.
      </p>

      <h3 className={H3}>RTL</h3>
      <p className="text-muted-foreground">
        Put <code>dir=&quot;rtl&quot;</code> on any ancestor (or pass the{" "}
        <code>dir</code> prop). <code>side=&quot;start&quot;</code> is the
        default, so the sidebar docks on the right in RTL and on the left in
        LTR; <code>&quot;end&quot;</code> is the opposite, and{" "}
        <code>&quot;left&quot;</code> / <code>&quot;right&quot;</code> stay
        physical. Border, active bar, tooltips and collapse icons mirror, the
        arrow keys swap, and the drawer opens from the same logical side
        (override with <code>mobileDrawerSide</code>).
      </p>
      <pre className={PRE}>
        <code>{`<div dir="rtl">
  <AppSidebar
    items={items}
    currentPath={pathname}
    linkComponent={AppLink}
    labels={arabicLabels}
  />
</div>`}</code>
      </pre>

      <h3 className={H3}>Labels (i18n)</h3>
      <p className="text-muted-foreground">
        <code>labels</code> is an <code>AppSidebarLabelsInput</code>{" "}
        merged over <code>DEFAULT_APP_SIDEBAR_LABELS</code>; a key passed as{" "}
        <code>undefined</code> keeps its default. <code>emptyState</code>{" "}
        merges per reason. Labels travel in context, so{" "}
        <code>AppSidebarTrigger</code> inside the subtree reads them too; a
        trigger OUTSIDE the sidebar (with <code>controls</code>) cannot — pass
        its <code>aria-label</code>.
        Existing <code>aria-label</code>, <code>skipLinkLabel</code> and
        trigger <code>aria-label</code> props still override.
      </p>
      <pre className={PRE}>
        <code>{`import type { AppSidebarLabels } from "@/components/app-sidebar";

const tr: AppSidebarLabels = {
  navigation: "Ana gezinme",
  expandSidebar: "Kenar çubuğunu genişlet",
  collapseSidebar: "Kenar çubuğunu daralt",
  openNavigation: "Gezinmeyi aç",
  closeNavigation: "Gezinmeyi kapat",
  skipToContent: "İçeriğe geç",
  loading: "Gezinme öğeleri yükleniyor",
  userMenu: (name) => name + " — menüyü aç",
  itemWithBadge: (label, value) => label + ", " + value + " yeni",
  itemWithIndicator: (label) => label + ", yeni",
  emptyState: {
    "no-items": { title: "Öğe yok", body: "Gezinmeyi doldurmak için items verin." },
    "all-filtered-by-permission": { title: "Görünür öğe yok" },
    "all-hidden": { title: "Tüm öğeler gizli" },
    "all-filtered-by-loading": { title: "Öğe yok" },
  },
};

<AppSidebar items={items} currentPath={pathname} labels={tr} />`}</code>
      </pre>

      <h3 className={H3}>Badges: accessible names, formatting, withheld counts</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          A row whose badge is a number or string is named{" "}
          <code>labels.itemWithBadge(label, value)</code> — collapsed and
          expanded alike (the collapsed rail has no visible text, so the badge
          must be in the name). Dot and pulse badges use{" "}
          <code>labels.itemWithIndicator(label)</code>.
        </li>
        <li>
          <code>formatBadgeCount(value, max)</code> formats the visible count.
          Default: <code>&quot;{"{max}"}+&quot;</code> above <code>max</code>,
          otherwise <code>String(value)</code>.
        </li>
        <li>
          <code>badge: null</code> or <code>{"{ value: null }"}</code> means
          the count is withheld (privacy / permissions): nothing renders and
          the accessible name is the plain label. A zero also renders nothing
          unless <code>showZero</code>.
        </li>
        <li>
          Badge <code>tone</code> accepts <code>&quot;default&quot;</code> /{" "}
          <code>&quot;accent&quot;</code> / <code>&quot;destructive&quot;</code>{" "}
          / <code>&quot;muted&quot;</code> / <code>&quot;brand&quot;</code>;{" "}
          <code>activeTone</code> replaces it while the row is active.
        </li>
        <li>
          Presence dots use <code>--success</code> (online),{" "}
          <code>--warning</code> (away), <code>--destructive</code> (busy) and{" "}
          <code>--muted-foreground</code> (offline). The registry item
          declares fallbacks for <code>--success</code>, <code>--warning</code>{" "}
          and <code>--brand</code>; your theme values win.
        </li>
      </ul>
      <pre className={PRE}>
        <code>{`const nf = new Intl.NumberFormat("tr");
// Module scope or useMemo — keep the reference stable.
const formatTr = (value: number, max: number) =>
  value > max ? nf.format(max) + "+" : nf.format(value);

const items: NavItem[] = [
  {
    id: "chat",
    label: "Mesajlar",
    href: "/chat",
    badge: { value: 4, tone: "destructive", activeTone: "brand" },
  },
  { id: "inbox", label: "Gelen kutusu", href: "/inbox", badge: { value: null } }, // withheld
];

<AppSidebar items={items} currentPath={pathname} formatBadgeCount={formatTr} />`}</code>
      </pre>

      <h3 className={H3}>Theming with CSS variables</h3>
      <p className="text-muted-foreground">
        The sidebar sets a variable inline only for a prop you passed
        (<code>collapsedWidth</code>, <code>expandedWidth</code>,{" "}
        <code>transitionDuration</code>) or put in <code>style</code> /{" "}
        <code>drawerStyle</code>. Every read carries its default as a{" "}
        <code>var(--x, default)</code> fallback, so a declaration on any
        ancestor wins over the default, and an inline value wins over the
        ancestor. The drawer is portalled out of the tree; it copies the
        effective <code>--ilinxa-*</code> values from the in-tree wrapper when
        it opens. The full list is exported as{" "}
        <code>APP_SIDEBAR_CSS_VARS</code>.
      </p>
      <div className="mt-2 overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Variable</th>
              <th className="px-3 py-2 font-medium">Default</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {(
              [
                ["--ilinxa-sidebar-w-collapsed", "5rem"],
                ["--ilinxa-sidebar-w-expanded", "16rem"],
                ["--ilinxa-sidebar-transition-duration", "300ms"],
                ["--ilinxa-sidebar-drawer-w", "18rem"],
                ["--ilinxa-sidebar-bg", "var(--card)"],
                ["--ilinxa-sidebar-fg", "var(--foreground)"],
                ["--ilinxa-nav-row-radius", "var(--radius-lg)"],
                ["--ilinxa-nav-hover-bg", "var(--muted)"],
                ["--ilinxa-sidebar-border", "var(--border)"],
                ["--ilinxa-sidebar-row-h", "2.75rem"],
                ["--ilinxa-sidebar-row-gap", "0.25rem"],
                ["--ilinxa-sidebar-px", "0.75rem"],
                ["--ilinxa-nav-active-bg", "var(--primary)"],
                ["--ilinxa-nav-active-fg", "var(--primary-foreground)"],
                ["--ilinxa-nav-active-bar-w", "3px"],
                ["--ilinxa-nav-badge-size", "1.25rem"],
                ["--ilinxa-nav-badge-corner-size", "1rem"],
                ["--ilinxa-nav-badge-halo", "var(--card)"],
                ["--ilinxa-nav-indent-step", "0 (expanded rail only)"],
              ] as const
            ).map(([name, value]) => (
              <tr key={name} className="border-t border-border">
                <td className="px-3 py-1.5">{name}</td>
                <td className="px-3 py-1.5 text-muted-foreground">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-muted-foreground">
        Mapping onto the shadcn sidebar tokens, with the prototype-parity
        corner badge size:
      </p>
      <pre className={PRE}>
        <code>{`/* globals.css — or a wrapper's style prop */
.app-shell {
  --ilinxa-sidebar-bg: var(--sidebar);
  --ilinxa-sidebar-border: var(--sidebar-border);
  --ilinxa-nav-active-bg: var(--sidebar-primary);
  --ilinxa-nav-active-fg: var(--sidebar-primary-foreground);
  --ilinxa-nav-badge-corner-size: 1.25rem;
}`}</code>
      </pre>

      <h3 className={H3}>Drawer</h3>
      <p className="text-muted-foreground">
        Below <code>mobileBreakpoint</code> the sidebar becomes a Sheet. The
        drawer always renders full labels: brand label, inline-end badges, the
        full user footer and primary action, and render props receive{" "}
        <code>isCollapsed: false</code> even when the desktop rail is
        collapsed. Style it with <code>drawerClassName</code> and{" "}
        <code>drawerStyle</code>. <code>topSlot</code> may be a function of{" "}
        <code>{"{ mode, isCollapsed }"}</code>; inside any slot,{" "}
        <code>useAppSidebarMode()</code> returns{" "}
        <code>&quot;desktop&quot; | &quot;mobile&quot;</code> (or{" "}
        <code>null</code> outside the sidebar). The handle&apos;s{" "}
        <code>openMobile()</code> opens the drawer on any viewport (handy for demos); on a desktop viewport an item click does not auto-close it — auto-close is a mobile-viewport behaviour.
      </p>
      <pre className={PRE}>
        <code>{`import { AppSidebar, useAppSidebarMode } from "@/components/app-sidebar";

function ModeBadge() {
  const mode = useAppSidebarMode(); // "desktop" | "mobile" | null
  return <span>{mode}</span>;
}

<AppSidebar
  items={items}
  currentPath={pathname}
  topSlot={({ isCollapsed }) => (
    <AccountSwitcher
      items={switcherItems}
      activeKey={activeKey}
      onSelect={onSelect}
      isCollapsed={isCollapsed} // always false inside the drawer
    />
  )}
  drawerClassName="border-primary"
  drawerStyle={{ "--ilinxa-sidebar-drawer-w": "20rem" } as React.CSSProperties}
/>`}</code>
      </pre>

      <h3 className={H3}>Multi-tenant additions</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>topSlot</code> — slot above the brand row for an{" "}
          <code>AccountSwitcher</code>, governance bar or banner. Renders
          nothing when omitted.
        </li>
        <li>
          <code>hrefTemplateValues</code> — substitutes{" "}
          <code>&#123;key&#125;</code> placeholders in every{" "}
          <code>NavItem.href</code> (<code>{"{ slug: 'acme' }"}</code> turns{" "}
          <code>/biz/&#123;slug&#125;/team</code> into{" "}
          <code>/biz/acme/team</code>). <code>resolveHref(item, values)</code>{" "}
          wins when both are given; keep it a stable callback.
        </li>
        <li>
          <code>NavItem.ownerOnly</code> + <code>isOwner</code>, and{" "}
          <code>NavItem.minMembers</code> + <code>currentMaxMembers</code> —
          both gates must pass alongside <code>permission</code>.
        </li>
        <li>
          <code>bypassFiltering</code> skips all three gates at section and
          item level; <code>hidden: true</code> is still respected.{" "}
          <code>keepEmptySections</code> keeps a section whose items were all
          filtered out.
        </li>
        <li>
          <code>type NavContext</code> — type-only discriminated union for
          your URL-to-context derivation.
        </li>
      </ul>

      <h3 className={H3}>Headless: useAppSidebarState and useFilteredNavSections</h3>
      <p className="text-muted-foreground">
        <code>useAppSidebarState</code> lifts the sidebar state so other
        components (a header trigger, a command palette) can read and drive it;
        pass the result as <code>state</code>. It forwards the same gate
        options as the component: <code>isOwner</code> (default{" "}
        <code>false</code>), <code>currentMaxMembers</code> (default{" "}
        <code>Infinity</code>), <code>bypassFiltering</code> and{" "}
        <code>keepEmptySections</code>.{" "}
        <code>useFilteredNavSections({"{ sections, permissions?, isOwner?, currentMaxMembers?, bypassFiltering? }"})</code>{" "}
        is the pure filter helper, usable without <code>&lt;AppSidebar&gt;</code>.
      </p>
      <pre className={PRE}>
        <code>{`const state = useAppSidebarState({
  items,
  currentPath: pathname,
  storageKey: "app-sidebar",
  isOwner,
  currentMaxMembers: plan.seats,
  bypassFiltering: false,
  keepEmptySections: false,
});

<AppSidebar items={items} currentPath={pathname} state={state} isOwner={isOwner} currentMaxMembers={plan.seats} />`}</code>
      </pre>

      <h3 className={H3}>Collapse-aware composition</h3>
      <p className="text-muted-foreground">
        A slotted <code>&lt;AccountSwitcher&gt;</code> is not viewport-aware on
        its own. Either lift the collapsed state and pass it to both, or use
        the function form of <code>topSlot</code> shown above, which receives
        the right value in the rail and in the drawer. Full recipe in{" "}
        <code>account-switcher-procomp-guide.md</code> §4.6.
      </p>
    </div>
  );
}
