/**
 * The install test's checks (R12) must FAIL on a broken install — the runner
 * (scripts/install-test/run.mjs) needs the network, so its negative paths are
 * proven here on fixture trees instead.
 */
import { afterAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  changedFiles,
  hashTree,
  ilinxaClosure,
  missingFiles,
  stampProblems,
} from "../scripts/install-test/checks.mjs";

const tmpDirs: string[] = [];
afterAll(() => {
  for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
});

function project(files: Record<string, string>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "install-checks-"));
  tmpDirs.push(dir);
  for (const [rel, text] of Object.entries(files)) {
    const p = path.join(dir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, text);
  }
  return dir;
}

const item = {
  name: "thing",
  meta: { version: "1.2.0" },
  registryDependencies: ["@ilinxa/dep", "button"],
  files: [
    { target: "components/thing/thing.tsx", content: "export const T = 1;\n" },
    { target: "components/thing/index.ts", content: "export * from './thing';\n\n// @ilinxa/thing 1.2.0\n" },
  ],
};
const dep = {
  name: "dep",
  meta: { version: "0.1.0" },
  files: [{ target: "components/dep/index.ts", content: "export {};\n// @ilinxa/dep 0.1.0\n" }],
};

describe("ilinxaClosure", () => {
  it("follows @ilinxa registryDependencies only, once each", () => {
    const loads: string[] = [];
    const all = { thing: item, dep: { ...dep, registryDependencies: ["@ilinxa/thing"] } } as Record<string, typeof item>;
    const out = ilinxaClosure(["thing"], (n: string) => {
      loads.push(n);
      return all[n];
    });
    expect(out.map((i: { name: string }) => i.name)).toEqual(["thing", "dep"]);
    expect(loads).toEqual(["thing", "dep"]);
  });
});

describe("missingFiles", () => {
  it("passes when every file landed under src/", () => {
    const dir = project({ "src/components/thing/thing.tsx": "", "src/components/thing/index.ts": "" });
    expect(missingFiles(dir, [item])).toEqual([]);
  });

  it("fails a file that landed outside src/ or not at all", () => {
    const dir = project({ "components/thing/thing.tsx": "", "src/components/thing/index.ts": "" });
    expect(missingFiles(dir, [item])).toEqual([{ item: "thing", target: "components/thing/thing.tsx" }]);
  });
});

describe("stampProblems", () => {
  it("passes when the installed entry still ends with its stamp", () => {
    const dir = project({ "src/components/thing/index.ts": "export {};\n\n// @ilinxa/thing 1.2.0\n" });
    expect(stampProblems(dir, [item])).toEqual([]);
  });

  it("fails a stripped stamp, a wrong version, and an unstamped served item", () => {
    const stripped = project({ "src/components/thing/index.ts": "export {};\n" });
    expect(stampProblems(stripped, [item])).toHaveLength(1);
    const wrong = project({ "src/components/thing/index.ts": "export {};\n// @ilinxa/thing 1.1.0\n" });
    expect(stampProblems(wrong, [item])[0].problem).toMatch(/1\.1\.0/);
    const unstamped = { ...item, files: [{ target: "components/thing/index.ts", content: "export {};\n" }] };
    expect(stampProblems(stripped, [unstamped])[0].problem).toMatch(/no stamped entry/);
  });

  it("accepts CRLF line endings (a consumer's git may convert them)", () => {
    const dir = project({ "src/components/thing/index.ts": "export {};\r\n\r\n// @ilinxa/thing 1.2.0\r\n" });
    expect(stampProblems(dir, [item])).toEqual([]);
  });
});

describe("hashTree + changedFiles", () => {
  it("allows new files but fails a changed or deleted one", () => {
    const dir = project({ "ui/button.tsx": "a", "ui/card.tsx": "b" });
    const before = hashTree(path.join(dir, "ui"));
    fs.writeFileSync(path.join(dir, "ui", "avatar.tsx"), "new");
    expect(changedFiles(before, hashTree(path.join(dir, "ui")))).toEqual([]);
    fs.writeFileSync(path.join(dir, "ui", "button.tsx"), "overwritten");
    fs.rmSync(path.join(dir, "ui", "card.tsx"));
    expect(changedFiles(before, hashTree(path.join(dir, "ui"))).sort()).toEqual(["button.tsx", "card.tsx"]);
  });
});
