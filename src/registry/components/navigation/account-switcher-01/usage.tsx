export default function AccountSwitcher01Usage() {
  return (
    <div className="prose-sm flex max-w-none flex-col gap-6 text-sm leading-relaxed text-foreground">
      <section>
        <h3 className="mb-2 mt-0 text-base font-semibold">When to use</h3>
        <p className="text-muted-foreground">
          Reach for <code>AccountSwitcher01</code> any time the UI needs a &ldquo;current X +
          switchable other X&apos;s&rdquo; affordance — workspace pickers, multi-account
          dropdowns, governance/context mode switchers, sub-account selectors. The library
          renders; consumers derive <code>items</code>, <code>activeKey</code>, and footer
          content outside.
        </p>
      </section>

      <section>
        <h3 className="mb-2 mt-0 text-base font-semibold">Pattern 1 — Basic</h3>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`import { AccountSwitcher01 } from "@/components/account-switcher-01";
import { Building2, User } from "lucide-react";

function Example() {
  const [activeKey, setActiveKey] = useState("biz-acme");

  return (
    <AccountSwitcher01
      items={[
        { key: "personal", label: "Personal", icon: User },
        { key: "biz-acme", label: "Acme Corp", icon: Building2, href: "/biz/acme" },
      ]}
      activeKey={activeKey}
      onSelect={(item) => {
        setActiveKey(item.key);
        if (item.href) router.push(item.href);
      }}
    />
  );
}`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 mt-0 text-base font-semibold">Pattern 2 — Footer slot with create affordance</h3>
        <p className="mb-2 text-muted-foreground">
          The <code>footerSlot</code> is arbitrary content separated from the items list by a
          divider. Consumers can render simple buttons or multi-state state machines
          (e.g., 6-state &ldquo;Request access / Pending review / Available in 3 days&rdquo;
          widgets).
        </p>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`<AccountSwitcher01
  items={items}
  activeKey={activeKey}
  onSelect={onSelect}
  footerSlot={
    canCreate ? (
      <Button onClick={openCreateDialog}>
        <Plus className="mr-2 h-4 w-4" /> Create Business
      </Button>
    ) : (
      <RequestAccessButton />
    )
  }
/>`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 mt-0 text-base font-semibold">Pattern 3 — Controlled-open state</h3>
        <p className="mb-2 text-muted-foreground">
          Wire <code>open</code> / <code>onOpenChange</code> to open the popover from a keyboard
          shortcut, tutorial flow, or test harness. <code>onOpenChange</code> is F-cross-13
          typeof-guarded internally — consumers always receive <code>boolean</code>.
        </p>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`const [open, setOpen] = useState(false);

useHotkeys("mod+k", () => setOpen(true));

<AccountSwitcher01
  items={items}
  activeKey={activeKey}
  onSelect={onSelect}
  open={open}
  onOpenChange={setOpen}
/>`}</code>
        </pre>
        <p className="mt-2 text-xs text-muted-foreground">
          Dev-warns fire if you flip between controlled (<code>open=false</code>) and uncontrolled
          (<code>open=undefined</code>) mid-life, or if you pass <code>open</code> without
          <code>onOpenChange</code> (popover would freeze).
        </p>
      </section>

      <section>
        <h3 className="mb-2 mt-0 text-base font-semibold">Pattern 4 — Collapsed (icon-only) trigger</h3>
        <p className="mb-2 text-muted-foreground">
          When slotted into a collapsed icon-only sidebar (e.g., <code>rich-sidebar</code>&apos;s
          collapse mode), pass <code>isCollapsed</code> to render a 40×40 square trigger.
          The popover content still shows full labels.
        </p>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`<AccountSwitcher01
  items={items}
  activeKey={activeKey}
  onSelect={onSelect}
  isCollapsed={sidebarIsCollapsed}
  collapsedPopoverSide="right"   // default; flip to "left" on right-edge sidebars
/>`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 mt-0 text-base font-semibold">Pattern 5 — Fallback label for un-resolved active key</h3>
        <p className="mb-2 text-muted-foreground">
          If <code>activeKey</code> doesn&apos;t resolve to any item (async loading, route mismatch,
          governance context), <code>fallbackActiveItem</code> takes over so the trigger never
          mis-labels.
        </p>
        <pre className="overflow-x-auto rounded-md border border-border bg-muted p-4 font-mono text-xs">
          <code>{`<AccountSwitcher01
  items={items}
  activeKey={derivedKey}
  fallbackActiveItem={{ key: "fallback", label: "Select workspace", icon: User }}
  onSelect={onSelect}
/>`}</code>
        </pre>
      </section>

      <section>
        <h3 className="mb-2 mt-0 text-base font-semibold">Notes</h3>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>
            Items must have unique <code>key</code>s. The library dev-warns + strips duplicates;
            React would also key-warn but you get our message first.
          </li>
          <li>
            Active-item clicks are a no-op (L6). The library closes the popover but does NOT
            fire <code>onSelect</code> when the active item is clicked. Consumer re-affirmation
            requires wrapping <code>onSelect</code>.
          </li>
          <li>
            Permissions/gating live OUTSIDE the library — pre-filter your <code>items</code>
            array based on roles, memberships, plan tiers.
          </li>
          <li>
            Sibling: <code>rich-sidebar</code> v0.2.0 mounts this primitive in its{" "}
            <code>topSlot</code>. Zero hard dep — works standalone everywhere.
          </li>
        </ul>
      </section>
    </div>
  );
}
