#!/usr/bin/env node
/**
 * validate:barrel-exports — catalog-wide scan for public types unreachable
 * from a component's `index.ts` (plan docs/plans/test-infrastructure-plan.md
 * §R0.4/S5, invariant T6).
 *
 * The defect class: `card-tree` shipped `index.ts` re-exports for its v0.1 /
 * v0.2 / v0.4 types.ts additions but skipped v0.3 entirely — 20 of 47
 * `types.ts` exports, including `CustomPredefinedKey` (the type the
 * component's own documented example tells consumers to import), were
 * unreachable from the package root for three minor versions. Nothing in the
 * existing gate battery (tsc, lint, meta-deps, doc-drift) can see this: every
 * one of those types is used internally, so the component compiles clean —
 * the break only surfaces when an EXTERNAL consumer tries `import type { X }
 * from "@ilinxa/<slug>"` and it isn't there.
 *
 * THE RULE (deliberately narrower than "everything in types.ts must be
 * re-exported" — that naive rule flags legitimate reducer/context internals,
 * e.g. task-card's `State` / `Action`):
 *
 *   A type is a finding only if it is TRANSITIVELY REFERENCED by a type
 *   `index.ts` actually exports (e.g. `<Name>Props`, `<Name>Handle`, an event
 *   payload) AND is not itself importable from `index.ts`.
 *
 * Walk:
 *   1. Seed = every type name `index.ts` re-exports from this slug's own
 *      "./types" (or the whole file, if `index.ts` re-exports it as a
 *      blanket `export type * from "./types"` / `export * from "./types"`
 *      — in which case the slug is fully reachable and skipped).
 *   2. A handful of components re-export a locally-declared type from a
 *      NON-types.ts file inside the same slug (e.g. card-tree-node's
 *      `PortEditorStripProps` lives in `parts/port-editor-strip.tsx`). Those
 *      declarations are inspected too (one hop) for references into this
 *      slug's `types.ts`, so a chain like `PortEditorStripProps ->
 *      PortEditorPermissions` (declared in types.ts) still seeds correctly.
 *   3. From the seed set, walk type-to-type references INSIDE types.ts only
 *      (regex-based — the rest of the repo's validators are regex-based too;
 *      a missed finding beats a false positive per the S5 mandate). A
 *      reference is "identifier X appears as a whole word in the body of a
 *      type/interface declaration Y", where X is itself a name declared in
 *      types.ts.
 *   4. Anything reached by the walk that ISN'T in the seed/exported set is a
 *      finding.
 *
 * Modes:
 *   node scripts/validate-barrel-exports.mjs             # report-only, exit 0
 *   node scripts/validate-barrel-exports.mjs --strict     # exit 1 on findings
 *   node scripts/validate-barrel-exports.mjs --json        # machine output
 *   node scripts/validate-barrel-exports.mjs <slug>        # single slug
 *
 * NOT wired into `registry:build` / `vercel-build` — report-only per explicit
 * user decision (test-infrastructure-plan.md §R0.4, 2026-08-17): validator
 * now, catalog-wide sweep is its own fix program.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const COMPONENTS_DIR = join(ROOT, "src", "registry", "components");

const args = process.argv.slice(2);
const strict = args.includes("--strict") || args.includes("--check");
const jsonMode = args.includes("--json");
const targetSlug = args.find((a) => !a.startsWith("--"));

// ───────────────────────────────────────────────────────────────────────
// Discover slugs (same walk shape as validate-meta-deps.mjs)
// ───────────────────────────────────────────────────────────────────────
function findAllSlugs() {
  const out = [];
  for (const cat of readdirSync(COMPONENTS_DIR)) {
    if (cat === "_template") continue;
    const catDir = join(COMPONENTS_DIR, cat);
    if (!statSync(catDir).isDirectory()) continue;
    for (const slug of readdirSync(catDir)) {
      const dir = join(catDir, slug);
      if (!statSync(dir).isDirectory()) continue;
      if (!existsSync(join(dir, "index.ts"))) continue;
      if (!existsSync(join(dir, "types.ts"))) continue;
      out.push({ slug, category: cat, dir });
    }
  }
  return out;
}

// ───────────────────────────────────────────────────────────────────────
// Comment stripping (P4 F-1/F-4 lesson: normalize \r\n on read; strip
// comments before regex-scanning so a commented-out reference/example can't
// register a phantom edge or a phantom export).
// ───────────────────────────────────────────────────────────────────────
function readNormalized(path) {
  return readFileSync(path, "utf8").replace(/\r\n/g, "\n");
}

/** String-literal-aware comment stripper — handles BOTH full-line and
 * trailing inline `//` comments (multi-line `export type { A, // note` lists
 * are common in this repo and a full-line-only stripper leaves the trailing
 * comment glued to the next identifier, corrupting name extraction) plus
 * `/* *‍/` blocks. Never strips `//` inside a string/template literal. */
