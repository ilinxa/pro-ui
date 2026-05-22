export default function RichSidebarUsage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">Status</h3>
      <p className="text-muted-foreground">
        C1 (scaffold + types) landed. Items + collapse + drawer + slots roll
        out across C2–C13. The full <code>RichSidebarProps</code> surface is
        already typed — your call sites compile against the final shape now.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>RichSidebar</code> for any desktop app shell that
        needs a collapsible left (or right) navigation column with a mobile
        drawer fallback. Replaces the per-app reinvention of: collapse +
        sections + badges + tooltips-on-collapsed + permission gating +
        localStorage persist + reduced-motion + WAI-ARIA.
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Basic example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { RichSidebar, type NavItem } from "@ilinxa/rich-sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";

const items: NavItem[] = [
  { id: "home", label: "Home", href: "/" },
  { id: "inbox", label: "Inbox", href: "/inbox", badge: 12 },
];

export function AppShell({ children }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen">
      <RichSidebar
        items={items}
        currentPath={pathname}
        linkComponent={({ href, children, ...rest }) => (
          <Link href={href} {...rest}>{children}</Link>
        )}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Key props</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>items</code> — accepts flat <code>NavItem[]</code> OR mixed{" "}
          <code>NavEntry[]</code> (items / sections / separators)
        </li>
        <li>
          <code>currentPath</code> + optional <code>isActive</code> predicate
          drive active-row detection (registry-portable — no router coupling)
        </li>
        <li>
          <code>linkComponent</code> — pass your router&apos;s link primitive
          (default <code>&lt;a href&gt;</code>)
        </li>
        <li>
          <code>storageKey</code> opt-in localStorage persist of collapse +
          section-collapse state
        </li>
        <li>
          <code>activeVariant</code> — <code>&quot;fill&quot;</code> (default)
          / <code>&quot;left-bar&quot;</code> / <code>&quot;right-bar&quot;</code>{" "}
          / <code>&quot;outline&quot;</code> / <code>&quot;subtle&quot;</code>
        </li>
      </ul>

      <p className="mt-6 italic text-muted-foreground">
        Full prop documentation lands with C14 (final demo + usage). Until
        then this page demonstrates only the C1 placeholder rendering.
      </p>
    </div>
  );
}
