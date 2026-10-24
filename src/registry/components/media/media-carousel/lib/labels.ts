import {
  defaultMediaCarouselLabels,
  type MediaCarouselLabels,
  type ResolvedMediaCarouselLabels,
} from "../types";

/**
 * Merge `labels` over the defaults (an `undefined` value never erases a default, C2) and turn
 * the deprecated 0.2 string forms of `goToSlide` / `slideAriaLabel` into functions.
 */
export function resolveLabels(labels: MediaCarouselLabels | undefined): ResolvedMediaCarouselLabels {
  const out: ResolvedMediaCarouselLabels = { ...defaultMediaCarouselLabels };
  if (!labels) return out;
  if (labels.carouselLabel !== undefined) out.carouselLabel = labels.carouselLabel;
  if (labels.previousSlide !== undefined) out.previousSlide = labels.previousSlide;
  if (labels.nextSlide !== undefined) out.nextSlide = labels.nextSlide;
  if (labels.counter !== undefined) out.counter = labels.counter;
  if (labels.carouselRoleDescription !== undefined) {
    out.carouselRoleDescription = labels.carouselRoleDescription;
  }
  if (labels.slideRoleDescription !== undefined) out.slideRoleDescription = labels.slideRoleDescription;

  const goTo = labels.goToSlide;
  if (typeof goTo === "function") out.goToSlide = goTo;
  else if (typeof goTo === "string") out.goToSlide = (position) => `${goTo} ${position}`;

  const slide = labels.slideAriaLabel;
  if (typeof slide === "function") out.slideAriaLabel = slide;
  else if (typeof slide === "string") {
    out.slideAriaLabel = (position, total) =>
      // template-ok: deprecated 0.2 string form of slideAriaLabel, kept as an alias
      slide.replace("{index}", String(position)).replace("{total}", String(total));
  }
  return out;
}

/**
 * A valid BCP 47 tag for `locale`, else `"en"`. An invalid tag (`"en_US"` from an i18n library)
 * makes `Intl` throw — that must not take down the render.
 */
export function resolveLocale(locale: string | undefined): string {
  if (!locale) return "en";
  try {
    return Intl.getCanonicalLocales(locale)[0] ?? "en";
  } catch {
    return "en";
  }
}
