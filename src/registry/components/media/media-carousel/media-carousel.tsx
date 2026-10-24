"use client";

import { memo, useCallback, useMemo, useState } from "react";
import type { MediaCarouselHandle, MediaCarouselProps } from "./types";
import { useMediaRecovery } from "./hooks/use-media-recovery";
import {
  DEFAULT_MAX_RATIO,
  DEFAULT_MIN_RATIO,
  clampRatio,
  declaredRatio,
  frameFor,
} from "./lib/aspect";
import { resolveLabels, resolveLocale } from "./lib/labels";
import { CarouselTrack } from "./parts/carousel-track";
import { SingleItem } from "./parts/single-item";

interface MediaCarouselInnerProps extends MediaCarouselProps {
  ref?: React.Ref<MediaCarouselHandle>;
}

function MediaCarouselInner({
  items,
  variant,
  peekRatio = 0.075,
  aspect = "square",
  minRatio = DEFAULT_MIN_RATIO,
  maxRatio = DEFAULT_MAX_RATIO,
  loop,
  showIndicators = true,
  showNavButtons = true,
  showCounter = false,
  dir: dirProp,
  rtl,
  locale: localeProp,
  index,
  onIndexChange,
  defaultIndex,
  renderItem,
  onSlideChange,
  onDoubleTap,
  onMediaError,
  labels: labelsProp,
  className,
  slideClassName,
  ref,
}: MediaCarouselInnerProps) {
  const labels = useMemo(() => resolveLabels(labelsProp), [labelsProp]);
  const locale = useMemo(() => resolveLocale(localeProp), [localeProp]);
  const formatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const formatNumber = useCallback((n: number) => formatter.format(n), [formatter]);
  const recovery = useMediaRecovery(onMediaError);

  // `natural-clamped`: the first item's declared size, else its loaded natural size
  // (square until it loads). Keyed by id so a new first item starts over.
  const first = items[0];
  const [natural, setNatural] = useState<{ id: string; ratio: number } | null>(null);
  const declared = declaredRatio(first, minRatio, maxRatio);
  const needsNatural = aspect === "natural-clamped" && declared === null && !!first;
  const naturalRatio =
    natural && first && natural.id === first.id ? clampRatio(natural.ratio, 1, minRatio, maxRatio) : null;
  const firstId = first?.id;
  const onNaturalSize = useCallback(
    (width: number, height: number) => {
      if (!firstId || !width || !height) return;
      setNatural((prev) =>
        prev && prev.id === firstId && prev.ratio === width / height ? prev : { id: firstId, ratio: width / height },
      );
    },
    [firstId],
  );
  const frame = useMemo(
    () => frameFor(aspect, declared ?? naturalRatio),
    [aspect, declared, naturalRatio],
  );

  // `dir` wins; the deprecated `rtl` only when set; otherwise resolved from the element.
  const dir = dirProp ?? (rtl === undefined ? undefined : rtl ? "rtl" : "ltr");

  if (items.length === 0) return null;

  if (items.length === 1) {
    return (
      <SingleItem
        item={items[0]}
        renderItem={renderItem}
        onDoubleTap={onDoubleTap}
        labels={labels}
        frame={frame}
        recovery={recovery}
        onNaturalSize={needsNatural ? onNaturalSize : undefined}
        dir={dir}
        className={className}
        slideClassName={slideClassName}
      />
    );
  }

  return (
    <CarouselTrack
      ref={ref}
      items={items}
      variant={variant}
      peekRatio={peekRatio}
      frame={frame}
      loop={loop ?? true}
      showIndicators={showIndicators}
      showNavButtons={showNavButtons}
      showCounter={showCounter}
      dir={dir}
      formatNumber={formatNumber}
      index={index}
      defaultIndex={defaultIndex}
      onIndexChange={onIndexChange}
      renderItem={renderItem}
      onSlideChange={onSlideChange}
      onDoubleTap={onDoubleTap}
      recovery={recovery}
      onNaturalSize={needsNatural ? onNaturalSize : undefined}
      labels={labels}
      className={className}
      slideClassName={slideClassName}
    />
  );
}

const MediaCarousel = memo(MediaCarouselInner);
MediaCarousel.displayName = "MediaCarousel";

export { MediaCarousel };
export default MediaCarousel;
