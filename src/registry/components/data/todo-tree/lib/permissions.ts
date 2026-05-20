import type {
  TodoItem,
  TodoPermissionRule,
  TodoPermissions,
} from "../../todo-rich-card/types";
import type { TodoTreePermissionAction } from "../types";

/**
 * Map tree-specific actions onto todo-rich-card's TodoPermissionRule keys.
 * The TodoPermissions prop type comes from todo-rich-card to keep the matrix
 * shape consistent across sibling procomps, so the two tree-only actions
 * piggy-back on the most-natural existing rule key:
 *   - dropAsSibling  → "drag"        (the source item must be draggable)
 *   - dropIntoChildren → "addChildren" (the target must accept new children)
 */
const ACTION_TO_RULE_KEY: Record<
  TodoTreePermissionAction,
  keyof TodoPermissionRule
> = {
  edit: "edit",
  toggleActive: "toggleActive",
  drag: "drag",
  dropAsSibling: "drag",
  dropIntoChildren: "addChildren",
  remove: "remove",
};

/**
 * Evaluate the effective allow/deny for a single action against an item at
 * `level`. Hard locks (`item.locked === true`) deny everything. The lookup
 * order is byItem → byLevel → default, then a true fallback when nothing
 * matches.
 *
 * `permissions.inherit` is honored by ascending the chain on undefined keys;
 * when inherit is false the first match wins outright (no fallthrough).
 */
export function evalPermission(
  permissions: TodoPermissions | undefined,
  action: TodoTreePermissionAction,
  item: TodoItem,
  level: number,
): boolean {
  if (item.locked) return false;
  if (!permissions) return true;

  const ruleKey = ACTION_TO_RULE_KEY[action];
  const inherit = permissions.inherit !== false;

  const byItemValue = permissions.byItem?.[item.id]?.[ruleKey];
  if (byItemValue !== undefined) return byItemValue;
  if (!inherit && permissions.byItem?.[item.id]) return true;

  const byLevelValue = permissions.byLevel?.[level]?.[ruleKey];
  if (byLevelValue !== undefined) return byLevelValue;
  if (!inherit && permissions.byLevel?.[level]) return true;

  const defaultValue = permissions.default?.[ruleKey];
  if (defaultValue !== undefined) return defaultValue;

  return true;
}
