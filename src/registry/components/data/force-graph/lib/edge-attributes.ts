import type {
  Edge,
  EdgeType,
  Group,
  Node,
  ResolvedTheme,
} from "../types";

/**
 * Per system decision #38 (2026-04-29): visual differentiation between
 * "soft" and "default" edges via per-edge `color` + `size` attributes,
 * computed once at edge-add time and re-applied on theme/edgetype/schema
 * change via the existing `graphVersion` bump pathway.
 *
 * Soft-edge predicate (preserved verbatim from superseded decision #1):
 *   - At least one endpoint is a node of `kind === "doc"`, OR
 *   - No doc-node endpoint AND `edgeType.softVisual === true`
 *
 * Group endpoints do NOT transit doc-ness — group↔group edges follow the
 * per-edgetype `softVisual` flag regardless of any doc node elsewhere in
 * the graph.
 */

export interface EdgeAttributes {
  color: string;
  size: number;
  type: "rectangle" | "arrow";
}

interface ResolveContext {
  nodes: ReadonlyMap<string, Node>;
  groups: ReadonlyMap<string, Group>;
  edgeTypes: ReadonlyMap<string, EdgeType>;
  theme: ResolvedTheme;
}

export function softEdgeAttributes(
  edge: Edge,
  ctx: ResolveContext,
): EdgeAttributes {
  const sourceIsDoc = endpointIsDocNode(edge.source, ctx);
  const targetIsDoc = endpointIsDocNode(edge.target, ctx);
  const isDocInvolved = sourceIsDoc || targetIsDoc;

  const edgeType = ctx.edgeTypes.get(edge.edgeTypeId);
  const isPerTypeSoft =
    !isDocInvolved && edgeType?.softVisual === true;
  const isSoft = isDocInvolved || isPerTypeSoft;

  // Direction → which Sigma program renders this edge.
  // - undirected: stock EdgeRectangleProgram (no arrow)
  // - directed/reverse/bidirectional: EdgeArrowProgram (reverse via
  //   source/target swap at edge-add time; bidirectional renders single
  //   arrow in v0.1, dual-arrow deferred to v0.6 per #38)
  const type: "rectangle" | "arrow" =
    edge.direction === "undirected" ? "rectangle" : "arrow";

  if (isSoft) {
    return { color: ctx.theme.edgeMuted, size: 1, type };
  }

  return {
    color: edgeType?.color ?? ctx.theme.edgeDefault,
    size: 1.5,
    type,
  };
}

function endpointIsDocNode(
  endpoint: { kind: "node" | "group"; id: string },
  ctx: ResolveContext,
): boolean {
  if (endpoint.kind !== "node") return false;
  const node = ctx.nodes.get(endpoint.id);
  return node?.kind === "doc";
}
