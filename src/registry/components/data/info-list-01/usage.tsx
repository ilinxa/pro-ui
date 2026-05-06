export default function InfoList01Usage() {
  return (
    <div className="max-w-none text-sm leading-relaxed text-foreground">
      <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
      <p className="text-muted-foreground">
        Reach for <code>InfoList01</code> for sidebar info cards on detail
        pages — Event Details, Contact Info, Address, Account Settings,
        Product Specs, Restaurant Info, Listing Attributes. Two visual
        flavors: <code>comfortable</code> (stacked primary / secondary /
        action with separators between rows) and <code>compact</code>
        (inline single-line rows, no separators).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Minimal example</h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import { InfoList01 } from "@/registry/components/data/info-list-01";
import { Calendar, MapPin, Users } from "lucide-react";

<InfoList01
  heading="Event Details"
  variant="comfortable"
  items={[
    { id: "date", icon: Calendar, primary: "May 31, 2026", secondary: "09:00 - 18:00" },
    { id: "loc",  icon: MapPin,   primary: "Istanbul Conference Center", secondary: "Şişli/Istanbul" },
    { id: "cap",  icon: Users,    primary: "500-person capacity", secondary: "423 registered" },
  ]}
/>;`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Two variants</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>comfortable</code> — stacked content (primary bold +
          secondary muted + optional action). Icon{" "}
          <code>w-5 h-5 text-primary</code>. Separators between rows by
          default. Use for sidebar info cards with rich per-row content.
        </li>
        <li>
          <code>compact</code> — inline single-line rows. Icon{" "}
          <code>w-4 h-4 text-muted-foreground</code>. No separators by
          default. Use for contact lists, footer columns, dense info
          summaries. <strong>Compact ignores <code>secondary</code> and{" "}
          <code>action</code></strong> — they imply a richer row than the
          variant supports.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Linked rows</h3>
      <p className="text-muted-foreground">
        Pass <code>href</code> per item to wrap <code>primary</code> in the
        polymorphic <code>linkComponent</code>. Consumer passes full URLs —
        no auto-prefixing for <code>tel:</code> / <code>mailto:</code>.
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<InfoList01
  variant="compact"
  items={[
    { id: "phone", icon: Phone, primary: "+90 (212) 555 0123", href: "tel:+902125550123" },
    { id: "email", icon: Mail,  primary: "info@example.com",   href: "mailto:info@example.com" },
  ]}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Action slot</h3>
      <p className="text-muted-foreground">
        Comfortable rows can render an <code>action</code> ReactNode below
        the secondary line — typically a link button (e.g. &quot;View on
        map&quot;):
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`{
  id: "location",
  icon: MapPin,
  primary: event.location,
  secondary: event.address,
  action: (
    <Button variant="link" className="px-0 h-auto">
      View on map <ExternalLink className="w-3 h-3" />
    </Button>
  ),
}`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">
        Polymorphic <code>linkComponent</code>
      </h3>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`import NextLink from "next/link";

<InfoList01
  variant="compact"
  linkComponent={NextLink}
  items={[
    { id: "profile", icon: User, primary: "View profile", href: "/profile" },
  ]}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Custom renderItem</h3>
      <p className="text-muted-foreground">
        Bypass the default row layout entirely with{" "}
        <code>renderItem(item)</code> — useful for swapping icon for an
        avatar, embedding a status badge, or any non-icon row anatomy:
      </p>
      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
        <code>{`<InfoList01
  items={items}
  renderItem={(item) => (
    <div className="flex items-center gap-3">
      <Avatar src={people[item.id].image} />
      <div>
        <p className="font-medium">{item.primary}</p>
        <p className="text-sm text-muted-foreground">{item.secondary}</p>
      </div>
    </div>
  )}
/>`}</code>
      </pre>

      <h3 className="mb-2 mt-6 text-base font-semibold">Frame + separators</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          <code>framed: true</code> (default) — card chrome (
          <code>bg-card rounded-2xl p-6 border</code>). Pass{" "}
          <code>framed=&#123;false&#125;</code> for embedded use inside an
          existing card.
        </li>
        <li>
          <code>separated</code> — auto-defaults per variant: comfortable=
          <code>true</code>, compact=<code>false</code>. CSS top-border on
          each row except the first; override by passing the prop.
        </li>
      </ul>

      <h3 className="mb-2 mt-6 text-base font-semibold">Empty state</h3>
      <p className="text-muted-foreground">
        Empty <code>items</code> array → renders <code>emptyState</code> if
        provided, else <code>&lt;p role=&quot;status&quot;&gt;</code>{" "}
        with <code>labels.emptyText</code> (default &quot;No
        information.&quot;).
      </p>

      <h3 className="mb-2 mt-6 text-base font-semibold">Notes</h3>
      <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
        <li>
          Renders <code>&lt;ul role=&quot;list&quot;&gt;</code>; section{" "}
          <code>aria-labelledby</code> resolves to the heading id (via{" "}
          <code>useId</code>) when heading is supplied.
        </li>
        <li>
          Decorative icons are <code>aria-hidden=&quot;true&quot;</code>;
          link&apos;s accessible name is the visible <code>primary</code>{" "}
          text.
        </li>
        <li>
          Heading defaults to <code>h3</code> (sidebar info cards typically
          nest under page <code>h2</code>). Bump via{" "}
          <code>headingAs=&quot;h2&quot;</code> when standalone.
        </li>
      </ul>
    </div>
  );
}
