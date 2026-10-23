#!/usr/bin/env node
/**
 * validate-contract.mjs — the consumer contract (C1–C12) as build gates, over
 * every file shipped by an item in registry.json. Part 1, R2 / R3 / R4 / R5 / R6 / R8.
 *
 * Rules (TypeScript AST, so comments never count and strings are read whole):
 *   palette        R4  a Tailwind palette colour (`bg-red-500`, `text-zinc-400/60`, incl. 4.2's
 *                      mauve/olive/mist/taupe) or an arbitrary value holding a literal colour
 *                      (`bg-[#fff]`, `shadow-[0_0_0_1px_#fff]`, `text-[oklch(…)]`) in any string.
 *                      Allowed: semantic tokens, `var()`-based arbitraries, black / white (±
 *                      alpha), transparent, current, inherit. Escape: `palette-ok: <reason>`.
 *   physical       R6  a physical inline-axis utility (`ml-2`, `pr-4`, `left-3`, `text-right`,
 *                      `rounded-l-md`, `border-r`, `float-left`, `scroll-pl-2` …) in any string.
 *                      Allowed, under the same variant: `left-1/2` with `translate-x-1/2`
 *                      (centring), a `left-N right-N` pair (= `inset-x-N`). Escape: `dir-ok:`.
 *   template-fill  R2  `.replace("{…` / `.replaceAll("{…` — filling a `{placeholder}` label
 *                      template. Value strings must be functions.
 *   intl           R3  an `Intl.*` formatter or `toLocale*String` with no locale or `undefined`
 *                      (`.resolvedOptions()` reads are fine), a `new Intl.*` at module scope,
 *                      `Intl.PluralRules("en")`.
 *   clock          R3  a zero-argument `new Date()` or `Date.now()` outside an effect callback,
 *                      `useCallback`, a JSX `on*` handler, a `handle*`/`on*` function, or a
 *                      timer / listener / promise callback. Escape: `now-ok: <reason>`.
 *   jsx-literal    R5  user-facing text written into JSX: a text child with a letter (HTML
 *                      entities aside), or a literal in `aria-label`, `aria-description`,
 *                      `aria-roledescription`, `aria-valuetext`, `title`, `placeholder`, `alt`,
 *                      `label` (incl. `? :` / `&&` / `||` / `??` branches and `+` concatenation).
 *                      Escape: `literal-ok: <reason>`.
 *   keydown        R8  `window` / `document` (or their body / html, however cast) `.addEventListener
 *                      ("keydown", …)` outside a `use-global-keydown` hook. A listener on an aliased
 *                      variable is not traced. Escape: `keydown-ok: <reason>`.
 * Class rules skip non-class JSX attributes (`aria-label="Align text-left"` is prose).
 * An escape is a `//`, `/* *\/` or JSX `{/* *\/}` comment with `<tag>: <reason>`, on the violation's
 * own line or on a comment-only line directly above it.
 *
 * Baseline (scripts/contract-baseline.json — the request's "checked-in list of the violations
 * present when a rule lands; the list may only shrink"):
 *   { "closed": [slug…], "rules": { "<rule>": { "<repo path>": ["<violation text>", …] } } }
 *   - compared per file as a multiset: a violation not in the file's list FAILS — fixing one and
 *     adding a different one is never a silent swap;
 *   - a listed violation that no longer occurs FAILS until `--update-baseline` drops it, so
 *     progress is recorded and can never be silently re-spent;
 *   - a component listed in `closed` (finished its Part 2–3 loop) may have no row at all.
 *
 * Usage:
 *   node scripts/validate-contract.mjs                       # gate (registry:build, lint)
 *   node scripts/validate-contract.mjs --report              # per-rule totals
 *   node scripts/validate-contract.mjs --update-baseline     # drop fixed violations (never adds one)
 *   node scripts/validate-contract.mjs --seed-rule <rule>    # write a rule's baseline ONLY if it has none
 *   --registry <f> --root <dir> --baseline <f>               # tests
 *
 * Exit: 0 clean against the baseline · 1 new violation, stale (shrunk) row, or closed-component row
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

export const RULES = ["palette", "physical", "template-fill", "intl", "clock", "jsx-literal", "keydown"];
const PREFIX = "src/registry/components/";
const ESCAPES = {
  palette: "palette-ok",
  physical: "dir-ok",
  clock: "now-ok",
  "jsx-literal": "literal-ok",
  keydown: "keydown-ok",
};

// ── class-token rules ──────────────────────────────────────────────────────
// Every palette Tailwind 4.2 ships (node_modules/tailwindcss/theme.css), incl. the 4.2 additions.
const PALETTE =
  "slate|gray|zinc|neutral|stone|mauve|olive|mist|taupe|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const COLOR_PREFIX =
  "bg|text|border(?:-[xytrbsel])?|ring|ring-offset|outline|from|via|to|fill|stroke|shadow|text-shadow|divide|decoration|placeholder|caret|accent|inset-shadow|inset-ring|drop-shadow";
const PALETTE_RE = new RegExp(`^(?:${COLOR_PREFIX})-(?:${PALETTE})-(?:50|[1-9]00|950)(?:/\\S+)?$`);
const ARBITRARY_RE = new RegExp(`^(?:${COLOR_PREFIX})-\\[(.+)\\](?:/\\S+)?$`);

/**
 * An arbitrary value carries a literal colour: a hex, or a colour function with a number in
 * it once every `var(…)` is removed — so `bg-[hsl(var(--x))]` (token-based) passes while
 * `shadow-[0_0_0_1px_#fff]`, `bg-[linear-gradient(#fff,#000)]` and `bg-[oklch(0.7_0.1_20)]` fail.
 */
