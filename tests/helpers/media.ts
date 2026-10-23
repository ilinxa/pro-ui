/**
 * `HTMLMediaElement` playback for jsdom (consumer contract C11 / Part 1 R9). jsdom throws
 * "not implemented" from `play()` / `pause()` and never advances time. After
 * `installMediaElementStubs()`:
 *   - `play()` resolves (or rejects with `playError`) and flips `paused`; `pause()` flips it back;
 *     `load()` resets time and pauses;
 *   - `currentTime` and `duration` are settable per element;
 *   - `fireMedia(el, "loadedmetadata" | "timeupdate" | "waiting" | "ended" | "error", { … })`
 *     sets the given fields and dispatches the event.
 * Returns `restore()`.
 */

type MediaEventName = "loadedmetadata" | "timeupdate" | "waiting" | "playing" | "pause" | "ended" | "error" | "canplay";

export interface MediaStubOptions {
  /** Make every `play()` reject with this error (autoplay blocked, decode failure…). */
  playError?: Error;
}

const state = new WeakMap<HTMLMediaElement, { paused: boolean; currentTime: number; duration: number }>();
const stateOf = (el: HTMLMediaElement) => {
  let s = state.get(el);
  if (!s) state.set(el, (s = { paused: true, currentTime: 0, duration: Number.NaN }));
  return s;
};

export function installMediaElementStubs({ playError }: MediaStubOptions = {}): () => void {
  const proto = HTMLMediaElement.prototype;
  const keys = ["play", "pause", "load", "paused", "currentTime", "duration"] as const;
  const originals = Object.fromEntries(keys.map((k) => [k, Object.getOwnPropertyDescriptor(proto, k)]));

  Object.defineProperty(proto, "play", {
    configurable: true,
    value(this: HTMLMediaElement) {
      if (playError) return Promise.reject(playError);
      stateOf(this).paused = false;
      this.dispatchEvent(new Event("play"));
      this.dispatchEvent(new Event("playing"));
      return Promise.resolve();
    },
  });
  Object.defineProperty(proto, "pause", {
    configurable: true,
    value(this: HTMLMediaElement) {
      stateOf(this).paused = true;
      this.dispatchEvent(new Event("pause"));
    },
  });
  Object.defineProperty(proto, "load", {
    configurable: true,
    value(this: HTMLMediaElement) {
      const s = stateOf(this);
      s.paused = true;
      s.currentTime = 0;
      this.dispatchEvent(new Event("emptied"));
    },
  });
  Object.defineProperty(proto, "paused", {
    configurable: true,
    get(this: HTMLMediaElement) {
      return stateOf(this).paused;
    },
  });
  for (const key of ["currentTime", "duration"] as const) {
    Object.defineProperty(proto, key, {
      configurable: true,
      get(this: HTMLMediaElement) {
        return stateOf(this)[key];
      },
      set(this: HTMLMediaElement, v: number) {
        stateOf(this)[key] = v;
      },
    });
  }
  return () => {
    for (const k of keys) {
      const d = originals[k];
      if (d) Object.defineProperty(proto, k, d);
      else delete (proto as unknown as Record<string, unknown>)[k];
    }
  };
}

/** Set media fields, then dispatch the event — e.g. `fireMedia(video, "timeupdate", { currentTime: 3 })`. */
export function fireMedia(
  el: HTMLMediaElement,
  event: MediaEventName,
  fields: { currentTime?: number; duration?: number } = {},
): void {
  const s = stateOf(el);
  if (fields.currentTime !== undefined) s.currentTime = fields.currentTime;
  if (fields.duration !== undefined) s.duration = fields.duration;
  // keep `paused` consistent with the event a handler will read it in
  if (event === "ended" || event === "pause") s.paused = true;
  if (event === "playing") s.paused = false;
  el.dispatchEvent(new Event(event));
}
