"use client";

import { useMemo, useState } from "react";
import { Plus, Building2, User } from "lucide-react";
import { AccountSwitcher01 } from "./account-switcher-01";
import {
  ACCOUNT_SWITCHER_01_DUMMY_ACTIVE_KEY,
  ACCOUNT_SWITCHER_01_DUMMY_FALLBACK,
  ACCOUNT_SWITCHER_01_DUMMY_ITEMS,
} from "./dummy-data";
import type { SwitcherItem } from "./types";

const TAB_KEYS = ["sidebar", "topbar", "collapsed", "fallback", "controlled"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  sidebar: "In a sidebar",
  topbar: "Standalone in topbar",
  collapsed: "Collapsed mode",
  fallback: "Fallback active item",
  controlled: "Controlled open",
};

export default function AccountSwitcher01Demo() {
  const [tab, setTab] = useState<TabKey>("sidebar");
  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex flex-wrap gap-1 border-b border-border pb-1">
        {TAB_KEYS.map((key) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={
              tab === key
                ? "rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
                : "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent/40"
            }
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-6">
        {tab === "sidebar" && <SidebarDemo />}
        {tab === "topbar" && <TopbarDemo />}
        {tab === "collapsed" && <CollapsedDemo />}
        {tab === "fallback" && <FallbackDemo />}
        {tab === "controlled" && <ControlledDemo />}
      </div>
    </div>
  );
}

function SelectionLog({
  selected,
  setSelected,
}: {
  selected: string | null;
  setSelected: (key: string) => void;
}) {
  const handleSelect = (item: SwitcherItem) => setSelected(item.key);
  return { handleSelect, selected };
}

function SidebarDemo() {
  const [activeKey, setActiveKey] = useState<string>(
    ACCOUNT_SWITCHER_01_DUMMY_ACTIVE_KEY ?? "personal",
  );
  return (
    <div className="flex gap-6">
      <div className="flex w-64 flex-col gap-3 rounded-lg border border-border bg-card p-3">
        <AccountSwitcher01
          items={ACCOUNT_SWITCHER_01_DUMMY_ITEMS}
          activeKey={activeKey}
          onSelect={(item) => setActiveKey(item.key)}
          footerSlot={
            <button
              type="button"
              className="inline-flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent"
            >
              <Plus className="h-4 w-4" />
              <span>Create new business</span>
            </button>
          }
        />
        <div className="text-xs text-muted-foreground">
          (other sidebar nav rows would render below)
        </div>
      </div>
      <div className="flex-1 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">Canonical use:</p>
        <p>Mount the switcher inside a sidebar shell — it occupies the &ldquo;top zone&rdquo; (above the brand row in <code>rich-sidebar</code> v0.2.0&apos;s upcoming <code>topSlot</code>). Footer slot is the consumer-owned escape hatch for &ldquo;Create new&rdquo; / &ldquo;Request access&rdquo; / multi-state state machines.</p>
        <p className="mt-3">Active key: <code>{activeKey}</code></p>
      </div>
    </div>
  );
}

function TopbarDemo() {
  const [activeKey, setActiveKey] = useState<string>("biz-acme");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3 text-sm font-medium text-foreground">
          <span className="text-base">○ MyApp</span>
        </div>
        <div className="w-60">
          <AccountSwitcher01
            items={ACCOUNT_SWITCHER_01_DUMMY_ITEMS}
            activeKey={activeKey}
            onSelect={(item) => setActiveKey(item.key)}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>Account</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Standalone in a topbar — no sidebar required. The switcher is just a primitive; consumers
        slot it wherever a &ldquo;current context + switchable other contexts&rdquo; UI fits.
      </p>
    </div>
  );
}

