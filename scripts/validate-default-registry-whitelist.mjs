#!/usr/bin/env node
/**
 * validate-default-registry-whitelist — F-03 drift lint for json-form.
 *
 * The v0.2.0 watch-drop optimization in `field-wrapper.tsx` consults
 * `BUILTIN_RENDERER_TYPES_SKIPPING_ALL_VALUES` (defined in
 * `lib/default-registry.ts`) to skip the FieldWrapper-level
 * `useWatch({ control })` for whitelisted types — `allValues` then comes
 * from a `getValues()` snapshot taken at render time.
 *
 * This is safe ONLY while every whitelisted renderer's source does not
 * read `args.allValues` reactively. If a future built-in renderer
 * regresses by accessing `allValues`, it MUST be removed from the
 * whitelist in the same commit, or fields of that type silently stop
 * re-rendering when other fields change.
 *
 * This script audits the drift class. For each type listed in the
 * whitelist:
 *
 *   1. Resolve `defaultJsonFormRegistry[type]` to a renderer identifier
 *      and follow its `import` (including `lazy(() => import(...))`
 *      indirection used for `code` / `richtext`) to the shipped source
 *      file under `parts/`.
 *   2. Scan that file for any `allValues` reference (`\ballValues\b`).
 *   3. Surface findings.
 *
 * Also surfaces structural drift:
 *   - Whitelist type that is NOT in `defaultJsonFormRegistry`.
 *   - Renderer identifier that doesn't resolve to a source file.
 *
 * Exit:
 *   0 — clean
 *   1 — at least one finding
 *   2 — script error (parse failure / IO error)
 *
 * Usage:
 *   node scripts/validate-default-registry-whitelist.mjs
 *   node scripts/validate-default-registry-whitelist.mjs --json
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const ROOT = process.cwd();
const REGISTRY_FILE = join(
  ROOT,
  "src",
  "registry",
  "components",
  "forms",
  "json-form",
  "lib",
  "default-registry.ts",
);

const args = process.argv.slice(2);
const jsonMode = args.includes("--json");

function fail(detail) {
  console.error(`validate-default-registry-whitelist: ${detail}`);
  process.exit(2);
}

if (!existsSync(REGISTRY_FILE)) {
  fail(`expected file not found: ${REGISTRY_FILE}`);
}

const source = readFileSync(REGISTRY_FILE, "utf8");

// ───────────────────────────────────────────────────────────────────────
// Parse the whitelist Set.
// ───────────────────────────────────────────────────────────────────────
const whitelistMatch = source.match(
  /BUILTIN_RENDERER_TYPES_SKIPPING_ALL_VALUES\s*:[^=]*=\s*new Set\(\[([\s\S]*?)\]\)/,
);
if (!whitelistMatch) {
  fail(
    "could not locate `BUILTIN_RENDERER_TYPES_SKIPPING_ALL_VALUES = new Set([...])` " +
      "in default-registry.ts; update the parser regex if the shape changed.",
  );
}
const whitelistTypes = Array.from(
  whitelistMatch[1].matchAll(/["']([^"']+)["']/g),
).map((m) => m[1]);

// ───────────────────────────────────────────────────────────────────────
// Parse `defaultJsonFormRegistry` object literal: type → identifier.
// ───────────────────────────────────────────────────────────────────────
const registryMatch = source.match(
  /defaultJsonFormRegistry\s*:[^=]*=\s*\{([\s\S]*?)\n\}\s*;?/,
);
if (!registryMatch) {
  fail(
    "could not locate `defaultJsonFormRegistry = { ... }` in default-registry.ts; " +
      "update the parser regex if the shape changed.",
  );
}
const registryBody = registryMatch[1];
const registryPairs = new Map();
for (const m of registryBody.matchAll(
  /(?:^|\n)\s*(?:["']?([\w-]+)["']?)\s*:\s*([A-Za-z_$][\w$]*)\s*,?/g,
)) {
  registryPairs.set(m[1], m[2]);
}

// ───────────────────────────────────────────────────────────────────────
// Resolve identifier → source path under parts/.
//
// Three shapes in default-registry.ts:
//   (a) `import { FieldText } from "../parts/field-text";`
//       → FieldText resolves to "../parts/field-text".
//   (b) `const LazyFieldCode = lazy(() => import("../parts/field-code"));`
//       → LazyFieldCode resolves to "../parts/field-code".
//   (c) `const FieldCode: FieldRenderer = (args) => createElement(LazyFieldCode, args);`
//       → FieldCode resolves through LazyFieldCode (chase one hop).
// ───────────────────────────────────────────────────────────────────────
const identifierToPath = new Map();

// (a) Named imports.
for (const m of source.matchAll(
  /import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']/g,
)) {
  const names = m[1]
    .split(",")
    .map((s) => s.trim().replace(/\s+as\s+(.+)$/, "$1"))
    .filter(Boolean);
  for (const name of names) identifierToPath.set(name, m[2]);
}

// (b) `const LazyX = lazy(() => import("path"))`
for (const m of source.matchAll(
  /const\s+(\w+)\s*=\s*lazy\s*\(\s*\(\s*\)\s*=>\s*import\s*\(\s*["']([^"']+)["']\s*\)\s*\)/g,
)) {
  identifierToPath.set(m[1], m[2]);
}

// (c) `const FieldX: FieldRenderer = (args) => createElement(LazyFieldX, args)`
const indirectChain = new Map();
for (const m of source.matchAll(
  /const\s+(\w+)\s*:\s*FieldRenderer[^=]*=\s*[\s\S]*?createElement\(\s*(\w+)\s*,/g,
)) {
  indirectChain.set(m[1], m[2]);
}

function resolveIdentifier(id, seen = new Set()) {
  if (seen.has(id)) return null;
  seen.add(id);
  if (identifierToPath.has(id)) return identifierToPath.get(id);
  if (indirectChain.has(id)) return resolveIdentifier(indirectChain.get(id), seen);
  return null;
}

// ───────────────────────────────────────────────────────────────────────
// Resolve a relative source-path token to an absolute file (.tsx | .ts).
// ───────────────────────────────────────────────────────────────────────
function resolveToFile(relPath) {
  if (!relPath.startsWith(".")) return null;
  const base = resolve(dirname(REGISTRY_FILE), relPath);
  for (const ext of [".tsx", ".ts", "/index.tsx", "/index.ts"]) {
    const candidate = base + ext;
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

// ───────────────────────────────────────────────────────────────────────
// Per-type drift check.
// ───────────────────────────────────────────────────────────────────────
const ALL_VALUES_RE = /\ballValues\b/;
const findings = [];

for (const type of whitelistTypes) {
  const identifier = registryPairs.get(type);
  if (!identifier) {
    findings.push({
      severity: "high",
      kind: "whitelist-type-not-in-registry",
      type,
      detail: `"${type}" is whitelisted but not present in defaultJsonFormRegistry.`,
    });
    continue;
  }
  const relPath = resolveIdentifier(identifier);
  if (!relPath) {
    findings.push({
      severity: "high",
      kind: "unresolvable-identifier",
      type,
      identifier,
      detail: `"${type}" → ${identifier}: could not resolve to a source file (no matching import / lazy chain).`,
    });
    continue;
  }
  const file = resolveToFile(relPath);
  if (!file) {
    findings.push({
      severity: "high",
      kind: "source-file-missing",
      type,
      identifier,
      relPath,
      detail: `"${type}" → ${identifier} → ${relPath}: source file not found on disk.`,
    });
    continue;
  }
  const content = readFileSync(file, "utf8");
  if (ALL_VALUES_RE.test(content)) {
    // Find the line for evidence.
    const lines = content.split(/\r?\n/);
    const lineIdx = lines.findIndex((l) => ALL_VALUES_RE.test(l));
    findings.push({
      severity: "high",
      kind: "allvalues-access-in-whitelisted-renderer",
      type,
      identifier,
      file: file.replace(ROOT + "\\", "").replace(ROOT + "/", "").replace(/\\/g, "/"),
      line: lineIdx + 1,
      evidence: lines[lineIdx]?.trim(),
      detail:
        `"${type}" renderer (${identifier}) reads \`allValues\` at ` +
        `line ${lineIdx + 1}, but it's in the FieldWrapper watch-drop ` +
        `whitelist. Either remove "${type}" from ` +
        `BUILTIN_RENDERER_TYPES_SKIPPING_ALL_VALUES, or replace the ` +
        `\`allValues\` read with \`useJsonFormFieldValue\` / ` +
        `\`useJsonFormFieldsValue\`.`,
    });
  }
}

// ───────────────────────────────────────────────────────────────────────
// Report.
// ───────────────────────────────────────────────────────────────────────
const totalHigh = findings.length;
const auditedCount = whitelistTypes.length;

if (jsonMode) {
  console.log(JSON.stringify({ auditedCount, totalHigh, findings }, null, 2));
} else {
  console.log("");
  console.log("validate:default-registry-whitelist — F-03 drift audit");
  console.log("========================================================\n");
  if (findings.length === 0) {
    console.log(
      `Audited ${auditedCount} whitelisted type${auditedCount === 1 ? "" : "s"} ` +
        `in BUILTIN_RENDERER_TYPES_SKIPPING_ALL_VALUES — all clean.`,
    );
  } else {
    for (const f of findings) {
      console.log(`  [⚠️ high  ] ${f.kind}: ${f.type}`);
      if (f.file) console.log(`             ${f.file}:${f.line}`);
      if (f.evidence) console.log(`             > ${f.evidence}`);
      console.log(`             ${f.detail}`);
      console.log("");
    }
    console.log("──────────────────────────────────────");
    console.log(
      `Audited ${auditedCount} whitelisted type${auditedCount === 1 ? "" : "s"} — ` +
        `${totalHigh} high finding${totalHigh === 1 ? "" : "s"}.`,
    );
  }
}

process.exit(totalHigh > 0 ? 1 : 0);
