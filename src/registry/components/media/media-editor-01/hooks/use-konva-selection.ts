"use client";

import { useCallback, useRef, useState } from "react";
import type Konva from "konva";

export type SelectableKind = "text" | "sticker" | "drawing";

export interface SelectedItem {
  kind: SelectableKind;
  id: string;
}

export interface UseKonvaSelectionResult {
  selected: SelectedItem | null;
  transformerRef: React.MutableRefObject<Konva.Transformer | null>;
  /** Select an overlay item and attach the transformer to its node. */
  select: (item: SelectedItem | null, node: Konva.Node | null) => void;
  /** Clear selection (Esc / click on background / draft replaced). */
  clear: () => void;
}

/**
 * Konva.Transformer attach/detach helper.
 *
 * C6 lands the hook surface only — there are no selectable items yet
 * (text/stickers/drawing land C8/C9/C10). Each tool wires its node into
 * `select(item, node)`; the hook calls Transformer.nodes([node]).
 */
export function useKonvaSelection(): UseKonvaSelectionResult {
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);

  const select = useCallback(
    (item: SelectedItem | null, node: Konva.Node | null) => {
      setSelected(item);
      const t = transformerRef.current;
      if (!t) return;
      if (item && node) {
        t.nodes([node]);
        t.getLayer()?.batchDraw();
      } else {
        t.nodes([]);
        t.getLayer()?.batchDraw();
      }
    },
    [],
  );

  const clear = useCallback(() => {
    select(null, null);
  }, [select]);

  return { selected, transformerRef, select, clear };
}
