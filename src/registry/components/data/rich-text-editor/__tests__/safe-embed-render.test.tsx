import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { RichTextViewer } from "../rich-text-viewer";
import { RichTextEditor } from "../rich-text-editor";
import { serializeRichTextToHtml } from "../lib/serialize-html";
import type { RichTextValue } from "../types";

beforeAll(() => {
  if (!("ResizeObserver" in globalThis)) {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
});
afterEach(() => cleanup());

const embed = (url: string): RichTextValue => [
  { type: "media_embed", url, children: [{ text: "" }] } as never,
];
const link = (url: string): RichTextValue => [
  { type: "p", children: [{ type: "a", url, children: [{ text: "click" }] }] } as never,
];

const YT = "https://www.youtube.com/embed/abc";

describe("RichTextViewer embeds", () => {
  it("renders a sandboxed iframe for an allowed host", () => {
    const { container } = render(<RichTextViewer value={embed(YT)} />);
    const f = container.querySelector("iframe");
    expect(f).not.toBeNull();
    expect(f!.getAttribute("src")).toBe(YT);
    expect(f!.getAttribute("sandbox")).toBe(
      "allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
    );
    expect(f!.getAttribute("referrerpolicy")).toBe("strict-origin-when-cross-origin");
    expect(f!.getAttribute("loading")).toBe("lazy");
    expect(f!.getAttribute("title")).toBe("Embedded content");
    expect(f!.hasAttribute("allowfullscreen")).toBe(true);
  });
  it("renders a link and no iframe for a non-allow-listed host", () => {
    const { container } = render(<RichTextViewer value={embed("https://evil.example/x")} />);
    expect(container.querySelector("iframe")).toBeNull();
    const a = container.querySelector("a");
    expect(a?.getAttribute("href")).toBe("https://evil.example/x");
    expect(a?.getAttribute("rel")).toBe("noopener noreferrer nofollow");
  });
  it("javascript: embed renders neither iframe nor live href", () => {
    const { container } = render(<RichTextViewer value={embed("javascript:alert(1)")} />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain("javascript:alert(1)");
  });
  it("isEmbedAllowed overrides the list", () => {
    const { container } = render(
      <RichTextViewer value={embed(YT)} isEmbedAllowed={() => false} />
    );
    expect(container.querySelector("iframe")).toBeNull();
  });
  it("embedAllowList with wildcard", () => {
    const { container } = render(
      <RichTextViewer value={embed("https://v.example.com/p")} embedAllowList={["*.example.com"]} />
    );
    expect(container.querySelector("iframe")).not.toBeNull();
  });
});

describe("RichTextViewer links", () => {
  it("drops a javascript: href but keeps the text", () => {
    const { container } = render(<RichTextViewer value={link("javascript:alert(1)")} />);
    const a = container.querySelector("a");
    expect(a).not.toBeNull();
    expect(a!.getAttribute("href")).toBeNull();
    expect(a!.textContent).toBe("click");
    expect(container.innerHTML).not.toMatch(/\shref="\s*javascript:/i); // data-slate-url is inert metadata
  });
  it("drops an obfuscated java<TAB>script: href", () => {
    const { container } = render(<RichTextViewer value={link("java\tscript:alert(1)")} />);
    expect(container.querySelector("a")!.getAttribute("href")).toBeNull();
  });
  it("keeps a normal https link", () => {
    const { container } = render(<RichTextViewer value={link("https://a.com")} />);
    expect(container.querySelector("a")!.getAttribute("href")).toBe("https://a.com");
  });
});

describe("RichTextEditor embeds (read-only)", () => {
  it("sandboxes allowed embeds and links disallowed ones", () => {
    const ok = render(<RichTextEditor readOnly value={embed(YT)} />);
    expect(ok.container.querySelector("iframe")?.getAttribute("sandbox")).toContain("allow-scripts");
    cleanup();
    const bad = render(<RichTextEditor readOnly value={embed("https://evil.example/x")} />);
    expect(bad.container.querySelector("iframe")).toBeNull();
    expect(bad.container.textContent).toContain("https://evil.example/x");
  });
  it("honors embedAllowList", () => {
    const { container } = render(
      <RichTextEditor readOnly value={embed("https://evil.example/x")} embedAllowList={["evil.example"]} />
    );
    expect(container.querySelector("iframe")).not.toBeNull();
  });
});

describe("serializeRichTextToHtml", () => {
  it("emits the sandbox on allowed embeds", async () => {
    const html = await serializeRichTextToHtml(embed(YT));
    expect(html).toContain("sandbox=");
    expect(html).toContain("allow-scripts allow-same-origin");
  });
  it("respects embedAllowList / isEmbedAllowed and refuses by default", async () => {
    const url = "https://evil.example/x";
    expect(await serializeRichTextToHtml(embed(url))).not.toContain("<iframe");
    expect(await serializeRichTextToHtml(embed(url), { embedAllowList: ["evil.example"] })).toContain("<iframe");
    expect(await serializeRichTextToHtml(embed(YT), { isEmbedAllowed: () => false })).not.toContain("<iframe");
  });
  it("strips javascript: link hrefs", async () => {
    const html = await serializeRichTextToHtml(link("javascript:alert(1)"));
    expect(html).not.toMatch(/\shref="\s*javascript:/i); // data-slate-url is inert metadata
    expect(html).not.toMatch(/\shref=/);
  });
});
