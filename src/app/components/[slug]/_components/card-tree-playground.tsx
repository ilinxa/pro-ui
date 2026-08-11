"use client";

import { CardTree } from "@/registry/components/data/card-tree";
import type { CardTreeJsonNode } from "@/registry/components/data/card-tree";
import {
  STARTER_CARD_TREE,
  validateCardTreeNode,
} from "../_lib/card-tree-schema";
import { JsonPlayground } from "./json-playground";

export function CardTreePlayground() {
  return (
    <JsonPlayground<CardTreeJsonNode>
      starter={STARTER_CARD_TREE}
      editorLabel="CardTreeJsonNode · JSON"
      validate={validateCardTreeNode}
      renderPreview={(card) => (
        // editable so the structural editor (add/edit/remove fields + subcards)
        // is exercised; the rendered tree IS the preview.
        <CardTree defaultValue={card} editable />
      )}
    />
  );
}
