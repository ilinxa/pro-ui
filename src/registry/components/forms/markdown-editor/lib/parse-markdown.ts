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

// Per-instance Marked (Q-P1 lock + validate-pass refinement #1) — avoids global
// `marked.use(...)` mutation that would pollute every other consumer of `marked`
// in the same bundle (e.g., the docs-site README parser).
const customMarked = new Marked();
customMarked.use({ gfm: true, breaks: false }, wikilinkExtension);

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