function isArbitraryColor(utility) {
  const m = utility.match(ARBITRARY_RE);
  if (!m) return false;
  let inner = m[1];
  for (let prev = ""; prev !== inner; ) {
    prev = inner;
    inner = inner.replace(/var\([^()]*\)/g, "");
  }
  return /#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z])|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\([^)]*\d/.test(inner);
}
// `left-`/`right-` only with a real inset value, so words like "left-bar" (a variant name) never match.
const INSET_VALUE = String.raw`(?:\d+(?:\.\d+)?|\d+/\d+|px|full|auto|\[[^\]]+\]|\([^)]+\))`;
const PHYSICAL_RE = new RegExp(
  String.raw`^(?:(?:m|p|scroll-m|scroll-p)[lr]-\S+|(?:left|right)-${INSET_VALUE}|text-(?:left|right)|float-(?:left|right)|clear-(?:left|right)|rounded-(?:l|r|tl|tr|bl|br)(?:-\S+)?|border-[lr](?:-\S+)?)$`,
);

/** Split a token into its variant prefix (`md:hover:`, `[&>svg]:`) and the bare utility. */
export function splitToken(token) {
  const t = token.trim();
  // variants end at the last top-level ':' (not inside [...])
  let depth = 0;
  let cut = -1;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === "[") depth++;
    else if (t[i] === "]") depth--;
    else if (t[i] === ":" && depth === 0) cut = i;
  }
  const utility = t
    .slice(cut + 1)
    .replace(/^!/, "")
    .replace(/!$/, "")
    .replace(/^-/, "");
  return { variant: t.slice(0, cut + 1), utility };
}

/** Strip variants (`md:`, `hover:`, `[&>svg]:`), the `!` important mark and a leading `-`. */
export const utilityOf = (token) => splitToken(token).utility;

export function paletteHits(text) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .filter((tok) => {
      const u = utilityOf(tok);
      return PALETTE_RE.test(u) || isArbitraryColor(u);
    });
}

export function physicalHits(text) {
  const tokens = text.split(/\s+/).filter(Boolean);
  const parts = tokens.map(splitToken);
  const has = (variant, utility) => parts.some((p) => p.variant === variant && p.utility === utility);
  return tokens.filter((tok, i) => {
    const { variant, utility } = parts[i];
    if (!PHYSICAL_RE.test(utility)) return false;
    const pos = utility.match(/^(left|right)-(\S+)$/);
    if (pos) {
      // left-1/2 -translate-x-1/2 — centring, under the same variant
      if (pos[2] === "1/2" && has(variant, "translate-x-1/2")) return false;
      // left-0 right-0 = inset-x-0, under the same variant
      if (has(variant, `${pos[1] === "left" ? "right" : "left"}-${pos[2]}`)) return false;
    }
    return true;
  });
}