function stripComments(src) {
  let out = "";
  let inString = null;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1];
    if (inString) {
      out += ch;
      if (ch === "\\") { out += next ?? ""; i++; continue; }
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { inString = ch; out += ch; continue; }
    if (ch === "/" && next === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      out += "\n";
      continue;
    }
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++;
      i++; // land on the closing '/'
      continue;
    }
    out += ch;
  }
  return out;
}

const IDENT = "[A-Za-z_$][\\w$]*";

// ───────────────────────────────────────────────────────────────────────
// Balanced-bracket / string-aware scanners.
// ───────────────────────────────────────────────────────────────────────

/** Scan forward from `startIdx` to the first TOP-LEVEL ';' (depth 0 across
 * {}/[]/(), string-literal-aware). Used for `type Name = <BODY>;`. */
function scanToTopLevelSemicolon(text, startIdx) {
  let depth = 0;
  let inString = null;
  let i = startIdx;
  for (; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === "\\") { i++; continue; }
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { inString = ch; continue; }
    if (ch === "{" || ch === "[" || ch === "(") { depth++; continue; }
    if (ch === "}" || ch === "]" || ch === ")") { depth--; continue; }
    if (ch === ";" && depth <= 0) return { body: text.slice(startIdx, i), end: i + 1 };
  }
  return { body: text.slice(startIdx), end: text.length };
}

/** Find the index of the '{' matching the '{' at `openIdx` (string-aware). */
function matchBrace(text, openIdx) {
  let depth = 0;
  let inString = null;
  for (let i = openIdx; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === "\\") { i++; continue; }
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") { inString = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return i; }
  }
  return text.length - 1;
}

// ───────────────────────────────────────────────────────────────────────
// Parse every locally-declared type/interface name in a source file's text.
// Returns Map<name, { body, kind }>. `body` is the text scanned for
// referenced identifiers (for interfaces: header + extends clause + members;
// for aliases: the RHS). Type-only re-exports from elsewhere in the same
// slug ("export type { X } from "./lib/y"") are recorded as opaque leaves —
// declared/importable, but not walked further.
// ───────────────────────────────────────────────────────────────────────
function parseDeclaredTypes(src) {
  const declared = new Map();

  // export interface Name<T>? (extends X)? { ... }
  const ifaceRe = new RegExp(`export\\s+interface\\s+(${IDENT})`, "g");
  let m;
  while ((m = ifaceRe.exec(src))) {
    const name = m[1];
    const braceIdx = src.indexOf("{", m.index);
    if (braceIdx === -1) continue;
    const closeIdx = matchBrace(src, braceIdx);
    const body = src.slice(m.index, closeIdx + 1); // includes "interface Name extends X {...}"
    declared.set(name, { body, kind: "interface" });
  }

  // export type Name<T>? = <BODY>;
  const aliasRe = new RegExp(`export\\s+type\\s+(${IDENT})\\s*(<[^={]*>)?\\s*=`, "g");
  while ((m = aliasRe.exec(src))) {
    const name = m[1];
    if (declared.has(name)) continue; // already captured (shouldn't happen)
    const { body } = scanToTopLevelSemicolon(src, m.index + m[0].length);
    declared.set(name, { body, kind: "alias" });
  }

  // export type { A, B } from "./somewhere-else-in-this-slug";  (opaque leaves)
  const reExportRe = /export\s+type\s+\{([^}]*)\}\s+from\s+["']([^"']+)["']/g;
  while ((m = reExportRe.exec(src))) {
    const names = m[1].split(",").map((s) => s.trim()).filter(Boolean);
    for (const raw of names) {
      const name = raw.replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim();
      if (!name || declared.has(name)) continue;
      declared.set(name, { body: "", kind: "opaque-reexport", from: m[2] });
    }
  }

  return declared;
}

// ───────────────────────────────────────────────────────────────────────
// Parse index.ts export statements.
// ───────────────────────────────────────────────────────────────────────
function isOwnTypesPath(p) {
  return /^\.\/types(\.tsx?)?$/.test(p);
}

