#!/usr/bin/env node
/**
 * validate-cross-category-imports.mjs — guards the one import shape the shadcn
 * CLI can mis-resolve on install. R12 / C10.
 *
 * A shipped file that imports `@/registry/components/<cat>/<slug>/…` from a
 * DIFFERENT category is rewritten by the CLI and then resolved by a basename
 * scan of the installed files — so a target whose basename (`path`, `types`,
 * `utils`, `index` …) is shared by another shipped file can resolve into the
 * wrong component in a consumer that has both installed. The CLI does not
 * rewrite `export … from` or dynamic `import()` at all.
 *
 * Rules, for every file shipped by an item in registry.json:
 *   A. a cross-category static import must target a file whose basename is
 *      unique across all shipped files;
 *   B. a cross-category `export … from` fails;
 *   C. a cross-category dynamic `import()` fails.
 * Same-category imports are out of scope (the CLI rewrites them relative).
 *
 * Known violations at landing live in scripts/cross-category-imports-baseline.json
 * (`[{ importer, target, rule, owner }]`); a baseline row that no longer occurs
 * fails, so the list only shrinks.
 *
 * Usage:
 *   node scripts/validate-cross-category-imports.mjs
 *   node scripts/validate-cross-category-imports.mjs --registry <f> --root <dir> --baseline <f>   # tests
 *
 * Exit: 0 clean · 1 a new violation or a stale baseline row
 */

import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PREFIX = "src/registry/components/";
const SPEC = String.raw`(?<q>["'\`])@/registry/components/(?<cat>[^/"'\`]+)/(?<rest>[^"'\`]+)\k<q>`;

const stripExt = (p) => basename(p).replace(/\.(tsx?|jsx?|mjs|cjs)$/, "");
const categoryOf = (repoPath) => repoPath.slice(PREFIX.length).split("/")[0];

/**
 * Blank out comments (keeping offsets and newlines) so an import inside a JSDoc
 * example never counts. String and template literals are skipped as units, so a
 * `/*` or `//` inside one (`"image/*"`, `https://`) never opens a comment, and a
 * `/*` inside a line comment never swallows the code after it.
 */
