/**
 * Shared test kit for MediaCarousel: a controllable fake Embla (installed per test file with
 * `vi.mock("embla-carousel-react", …)` → `embla.hook`) and small DOM helpers.
 *
 * The fake exposes exactly the surface the component calls: on / off ("select", "settle"),
 * selectedScrollSnap, scrollTo, scrollPrev, scrollNext. Like real Embla, `scrollTo` / `scrollPrev`
 * / `scrollNext` move the selected snap and fire "select"; `swipe(i)` is a user drag landing on
 * snap `i`; `settle()` fires "settle".
 */
import { act } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { vi } from "vitest";
import type { MediaItem } from "../types";

export interface SeenOptions {
  direction?: string;
  startIndex?: number;
  loop?: boolean;
  align?: string;
  containScroll?: string;
}

export interface FakeEmbla {
  snap: number;
  total: number;
  started: boolean;
  handlers: Record<string, Array<() => void>>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  selectedScrollSnap: ReturnType<typeof vi.fn>;
  scrollTo: ReturnType<typeof vi.fn>;
  scrollPrev: ReturnType<typeof vi.fn>;
  scrollNext: ReturnType<typeof vi.fn>;
  emit: (event: string) => void;
  /** A user drag that lands on snap `i` (fires "select" inside act). */
  swipe: (i: number) => void;
  /** Fire "settle" inside act. */
  settle: () => void;
}

export function makeFakeEmbla(total = 5): FakeEmbla {
  const api: FakeEmbla = {
    snap: 0,
    total,
    started: false,
    handlers: {},
    on: vi.fn((evt: string, fn: () => void) => {
      (api.handlers[evt] ??= []).push(fn);
      return api;
    }),
    off: vi.fn((evt: string, fn: () => void) => {
      api.handlers[evt] = (api.handlers[evt] ?? []).filter((f) => f !== fn);
      return api;
    }),
    selectedScrollSnap: vi.fn(() => api.snap),
    scrollTo: vi.fn((i: number) => {
      api.snap = i;
      api.emit("select");
    }),
    scrollPrev: vi.fn(() => {
      api.snap = (api.snap - 1 + api.total) % api.total;
      api.emit("select");
    }),
    scrollNext: vi.fn(() => {
      api.snap = (api.snap + 1) % api.total;
      api.emit("select");
    }),
    emit: (event: string) => {
      for (const fn of [...(api.handlers[event] ?? [])]) fn();
    },
    swipe: (i: number) => {
      api.snap = i;
      act(() => api.emit("select"));
    },
    settle: () => {
      act(() => api.emit("settle"));
    },
  };
  return api;
}

export const embla: {
  api: FakeEmbla | null;
  options: SeenOptions[];
  hook: (options: SeenOptions) => [() => void, FakeEmbla | null];
} = {
  api: null,
  options: [],
  hook(options) {
    embla.options.push(options);
    const api = embla.api;
    // Real Embla starts on `startIndex`.
    if (api && !api.started) {
      api.snap = options.startIndex ?? 0;
      api.started = true;
    }
    // Real Embla's React wrapper re-inits with the caller's full options when they change
    // (shallow compare), which resets the selected snap to `startIndex` and emits "reInit".
    // eslint-disable-next-line react-hooks/rules-of-hooks -- called as a hook by the component under test
    const prevKey = useRef<string | null>(null);
    const key = JSON.stringify(options);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const previous = prevKey.current;
      prevKey.current = key;
      if (previous === null || previous === key || !api) return;
      api.snap = options.startIndex ?? 0;
      api.emit("reInit");
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);
    return [() => {}, api];
  },
};

/** Install a fresh fake for one test. Returns the restore function. */
export function setupEmbla(total = 5): () => void {
  embla.api = makeFakeEmbla(total);
  embla.options.length = 0;
  return () => {
    embla.api = null;
  };
}

export const lastOptions = (): SeenOptions => embla.options[embla.options.length - 1]!;

export function images(n = 5, extra: Partial<Extract<MediaItem, { type: "image" }>> = {}): MediaItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `img-${i}`,
    type: "image" as const,
    url: `https://example.test/photo-${i}.jpg`,
    alt: `Photo ${i + 1}`,
    ...extra,
  }));
}

