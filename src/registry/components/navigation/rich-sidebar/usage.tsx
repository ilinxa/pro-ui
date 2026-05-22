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

      <h3 className="mb-2 mt-6 text-base font-semibold">v0.2.0 — additions</h3>
      <p className="text-muted-foreground">
        v0.2.0 is strictly additive on v0.1 — every existing consumer compiles
        unchanged. New surface unlocks multi-tenant SaaS shells:
      </p>
      <ul className="ml-5 mt-2 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>topSlot</code> — single slot ABOVE the brand row for an
          <code> AccountSwitcher01</code> / governance bar / status banner.
          Renders nothing when omitted (zero layout shift vs v0.1).
        </li>
        <li>
          <code>hrefTemplateValues</code> — map of <code>&#123;key&#125;</code>{" "}
          placeholders substituted in every <code>NavItem.href</code>. e.g.
          {" "}<code>{"{ slug: 'acme' }"}</code> turns <code>/biz/&#123;slug&#125;/team</code>{" "}
          into <code>/biz/acme/team</code>.
        </li>
        <li>
          <code>resolveHref(item, values)</code> — escape-hatch callback;
          wins precedence over the built-in substitution. Use for subdomain
          rewrites / locale prefixes / conditional sub-paths. Should be a
          stable <code>useCallback</code>.
        </li>
        <li>
          <code>NavItem.ownerOnly</code> + sidebar prop <code>isOwner</code>{" "}
          — hides the item unless <code>isOwner</code> is true. Pairs with the
          existing <code>permission</code> gate; both must pass (intersection).
        </li>
        <li>
          <code>NavItem.minMembers</code> + sidebar prop{" "}
          <code>currentMaxMembers</code> — hides the item unless plan-tier seat
          capacity meets the threshold. Useful for &ldquo;Members tab only on
          plans with ≥N seats&rdquo;.
        </li>
        <li>
          <code>bypassFiltering</code> — when true, skips ALL permission gates
          (permission ∩ ownerOnly ∩ minMembers) at BOTH section + item levels.
          <code> hidden: true</code> is still respected.
        </li>
        <li>
          <code>useFilteredNavSections({"{ sections, permissions?, isOwner?, currentMaxMembers?, bypassFiltering? }"})</code>{" "}
          — pure helper hook returning the filtered <code>NavEntry[]</code>.
          NOT coupled to <code>&lt;RichSidebar&gt;</code> — render your own
          arbitrary sidebar UI with this hook standalone.
        </li>
        <li>
          <code>type NavContext</code> — exported discriminated union covering
          personal / business / platform / governance / cms-platform /
          cms-business. Type-only; use it to type your URL→context derivation.
          (Library does NOT ship <code>useNavContext</code> — that&apos;s your
          router&apos;s concern.)
        </li>
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Composition recipe — drop <code>&lt;AccountSwitcher01&gt;</code> into{" "}
        <code>topSlot</code>; thread the current context&apos;s slug into{" "}
        <code>hrefTemplateValues</code>; pass <code>isOwner</code> +{" "}
        <code>currentMaxMembers</code> from your auth store. Zero hard registry
        dep between rich-sidebar and account-switcher-01.
      </p>
    </div>
  );
}
