/**
 * Pure parser: input `CardTreeJsonNode` → normalized internal `ParsedCardTree`.
 *
 * Errors are collected into an array (not thrown), so the caller can render
 * a best-effort tree alongside diagnostics.
 *
 * See plan §5.1 for the full algorithm.
 */

import type {
  CodeAreaValue,
  CustomPredefinedKey,
  FlatFieldValue,
  ImageValue,
  ListValue,
  PredefinedKey,
  QuoteValue,
  CardTreeJsonNode,
  TableValue,
} from "../types";
import { classifyKey } from "./classify-key";
import { findCustomKey } from "./custom-keys";
import {
  inferFlatFieldType,
  type DateDetection,
  type FlatFieldType,
} from "./infer-type";

/* ───────── internal tree types ───────── */

export type CardTreeField = {
  key: string;
  value: FlatFieldValue;
  type: FlatFieldType;
};

/**
 * A host-registered custom block (v0.6). `value` is deliberately `unknown` and is
 * written back by `serialize` VERBATIM — a custom block's shape is the
 * integrator's contract, not card-tree's.
 *
 * NARROWING CONTRACT: `key` is an open `string`, so a bare `switch (entry.key)`
 * would keep this variant alive in every `case`. Always test `isCustomEntry(entry)`
 * (or `"custom" in entry`) FIRST; the remaining union is then the five built-ins
 * and `switch` narrows as it always did.
 */
export type CardTreeCustomEntry = {
  key: string;
  custom: true;
  value: unknown;
};

export type CardTreePredefinedEntry =
  | { key: "codearea"; value: CodeAreaValue }
  | { key: "image"; value: ImageValue }
  | { key: "table"; value: TableValue }
  | { key: "quote"; value: QuoteValue }
  | { key: "list"; value: ListValue }
  | CardTreeCustomEntry;

/** Narrowing guard for {@link CardTreeCustomEntry} — see its narrowing contract. */
export function isCustomEntry(
  entry: CardTreePredefinedEntry,
): entry is CardTreeCustomEntry {
  return "custom" in entry && entry.custom === true;
}

export type ParsedCardTree = {
  id: string;
  order: number;
  level: number;
  /** Property name on the parent that pointed to this card. Undefined only on root. */
  parentKey?: string;
  meta?: Record<string, FlatFieldValue>;
  fields: CardTreeField[];
  predefined: CardTreePredefinedEntry[];
  children: ParsedCardTree[];
};

export type ParseError = {
  message: string;
  path: string;
};

export type ParseOptions = {
  disabledPredefinedKeys: readonly PredefinedKey[];
  dateDetection: DateDetection;
  /**
   * Resolved custom-key registrations (v0.6) — pass the `keys` from
   * `resolveCustomKeys`, never the raw prop: colliding + duplicate names must
   * already be dropped. Omit for v0.5 behavior.
   */
  customKeys?: readonly CustomPredefinedKey[];
};

export type ParseResult = {
  tree: ParsedCardTree | null;
  errors: ParseError[];
};

/* ───────── helpers ───────── */

/**
 * Deterministic auto-id from a card's tree path, for cards that don't supply an
 * `__rcid`. MUST be deterministic (not a random UUID): parse runs at render-time
 * state-init, so an SSR pass and the client hydration pass both parse the same
 * input tree in the same order — a random id would differ between them and
 * trip a hydration mismatch (`data-rcid` / `aria-labelledby`). Path is unique
 * per node, so these ids are collision-free within a tree. Runtime edits mint
 * random ids elsewhere (client-only, post-hydration — safe).
 */
