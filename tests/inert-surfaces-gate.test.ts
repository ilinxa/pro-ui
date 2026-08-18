/**
 * The inert-surfaces gate — is it ON, is it WIRED, and is it ARMED?
 *
 * Background: a public surface that exists but does nothing is invisible to
 * every other gate. `tsc`, `lint`, `validate:meta-deps`, `validate:barrel-
 * exports` and the vitest tiers all check that a symbol EXISTS, never that it
 * DOES something — so `card-tree`'s `customPredefinedKeys`, `code-block`'s
 * `scrollToLine()` and `CodeBlockServerProps`, and five `app-sidebar` callbacks
 * all shipped inert for multiple minor versions with a fully green battery.
 * Every one was found by a person, never by CI.
 *
 * These tests do not re-test the catalog (that is `pnpm validate:inert-surfaces`
 * inside `registry:build`). They assert three things that command cannot:
 *
 *   1. the validator is WIRED into `registry:build` with `--strict`, so a
 *      finding stops a deploy — and deleting that wiring fails here rather than
 *      silently disarming the gate;
 *   2. each probe is genuinely ARMED — a fixture carrying the defect really is
 *      reported, and the same fixture without it is not;
 *   3. the disclosure escape hatch cannot LAUNDER a defect: `@notImplemented`
 *      without a runtime warning is itself a finding.
 *
 * (2) and (3) are the falsification half. A gate never observed failing is not
 * known to be a gate — this repo learned that when a locally-green suite was
 * red in CI for two deploys.
 */
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..");
const VALIDATOR = path.join(REPO_ROOT, "scripts", "validate-inert-surfaces.mjs");

/* ─────────────────────────── 1. wiring ─────────────────────────── */

describe("the gate is wired into the build", () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf8"),
  ) as { scripts: Record<string, string> };

  it("exposes a `validate:inert-surfaces` script", () => {
    expect(pkg.scripts["validate:inert-surfaces"]).toContain(
      "validate-inert-surfaces.mjs",
    );
  });

  it("runs inside `registry:build` with --strict, before `shadcn build`", () => {
    const chain = pkg.scripts["registry:build"] ?? "";
    expect(chain).toContain("validate-inert-surfaces.mjs --strict");

    // Order matters: a broken catalog must never produce artifacts.
    const gateAt = chain.indexOf("validate-inert-surfaces.mjs");
    const buildAt = chain.indexOf("shadcn build");
    expect(gateAt).toBeGreaterThan(-1);
    expect(buildAt).toBeGreaterThan(gateAt);
  });
});

/* ─────────────────────── 2 + 3. probes armed ─────────────────────── */

/**
 * Run the validator against a synthetic component tree.
 *
 * The fixture is written into the real `src/registry/components` tree under a
 * throwaway category, because the validator walks that path by design. It is
 * removed in `finally`, so a failing assertion cannot leave the catalog dirty.
 */
function scanFixture(files: Record<string, string>): {
  code: number;
  output: string;
} {
  const category = "__inert_fixture__";
  const dir = path.join(REPO_ROOT, "src/registry/components", category, "probe-widget");
  fs.mkdirSync(dir, { recursive: true });
  try {
    for (const [name, contents] of Object.entries(files)) {
      const target = path.join(dir, name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, contents, "utf8");
    }
    let output = "";
    let code = 0;
    try {
      output = execFileSync(
        process.execPath,
        [VALIDATOR, "probe-widget", "--strict"],
        { cwd: REPO_ROOT, encoding: "utf8" },
      );
    } catch (err) {
      const e = err as { status?: number; stdout?: string };
      code = e.status ?? 1;
      output = e.stdout ?? "";
    }
    return { code, output };
  } finally {
    fs.rmSync(path.join(REPO_ROOT, "src/registry/components", category), {
      recursive: true,
      force: true,
    });
  }
}

const META = (version = "0.1.0") =>
  `export const meta = { version: "${version}" };\n`;

describe("probe A — dead props", () => {
  it("reports a prop the implementation never reads", () => {
    const { code, output } = scanFixture({
      "meta.ts": META(),
      "types.ts": `export interface ProbeWidgetProps {\n  onUsed?: () => void;\n  onDead?: () => void;\n}\n`,
      "probe-widget.tsx": `export function ProbeWidget(p: { onUsed?: () => void }) {\n  return p.onUsed;\n}\n`,
    });
    expect(output).toContain("ProbeWidgetProps.onDead");
    expect(output).not.toContain("ProbeWidgetProps.onUsed");
    expect(code).toBe(1);
  });

  it("passes once the prop is actually read", () => {
    const { code, output } = scanFixture({
      "meta.ts": META(),
      "types.ts": `export interface ProbeWidgetProps {\n  onDead?: () => void;\n}\n`,
      "probe-widget.tsx": `export function ProbeWidget(p: { onDead?: () => void }) {\n  return p.onDead;\n}\n`,
    });
    expect(output).not.toContain("dead-prop");
    expect(code).toBe(0);
  });

  it("does NOT accept a mere COMMENT as a reference", () => {
    // The hole that hid `story-viewer.reactors` and `story-composer
    // .editorBackground`: one comment naming the prop made it look wired.
    // If comments counted, any prop could be silenced with a sentence.
    const { code, output } = scanFixture({
      "meta.ts": META(),
      "types.ts": `export interface ProbeWidgetProps {\n  onDead?: () => void;\n}\n`,
      "probe-widget.tsx": `// onDead is handled elsewhere\nexport function ProbeWidget() {\n  return null;\n}\n`,
    });
    expect(output).toContain("ProbeWidgetProps.onDead");
    expect(code).toBe(1);
  });
});

