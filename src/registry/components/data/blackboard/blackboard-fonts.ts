// Self-hosted handwriting fonts (hybrid delivery — bundled defaults, overridable
// via the `fonts` prop). Side-effect imports register the @font-face rules; the
// families are referenced through `--bb-font-*` CSS vars injected by BlackboardRoot.
//
// These are the only design-mandate font exception in the library, scoped to note
// text + the unread number. A consumer who fully replaces the set via `fonts` can
// fork this module to a no-op to drop the bundled weight.
//
// The type import sits ABOVE the side-effect imports deliberately: the
// `validate:meta-deps` import regex would otherwise span from the first `import`
// down to this `from`, swallowing the @fontsource side-effect imports (phantom-npm).
import type { HandwritingFont } from "./types";

import "@fontsource/kalam/300.css";
import "@fontsource/kalam/400.css";
import "@fontsource/kalam/700.css";
import "@fontsource-variable/caveat";
import "@fontsource/patrick-hand";
import "@fontsource/shadows-into-light";

/** CSS-var declarations BlackboardRoot injects on its wrapper (with cursive fallbacks). */
export const FONT_VAR_DECLARATIONS: Record<string, string> = {
  "--bb-font-kalam": '"Kalam", cursive',
  "--bb-font-caveat": '"Caveat Variable", "Caveat", cursive',
  "--bb-font-patrick": '"Patrick Hand", cursive',
  "--bb-font-shadows": '"Shadows Into Light", cursive',
};

export const DEFAULT_FONTS: HandwritingFont[] = [
  { key: "kalam", label: "Kalam", cssVar: "--bb-font-kalam", hasWeights: true },
  { key: "caveat", label: "Caveat", cssVar: "--bb-font-caveat", hasWeights: false },
  { key: "patrick", label: "Patrick Hand", cssVar: "--bb-font-patrick", hasWeights: false },
  { key: "shadows", label: "Shadows Into Light", cssVar: "--bb-font-shadows", hasWeights: false },
];