// ── AST helpers ────────────────────────────────────────────────────────────
const FN_KINDS = new Set([
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.FunctionExpression,
  ts.SyntaxKind.ArrowFunction,
  ts.SyntaxKind.MethodDeclaration,
  ts.SyntaxKind.Constructor,
  ts.SyntaxKind.GetAccessor,
  ts.SyntaxKind.SetAccessor,
]);
const EFFECT_HOOKS = new Set(["useEffect", "useLayoutEffect", "useInsertionEffect", "useCallback"]);
const CALLBACK_SINKS = new Set([
  "addEventListener",
  "setTimeout",
  "setInterval",
  "requestAnimationFrame",
  "requestIdleCallback",
  "queueMicrotask",
  // promise reactions run after the current render, never during it
  "then",
  "catch",
  "finally",
]);
const LITERAL_ATTRS = new Set([
  "aria-label",
  "aria-description",
  "aria-roledescription",
  "aria-valuetext",
  "title",
  "placeholder",
  "alt",
  "label",
]);

const calleeName = (call) => {
  const e = call.expression;
  if (ts.isIdentifier(e)) return e.text;
  if (ts.isPropertyAccessExpression(e)) return e.name.text;
  return "";
};

/** Is `node` inside a function that only runs after render (effect, handler, timer, listener)? */
function inDeferredContext(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (!FN_KINDS.has(p.kind)) continue;
    const parent = p.parent;
    if (parent && ts.isCallExpression(parent) && parent.arguments.includes(p)) {
      const name = calleeName(parent);
      if (EFFECT_HOOKS.has(name) || CALLBACK_SINKS.has(name)) return true;
    }
    if (parent && ts.isJsxExpression(parent) && parent.parent && ts.isJsxAttribute(parent.parent)) {
      if (/^on[A-Z]/.test(parent.parent.name.getText())) return true;
    }
    const fnName =
      (p.name && ts.isIdentifier(p.name) && p.name.text) ||
      (parent && ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name) && parent.name.text) ||
      (parent && ts.isPropertyAssignment(parent) && parent.name.getText()) ||
      "";
    if (/^(?:handle[A-Z]|on[A-Z])/.test(fnName)) return true;
  }
  return false;
}

const inFunction = (node) => {
  for (let p = node.parent; p; p = p.parent) if (FN_KINDS.has(p.kind)) return true;
  return false;
};

/** Literal positions inside an expression that would render as text: the value itself and the
 *  branches of `? :`, `&&`, `||`, `??` — never into calls, functions or property arguments. */
function renderedLiterals(expr, out = []) {
  if (!expr) return out;
  if (ts.isParenthesizedExpression(expr)) return renderedLiterals(expr.expression, out);
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) out.push(expr);
  else if (ts.isTemplateExpression(expr)) out.push(expr);
  else if (ts.isConditionalExpression(expr)) {
    renderedLiterals(expr.whenTrue, out);
    renderedLiterals(expr.whenFalse, out);
  } else if (ts.isBinaryExpression(expr)) {
    const op = expr.operatorToken.kind;
    if (
      op === ts.SyntaxKind.AmpersandAmpersandToken ||
      op === ts.SyntaxKind.BarBarToken ||
      op === ts.SyntaxKind.QuestionQuestionToken
    ) {
      if (op !== ts.SyntaxKind.AmpersandAmpersandToken) renderedLiterals(expr.left, out);
      renderedLiterals(expr.right, out);
    } else if (op === ts.SyntaxKind.PlusToken) {
      // "Close " + name — a sentence built by concatenation is still a literal
      renderedLiterals(expr.left, out);
      renderedLiterals(expr.right, out);
    }
  }
  return out;
}

