#!/usr/bin/env node
/**
 * clean-registry-artifacts — wipes public/r/*.json before `shadcn build` so the
 * output directory always equals the current registry.json exactly. Without
 * this, renamed/removed items leave orphaned artifacts that stay publicly
 * fetchable and silently serve stale code (P2 rename verify finding #1:
 * 52 pre-canon `<old>-fixtures.json` orphans survived the rebuild).
 */
import { readdirSync, rmSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(resolve(dirname(fileURLToPath(import.meta.url)), ".."), "public", "r");
if (existsSync(dir)) {
  let n = 0;
  for (const f of readdirSync(dir)) {
    if (f.endsWith(".json")) { rmSync(join(dir, f)); n++; }
  }
  console.log(`clean-registry-artifacts — removed ${n} stale artifact(s) from public/r/.`);
} else {
  console.log("clean-registry-artifacts — public/r/ absent, nothing to clean.");
}
