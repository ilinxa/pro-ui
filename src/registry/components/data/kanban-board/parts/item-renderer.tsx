"use client";

import type { AnyKanbanCardRenderer, KanbanItem, KanbanRenderContext } from "../types";
import { MissingRendererFallback, warnMissingRenderer } from "./missing-renderer";

export function ItemRenderer({
  item,
  rendererMap,
  ctx,
}: {
  item: KanbanItem;
  rendererMap: Map<string, AnyKanbanCardRenderer>;
  ctx: KanbanRenderContext;
}) {
  const renderer = rendererMap.get(item.rendererId);
  if (!renderer) {
    warnMissingRenderer(item.rendererId);
    return <MissingRendererFallback rendererId={item.rendererId} />;
  }
  return <>{renderer.render(item.data, ctx)}</>;
}
