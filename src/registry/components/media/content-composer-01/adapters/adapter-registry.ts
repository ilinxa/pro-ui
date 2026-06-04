import type {
  AdapterRegistry,
  ContentCardItem,
  ContentTypeAdapter,
} from "../types";

/**
 * Runtime adapter registry keyed by `config.adapterId`. Each content-type config
 * module contributes its adapter pair here (the news adapter lands in C12). The
 * shell resolves `getAdapter(config.adapterId)` to map the draft ↔ the backend
 * item at the lifecycle exits.
 */
export const ADAPTER_REGISTRY: AdapterRegistry = {};

export function getAdapter(
  adapterId: string,
): ContentTypeAdapter<ContentCardItem> | undefined {
  return ADAPTER_REGISTRY[adapterId];
}
