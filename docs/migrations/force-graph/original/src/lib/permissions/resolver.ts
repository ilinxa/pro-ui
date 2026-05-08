import type { Edge, Group, Node } from "../../types";

/**
 * v0.1 ships permission-resolver SCAFFOLDING ONLY. Per plan §3 + system
 * decision #25, the full resolver lands in v0.3 when CRUD lands. v0.1's
 * only enforcement is canonical-field read-only on system nodes (which
 * v0.1 doesn't actively use — there are no edit affordances yet).
 *
 * The resolver layer exists in v0.1 so:
 *   - Tier 3 hosts can wire the `resolvePermission` prop now without
 *     crashing.
 *   - The shape is fixed before v0.3 expands it (additive only).
 */

export type PermissionAction =
  | "edit"
  | "edit-pinned"
  | "edit-direction"
  | "delete"
  | "annotate";

export type PermissionDecision = boolean;

export type Entity = Node | Edge | Group;

export type ResolvePermissionFn = (
  entity: Entity,
  action: PermissionAction,
) => PermissionDecision | undefined;

export interface PermissionResolverOptions {
  /** Host-supplied predicate (highest precedence) */
  resolvePermission?: ResolvePermissionFn;
}

/**
 * v0.1 default behavior:
 *   - Host predicate runs first; non-undefined wins.
 *   - System-origin entities: canonical-field edits are denied;
 *     `annotate` is allowed (per decision #23).
 *   - User-origin entities: all actions allowed by default.
 *
 * v0.3 expands with the full layered resolver (predicate → meta lock →
 * origin × action defaults → fallback). Plan-locked.
 */
export function defaultResolvePermission(
  entity: Entity,
  action: PermissionAction,
  hostResolver?: ResolvePermissionFn,
): PermissionDecision {
  if (hostResolver) {
    const decision = hostResolver(entity, action);
    if (decision !== undefined) return decision;
  }

  const origin = entity.origin;

  if (origin === "user") {
    return true;
  }

  // system-origin: read-only by default, except `annotate` per #23
  if (action === "annotate") return true;
  return false;
}
