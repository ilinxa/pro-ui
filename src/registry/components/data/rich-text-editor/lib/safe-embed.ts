/**
 * Safe embeds + safe hrefs (v0.4.0).
 *
 * Pure logic — no React, no DOM — so it is shared by the client editor, the
 * server-renderable viewer and the HTML serializer, and is unit-testable in
 * the node project.
 *
 * Threat model: a stored value (or HTML pasted into the editor) can carry
 * `{ type: "media_embed", url }` and `{ type: "a", url }` nodes with an
 * arbitrary `url`. Rendering those verbatim gives an attacker an arbitrary
 * iframe (clickjacking, drive-by content, same-origin script) or a
 * `javascript:` link.
 */

/** Hosts allowed to render as an iframe unless the host passes its own list. */
export const EMBED_DEFAULT_ALLOW_LIST: readonly string[] = [
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
];

/**
 * Sandbox applied to every embed iframe. `allow-same-origin` is required for
 * the major video players to work; it is only safe because the frame is a
 * DIFFERENT origin. Never add `allow-top-navigation*`.
 */
export const EMBED_SANDBOX =
  "allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox";

export const EMBED_REFERRER_POLICY = "strict-origin-when-cross-origin" as const;
export const EMBED_ALLOW = "fullscreen; picture-in-picture; encrypted-media";

/** Overridable default strings (kept in one place so a labels prop can land later). */
export const EMBED_DEFAULT_LABELS = {
  iframeTitle: "Embedded content",
} as const;

export interface EmbedPolicy {
  /**
   * Allowed embed hostnames. `*.example.com` matches any subdomain (not the
   * apex). REPLACES the default list.
   */
  embedAllowList?: string[];
  /** Custom predicate. When provided it wins over `embedAllowList`. */
  isEmbedAllowed?: (url: URL) => boolean;
}

export type EmbedResolution =
  | { kind: "iframe"; src: string }
  | { kind: "link"; href: string | undefined; text: string };

function hostMatches(host: string, pattern: string): boolean {
  const h = host.toLowerCase();
  const p = pattern.trim().toLowerCase();
  if (!p) return false;
  if (p.startsWith("*.")) {
    const suffix = p.slice(1); // ".example.com"
    return h.length > suffix.length && h.endsWith(suffix);
  }
  return h === p;
}

/**
 * Decide how to render an embed URL. Always requires an absolute `https:` URL;
 * then `isEmbedAllowed` (if given) or the host list decides.
 */
export function resolveEmbed(
  rawUrl: string,
  policy: EmbedPolicy = {}
): EmbedResolution {
  const fallback: EmbedResolution = {
    kind: "link",
    href: safeHref(rawUrl),
    text: rawUrl,
  };
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return fallback;
  }
  if (parsed.protocol !== "https:") return fallback;
  // Credentials in an embed URL serve no player and only obscure the real host.
  if (parsed.username || parsed.password) return fallback;

  let allowed: boolean;
  if (policy.isEmbedAllowed) {
    try {
      allowed = policy.isEmbedAllowed(parsed) === true;
    } catch {
      allowed = false;
    }
  } else {
    const list = policy.embedAllowList ?? EMBED_DEFAULT_ALLOW_LIST;
    allowed = list.some((p) => hostMatches(parsed.hostname, p));
  }
  return allowed ? { kind: "iframe", src: parsed.href } : fallback;
}

const SAFE_SCHEMES = new Set(["http", "https", "mailto", "tel"]);
// ASCII control chars, DEL and whitespace. Browsers strip tab/CR/LF inside a
// URL before parsing the scheme, so `java\tscript:` is a live javascript: URL.
const STRIP = /[\u0000- \u007f]/g;

/**
 * Return `url` (trimmed) when it is safe to put in an `href`, else
 * `undefined`. Allows http, https, mailto, tel and scheme-less relative URLs
 * (`/x`, `#x`, `?x`, `./x`, `../x`, `x/y`).
 */
export function safeHref(url: unknown): string | undefined {
  if (typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  const cleaned = trimmed.replace(STRIP, "");
  const match = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(cleaned);
  if (match) {
    return SAFE_SCHEMES.has(match[1].toLowerCase()) ? trimmed : undefined;
  }
  return trimmed;
}

/** True for an absolute http(s) URL (used for the toolbar image-URL prompt). */
export function isHttpUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    const p = new URL(url.trim());
    return p.protocol === "https:" || p.protocol === "http:";
  } catch {
    return false;
  }
}

// ── Per-editor policy ────────────────────────────────────────────────────
// Element renderers are plugin components built from module-level arrays, so
// per-instance props reach them through the editor object (both the Plate
// editor and the static editor are passed to renderers as `props.editor`).
// A WeakMap is SSR-safe, needs no React context (the viewer is a server
// component), and works identically for `serializeHtml`.

const policies = new WeakMap<object, EmbedPolicy>();

export function setEmbedPolicy(editor: object, policy: EmbedPolicy): void {
  policies.set(editor, policy);
}

export function getEmbedPolicy(editor: unknown): EmbedPolicy {
  if (editor && typeof editor === "object") {
    return policies.get(editor) ?? {};
  }
  return {};
}
