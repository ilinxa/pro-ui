#!/usr/bin/env node
/**
 * validate:registry-tokens — every theme token a shipped component uses must reach the consumer.
 *
 * THE DEFECT CLASS. A component styles itself with `text-warning`, `bg-destructive-foreground`,
 * `var(--media-overlay)` ... a token that is NOT in the shadcn v4 default set. The docs site has
 * the token in its own `globals.css`, so everything looks right. A consumer who installs the item
 * gets a class that resolves to nothing: no colour, no error, no warning.
 *
 * THE LOCKED DELIVERY RULE (docs/plans/fix-now-batch-plan.md, decision 4)
 *
 *   A token reaches consumers ONLY through the item's `cssVars.theme` mapping WITH a fallback:
 *
 *     "cssVars": { "theme": { "color-warning": "var(--warning, oklch(0.78 0.16 75))" } }
 *
 *   `shadcn add` writes `theme` entries into `@theme inline` ONLY when the property is absent and
 *   never overwrites, so a consumer's own `--color-warning` / `--warning` always wins. Verified
 *   against the CLI source (update-css-vars-v4 / update-theme) and by an empirical install.
 *
 * RULES (all high severity)
 *
 *   missing-mapping  A non-default token used by an item's shipped files has no matching
 *                    `cssVars.theme["color-<token>"]` entry.
 *   forbidden-light-dark
 *                    An item carries `cssVars.light` or `cssVars.dark`. Those are matched by exact
 *                    top-level selector (`:root` / `.dark`); a consumer using `:root, :host`,
 *                    `[data-theme]` or `@layer base` gets a NEW rule appended at file end that
 *                    silently overrides their theme.
 *   forbidden-theme-dependency
 *                    An item's `registryDependencies` names a registry:theme|style|font|base item.
 *                    That flips the whole install to overwrite mode (every var replaced).
 *
 * Aliases (no `files[]`, or `meta.deprecated`) are skipped. `-fixtures` items ship only
 * dummy-data and are scanned like any other (they have no tokens, so they pass trivially).
 *
 * MODES
 *   node scripts/validate-registry-tokens.mjs                    # report-only, exit 0
 *   node scripts/validate-registry-tokens.mjs --strict           # exit 1 on findings
 *   node scripts/validate-registry-tokens.mjs --json             # machine output
 *   node scripts/validate-registry-tokens.mjs --list             # print the token scan table
 *   node scripts/validate-registry-tokens.mjs --registry <path> --root <path>   # override inputs
 */
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** shadcn v4 (new-york / base) default token set (verified against shadcn/dist/tailwind.css + preset). */
export const DEFAULT_TOKENS = new Set([
  "background", "foreground",
  "card", "card-foreground",
  "popover", "popover-foreground",
  "primary", "primary-foreground",
  "secondary", "secondary-foreground",
  "muted", "muted-foreground",
  "accent", "accent-foreground",
  "destructive",
  "border", "input", "ring",
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
  "sidebar", "sidebar-foreground",
  "sidebar-primary", "sidebar-primary-foreground",
  "sidebar-accent", "sidebar-accent-foreground",
  "sidebar-border", "sidebar-ring",
]);

/** Tokens that are not theme colours / are component-private, never need a mapping. */
const PRIVATE_PREFIXES = ["ilinxa-", "cal-", "radix-", "tw-", "font-", "radius", "spacing", "text-", "shadow-", "ease-", "animate-", "breakpoint-", "container-", "tracking-", "leading-", "blur-", "inset-shadow-", "drop-shadow-", "perspective-", "aspect-", "default-", "anchor-", "xy-"];

const COLOR_UTILS = [
  "bg", "text", "border", "ring-offset", "ring", "outline", "from", "via", "to", "fill", "stroke",
  "shadow", "divide", "decoration", "placeholder", "caret", "accent",
];

const PALETTE =
  /^(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d+)?$/;
const LITERALS = new Set(["black", "white", "transparent", "current", "inherit", "none", "auto"]);
/** Non-colour words that follow the colour-util prefixes (text-sm, border-dashed, shadow-lg ...). */
const NON_COLOR = new Set([
  "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl", "base", "inner",
  "left", "right", "center", "justify", "start", "end", "wrap", "nowrap", "balance", "pretty", "ellipsis", "clip",
  "solid", "dashed", "dotted", "double", "hidden", "wavy", "from-font", "collapse", "separate",
  "t", "b", "l", "r", "x", "y", "s", "e", "reverse", "offset", "opacity", "inset",
  "top", "bottom", "left-bottom", "right-bottom", "slide", "fade", "in", "out",
  "repeat", "no-repeat", "cover", "contain", "fixed", "local", "scroll", "radial", "conic", "linear",
  "mono", "sans", "serif", "heading", "tabular-nums", "nums", "normal", "italic",
  "full", "screen", "min", "max", "fit", "px", "square", "video", "slate",
  "color", "colors", "only", "add", "update", "remove", "tail", "anchor", "font",
]);