describe("probe B — no-op methods on public contracts", () => {
  it("reports an empty-bodied method declared in types.ts", () => {
    const { code, output } = scanFixture({
      "meta.ts": META(),
      "types.ts": `export interface ProbeWidgetHandle {\n  doThing: () => void;\n}\n`,
      "probe-widget.tsx": `export const handle = {\n  doThing: () => {},\n};\n`,
    });
    expect(output).toContain("ProbeWidgetHandle.doThing");
    expect(code).toBe(1);
  });

  it("treats a comment-only body as empty — comments are not an implementation", () => {
    const { code, output } = scanFixture({
      "meta.ts": META(),
      "types.ts": `export interface ProbeWidgetHandle {\n  doThing: () => void;\n}\n`,
      "probe-widget.tsx": `export const handle = {\n  doThing: () => {\n    // TODO: later\n  },\n};\n`,
    });
    expect(output).toContain("ProbeWidgetHandle.doThing");
    expect(code).toBe(1);
  });

  it("passes when the stub warns — the disclosed-stub path", () => {
    const { code } = scanFixture({
      "meta.ts": META(),
      "types.ts": `export interface ProbeWidgetHandle {\n  doThing: () => void;\n}\n`,
      "probe-widget.tsx": `export const handle = {\n  doThing: () => {\n    console.warn("probe-widget: doThing is not implemented");\n  },\n};\n`,
    });
    expect(code).toBe(0);
  });
});

describe("probe C — phantom file references", () => {
  it("reports a reference to a file that does not exist in the slug", () => {
    const { code, output } = scanFixture({
      "meta.ts": META(),
      "types.ts": `// see probe-widget.server.tsx for the guard\nexport interface ProbeWidgetProps {\n  a?: string;\n}\n`,
      "probe-widget.tsx": `export function ProbeWidget(p: { a?: string }) {\n  return p.a;\n}\n`,
    });
    expect(output).toContain("probe-widget.server.tsx");
    expect(code).toBe(1);
  });
});

describe("probe D — stale deferrals", () => {
  it("gates when the promised version has already shipped without the feature", () => {
    const { code, output } = scanFixture({
      "meta.ts": META("0.3.0"),
      "types.ts": `export interface ProbeWidgetProps {
  a?: string;
}
`,
      "probe-widget.tsx": `// bulk edit is deferred to v0.2
export function ProbeWidget(p: { a?: string }) {
  return p.a;
}
`,
    });
    expect(output).toContain("stale-deferral");
    // Shipped `warn` for exactly one run, while an 11-item backlog was burned
    // down; promoted to gating once the catalog hit zero — the same path
    // `validate:barrel-exports` took. A deferral is a debt with a due date, and
    // the point of this gate is that it cannot come due silently again.
    expect(code).toBe(1);
  });

  it("accepts an unpinned limitation — the fix is to drop the version, not bump it", () => {
    const { code, output } = scanFixture({
      "meta.ts": META("0.3.0"),
      "types.ts": `export interface ProbeWidgetProps {
  a?: string;
}
`,
      "probe-widget.tsx": `// bulk edit is not implemented
export function ProbeWidget(p: { a?: string }) {
  return p.a;
}
`,
    });
    expect(output).not.toContain("stale-deferral");
    expect(code).toBe(0);
  });

  it("stays quiet when the promised version has NOT shipped yet", () => {
    const { code, output } = scanFixture({
      "meta.ts": META("0.1.0"),
      "types.ts": `export interface ProbeWidgetProps {\n  a?: string;\n}\n`,
      "probe-widget.tsx": `// bulk edit is deferred to v0.9\nexport function ProbeWidget(p: { a?: string }) {\n  return p.a;\n}\n`,
    });
    expect(output).not.toContain("stale-deferral");
    expect(code).toBe(0);
  });
});

describe("the disclosure hatch cannot launder a defect", () => {
  it("reports @notImplemented that is not backed by a runtime warning", () => {
    const { code, output } = scanFixture({
      "meta.ts": META(),
      "types.ts": `export interface ProbeWidgetProps {\n  /**\n   * @notImplemented\n   */\n  onDead?: () => void;\n}\n`,
      // Destructured and ignored: "referenced" enough to satisfy probe A on its
      // own, which is exactly the laundering this check exists to stop.
      "probe-widget.tsx": `export function ProbeWidget({ onDead }: { onDead?: () => void }) {\n  void onDead;\n  return null;\n}\n`,
    });
    expect(output).toContain("undisclosed-tag");
    expect(code).toBe(1);
  });

  it("accepts @notImplemented when a dev warning names the prop", () => {
    const { code } = scanFixture({
      "meta.ts": META(),
      "types.ts": `export interface ProbeWidgetProps {\n  /**\n   * @notImplemented\n   */\n  onDead?: () => void;\n}\n`,
      "probe-widget.tsx": `export function ProbeWidget({ onDead }: { onDead?: () => void }) {\n  if (onDead) console.warn("probe-widget: onDead is not implemented");\n  return null;\n}\n`,
    });
    expect(code).toBe(0);
  });
});
