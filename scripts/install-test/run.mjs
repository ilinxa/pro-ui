#!/usr/bin/env node
/**
 * Install test (R12 / C10) — installs a sample of @ilinxa items into a throwaway
 * Next.js src-dir project shaped like a typical consumer (style `new-york`,
 * `rsc: true`, `tsx: true`, lucide, default aliases), with each supported shadcn
 * CLI, from THIS checkout's `public/r` served on localhost. Then it checks:
 *
 *   1. every file of every installed @ilinxa item (with its @ilinxa deps) landed
 *      at `src/<target>`;
 *   2. each versioned item's entry file still ends with its version stamp;
 *   3. no file that existed under `src/components/ui/` before the install changed
 *      (one upstream primitive is seeded first, with a marker line);
 *   4. consumer `tsc --noEmit` exits 0.
 *
 * Every overwrite prompt is answered "n", the way a consumer who never runs
 * `--overwrite` answers it. The CLI's own exit code is recorded but never
 * trusted: with stdin closed, a differing existing file makes the whole add
 * abort with exit 0 and nothing written.
 *
 * Needs the network (npm + ui.shadcn.com for upstream primitives) and several
 * minutes per CLI, so it is NOT part of `vercel-build`. Run it before a release
 * that touches packaging, imports or primitives:
 *
 *   pnpm registry:build && pnpm test:install
 *
 * Env:
 *   INSTALL_TEST_CLIS   comma list (default "3.8.5,4.18.0")
 *   INSTALL_TEST_ITEMS  comma list (default "app-sidebar,story-rail,post-card,carousel-composer,
 *                       story-rail-fixtures,media-editor-capture" — the platform's four plus one
 *                       fixtures item and one feature item)
 *   INSTALL_TEST_DIR    work dir (default <os tmp>/ilinxa-install-test)
 *   INSTALL_TEST_KEEP=1 keep the consumer folders afterwards
 *
 * Exit: 0 all checks pass on every CLI · 1 otherwise · 2 harness error
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { changedFiles, hashTree, ilinxaClosure, missingFiles, stampProblems } from "./checks.mjs";
import { readStamp } from "../stamp-registry-artifacts.mjs";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PUBLIC = join(REPO, "public");
const list = (value, fallback) => (value ?? fallback).split(",").map((s) => s.trim()).filter(Boolean);
const CLIS = list(process.env.INSTALL_TEST_CLIS, "3.8.5,4.18.0");
// The platform's four, plus one fixtures item and one feature item so those item
// classes (dummy-data landing, feature-folder landing, their stamps) are installed too.
const ITEMS = list(
  process.env.INSTALL_TEST_ITEMS,
  "app-sidebar,story-rail,post-card,carousel-composer,story-rail-fixtures,media-editor-capture",
);
const WORK = resolve(process.env.INSTALL_TEST_DIR ?? join(tmpdir(), "ilinxa-install-test"));
const KEEP = process.env.INSTALL_TEST_KEEP === "1";
const SEED_PRIMITIVE = "button";
const SEED_MARKER = "\n// install-test: consumer-owned edit — must survive every add\n";

// ── local registry ────────────────────────────────────────────────────────
function serve() {
  const server = createServer((req, res) => {
    try {
      const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
      const file = normalize(join(PUBLIC, url));
      if (!file.startsWith(PUBLIC + sep) || !existsSync(file) || !statSync(file).isFile()) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { "content-type": extname(file) === ".json" ? "application/json" : "text/plain" });
      res.end(readFileSync(file));
    } catch {
      res.writeHead(400).end(); // malformed URL — never take the server down mid-run
    }
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

// ── processes (async: the registry server lives on this event loop) ───────
function run(cmd, args, cwd, log, { timeoutMs = 600_000, input } = {}) {
  return new Promise((ok) => {
    appendFileSync(log, `\n$ ${cmd} ${args.join(" ")}\n`);
    const child = spawn(cmd, args, { cwd, shell: true, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, CI: "1" } });
    child.stdin.end(input ?? "");
    let out = "";
    child.stdout.on("data", (d) => { out += d; appendFileSync(log, d); });
    child.stderr.on("data", (d) => { out += d; appendFileSync(log, d); });
    let settled = false;
    const finish = (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      ok({ code, out });
    };
    const timer = setTimeout(() => {
      appendFileSync(log, "\n[install-test] TIMEOUT\n");
      // `shell: true` makes the child a cmd.exe/sh wrapper: kill the whole tree, or the
      // pnpm/node grandchildren keep the pipes open and `close` never fires.
      if (process.platform === "win32") spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
      else child.kill("SIGKILL");
      finish(null); // resolve even if the pipes stay open
    }, timeoutMs);
    child.on("close", (code) => finish(code));
  });
}

// ── consumer project ──────────────────────────────────────────────────────
function writeConsumer(dir, port) {
  const producer = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8"));
  const pick = (names) => Object.fromEntries(names.map((n) => [n, producer.dependencies?.[n] ?? producer.devDependencies?.[n]]).filter(([, v]) => v));
  const files = {
    "package.json": JSON.stringify({
      name: "ilinxa-install-test-consumer",
      private: true,
      type: "module",
      dependencies: pick(["next", "react", "react-dom", "clsx", "tailwind-merge", "class-variance-authority", "lucide-react", "tw-animate-css"]),
      devDependencies: pick(["typescript", "@types/react", "@types/react-dom", "@types/node", "tailwindcss", "@tailwindcss/postcss"]),
    }, null, 2),
    "tsconfig.json": JSON.stringify({
      compilerOptions: {
        target: "ES2017", lib: ["dom", "dom.iterable", "esnext"], allowJs: true, skipLibCheck: true, strict: true,
        noEmit: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true,
        isolatedModules: true, jsx: "react-jsx", incremental: true, plugins: [{ name: "next" }], paths: { "@/*": ["./src/*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
      exclude: ["node_modules"],
    }, null, 2),
    "components.json": JSON.stringify({
      $schema: "https://ui.shadcn.com/schema.json",
      style: "new-york",
      rsc: true,
      tsx: true,
      tailwind: { config: "", css: "src/app/globals.css", baseColor: "neutral", cssVariables: true, prefix: "" },
      iconLibrary: "lucide",
      rtl: false,
      aliases: { components: "@/components", utils: "@/lib/utils", ui: "@/components/ui", lib: "@/lib", hooks: "@/hooks" },
      registries: { "@ilinxa": `http://127.0.0.1:${port}/r/{name}.json` },
    }, null, 2),
    "next-env.d.ts": '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n',
    "postcss.config.mjs": 'export default { plugins: { "@tailwindcss/postcss": {} } };\n',
    "src/lib/utils.ts":
      'import { clsx, type ClassValue } from "clsx";\nimport { twMerge } from "tailwind-merge";\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}\n',
    "src/app/globals.css": [
      '@import "tailwindcss";',
      '@import "tw-animate-css";',
      "",
      "@custom-variant dark (&:is(.dark *));",
      "",
      ":root {",
      "  --radius: 0.625rem;",
      "  --background: oklch(1 0 0);",
      "  --foreground: oklch(0.145 0 0);",
      "  --primary: oklch(0.205 0 0);",
      "  --primary-foreground: oklch(0.985 0 0);",
      "  --muted: oklch(0.97 0 0);",
      "  --muted-foreground: oklch(0.556 0 0);",
      "  --border: oklch(0.922 0 0);",
      "}",
      "",
      "@theme inline {",
      "  --color-background: var(--background);",
      "  --color-foreground: var(--foreground);",
      "  --color-primary: var(--primary);",
      "  --color-primary-foreground: var(--primary-foreground);",
      "  --color-muted: var(--muted);",
      "  --color-muted-foreground: var(--muted-foreground);",
      "  --color-border: var(--border);",
      "}",
      "",
    ].join("\n"),
    "src/app/layout.tsx":
      'export default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}\n',
  };
  for (const [rel, text] of Object.entries(files)) {
    const p = join(dir, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, text);
  }
}

/** A page that imports every installed item through its alias, so the barrels must resolve. */
function writeImportPage(dir, items) {
  // Import each item through its stamped entry file's alias path, so a barrel (or a
  // fixtures/feature entry) that fails to resolve fails tsc.
  const paths = items.map((item) => {
    const entry = (item.files ?? []).find((f) => readStamp(f.content)) ?? item.files[0];
    return "@/" + entry.target.replace(/\.tsx?$/, "").replace(/\/index$/, "");
  });
  const lines = paths.map((p, i) => `import * as M${i} from "${p}";`);
  lines.push("", `export const modules = [${paths.map((_, i) => `M${i}`).join(", ")}];`, "");
  lines.push("export default function Page() {\n  return null;\n}\n");
  writeFileSync(join(dir, "src", "app", "page.tsx"), lines.join("\n"));
}

