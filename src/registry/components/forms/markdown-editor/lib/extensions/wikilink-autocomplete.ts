import {
  type CompletionContext,
  type CompletionResult,
  type CompletionSource,
  closeCompletion,
} from "@codemirror/autocomplete";
import type { EditorView } from "@codemirror/view";
import type { RefObject } from "react";
import { candidatesField } from "./wikilink";
import type { KindMeta, WikilinkCandidate } from "../../types";

// Cap visible results to 50 (Q-P3 lock); overflow gets a sentinel "+ N more (refine search)" row.
const RESULT_CAP = 50;

function filterCandidates(
  candidates: ReadonlyArray<WikilinkCandidate>,
  query: string,
): WikilinkCandidate[] {
  if (!query) return candidates.slice();
  const needle = query.toLowerCase();
  return candidates.filter((c) => c.label.toLowerCase().includes(needle));
}

function renderInfoPanel(
  candidate: WikilinkCandidate,
  kinds: Record<string, KindMeta> | undefined,
): HTMLElement {
  const root = document.createElement("div");
  root.className = "markdown-editor-completion-info";
  root.style.display = "flex";
  root.style.flexDirection = "column";
  root.style.gap = "4px";

  if (candidate.kind && kinds?.[candidate.kind]) {
    const meta = kinds[candidate.kind];
    const badge = document.createElement("span");
    badge.textContent = meta.label;
    badge.style.alignSelf = "flex-start";
    badge.style.fontSize = "0.6875rem";
    badge.style.fontWeight = "600";
    badge.style.padding = "1px 6px";
    badge.style.borderRadius = "999px";
    badge.style.color = meta.color ?? "var(--foreground)";
    badge.style.backgroundColor = meta.color
      ? `color-mix(in oklch, ${meta.color} 14%, transparent)`
      : "var(--muted)";
    badge.style.border = `1px solid ${meta.color ?? "var(--border)"}`;
    root.appendChild(badge);
  }

  const label = document.createElement("div");
  label.textContent = candidate.label;
  label.style.fontWeight = "500";
  root.appendChild(label);

  if (candidate.alias) {
    const alias = document.createElement("div");
    alias.textContent = `alias: ${candidate.alias}`;
    alias.style.fontSize = "0.75rem";
    alias.style.color = "var(--muted-foreground)";
    root.appendChild(alias);
  }

  return root;
}

// Factory: returns a completion source closed over a kindsRef (read lazily so kinds prop
// updates flow through without reconfiguring the autocomplete extension).
export function createWikilinkCompletionSource(
  kindsRef: RefObject<Record<string, KindMeta> | undefined>,
): CompletionSource {
  return (context: CompletionContext): CompletionResult | null => {
    // Trigger: caret is somewhere inside an open wikilink token (anchored, NOT global).
    const before = context.matchBefore(/\[\[([^[\]\n|]*)$/);
    if (!before) return null;
    if (before.from === before.to && !context.explicit) return null;

    const query = before.text.slice(2);
    const candidatesMap = context.state.field(candidatesField, false);
    if (!candidatesMap) return null;

    const candidates = Array.from(candidatesMap.values());
    const filtered = filterCandidates(candidates, query);
    const capped = filtered.slice(0, RESULT_CAP);
    const overflow = filtered.length > RESULT_CAP ? filtered.length - RESULT_CAP : 0;

    return {
      from: before.from + 2,
      to: context.pos,
      options: [
        ...capped.map((c) => ({
          label: c.label,
          apply: (view: EditorView, _completion: unknown, from: number, to: number) => {
            const insert = c.alias ? `${c.label}|${c.alias}` : c.label;
            view.dispatch({
              changes: { from, to, insert: `${insert}]]` },
              selection: { anchor: from + insert.length + 2 },
            });
          },
          info: () => renderInfoPanel(c, kindsRef.current),
        })),
        ...(overflow > 0
          ? [
              {
                label: `…and ${overflow} more (refine search)`,
                apply: (view: EditorView) => closeCompletion(view),
                type: "text" as const,
                boost: -100,
              },
            ]
          : []),
      ],
      validFor: /^[^[\]\n|]*$/,
    };
  };
}
