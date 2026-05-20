/**
 * Permission resolver. Pure function.
 *
 * Resolution order (plan §8.1):
 *   1. Hard lock (item.locked) → all false, reason 'locked'
 *   2. Per-action predicate (canEditItem? / etc.) → false, reason 'predicate'
 *   3. permissions.byItem[id] rule
 *   4. permissions.byLevel[level] rule
 *   5. permissions.default rule
 *   6. Fallback: all true
 *
 * `permissions.inherit` (default true) cascades a parent's effective rule
 * onto its descendants before per-item / per-level rules apply.
 */

import type {
  ResolvedPermissions,
  TodoNode,
  TodoPermissionReason,
  TodoPermissionRule,
  TodoPermissions,
  TodoRichCardProps,
} from "../types";

const ACTIONS: Array<keyof TodoPermissionRule> = [
  "edit",
  "remove",
  "addChildren",
  "drag",
  "toggleActive",
  "overrideColor",
];

function allTrue(): TodoPermissionRule {
  return {
    edit: true,
    remove: true,
    addChildren: true,
    drag: true,
    toggleActive: true,
    overrideColor: true,
  };
}

function mergeRule(
  base: TodoPermissionRule,
  overlay: TodoPermissionRule | undefined,
): TodoPermissionRule {
  if (!overlay) return base;
  const out: TodoPermissionRule = { ...base };
  for (const key of ACTIONS) {
    if (overlay[key] !== undefined) out[key] = overlay[key];
  }
  return out;
}

/** Returns the effective rule for a node, walking declarative permissions only. */
function declarativeRule(
  level: number,
  itemId: string,
  ancestorRule: TodoPermissionRule,
  permissions: TodoPermissions | undefined,
): { rule: TodoPermissionRule; reason: TodoPermissionReason } {
  const inherit = permissions?.inherit !== false; // default true

  let rule = allTrue();
  let reason: TodoPermissionReason = "default";

  if (inherit) {
    rule = ancestorRule;
  }

  if (permissions?.default) {
    rule = mergeRule(rule, permissions.default);
    reason = "default";
  }
  if (permissions?.byLevel?.[level]) {
    rule = mergeRule(rule, permissions.byLevel[level]);
    reason = "by-level";
  }
  if (permissions?.byItem?.[itemId]) {
    rule = mergeRule(rule, permissions.byItem[itemId]);
    reason = "by-item";
  }

  return { rule, reason };
}

/**
 * Compute effective permissions for a single node, given an ancestor's
 * pre-resolved rule (for cascade). Pure.
 */
export function resolveForNode(
  node: TodoNode,
  ancestorRule: TodoPermissionRule,
  props: TodoRichCardProps,
): ResolvedPermissions {
  const id = node.item.id;

  // 1. Hard lock.
  if (node.item.locked) {
    return {
      edit: false,
      remove: false,
      addChildren: false,
      drag: false,
      toggleActive: false,
      overrideColor: false,
      reason: "locked",
    };
  }

  // 3-5. Declarative resolution.
  const { rule, reason: declarativeReason } = declarativeRule(
    node.level,
    id,
    ancestorRule,
    props.permissions,
  );

  // 2. Per-action predicate overrides. A predicate returning false wins;
  //    returning true falls back to the declarative rule.
  const predicateChecks: Array<[keyof TodoPermissionRule, ((id: string) => boolean) | undefined]> = [
    ["edit", props.canEditItem],
    ["remove", props.canRemoveItem],
    ["addChildren", props.canAddChildren],
    ["drag", props.canDragItem],
    ["toggleActive", props.canToggleActive],
    ["overrideColor", props.canOverrideColor],
  ];

  let predicateDeniedAny = false;
  const resolved: TodoPermissionRule = { ...rule };
  for (const [action, predicate] of predicateChecks) {
    if (predicate && !predicate(id)) {
      resolved[action] = false;
      predicateDeniedAny = true;
    }
  }

  return {
    edit: resolved.edit ?? true,
    remove: resolved.remove ?? true,
    addChildren: resolved.addChildren ?? true,
    drag: resolved.drag ?? true,
    toggleActive: resolved.toggleActive ?? true,
    overrideColor: resolved.overrideColor ?? true,
    reason: predicateDeniedAny ? "predicate" : declarativeReason,
  };
}

/**
 * Build a memoizable resolver closure for a tree.
 * The resolver walks ancestors lazily via the idIndex; in practice it's called
 * per-render-per-card so we precompute a flat map.
 */
export function buildResolver(
  root: TodoNode,
  props: TodoRichCardProps,
): (node: TodoNode) => ResolvedPermissions {
  // Pre-walk the tree depth-first, threading the ancestor rule.
  const cache = new Map<string, ResolvedPermissions>();

  function walk(node: TodoNode, ancestorRule: TodoPermissionRule): void {
    const resolved = resolveForNode(node, ancestorRule, props);
    cache.set(node.item.id, resolved);
    // For cascade: convert resolved (effective) back into a "carry" rule for descendants.
    const carry: TodoPermissionRule = {
      edit: resolved.edit,
      remove: resolved.remove,
      addChildren: resolved.addChildren,
      drag: resolved.drag,
      toggleActive: resolved.toggleActive,
      overrideColor: resolved.overrideColor,
    };
    for (const child of node.childNodes) walk(child, carry);
  }

  walk(root, allTrue());

  return (node: TodoNode) => {
    const cached = cache.get(node.item.id);
    if (cached) return cached;
    // Cache miss (newly-added node not in pre-walk): fall back to direct compute.
    return resolveForNode(node, allTrue(), props);
  };
}
