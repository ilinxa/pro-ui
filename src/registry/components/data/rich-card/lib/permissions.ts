/**
 * Pure permission resolver.
 *
 * Resolution order (most → least specific):
 *   1. Predicate (canEditField, canAddCard, etc.) — overrides everything
 *   2. Per-card meta lock (`__rcmeta.locked === true`) — read-only cascade
 *   3. Per-card override (permissions.byCard[id])
 *   4. Per-predefined-key override (permissions.byPredefinedKey[key])
 *   5. Per-field-type override (permissions.byFieldType[type])
 *   6. Per-level override (permissions.byLevel[level])
 *   7. Default (permissions.default)
 *   8. Global `editable` prop — false denies everything
 */

import type {
  EffectivePermissions,
  PermissionDenialReason,
  PermissionRule,
  RichCardPermissions,
} from "../types";
import type { FlatFieldType } from "./infer-type";
import type { RichCardTree } from "./reducer";

export type PermissionAction = "edit" | "add" | "remove" | "reorder" | "reparent";

export type PermissionTarget = {
  cardId: string;
  level: number;
  /** "card" → the card itself; "field" → flat field with optional `key`; "predefined" → predefined entry with `key`. */
  kind: "card" | "field" | "predefined";
  key?: string;
  /** For field-targeted actions, the field's inferred type. */
  fieldType?: FlatFieldType;
};

export type PermissionContext = {
  editable: boolean;
  permissions?: RichCardPermissions;
  metaLockedIds: ReadonlySet<string>;
  ancestorMap: Map<string, readonly string[]>;
};

/* ───────── locked-cards computation (cascading) ───────── */

export function computeLockedIds(tree: RichCardTree): Set<string> {
  const out = new Set<string>();
  walkLocked(tree, false, out);
  return out;
}

function walkLocked(node: RichCardTree, ancestorLocked: boolean, out: Set<string>): void {
  const selfLocked = node.meta?.locked === true;
  const isLocked = ancestorLocked || selfLocked;
  if (isLocked) out.add(node.id);
  for (const child of node.children) walkLocked(child, isLocked, out);
}

/* ───────── ancestor map (for permission inheritance) ───────── */

export function computeAncestorMap(tree: RichCardTree): Map<string, readonly string[]> {
  const out = new Map<string, readonly string[]>();
  walkAncestor(tree, [], out);
  return out;
}

function walkAncestor(
  node: RichCardTree,
  path: string[],
  out: Map<string, readonly string[]>,
): void {
  out.set(node.id, path);
  for (const c of node.children) walkAncestor(c, [...path, node.id], out);
}

/* ───────── effective permissions resolver ───────── */

const ALL_DENIED: EffectivePermissions = {
  edit: false,
  add: false,
  remove: false,
  reorder: false,
  reparent: false,
};

const ALL_ALLOWED_DEFAULTS: PermissionRule = {
  edit: true,
  add: true,
  remove: true,
  reorder: true,
  reparent: true,
};

export function resolveEffectivePermissions(
  ctx: PermissionContext,
  target: PermissionTarget,
): EffectivePermissions {
  // 1. Global editable=false → deny all
  if (!ctx.editable) {
    return { ...ALL_DENIED, reason: "global-editable-false" };
  }

  // 2. Meta-lock cascade
  if (ctx.metaLockedIds.has(target.cardId)) {
    return { ...ALL_DENIED, reason: "meta-locked" };
  }

  // Build resolved rule by layering, most-specific overrides win
  let rule: PermissionRule = { ...ALL_ALLOWED_DEFAULTS };
  let reason: PermissionDenialReason | undefined;

  // 7. Default
  if (ctx.permissions?.default) {
    rule = { ...rule, ...ctx.permissions.default };
    reason = "default";
  }

  // 6. Per-level
  if (ctx.permissions?.byLevel) {
    const levelRule = ctx.permissions.byLevel[target.level];
    if (levelRule) {
      rule = { ...rule, ...levelRule };
      reason = "by-level";
    }
  }

  // 6.5 Inheritance — when permissions.inherit is true, walk ancestors and OR-combine "denied" flags
  if (ctx.permissions?.inherit && ctx.permissions.byCard) {
    const ancestors = ctx.ancestorMap.get(target.cardId) ?? [];
    for (const ancestorId of ancestors) {
      const ancestorRule = ctx.permissions.byCard[ancestorId];
      if (ancestorRule) {
        rule = { ...rule, ...maskDenials(rule, ancestorRule) };
      }
    }
  }

  // 5. Per-field-type (only applicable for field-targeted actions)
  if (
    ctx.permissions?.byFieldType &&
    target.kind === "field" &&
    target.fieldType
  ) {
    const fieldTypeRule = ctx.permissions.byFieldType[target.fieldType];
    if (fieldTypeRule) {
      rule = { ...rule, ...fieldTypeRule };
      reason = "by-field-type";
    }
  }

  // 4. Per-predefined-key
  if (
    ctx.permissions?.byPredefinedKey &&
    target.kind === "predefined" &&
    target.key
  ) {
    const keyRule = (
      ctx.permissions.byPredefinedKey as Record<string, PermissionRule>
    )[target.key];
    if (keyRule) {
      rule = { ...rule, ...keyRule };
      reason = "by-predefined-key";
    }
  }

  // 3. Per-card
  if (ctx.permissions?.byCard) {
    const cardRule = ctx.permissions.byCard[target.cardId];
    if (cardRule) {
      rule = { ...rule, ...cardRule };
      reason = "by-card";
    }
  }

  return { ...rule, reason };
}

/** OR-combine denials: if either rule denies, denied. Used for inheritance. */
function maskDenials(base: PermissionRule, ancestor: PermissionRule): PermissionRule {
  const out: PermissionRule = {};
  for (const key of Object.keys(ancestor) as (keyof PermissionRule)[]) {
    if (ancestor[key] === false) out[key] = false;
    else if (base[key] !== undefined) out[key] = base[key];
  }
  return out;
}

/* ───────── per-action helpers (used by predicates) ───────── */

export function canDoAction(
  ctx: PermissionContext,
  action: PermissionAction,
  target: PermissionTarget,
): { allowed: boolean; reason?: PermissionDenialReason } {
  const eff = resolveEffectivePermissions(ctx, target);
  const allowed = eff[action] !== false;
  return { allowed, reason: allowed ? undefined : eff.reason };
}