export function stripComments(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const next = src[i + 1];
    if (c === "/" && next === "/") {
      for (; i < n && src[i] !== "\n"; i++) out += " ";
    } else if (c === "/" && next === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end < 0 ? n : end + 2;
      for (; i < stop; i++) out += src[i] === "\n" ? "\n" : " ";
    } else if (c === '"' || c === "'" || c === "`") {
      // A string or template literal is copied as one unit: nothing inside it opens a comment.
      let j = i + 1;
      while (j < n && src[j] !== c) {
        if (src[j] === "\\") j++; // skip the escaped character
        j++;
        if (c !== "`" && src[j - 1] === "\n") break; // unterminated plain string: stop at the line
      }
      const stop = j < n && src[j] === c ? j + 1 : j;
      out += src.slice(i, stop);
      i = stop;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

/**
 * [{ kind: "import"|"export"|"dynamic", cat, rest }] for every @/registry/components
 * specifier. `kind` comes from the keyword that STARTS the statement holding the
 * `from` (so a file without semicolons cannot leak one statement's keyword into the
 * next); side-effect `import "…"` is an import; `typeof import("…")` is a type, not a load.
 */
export function findSpecifiers(src) {
  const text = stripComments(src);
  const out = [];
  const starts = [...text.matchAll(/(?:^|[;\n{}])\s*(import|export)\b/g)].map((m) => ({
    at: m.index + m[0].length,
    kind: m[1],
  }));
  for (const m of text.matchAll(new RegExp(String.raw`\bfrom\s*` + SPEC, "g"))) {
    const start = starts.filter((s) => s.at <= m.index).pop();
    out.push({ kind: start?.kind ?? "import", cat: m.groups.cat, rest: m.groups.rest });
  }
  for (const m of text.matchAll(new RegExp(String.raw`(?:^|[;\n])\s*import\s*` + SPEC, "g"))) {
    out.push({ kind: "import", cat: m.groups.cat, rest: m.groups.rest });
  }
  for (const m of text.matchAll(new RegExp(String.raw`(?<type>\btypeof\s+)?\bimport\s*\(\s*` + SPEC, "g"))) {
    if (m.groups.type) continue;
    out.push({ kind: "dynamic", cat: m.groups.cat, rest: m.groups.rest });
  }
  return out;
}

/** Resolve `<cat>/<rest>` to a shipped repo path (exact file, extension, or index). */
function resolveTarget(cat, rest, shipped) {
  const base = `${PREFIX}${cat}/${rest}`;
  const candidates = [
    base,
    ...[".ts", ".tsx", ".js", ".jsx"].map((e) => base + e),
    ...["/index.ts", "/index.tsx"].map((e) => base + e),
  ];
  return candidates.find((c) => shipped.has(c)) ?? null;
}

/** Returns [{ importer, target, rule, detail }]. `files` maps repo path → source text. */
export function findViolations(files) {
  const shipped = new Set(files.keys());
  const byBase = new Map();
  for (const p of shipped) {
    const b = stripExt(p);
    byBase.set(b, (byBase.get(b) ?? 0) + 1);
  }
  const violations = [];
  for (const [importer, src] of files) {
    if (!/\.(tsx?|jsx?)$/.test(importer)) continue;
    const cat = categoryOf(importer);
    for (const s of findSpecifiers(src)) {
      if (s.cat === cat) continue;
      const target = `${s.cat}/${s.rest}`;
      if (s.kind === "export") {
        violations.push({ importer, target, rule: "B", detail: "cross-category `export … from` is not rewritten by the CLI" });
        continue;
      }
      if (s.kind === "dynamic") {
        violations.push({ importer, target, rule: "C", detail: "cross-category dynamic `import()` is not rewritten by the CLI" });
        continue;
      }
      const resolved = resolveTarget(s.cat, s.rest, shipped);
      if (!resolved) {
        violations.push({ importer, target, rule: "A", detail: "target is not a shipped file" });
        continue;
      }
      const n = byBase.get(stripExt(resolved)) ?? 0;
      if (n > 1) {
        violations.push({
          importer,
          target,
          rule: "A",
          detail: `basename "${stripExt(resolved)}" is shared by ${n} shipped files`,
        });
      }
    }
  }
  return violations;
}

const key = (v) => `${v.importer}|${v.target}|${v.rule}`;

/** Splits violations against the baseline → { fresh, stale }. */
export function applyBaseline(violations, baseline) {
  const allowed = new Set(baseline.map(key));
  const seen = new Set(violations.map(key));
  return {
    fresh: violations.filter((v) => !allowed.has(key(v))),
    stale: baseline.filter((b) => !seen.has(key(b))),
  };
}

function main() {
  const args = process.argv.slice(2);
  const arg = (f, d) => {
    const i = args.indexOf(f);
    return resolve(i >= 0 ? args[i + 1] : d);
  };
  const root = arg("--root", process.cwd());
  const registryFile = arg("--registry", join(root, "registry.json"));
  const baselineFile = arg("--baseline", join(root, "scripts", "cross-category-imports-baseline.json"));

  const registry = JSON.parse(readFileSync(registryFile, "utf8"));
  const files = new Map();
  for (const item of registry.items) {
    for (const f of item.files ?? []) {
      if (!f.path?.startsWith(PREFIX) || files.has(f.path)) continue;
      files.set(f.path, readFileSync(join(root, f.path), "utf8"));
    }
  }
  const baseline = existsSync(baselineFile) ? JSON.parse(readFileSync(baselineFile, "utf8")) : [];
  const violations = findViolations(files);
  const { fresh, stale } = applyBaseline(violations, baseline);
  if (fresh.length > 0 || stale.length > 0) {
    console.error(`✗ validate-cross-category-imports — ${fresh.length} new violation(s), ${stale.length} stale baseline row(s):`);
    for (const v of fresh) console.error(`  - [${v.rule}] ${v.importer} → ${v.target}: ${v.detail}`);
    for (const b of stale) console.error(`  - stale baseline row (no longer occurs — delete it): ${b.importer} → ${b.target} [${b.rule}]`);
    process.exit(1);
  }
  console.log(
    `validate-cross-category-imports — ${files.size} shipped files clean ` +
      `(${violations.length} baselined violation(s)).`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
