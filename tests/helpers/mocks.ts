/**
 * jsdom stubs for what registry components need and jsdom does not implement
 * (consumer contract C11 / Part 1 R9). Every installer returns a `restore()`
 * function; call it in `afterEach` (or use the contract kit, which does).
 */

import { vi } from "vitest";

type Restore = () => void;

/** `window.matchMedia` answering `prefers-reduced-motion` and pointer / hover queries. */
export function mockMatchMedia({
  reducedMotion = false,
  pointer = "fine",
}: { reducedMotion?: boolean; pointer?: "fine" | "coarse" | "none" } = {}): Restore {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => {
    const q = query.replace(/\s+/g, "");
    const matches =
      (q.includes("prefers-reduced-motion:reduce") && reducedMotion) ||
      (q.includes("pointer:fine") && pointer === "fine") ||
      (q.includes("pointer:coarse") && pointer === "coarse") ||
      (q.includes("hover:hover") && pointer === "fine");
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}

/** A `ResizeObserver` that calls back once on observe (with the element's current box). */
export function mockResizeObserver(): Restore {
  const original = globalThis.ResizeObserver;
  class StubResizeObserver {
    constructor(private readonly callback: ResizeObserverCallback) {}
    observe(target: Element) {
      this.callback([{ target, contentRect: target.getBoundingClientRect() } as ResizeObserverEntry], this as unknown as ResizeObserver);
    }
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = StubResizeObserver as unknown as typeof ResizeObserver;
  return () => {
    globalThis.ResizeObserver = original;
  };
}

/** An `IntersectionObserver` reporting every observed element as visible (or not). */
export function mockIntersectionObserver({ visible = true }: { visible?: boolean } = {}): Restore {
  const original = globalThis.IntersectionObserver;
  class StubIntersectionObserver {
    readonly root = null;
    readonly rootMargin = "0px";
    readonly thresholds = [0];
    constructor(private readonly callback: IntersectionObserverCallback) {}
    observe(target: Element) {
      this.callback(
        [{ target, isIntersecting: visible, intersectionRatio: visible ? 1 : 0 } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  globalThis.IntersectionObserver = StubIntersectionObserver as unknown as typeof IntersectionObserver;
  return () => {
    globalThis.IntersectionObserver = original;
  };
}

/**
 * Layout numbers jsdom reports as 0 / "": `scrollHeight`, `clientHeight`, `clientWidth`,
 * `scrollWidth` on every element, and the computed `lineHeight`.
 */
export function mockLayout({
  scrollHeight,
  clientHeight,
  scrollWidth,
  clientWidth,
  lineHeight,
}: {
  scrollHeight?: number;
  clientHeight?: number;
  scrollWidth?: number;
  clientWidth?: number;
  lineHeight?: string;
}): Restore {
  const restores: Restore[] = [];
  const define = (key: string, value: number | undefined) => {
    if (value === undefined) return;
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, key);
    Object.defineProperty(HTMLElement.prototype, key, { configurable: true, get: () => value });
    restores.push(() => {
      if (original) Object.defineProperty(HTMLElement.prototype, key, original);
      else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
    });
  };
  define("scrollHeight", scrollHeight);
  define("clientHeight", clientHeight);
  define("scrollWidth", scrollWidth);
  define("clientWidth", clientWidth);
  if (lineHeight !== undefined) {
    const original = window.getComputedStyle;
    window.getComputedStyle = ((el: Element, pseudo?: string | null) => {
      const style = original.call(window, el, pseudo);
      return new Proxy(style, {
        get: (target, prop) => {
          if (prop === "lineHeight") return lineHeight;
          if (prop === "getPropertyValue") {
            return (name: string) => (name === "line-height" ? lineHeight : target.getPropertyValue(name));
          }
          const value = Reflect.get(target, prop);
          return typeof value === "function" ? value.bind(target) : value;
        },
      });
    }) as typeof window.getComputedStyle;
    restores.push(() => {
      window.getComputedStyle = original;
    });
  }
  return () => restores.reverse().forEach((r) => r());
}

/**
 * A stand-in for an Embla carousel API. Use it from a module mock, because `vi.mock` must
 * be hoisted in the test file:
 *
 *   const h = vi.hoisted(() => ({ api: null as unknown }));
 *   vi.mock("embla-carousel-react", () => ({ default: () => [() => {}, h.api] }));
 *   beforeEach(() => { h.api = createEmblaApi({ snaps: 5 }); });
 */
export function createEmblaApi({ snaps = 3, progress = 0, inView = [0] }: { snaps?: number; progress?: number; inView?: number[] } = {}) {
  const handlers: Record<string, Array<() => void>> = {};
  const api = {
    on(event: string, fn: () => void) {
      (handlers[event] ??= []).push(fn);
      return api;
    },
    off(event: string, fn: () => void) {
      handlers[event] = (handlers[event] ?? []).filter((h) => h !== fn);
      return api;
    },
    emit(event: string) {
      for (const fn of handlers[event] ?? []) fn();
    },
    scrollSnapList: () => Array.from({ length: snaps }, (_, i) => i / Math.max(1, snaps - 1)),
    scrollProgress: () => progress,
    slidesInView: () => inView,
    selectedScrollSnap: () => 0,
    canScrollPrev: () => progress > 0,
    canScrollNext: () => progress < 1,
    // spies, so a test can assert the component asked to scroll
    scrollTo: vi.fn<(index: number, jump?: boolean) => void>(),
    scrollNext: vi.fn<() => void>(),
    scrollPrev: vi.fn<() => void>(),
  };
  return api;
}
