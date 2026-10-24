import { Building2, User } from "lucide-react";
import { AccountSwitcher } from "../account-switcher";
import type { AccountSwitcherProps, SwitcherItem } from "../types";

/** jsdom lacks what Radix Popover needs (ResizeObserver, pointer capture). Returns a restore function. */
export function installDomStubs(): () => void {
  const originalRO = globalThis.ResizeObserver;
  class StubResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = StubResizeObserver as unknown as typeof ResizeObserver;
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  const saved = {
    setPointerCapture: proto.setPointerCapture,
    releasePointerCapture: proto.releasePointerCapture,
    hasPointerCapture: proto.hasPointerCapture,
    scrollIntoView: proto.scrollIntoView,
  };
  proto.setPointerCapture = () => {};
  proto.releasePointerCapture = () => {};
  proto.hasPointerCapture = () => false;
  proto.scrollIntoView = () => {};
  return () => {
    globalThis.ResizeObserver = originalRO;
    Object.assign(proto, saved);
  };
}

/** The platform's shape: personal / businesses / platform console, avatar + name + one-line description. */
export const ITEMS: SwitcherItem[] = [
  { key: "me", label: "Ayşe", description: "@ayse", icon: User, group: "personal" },
  { key: "acme", label: "Acme", description: "Owner", icon: Building2, group: "business" },
  { key: "globex", label: "Globex", description: "Editor", icon: Building2, group: "business" },
  { key: "console", label: "Console", description: "Staff", group: "platform" },
];

export const GROUPS = [
  { id: "personal", label: "Personal" },
  { id: "business", label: "Businesses" },
  { id: "platform", label: "Platform" },
];

export const FLAT_ITEMS: SwitcherItem[] = ITEMS.map(({ key, label, description, icon }) => ({
  key,
  label,
  description,
  icon,
}));

export const AR_ITEMS: SwitcherItem[] = [
  { key: "me", label: "سارة", icon: User },
  { key: "qahwa", label: "مقهى الزاوية", icon: Building2 },
];

export function Switcher(props: Partial<AccountSwitcherProps>) {
  return <AccountSwitcher items={FLAT_ITEMS} activeKey="acme" onSelect={() => {}} {...props} />;
}

/** The portaled popover content (Radix renders it as role="dialog"). */
export function popoverContent(): HTMLElement {
  const el = document.body.querySelector<HTMLElement>('[data-slot="popover-content"]');
  if (!el) throw new Error("popover content not rendered");
  return el;
}
