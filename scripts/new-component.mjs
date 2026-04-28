#!/usr/bin/env node
/**
 * Scaffolder for ilinxa-ui-pro components.
 *
 * Usage:
 *   pnpm new:component <category>/<slug> [--name="Display Name"]
 *
 * Examples:
 *   pnpm new:component data/stat-card
 *   pnpm new:component forms/wizard --name="Step Wizard"
 *
 * Categories are derived at runtime from src/registry/types.ts (single source of truth).
 * To add a category, update ComponentCategorySlug in types.ts and add the matching
 * entry to CATEGORIES in categories.ts — this script picks it up automatically.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const TEMPLATE_DIR = path.join(
  ROOT,
  "src/registry/components/_template/_template",
);

// VALID_CATEGORIES is derived from src/registry/types.ts — see top comment
// and loadValidCategories() below. The const is assigned after fail() is
// defined so the loader can use fail() for malformed-type errors.

const RED = "[31m";
const GREEN = "[32m";
const DIM = "[2m";
const RESET = "[0m";

function fail(msg) {
  console.error(`${RED}error${RESET} ${msg}`);
  process.exit(1);
}

// Parses the ComponentCategorySlug union out of src/registry/types.ts.
// Assumes the type is a flat union of string literals — bracketed/conditional
// types would need a real TS parser, which is overkill for this scaffolder.
function loadValidCategories() {
  const typesPath = path.join(ROOT, "src/registry/types.ts");
  const text = fs.readFileSync(typesPath, "utf8");
  const match = text.match(/export type ComponentCategorySlug\s*=([^;]+);/);
  if (!match) {
    fail(
      `could not find ComponentCategorySlug union in ${path
        .relative(ROOT, typesPath)
        .replaceAll(path.sep, "/")}`,
    );
  }
  const slugs = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  if (slugs.length === 0) {
    fail("ComponentCategorySlug union in types.ts appears empty");
  }
  return slugs;
}

const VALID_CATEGORIES = loadValidCategories();

function parseArgs(argv) {
  const args = argv.slice(2);
  let positional = null;
  let displayName = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--name=")) {
      displayName = a.slice("--name=".length);
    } else if (a === "--name") {
      displayName = args[++i];
    } else if (!positional) {
      positional = a;
    } else {
      fail(`unexpected arg: ${a}`);
    }
  }
  if (!positional) {
    fail(
      'usage: pnpm new:component <category>/<slug> [--name="Display Name"]\n' +
        `categories: ${VALID_CATEGORIES.join(", ")}`,
    );
  }
  return { positional, displayName };
}

function toPascal(slug) {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

function toCamel(slug) {
  const [first, ...rest] = slug.split("-");
  return (
    first + rest.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("")
  );
}

function toScreamSnake(slug) {
  return slug.toUpperCase().replaceAll("-", "_");
}

function toTitle(slug) {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}

function copyAndReplace(srcDir, destDir, replacements, renameMap) {
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      copyAndReplace(
        path.join(srcDir, e.name),
        path.join(destDir, e.name),
        replacements,
        renameMap,
      );
      continue;
    }
    let content = fs.readFileSync(path.join(srcDir, e.name), "utf8");
    for (const [from, to] of replacements) {
      content = content.split(from).join(to);
    }
    const finalName = renameMap[e.name] ?? e.name;
    fs.writeFileSync(path.join(destDir, finalName), content);
  }
}

function writeFreshMeta(destDir, { slug, name, category }) {
  const today = isoDate();
  const content = `import type { ComponentMeta } from "../../../types";

export const meta: ComponentMeta = {
  slug: "${slug}",
  name: "${name}",
  category: "${category}",

  description:
    "TODO: short, single-sentence description of what the component does.",
  context:
    "TODO: a paragraph explaining when and why to use this component, where it sits in the overall system, and what it composes.",
  features: ["TODO: replace with real features"],
  tags: ["${slug}"],

  version: "0.1.0",
  status: "alpha",
  createdAt: "${today}",
  updatedAt: "${today}",

  author: { name: "ilinxa" },

  dependencies: {
    shadcn: [],
    npm: {},
    internal: [],
  },

  related: [],
};
`;
  fs.writeFileSync(path.join(destDir, "meta.ts"), content);
}

function main() {
  const { positional, displayName } = parseArgs(process.argv);

  const parts = positional.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    fail(`expected <category>/<slug>, got "${positional}"`);
  }
  const [category, slug] = parts;

  if (!VALID_CATEGORIES.includes(category)) {
    fail(
      `invalid category "${category}". valid: ${VALID_CATEGORIES.join(", ")}`,
    );
  }
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(slug)) {
    fail(`invalid slug "${slug}". use lowercase kebab-case (e.g. stat-card)`);
  }
  if (!fs.existsSync(TEMPLATE_DIR)) {
    fail(`template not found at ${path.relative(ROOT, TEMPLATE_DIR)}`);
  }

  const destDir = path.join(ROOT, "src/registry/components", category, slug);
  if (fs.existsSync(destDir)) {
    fail(`folder already exists: ${path.relative(ROOT, destDir)}`);
  }

  const pascal = toPascal(slug);
  const name = displayName ?? toTitle(slug);
  const screamSnake = toScreamSnake(slug);
  const camel = toCamel(slug);

  // Order doesn't matter here — case-sensitive tokens don't overlap.
  const replacements = [
    ["TEMPLATE", screamSnake],
    ["Template", pascal],
    ["_template", slug],
  ];
  const renameMap = { "_template.tsx": `${slug}.tsx` };

  copyAndReplace(TEMPLATE_DIR, destDir, replacements, renameMap);
  writeFreshMeta(destDir, { slug, name, category });

  const rel = path.relative(ROOT, destDir).replaceAll(path.sep, "/");
  console.log(`${GREEN}✔${RESET} created ${rel}/`);
  console.log("");
  console.log(`${DIM}Add this entry to src/registry/manifest.ts:${RESET}`);
  console.log("");
  console.log(
    `  import ${pascal}Demo from "./components/${category}/${slug}/demo";`,
  );
  console.log(
    `  import ${pascal}Usage from "./components/${category}/${slug}/usage";`,
  );
  console.log(
    `  import { meta as ${camel}Meta } from "./components/${category}/${slug}/meta";`,
  );
  console.log("");
  console.log("  // and add to REGISTRY:");
  console.log(
    `  { meta: ${camel}Meta, Demo: ${pascal}Demo, Usage: ${pascal}Usage },`,
  );
}

main();
