import { getByPath } from "./path";

/**
 * Computed-field expression parser. Pure interpolation only:
 *   '{firstName} {lastName}'              → "Hessam Hezaveh"
 *   '{address.city}, {address.country}'   → "Tehran, Iran"
 *
 * NO operators, NO conditionals, NO function calls (per A3 lock). Consumers
 * needing anything more use `compute: (values) => ...` instead.
 */

export interface ParsedExpression {
  /** Ordered parts: alternating literal strings and field references. */
  parts: Array<{ kind: "literal"; text: string } | { kind: "field"; path: string }>;
  /** Set of all field paths referenced. */
  deps: Set<string>;
}

const FIELD_RE = /\{([^{}]+)\}/g;

export function parseExpression(expr: string): ParsedExpression {
  const parts: ParsedExpression["parts"] = [];
  const deps = new Set<string>();
  let lastIndex = 0;
  FIELD_RE.lastIndex = 0;

  let m: RegExpExecArray | null;
  while ((m = FIELD_RE.exec(expr)) !== null) {
    if (m.index > lastIndex) {
      parts.push({ kind: "literal", text: expr.slice(lastIndex, m.index) });
    }
    const path = m[1].trim();
    parts.push({ kind: "field", path });
    deps.add(path);
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < expr.length) {
    parts.push({ kind: "literal", text: expr.slice(lastIndex) });
  }

  return { parts, deps };
}

/**
 * Render an expression against a values bag. Unknown fields → empty string
 * (plus dev warn from the caller if desired).
 */
export function interpolate(
  parsed: ParsedExpression,
  values: Record<string, unknown>,
): string {
  let out = "";
  for (const part of parsed.parts) {
    if (part.kind === "literal") {
      out += part.text;
    } else {
      const v = getByPath(values, part.path);
      out += v == null ? "" : String(v);
    }
  }
  return out;
}
