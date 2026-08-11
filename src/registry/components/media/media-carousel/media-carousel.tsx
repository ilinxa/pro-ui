"use client";

import { memo, useMemo } from "react";
import {
  DEFAULT_MEDIA_CAROUSEL_LABELS,
  type MediaCarouselHandle,
  type MediaCarouselLabels,
  type MediaCarouselProps,
} from "./types";
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
  loop,
  showIndicators = true,
  showNavButtons = true,
  rtl = false,
  renderItem,
  onSlideChange,
  onDoubleTap,
  labels: labelsProp,
  className,
  slideClassName,
  ref,
}: MediaCarouselInnerProps) {
  const labels = useMemo<Required<MediaCarouselLabels>>(
    () => ({ ...DEFAULT_MEDIA_CAROUSEL_LABELS, ...labelsProp }),
    [labelsProp],
  );

  if (items.length === 0) return null;

  if (items.length === 1) {
    return (
      <SingleItem
        item={items[0]}
        renderItem={renderItem}
        onDoubleTap={onDoubleTap}
        labels={labels}
        className={className}
        slideClassName={slideClassName}
        variant={variant}
        aspect={aspect}
      />
    );
  }

  return (
    <CarouselTrack
      ref={ref}
      items={items}
      variant={variant}
      peekRatio={peekRatio}
      aspect={aspect}
      loop={loop ?? true}
      showIndicators={showIndicators}
      showNavButtons={showNavButtons}
      rtl={rtl}
      renderItem={renderItem}
      onSlideChange={onSlideChange}
      onDoubleTap={onDoubleTap}
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
