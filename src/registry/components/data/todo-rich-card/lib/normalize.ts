/**
 * Input ↔ internal tree.
 *
 * `normalize(item)` walks a public TodoItem, validates the closed schema,
 * recovers from common authoring mistakes (missing id, bad ISO date), and
 * produces a TodoNode tree with derived data (level, parentId, sibling index,
 * idIndex map).
 *
 * `denormalize(node)` rebuilds the public TodoItem shape — drops level/parentId/
 * index but otherwise hands back the same data consumers passed in.
 */

import type { TodoItem, TodoNode } from "../types";
import { parseIso, toIso } from "./time";

export type NormalizationError = {
  path: string;
  message: string;
};

export type NormalizationResult = {
  root: TodoNode;
  errors: NormalizationError[];
  idIndex: Map<string, TodoNode>;
};

/** Returns true if value is a non-null, non-array object. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validatePerson(
  raw: unknown,
  path: string,
  errors: NormalizationError[],
): TodoItem["targetPerson"] {
  if (raw == null) return undefined;
  if (!isPlainObject(raw)) {
    errors.push({ path, message: "person must be an object" });
    return undefined;
  }
  const id = typeof raw.id === "string" ? raw.id : undefined;
  const name = typeof raw.name === "string" ? raw.name : undefined;
  if (!name) {
    errors.push({ path: `${path}.name`, message: "person.name is required" });
    return undefined;
  }
  return {
    id: id ?? `person-${Math.random().toString(36).slice(2, 10)}`,
    name,
    avatar: typeof raw.avatar === "string" ? raw.avatar : undefined,
  };
}

function validateImages(
  raw: unknown,
  path: string,
  errors: NormalizationError[],
): TodoItem["images"] {
  if (raw == null) return undefined;
  if (!Array.isArray(raw)) {
    errors.push({ path, message: "images must be an array" });
    return undefined;
  }
  const out: NonNullable<TodoItem["images"]> = [];
  raw.forEach((entry, i) => {
    if (!isPlainObject(entry)) {
      errors.push({ path: `${path}[${i}]`, message: "image must be an object" });
      return;
    }
    if (typeof entry.src !== "string" || entry.src.length === 0) {
      errors.push({
        path: `${path}[${i}].src`,
        message: "image.src is required",
      });
      return;
    }
    out.push({
      src: entry.src,
      alt: typeof entry.alt === "string" ? entry.alt : undefined,
      caption: typeof entry.caption === "string" ? entry.caption : undefined,
    });
  });
  return out;
}

function validateLinks(
  raw: unknown,
  path: string,
  errors: NormalizationError[],
): TodoItem["links"] {
  if (raw == null) return undefined;
  if (!Array.isArray(raw)) {
    errors.push({ path, message: "links must be an array" });
    return undefined;
  }
  const out: NonNullable<TodoItem["links"]> = [];
  raw.forEach((entry, i) => {
    if (!isPlainObject(entry)) {
      errors.push({ path: `${path}[${i}]`, message: "link must be an object" });
      return;
    }
    if (typeof entry.url !== "string" || entry.url.length === 0) {
      errors.push({
        path: `${path}[${i}].url`,
        message: "link.url is required",
      });
      return;
    }
    out.push({
      url: entry.url,
      label: typeof entry.label === "string" ? entry.label : undefined,
      icon: typeof entry.icon === "string" ? entry.icon : undefined,
    });
  });
  return out;
}

/** Generate a fresh id for items that arrived without one. */
function freshId(): string {
  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `todo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

type NormalizeCtx = {
  errors: NormalizationError[];
  idIndex: Map<string, TodoNode>;
  seenIds: Set<string>;
};

function normalizeNode(
  raw: unknown,
  ctx: NormalizeCtx,
  path: string,
  level: number,
  parentId: string | null,
  index: number,
): TodoNode {
  // Structural fallback if the input isn't even an object.
  if (!isPlainObject(raw)) {
    ctx.errors.push({ path, message: "item must be an object" });
    return makeErrorNode(level, parentId, index);
  }

  const idRaw = typeof raw.id === "string" && raw.id.length > 0 ? raw.id : null;
  let id = idRaw ?? freshId();
  if (!idRaw) {
    ctx.errors.push({
      path: `${path}.id`,
      message: "id is required — synthesized a fresh UUID",
    });
  }
  if (ctx.seenIds.has(id)) {
    const original = id;
    id = freshId();
    ctx.errors.push({
      path: `${path}.id`,
      message: `duplicate id "${original}" — regenerated as "${id}"`,
    });
  }
  ctx.seenIds.add(id);

  const name =
    typeof raw.name === "string" && raw.name.length > 0 ? raw.name : "(Untitled)";
  if (typeof raw.name !== "string" || raw.name.length === 0) {
    ctx.errors.push({
      path: `${path}.name`,
      message: "name is missing or empty",
    });
  }

  const status = typeof raw.status === "string" ? raw.status : "";
  const active = typeof raw.active === "boolean" ? raw.active : true;

  // setAt is required. Recover to now() ISO if missing/invalid.
  const setAtRaw = typeof raw.setAt === "string" ? raw.setAt : "";
  const setAtDate = parseIso(setAtRaw);
  const setAt = setAtDate ? setAtDate.toISOString() : new Date().toISOString();
  if (!setAtDate) {
    ctx.errors.push({
      path: `${path}.setAt`,
      message: `setAt missing or invalid ISO-8601 — coerced to now()`,
    });
  }

  const startAt =
    typeof raw.startAt === "string"
      ? toIso(parseIso(raw.startAt))
      : undefined;
  const expireAt =
    typeof raw.expireAt === "string"
      ? toIso(parseIso(raw.expireAt))
      : undefined;
  const duration =
    typeof raw.duration === "number" && Number.isFinite(raw.duration) && raw.duration > 0
      ? raw.duration
      : undefined;

  // expireAt < startAt sanity check.
  if (expireAt && startAt) {
    const sd = parseIso(startAt);
    const ed = parseIso(expireAt);
    if (sd && ed && ed.getTime() <= sd.getTime()) {
      ctx.errors.push({
        path: `${path}.expireAt`,
        message: "expireAt <= startAt; time engine will treat as inactive",
      });
    }
  }

  const item: TodoItem = {
    id,
    name,
    description:
      typeof raw.description === "string" ? raw.description : undefined,
    status,
    active,
    setAt,
    startAt,
    expireAt,
    duration,
    targetPerson: validatePerson(raw.targetPerson, `${path}.targetPerson`, ctx.errors),
    creatorPerson: validatePerson(raw.creatorPerson, `${path}.creatorPerson`, ctx.errors),
    images: validateImages(raw.images, `${path}.images`, ctx.errors),
    links: validateLinks(raw.links, `${path}.links`, ctx.errors),
    borderColor:
      typeof raw.borderColor === "string" ? raw.borderColor : undefined,
    locked: typeof raw.locked === "boolean" ? raw.locked : undefined,
  };

  // Children — recurse.
  const childNodes: TodoNode[] = [];
  if (raw.children !== undefined) {
    if (!Array.isArray(raw.children)) {
      ctx.errors.push({
        path: `${path}.children`,
        message: "children must be an array",
      });
    } else {
      raw.children.forEach((child, i) => {
        childNodes.push(
          normalizeNode(child, ctx, `${path}.children[${i}]`, level + 1, id, i),
        );
      });
    }
  }
  item.children = childNodes.length > 0 ? childNodes.map((n) => n.item) : undefined;

  const node: TodoNode = {
    item,
    level,
    parentId,
    index,
    childNodes,
  };
  ctx.idIndex.set(id, node);
  return node;
}

function makeErrorNode(
  level: number,
  parentId: string | null,
  index: number,
): TodoNode {
  const id = freshId();
  return {
    item: {
      id,
      name: "(Invalid item)",
      status: "",
      active: false,
      setAt: new Date().toISOString(),
    },
    level,
    parentId,
    index,
    childNodes: [],
  };
}

export function normalize(input: TodoItem | unknown): NormalizationResult {
  const ctx: NormalizeCtx = {
    errors: [],
    idIndex: new Map(),
    seenIds: new Set(),
  };
  const root = normalizeNode(input, ctx, "$", 1, null, 0);
  return { root, errors: ctx.errors, idIndex: ctx.idIndex };
}

/** TodoNode → public TodoItem (drops level/parentId/index). */
export function denormalize(node: TodoNode): TodoItem {
  const { item, childNodes } = node;
  // Reconstruct children array from current childNodes (item.children may be stale after edits).
  const out: TodoItem = { ...item };
  if (childNodes.length > 0) {
    out.children = childNodes.map(denormalize);
  } else {
    delete out.children;
  }
  // Strip undefined optional fields so the output is canonical.
  const optionalKeys: Array<keyof TodoItem> = [
    "description",
    "startAt",
    "expireAt",
    "duration",
    "targetPerson",
    "creatorPerson",
    "images",
    "links",
    "borderColor",
    "locked",
    "children",
  ];
  optionalKeys.forEach((k) => {
    if (out[k] === undefined) delete out[k];
  });
  return out;
}

/**
 * Walks the tree mutating in place: useful for the reducer's structural ops
 * (add-child / remove / move). Returns the node, or null if id not found.
 */
export function findNode(root: TodoNode, id: string): TodoNode | null {
  if (root.item.id === id) return root;
  for (const child of root.childNodes) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

/** Recompute level/parentId/index from a freshly-restructured tree. */
export function reindex(root: TodoNode): TodoNode {
  function walk(node: TodoNode, level: number, parentId: string | null, index: number): TodoNode {
    return {
      item: node.item,
      level,
      parentId,
      index,
      childNodes: node.childNodes.map((child, i) =>
        walk(child, level + 1, node.item.id, i),
      ),
    };
  }
  return walk(root, 1, null, 0);
}