function parseIndexExports(src) {
  const result = {
    reExportsAll: false, // export type * from "./types" | export * from "./types"
    fromOwnTypes: new Set(), // names sourced literally from "./types"
    otherTypeExports: [], // { names: [...], path } for "export type {...} from '<not ./types>'"
    mixedExports: [], // { items: [{name,isType}], path } for "export {...} from '<path>'"
  };

  if (/export\s+type\s+\*\s+from\s+["']\.\/types(\.tsx?)?["']/.test(src)) {
    result.reExportsAll = true;
  }
  if (/export\s+\*\s+from\s+["']\.\/types(\.tsx?)?["']/.test(src)) {
    result.reExportsAll = true;
  }
  if (result.reExportsAll) return result;

  // export type { A, B } from "<path>";
  const typeBlockRe = /export\s+type\s+\{([^}]*)\}\s+from\s+["']([^"']+)["']/g;
  let m;
  while ((m = typeBlockRe.exec(src))) {
    const names = m[1].split(",").map((s) => s.trim()).filter(Boolean)
      .map((s) => s.split(/\s+as\s+/)[0].trim());
    const path = m[2];
    if (isOwnTypesPath(path)) {
      for (const n of names) result.fromOwnTypes.add(n);
    } else {
      result.otherTypeExports.push({ names, path });
    }
  }

  // export { A, type B, C } from "<path>";  (mixed / value blocks)
  // Skip statements already matched as pure `export type {...}` above by
  // requiring the keyword right after `export` NOT be `type`.
  const mixedRe = /export\s*\{([^}]*)\}\s+from\s+["']([^"']+)["']/g;
  while ((m = mixedRe.exec(src))) {
    // Re-derive whether this specific match was the pure-type form already
    // counted above: pure-type form has "type" immediately before "{" at
    // m.index (i.e. preceded by "type\s+" right at the match start region).
    const precedingSlice = src.slice(Math.max(0, m.index - 6), m.index);
    if (/type\s*$/.test(precedingSlice)) continue; // already handled as typeBlockRe
    const items = m[1].split(",").map((s) => s.trim()).filter(Boolean).map((raw) => {
      const isType = /^type\s+/.test(raw);
      const name = raw.replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim();
      return { name, isType };
    });
    const path = m[2];
    if (isOwnTypesPath(path)) {
      for (const it of items) if (it.isType) result.fromOwnTypes.add(it.name);
    } else {
      result.mixedExports.push({ items, path });
    }
  }

  return result;
}

// ───────────────────────────────────────────────────────────────────────
// Resolve a relative import specifier (from index.ts, always "./x" or
// "../x") to a same-slug source file, if it stays inside the slug dir.
// Returns absolute file path (best-effort extension probing) or null.
// ───────────────────────────────────────────────────────────────────────
function resolveSameSlugFile(dir, spec) {
  if (!spec.startsWith(".")) return null;
  if (spec.startsWith("..")) return null; // escapes the slug — cross-component, not walked
  const base = join(dir, spec);
  for (const ext of [".ts", ".tsx", "/index.ts", "/index.tsx"]) {
    const candidate = base + ext;
    if (existsSync(candidate)) return candidate;
  }
  if (existsSync(base) && statSync(base).isFile()) return base;
  return null;
}

/** Extract the declaration body text for a named type OR value export inside
 * a same-slug file (one hop only — not walked further). For a type/interface
 * declared there, returns its RHS/brace body. For a value export with an
 * explicit type annotation (`export const X: T<...> = ...` or
 * `export function X(...): T {`), returns the annotation text. Empty string
 * if nothing usable is found. */
function extractExternalDeclarationBody(fileSrc, name, isType) {
  if (isType) {
    const local = parseDeclaredTypes(fileSrc);
    if (local.has(name)) return local.get(name).body;
    return "";
  }
  // value export with an inline type annotation
  const constRe = new RegExp(`export\\s+const\\s+${name}\\s*:\\s*([^=]+)=`);
  const cm = fileSrc.match(constRe);
  if (cm) return cm[1];
  const fnRe = new RegExp(`export\\s+function\\s+${name}\\s*\\([^)]*\\)\\s*:\\s*([^{]+)\\{`);
  const fm = fileSrc.match(fnRe);
  if (fm) return fm[1];
  return "";
}

