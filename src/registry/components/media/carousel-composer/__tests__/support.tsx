/**
 * jsdom has no media pipeline: no image decode, no video metadata, no canvas, no object
 * URLs. These stubs give file intake what a browser would: dimensions, a duration per file
 * name, seeks that fire `seeked`, and a canvas that encodes a JPEG blob.
 */
import { vi } from "vitest";
import type { MediaCarouselItem } from "../types";

export interface IntakeStubOptions {
  /** Video duration in seconds by file name. Default 10. `NaN` = unreadable. */
  durations?: Record<string, number>;
  /** Make every canvas `toBlob` fail. */
  noCanvas?: boolean;
}

export interface IntakeStubs {
  restore: () => void;
  /** Every value assigned to a probed video's `currentTime`. */
  seeks: number[];
  created: string[];
  revoked: string[];
}

export function installIntakeStubs(options: IntakeStubOptions = {}): IntakeStubs {
  const files = new Map<string, File>();
  const out: IntakeStubs = { restore: () => {}, seeks: [], created: [], revoked: [] };
  let n = 0;

  const origCreate = URL.createObjectURL;
  const origRevoke = URL.revokeObjectURL;
  URL.createObjectURL = ((blob: Blob) => {
    const url = `blob:test/${n++}`;
    if (blob instanceof File) files.set(url, blob);
    out.created.push(url);
    return url;
  }) as typeof URL.createObjectURL;
  URL.revokeObjectURL = ((url: string) => {
    out.revoked.push(url);
  }) as typeof URL.revokeObjectURL;

  const OrigImage = globalThis.Image;
  class FakeImage {
    naturalWidth = 100;
    naturalHeight = 100;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_v: string) {
      queueMicrotask(() => this.onload?.());
    }
  }
  globalThis.Image = FakeImage as unknown as typeof Image;

  const origCreateElement = document.createElement.bind(document);
  const createSpy = vi
    .spyOn(document, "createElement")
    .mockImplementation(((tag: string, opts?: ElementCreationOptions) => {
      const el = origCreateElement(tag, opts);
      if (tag.toLowerCase() !== "video") return el;
      const video = el as HTMLVideoElement;
      let current = 0;
      let duration = 10;
      Object.defineProperties(video, {
        duration: { get: () => duration },
        videoWidth: { get: () => 1280 },
        videoHeight: { get: () => 720 },
        currentTime: {
          get: () => current,
          set: (v: number) => {
            current = v;
            out.seeks.push(v);
            queueMicrotask(() => video.dispatchEvent(new Event("seeked")));
          },
        },
        src: {
          get: () => "",
          set: (url: string) => {
            const name = files.get(url)?.name ?? "";
            duration = options.durations?.[name] ?? 10;
            queueMicrotask(() => video.dispatchEvent(new Event("loadedmetadata")));
          },
        },
        load: { value: () => {} },
      });
      return video;
    }) as typeof document.createElement);

  const origGetContext = HTMLCanvasElement.prototype.getContext;
  const origToBlob = HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.getContext = (() => ({ drawImage: () => {} })) as never;
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback, type?: string) {
    cb(options.noCanvas ? null : new Blob(["frame"], { type: type ?? "image/png" }));
  };

  out.restore = () => {
    URL.createObjectURL = origCreate;
    URL.revokeObjectURL = origRevoke;
    globalThis.Image = OrigImage;
    createSpy.mockRestore();
    HTMLCanvasElement.prototype.getContext = origGetContext;
    HTMLCanvasElement.prototype.toBlob = origToBlob;
  };
  return out;
}

export const ITEMS: MediaCarouselItem[] = [
  { id: "a", kind: "image", url: "https://example.test/a.jpg", fileName: "a.jpg" },
  { id: "b", kind: "image", url: "https://example.test/b.jpg", fileName: "b.jpg" },
];

export const mp4 = (name = "clip.mp4") => new File(["v"], name, { type: "video/mp4" });
export const webm = (name = "rec.webm") => new File(["v"], name, { type: "video/webm" });
export const jpg = (name = "p.jpg") => new File(["i"], name, { type: "image/jpeg" });
