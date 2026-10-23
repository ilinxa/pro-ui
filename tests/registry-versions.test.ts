/**
 * R10 — every served registry item says which version it is.
 *
 * `meta.ts` is the single source of truth. `sync-registry-versions.mjs` copies
 * version + status onto the registry.json item's `meta` (shadcn build passes it
 * through to public/r), and `stamp-registry-artifacts.mjs` appends
 * `// @ilinxa/<item> <version>` as the served entry file's LAST line (the CLI
 * strips leading comments on install).
 *
 * The catalog tests read the COMMITTED registry.json and public/r — this suite
 * runs first in `vercel-build`, so a version bump committed without
 * `pnpm registry:build` fails the deploy instead of shipping a stale stamp.
 */
import { afterAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  owningSlug,
  readComponentVersions,
  syncItems,
  unregisteredComponents,
} from "../scripts/sync-registry-versions.mjs";
import { entryFileIndex, readStamp, stampItem } from "../scripts/stamp-registry-artifacts.mjs";

const ROOT = path.resolve(__dirname, "..");
const SYNC = path.join(ROOT, "scripts", "sync-registry-versions.mjs");

type File = { path: string; target: string; content?: string; type?: string };
type Item = { name: string; meta?: Record<string, unknown>; files?: File[] };

const registry = JSON.parse(fs.readFileSync(path.join(ROOT, "registry.json"), "utf8")) as { items: Item[] };
const versions = readComponentVersions(path.join(ROOT, "src", "registry", "components"));
const served = (name: string) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, "public", "r", `${name}.json`), "utf8")) as Item;

const tmpDirs: string[] = [];
afterAll(() => {
  for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true });
});

describe("wiring", () => {
  const chain = (JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")) as {
    scripts: Record<string, string>;
  }).scripts["registry:build"] ?? "";

  it("syncs versions before shadcn build and stamps after it", () => {
    const sync = chain.indexOf("sync-registry-versions.mjs");
    const build = chain.indexOf("shadcn build");
    const stamp = chain.indexOf("stamp-registry-artifacts.mjs");
    expect(sync).toBeGreaterThan(-1);
    expect(sync).toBeLessThan(build);
    expect(stamp).toBeGreaterThan(build);
    expect(stamp).toBeLessThan(chain.indexOf("validate-artifact-size.mjs"));
  });
});

describe("catalog (committed registry.json + public/r)", () => {
  it("classifies every item — none is silently unversioned", () => {
    const classes = { base: 0, fixtures: 0, feature: 0, alias: 0, shared: 0 };
    for (const item of registry.items) {
      const owner = owningSlug(item);
      if (owner.skip === "alias") classes.alias++;
      else if (owner.skip === "shared") classes.shared++;
      else if (item.meta?.featureOf) classes.feature++;
      else if (item.name.endsWith("-fixtures")) classes.fixtures++;
      else classes.base++;
      if (!owner.skip) expect(versions.has(owner.slug), `${item.name} → ${owner.slug}`).toBe(true);
    }
    expect(classes.base).toBe(versions.size);
    expect(classes.fixtures).toBe(versions.size);
    expect(classes.base + classes.fixtures + classes.feature + classes.alias + classes.shared).toBe(
      registry.items.length,
    );
  });

  it("registry.json and the served item carry the meta.ts version and status", () => {
    let checked = 0;
    for (const item of registry.items) {
      const owner = owningSlug(item);
      const art = served(item.name);
      if (owner.skip) {
        expect(item.meta?.version, item.name).toBeUndefined();
        expect(art.meta?.version, item.name).toBeUndefined();
        continue;
      }
      const v = versions.get(owner.slug)!;
      expect(item.meta?.version, item.name).toBe(v.version);
      expect(item.meta?.status, item.name).toBe(v.status);
      expect(art.meta?.version, `served ${item.name}`).toBe(v.version);
      expect(art.meta?.status, `served ${item.name}`).toBe(v.status);
      checked++;
    }
    expect(checked).toBeGreaterThanOrEqual(versions.size * 2);
  });

  it("the served index carries the same versions", () => {
    const index = JSON.parse(fs.readFileSync(path.join(ROOT, "public", "r", "registry.json"), "utf8")) as {
      items: Item[];
    };
    for (const item of registry.items) {
      const listed = index.items.find((i) => i.name === item.name);
      expect(listed?.meta?.version, item.name).toBe(item.meta?.version);
    }
  });

  it("each versioned served item stamps exactly its entry file", () => {
    for (const item of registry.items) {
      const art = served(item.name);
      const stamped = (art.files ?? []).filter((f) => readStamp(f.content));
      if (!art.meta?.version) {
        expect(stamped, item.name).toHaveLength(0);
        continue;
      }
      expect(stamped, item.name).toHaveLength(1);
      const entry = art.files![entryFileIndex(art)];
      expect(readStamp(entry.content), item.name).toEqual({ name: item.name, version: art.meta.version });
      expect(entry.content!.match(/^\/\/ @ilinxa\/[a-z0-9-]+ \d+\.\d+\.\d+/gm), item.name).toHaveLength(1);
    }
  });

  it("pre-existing item meta keys survive", () => {
    const capture = registry.items.find((i) => i.name === "media-editor-capture");
    expect(capture?.meta).toMatchObject({ featureOf: "media-editor", budgetKB: 65 });
    const alias = registry.items.find((i) => i.meta?.deprecated);
    expect(alias?.meta?.replacedBy).toBeTruthy();
  });
});

