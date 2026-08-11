#!/usr/bin/env node
/**
 * validate:artifact-size — built public/r/<slug>.json artifacts vs their
 * declared KB budget (plan P3 S1, docs/plans/p3-feature-slicing-plan.md,
 * invariant 9: ">20% over budget without a matching budget bump = drift").
 *
 * Wired into the END of the `registry:build` chain, AFTER `shadcn build` —
 * this validator needs FRESH artifacts, unlike the JSON-source validators
 * that run earlier in the chain against registry.json + disk.
 *
 * v1 scope: BASE items and FEATURE items only. `-fixtures` items, deprecated
 * aliases (meta.deprecated), and `components/_shared`-targeted support items
 * are skipped — their artifacts are small/support-only and budgeting them is
 * a deferred follow-up, not part of this pass.
 *
 * Budget resolution:
 *   - base item    → `artifactBudgetKB` parsed out of the slug's own
 *     src/registry/components/<cat>/<slug>/meta.ts (see NUM_FIELD_RE below —
 *     wave-2 agents adding feature items must keep this bare-numeric-field
 *     shape: `artifactBudgetKB: <number>,` — same anchor point the P3 T2
 *     codemod used, right after the `status:` line).
 *   - feature item → `meta.budgetKB` on the registry.json item itself (no
 *     meta.ts of its own — see validate-registry-json.mjs rule F6).
 *
 * FAIL (exit 1) if: a budget can't be resolved for an audited item, OR its
 * artifact's actual KB exceeds budgetKB * 1.2 (20% headroom before failing).
 *
 * Exit: 0 clean · 1 any item over budget or with an unresolved budget · 2 script/precondition error.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ARTIFACT_DIR = join(ROOT, "public", "r");
const OVER_BUDGET_FACTOR = 1.2;

if (!existsSync(ARTIFACT_DIR)) {
  console.error(`validate:artifact-size: ${ARTIFACT_DIR} does not exist — run \`shadcn build\` first (this validator belongs at the END of registry:build).`);
  process.exit(2);
}

const registry = JSON.parse(readFileSync(join(ROOT, "registry.json"), "utf8"));
const byName = new Map(registry.items.map((i) => [i.name, i]));

/**
 * Bare-numeric meta.ts field extractor (string fields use the quote-aware
 * `field()` regex in validate-naming.mjs; artifactBudgetKB has no quotes).
 */
const NUM_FIELD_RE = (name) => new RegExp(`${name}:\\s*(\\d+(?:\\.\\d+)?)`);
function numField(src, name) {
  const m = src.match(NUM_FIELD_RE(name));
  return m ? Number(m[1]) : null;
}

let highs = 0;
const report = (item, msg) => { console.error(`  [artifact-size] ${item}: ${msg}`); highs++; };

const files = readdirSync(ARTIFACT_DIR).filter((f) => f.endsWith(".json") && f !== "registry.json");
const rows = [];

// Completeness (R4 finding): every registry.json item must have a built
// artifact — clean-registry-artifacts wipes the dir first, so a silently
// dropped item would otherwise sail through with exit 0 and 404 in prod.
const builtNames = new Set(files.map((f) => f.slice(0, -".json".length)));
for (const it of registry.items) {
  if (!builtNames.has(it.name))
    report(it.name, `expected artifact public/r/${it.name}.json is MISSING — shadcn build dropped it?`);
}

for (const file of files) {
  const name = file.slice(0, -".json".length);
  const item = byName.get(name);
  if (!item) { report(name, `public/r/${file} has no matching item in registry.json`); continue; }

  if (name.endsWith("-fixtures")) continue; // deferred (v1 scope)
  if (item.meta?.deprecated) continue; // deferred (v1 scope)
  if ((item.files?.[0]?.target ?? "").startsWith("components/_shared")) continue; // deferred (v1 scope)

  const bytes = statSync(join(ARTIFACT_DIR, file)).size;
  const actualKB = bytes / 1024;

  const isFeature = typeof item.meta?.featureOf === "string" && item.meta.featureOf.length > 0;
  let budgetKB = null;

  if (isFeature) {
    budgetKB = typeof item.meta?.budgetKB === "number" && item.meta.budgetKB > 0 ? item.meta.budgetKB : null;
    if (budgetKB == null) {
      report(name, "feature item has no positive meta.budgetKB in registry.json (see rule F6 in validate-registry-json.mjs)");
      continue;
    }
  } else {
    const first = item.files?.[0]?.path ?? "";
    const m = first.match(/^src\/registry\/components\/([\w-]+)\/([\w-]+)\//);
    if (!m) { report(name, `cannot derive component folder from first file path "${first}"`); continue; }
    const [, cat, slug] = m;
    const metaPath = join(ROOT, "src", "registry", "components", cat, slug, "meta.ts");
    if (!existsSync(metaPath)) { report(name, `no meta.ts at src/registry/components/${cat}/${slug}/meta.ts`); continue; }
    const src = readFileSync(metaPath, "utf8");
    budgetKB = numField(src, "artifactBudgetKB");
    if (budgetKB == null) {
      report(name, `meta.ts is missing the required artifactBudgetKB field (src/registry/components/${cat}/${slug}/meta.ts)`);
      continue;
    }
  }

  const cap = budgetKB * OVER_BUDGET_FACTOR;
  const overBudget = actualKB > cap;
  const headroomPct = ((budgetKB - actualKB) / budgetKB) * 100;
  rows.push({ name, actualKB, budgetKB, headroomPct, overBudget });

  if (overBudget) {
    report(
      name,
      `artifact is ${actualKB.toFixed(2)}KB, over the ${OVER_BUDGET_FACTOR}x cap of ${cap.toFixed(2)}KB ` +
        `(budget ${budgetKB}KB). Fix: either raise ${isFeature ? "meta.budgetKB in registry.json" : "artifactBudgetKB in meta.ts"} ` +
        "as a deliberate, auditable bump in this same commit, or shrink the artifact.",
    );
  }
}

rows.sort((a, b) => a.headroomPct - b.headroomPct);

console.log("");
console.log("slug".padEnd(28) + "actualKB".padStart(10) + "budgetKB".padStart(10) + "headroom".padStart(11));
for (const r of rows) {
  console.log(
    r.name.padEnd(28) +
      r.actualKB.toFixed(2).padStart(10) +
      String(r.budgetKB).padStart(10) +
      `${r.headroomPct.toFixed(1)}%`.padStart(11) +
      (r.overBudget ? "  !! OVER" : ""),
  );
}

console.log(`\nvalidate:artifact-size — ${rows.length} artifact(s) audited: ${highs} high.`);
process.exit(highs > 0 ? 1 : 0);
