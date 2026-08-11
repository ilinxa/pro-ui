#!/usr/bin/env node
/**
 * build-llms.mjs — regenerates the component-catalog sections of public/llms.txt
 * and README.md from registry.json (the distribution source of truth).
 *
 * Both files carry marker pairs; everything between them is owned by this
 * script. Hand-edits between markers are overwritten on the next run.
 * Wired into `registry:build` so every deploy regenerates the catalog —
 * the docs can no longer drift from the registry (plan P0.5, review 4.2/10.1).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const START = "<!-- GENERATED CATALOG — do not edit; run `pnpm build:llms` -->";
const END = "<!-- END GENERATED CATALOG -->";

const registry = JSON.parse(
  fs.readFileSync(path.join(root, "registry.json"), "utf8"),
);

/** Base items only: skip fixtures siblings, internal _shared support items, deprecated aliases (P2.3), and feature items (P3 — rendered as sub-lines below instead). */
const items = registry.items
  .filter((i) => !i.name.endsWith("-fixtures"))
  .filter((i) => !(i.files?.[0]?.target ?? "").startsWith("components/_shared"))
  .filter((i) => !i.meta?.deprecated)
  .filter((i) => !i.meta?.featureOf)
  .map((i) => {
    const src = i.files?.[0]?.path ?? "";
    const m = src.match(/^src\/registry\/components\/([^/]+)\//);
    return { slug: i.name, category: m ? m[1] : "?", description: i.description ?? "" };
  })
  .sort((a, b) =>
    a.category === b.category
      ? a.slug.localeCompare(b.slug)
      : a.category.localeCompare(b.category),
  );

const categories = [...new Set(items.map((i) => i.category))];

/** Feature items (P3 feature-slicing) — meta.featureOf points at the base slug; rendered as an indented "optional slice" sub-line under that base's entry, not as their own standalone entry. */
const featureItems = registry.items
  .filter((i) => typeof i.meta?.featureOf === "string" && i.meta.featureOf.length > 0)
  .map((i) => ({ slug: i.name, featureOf: i.meta.featureOf, description: i.description ?? "" }))
  .sort((a, b) => a.slug.localeCompare(b.slug));
const featuresByBase = new Map();
for (const f of featureItems) {
  const arr = featuresByBase.get(f.featureOf) ?? [];
  arr.push(f);
  featuresByBase.set(f.featureOf, arr);
}

/** First sentence, clamped — full capability detail belongs on the detail page. */
function blurb(desc, max = 160) {
  const first = desc.split(/(?<=\.)\s+/)[0]?.trim() ?? "";
  return first.length > max ? `${first.slice(0, max - 1).trimEnd()}…` : first;
}

function llmsSection() {
  const total = items.length * 2 + featureItems.length;
  const lines = [
    `## Available items (${total} total — ${items.length} base + ${items.length} fixtures + ${featureItems.length} feature slices)`,
    "",
    `${items.length} components across ${categories.length} categories. Every item installs as \`@ilinxa/<slug>\`; each has a sibling \`<slug>-fixtures\` item that adds \`dummy-data.ts\` only (fixtures depend on the base — installing fixtures pulls the base automatically). Some components additionally offer optional feature slices — install \`@ilinxa/<slice>\` on top of the base for opt-in heavier capability.`,
    "",
  ];
  for (const cat of categories) {
    lines.push(`### ${cat}`);
    lines.push("");
    for (const it of items.filter((i) => i.category === cat)) {
      lines.push(`- \`@ilinxa/${it.slug}\` — ${blurb(it.description)}`);
      for (const fe of featuresByBase.get(it.slug) ?? []) {
        lines.push(`  ↳ optional slice: \`@ilinxa/${fe.slug}\` — ${blurb(fe.description)}`);
      }
    }
    lines.push("");
  }
  lines.push(
    "Do not invent slugs or deps. This list is generated from registry.json at build time — re-fetch this llms.txt for updates.",
  );
  return lines.join("\n");
}

function readmeSection() {
  const lines = [
    "## Available components",
    "",
    `${items.length} components across ${categories.length} categories, each with an optional \`-fixtures\` sibling for example data. Generated from [\`registry.json\`](registry.json) — run \`pnpm build:llms\` after registry changes.`,
    "",
    "| Slug | Category | Description |",
    "|---|---|---|",
  ];
  for (const it of items) {
    const sliceLines = (featuresByBase.get(it.slug) ?? [])
      .map((fe) => `<br>↳ optional slice: \`${fe.slug}\` — ${blurb(fe.description, 120)}`)
      .join("");
    lines.push(`| \`${it.slug}\` | ${it.category} | ${blurb(it.description, 120)}${sliceLines} |`);
  }
  return lines.join("\n");
}

function replaceBetween(file, generated) {
  const p = path.join(root, file);
  const src = fs.readFileSync(p, "utf8");
  const s = src.indexOf(START);
  const e = src.indexOf(END);
  if (s === -1 || e === -1 || e < s) {
    console.error(`✗ ${file}: marker pair not found — cannot regenerate.`);
    process.exitCode = 1;
    return;
  }
  const next =
    src.slice(0, s + START.length) + "\n" + generated + "\n" + src.slice(e);
  if (next !== src) {
    fs.writeFileSync(p, next);
    console.log(`✓ ${file}: catalog regenerated (${items.length} components).`);
  } else {
    console.log(`✓ ${file}: catalog already current.`);
  }
}

replaceBetween("public/llms.txt", llmsSection());
replaceBetween("README.md", readmeSection());
