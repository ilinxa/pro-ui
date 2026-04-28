import { useCallback, useMemo } from "react";
import type {
  EffectivePermissions,
  PermissionDenialReason,
  PermissionRule,
  RichCardPermissions,
} from "../types";
import {
  computeAncestorMap,
  computeLockedIds,
  resolveEffectivePermissions,
  type PermissionAction,
  type PermissionContext,
  type PermissionTarget,
} from "../lib/permissions";
import type { RichCardTree } from "../lib/parse";

export type PermissionPredicates = {
  canEditField?: (cardId: string, key: string) => boolean;
  canAddField?: (cardId: string) => boolean;
  canRemoveField?: (cardId: string, key: string) => boolean;
  canEditCard?: (cardId: string) => boolean;
  canAddCard?: (parentId: string) => boolean;
  canRemoveCard?: (cardId: string) => boolean;
  canEditPredefined?: (cardId: string, key: string) => boolean;
  canAddPredefined?: (cardId: string, key: string) => boolean;
  canRemovePredefined?: (cardId: string, key: string) => boolean;
  canDragCard?: (cardId: string) => boolean;
  canDropCard?: (cardId: string, targetParentId: string) => boolean;
};

/**
 * Returns memoized helpers that resolve effective permissions for any (action, target).
 * Predicate predicates take precedence over declarative permissions.
 */
export function usePermissions(
  tree: RichCardTree,
  editable: boolean,
  permissions: RichCardPermissions | undefined,
  predicates: PermissionPredicates,
  onDenied:
    | ((
        action: keyof PermissionRule,
        cardId: string,
        target: string | undefined,
        reason: PermissionDenialReason,
      ) => void)
    | undefined,
) {
  const metaLockedIds = useMemo(() => computeLockedIds(tree), [tree]);
  const ancestorMap = useMemo(() => computeAncestorMap(tree), [tree]);

  const ctx: PermissionContext = useMemo(
    () => ({ editable, permissions, metaLockedIds, ancestorMap }),
    [editable, permissions, metaLockedIds, ancestorMap],
  );

  const getEffective = useCallback(
    (target: PermissionTarget): EffectivePermissions => {
      return resolveEffectivePermissions(ctx, target);
    },
    [ctx],
  );

  const check = useCallback(
    (action: PermissionAction, target: PermissionTarget): boolean => {
      const eff = resolveEffectivePermissions(ctx, target);
      const allowed = eff[action] !== false;
      if (!allowed && onDenied) {
        onDenied(action, target.cardId, target.key, eff.reason ?? "default");
      }
      return allowed;
    },
    [ctx, onDenied],
  );

  // Public convenience wrappers
  const canEditField = useCallback(
    (cardId: string, key: string) => {
      if (predicates.canEditField) {
        const r = predicates.canEditField(cardId, key);
        if (!r && onDenied) onDenied("edit", cardId, key, "predicate");
        return r;
      }
      return check("edit", { cardId, level: 0, kind: "field", key });
    },
    [check, predicates, onDenied],
  );

  const canAddField = useCallback(
    (cardId: string) => {
      if (predicates.canAddField) {
        const r = predicates.canAddField(cardId);
        if (!r && onDenied) onDenied("add", cardId, undefined, "predicate");
        return r;
      }
      return check("add", { cardId, level: 0, kind: "field" });
    },
    [check, predicates, onDenied],
  );

  const canRemoveField = useCallback(
    (cardId: string, key: string) => {
      if (predicates.canRemoveField) {
        const r = predicates.canRemoveField(cardId, key);
        if (!r && onDenied) onDenied("remove", cardId, key, "predicate");
        return r;
      }
      return check("remove", { cardId, level: 0, kind: "field", key });
    },
    [check, predicates, onDenied],
  );

  const canEditCard = useCallback(
    (cardId: string) => {
      if (predicates.canEditCard) {
        const r = predicates.canEditCard(cardId);
        if (!r && onDenied) onDenied("edit", cardId, undefined, "predicate");
        return r;
      }
      return check("edit", { cardId, level: 0, kind: "card" });
    },
    [check, predicates, onDenied],
  );

  const canAddCard = useCallback(
    (parentId: string) => {
      if (predicates.canAddCard) {
        const r = predicates.canAddCard(parentId);
        if (!r && onDenied) onDenied("add", parentId, undefined, "predicate");
        return r;
      }
      return check("add", { cardId: parentId, level: 0, kind: "card" });
    },
    [check, predicates, onDenied],
  );

  const canRemoveCard = useCallback(
    (cardId: string) => {
      if (predicates.canRemoveCard) {
        const r = predicates.canRemoveCard(cardId);
        if (!r && onDenied) onDenied("remove", cardId, undefined, "predicate");
        return r;
      }
      return check("remove", { cardId, level: 0, kind: "card" });
    },
    [check, predicates, onDenied],
  );

  const canEditPredefined = useCallback(
    (cardId: string, key: string) => {
      if (predicates.canEditPredefined) {
        const r = predicates.canEditPredefined(cardId, key);
        if (!r && onDenied) onDenied("edit", cardId, key, "predicate");
        return r;
      }
      return check("edit", { cardId, level: 0, kind: "predefined", key });
    },
    [check, predicates, onDenied],
  );

  const canAddPredefined = useCallback(
    (cardId: string, key: string) => {
      if (predicates.canAddPredefined) return predicates.canAddPredefined(cardId, key);
      return check("add", { cardId, level: 0, kind: "predefined", key });
    },
    [check, predicates],
  );

  const canRemovePredefined = useCallback(
    (cardId: string, key: string) => {
      if (predicates.canRemovePredefined) return predicates.canRemovePredefined(cardId, key);
      return check("remove", { cardId, level: 0, kind: "predefined", key });
    },
    [check, predicates],
  );

  const canDragCard = useCallback(
    (cardId: string) => {
      if (predicates.canDragCard) return predicates.canDragCard(cardId);
      return check("reorder", { cardId, level: 0, kind: "card" });
    },
    [check, predicates],
  );

  const canDropCard = useCallback(
    (cardId: string, targetParentId: string) => {
      if (predicates.canDropCard) return predicates.canDropCard(cardId, targetParentId);
      return check("reparent", { cardId, level: 0, kind: "card" });
    },
    [check, predicates],
  );

  const isLocked = useCallback(
    (cardId: string) => metaLockedIds.has(cardId),
    [metaLockedIds],
  );

  return {
    canEditField,
    canAddField,
    canRemoveField,
    canEditCard,
    canAddCard,
    canRemoveCard,
    canEditPredefined,
    canAddPredefined,
    canRemovePredefined,
    canDragCard,
    canDropCard,
    isLocked,
    getEffective,
  };
}

export type UsePermissionsReturn = ReturnType<typeof usePermissions>;