function CollapsedDemo() {
  const [activeKey, setActiveKey] = useState<string>("biz-acme");
  return (
    <div className="flex gap-6">
      <div className="flex w-16 flex-col items-center gap-3 rounded-lg border border-border bg-card p-2">
        <AccountSwitcher01
          items={ACCOUNT_SWITCHER_01_DUMMY_ITEMS}
          activeKey={activeKey}
          onSelect={(item) => setActiveKey(item.key)}
          isCollapsed
          aria-label="Switch workspace"
          footerSlot={
            <button
              type="button"
              className="inline-flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent"
            >
              <Plus className="h-4 w-4" />
              <span>Create new</span>
            </button>
          }
        />
        <div className="h-px w-full bg-border" />
        <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span className="rotate-90 text-[10px]">⋯</span>
        </div>
      </div>
      <div className="flex-1 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        <p className="mb-2 font-medium text-foreground">Icon-only trigger (L10):</p>
        <p>
          When <code>isCollapsed</code> is true, the trigger renders as a 40×40 square. The popover
          opens to the side (default <code>&quot;right&quot;</code>; override via <code>collapsedPopoverSide</code>).
          List rows + footer slot still render the full content; only positioning + width differ.
        </p>
        <p className="mt-3">Active key: <code>{activeKey}</code></p>
      </div>
    </div>
  );
}

function FallbackDemo() {
  const [activeKey, setActiveKey] = useState<string | null>("not-in-list");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 text-sm">
        <label htmlFor="active-key-input" className="font-medium text-foreground">
          activeKey:
        </label>
        <input
          id="active-key-input"
          type="text"
          value={activeKey ?? ""}
          onChange={(e) => setActiveKey(e.target.value || null)}
          className="w-48 rounded-md border border-border bg-card px-2 py-1 font-mono text-xs"
        />
        <span className="text-xs text-muted-foreground">
          (try blank, &quot;personal&quot;, or any unmatched string)
        </span>
      </div>
      <div className="max-w-sm">
        <AccountSwitcher01
          items={ACCOUNT_SWITCHER_01_DUMMY_ITEMS}
          activeKey={activeKey}
          onSelect={(item) => setActiveKey(item.key)}
          fallbackActiveItem={ACCOUNT_SWITCHER_01_DUMMY_FALLBACK}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        I-1: when <code>activeKey</code> doesn&apos;t resolve to an item, the trigger shows the
        explicit <code>fallbackActiveItem</code> instead of mis-labeling (the source&apos;s
        governance-as-Personal bug). Demonstrates the priority pipeline:
        <code> match → fallback → items[0] → empty</code>.
      </p>
    </div>
  );
}

function ControlledDemo() {
  const [open, setOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string>("biz-acme");
  const events = useMemo(() => [] as string[], []);
  const [log, setLog] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Open programmatically
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:bg-accent"
        >
          Close programmatically
        </button>
        <span className="text-xs text-muted-foreground">
          open: <code>{String(open)}</code>
        </span>
      </div>
      <div className="max-w-sm">
        <AccountSwitcher01
          items={ACCOUNT_SWITCHER_01_DUMMY_ITEMS}
          activeKey={activeKey}
          onSelect={(item) => {
            setActiveKey(item.key);
            setLog((prev) => [...prev, `onSelect: ${item.key}`].slice(-6));
          }}
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            setLog((prev) => [...prev, `onOpenChange: ${next}`].slice(-6));
          }}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        L13: controlled-open triplet (<code>open</code> / <code>defaultOpen</code> /
        <code> onOpenChange</code>) ships from v0.1 per the dynamicity-primacy rule. Consumers
        wire Cmd+K openers, onboarding flows, test harnesses without waiting for v0.2.
      </p>
      <div className="rounded-md bg-muted p-3 font-mono text-xs">
        {log.length === 0 ? (
          <span className="text-muted-foreground">(events appear here)</span>
        ) : (
          log.map((line, i) => (
            <div key={`${i}-${line}`}>{line}</div>
          ))
        )}
        {events.length > 0 ? null : null}
      </div>
    </div>
  );
}
