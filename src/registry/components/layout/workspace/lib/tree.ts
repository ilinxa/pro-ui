import type {
  AreaTree,
  AreaTreeLeaf,
  AreaTreeSplit,
  SplitOrientation,
} from "../types";
import { clampRatio } from "./geometry";
import type { LeafRect, Rect, SplitDividerRect } from "./geometry";

export function findLeaf(
  tree: AreaTree,
  areaId: string,
  path: number[] = [],
): { node: AreaTreeLeaf; path: number[] } | null {
  if (tree.kind === "leaf") {
    return tree.id === areaId ? { node: tree, path } : null;
  }
  return (
    findLeaf(tree.a, areaId, [...path, 0]) ??
    findLeaf(tree.b, areaId, [...path, 1])
  );
}

export function getNodeAtPath(tree: AreaTree, path: number[]): AreaTree {
  let node: AreaTree = tree;
  for (const step of path) {
    if (node.kind !== "split") {
      throw new Error(`Invalid path: encountered leaf before path end`);
    }
    node = step === 0 ? node.a : node.b;
  }
  return node;
}

export function replaceNodeAtPath(
  tree: AreaTree,
  path: number[],
  next: AreaTree,
): AreaTree {
  if (path.length === 0) return next;
  if (tree.kind !== "split") {
    throw new Error(`Cannot descend into a leaf`);
  }
  const [head, ...rest] = path;
  if (head === 0) {
    return { ...tree, a: replaceNodeAtPath(tree.a, rest, next) };
  }
  return { ...tree, b: replaceNodeAtPath(tree.b, rest, next) };
}

export function splitLeaf(
  tree: AreaTree,
  areaId: string,
  orientation: SplitOrientation,
  newAreaId: string,
): AreaTree {
  const found = findLeaf(tree, areaId);
  if (!found) return tree;
  const { node, path } = found;
  const split: AreaTreeSplit = {
    kind: "split",
    orientation,
    ratio: 0.5,
    a: node,
    b: { kind: "leaf", id: newAreaId, componentId: node.componentId },
  };
  return replaceNodeAtPath(tree, path, split);
}

export function mergeAreas(
  tree: AreaTree,
  survivorId: string,
  absorbedId: string,
): AreaTree {
  const survivor = findLeaf(tree, survivorId);
  const absorbed = findLeaf(tree, absorbedId);
  if (!survivor || !absorbed) return tree;
  if (survivor.path.length === 0 || absorbed.path.length === 0) return tree;
  const survivorParent = survivor.path.slice(0, -1);
  const absorbedParent = absorbed.path.slice(0, -1);
  if (
    survivorParent.length !== absorbedParent.length ||
    !survivorParent.every((step, i) => step === absorbedParent[i])
  ) {
    return tree;
  }
  return replaceNodeAtPath(tree, survivorParent, survivor.node);
}

export function resizeSplit(
  tree: AreaTree,
  splitPath: number[],
  ratio: number,
): AreaTree {
  const node = getNodeAtPath(tree, splitPath);
  if (node.kind !== "split") return tree;
  return replaceNodeAtPath(tree, splitPath, { ...node, ratio });
}

export function swapComponent(
  tree: AreaTree,
  areaId: string,
  componentId: string,
): AreaTree {
  const found = findLeaf(tree, areaId);
  if (!found) return tree;
  return replaceNodeAtPath(tree, found.path, {
    ...found.node,
    componentId,
  });
}

export function treeDepth(tree: AreaTree): number {
  if (tree.kind === "leaf") return 0;
  return 1 + Math.max(treeDepth(tree.a), treeDepth(tree.b));
}

export function flattenLeavesInOrder(tree: AreaTree): AreaTreeLeaf[] {
  if (tree.kind === "leaf") return [tree];
  return [...flattenLeavesInOrder(tree.a), ...flattenLeavesInOrder(tree.b)];
}

export function flattenSubtreesPastDepth(
  tree: AreaTree,
  cap: number,
  currentDepth = 0,
): AreaTree {
  if (tree.kind === "leaf") return tree;
  if (currentDepth >= cap) {
    return collapseToFirstLeaf(tree);
  }
  return {
    ...tree,
    a: flattenSubtreesPastDepth(tree.a, cap, currentDepth + 1),
    b: flattenSubtreesPastDepth(tree.b, cap, currentDepth + 1),
  };
}

function collapseToFirstLeaf(tree: AreaTree): AreaTreeLeaf {
  if (tree.kind === "leaf") return tree;
  return collapseToFirstLeaf(tree.a);
}

export function validateTree(
  tree: AreaTree,
  registeredComponentIds: string[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const registered = new Set(registeredComponentIds);

  function walk(node: AreaTree) {
    if (node.kind === "leaf") {
      if (seenIds.has(node.id)) {
        errors.push(`Duplicate area id: "${node.id}"`);
      }
      seenIds.add(node.id);
      if (!registered.has(node.componentId)) {
        errors.push(
          `Leaf "${node.id}" references unregistered component "${node.componentId}"`,
        );
      }
    } else {
      if (node.ratio <= 0 || node.ratio >= 1) {
        errors.push(`Split ratio ${node.ratio} out of range (0, 1)`);
      }
      walk(node.a);
      walk(node.b);
    }
  }

  walk(tree);
  return { valid: errors.length === 0, errors };
}

type LayoutResult = {
  leaves: LeafRect[];
  dividers: SplitDividerRect[];
};

export function computeLayout(
  tree: AreaTree,
  bounds: Rect,
  options?: { minSize?: { width: number; height: number } },
): LayoutResult {
  const minW = options?.minSize?.width ?? 0;
  const minH = options?.minSize?.height ?? 0;
  const leaves: LeafRect[] = [];
  const dividers: SplitDividerRect[] = [];

  function walk(node: AreaTree, rect: Rect, depth: number, path: number[]) {
    if (node.kind === "leaf") {
      leaves.push({
        areaId: node.id,
        componentId: node.componentId,
        depth,
        ...rect,
      });
      return;
    }
    if (node.orientation === "vertical") {
      const total = rect.width;
      const r = clampRatio(node.ratio, total, minW, minW);
      const aWidth = total * r;
      const bWidth = total - aWidth;
      walk(
        node.a,
        { x: rect.x, y: rect.y, width: aWidth, height: rect.height },
        depth + 1,
        [...path, 0],
      );
      walk(
        node.b,
        {
          x: rect.x + aWidth,
          y: rect.y,
          width: bWidth,
          height: rect.height,
        },
        depth + 1,
        [...path, 1],
      );
      dividers.push({
        splitPath: path,
        orientation: "vertical",
        x: rect.x + aWidth,
        y: rect.y,
        length: rect.height,
      });
    } else {
      const total = rect.height;
      const r = clampRatio(node.ratio, total, minH, minH);
      const aHeight = total * r;
      const bHeight = total - aHeight;
      walk(
        node.a,
        { x: rect.x, y: rect.y, width: rect.width, height: aHeight },
        depth + 1,
        [...path, 0],
      );
      walk(
        node.b,
        {
          x: rect.x,
          y: rect.y + aHeight,
          width: rect.width,
          height: bHeight,
        },
        depth + 1,
        [...path, 1],
      );
      dividers.push({
        splitPath: path,
        orientation: "horizontal",
        x: rect.x,
        y: rect.y + aHeight,
        length: rect.width,
      });
    }
  }

  walk(tree, bounds, 0, []);
  return { leaves, dividers };
}