describe("syncItems", () => {
  const v = new Map([["thing", { version: "1.2.3", status: "beta", metaPath: "x" }]]);

  it("merges version + status into an existing meta without dropping keys", () => {
    const { items, changed } = syncItems([{ name: "thing", meta: { budgetKB: 9 } }], v);
    expect(changed).toBe(1);
    expect(items[0].meta).toEqual({ budgetKB: 9, version: "1.2.3", status: "beta" });
  });

  it("versions fixtures and features from their base", () => {
    const { items } = syncItems(
      [{ name: "thing-fixtures" }, { name: "thing-extra", meta: { featureOf: "thing" } }],
      v,
    );
    expect(items.map((i: Item) => i.meta?.version)).toEqual(["1.2.3", "1.2.3"]);
  });

  it("strips a version from an alias and from a _shared item", () => {
    const { items, changed } = syncItems(
      [
        { name: "old", meta: { deprecated: true, version: "1.0.0", status: "alpha" } },
        { name: "kit", meta: { version: "1.0.0" }, files: [{ path: "a", target: "components/_shared/kit/a.ts" }] },
      ],
      v,
    );
    expect(changed).toBe(2);
    expect(items[0].meta).toEqual({ deprecated: true });
    expect(items[1].meta).toEqual({});
  });

  it("reports an item it cannot map to a meta.ts", () => {
    const { errors } = syncItems([{ name: "ghost" }], v);
    expect(errors).toHaveLength(1);
  });

  it("reports a component folder that has no registry item", () => {
    expect(unregisteredComponents([{ name: "thing" }], v)).toEqual([]);
    expect(unregisteredComponents([{ name: "thing-fixtures" }], v)).toHaveLength(1);
  });

  it("is a no-op when already in sync", () => {
    const { changed } = syncItems([{ name: "thing", meta: { version: "1.2.3", status: "beta" } }], v);
    expect(changed).toBe(0);
  });
});

describe("--check", () => {
  function fixture(itemMeta: Record<string, unknown>) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "reg-versions-"));
    tmpDirs.push(dir);
    const metaDir = path.join(dir, "components", "data", "thing");
    fs.mkdirSync(metaDir, { recursive: true });
    fs.writeFileSync(path.join(metaDir, "meta.ts"), `export const meta = {\n  version: "0.2.0",\n  status: "alpha",\n};\n`);
    const reg = path.join(dir, "registry.json");
    fs.writeFileSync(reg, JSON.stringify({ name: "t", items: [{ name: "thing", meta: itemMeta }] }, null, 2) + "\n");
    return { reg, components: path.join(dir, "components") };
  }
  const run = (f: { reg: string; components: string }, ...extra: string[]) =>
    spawnSync(process.execPath, [SYNC, "--registry", f.reg, "--components", f.components, ...extra], {
      encoding: "utf8",
    });

  it("fails on drift and writes nothing", () => {
    const f = fixture({ version: "0.1.0", status: "alpha" });
    const before = fs.readFileSync(f.reg, "utf8");
    const r = run(f, "--check");
    expect(r.status).toBe(1);
    expect(fs.readFileSync(f.reg, "utf8")).toBe(before);
  });

  it("write mode fixes the drift, then --check passes", () => {
    const f = fixture({ version: "0.1.0", status: "alpha" });
    expect(run(f).status).toBe(0);
    expect(run(f, "--check").status).toBe(0);
    expect(JSON.parse(fs.readFileSync(f.reg, "utf8")).items[0].meta.version).toBe("0.2.0");
  });
});