export function videos(n = 3): MediaItem[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `vid-${i}`,
    type: "video" as const,
    url: `https://example.test/clip-${i}.mp4`,
    poster: `https://example.test/poster-${i}.jpg`,
  }));
}

/** Slide wrappers (role=group, aria-roledescription), excluding the carousel region. */
export function slidesOf(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>('[aria-roledescription]:not([role="region"])'),
  );
}

/** The element that carries the aspect frame around a slide's image. */
export function frameOf(img: HTMLImageElement): HTMLElement {
  return img.parentElement as HTMLElement;
}

export function ratioOf(frame: HTMLElement): number {
  return parseFloat(frame.style.aspectRatio);
}

/** An `IntersectionObserver` whose callback the test can drive. */
export function installControllableIO(): {
  instances: Array<{ cb: IntersectionObserverCallback; target: Element | null; options?: IntersectionObserverInit }>;
  report: (ratio: number, index?: number) => void;
  /** Deliver a hand-built entry (e.g. with `intersectionRect` / `rootBounds`). */
  reportRaw: (entry: Partial<IntersectionObserverEntry>, index?: number) => void;
  restore: () => void;
} {
  const original = globalThis.IntersectionObserver;
  const instances: Array<{ cb: IntersectionObserverCallback; target: Element | null; options?: IntersectionObserverInit }> = [];
  class ControllableIO {
    readonly root = null;
    readonly rootMargin = "0px";
    readonly thresholds = [0];
    private readonly rec: { cb: IntersectionObserverCallback; target: Element | null; options?: IntersectionObserverInit };
    constructor(cb: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      this.rec = { cb, target: null, options };
      instances.push(this.rec);
    }
    observe(target: Element) {
      this.rec.target = target;
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  globalThis.IntersectionObserver = ControllableIO as unknown as typeof IntersectionObserver;
  return {
    instances,
    report(ratio, index = instances.length - 1) {
      const rec = instances[index]!;
      act(() =>
        rec.cb(
          [
            {
              target: rec.target,
              isIntersecting: ratio > 0,
              intersectionRatio: ratio,
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver,
        ),
      );
    },
    reportRaw(entry, index = instances.length - 1) {
      const rec = instances[index]!;
      act(() => rec.cb([{ target: rec.target, ...entry } as IntersectionObserverEntry], {} as IntersectionObserver));
    },
    restore() {
      globalThis.IntersectionObserver = original;
    },
  };
}

/**
 * Stub what jsdom never loads: `complete`, `naturalWidth`, `naturalHeight`, `decode` on
 * `HTMLImageElement.prototype`, answered per element by `state`. Returns `restore()`.
 */
export interface ImageState {
  complete: boolean;
  width: number;
  height: number;
  /** `decode()` outcome; omit to leave `decode` undefined. */
  decode?: "resolve" | "reject";
}
export function stubImages(state: (img: HTMLImageElement) => ImageState): () => void {
  const proto = HTMLImageElement.prototype;
  const keys = ["complete", "naturalWidth", "naturalHeight", "decode"] as const;
  const originals = Object.fromEntries(keys.map((k) => [k, Object.getOwnPropertyDescriptor(proto, k)]));
  Object.defineProperty(proto, "complete", { configurable: true, get(this: HTMLImageElement) { return state(this).complete; } });
  Object.defineProperty(proto, "naturalWidth", { configurable: true, get(this: HTMLImageElement) { return state(this).width; } });
  Object.defineProperty(proto, "naturalHeight", { configurable: true, get(this: HTMLImageElement) { return state(this).height; } });
  Object.defineProperty(proto, "decode", {
    configurable: true,
    get(this: HTMLImageElement) {
      const d = state(this).decode;
      if (!d) return undefined;
      return () => (d === "resolve" ? Promise.resolve() : Promise.reject(new Error("decode failed")));
    },
  });
  return () => {
    for (const k of keys) {
      const d = originals[k];
      if (d) Object.defineProperty(proto, k, d);
      else delete (proto as unknown as Record<string, unknown>)[k];
    }
  };
}
