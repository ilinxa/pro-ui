"use client";

import type { Blackboard01Props } from "./types";
import { BlackboardRoot } from "./parts/blackboard-root";
import { BlackboardSurface } from "./parts/blackboard-surface";
import { BlackboardNotificationBadge } from "./parts/blackboard-notification-badge";
import { BlackboardBackgroundEditor } from "./parts/blackboard-background-editor";
import { BlackboardPinnedRow } from "./parts/blackboard-pinned-row";
import { BlackboardNoteStream } from "./parts/blackboard-note-stream";
import { BlackboardComposer } from "./parts/blackboard-composer";

/**
 * Batteries-included blackboard. Pure composition over `BlackboardRoot` + the flat
 * parts, gated by `show*` toggles — contains no logic the parts don't, so any
 * hand-assembled subset behaves identically. For a lighter build, compose the
 * parts directly and drop what you don't need (e.g. omit `BlackboardComposer`).
 */
export function Blackboard01(props: Blackboard01Props) {
  const {
    showComposer,
    showNotificationBadge = true,
    showBackgroundEditor,
    showPinnedRow = true,
    ...rootProps
  } = props;

  const composerVisible = showComposer ?? !!rootProps.onPostNote;
  const bgEditorVisible = showBackgroundEditor ?? !!rootProps.editableBackground;

  return (
    <BlackboardRoot {...rootProps}>
      <BlackboardSurface>
        {showNotificationBadge ? <BlackboardNotificationBadge /> : null}
        {bgEditorVisible ? <BlackboardBackgroundEditor /> : null}
        {showPinnedRow ? <BlackboardPinnedRow /> : null}
        <BlackboardNoteStream />
        {composerVisible ? <BlackboardComposer /> : null}
      </BlackboardSurface>
    </BlackboardRoot>
  );
}
