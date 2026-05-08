import type {
  GraphSnapshot,
  Node,
  NodeType,
  ValidationError,
  ValidationResult,
} from "../types";

/**
 * Validates a snapshot per plan §6 + system decisions #2, #5, #17, #24.
 *
 * Strict checks reject the snapshot. Graceful-degradation cases (per #24:
 * unknown system schemaType) auto-register a neutral default NodeType and
 * surface a warning — they don't reject.
 */
export function validateSnapshot(snapshot: GraphSnapshot): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // 1. Schema version
  if (snapshot.version !== "1.0") {
    errors.push({
      code: "VERSION_MISMATCH",
      message: `Expected snapshot version "1.0", got "${snapshot.version}"`,
      got: snapshot.version,
      expected: "1.0",
    });
    return { ok: false, errors, warnings };
  }

  // 2. ID uniqueness within nodes
  const nodeIds = new Set<string>();
  for (const node of snapshot.nodes) {
    if (nodeIds.has(node.id)) {
      errors.push({
        code: "DUPLICATE_NODE_ID",
        message: `Duplicate node id: ${node.id}`,
        id: node.id,
      });
    }
    nodeIds.add(node.id);
  }

  // 3. ID uniqueness within groups
  const groupIds = new Set<string>();
  for (const group of snapshot.groups) {
    if (groupIds.has(group.id)) {
      errors.push({
        code: "DUPLICATE_GROUP_ID",
        message: `Duplicate group id: ${group.id}`,
        id: group.id,
      });
    }
    groupIds.add(group.id);
  }

  // 4. ID disjointness across nodes + groups
  for (const id of nodeIds) {
    if (groupIds.has(id)) {
      errors.push({
        code: "ID_NAMESPACE_COLLISION",
        message: `Id "${id}" used by both a node and a group`,
        id,
      });
    }
  }

  // Build type maps for resolution checks
  const nodeTypeMap = new Map<string, NodeType>(
    snapshot.nodeTypes.map((nt) => [nt.id, nt]),
  );
  const edgeTypeMap = new Map<string, { id: string }>(
    snapshot.edgeTypes.map((et) => [et.id, et]),
  );

  // 5. NodeType reference resolution + graceful degradation per #24
  for (const node of snapshot.nodes) {
    if (node.kind === "doc") continue; // doc nodes don't carry nodeTypeId
    const normalNode = node as Extract<Node, { kind: "normal" }>;

    if (!nodeTypeMap.has(normalNode.nodeTypeId)) {
      // Per #24: graceful degradation only for system nodes with unknown
      // schemaType. User nodes referencing missing nodeTypeId is a strict
      // bug.
      if (
        normalNode.origin === "system" &&
        normalNode.systemRef?.schemaType === normalNode.nodeTypeId
      ) {
        warnings.push({
          code: "AUTO_REGISTERED_NODE_TYPE",
          message: `Auto-registered neutral NodeType for unknown schemaType "${normalNode.nodeTypeId}" on system node ${normalNode.id}`,
          nodeTypeId: normalNode.nodeTypeId,
        });
      } else {
        errors.push({
          code: "UNKNOWN_NODE_TYPE",
          message: `Node ${normalNode.id} references unknown nodeTypeId "${normalNode.nodeTypeId}"`,
          nodeId: normalNode.id,
          nodeTypeId: normalNode.nodeTypeId,
        });
      }
    }
  }

  // 6 + 7 + 8. Edge resolution + dangling endpoints + self-loops
  for (const edge of snapshot.edges) {
    if (!edgeTypeMap.has(edge.edgeTypeId)) {
      errors.push({
        code: "UNKNOWN_EDGE_TYPE",
        message: `Edge ${edge.id} references unknown edgeTypeId "${edge.edgeTypeId}"`,
        edgeId: edge.id,
        edgeTypeId: edge.edgeTypeId,
      });
    }

    if (!endpointResolves(edge.source, nodeIds, groupIds)) {
      errors.push({
        code: "DANGLING_EDGE_ENDPOINT",
        message: `Edge ${edge.id} source endpoint does not resolve: ${edge.source.kind}/${edge.source.id}`,
        edgeId: edge.id,
        endpoint: "source",
        ref: edge.source,
      });
    }
    if (!endpointResolves(edge.target, nodeIds, groupIds)) {
      errors.push({
        code: "DANGLING_EDGE_ENDPOINT",
        message: `Edge ${edge.id} target endpoint does not resolve: ${edge.target.kind}/${edge.target.id}`,
        edgeId: edge.id,
        endpoint: "target",
        ref: edge.target,
      });
    }

    if (
      edge.source.kind === edge.target.kind &&
      edge.source.id === edge.target.id
    ) {
      errors.push({
        code: "SELF_LOOP",
        message: `Edge ${edge.id} is a self-loop (source equals target)`,
        edgeId: edge.id,
      });
    }
  }

  // 9. memberNodeIds ↔ groupIds agreement per #2
  const nodeMap = new Map<string, Node>(snapshot.nodes.map((n) => [n.id, n]));
  for (const group of snapshot.groups) {
    for (const memberId of group.memberNodeIds) {
      const node = nodeMap.get(memberId);
      if (!node) {
        errors.push({
          code: "MEMBERSHIP_DISAGREEMENT",
          message: `Group ${group.id} memberNodeIds references missing node ${memberId}`,
          groupId: group.id,
          nodeId: memberId,
        });
        continue;
      }
      // Either node.groupIds is empty (we'll derive from canonical) or
      // it must agree with memberNodeIds.
      const nodeGroups = node.groupIds ?? [];
      if (nodeGroups.length > 0 && !nodeGroups.includes(group.id)) {
        errors.push({
          code: "MEMBERSHIP_DISAGREEMENT",
          message: `Group ${group.id} memberNodeIds includes ${memberId}, but node.groupIds disagrees`,
          groupId: group.id,
          nodeId: memberId,
        });
      }
    }
  }

  // 10. Origin field present (mandatory per #17)
  for (const node of snapshot.nodes) {
    if (node.origin !== "system" && node.origin !== "user") {
      errors.push({
        code: "MISSING_ORIGIN",
        message: `Node ${node.id} missing or invalid origin field`,
        entityKind: "node",
        entityId: node.id,
      });
    }
  }
  for (const edge of snapshot.edges) {
    if (edge.origin !== "system" && edge.origin !== "user") {
      errors.push({
        code: "MISSING_ORIGIN",
        message: `Edge ${edge.id} missing or invalid origin field`,
        entityKind: "edge",
        entityId: edge.id,
      });
    }
  }

  // 11. systemRef well-formed when origin === "system"
  for (const node of snapshot.nodes) {
    if (node.origin === "system") {
      const ref = node.systemRef;
      if (!ref || typeof ref.source !== "string" || typeof ref.sourceId !== "string") {
        errors.push({
          code: "MISSING_SYSTEM_REF",
          message: `System-origin node ${node.id} missing well-formed systemRef`,
          nodeId: node.id,
        });
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

function endpointResolves(
  endpoint: { kind: "node" | "group"; id: string },
  nodeIds: ReadonlySet<string>,
  groupIds: ReadonlySet<string>,
): boolean {
  return endpoint.kind === "node"
    ? nodeIds.has(endpoint.id)
    : groupIds.has(endpoint.id);
}

/**
 * Per plan §6.1 #9: derive `node.groupIds` from canonical
 * `group.memberNodeIds` when the snapshot supplies only the latter.
 *
 * Mutates the input snapshot in place. Idempotent — running twice yields
 * the same result.
 */
export function deriveNodeGroupIds(snapshot: GraphSnapshot): void {
  const groupsByMember = new Map<string, string[]>();
  for (const group of snapshot.groups) {
    for (const memberId of group.memberNodeIds) {
      const list = groupsByMember.get(memberId) ?? [];
      if (!list.includes(group.id)) list.push(group.id);
      groupsByMember.set(memberId, list);
    }
  }

  for (const node of snapshot.nodes) {
    const derived = groupsByMember.get(node.id) ?? [];
    if (!node.groupIds || node.groupIds.length === 0) {
      node.groupIds = derived;
    }
  }
}

/**
 * Auto-register a neutral default NodeType for system-origin schema types
 * not present in `snapshot.nodeTypes`. Per decision #24 graceful
 * degradation. Mutates the snapshot.
 */
export function autoRegisterUnknownNodeTypes(snapshot: GraphSnapshot): void {
  const known = new Set(snapshot.nodeTypes.map((nt) => nt.id));
  for (const node of snapshot.nodes) {
    if (node.kind === "doc") continue;
    const normalNode = node as Extract<Node, { kind: "normal" }>;
    if (
      normalNode.origin === "system" &&
      !known.has(normalNode.nodeTypeId)
    ) {
      snapshot.nodeTypes.push({
        id: normalNode.nodeTypeId,
        name: normalNode.nodeTypeId,
        color: "var(--muted-foreground)",
        description: `Auto-registered for unknown system schemaType`,
      });
      known.add(normalNode.nodeTypeId);
    }
  }
}

// Internal type guards (re-exported only for tests when Vitest lands)
export const _internal = {
  endpointResolves,
};
