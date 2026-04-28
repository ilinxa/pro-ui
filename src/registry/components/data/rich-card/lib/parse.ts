/**
 * Pure parser: input `RichCardJsonNode` → normalized internal `RichCardTree`.
 *
 * Errors are collected into an array (not thrown), so the caller can render
 * a best-effort tree alongside diagnostics.
 *
 * See plan §5.1 for the full algorithm.
 */

import type {
  CodeAreaValue,
  FlatFieldValue,
  ImageValue,
  ListValue,
  PredefinedKey,
  QuoteValue,
  RichCardJsonNode,
  TableValue,
} from "../types";
import { classifyKey } from "./classify-key";
import {
  inferFlatFieldType,
  type DateDetection,
  type FlatFieldType,
} from "./infer-type";

/* ───────── internal tree types ───────── */

export type RichCardField = {
  key: string;
  value: FlatFieldValue;
  type: FlatFieldType;
};

export type RichCardPredefinedEntry =
  | { key: "codearea"; value: CodeAreaValue }
  | { key: "image"; value: ImageValue }
  | { key: "table"; value: TableValue }
  | { key: "quote"; value: QuoteValue }
  | { key: "list"; value: ListValue };

export type RichCardTree = {
  id: string;
  order: number;
  level: number;
  /** Property name on the parent that pointed to this card. Undefined only on root. */
  parentKey?: string;
  meta?: Record<string, FlatFieldValue>;
  fields: RichCardField[];
  predefined: RichCardPredefinedEntry[];
  children: RichCardTree[];
};

export type ParseError = {
  message: string;
  path: string;
};

export type ParseOptions = {
  disabledPredefinedKeys: readonly PredefinedKey[];
  dateDetection: DateDetection;
};

export type ParseResult = {
  tree: RichCardTree | null;
  errors: ParseError[];
};

/* ───────── helpers ───────── */

function generateId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  // Fallback (shouldn't happen in supported environments).
  return `rc-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
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
): RichCardPredefinedEntry | null {
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

function parseNode(
  node: unknown,
  parentKey: string | undefined,
  level: number,
  opts: ParseOptions,
  errors: ParseError[],
  path: string,
  seenIds: Set<string>,
): RichCardTree | null {
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
      : generateId();
  if (seenIds.has(id)) {
    errors.push({
      message: `duplicate __rcid "${id}"; regenerated`,
      path,
    });
    id = generateId();
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

  const fields: RichCardField[] = [];
  const predefined: RichCardPredefinedEntry[] = [];
  const children: RichCardTree[] = [];
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
  input: RichCardJsonNode,
  opts: ParseOptions,
): ParseResult {
  const errors: ParseError[] = [];
  const seenIds = new Set<string>();
  const tree = parseNode(input, undefined, 1, opts, errors, "", seenIds);
  return { tree, errors };
}
