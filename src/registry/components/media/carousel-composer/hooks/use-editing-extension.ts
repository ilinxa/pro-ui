"use client";

import { useCallback, useEffect } from "react";
import type { CarouselComposerProps, CarouselEditingExtension } from "../types";
import { useWarnOnce } from "./use-warn-once";

/**
 * Editing injection seam. The base never imports the editing feature; a host
 * passes `editing={carouselEditing}` (from `features/editing`) or its own
 * `{ Panel }`. This hook resolves the prop and warns, once per instance, about
 * `editorProps` that nothing will receive.
 */
export function useEditingExtension(
  props: Pick<CarouselComposerProps, "editing" | "editorProps">,
): {
  editing: CarouselEditingExtension | undefined;
  /** Warns once that `openEditor` was called with no `editing` wired. */
  warnOpenWithoutEditing: (id: string) => void;
} {
  const { editing, editorProps } = props;
  const warnOnce = useWarnOnce();

  useEffect(() => {
    if (editing || editorProps === undefined) return;
    warnOnce(
      "editorProps-without-editing",
      "[CarouselComposer] `editorProps` was passed without `editing`, so it is ignored. Pass `editing={carouselEditing}` from the editing add-on.",
    );
  }, [editing, editorProps, warnOnce]);

  const warnOpenWithoutEditing = useCallback(
    (id: string) =>
      warnOnce(
        "openEditor-without-editing",
        `[CarouselComposer] openEditor("${id}") ignored: no \`editing\` extension is wired. Pass \`editing={carouselEditing}\` from the editing add-on.`,
      ),
    [warnOnce],
  );

  return { editing, warnOpenWithoutEditing };
}