/** Blank out comments (preserving newlines/columns) so a token mentioned in prose is not "used". */
export function stripComments(src) {
  const blank = (m) => m.replace(/[^\n]/g, " ");
  return src
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:"'`\w\\])\/\/[^\n]*/g, (m, p) => p + blank(m.slice(p.length)));
}

function isPrivate(name) {
  return PRIVATE_PREFIXES.some((p) => name === p || name.startsWith(p));
}

/** Resolve the captured text after `<util>-` to a candidate colour token, or null. */
function candidateFromUtil(rest) {
  let r = rest;
  // side / axis qualifiers: border-t-warning, divide-x-warning, border-s-... (only strip when more follows)
  r = r.replace(/^(?:t|b|l|r|x|y|s|e)-(?=[a-z])/, "");
  if (!r || /^\d/.test(r)) return null;
  if (LITERALS.has(r) || NON_COLOR.has(r) || PALETTE.test(r)) return null;
  // palette with a trailing shade is already handled; 'text-red-500/20' arrives without alpha
  if (/^[a-z]+-\d+$/.test(r)) return null; // any palette-ish `name-NNN`
  if (/^(?:gradient|linear|radial|conic)(?:-|$)/.test(r)) return null; // gradient direction utilities
  if (/^(?:from|to|via)-\d+/.test(r)) return null;
  if (isPrivate(r)) return null;
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(r)) return null;
  return r;
}

/**
 * Scan one source text. Returns `[{token, line, kind, excerpt}]` for every non-default colour
 * token usage (utility class) and every `var(--x)` reference not defined in the same text.
 * `localDefs` (Set) lets the caller pass vars defined elsewhere in the item.
 */