const HAS_LETTER = /\p{L}/u;
/** JSX text is raw: `&nbsp;` / `&times;` / `&#8230;` are characters, not words. */
const withoutEntities = (s) => s.replace(/&(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#x[0-9a-fA-F]+);/g, " ");
const CLASS_ATTR = /^(?:className|class)$|ClassName$/;

/** Strip `(x)`, `x as T`, `<T>x`, `x!` around an expression. */
function unwrap(expr) {
  while (
    ts.isParenthesizedExpression(expr) ||
    ts.isAsExpression(expr) ||
    ts.isNonNullExpression(expr) ||
    ts.isTypeAssertionExpression(expr) ||
    (ts.isSatisfiesExpression && ts.isSatisfiesExpression(expr))
  ) {
    expr = expr.expression;
  }
  return expr;
}
const literalText = (node) =>
  ts.isTemplateExpression(node)
    ? [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join(" ")
    : node.text;

/** All violations in one source file → [{ rule, line, text }]. */
export function checkSource(text, fileName = "file.tsx") {
  const kind = fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, kind);
  const lines = text.split(/\r?\n/);
  const isGlobalKeydownHook = /use-global-keydown\.tsx?$/.test(fileName);
  const out = [];
  const lineOf = (node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line;
  // An escape is a `//`, `/* */` or JSX `{/* */}` comment carrying `<tag>: <reason>`, either on
  // the violation's own line or on a COMMENT-ONLY line directly above it — so a trailing escape
  // on one line never leaks to the next line's code.
  const escaped = (rule, node) => {
    const tag = ESCAPES[rule];
    if (!tag) return false;
    const re = new RegExp(`(?://|/\\*).*\\b${tag}:\\s*[^\\s*/}]`);
    const l = lineOf(node);
    const above = lines[l - 1] ?? "";
    const aboveIsComment = /^\s*(?:\/\/|\/\*|\{\/\*|\*)/.test(above);
    return re.test(lines[l] ?? "") || (aboveIsComment && re.test(above));
  };
  const report = (rule, node, detail) => {
    if (escaped(rule, node)) return;
    out.push({ rule, line: lineOf(node) + 1, text: detail });
  };

  const visit = (node) => {
    // class-token rules: every string-ish literal except module specifiers
    const isStringish =
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node);
    const isSpecifier =
      node.parent &&
      (ts.isImportDeclaration(node.parent) ||
        ts.isExportDeclaration(node.parent) ||
        ts.isExternalModuleReference(node.parent) ||
        (ts.isCallExpression(node.parent) && node.parent.expression.kind === ts.SyntaxKind.ImportKeyword) ||
        ts.isLiteralTypeNode(node.parent));
    // A JSX attribute that is not a class attribute holds prose (`aria-label="Align text-left"`),
    // not classes — jsx-literal owns it.
    const attrHost =
      node.parent && ts.isJsxAttribute(node.parent)
        ? node.parent
        : node.parent && ts.isJsxExpression(node.parent) && node.parent.parent && ts.isJsxAttribute(node.parent.parent)
          ? node.parent.parent
          : null;
    const isProseAttr = attrHost !== null && !CLASS_ATTR.test(attrHost.name.getText(sf));
    if (isStringish && !isSpecifier && !isProseAttr) {
      const value = node.text;
      for (const hit of paletteHits(value)) report("palette", node, hit);
      for (const hit of physicalHits(value)) report("physical", node, hit);
    }

    if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
      const callee = node.expression;
      const args = node.arguments ?? [];
      const calleeText = callee.getText(sf);
      // template-fill
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(callee) &&
        /^replace(All)?$/.test(callee.name.text) &&
        args[0] &&
        (ts.isStringLiteral(args[0]) || ts.isNoSubstitutionTemplateLiteral(args[0])) &&
        args[0].text.startsWith("{")
      ) {
        report("template-fill", node, `${callee.name.text}("${args[0].text}")`);
      }
      // intl
      const intlMatch = calleeText.match(/^Intl\.(\w+)$/);
      const isUndefined = (a) => a && unwrap(a).kind === ts.SyntaxKind.Identifier && unwrap(a).getText(sf) === "undefined";
      if (intlMatch) {
        // `Intl.DateTimeFormat().resolvedOptions()` reads the runtime's zone/locale — not formatting.
        const readsOptions =
          ts.isPropertyAccessExpression(node.parent) && node.parent.name.text === "resolvedOptions";
        if (isUndefined(args[0])) report("intl", node, `Intl.${intlMatch[1]}(undefined…)`);
        else if (args.length === 0 && intlMatch[1] !== "getCanonicalLocales" && !readsOptions) {
          report("intl", node, `Intl.${intlMatch[1]}() without a locale`);
        }
        if (intlMatch[1] === "PluralRules" && args[0] && ts.isStringLiteral(args[0]) && args[0].text === "en") {
          report("intl", node, 'Intl.PluralRules("en")');
        }
        if (ts.isNewExpression(node) && !inFunction(node)) report("intl", node, `module-scope new Intl.${intlMatch[1]}`);
      }
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(callee) &&
        /^toLocale(?:Date|Time)?String$/.test(callee.name.text) &&
        (args.length === 0 || isUndefined(args[0]))
      ) {
        report("intl", node, `${callee.name.text}() without a locale`);
      }
      // clock
      const zeroDate = ts.isNewExpression(node) && calleeText === "Date" && args.length === 0;
      const dateNow = ts.isCallExpression(node) && calleeText === "Date.now" && args.length === 0;
      if ((zeroDate || dateNow) && !inDeferredContext(node)) {
        report("clock", node, zeroDate ? "new Date()" : "Date.now()");
      }
      // keydown
      if (
        !isGlobalKeydownHook &&
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(callee) &&
        callee.name.text === "addEventListener" &&
        args[0] &&
        (ts.isStringLiteral(args[0]) || ts.isNoSubstitutionTemplateLiteral(args[0])) &&
        args[0].text === "keydown"
      ) {
        // Window-level: window / document / their body / html, however reached or cast. A
        // listener on an aliased variable (`const doc = el.ownerDocument`) is not traced.
        const target = unwrap(callee.expression).getText(sf).replace(/\s+/g, "");
        if (/(?:^|\.)(?:window|document|globalThis|self|ownerDocument|defaultView|body|documentElement)$/.test(target)) {
          report("keydown", node, `${target}.addEventListener("keydown")`);
        }
      }
    }

    // jsx-literal
    if (ts.isJsxText(node) && HAS_LETTER.test(withoutEntities(node.text))) {
      report("jsx-literal", node, node.text.replace(/\s+/g, " ").trim());
    }
    if (ts.isJsxExpression(node) && node.expression) {
      const parent = node.parent;
      const inChildren = parent && (ts.isJsxElement(parent) || ts.isJsxFragment(parent));
      const attr = parent && ts.isJsxAttribute(parent) ? parent.name.getText(sf) : null;
      if (inChildren || (attr && LITERAL_ATTRS.has(attr))) {
        for (const lit of renderedLiterals(node.expression)) {
          const t = literalText(lit);
          if (HAS_LETTER.test(t)) report("jsx-literal", lit, `${attr ?? "child"}: ${t.replace(/\s+/g, " ").trim()}`);
        }
      }
    }
    if (
      ts.isJsxAttribute(node) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer) &&
      LITERAL_ATTRS.has(node.name.getText(sf)) &&
      HAS_LETTER.test(node.initializer.text)
    ) {
      report("jsx-literal", node, `${node.name.getText(sf)}="${node.initializer.text.replace(/\s+/g, " ")}"`);
    }

    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

// ── catalog + baseline ─────────────────────────────────────────────────────
export const componentOf = (p) => (p.startsWith(PREFIX) ? p.slice(PREFIX.length).split("/")[1] : null);

/** Shipped source files: every registry item's files, minus fixtures items (sample data). */
export function shippedFiles(registry) {
  const set = new Set();
  for (const item of registry.items) {
    if (item.name.endsWith("-fixtures")) continue;
    for (const f of item.files ?? []) if (/\.(tsx?)$/.test(f.path)) set.add(f.path);
  }
  return [...set].sort();
}

/** { rule: { path: [violation text, …] } } from a list of { path, violations }. */
export function collectByRule(results) {
  const byRule = Object.fromEntries(RULES.map((r) => [r, {}]));
  for (const { path, violations } of results) {
    for (const v of violations) (byRule[v.rule][path] ??= []).push(v.text);
  }
  for (const rule of RULES) for (const list of Object.values(byRule[rule])) list.sort();
  return byRule;
}

/** Multiset difference a − b over arrays of strings. */
function minus(a, b) {
  const left = new Map();
  for (const x of b) left.set(x, (left.get(x) ?? 0) + 1);
  const out = [];
  for (const x of a) {
    const n = left.get(x) ?? 0;
    if (n > 0) left.set(x, n - 1);
    else out.push(x);
  }
  return out;
}

/**
 * Compare current violations with the baseline (both `{ rule: { path: [text…] } }`), as
 * multisets per file → { fresh, shrunk, closedRows }. Fixing one violation and adding a
 * different one in the same file is one fresh + one shrunk — never a silent swap.
 */
export function compare(current, baseline) {
  const fresh = [];
  const shrunk = [];
  const closedRows = [];
  const closed = new Set(baseline.closed ?? []);
  for (const rule of RULES) {
    const base = baseline.rules?.[rule] ?? {};
    const now = current[rule] ?? {};
    for (const [path, texts] of Object.entries(now)) {
      const added = minus(texts, base[path] ?? []);
      if (added.length > 0) fresh.push({ rule, path, texts: added });
    }
    for (const [path, texts] of Object.entries(base)) {
      const gone = minus(texts, now[path] ?? []);
      if (gone.length > 0) shrunk.push({ rule, path, texts: gone });
      if (closed.has(componentOf(path))) closedRows.push({ rule, path });
    }
  }
  return { fresh, shrunk, closedRows };
}

/** The baseline minus every violation that no longer occurs — it never gains an entry. */
export function lowered(baseline, current) {
  const rules = {};
  for (const rule of RULES) {
    const base = baseline.rules?.[rule];
    if (!base) continue;
    rules[rule] = {};
    for (const [path, texts] of Object.entries(base)) {
      const now = current[rule]?.[path] ?? [];
      const kept = minus(texts, minus(texts, now)); // texts ∩ now (multiset)
      if (kept.length > 0) rules[rule][path] = kept;
    }
  }
  return { ...baseline, rules };
}

const total = (byRule, rule) => Object.values(byRule[rule] ?? {}).reduce((a, l) => a + l.length, 0);

function main() {
  const args = process.argv.slice(2);
  const arg = (f, d) => {
    const i = args.indexOf(f);
    return i >= 0 ? args[i + 1] : d;
  };
  const root = resolve(arg("--root", process.cwd()));
  const registryFile = resolve(arg("--registry", join(root, "registry.json")));
  const baselineFile = resolve(arg("--baseline", join(root, "scripts", "contract-baseline.json")));
  const registry = JSON.parse(readFileSync(registryFile, "utf8"));
  const files = shippedFiles(registry);
  const results = files.map((path) => ({
    path,
    violations: checkSource(readFileSync(join(root, path), "utf8"), path),
  }));
  const current = collectByRule(results);
  const baseline = existsSync(baselineFile)
    ? JSON.parse(readFileSync(baselineFile, "utf8"))
    : { closed: [], rules: {} };
  const write = (next) => writeFileSync(baselineFile, JSON.stringify(next, null, 2) + "\n");

  if (args.includes("--report")) {
    for (const rule of RULES) {
      const comps = new Set(Object.keys(current[rule]).map(componentOf));
      console.log(`${rule.padEnd(14)} ${String(total(current, rule)).padStart(5)}  ${comps.size} components`);
    }
    return;
  }
  const seed = arg("--seed-rule");
  if (seed) {
    if (!RULES.includes(seed)) throw new Error(`unknown rule ${seed}`);
    if (baseline.rules?.[seed]) {
      console.error(`✗ rule "${seed}" already has a baseline — it can only shrink (use --update-baseline).`);
      process.exit(1);
    }
    const closed = new Set(baseline.closed ?? []);
    const rows = Object.fromEntries(Object.entries(current[seed]).filter(([p]) => !closed.has(componentOf(p))));
    write({ ...baseline, rules: { ...baseline.rules, [seed]: rows } });
    console.log(`validate-contract — seeded "${seed}": ${Object.values(rows).reduce((a, l) => a + l.length, 0)} violation(s).`);
    return;
  }
  if (args.includes("--update-baseline")) {
    write(lowered(baseline, current));
    console.log("validate-contract — baseline lowered to the violations still present (never raised).");
    return;
  }

  const { fresh, shrunk, closedRows } = compare(current, baseline);
  const byPath = new Map(results.map((r) => [r.path, r.violations]));
  if (fresh.length + shrunk.length + closedRows.length > 0) {
    console.error(
      `✗ validate-contract — ${fresh.length} file(s) with new violations, ${shrunk.length} row(s) to shrink, ` +
        `${closedRows.length} row(s) for closed components:`,
    );
    for (const f of fresh) {
      console.error(`  - [${f.rule}] ${f.path}:`);
      for (const t of f.texts) {
        const v = byPath.get(f.path).find((x) => x.rule === f.rule && x.text === t);
        console.error(`      line ${v?.line ?? "?"}: ${t}`);
      }
    }
    for (const s of shrunk) {
      console.error(`  - [${s.rule}] ${s.path}: ${s.texts.length} baselined violation(s) fixed — run --update-baseline and commit`);
    }
    for (const c of closedRows) console.error(`  - [${c.rule}] ${c.path}: component is closed — fix it, never baseline it`);
    process.exit(1);
  }
  const summary = RULES.map((r) => `${r} ${total(current, r)}`).join(" · ");
  console.log(`validate-contract — ${files.length} shipped files, no new violations (${summary}).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