describe("stampItem", () => {
  const base: Item = {
    name: "thing",
    meta: { version: "1.2.3" },
    files: [
      { path: "a", target: "components/thing/thing.tsx", content: '"use client";\nexport const A = 1;\n' },
      { path: "b", target: "components/thing/index.ts", content: 'export { A } from "./thing";\n' },
    ],
  };
  const entry = (i: Item) => i.files![1].content!;

  it("stamps only the entry file, as its last line", () => {
    const { item, stamped } = stampItem(base);
    expect(stamped).toBe(true);
    expect(entry(item)).toBe('export { A } from "./thing";\n\n// @ilinxa/thing 1.2.3\n');
    expect(item.files![0].content).toBe(base.files![0].content);
  });

  it("leaves a source comment that merely mentions @ilinxa alone", () => {
    const withComment = {
      ...base,
      files: [base.files![0], { ...base.files![1], content: "export {};\n// @ilinxa/other-item.\n" }],
    };
    expect(entry(stampItem(withComment).item)).toBe("export {};\n// @ilinxa/other-item.\n\n// @ilinxa/thing 1.2.3\n");
  });

  it("is idempotent and replaces an older stamp", () => {
    const once = stampItem(base).item;
    expect(stampItem(once).item).toEqual(once);
    const bumped = stampItem({ ...once, meta: { version: "1.3.0" } }).item;
    expect(entry(bumped)).toBe('export { A } from "./thing";\n\n// @ilinxa/thing 1.3.0\n');
  });

  it("keeps CRLF endings and replaces a CRLF stamp instead of adding a second one", () => {
    const crlf = { ...base, files: [base.files![0], { ...base.files![1], content: "export {};\r\n" }] };
    const once = stampItem(crlf).item;
    expect(entry(once)).toBe("export {};\r\n\r\n// @ilinxa/thing 1.2.3\r\n");
    const bumped = stampItem({ ...once, meta: { version: "1.3.0" } }).item;
    expect(entry(bumped)).toBe("export {};\r\n\r\n// @ilinxa/thing 1.3.0\r\n");
  });

  it("handles a file without a trailing newline, and an empty file", () => {
    const noEol = { ...base, files: [base.files![0], { ...base.files![1], content: "export {};" }] };
    expect(entry(stampItem(noEol).item)).toBe("export {};\n\n// @ilinxa/thing 1.2.3\n");
    const empty = { ...base, files: [base.files![0], { ...base.files![1], content: "" }] };
    expect(entry(stampItem(empty).item)).toBe("// @ilinxa/thing 1.2.3\n");
  });

  it("finds a feature's entry and a fixtures item's single file", () => {
    const feature = {
      name: "thing-extra",
      meta: { featureOf: "thing", version: "1.0.0" },
      files: [
        { path: "p", target: "components/thing/features/extra/parts/x.tsx", content: "x" },
        { path: "i", target: "components/thing/features/extra/index.ts", content: "y" },
      ],
    };
    expect(entryFileIndex(feature)).toBe(1);
    expect(entryFileIndex({ name: "thing-fixtures", files: [{ path: "d", target: "components/thing/dummy-data.ts" }] })).toBe(0);
  });

  it("errors on a versioned item without an entry file, and skips an unversioned one", () => {
    expect(stampItem({ ...base, files: [base.files![0]] }).error).toMatch(/no entry file/);
    expect(stampItem({ ...base, meta: {} }).stamped).toBe(false);
  });
});

describe("readStamp", () => {
  it("reads only a strictly shaped LAST line, tolerating CRLF and trailing blank lines", () => {
    expect(readStamp("x\n// @ilinxa/thing 1.2.3\n")).toEqual({ name: "thing", version: "1.2.3" });
    expect(readStamp("x\r\n// @ilinxa/thing 1.2.3\r\n\r\n")).toEqual({ name: "thing", version: "1.2.3" });
    expect(readStamp("// @ilinxa/thing 1.2.3\nexport {};\n")).toBeNull();
    expect(readStamp("x\n// @ilinxa/thing.\n")).toBeNull();
  });
});
