import { vi } from "vitest";
import type { EngagementReactionKind } from "../types";

/** jsdom lacks what Radix Popover + pointer capture need. Returns a restore function. */
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

export interface Deferred<T = void> {
  promise: Promise<T>;
  resolve: (v: T) => void;
  reject: (e?: unknown) => void;
}
export function deferred<T = void>(): Deferred<T> {
  let resolve!: (v: T) => void;
  let reject!: (e?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export const KINDS: EngagementReactionKind[] = [
  { key: "love", icon: "L", label: "Love", count: 5 },
  { key: "laugh", icon: "H", label: "Laugh", count: 3 },
  { key: "wow", icon: "W", label: "Wow", count: 1500 },
];

/** A manually-driven `subscribe`. */
export function makeSubscribe<T>() {
  let handler: ((d: T) => void) | null = null;
  const subscribe = vi.fn((h: (d: T) => void) => {
    handler = h;
    return () => {
      handler = null;
    };
  });
  return { subscribe, emit: (d: T) => handler?.(d) };
}
