/**
 * Shared test kit for VideoPlayer (consumer contract C11): media + environment stubs, a
 * manual requestAnimationFrame queue, a deterministic double-tap clock, and small DOM helpers.
 *
 * Why a manual rAF queue: the player throttles `timeupdate` / `progress` reports with one rAF.
 * A synchronous rAF would leave the throttle latch set (the callback runs before the id is
 * stored), so the stub queues callbacks and `flush()` runs them inside `act`.
 */
import { act, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import {
  fireMedia,
  installMediaElementStubs,
  mockIntersectionObserver,
  mockMatchMedia,
} from "../../../../../../tests/helpers";

export interface PlayerEnv {
  /** Run queued animation frames inside `act`. */
  flush: () => void;
  restore: () => void;
}

export function installRaf(): PlayerEnv {
  const original = { raf: globalThis.requestAnimationFrame, caf: globalThis.cancelAnimationFrame };
  const queue = new Map<number, FrameRequestCallback>();
  let id = 0;
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    id += 1;
    queue.set(id, cb);
    return id;
  }) as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = ((n: number) => {
    queue.delete(n);
  }) as typeof cancelAnimationFrame;
  return {
    flush() {
      act(() => {
        const callbacks = [...queue.values()];
        queue.clear();
        for (const cb of callbacks) cb(0);
      });
    },
    restore() {
      globalThis.requestAnimationFrame = original.raf;
      globalThis.cancelAnimationFrame = original.caf;
    },
  };
}

/**
 * Media stubs + matchMedia + IntersectionObserver + a manual rAF queue. `visible: null` skips
 * the IntersectionObserver stub (the test installs its own).
 */
export function setupPlayerEnv(
  opts: { reducedMotion?: boolean; pointer?: "fine" | "coarse" | "none"; visible?: boolean | null; playError?: Error } = {},
): PlayerEnv {
  const { reducedMotion = false, pointer = "fine", visible = true, playError } = opts;
  const restores = [
    installMediaElementStubs({ playError }),
    mockMatchMedia({ reducedMotion, pointer }),
    visible === null ? () => {} : mockIntersectionObserver({ visible }),
  ];
  const raf = installRaf();
  restores.push(raf.restore);
  return {
    flush: raf.flush,
    restore: () => restores.reverse().forEach((r) => r()),
  };
}

/** A controllable IntersectionObserver: `report(ratio)` delivers an entry to the latest observer. */
export function installControllableIO() {
  const original = globalThis.IntersectionObserver;
  const instances: Array<{ cb: IntersectionObserverCallback; target: Element | null }> = [];
  class ControllableIO {
    readonly root = null;
    readonly rootMargin = "0px";
    readonly thresholds = [0];
    private readonly rec: { cb: IntersectionObserverCallback; target: Element | null };
    constructor(cb: IntersectionObserverCallback) {
      this.rec = { cb, target: null };
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
    report(ratio: number, index = instances.length - 1) {
      const rec = instances[index]!;
      act(() =>
        rec.cb(
          [{ target: rec.target, isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        ),
      );
    },
    restore() {
      globalThis.IntersectionObserver = original;
    },
  };
}

/**
 * Fake `setTimeout` / `clearTimeout` plus a controllable `performance.now()` (starting well past
 * the 300 ms double-tap window, so the first tap is never read as a second one).
 */
export function installClock() {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  let now = 10_000;
  const spy = vi.spyOn(performance, "now").mockImplementation(() => now);
  return {
    advance(ms: number) {
      now += ms;
      act(() => {
        vi.advanceTimersByTime(ms);
      });
    },
    restore() {
      spy.mockRestore();
      vi.useRealTimers();
    },
  };
}

export const getVideo = () => document.querySelector("video") as HTMLVideoElement;

/** The player's root container: the `<video>`'s parent. */
export const rootOf = (video: HTMLVideoElement) => video.parentElement as HTMLElement;

/** Start playback the way the browser reports it (`play` + `playing` events). */
export function startPlaying(video: HTMLVideoElement) {
  act(() => {
    void video.play();
  });
}

export function loadMetadata(video: HTMLVideoElement, duration: number) {
  act(() => fireMedia(video, "loadedmetadata", { duration }));
}

/** A `timeupdate` at `currentTime`, then the throttled report. */
export function timeUpdate(env: PlayerEnv, video: HTMLVideoElement, currentTime: number, duration?: number) {
  act(() => fireMedia(video, "timeupdate", { currentTime, duration }));
  env.flush();
}

/** Fire a bare media event the shared helper does not list (`volumechange`, `progress`, `stalled`). */
export function fireBare(video: HTMLVideoElement, type: string) {
  act(() => {
    video.dispatchEvent(new Event(type));
  });
}

/** Dispatch a pointer event with `clientX` (jsdom may have no PointerEvent). */
export function pointer(el: Element, type: "pointerdown" | "pointermove" | "pointerup", clientX: number) {
  const Ctor = (globalThis as { PointerEvent?: typeof MouseEvent }).PointerEvent ?? MouseEvent;
  fireEvent(el, new Ctor(type, { clientX, bubbles: true, cancelable: true }));
}

/** Give an element a layout box (jsdom reports zeros). */
export function stubRect(el: Element, rect: { left: number; width: number }) {
  el.getBoundingClientRect = () =>
    ({ left: rect.left, right: rect.left + rect.width, width: rect.width, top: 0, bottom: 10, height: 10, x: rect.left, y: 0, toJSON() {} }) as DOMRect;
}

/** Stub `video.buffered` with ranges. */
export function stubBuffered(video: HTMLVideoElement, ranges: Array<[number, number]>) {
  Object.defineProperty(video, "buffered", {
    configurable: true,
    value: { length: ranges.length, start: (i: number) => ranges[i]![0], end: (i: number) => ranges[i]![1] },
  });
}

/**
 * `HTMLMediaElement.prototype.textTracks` answering an array-like of `{ mode }` objects, so the
 * stub is in place when the player mounts. Returns the list (inspect `.mode`) and `restore()`.
 */
export function stubTextTracks(count: number) {
  const list = Object.assign(
    Array.from({ length: count }, () => ({ mode: "disabled" as TextTrackMode })),
    { addEventListener() {}, removeEventListener() {} },
  );
  const proto = HTMLMediaElement.prototype;
  const original = Object.getOwnPropertyDescriptor(proto, "textTracks");
  Object.defineProperty(proto, "textTracks", { configurable: true, get: () => list });
  return {
    list,
    restore() {
      if (original) Object.defineProperty(proto, "textTracks", original);
      else delete (proto as unknown as Record<string, unknown>).textTracks;
    },
  };
}

export const TRACKS = [
  { kind: "captions" as const, src: "/en.vtt", srcLang: "en", label: "English" },
  { kind: "captions" as const, src: "/tr.vtt", srcLang: "tr", label: "Türkçe" },
];
