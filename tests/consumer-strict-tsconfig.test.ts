/**
 * The consumer-strict tsconfig gate — is it ON, and is it ARMED?
 *
 * Background: this library ships VENDORED `.tsx`. A consumer's `tsconfig`
 * compiles our source, so any strict flag they enable and we don't is a defect
 * we cannot see. F1 shipped exactly that way: `noImplicitOverride` is NOT part
 * of `strict`, so 17 x TS4114 compiled clean here and failed downstream.
 *
 * These tests do not re-test TypeScript. They assert two things `pnpm tsc`
 * alone cannot tell you:
 *
 *   1. the flags are still enabled — someone removing one is caught here, not
 *      six months later in an integrator's inbox;
 *   2. each flag is genuinely ARMED — a fixture that violates it really does
 *      produce the expected error under THIS REPO's resolved options.
 *
 * (2) is the falsification half. A gate never observed failing is not known to
 * be a gate — this repo learned that when a locally-green suite was red in CI
 * for two deploys.
 *
 * Fixtures are dependency-free (no React) on purpose: these are language
 * features, and tiny fixtures keep each compile fast. Proof that the REAL tree
 * complies is gate 1 (`pnpm tsc --noEmit`), which now runs with these flags on.
 */
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import ts from "typescript";

const REPO_ROOT = path.resolve(__dirname, "..");
const TSCONFIG = path.join(REPO_ROOT, "tsconfig.json");

/** Flags this repo enables beyond `strict`. */
const CONSUMER_STRICT_FLAGS = [
  "noImplicitOverride",
  "verbatimModuleSyntax",
  "noFallthroughCasesInSwitch",
  "noImplicitReturns",
] as const;

/** Resolve the repo's real compiler options through the TypeScript API. */
function resolvedOptions(): ts.CompilerOptions {
  const read = ts.readConfigFile(TSCONFIG, ts.sys.readFile);
  expect(read.error, "tsconfig.json must parse").toBeUndefined();
  return ts.parseJsonConfigFileContent(read.config, ts.sys, REPO_ROOT).options;
}

/**
 * Type-check a fixture with the repo's resolved options and return the error
 * codes. `files` maps a bare module name to its source; the entry point is
 * always `main`.
 */
function compile(files: Record<string, string>): number[] {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "strict-gate-"));
  try {
    for (const [name, source] of Object.entries(files)) {
      fs.writeFileSync(path.join(dir, `${name}.ts`), source, "utf8");
    }
    const entry = path.join(dir, "main.ts");
    const program = ts.createProgram([entry], {
      ...resolvedOptions(),
      // Hermetic + fast: no ambient @types, no emit, no project references.
      types: [],
      noEmit: true,
      incremental: false,
      composite: false,
      tsBuildInfoFile: undefined,
    });
    return ts.getPreEmitDiagnostics(program).map((d) => d.code);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/* ─────────────────── 1. the flags are ON ─────────────────── */

describe("consumer-strict flags are enabled", () => {
  it.each(CONSUMER_STRICT_FLAGS)("%s is true in tsconfig.json", (option) => {
    expect(
      resolvedOptions()[option],
      `${option} must stay enabled — it is not implied by "strict", and this ` +
        `library ships vendored source that consumers compile with their own flags.`,
    ).toBe(true);
  });

  it("still has strict itself on", () => {
    expect(resolvedOptions().strict).toBe(true);
  });
});

/* ─────────────────── 2. each flag is ARMED ─────────────────── */

describe("consumer-strict flags are armed — violating fixtures must fail", () => {
  it("noImplicitOverride catches an un-marked override (the F1 defect)", () => {
    expect(
      compile({
        main: `
          class Base { greet(): string { return "base"; } }
          export class Derived extends Base {
            greet(): string { return "derived"; }
          }
        `,
      }),
    ).toContain(4114);
  });

  it("noImplicitReturns catches a path that falls through without a value", () => {
    // Mirrors the real defect shape found in task-tree: an early-exit visitor
    // whose contextual type is `boolean | void`, so one path returns `false`
    // and the other falls through. (An explicit `: string` return type would
    // raise TS2366 from strictNullChecks first and never reach TS7030 — the
    // first version of this fixture made exactly that mistake.)
    expect(
      compile({
        main: `
          declare function each(visit: (n: number) => boolean | void): void;
          export function run(target: number): void {
            each((n) => {
              if (n === target) { return false; }
            });
          }
        `,
      }),
    ).toContain(7030);
  });

  it("noFallthroughCasesInSwitch catches a fallthrough case", () => {
    expect(
      compile({
        main: `
          export function label(n: number): string {
            switch (n) {
              case 1: {
                const a = "one";
                void a;
              }
              case 2:
                return "two";
              default:
                return "other";
            }
          }
        `,
      }),
    ).toContain(7029);
  });

  it("verbatimModuleSyntax catches a type imported without `type`", () => {
    const codes = compile({
      other: `export type SomeType = { a: number };`,
      main: `
        import { SomeType } from "./other";
        export const x: SomeType = { a: 1 };
      `,
    });
    // 1484: "'SomeType' is a type and must be imported using a type-only import".
    expect(codes).toContain(1484);
  });
});

/* ─────────────────── 3. a clean fixture stays clean ─────────────────── */

describe("the gate is not a blanket failer", () => {
  it("compliant code produces no errors under the full flag set", () => {
    expect(
      compile({
        other: `export type SomeType = { a: number };`,
        main: `
          import type { SomeType } from "./other";

          class Base { greet(): string { return "base"; } }
          export class Derived extends Base {
            override greet(): string { return "derived"; }
          }

          export function pick(flag: boolean): string {
            if (flag) { return "yes"; }
            return "no";
          }

          export const x: SomeType = { a: 1 };
        `,
      }),
    ).toEqual([]);
  });
});
