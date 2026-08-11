/**
 * Pure validation pipeline runner (v0.4).
 *
 * Three layers, each must pass before commit:
 *   1. Built-in validators — already run by individual dispatchers (v0.2)
 *   2. Per-action validators — typed payloads, host-supplied
 *   3. Master validator — catch-all, host-supplied
 *
 * Async hooks are deferred indefinitely (Q14).
 */

import type {
  CardAddedEvent,
  CardDuplicatedEvent,
  CardMovedEvent,
  CardRemovedEvent,
  CardRenamedEvent,
  FieldAddedEvent,
  FieldEditedEvent,
  FieldRemovedEvent,
  MetaAddedEvent,
  MetaChangedEvent,
  MetaRemovedEvent,
  PredefinedAddedEvent,
  PredefinedEditedEvent,
  PredefinedRemovedEvent,
  CardTreeJsonNode,
  CardTreeMasterValidator,
  CardTreeValidationError,
  CardTreeValidationResponse,
  CardTreeValidators,
  ValidationFailedEvent,
} from "../types";

/** All event payloads passed to per-action validators. */
export type AnyChangeEvent =
  | FieldEditedEvent
  | FieldAddedEvent
  | FieldRemovedEvent
  | CardAddedEvent
  | CardRemovedEvent
  | CardRenamedEvent
  | CardMovedEvent
  | CardDuplicatedEvent
  | PredefinedAddedEvent
  | PredefinedEditedEvent
  | PredefinedRemovedEvent
  | MetaChangedEvent
  | MetaAddedEvent
  | MetaRemovedEvent;

export type ValidatorKey = keyof CardTreeValidators;

/**
 * Run host-supplied validators (per-action + master) against the proposed event.
 * Returns ok or the first failing layer's errors.
 */
export function runHostValidators(
  validatorKey: ValidatorKey,
  event: AnyChangeEvent,
  actionType: string,
  cardId: string | undefined,
  tree: CardTreeJsonNode,
  validators: CardTreeValidators | undefined,
  master: CardTreeMasterValidator | undefined,
):
  | { ok: true }
  | {
      ok: false;
      errors: CardTreeValidationError[];
      layer: "per-action" | "master";
    } {
  // Per-action layer
  if (validators) {
    const fn = validators[validatorKey];
    if (fn) {
      const result = safeCall(() =>
        (fn as (e: AnyChangeEvent, t: CardTreeJsonNode) => CardTreeValidationResponse)(
          event,
          tree,
        ),
      );
      if (!result.ok) {
        return { ok: false, errors: result.errors, layer: "per-action" };
      }
    }
  }
  // Master layer
  if (master) {
    const result = safeCall(() => master({ type: actionType, cardId }, tree));
    if (!result.ok) {
      return { ok: false, errors: result.errors, layer: "master" };
    }
  }
  return { ok: true };
}

function safeCall(
  fn: () => CardTreeValidationResponse,
): CardTreeValidationResponse {
  try {
    const r = fn();
    if (!r || (r.ok !== true && r.ok !== false)) {
      return {
        ok: false,
        errors: [
          {
            code: "validator-bad-return",
            message: "Validator must return { ok: true } or { ok: false, errors: [...] }.",
          },
        ],
      };
    }
    return r;
  } catch (err) {
    return {
      ok: false,
      errors: [
        {
          code: "validator-error",
          message: err instanceof Error ? err.message : String(err),
        },
      ],
    };
  }
}

/** Build the typed event for `onValidationFailed` consumers. */
export function buildValidationFailedEvent(
  actionType: string,
  cardId: string | undefined,
  errors: CardTreeValidationError[],
  layer: "per-action" | "master",
): ValidationFailedEvent {
  return { action: actionType, cardId, errors, layer };
}