function autoId(path: string): string {
  const safe = path.replace(/[^a-zA-Z0-9_-]/g, "-");
  return `rc-auto-${safe || "root"}`;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function pathJoin(parent: string, segment: string | number): string {
  return parent === "" ? String(segment) : `${parent}.${segment}`;
}

/* ───────── meta parsing ───────── */

function parseMeta(
  raw: unknown,
  errors: ParseError[],
  path: string,
): Record<string, FlatFieldValue> | undefined {
  if (raw === undefined) return undefined;
  if (!isPlainObject(raw)) {
    errors.push({
      message: "__rcmeta must be an object of scalar values; ignored",
      path,
    });
    return undefined;
  }
  const out: Record<string, FlatFieldValue> = {};
  for (const k of Object.keys(raw)) {
    const v = raw[k];
    if (
      v === null ||
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      out[k] = v as FlatFieldValue;
    } else {
      errors.push({
        message: `__rcmeta.${k} must be a scalar; dropped`,
        path,
      });
    }
  }
  return out;
}

/* ───────── predefined-key shape validation ───────── */

function validatePredefinedShape(
  key: PredefinedKey,
  value: unknown,
  errors: ParseError[],
  path: string,
): CardTreePredefinedEntry | null {
  switch (key) {
    case "codearea": {
      if (
        isPlainObject(value) &&
        typeof value.format === "string" &&
        typeof value.content === "string"
      ) {
        return {
          key: "codearea",
          value: { format: value.format, content: value.content },
        };
      }
      errors.push({
        message:
          "codearea must be { format: string, content: string }; entry dropped",
        path,
      });
      return null;
    }
    case "image": {
      if (
        isPlainObject(value) &&
        typeof value.src === "string" &&
        (value.alt === undefined || typeof value.alt === "string")
      ) {
        return {
          key: "image",
          value: { src: value.src, alt: value.alt as string | undefined },
        };
      }
      errors.push({
        message: "image must be { src: string, alt?: string }; entry dropped",
        path,
      });
      return null;
    }
    case "table": {
      if (
        isPlainObject(value) &&
        Array.isArray(value.headers) &&
        value.headers.every((h) => typeof h === "string") &&
        Array.isArray(value.rows) &&
        value.rows.every(
          (row) =>
            Array.isArray(row) &&
            row.length === (value.headers as string[]).length &&
            row.every(
              (c) =>
                c === null ||
                typeof c === "string" ||
                typeof c === "number" ||
                typeof c === "boolean",
            ),
        )
      ) {
        return {
          key: "table",
          value: {
            headers: value.headers as string[],
            rows: value.rows as FlatFieldValue[][],
          },
        };
      }
      errors.push({
        message:
          "table must be { headers: string[], rows: FlatFieldValue[][] } with consistent row widths; entry dropped",
        path,
      });
      return null;
    }
    case "quote": {
      if (typeof value === "string") return { key: "quote", value };
      errors.push({ message: "quote must be a string; entry dropped", path });
      return null;
    }
    case "list": {
      if (
        Array.isArray(value) &&
        value.every(
          (v) =>
            v === null ||
            typeof v === "string" ||
            typeof v === "number" ||
            typeof v === "boolean",
        )
      ) {
        return { key: "list", value: value as FlatFieldValue[] };
      }
      errors.push({
        message: "list must be an array of scalar values; entry dropped",
        path,
      });
      return null;
    }
  }
}

/* ───────── core recursion ───────── */

/**
 * `ParseOptions` plus the custom-key NAME list, derived once per `parseInput`
 * rather than per node — `classifyKey` runs on every property of every card.
 */
type InternalParseOptions = ParseOptions & {
  customNames: readonly string[];
};

function parseNode(
  node: unknown,
  parentKey: string | undefined,
  level: number,
  opts: InternalParseOptions,
  errors: ParseError[],
  path: string,
  seenIds: Set<string>,
): ParsedCardTree | null {
  if (!isPlainObject(node)) {
    errors.push({
      message: "expected an object; found " + (Array.isArray(node) ? "array" : typeof node),
      path,
    });
    return null;
  }

  // identity
  let id =
    typeof node.__rcid === "string" && node.__rcid.length > 0
      ? node.__rcid
      : autoId(path);
  if (seenIds.has(id)) {
    errors.push({
      message: `duplicate __rcid "${id}"; regenerated`,
      path,
    });
    // Path is unique, so the path-derived id deterministically resolves the
    // collision (and stays SSR-stable).
    id = autoId(path);
  }
  seenIds.add(id);

  let order = 0;
  if (node.__rcorder !== undefined) {
    if (typeof node.__rcorder === "number" && Number.isFinite(node.__rcorder)) {
      order = node.__rcorder;
    } else {
      errors.push({
        message: `non-numeric __rcorder coerced to 0`,
        path,
      });
    }
  }

  const meta = parseMeta(node.__rcmeta, errors, path);

  const fields: CardTreeField[] = [];
  const predefined: CardTreePredefinedEntry[] = [];
  const children: ParsedCardTree[] = [];
  const seenSiblingKeys = new Set<string>();

  for (const key of Object.keys(node)) {
    if ((["__rcid", "__rcorder", "__rcmeta"] as const).includes(key as never))
      continue;
    if (seenSiblingKeys.has(key)) {
      errors.push({ message: `duplicate sibling key "${key}"; ignored`, path });
      continue;
    }
    seenSiblingKeys.add(key);

    const value = node[key];
    const childPath = pathJoin(path, key);
    const classification = classifyKey(
      key,
      value,
      opts.disabledPredefinedKeys,
      opts.customNames,
    );

    switch (classification) {
      case "reserved":
        // unreachable in this loop (reserved keys filtered above)
        break;

      case "predefined": {
        const validated = validatePredefinedShape(
          key as PredefinedKey,
          value,
          errors,
          childPath,
        );
        if (validated) predefined.push(validated);
        break;
      }

      case "custom": {
        const registration = opts.customKeys
          ? findCustomKey(opts.customKeys, key)
          : undefined;
        if (!registration) {
          // classifyKey said "custom" but the registration is gone — only
          // reachable if customNames and customKeys were built from different
          // sources. Treat as a field rather than losing the value silently.
          errors.push({
            message: `custom predefined-key "${key}" is classified but has no registration; entry dropped`,
            path: childPath,
          });
          break;
        }

        // Host code runs here. plan-v0.3 §L881: a throwing validator must
        // degrade (drop + warn), never take the tree down.
        let result: { ok: boolean; errors?: { code: string; message: string }[] };
        try {
          result = registration.validate(value);
        } catch {
          errors.push({
            message: `custom predefined-key "${key}" validator threw; entry dropped`,
            path: childPath,
          });
          break;
        }

        if (!result || result.ok !== true) {
          const detail = (result?.errors ?? [])
            .map((e) => `${e.code}: ${e.message}`)
            .join("; ");
          errors.push({
            message: `custom predefined-key "${key}" failed validation${detail ? ` (${detail})` : ""}; entry dropped`,
            path: childPath,
          });
          break;
        }

        // Stored verbatim — serialize writes `entry.value` straight back out,
        // so the round-trip is byte-identical for any JSON shape (I2).
        predefined.push({ key, custom: true, value });
        break;
      }

      case "field": {
        const type = inferFlatFieldType(value, opts.dateDetection);
        if (type === null) {
          errors.push({
            message: `unsupported flat-field value type for key "${key}" (got ${typeof value}); ignored`,
            path: childPath,
          });
        } else {
          fields.push({ key, value: value as FlatFieldValue, type });
        }
        break;
      }

      case "child": {
        if (Array.isArray(value)) {
          errors.push({
            message: `array values are not supported as children in v0.1 (key "${key}"). Use object-keyed children, or the \`list\` predefined key for scalar arrays.`,
            path: childPath,
          });
          break;
        }
        const child = parseNode(
          value,
          key,
          level + 1,
          opts,
          errors,
          childPath,
          seenIds,
        );
        if (child) children.push(child);
        break;
      }
    }
  }

  // Stable sort children by order; tie-break by input order (Array.prototype.sort
  // is stable in all modern engines, including V8 since 7.0).
  children.sort((a, b) => a.order - b.order);

  return {
    id,
    order,
    level,
    parentKey,
    meta,
    fields,
    predefined,
    children,
  };
}

/* ───────── public entry point ───────── */

export function parseInput(
  input: CardTreeJsonNode,
  opts: ParseOptions,
): ParseResult {
  const errors: ParseError[] = [];
  const seenIds = new Set<string>();
  const internal: InternalParseOptions = {
    ...opts,
    customNames: opts.customKeys?.map((k) => k.key) ?? [],
  };
  const tree = parseNode(input, undefined, 1, internal, errors, "", seenIds);
  return { tree, errors };
}
