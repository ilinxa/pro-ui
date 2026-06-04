import type {
  AdapterRegistry,
  ContentCardItem,
  ContentTypeAdapter,
} from "../types";
import { newsContentItemAdapter } from "../configs/news-composer.config";

/**
 * Runtime adapter registry keyed by `config.adapterId`. Each content-type config
 * module contributes its adapter pair here. The shell resolves
 * `getAdapter(config.adapterId)` to map the draft ↔ the backend item at the
 * lifecycle exits.
 */
export const ADAPTER_REGISTRY: AdapterRegistry = {
  "news-content-item": newsContentItemAdapter,
};

export function getAdapter(
  adapterId: string,
): ContentTypeAdapter<ContentCardItem> | undefined {
  return ADAPTER_REGISTRY[adapterId];
}
