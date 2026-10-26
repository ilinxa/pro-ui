import {
  defaultCarouselComposerLabels,
  type CarouselComposerLabels,
  type CarouselComposerLabelsInput,
} from "../types";

/** Keys that were string templates in 0.2 and are functions now. */
const FUNCTION_KEYS = ["dropzoneHint", "maxReached", "itemAria"] as const;

export interface MergedLabels {
  labels: CarouselComposerLabels;
  /** Keys where a 0.2 string template was passed and ignored. */
  legacyKeys: string[];
}

/** A copy without the keys whose value is `undefined` (they must not hide a default). */
function definedOnly<T extends object>(input: T | undefined): Partial<T> {
  if (!input) return {};
  return Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

/**
 * Merge `labels` over the English defaults; `errors` and `drag` merge key by key.
 * A string given for a key that is a function now is ignored (the default stays).
 */
export function mergeLabels(input?: CarouselComposerLabelsInput): MergedLabels {
  const defaults = defaultCarouselComposerLabels;
  if (!input) return { labels: defaults, legacyKeys: [] };
  const legacyKeys: string[] = [];
  const clean: Record<string, unknown> = definedOnly(input);
  for (const key of FUNCTION_KEYS) {
    if (typeof clean[key] === "string") {
      legacyKeys.push(key);
      delete clean[key];
    }
  }
  const { errors, drag, ...rest } = clean as CarouselComposerLabelsInput;
  const labels: CarouselComposerLabels = {
    ...defaults,
    ...(rest as Partial<CarouselComposerLabels>),
    errors: { ...defaults.errors, ...definedOnly(errors) },
    drag: { ...defaults.drag, ...definedOnly(drag) },
  };
  // 0.2 hosts translated `remove`; until they adopt `removeItem`, their text names the buttons.
  if (typeof rest.remove === "string" && rest.removeItem === undefined) {
    const text = rest.remove;
    labels.removeItem = () => text;
  }
  return { labels, legacyKeys };
}
