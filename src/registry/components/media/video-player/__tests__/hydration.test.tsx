/**
 * C9 — server markup must match the first client render: no hydration warning for the default
 * player, `locale="tr"` and `dir="rtl"`.
 */
import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import type { ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VideoPlayer } from "../video-player";
import { TRACKS, setupPlayerEnv, type PlayerEnv } from "./support";

/**
 * jsdom does not seed `video.muted` from the `muted` content attribute (browsers do: a parsed
 * `<video muted>` reads `muted === true`), so React's hydration check saw the server's
 * `muted=""` as `false`. This reproduces the browser rule until the element is first written to.
 */
function installMutedAttributeSeed(): () => void {
  const proto = HTMLMediaElement.prototype;
  const original = Object.getOwnPropertyDescriptor(proto, "muted");
  const written = new WeakMap<HTMLMediaElement, boolean>();
  Object.defineProperty(proto, "muted", {
    configurable: true,
    get(this: HTMLMediaElement) {
      return written.has(this) ? written.get(this)! : this.hasAttribute("muted");
    },
    set(this: HTMLMediaElement, value: boolean) {
      written.set(this, !!value);
    },
  });
  return () => {
    if (original) Object.defineProperty(proto, "muted", original);
    else delete (proto as unknown as Record<string, unknown>).muted;
  };
}

let env: PlayerEnv;
let restoreMuted: () => void;
beforeEach(() => {
  env = setupPlayerEnv();
  restoreMuted = installMutedAttributeSeed();
});
afterEach(() => {
  restoreMuted();
  env.restore();
  document.body.innerHTML = "";
});

async function hydrates(ui: ReactElement) {
  const html = renderToString(ui);
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  const recoverable = vi.fn();
  try {
    await act(async () => {
      hydrateRoot(container, ui, { onRecoverableError: recoverable });
    });
    return { html, container, errors: errors.mock.calls, recoverable: recoverable.mock.calls };
  } finally {
    errors.mockRestore();
  }
}

describe("hydration", () => {
  it("the server renders the idle player: a <video>, Play and Unmute, no seek bar yet", () => {
    const html = renderToString(<VideoPlayer src="/a.mp4" poster="/p.jpg" />);
    expect(html).toContain("<video");
    expect(html).toContain('aria-label="Play"');
    expect(html).toContain('aria-label="Unmute"');
    expect(html).not.toContain('role="slider"');
  });

  it("hydrating the default player logs no warning and no recoverable error", async () => {
    const result = await hydrates(<VideoPlayer src="/a.mp4" poster="/p.jpg" durationHint={90} tracks={TRACKS} />);
    expect(result.errors).toEqual([]);
    expect(result.recoverable).toEqual([]);
    expect(result.container.querySelector("video")).not.toBeNull();
  });

  it('hydrating with locale="tr" logs no warning', async () => {
    const result = await hydrates(<VideoPlayer src="/a.mp4" locale="tr" durationHint={125} labels={{ play: "Oynat" }} />);
    expect(result.errors).toEqual([]);
    expect(result.recoverable).toEqual([]);
    expect(result.container.textContent).toContain("2:05");
  });

  it('hydrating with dir="rtl" logs no warning', async () => {
    const result = await hydrates(<VideoPlayer src="/a.mp4" dir="rtl" locale="ar-EG" durationHint={125} showFullscreen />);
    expect(result.errors).toEqual([]);
    expect(result.recoverable).toEqual([]);
    expect(result.container.firstElementChild).toHaveAttribute("dir", "rtl");
  });

  it("hydrating under an rtl ancestor (no dir prop) logs no warning — direction is resolved after mount", async () => {
    const ui = (
      <div dir="rtl">
        <VideoPlayer src="/a.mp4" />
      </div>
    );
    const result = await hydrates(ui);
    expect(result.errors).toEqual([]);
    expect(result.recoverable).toEqual([]);
  });

  it("the fullscreen button is absent in server markup (resolved after mount) even with showFullscreen", () => {
    const html = renderToString(<VideoPlayer src="/a.mp4" showFullscreen />);
    expect(html).not.toContain("Full screen");
  });

  it("autoPlayInView and reduced-motion queries do not run on the server render", () => {
    expect(() => renderToString(<VideoPlayer src="/a.mp4" autoPlayInView autoplayGroup="g" onDoubleTap={() => {}} />)).not.toThrow();
  });
});
