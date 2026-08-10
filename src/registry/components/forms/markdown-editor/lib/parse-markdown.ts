import { Marked, type Tokens } from "marked";
import type { KindMeta, WikilinkCandidate } from "../types";

interface WikilinkToken extends Tokens.Generic {
  type: "wikilink";
  raw: string;
  label: string;
  alias: string | undefined;
}

const wikilinkExtension = {
  extensions: [
    {
      name: "wikilink",
      level: "inline" as const,
      start: (src: string) => src.indexOf("[["),
      tokenizer(src: string): WikilinkToken | undefined {
        const match = src.match(/^\[\[([^[\]\n|]+?)(?:\|([^[\]\n]+?))?\]\]/);
        if (!match) return undefined;
        return {
          type: "wikilink",
          raw: match[0],
          label: match[1].trim(),
          alias: match[2]?.trim(),
        };
      },
      renderer(token: WikilinkToken): string {
        const display = token.alias ?? token.label;
        return `<span class="wikilink" data-wikilink-target="${escapeHtml(token.label)}">${escapeHtml(display)}</span>`;
      },
    },
  ],
};

// ─── Sanitization (v0.1.2, deep-review finding 5.1) ─────────────────────────
// `marked` passes raw HTML through by default — with backend-stored multi-author
// markdown (the wikilink use case) that is stored XSS in consumer apps. Two
// per-instance defenses, no added dependency:
//   1. Raw HTML tokens (block `html` + inline tags) render as ESCAPED text —
//      `<img onerror=…>` displays literally instead of executing. This also
//      prevents hand-forged `.wikilink` spans from reaching the post-process
//      regex below.
//   2. Link hrefs are scheme-filtered — `javascript:` / `data:` / `vbscript:`
//      and every other non-allowlisted scheme are stripped (the link renders as
//      plain text); `http:` / `https:` / `mailto:`, `#fragments`, and
//      relative/absolute paths pass through. Attribute output is entity-escaped,
//      so `&colon;`-style entity tricks are neutralized too.
// Wikilink rendering is unaffected (its renderer already escapes label+target).

const SCHEME_RE = /^([a-zA-Z][a-zA-Z0-9+.-]*):/;
const SAFE_SCHEME_RE = /^(?:https?|mailto)$/i;

function sanitizeHref(href: string): string | null {
  // Strip control chars + whitespace browsers ignore when parsing the scheme
  // ("jav\tascript:" tricks) before checking, but return the original href.
  const cleaned = href.replace(/[\u0000-\u0020\u007f]/g, "");
  const schemeMatch = SCHEME_RE.exec(cleaned);
  if (!schemeMatch) return href; // relative path / #fragment / query — no scheme
  return SAFE_SCHEME_RE.test(schemeMatch[1]) ? href : null;
}

// Per-instance Marked (Q-P1 lock + validate-pass refinement #1) — avoids global
// `marked.use(...)` mutation that would pollute every other consumer of `marked`
// in the same bundle (e.g., the docs-site README parser).
const customMarked = new Marked();
customMarked.use(
  { gfm: true, breaks: false },
  {
    renderer: {
      // Raw HTML (block + inline) → escaped literal text, never markup.
      html(token: Tokens.HTML | Tokens.Tag): string {
        return escapeHtml(token.text);
      },
      // Links → scheme-filtered href; disallowed schemes drop the anchor and
      // keep the (inline-parsed) label text.
      link(token: Tokens.Link): string {
        const text = this.parser.parseInline(token.tokens);
        const href = sanitizeHref(token.href);
        if (href === null) return text;
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
        return `<a href="${escapeHtml(href)}"${title}>${text}</a>`;
      },
    },
  },
  wikilinkExtension,
);

interface ParseOpts {
  wikilinkCandidates?: ReadonlyArray<WikilinkCandidate>;
  // kinds is part of the parse opts for forward-compat with kind-aware preview rendering;
  // unused in v0.1 (autocomplete renders kind badges, not preview).
  kinds?: Record<string, KindMeta>;
  hasClickHandler: boolean;
}

const WIKILINK_SPAN_REGEX = /<span class="wikilink" data-wikilink-target="([^"]+)">/g;

export function parseMarkdown(source: string, opts: ParseOpts): string {
  const html = customMarked.parse(source, { async: false }) as string;

  // Post-process: mark broken wikilinks; conditionally add role+tabindex when interactive
  // (validate-pass refinement #4 — only marked interactive when host wires onWikilinkClick).
  const interactive = opts.hasClickHandler;

  if (!opts.wikilinkCandidates) {
    return interactive
      ? html.replace(
          WIKILINK_SPAN_REGEX,
          (_, target) =>
            `<span class="wikilink" role="link" tabindex="0" data-wikilink-target="${target}">`,
        )
      : html;
  }

  const labelSet = new Set(opts.wikilinkCandidates.map((c) => c.label.toLowerCase().trim()));

  return html.replace(WIKILINK_SPAN_REGEX, (_, target) => {
    const resolved = labelSet.has(String(target).toLowerCase().trim());
    const classes = `wikilink${resolved ? "" : " wikilink-broken"}`;
    const roleAttr = interactive ? ' role="link" tabindex="0"' : "";
    return `<span class="${classes}"${roleAttr} data-wikilink-target="${target}">`;
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return ch;
    }
  });
}