export function scanText(raw, localDefs = new Set()) {
  const src = stripComments(raw.replace(/\r\n/g, "\n"));
  const found = [];
  const lineOf = (idx) => src.slice(0, idx).split("\n").length;
  const excerptAt = (idx) => src.slice(src.lastIndexOf("\n", idx) + 1, src.indexOf("\n", idx) === -1 ? undefined : src.indexOf("\n", idx)).trim().slice(0, 120);

  const utilRe = new RegExp(
    String.raw`(?<![\w\-./])(?:${COLOR_UTILS.join("|")})-([a-z0-9][a-z0-9-]*)(?:\/[\w.\[\]%]+)?(?![\w-]*\()`,
    "g",
  );
  let m;
  while ((m = utilRe.exec(src))) {
    const tok = candidateFromUtil(m[1]);
    if (!tok) continue;
    // `ring-offset-X`: the generic ring branch may have captured `offset-X`
    const t = tok.replace(/^offset-/, "");
    if (DEFAULT_TOKENS.has(t) || NON_COLOR.has(t) || !t) continue;
    found.push({ token: t, line: lineOf(m.index), kind: "utility", excerpt: excerptAt(m.index) });
  }

  // `var(--x)`, plus Tailwind v4's `bg-(--x)` shorthand and the bare `bg-[--x]` arbitrary form.
  // The shorthand forms must follow a utility dash, so JS like `(--count)` never matches.
  const varRe = /(?:var\(\s*|-[(\[])--([a-z0-9][a-z0-9-]*)/gi;
  while ((m = varRe.exec(src))) {
    const t = m[1];
    if (DEFAULT_TOKENS.has(t) || localDefs.has(t) || isPrivate(t)) continue;
    // `var(--x, fallback)` / `w-(--x,3rem)` resolves without the consumer defining `--x` — it is
    // an override knob, not a missing token. A var INSIDE the fallback is still matched by this
    // loop on its own, so `var(--x, var(--brand))` keeps flagging `brand`.
    if (/^\s*,/.test(src.slice(varRe.lastIndex))) continue;
    found.push({ token: t, line: lineOf(m.index), kind: "var()", excerpt: excerptAt(m.index) });
  }
  return found;
}

/** CSS custom properties a text DEFINES (so `var(--x)` of an own var is not a theme token). */
export function definedVars(raw) {
  const out = new Set();
  const re = /(?:^|[\s{;"'`\[(,])--([a-z0-9][a-z0-9-]*)\s*(?::|["'`]\s*:)/gi;
  let m;
  while ((m = re.exec(raw))) out.add(m[1]);
  // `["--x" as string]: value` / `'--x': value` object keys
  const keyRe = /["'`]--([a-z0-9][a-z0-9-]*)["'`]/gi;
  while ((m = keyRe.exec(raw))) out.add(m[1]);
  // `[--x:value]` Tailwind arbitrary property and `setProperty("--x"`
  return out;
}

/** `@ilinxa/foo` -> `foo` (registryDependencies spell our own items with the namespace). */
export function depName(dep) {
  return dep.replace(/^@ilinxa\//, "");
}

function effectiveTheme(item, byName, seen = new Set()) {
  if (seen.has(item.name)) return {};
  seen.add(item.name);
  let out = { ...(item.cssVars?.theme ?? {}) };
  for (const dep of item.registryDependencies ?? []) {
    const d = byName.get(depName(dep));
    if (d) out = { ...effectiveTheme(d, byName, seen), ...out };
  }
  return out;
}

export function isAlias(item) {
  return !item.files || item.files.length === 0 || item.meta?.deprecated === true;
}

const THEME_DEP_TYPES = new Set(["registry:theme", "registry:style", "registry:font", "registry:base"]);

/**
 * @param {{items:any[]}} registry
 * @param {string} root directory file paths resolve against
 * @returns {{scan: Record<string, Array<{token:string,file:string,line:number,kind:string,excerpt:string}>>, findings: Array<{rule:string,item:string,message:string}>}}
 */
export function validate(registry, root) {
  const byName = new Map(registry.items.map((i) => [i.name, i]));
  const scan = {};
  const findings = [];
  for (const item of registry.items) {
    if (isAlias(item)) continue;

    // rule: no cssVars.light / .dark
    const cv = item.cssVars ?? {};
    for (const k of ["light", "dark"]) {
      if (cv[k] && Object.keys(cv[k]).length > 0) {
        findings.push({
          rule: "forbidden-light-dark",
          item: item.name,
          message: `cssVars.${k} is forbidden (matched by exact selector; clobbers consumer themes) — ship cssVars.theme with a var() fallback instead`,
        });
      }
    }

    // rule: no registry:theme|style|font|base dependency
    for (const dep of item.registryDependencies ?? []) {
      const depItem = byName.get(depName(dep));
      if (depItem && THEME_DEP_TYPES.has(depItem.type)) {
        findings.push({
          rule: "forbidden-theme-dependency",
          item: item.name,
          message: `registryDependencies names "${dep}" (${depItem.type}) — flips every CSS var to overwrite mode`,
        });
      } else if (!depItem && /^(?:registry:(?:theme|style|font|base))$/.test(dep)) {
        findings.push({ rule: "forbidden-theme-dependency", item: item.name, message: `registryDependencies names "${dep}"` });
      }
    }

    // scan shipped files
    const texts = [];
    for (const f of item.files) {
      if (!/\.(?:tsx?|css|jsx?)$/.test(f.path)) continue;
      const abs = resolve(root, f.path);
      if (!existsSync(abs)) continue; // missing files are validate-registry-json's job
      texts.push({ path: f.path, text: readFileSync(abs, "utf8") });
    }
    const local = new Set();
    for (const t of texts) for (const v of definedVars(t.text)) local.add(v);

    const used = [];
    for (const t of texts) {
      for (const hit of scanText(t.text, local)) used.push({ ...hit, file: t.path });
    }
    if (used.length > 0) scan[item.name] = used;

    // effective mapping = own + every transitively-required ilinxa item (the CLI merges cssVars across the tree)
    const mapped = effectiveTheme(item, byName);
    const tokens = [...new Set(used.map((u) => u.token))].sort();
    for (const tok of tokens) {
      const key = `color-${tok}`;
      const bare = mapped[key] ?? mapped[`--${key}`];
      if (!bare) {
        const ex = used.find((u) => u.token === tok);
        findings.push({
          rule: "missing-mapping",
          item: item.name,
          message: `uses non-default token "${tok}" (${ex.file}:${ex.line}) but cssVars.theme has no "${key}"`,
        });
      }
    }
  }
  return { scan, findings };
}

/* ───────────────────────────── CLI ───────────────────────────── */

function argValue(args, flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

function main() {
  const args = process.argv.slice(2);
  const strict = args.includes("--strict") || args.includes("--check");
  const asJson = args.includes("--json");
  const list = args.includes("--list");
  const root = resolve(argValue(args, "--root") ?? process.cwd());
  const registryPath = resolve(argValue(args, "--registry") ?? join(root, "registry.json"));

  const registry = JSON.parse(readFileSync(registryPath, "utf8").replace(/\r\n/g, "\n"));
  const { scan, findings } = validate(registry, root);

  if (asJson) {
    console.log(JSON.stringify({ scan, findings }, null, 2));
  } else {
    if (list) {
      for (const [name, used] of Object.entries(scan)) {
        const byTok = new Map();
        for (const u of used) if (!byTok.has(u.token)) byTok.set(u.token, u);
        console.log(`${name}`);
        for (const [tok, u] of byTok) console.log(`  ${tok}  ${u.file}:${u.line}  [${u.kind}]  ${u.excerpt}`);
      }
      console.log("");
    }
    const nonAlias = registry.items.filter((i) => !isAlias(i)).length;
    console.log(`validate:registry-tokens — ${nonAlias} non-alias items scanned, ${Object.keys(scan).length} use non-default tokens`);
    if (findings.length === 0) {
      console.log("  OK — 0 findings");
    } else {
      for (const f of findings) console.log(`  HIGH  [${f.rule}]  ${f.item}: ${f.message}`);
      console.log(`  ${findings.length} finding(s)`);
    }
  }
  if (strict && findings.length > 0) process.exit(1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
