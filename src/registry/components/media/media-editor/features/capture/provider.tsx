"use client";

import * as React from "react";
import { MediaCaptureExtensionContext } from "../../hooks/use-capture-extension";
import { EditorCamera } from "./parts/editor-camera";

/**
 * Supplies the base orchestrator with the capture feature's camera surface
 * via context (renderer-registry style — the base never statically imports
 * this folder; see `hooks/use-capture-extension.ts`). Thin by design:
 * capture's own state (permissions, live stream, recording, multi-instance
 * guard) lives inside `EditorCamera` itself, so there's nothing else to hold
 * here today.
 */
export function MediaCaptureProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = React.useMemo(() => ({ CameraSurface: EditorCamera }), []);
  return (
    <MediaCaptureExtensionContext.Provider value={value}>
      {children}
    </MediaCaptureExtensionContext.Provider>
  );
}
