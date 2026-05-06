"use client";

import { memo, useMemo } from "react";
import {
  DEFAULT_MEDIA_CAROUSEL_LABELS,
  type MediaCarousel01Handle,
  type MediaCarousel01Labels,
  type MediaCarousel01Props,
} from "./types";
import { CarouselTrack } from "./parts/carousel-track";
import { SingleItem } from "./parts/single-item";

interface MediaCarousel01InnerProps extends MediaCarousel01Props {
  ref?: React.Ref<MediaCarousel01Handle>;
}

function MediaCarousel01Inner({
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
}: MediaCarousel01InnerProps) {
  const labels = useMemo<Required<MediaCarousel01Labels>>(
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

const MediaCarousel01 = memo(MediaCarousel01Inner);
MediaCarousel01.displayName = "MediaCarousel01";

export { MediaCarousel01 };
export default MediaCarousel01;
