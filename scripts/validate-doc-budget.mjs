#!/usr/bin/env node
/**
 * validate-doc-budget.mjs — size budgets on always-loaded .claude files
 * (plan P0.6 / D3). These files enter the model's context every session;
 * STATUS.md once regressed 14KB → 120KB before anyone noticed. The budget
 * is stated inside each file; this script makes it a failing gate.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** file (repo-relative) → max bytes */
const BUDGETS = {
  ".claude/CLAUDE.md": 12 * 1024,
  ".claude/STATUS.md": 14 * 1024,
  ".claude/rules/readiness-review.md": 4 * 1024,
  ".claude/rules/compound-component-structure.md": 8 * 1024,
  ".claude/rules/component-readiness-review.md": 2 * 1024,
  ".claude/rules/subagent-model-policy.md": 2 * 1024,
};

/** at most this many HANDOFF* files may sit in .claude/ root (rest → handoffs-archive/) */
const MAX_ACTIVE_HANDOFFS = 2;

let failed = false;
const kb = (n) => `${(n / 1024).toFixed(1)}KB`;

for (const [file, budget] of Object.entries(BUDGETS)) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) {
    console.error(`✗ ${file}: missing (budgeted file should exist).`);
    failed = true;
    continue;
  }
  const size = fs.statSync(p).size;
  if (size > budget) {
    console.error(`✗ ${file}: ${kb(size)} over its ${kb(budget)} budget — move detail to decision files / docs and re-slim.`);
    failed = true;
  } else {
    console.log(`✓ ${file}: ${kb(size)} / ${kb(budget)}`);
  }
}

const handoffs = fs
  .readdirSync(path.join(root, ".claude"))
  .filter((f) => f.startsWith("HANDOFF") && f.endsWith(".md"));
if (handoffs.length > MAX_ACTIVE_HANDOFFS) {
  console.error(`✗ .claude/: ${handoffs.length} HANDOFF files (max ${MAX_ACTIVE_HANDOFFS}) — archive older ones to .claude/handoffs-archive/.`);
  failed = true;
} else {
  console.log(`✓ .claude/: ${handoffs.length} active handoff file(s) (max ${MAX_ACTIVE_HANDOFFS}).`);
}

if (failed) process.exit(1);
