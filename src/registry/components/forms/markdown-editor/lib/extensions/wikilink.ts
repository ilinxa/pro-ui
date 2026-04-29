import { StateEffect, StateField, type Extension } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";
import { isImageEmbed, makeWikilinkRegex } from "../wikilink-grammar";
import type { WikilinkCandidate } from "../../types";

// Effect to update candidates at runtime (validate-pass refinement #2 — Q-P5 lock).
export const setCandidatesEffect = StateEffect.define<Map<string, WikilinkCandidate>>();

// StateField holding the current candidates Map (lowercased+trimmed labels → candidate).
export const candidatesField = StateField.define<Map<string, WikilinkCandidate>>({
  create: () => new Map(),
  update: (value, tr) => {
    for (const effect of tr.effects) {
      if (effect.is(setCandidatesEffect)) return effect.value;
    }
    return value;
  },
});

export function buildCandidatesMap(
  candidates: ReadonlyArray<WikilinkCandidate>,
): Map<string, WikilinkCandidate> {
  return new Map(candidates.map((c) => [c.label.toLowerCase().trim(), c]));
}

// ViewPlugin: reads candidates from field; rebuilds decorations on doc OR field change.
const wikilinkPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    matcher: MatchDecorator;

    constructor(view: EditorView) {
      this.matcher = new MatchDecorator({
        regexp: makeWikilinkRegex(),
        decoration: (match, view, pos) => {
          const text = view.state.doc.toString();
          if (isImageEmbed(text, pos)) return null;
          const label = match[1].trim();
          const candidates = view.state.field(candidatesField, false) ?? new Map();
          // candidates may be empty when host doesn't supply wikilinkCandidates;
          // treat all as broken in that case (visible signal that nothing resolves).
          const resolved = candidates.size > 0 && candidates.has(label.toLowerCase());
          return Decoration.mark({
            class: resolved ? "cm-wikilink" : "cm-wikilink cm-wikilink-broken",
          });
        },
      });
      this.decorations = this.matcher.createDeco(view);
    }

    update(update: ViewUpdate) {
      const oldCandidates = update.startState.field(candidatesField, false);
      const newCandidates = update.state.field(candidatesField, false);
      const candidatesChanged = oldCandidates !== newCandidates;
      if (update.docChanged || candidatesChanged) {
        this.decorations = candidatesChanged
          ? this.matcher.createDeco(update.view)
          : this.matcher.updateDeco(update, this.decorations);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

export const wikilinkExtension: readonly Extension[] = [candidatesField, wikilinkPlugin];