// ── one CLI ───────────────────────────────────────────────────────────────
async function testCli(cli, port) {
  const dir = join(WORK, `cli-${cli}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const log = join(dir, "install-test.log");
  writeFileSync(log, `install-test — shadcn@${cli} — ${new Date().toISOString()}\n`);
  writeConsumer(dir, port);
  const result = { cli, dir, steps: [], problems: [] };
  const step = async (label, cmd, args, opts) => {
    const t0 = Date.now();
    const r = await run(cmd, args, dir, log, opts);
    result.steps.push({ label, exit: r.code, seconds: Math.round((Date.now() - t0) / 1000) });
    return r;
  };

  if ((await step("pnpm install", "pnpm", ["install", "--no-frozen-lockfile"])).code !== 0) {
    result.problems.push("consumer `pnpm install` failed — see the log");
    return result;
  }
  // Seed one upstream primitive, then mark it as consumer-owned.
  await step(`add ${SEED_PRIMITIVE}`, "pnpm", ["dlx", `shadcn@${cli}`, "add", SEED_PRIMITIVE, "--yes"]);
  const seeded = join(dir, "src", "components", "ui", `${SEED_PRIMITIVE}.tsx`);
  if (!existsSync(seeded)) {
    result.problems.push(`could not seed upstream \`${SEED_PRIMITIVE}\` — see the log`);
    return result;
  }
  appendFileSync(seeded, SEED_MARKER);
  const uiBefore = hashTree(join(dir, "src", "components", "ui"));

  for (const name of ITEMS) {
    // Answer "n" to every overwrite prompt, as a consumer who never overwrites would. With
    // stdin closed instead, both CLIs abort the WHOLE add on the first differing file —
    // exit 0, nothing written (measured on 3.8.5 and 4.18.0).
    await step(`add @ilinxa/${name}`, "pnpm", ["dlx", `shadcn@${cli}`, "add", `@ilinxa/${name}`, "--yes"], {
      input: "n\n".repeat(50),
    });
  }

  const load = (name) => JSON.parse(readFileSync(join(PUBLIC, "r", `${name}.json`), "utf8"));
  const installed = ilinxaClosure(ITEMS, load);
  result.installed = installed.map((i) => `${i.name}@${i.meta?.version ?? "-"}`);
  for (const m of missingFiles(dir, installed)) result.problems.push(`missing: ${m.item} → src/${m.target}`);
  for (const h of stampProblems(dir, installed)) result.problems.push(`stamp: ${h.item}: ${h.problem}`);
  for (const f of changedFiles(uiBefore, hashTree(join(dir, "src", "components", "ui")))) {
    result.problems.push(`modified consumer file: src/components/ui/${f}`);
  }
  if (!readFileSync(seeded, "utf8").endsWith(SEED_MARKER)) result.problems.push("the seeded primitive lost its marker");

  writeImportPage(dir, ITEMS.map(load));
  const tsc = await step("tsc --noEmit", "pnpm", ["exec", "tsc", "--noEmit"]);
  if (tsc.code !== 0) {
    const errors = tsc.out.split(/\r?\n/).filter((l) => /error TS\d+/.test(l));
    result.tscErrors = errors.length;
    result.problems.push(`consumer tsc: ${errors.length} error(s)`);
    result.tscSample = errors.slice(0, 15);
  } else {
    result.tscErrors = 0;
  }
  return result;
}

