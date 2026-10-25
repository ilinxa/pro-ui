/**
 * share-bar 0.3.0 — SB1 (native share target), labels (C2), group name, C7 and the U0 fixes
 * (docs/procomps/share-bar-procomp/share-bar-loop.md).
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShareBar } from "../share-bar";
import { SHARE_BAR_DEFAULT_LABELS, defaultShareBarLabels } from "../types";
import { expectNoAxeViolations } from "../../../../../../tests/helpers";

const URL_ = "https://example.com/post/1";
const nav = navigator as unknown as Record<string, unknown>;

function stubNav(key: string, value: unknown) {
  Object.defineProperty(navigator, key, { configurable: true, writable: true, value });
}
afterEach(() => {
  for (const k of ["share", "canShare", "clipboard"]) delete nav[k];
  delete (document as unknown as Record<string, unknown>).execCommand;
  vi.restoreAllMocks();
});

describe("SB1 — native share target", () => {
  it("renders after mount when supported and calls share with the payload (undefined keys dropped)", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    stubNav("share", share);
    const onShare = vi.fn();
    render(<ShareBar targets={[{ kind: "native" }]} url={URL_} title="T" onShare={onShare} />);
    const btn = await screen.findByRole("button", { name: "Share" });
    fireEvent.click(btn);
    expect(share).toHaveBeenCalledTimes(1);
    expect(share).toHaveBeenCalledWith({ url: URL_, title: "T" });
    await waitFor(() => expect(onShare).toHaveBeenCalledWith("native"));
  });

  it("never renders when navigator.share is absent", () => {
    render(<ShareBar targets={[{ kind: "native" }, { kind: "copy" }]} url={URL_} />);
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("a second click while the sheet is open is ignored (no spurious onShareError)", async () => {
    let resolveShare: () => void = () => {};
    const share = vi.fn(() => new Promise<void>((r) => (resolveShare = r)));
    stubNav("share", share);
    const onShare = vi.fn();
    const onShareError = vi.fn();
    render(<ShareBar targets={[{ kind: "native" }]} url={URL_} onShare={onShare} onShareError={onShareError} />);
    const btn = await screen.findByRole("button", { name: "Share" });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(share).toHaveBeenCalledTimes(1);
    await act(async () => resolveShare());
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(onShareError).not.toHaveBeenCalled();
    fireEvent.click(btn);
    expect(share).toHaveBeenCalledTimes(2);
  });

  it("a canShare that throws counts as unsupported", async () => {
    stubNav("share", vi.fn());
    stubNav("canShare", vi.fn(() => { throw new TypeError("bad payload"); }));
    render(<ShareBar targets={[{ kind: "native" }, { kind: "copy" }]} url={URL_} />);
    await act(async () => {});
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
  });

  it("a disabled native target renders inert where supported", async () => {
    const share = vi.fn();
    stubNav("share", share);
    render(<ShareBar targets={[{ kind: "native", disabled: true }]} url={URL_} />);
    const btn = await screen.findByRole("button", { name: "Share" });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(share).not.toHaveBeenCalled();
  });

  it("never renders when canShare rejects the payload", () => {
    stubNav("share", vi.fn());
    stubNav("canShare", vi.fn().mockReturnValue(false));
    render(<ShareBar targets={[{ kind: "native" }]} url={URL_} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("server HTML has no native button, and it hydrates without warnings then appears", async () => {
    stubNav("share", vi.fn());
    const el = <ShareBar targets={[{ kind: "native" }, { kind: "copy" }]} url={URL_} headingAs="h4" />;
    const html = renderToString(el);
    expect(html).not.toContain('aria-label="Share"');
    expect(html).toContain('aria-label="Copy link"');
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.appendChild(host);
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const recoverable = vi.fn();
    await act(async () => {
      hydrateRoot(host, el, { onRecoverableError: recoverable });
    });
    expect(errors).not.toHaveBeenCalled();
    expect(recoverable).not.toHaveBeenCalled();
    expect(host.querySelector('button[aria-label="Share"]')).not.toBeNull();
    errors.mockRestore();
    host.remove();
  });

  it("AbortError is silent", async () => {
    const abort = Object.assign(new Error("dismissed"), { name: "AbortError" });
    stubNav("share", vi.fn().mockRejectedValue(abort));
    const onShare = vi.fn();
    const onShareError = vi.fn();
    render(<ShareBar targets={[{ kind: "native" }]} url={URL_} onShare={onShare} onShareError={onShareError} />);
    fireEvent.click(await screen.findByRole("button", { name: "Share" }));
    await act(async () => {});
    expect(onShare).not.toHaveBeenCalled();
    expect(onShareError).not.toHaveBeenCalled();
  });

  it("other rejections go to onShareError(error, 'native')", async () => {
    const boom = Object.assign(new Error("denied"), { name: "NotAllowedError" });
    stubNav("share", vi.fn().mockRejectedValue(boom));
    const onShare = vi.fn();
    const onShareError = vi.fn();
    render(<ShareBar targets={[{ kind: "native" }]} url={URL_} onShare={onShare} onShareError={onShareError} />);
    fireEvent.click(await screen.findByRole("button", { name: "Share" }));
    await waitFor(() => expect(onShareError).toHaveBeenCalledWith(boom, "native"));
    expect(onShare).not.toHaveBeenCalled();
  });

  it("Turkish native label", async () => {
    stubNav("share", vi.fn());
    render(<ShareBar targets={[{ kind: "native" }]} url={URL_} labels={{ targets: { native: "Paylaş" } }} />);
    expect(await screen.findByRole("button", { name: "Paylaş" })).toBeInTheDocument();
  });
});

describe("labels (C2)", () => {
  it("I1: no labels -> today's English names; alias is the same object", () => {
    render(
      <ShareBar
        url={URL_}
        targets={[
          { kind: "twitter" }, { kind: "facebook" }, { kind: "linkedin" }, { kind: "reddit" }, { kind: "whatsapp" },
          { kind: "telegram" }, { kind: "email" }, { kind: "threads" }, { kind: "bluesky" }, { kind: "copy" },
        ]}
      />,
    );
    const names = screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"));
    expect(names).toEqual([
      "Share on X", "Share on Facebook", "Share on LinkedIn", "Share on Reddit", "Share on WhatsApp",
      "Share on Telegram", "Share via email", "Share on Threads", "Share on Bluesky", "Copy link",
    ]);
    expect(SHARE_BAR_DEFAULT_LABELS).toBe(defaultShareBarLabels);
  });

  it("title equals the accessible name", () => {
    render(<ShareBar url={URL_} targets={[{ kind: "twitter" }]} labels={{ targets: { twitter: "X" } }} />);
    expect(screen.getByRole("button")).toHaveAttribute("title", "X");
  });

  it("explicit undefined never erases a default", () => {
    render(
      <ShareBar
        url={URL_}
        headingAs="h4"
        targets={[{ kind: "twitter" }, { kind: "copy" }]}
        labels={{ heading: undefined, copyAria: undefined, targets: { twitter: undefined } }}
      />,
    );
    expect(screen.getByRole("heading", { name: "Share" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share on X" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy link" })).toBeInTheDocument();
  });

  it("precedence: per-target ariaLabel > labels.targets > copyAria for copy", () => {
    render(
      <ShareBar
        url={URL_}
        targets={[{ kind: "twitter", ariaLabel: "Mine" }, { kind: "copy" }]}
        labels={{ copyAria: "A", targets: { twitter: "T", copy: "B" } }}
      />,
    );
    expect(screen.getByRole("button", { name: "Mine" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "B" })).toBeInTheDocument();
  });

  it("copyAria still names copy when labels.targets.copy is absent", () => {
    render(<ShareBar url={URL_} targets={[{ kind: "copy" }]} labels={{ copyAria: "Kopyala" }} />);
    expect(screen.getByRole("button", { name: "Kopyala" })).toBeInTheDocument();
  });

  it("a 0.2.0-style spread of the defaults with copyAria still names copy", () => {
    render(
      <ShareBar
        url={URL_}
        targets={[{ kind: "copy" }, { kind: "twitter" }]}
        labels={{ ...SHARE_BAR_DEFAULT_LABELS, copyAria: "Kopyala" }}
      />,
    );
    expect(screen.getByRole("button", { name: "Kopyala" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share on X" })).toBeInTheDocument();
  });

  it("Turkish labels.targets: no English platform name remains", () => {
    const { container } = render(
      <ShareBar
        url={URL_}
        headingAs="h4"
        targets={[{ kind: "twitter" }, { kind: "whatsapp" }, { kind: "email" }, { kind: "copy" }]}
        labels={{
          heading: "Paylaş",
          copySuccess: "Bağlantı kopyalandı",
          targets: {
            twitter: "X'te paylaş",
            whatsapp: "WhatsApp'ta paylaş",
            email: "E-posta ile paylaş",
            copy: "Bağlantıyı kopyala",
          },
        }}
      />,
    );
    const names = screen.getAllByRole("button").map((b) => b.getAttribute("aria-label"));
    expect(names).toEqual(["X'te paylaş", "WhatsApp'ta paylaş", "E-posta ile paylaş", "Bağlantıyı kopyala"]);
    expect(container.innerHTML).not.toMatch(/Share|Copy link/);
  });
});

describe("group name", () => {
  it("is named by its heading when present", () => {
    render(<ShareBar url={URL_} targets={[{ kind: "copy" }]} headingAs="h3" labels={{ heading: "Paylaş" }} />);
    const group = screen.getByRole("group");
    expect(group).toHaveAccessibleName("Paylaş");
    expect(group).toHaveAttribute("aria-labelledby");
  });
  it("falls back to labels.heading when headingAs is null", async () => {
    const { container } = render(
      <ShareBar url={URL_} targets={[{ kind: "copy" }]} headingAs={null} labels={{ heading: "Paylaş" }} />,
    );
    expect(screen.getByRole("group")).toHaveAccessibleName("Paylaş");
    await expectNoAxeViolations(container);
  });
});

describe("C7 — disabled / hidden", () => {
  it("disabled renders an inert button; hidden does not render", () => {
    const onShare = vi.fn();
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    render(
      <ShareBar
        url={URL_}
        onShare={onShare}
        targets={[{ kind: "twitter", disabled: true }, { kind: "facebook", hidden: true }, { kind: "copy" }]}
      />,
    );
    const x = screen.getByRole("button", { name: "Share on X" });
    expect(x).toBeDisabled();
    fireEvent.click(x);
    expect(open).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Share on Facebook" })).toBeNull();
  });
  it("applies to custom and native targets", async () => {
    stubNav("share", vi.fn());
    const onClick = vi.fn();
    render(
      <ShareBar
        url={URL_}
        targets={[
          { kind: "custom", id: "c", icon: () => null, ariaLabel: "Custom", onClick, disabled: true },
          { kind: "custom", id: "h", icon: () => null, ariaLabel: "Hidden", onClick, hidden: true },
          { kind: "native", hidden: true },
        ]}
      />,
    );
    await act(async () => {});
    expect(screen.getByRole("button", { name: "Custom" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Hidden" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
  });
});

describe("intents", () => {
  it("opens the template URL with noopener,noreferrer and reports onShare", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const onShare = vi.fn();
    render(<ShareBar url={URL_} title="Hi" targets={[{ kind: "facebook" }]} onShare={onShare} />);
    fireEvent.click(screen.getByRole("button", { name: "Share on Facebook" }));
    expect(open).toHaveBeenCalledWith(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_)}`,
      "_blank",
      "noopener,noreferrer",
    );
    expect(onShare).toHaveBeenCalledWith("facebook");
  });
  it("custom target runs onClick and reports its id", () => {
    const onClick = vi.fn();
    const onShare = vi.fn();
    render(
      <ShareBar
        url={URL_}
        onShare={onShare}
        targets={[{ kind: "custom", id: "dm", icon: () => null, ariaLabel: "DM", onClick }]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "DM" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onShare).toHaveBeenCalledWith("dm");
  });
});

describe("copy", () => {
  it("success: live region text + callbacks", async () => {
    stubNav("clipboard", { writeText: vi.fn().mockResolvedValue(undefined) });
    const onCopySuccess = vi.fn();
    const onShare = vi.fn();
    render(<ShareBar url={URL_} targets={[{ kind: "copy" }]} onCopySuccess={onCopySuccess} onShare={onShare} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Link copied"));
    expect(onCopySuccess).toHaveBeenCalled();
    expect(onShare).toHaveBeenCalledWith("copy");
  });

  it("failure: alert text + onCopyError", async () => {
    stubNav("clipboard", { writeText: vi.fn().mockRejectedValue(new Error("no")) });
    document.execCommand = vi.fn().mockReturnValue(false);
    const onCopyError = vi.fn();
    render(
      <ShareBar url={URL_} targets={[{ kind: "copy" }]} onCopyError={onCopyError} labels={{ copyError: "Kopyalanamadı" }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Kopyalanamadı"));
    expect(onCopyError).toHaveBeenCalledTimes(1);
  });

  it("U0-2 / I3: writeText rejecting falls back to execCommand with a readonly textarea (U0-3)", async () => {
    stubNav("clipboard", { writeText: vi.fn().mockRejectedValue(new Error("policy")) });
    let readonly: boolean | null = null;
    document.execCommand = vi.fn(() => {
      readonly = document.querySelector("textarea")?.hasAttribute("readonly") ?? null;
      return true;
    });
    const onCopySuccess = vi.fn();
    render(<ShareBar url={URL_} targets={[{ kind: "copy" }]} onCopySuccess={onCopySuccess} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(onCopySuccess).toHaveBeenCalled());
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(readonly).toBe(true);
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("U0-4: copy resolving after unmount does not touch state or arm the timer", async () => {
    let resolve!: () => void;
    stubNav("clipboard", { writeText: vi.fn(() => new Promise<void>((r) => (resolve = r))) });
    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = render(<ShareBar url={URL_} targets={[{ kind: "copy" }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    const before = setTimeoutSpy.mock.calls.length;
    unmount();
    await act(async () => {
      resolve();
    });
    expect(setTimeoutSpy.mock.calls.length).toBe(before);
    expect(errors).not.toHaveBeenCalled();
  });

  it("U0-6: two copy targets (same kind) render without a duplicate-key warning", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ShareBar url={URL_} targets={[{ kind: "copy" }, { kind: "copy", ariaLabel: "Copy 2" }]} />);
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(errors).not.toHaveBeenCalled();
  });
});
