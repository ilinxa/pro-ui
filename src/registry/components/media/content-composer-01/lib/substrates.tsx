"use client";

import type { SlotSubstrate, SlotSubstrateMap, FindSubstrate } from "../types";
import { JsonFormSubstrateMount } from "../parts/json-form-substrate";
import { BodySubstrateMount } from "../parts/body-substrate";
import { MediaSubstrateMount } from "../parts/media-substrate";

/**
 * The three default substrate records. Each maps a closed `SlotKind` to a
 * `render` function that mounts the real substrate procomp. The `render` bodies
 * are fleshed out across the substrate-layer chain:
 *
 *   - jsonFormSubstrate    → C6 (mounts <JsonForm> + hydration + custom field renderers)
 *   - articleBodySubstrate → C7 (lazy <ArticleBodyEditor> / eager <Textarea> per slotConfig.substrate)
 *   - mediaEditorSubstrate → C8 (mounts <MediaEditor01> + clampMediaSources)
 *
 * At C4 they are registered stubs so the registry + slot-mount machinery is in
 * place; each returns `null` until its mount lands. The records remain spreadable
 * + overridable via the `substrates` prop (defaults merge under consumer overrides).
 */

export const jsonFormSubstrate: SlotSubstrate<"metadataFields"> = {
  kind: "metadataFields",
  render: (args) => <JsonFormSubstrateMount {...args} />,
};

export const articleBodySubstrate: SlotSubstrate<"bodySlot"> = {
  kind: "bodySlot",
  render: (args) => <BodySubstrateMount {...args} />,
};

export const mediaEditorSubstrate: SlotSubstrate<"mediaSlot"> = {
  kind: "mediaSlot",
  render: (args) => <MediaSubstrateMount {...args} />,
};

export const DEFAULT_SUBSTRATES: SlotSubstrateMap = {
  metadataFields: jsonFormSubstrate,
  bodySlot: articleBodySubstrate,
  mediaSlot: mediaEditorSubstrate,
};

/**
 * Keyed-MAP object-index lookup (analogous to kanban's `findRenderer`, but a
 * Partial<Record<…>> index — NOT an array `.find()`). There are exactly three
 * closed slot-kinds, so this is O(1) and compile-time prop-flow-safe.
 */
export const findSubstrate: FindSubstrate = (substrates, key) => substrates[key];
