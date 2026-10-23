/**
 * Pure checks for the install test (R12). No network, no CLI — the runner
 * (run.mjs) installs into a throwaway consumer and calls these; the repo test
 * (tests/install-test-checks.test.ts) proves each one fails on a broken tree.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { readStamp } from "../stamp-registry-artifacts.mjs";

/**
 * Every `@ilinxa/<name>` reachable from `roots` through `registryDependencies`,
 * as served items. `load(name)` returns the served item JSON.
 */
export function ilinxaClosure(roots, load) {
  const seen = new Map();
  const queue = [...roots];
  while (queue.length > 0) {
    const name = queue.shift();
    if (seen.has(name)) continue;
    const item = load(name);
    seen.set(name, item);
    for (const dep of item.registryDependencies ?? []) {
      if (dep.startsWith("@ilinxa/")) queue.push(dep.slice("@ilinxa/".length));
    }
  }
  return [...seen.values()];
}

/** Where a `components/…` target lands in a src-dir project. */
export const installedPath = (projectDir, target) => join(projectDir, "src", target);

/** Files of `items` that did not land at `src/<target>`. → [{ item, target }] */
export function missingFiles(projectDir, items) {
  const out = [];
  for (const item of items) {
    for (const f of item.files ?? []) {
      if (!existsSync(installedPath(projectDir, f.target))) out.push({ item: item.name, target: f.target });
    }
  }
  return out;
}

/**
 * Versioned items whose installed entry file does not END with its version
 * stamp (the CLI strips leading comments, so the stamp is the last line — see
 * stamp-registry-artifacts.mjs). The entry file is the one served file whose
 * content carries the stamp. → [{ item, problem }]
 */
export function stampProblems(projectDir, items) {
  const out = [];
  for (const item of items) {
    const version = item.meta?.version;
    if (!version) continue;
    const entry = (item.files ?? []).find((f) => readStamp(f.content));
    if (!entry) {
      out.push({ item: item.name, problem: "served item has no stamped entry file" });
      continue;
    }
    const path = installedPath(projectDir, entry.target);
    if (!existsSync(path)) continue; // reported by missingFiles
    const stamp = readStamp(readFileSync(path, "utf8"));
    if (!stamp) out.push({ item: item.name, problem: `${entry.target} lost its version stamp` });
    else if (stamp.name !== item.name || stamp.version !== version) {
      out.push({ item: item.name, problem: `${entry.target} says ${stamp.name} ${stamp.version}, served ${item.name} ${version}` });
    }
  }
  return out;
}

/** sha256 of every file under `dir`, keyed by path relative to it. */
export function hashTree(dir) {
  const out = {};
  if (!existsSync(dir)) return out;
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else out[relative(dir, p).replaceAll("\\", "/")] = createHash("sha256").update(readFileSync(p)).digest("hex");
    }
  };
  walk(dir);
  return out;
}

/** Files present in `before` that changed or vanished in `after`. New files are allowed. */
export function changedFiles(before, after) {
  return Object.keys(before).filter((k) => after[k] !== before[k]);
}
