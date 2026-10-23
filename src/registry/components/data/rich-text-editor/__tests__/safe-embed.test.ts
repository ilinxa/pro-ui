import { describe, expect, it } from "vitest";
import {
  EMBED_DEFAULT_ALLOW_LIST,
  EMBED_SANDBOX,
  isHttpUrl,
  resolveEmbed,
  safeHref,
} from "../lib/safe-embed";

describe("safeHref", () => {
  it("rejects javascript: in every disguise", () => {
    expect(safeHref("javascript:alert(1)")).toBeUndefined();
    expect(safeHref("JAVASCRIPT:alert(1)")).toBeUndefined();
    expect(safeHref("java\tscript:alert(1)")).toBeUndefined();
    expect(safeHref("  java\nscript:alert(1)")).toBeUndefined();
    expect(safeHref("\u0001javascript:alert(1)")).toBeUndefined();
  });
  it("rejects data:, vbscript:, file:", () => {
    expect(safeHref("data:text/html,<script>1</script>")).toBeUndefined();
    expect(safeHref("vbscript:x")).toBeUndefined();
    expect(safeHref("file:///etc/passwd")).toBeUndefined();
  });
  it("allows http, https, mailto, tel", () => {
    expect(safeHref("https://a.com/x")).toBe("https://a.com/x");
    expect(safeHref("http://a.com")).toBe("http://a.com");
    expect(safeHref("mailto:a@b.co")).toBe("mailto:a@b.co");
    expect(safeHref("tel:+123")).toBe("tel:+123");
  });
  it("allows relative URLs", () => {
    for (const u of ["/a", "#x", "?q=1", "./a", "../a", "a/b"]) {
      expect(safeHref(u)).toBe(u);
    }
  });
  it("rejects empty / non-string", () => {
    expect(safeHref("")).toBeUndefined();
    expect(safeHref(null)).toBeUndefined();
    expect(safeHref(undefined)).toBeUndefined();
  });
});

describe("isHttpUrl", () => {
  it("accepts only http(s)", () => {
    expect(isHttpUrl("https://a.com/i.png")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("data:image/png;base64,AA")).toBe(false);
  });
});

describe("resolveEmbed", () => {
  it("allows default hosts", () => {
    for (const host of EMBED_DEFAULT_ALLOW_LIST) {
      expect(resolveEmbed(`https://${host}/embed/x`).kind).toBe("iframe");
    }
  });
  it("renders a link for non-listed hosts", () => {
    expect(resolveEmbed("https://evil.example/x")).toEqual({
      kind: "link",
      href: "https://evil.example/x",
      text: "https://evil.example/x",
    });
  });
  it("refuses http: and javascript: (no href for the latter)", () => {
    expect(resolveEmbed("http://www.youtube.com/embed/x").kind).toBe("link");
    expect(resolveEmbed("javascript:alert(1)")).toEqual({
      kind: "link",
      href: undefined,
      text: "javascript:alert(1)",
    });
  });
  it("refuses unparsable / relative URLs", () => {
    expect(resolveEmbed("/embed/x").kind).toBe("link");
    expect(resolveEmbed("not a url").kind).toBe("link");
  });
  it("embedAllowList replaces the default and supports wildcards", () => {
    const policy = { embedAllowList: ["*.example.com"] };
    expect(resolveEmbed("https://a.example.com/x", policy).kind).toBe("iframe");
    expect(resolveEmbed("https://a.b.example.com/x", policy).kind).toBe("iframe");
    expect(resolveEmbed("https://example.com/x", policy).kind).toBe("link");
    expect(resolveEmbed("https://evilexample.com/x", policy).kind).toBe("link");
    expect(resolveEmbed("https://www.youtube.com/embed/x", policy).kind).toBe("link");
  });
  it("isEmbedAllowed wins over the list", () => {
    expect(
      resolveEmbed("https://www.youtube.com/embed/x", { isEmbedAllowed: () => false }).kind
    ).toBe("link");
    expect(
      resolveEmbed("https://other.test/x", { isEmbedAllowed: (u) => u.hostname === "other.test" }).kind
    ).toBe("iframe");
    // ...but a non-https URL is still refused.
    expect(resolveEmbed("http://other.test/x", { isEmbedAllowed: () => true }).kind).toBe("link");
  });
  it("refuses embed URLs carrying credentials", () => {
    expect(resolveEmbed("https://user:pw@www.youtube.com/embed/x").kind).toBe("link");
    expect(resolveEmbed("https://user@www.youtube.com/embed/x").kind).toBe("link");
  });
  it("sandbox never grants top navigation", () => {
    expect(EMBED_SANDBOX).not.toMatch(/top-navigation/);
  });
});
