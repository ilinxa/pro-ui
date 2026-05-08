import type { GraphSnapshot, ValidationError } from "../../types";
import {
  autoRegisterUnknownNodeTypes,
  deriveNodeGroupIds,
  validateSnapshot,
} from "../validate-snapshot";
import type { BootstrapResult } from "./source-types";

/**
 * Per plan §10.1 + §6.3: static snapshot mode bootstrap.
 *
 * Steps:
 *   1. Clone the snapshot (we mutate the clone in subsequent steps,
 *      never the host's input).
 *   2. Validate the snapshot per plan §6 — produces warnings AND errors.
 *      The validator emits AUTO_REGISTERED_NODE_TYPE warnings for
 *      system-origin nodes whose unknown nodeTypeId equals their
 *      systemRef.schemaType (decision #24 graceful degradation).
 *   3. Surface warnings regardless of outcome (hosts may want to see
 *      both warnings AND errors when both fire).
 *   4. If errors → reject (strict per §6.3).
 *   5. Apply auto-registration for the warned cases and derive
 *      `node.groupIds` from canonical `group.memberNodeIds`.
 *
 * Order matters: auto-register MUST run after validate. Running it
 * first would populate the validator's nodeTypeMap with the
 * to-be-registered entries, suppressing the warnings that surface the
 * graceful-degradation cases to the host.
 */
export function bootstrapSnapshotMode(
  input: GraphSnapshot,
  onWarning?: (warning: ValidationError) => void,
): BootstrapResult {
  const snapshot = cloneSnapshot(input);

  // Step 2 — validate the cloned snapshot as-supplied; auto-register
  // warnings fire here for system-origin nodes with schemaType-equals-
  // nodeTypeId unknown types.
  const result = validateSnapshot(snapshot);

  // Step 3 — surface warnings to the host even when errors also fire.
  for (const warning of result.warnings) {
    onWarning?.(warning);
  }

  if (!result.ok) {
    const first = result.errors[0];
    return {
      ok: false,
      error: first
        ? { code: first.code, message: first.message }
        : { code: "VALIDATION_FAILED", message: "Snapshot validation failed" },
    };
  }

  // Step 5 — apply auto-registration (idempotent; only adds the warned
  // cases since user-origin or schemaType-mismatch unknowns would have
  // errored in step 2). Then derive groupIds for nodes that left them
  // empty per plan §6.1 #9.
  autoRegisterUnknownNodeTypes(snapshot);
  deriveNodeGroupIds(snapshot);

  return { ok: true, snapshot };
}

function cloneSnapshot(snapshot: GraphSnapshot): GraphSnapshot {
  return {
    version: snapshot.version,
    nodes: snapshot.nodes.map((n) => ({ ...n, groupIds: [...n.groupIds] })),
    edges: snapshot.edges.map((e) => ({ ...e })),
    groups: snapshot.groups.map((g) => ({
      ...g,
      memberNodeIds: [...g.memberNodeIds],
    })),
    nodeTypes: snapshot.nodeTypes.map((nt) => ({ ...nt })),
    edgeTypes: snapshot.edgeTypes.map((et) => ({ ...et })),
    settings: { ...snapshot.settings, forces: { ...snapshot.settings.forces } },
  };
}
