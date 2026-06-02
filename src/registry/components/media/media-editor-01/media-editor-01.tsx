"use client";

import * as React from "react";
import type {
  MediaEditor01Handle,
  MediaEditor01Props,
} from "./types";

/**
 * media-editor-01 — root component (C2 skeleton).
 *
 * Implementation lands progressively in C6-C12 per
 * `docs/procomps/media-editor-01-procomp/media-editor-01-procomp-plan.md`.
 *
 * C2 ships a throwing stub so the procomp registers in the type system without
 * any runtime surface. Do NOT mount this in the docs site until C6.
 */
export const MediaEditor01 = React.forwardRef<
  MediaEditor01Handle,
  MediaEditor01Props
>(function MediaEditor01(_props, _ref) {
  throw new Error(
    "media-editor-01: not implemented — see plan C6-C12 for the real root component.",
  );
});
