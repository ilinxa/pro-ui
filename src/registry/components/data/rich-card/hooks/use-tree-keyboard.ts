import { useCallback, type Dispatch, type KeyboardEvent } from "react";
import type {
  RichCardAction,
  RichCardState,
} from "../lib/reducer";
import { findCard, findParentId } from "../lib/reducer";
import { useTreeFocus } from "./use-tree-focus";
import type { EditMode } from "./use-edit-mode";

/**
 * Returns an `onKeyDown` handler for the tree root.
 *
 * Keyboard contract (per plan §11):
 *   - ↑ / ↓        prev / next visible card
 *   - →            collapsed → expand; expanded with kids → focus first child
 *   - ←            expanded → collapse; collapsed/leaf → focus parent
 *   - Home / End   first / last visible
 *   - Enter / Space toggle collapse on focused card
 */
export function useTreeKeyboard(
  state: RichCardState,
  dispatch: Dispatch<RichCardAction>,
  editMode: EditMode | null,
) {
  const focus = useTreeFocus(state);

  const focusId = useCallback(
    (id: string | null, root: HTMLElement | null) => {
      if (!id) return;
      dispatch({ type: "set-focus", id });
      // After state commit, move DOM focus.
      requestAnimationFrame(() => {
        const el = root?.querySelector<HTMLElement>(`[data-rcid="${id}"]`);
        el?.focus();
      });
    },
    [dispatch],
  );

  return useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      // When an editor is active, don't process tree-keyboard nav — keystrokes
      // belong to the active input.
      if (editMode) return;
      const root = event.currentTarget;
      const focused = state.focusedId;

      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          focusId(focus.next(focused), root);
          return;
        }
        case "ArrowUp": {
          event.preventDefault();
          focusId(focus.prev(focused), root);
          return;
        }
        case "Home": {
          event.preventDefault();
          focusId(focus.first, root);
          return;
        }
        case "End": {
          event.preventDefault();
          focusId(focus.last, root);
          return;
        }
        case "ArrowRight": {
          if (!focused) return;
          event.preventDefault();
          const card = findCard(state.tree, focused);
          if (!card) return;
          const isCollapsed = state.collapsed.has(focused);
          const hasChildren = card.children.length > 0;
          const hasBody =
            card.fields.length > 0 || card.predefined.length > 0;
          const canCollapse = hasBody || hasChildren;
          if (canCollapse && isCollapsed) {
            // Expand body and/or children.
            dispatch({ type: "toggle-collapse", id: focused });
          } else if (hasChildren && !isCollapsed) {
            // Already expanded with children — descend.
            focusId(card.children[0]?.id ?? null, root);
          }
          return;
        }
        case "ArrowLeft": {
          if (!focused) return;
          event.preventDefault();
          const card = findCard(state.tree, focused);
          if (!card) return;
          const isCollapsed = state.collapsed.has(focused);
          const hasChildren = card.children.length > 0;
          const hasBody =
            card.fields.length > 0 || card.predefined.length > 0;
          const canCollapse = hasBody || hasChildren;
          if (canCollapse && !isCollapsed) {
            // Expanded — collapse it (body + children).
            dispatch({ type: "toggle-collapse", id: focused });
          } else {
            // Collapsed or empty — ascend.
            const parentId = findParentId(state.tree, focused);
            if (parentId) focusId(parentId, root);
          }
          return;
        }
        case "Enter":
        case " ": {
          if (!focused) return;
          const card = findCard(state.tree, focused);
          if (!card) return;
          const canCollapse =
            card.fields.length > 0 ||
            card.predefined.length > 0 ||
            card.children.length > 0;
          if (canCollapse) {
            event.preventDefault();
            dispatch({ type: "toggle-collapse", id: focused });
          }
          return;
        }
      }
    },
    [state.focusedId, state.tree, state.collapsed, dispatch, focus, focusId, editMode],
  );
}
