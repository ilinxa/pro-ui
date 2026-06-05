"use client";

import { RichCard } from "@/registry/components/data/rich-card";
import type { RichCardJsonNode } from "@/registry/components/data/rich-card";
import {
  STARTER_RICH_CARD,
  validateRichCardNode,
} from "../_lib/rich-card-schema";
import { JsonPlayground } from "./json-playground";

export function RichCardPlayground() {
  return (
    <JsonPlayground<RichCardJsonNode>
      starter={STARTER_RICH_CARD}
      editorLabel="RichCardJsonNode · JSON"
      validate={validateRichCardNode}
      renderPreview={(card) => (
        // editable so the structural editor (add/edit/remove fields + subcards)
        // is exercised; the rendered tree IS the preview.
        <RichCard defaultValue={card} editable />
      )}
    />
  );
}
