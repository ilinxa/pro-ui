#!/usr/bin/env node
/**
 * validate-meta-deps — lint procomp `meta.ts` dependency declarations.
 *
 * Resolves F-cross-07 (cross-component dep declaration drift). Three
 * sub-shapes audited per slug:
 *
 *   (a) Version drift — `meta.npm[pkg]` range differs from producer's
 *       `package.json`. Catches wrong-major (rich-card `@dnd-kit/sortable`
 *       declared `^11.x`, producer has `^10.0.0`) and non-standard semver.
 *
 *   (b) Phantom npm dep — `meta.npm[pkg]` declared but no shipped source
 *       file imports it. Catches `radix-ui: ^1.4.3` leaking into forms
 *       components from a producer-side dep that's never used by registry
 *       code. Shipped source = everything in the slug folder EXCEPT
 *       `demo.tsx`, `usage.tsx`, `meta.ts`.
 *
 *   (c) Over-declared shadcn primitive — `meta.shadcn[i]` declared but no
 *       shipped file imports `@/components/ui/<name>`. Catches `tabs` /
 *       `badge` / `button` listed in `meta.shadcn` for demo-only usage.
 *
 * Plus a forbidden-list (umbrella packages):
 *   - `radix-ui` — must use shadcn primitives or specific @radix-ui/*
 *
 * Usage:
 *   node scripts/validate-meta-deps.mjs              # all components
 *   node scripts/validate-meta-deps.mjs <slug>       # single slug
 *   node scripts/validate-meta-deps.mjs --json       # machine output
 *
 * Exit:
 *   0 — clean
 *   1 — at least one finding
 *   2 — script error (parse failure / IO error)
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const COMPONENTS_DIR = join(ROOT, "src", "registry", "components");
const PRODUCER_PKG = join(ROOT, "package.json");

// Built-in module names + project aliases that never need declaration.
const ALWAYS_OK = new Set([
  "react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime",
]);

// Umbrella packages forbidden in meta.npm.
const FORBIDDEN_NPM = new Set(["radix-ui"]);

// ───────────────────────────────────────────────────────────────────────
// CLI args
// ───────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const jsonMode = args.includes("--json");
const targetSlug = args.find((a) => !a.startsWith("--"));

// ───────────────────────────────────────────────────────────────────────
// Producer package.json
// ───────────────────────────────────────────────────────────────────────
const producerPkg = JSON.parse(readFileSync(PRODUCER_PKG, "utf8"));
const producerVersions = {
  ...(producerPkg.dependencies ?? {}),
  ...(producerPkg.devDependencies ?? {}),
};

// ───────────────────────────────────────────────────────────────────────
// Walk components/<category>/<slug>/
// ───────────────────────────────────────────────────────────────────────
function findAllSlugs() {
  const out = [];
  for (const cat of readdirSync(COMPONENTS_DIR)) {
    if (cat === "_template") continue;
    const catDir = join(COMPONENTS_DIR, cat);
    if (!statSync(catDir).isDirectory()) continue;
    for (const slug of readdirSync(catDir)) {
      const slugDir = join(catDir, slug);
      if (!statSync(slugDir).isDirectory()) continue;
      if (!existsSync(join(slugDir, "meta.ts"))) continue;
      out.push({ slug, category: cat, dir: slugDir });
    }
  }
  return out;
}

// ───────────────────────────────────────────────────────────────────────
// Walk shipped files in a slug (everything except demo.tsx / usage.tsx /
// meta.ts). Returns absolute paths to .ts/.tsx/.mjs/.js files.
// ───────────────────────────────────────────────────────────────────────
const NON_SHIPPED = new Set(["demo.tsx", "usage.tsx", "meta.ts"]);
function walkShipped(slugDir) {
  const out = [];
  function recurse(dir) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        recurse(full);
      } else if (
        /\.(tsx?|m?js)$/.test(name) &&
        !(dir === slugDir && NON_SHIPPED.has(name))
      ) {
        out.push(full);
      }
    }
  }
  recurse(slugDir);
  return out;
}

// ───────────────────────────────────────────────────────────────────────
// Extract npm package name from an import path.
// "lucide-react"             → "lucide-react"
// "lucide-react/icons"       → "lucide-react"
// "@dnd-kit/core"            → "@dnd-kit/core"
// "@dnd-kit/core/utilities"  → "@dnd-kit/core"
// "./relative"               → null
// "@/components/ui/button"   → null  (alias; handled separately)
// ───────────────────────────────────────────────────────────────────────
function npmPkgFromImport(path) {
  if (path.startsWith(".") || path.startsWith("@/") || path.startsWith("/")) return null;
  if (path.startsWith("@")) {
    const parts = path.split("/");
    return parts.length >= 2 ? parts.slice(0, 2).join("/") : null;
  }
  return path.split("/")[0];
}

// Extract shadcn primitive name from "@/components/ui/<name>" imports.
function shadcnPrimitiveFromImport(path) {
  const m = path.match(/^@\/components\/ui\/([\w-]+)/);
  return m ? m[1] : null;
}

// ───────────────────────────────────────────────────────────────────────
// Find every import path in a source file.
// Matches: import ... from "X" | export ... from "X" | import("X") | import "X"
// ───────────────────────────────────────────────────────────────────────
const IMPORT_RE =
  /(?:import|export)(?:\s+type)?(?:\s+[\s\S]*?)?\s+from\s+["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|^\s*import\s+["']([^"']+)["']/gm;

function findImports(content) {
  const paths = new Set();
  let m;
  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(content)) !== null) {
    const path = m[1] || m[2] || m[3];
    if (path) paths.add(path);
  }
  return paths;
}

// Aggregate npm + shadcn imports across all shipped files.
function collectShippedImports(slugDir) {
  const npmPkgs = new Set();
  const shadcnPrimitives = new Set();
  for (const file of walkShipped(slugDir)) {
    const content = readFileSync(file, "utf8");
    for (const path of findImports(content)) {
      const npm = npmPkgFromImport(path);
      if (npm) npmPkgs.add(npm);
      const primitive = shadcnPrimitiveFromImport(path);
      if (primitive) shadcnPrimitives.add(primitive);
    }
  }
  return { npmPkgs, shadcnPrimitives };
}

// ───────────────────────────────────────────────────────────────────────
// Parse meta.ts dependencies block via regex (consistent shape from
// scaffolder; falls back to {} on any parse oddity rather than throwing).
// ───────────────────────────────────────────────────────────────────────
function parseMeta(metaPath) {
  const text = readFileSync(metaPath, "utf8");

  // dependencies: { ... }, ↓ then a sibling key (related / thumbnail) or }
  const depsBlockMatch = text.match(
    /dependencies\s*:\s*\{([\s\S]*?)\n\s*\},?\s*\n\s*(?:related|thumbnail|features|context|description|tags|examples|author|version|status|createdAt|updatedAt|category|subcategory|name|slug|\}|\/\/)/,
  );
  if (!depsBlockMatch) return { shadcn: [], npm: {}, parsedOk: false };

  const body = depsBlockMatch[1];

  // shadcn: ["a", "b", ...]
  const shadcnMatch = body.match(/shadcn\s*:\s*\[([\s\S]*?)\]/);
  const shadcn = shadcnMatch
    ? Array.from(shadcnMatch[1].matchAll(/["']([^"']+)["']/g)).map((m) => m[1])
    : [];

  // npm: { "pkg": "version", ... }
  const npmMatch = body.match(/npm\s*:\s*\{([\s\S]*?)\}/);
  const npm = {};
  if (npmMatch) {
    const pairs = npmMatch[1].matchAll(/["']?([\w@/.\-]+)["']?\s*:\s*["']([^"']+)["']/g);
    for (const p of pairs) npm[p[1]] = p[2];
  }

  return { shadcn, npm, parsedOk: true };
}

// ───────────────────────────────────────────────────────────────────────
// Per-slug validation.
// ───────────────────────────────────────────────────────────────────────
function validateSlug({ slug, category, dir }) {
  const findings = [];
  const meta = parseMeta(join(dir, "meta.ts"));
  if (!meta.parsedOk) {
    findings.push({
      severity: "error",
      kind: "meta-parse-failed",
      detail:
        "Could not extract `dependencies` block from meta.ts. " +
        "If the shape is unusual, update validate-meta-deps.mjs's parseMeta.",
    });
    return { slug, category, findings };
  }

  const { npmPkgs, shadcnPrimitives } = collectShippedImports(dir);

  // (a) Version drift vs producer
  for (const [pkg, ver] of Object.entries(meta.npm)) {
    const producerVer = producerVersions[pkg];
    if (!producerVer) {
      findings.push({
        severity: "warn",
        kind: "missing-from-producer-pkg",
        pkg,
        metaVersion: ver,
        detail: `meta declares ${pkg}@${ver} but it's not in producer's package.json — likely meta-only fiction.`,
      });
    } else if (producerVer !== ver) {
      findings.push({
        severity: "high",
        kind: "version-drift",
        pkg,
        metaVersion: ver,
        producerVersion: producerVer,
        detail: `meta says ${pkg}@${ver}; producer says ${pkg}@${producerVer}. Align to producer.`,
      });
    }
  }

  // (b) Phantom npm dep — declared in meta but no shipped file imports it
  for (const pkg of Object.keys(meta.npm)) {
    if (ALWAYS_OK.has(pkg)) continue;
    if (!npmPkgs.has(pkg)) {
      findings.push({
        severity: "high",
        kind: "phantom-npm",
        pkg,
        detail: `meta declares ${pkg} but no shipped source file imports it.`,
      });
    }
  }

  // (b') Forbidden umbrella packages
  for (const pkg of Object.keys(meta.npm)) {
    if (FORBIDDEN_NPM.has(pkg)) {
      findings.push({
        severity: "high",
        kind: "forbidden-npm",
        pkg,
        detail: `${pkg} is a forbidden umbrella package; use shadcn primitives or specific @radix-ui/<name> packages.`,
      });
    }
  }

  // (c) Over-declared shadcn primitive
  for (const primitive of meta.shadcn) {
    if (!shadcnPrimitives.has(primitive)) {
      findings.push({
        severity: "high",
        kind: "over-declared-shadcn",
        primitive,
        detail: `meta.shadcn includes "${primitive}" but no shipped source file imports @/components/ui/${primitive}. Likely demo-only.`,
      });
    }
  }

  return { slug, category, findings };
}

// ───────────────────────────────────────────────────────────────────────
// Run + report
// ───────────────────────────────────────────────────────────────────────
const allSlugs = findAllSlugs();
const targets = targetSlug
  ? allSlugs.filter((s) => s.slug === targetSlug)
  : allSlugs;

if (targetSlug && targets.length === 0) {
  console.error(`Unknown slug: ${targetSlug}`);
  process.exit(2);
}

const results = targets.map(validateSlug);
const totalHigh = results.reduce(
  (n, r) => n + r.findings.filter((f) => f.severity === "high").length,
  0,
);
const totalWarn = results.reduce(
  (n, r) => n + r.findings.filter((f) => f.severity === "warn").length,
  0,
);
const totalError = results.reduce(
  (n, r) => n + r.findings.filter((f) => f.severity === "error").length,
  0,
);

if (jsonMode) {
  console.log(JSON.stringify({ totalHigh, totalWarn, totalError, results }, null, 2));
} else {
  console.log("");
  console.log("validate:meta-deps — F-cross-07 audit");
  console.log("======================================\n");

  for (const { slug, category, findings } of results) {
    if (findings.length === 0) continue;
    const counts = findings.reduce((acc, f) => {
      acc[f.severity] = (acc[f.severity] ?? 0) + 1;
      return acc;
    }, {});
    const counted = Object.entries(counts)
      .map(([s, n]) => `${n} ${s}`)
      .join(" · ");
    console.log(`▸ ${category}/${slug}  (${counted})`);
    for (const f of findings) {
      const tag =
        f.severity === "high" ? "  [⚠️ high  ]" :
        f.severity === "warn" ? "  [🔸 warn  ]" :
                                "  [🚫 error ]";
      console.log(`${tag} ${f.kind}${f.pkg ? `: ${f.pkg}` : f.primitive ? `: ${f.primitive}` : ""}`);
      console.log(`             ${f.detail}`);
    }
    console.log("");
  }

  const totalSlugs = results.length;
  const cleanSlugs = results.filter((r) => r.findings.length === 0).length;
  console.log("──────────────────────────────────────");
  console.log(
    `Audited ${totalSlugs} slug${totalSlugs === 1 ? "" : "s"} — ` +
      `${cleanSlugs} clean, ${totalSlugs - cleanSlugs} with findings.`,
  );
  console.log(
    `Findings: ${totalHigh} high · ${totalWarn} warn · ${totalError} error.`,
  );
}

process.exit(totalHigh + totalError > 0 ? 1 : 0);
