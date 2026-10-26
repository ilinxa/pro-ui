import { EntityPicker } from "../entity-picker";
import type { EntityLike, EntityPickerProps } from "../types";

/** jsdom lacks what the popover and cmdk need (ResizeObserver, pointer capture, scrollIntoView). */
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

export interface Ent extends EntityLike {
  description?: string;
}

export const ITEMS: Ent[] = [
  { id: "a", label: "Alpha", kind: "person" },
  { id: "b", label: "Bravo", kind: "project" },
  { id: "c", label: "Charlie", kind: "person" },
];

export const KINDS = {
  person: { label: "Person" },
  project: { label: "Project" },
};

export const TR_ITEMS: Ent[] = [
  { id: "ist", label: "İstanbul" },
  { id: "ank", label: "Ankara" },
];

export const AR_ITEMS: Ent[] = [
  { id: "a", label: "القاهرة" },
  { id: "b", label: "الرياض" },
];

/** Single-mode picker, closed value null; callers merge props over these defaults. */
export function Single(props: Partial<EntityPickerProps<Ent>> = {}) {
  return (
    <EntityPicker<Ent>
      items={ITEMS}
      value={null}
      onChange={() => {}}
      {...(props as object)}
    />
  );
}

export function Multi(props: Partial<EntityPickerProps<Ent>> = {}) {
  return (
    <EntityPicker<Ent>
      mode="multi"
      items={ITEMS}
      value={[]}
      onChange={() => {}}
      {...(props as object)}
    />
  );
}

/** The portaled popover content. */
export function popoverContent(): HTMLElement {
  const el = document.body.querySelector<HTMLElement>('[data-slot="popover-content"]');
  if (!el) throw new Error("popover content not rendered");
  return el;
}

export function list(): HTMLElement {
  const el = document.body.querySelector<HTMLElement>("[cmdk-list]");
  if (!el) throw new Error("list not rendered");
  return el;
}