// ───────────────────────────────────────────────────────────────────────
// Per-slug analysis.
// ───────────────────────────────────────────────────────────────────────
function analyzeSlug({ slug, category, dir }) {
  const indexSrc = stripComments(readNormalized(join(dir, "index.ts")));
  const typesSrc = stripComments(readNormalized(join(dir, "types.ts")));

  const declared = parseDeclaredTypes(typesSrc); // name -> { body, kind }
  const idx = parseIndexExports(indexSrc);

  if (idx.reExportsAll) {
    return {
      slug,
      category,
      reExportsAll: true,
      totalDeclared: declared.size,
      exemptCount: declared.size,
      findings: [],
    };
  }

  const seeds = new Set([...idx.fromOwnTypes].filter((n) => declared.has(n)));
  const exemptSet = new Set(idx.fromOwnTypes); // "already importable from index.ts"

  // One-hop chase: type exports re-exported from another same-slug file.
  for (const { names, path } of idx.otherTypeExports) {
    const file = resolveSameSlugFile(dir, path);
    if (!file) continue;
    const fileSrc = stripComments(readNormalized(file));
    for (const name of names) {
      const body = extractExternalDeclarationBody(fileSrc, name, true);
      for (const key of declared.keys()) {
        if (key === name) continue;
        if (new RegExp(`\\b${key}\\b`).test(body)) seeds.add(key);
      }
    }
  }
  // Mixed export blocks from another same-slug file (value + type items).
  for (const { items, path } of idx.mixedExports) {
    const file = resolveSameSlugFile(dir, path);
    if (!file) continue;
    const fileSrc = stripComments(readNormalized(file));
    for (const { name, isType } of items) {
      const body = extractExternalDeclarationBody(fileSrc, name, isType);
      if (!body) continue;
      for (const key of declared.keys()) {
        if (key === name) continue;
        if (new RegExp(`\\b${key}\\b`).test(body)) seeds.add(key);
      }
    }
  }

  // BFS over types.ts-declared types only.
  const visited = new Set();
  const queue = [...seeds];
  while (queue.length) {
    const name = queue.pop();
    if (visited.has(name)) continue;
    visited.add(name);
    const decl = declared.get(name);
    if (!decl || !decl.body) continue;
    for (const key of declared.keys()) {
      if (key === name || visited.has(key)) continue;
      if (new RegExp(`\\b${key}\\b`).test(decl.body)) queue.push(key);
    }
  }

  /* A type this slug merely RE-EXPORTS from another component is not this
   * slug's to publish. `card-tree-node/types.ts` re-exports `CardTreeJsonNode`
   * from `../card-tree/types`, and its `index.ts` deliberately DROPS that
   * re-export under the F-S1 lock (index.ts:18-31): shadcn's path rewriter
   * mis-rewrites cross-procomp barrel re-exports, so the documented contract is
   * that consumers import it from `@ilinxa/card-tree` directly. Flagging it
   * would push authors to reintroduce a known-broken pattern — the validator
   * would be actively harmful. Locally-declared types are unaffected. */
  const isForeignReExport = (n) => {
    const d = declared.get(n);
    if (!d || d.kind !== "opaque-reexport" || typeof d.from !== "string") return false;
    // Relative form: "../<other-slug>/..." — any path climbing out of this component.
    if (d.from.startsWith("../")) return true;
    /* Alias form: "@/registry/components/<cat>/<slug>/...". No component uses
     * this for a type re-export today (the F-S1 lock pushes authors to relative
     * paths), but it is an established convention elsewhere in the repo — see
     * `internalSlugFromImport` in validate-meta-deps.mjs — so cover it now
     * rather than emit a false positive the first time someone uses it. */
    const alias = d.from.match(/^@\/registry\/components\/[^/]+\/([^/]+)/);
    return alias ? alias[1] !== slug : false;
  };

  const findings = [...visited]
    .filter((n) => !exemptSet.has(n) && !isForeignReExport(n))
    .sort();

  return {
    slug,
    category,
    reExportsAll: false,
    totalDeclared: declared.size,
    exemptCount: exemptSet.size,
    findings,
  };
}

// ───────────────────────────────────────────────────────────────────────
// Run + report
// ───────────────────────────────────────────────────────────────────────
const allSlugs = findAllSlugs();
const targets = targetSlug ? allSlugs.filter((s) => s.slug === targetSlug) : allSlugs;

if (targetSlug && targets.length === 0) {
  console.error(`Unknown slug: ${targetSlug}`);
  process.exit(2);
}

const results = targets.map(analyzeSlug);
const totalHigh = results.reduce((n, r) => n + r.findings.length, 0);
const flaggedSlugs = results.filter((r) => r.findings.length > 0);

if (jsonMode) {
  console.log(JSON.stringify({ totalHigh, results }, null, 2));
} else {
  console.log("");
  console.log("validate:barrel-exports — public-type reachability audit");
  console.log("==========================================================\n");

  for (const r of flaggedSlugs) {
    console.log(`▸ ${r.category}/${r.slug}  (${r.findings.length} high)`);
    for (const name of r.findings) {
      console.log(`  [⚠️ high  ] ${name}: referenced by an exported type but not importable from index.ts`);
    }
    console.log("");
  }

  const totalSlugs = results.length;
  const cleanSlugs = totalSlugs - flaggedSlugs.length;
  console.log("──────────────────────────────────────");
  console.log(
    `Audited ${totalSlugs} component${totalSlugs === 1 ? "" : "s"} — ` +
      `${cleanSlugs} clean, ${flaggedSlugs.length} with findings.`,
  );
  console.log(`Findings: ${totalHigh} high · 0 warn.`);
  console.log(
    strict
      ? "(--strict mode)"
      : "(report-only — exits 0 regardless of findings; pass --strict to gate)",
  );
}

process.exit(strict && totalHigh > 0 ? 1 : 0);