// ── main ──────────────────────────────────────────────────────────────────
async function main() {
  if (CLIS.length === 0 || ITEMS.length === 0) {
    console.error("✗ INSTALL_TEST_CLIS and INSTALL_TEST_ITEMS must each name at least one entry.");
    process.exit(2); // an empty run would "pass" with nothing checked
  }
  for (const name of ITEMS) {
    if (!existsSync(join(PUBLIC, "r", `${name}.json`))) {
      console.error(`✗ public/r/${name}.json not found — run \`pnpm registry:build\` first.`);
      process.exit(2);
    }
  }
  mkdirSync(WORK, { recursive: true });
  const server = await serve();
  const port = server.address().port;
  console.log(`install-test — serving ${PUBLIC} on 127.0.0.1:${port}; CLIs ${CLIS.join(", ")}; items ${ITEMS.join(", ")}`);
  const results = [];
  try {
    for (const cli of CLIS) {
      console.log(`\n── shadcn@${cli} ──`);
      const r = await testCli(cli, port);
      results.push(r);
      for (const s of r.steps) console.log(`  ${s.exit === 0 ? "ok " : "!! "} ${s.label} (exit ${s.exit}, ${s.seconds}s)`);
      if (r.installed) console.log(`  installed: ${r.installed.join(", ")}`);
      if (r.problems.length === 0) console.log("  ✓ all checks pass");
      for (const p of r.problems) console.log(`  ✗ ${p}`);
      for (const e of r.tscSample ?? []) console.log(`      ${e}`);
      console.log(`  log: ${join(r.dir, "install-test.log")}`);
    }
  } finally {
    server.close();
  }
  writeFileSync(join(WORK, "install-test-result.json"), JSON.stringify(results, null, 2));
  if (!KEEP) for (const r of results) if (r.problems.length === 0) rmSync(r.dir, { recursive: true, force: true });
  const failed = results.filter((r) => r.problems.length > 0);
  console.log(`\ninstall-test — ${results.length - failed.length}/${results.length} CLI(s) pass.`);
  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
