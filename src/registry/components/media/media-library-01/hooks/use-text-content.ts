import { useEffect, useState } from "react";
import type { MediaNode } from "../types";

export interface TextContentState {
  text: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches text for a text-based file (code/json/txt/markdown). Default path is
 * `fetch(node.url).text()`; a `resolve` override handles auth / signed URLs /
 * transforms. Aborts on node change or unmount.
 */
export function useTextContent(
  node: MediaNode | null,
  enabled: boolean,
  resolve?: (node: MediaNode) => Promise<string>,
): TextContentState {
  const [state, setState] = useState<TextContentState>({
    text: null,
    loading: false,
    error: null,
  });

  // Identity-stable cache keys so an unchanged node doesn't refetch on re-render.
  const nodeId = node?.id ?? null;
  const url = node?.url ?? null;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    // All setState calls happen after this microtask yield, so none run
    // synchronously within the effect (avoids cascading-render lint + flashes).
    const run = async () => {
      await Promise.resolve();
      if (cancelled) return;
      if (!enabled || !node) {
        setState({ text: null, loading: false, error: null });
        return;
      }
      setState({ text: null, loading: true, error: null });
      try {
        let text: string;
        if (resolve) {
          text = await resolve(node);
        } else {
          if (!node.url) throw new Error("No URL to fetch");
          const res = await fetch(node.url, { signal: controller.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          text = await res.text();
        }
        if (!cancelled) setState({ text, loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        if ((err as Error).name === "AbortError") return;
        setState({
          text: null,
          loading: false,
          error: (err as Error).message || "Failed to load",
        });
      }
    };

    void run();
    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, url, enabled, resolve]);

  return state;
}
