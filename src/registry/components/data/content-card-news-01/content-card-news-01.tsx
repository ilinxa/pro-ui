"use client";

import { memo, useId, useMemo, useCallback } from "react";
import type { MouseEvent } from "react";
import { defaultRelativeTime } from "./hooks/use-relative-time";
import { defaultDateFormat, toDate } from "./lib/format-default";
import { FeaturedPart } from "./parts/featured";
import { LargePart } from "./parts/large";
import { MediumPart } from "./parts/medium";
import { SmallPart } from "./parts/small";
import { ListPart } from "./parts/list";
import {
  DEFAULT_LABELS,
  type ContentCardNewsProps,
  type ResolvedPartProps,
} from "./types";

/**
 * ContentCardNews01 — magazine-style content card with 5 visual variants
 * dispatched via the `variant` prop (`featured` / `large` / `medium` / `small` / `list`).
 *
 * Renders an `<article>` with an absolute-positioned link overlay covering
 * the whole card (the "overlay-link" pattern), allowing optional `actions`
 * to live above the overlay (z-10) for nested interactives like bookmark or
 * share buttons without breaking the whole-card-clickable surface.
 *
 * All consumer-visible strings, colors, formats, and behaviors are overridable.
 */
function ContentCardNews01Impl(props: ContentCardNewsProps) {
  const {
    item,
    variant = "medium",
    href,
    onClick,
    linkComponent: LinkComponent = "a",
    formatRelativeTime,
    formatDate,
    labels: labelsProp,
    categoryStyles,
    titleClassName,
    imageClassName,
    className,
    ariaLabel: ariaLabelProp,
    actions,
    loading: loadingProp,
  } = props;

  const titleId = useId();

  const labels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...labelsProp }),
    [labelsProp],
  );

  const date = useMemo(() => toDate(item.date), [item.date]);

  const formattedRelativeTime = useMemo(() => {
    if (!date) return undefined;
    return (formatRelativeTime ?? defaultRelativeTime)(date);
  }, [date, formatRelativeTime]);

  const formattedDate = useMemo(() => {
    if (!date) return undefined;
    return (formatDate ?? defaultDateFormat)(date);
  }, [date, formatDate]);

  const categoryStyle = useMemo(() => {
    if (!item.category) return "bg-muted";
    return categoryStyles?.[item.category] ?? "bg-muted";
  }, [item.category, categoryStyles]);

  const ariaLabel =
    ariaLabelProp ?? `${labels.readArticlePrefix} ${item.title}`;

  const handleClick = useCallback(
    (event: MouseEvent) => {
      onClick?.(item, event);
    },
    [onClick, item],
  );

  const loading: "lazy" | "eager" =
    loadingProp ?? (variant === "featured" ? "eager" : "lazy");

  const partProps: ResolvedPartProps = {
    item,
    formattedDate,
    formattedRelativeTime,
    categoryStyle,
    labels,
    LinkComponent,
    href,
    onClick: onClick ? handleClick : undefined,
    ariaLabel,
    titleId,
    titleClassName,
    imageClassName,
    className,
    actions,
    loading,
  };

  switch (variant) {
    case "featured":
      return <FeaturedPart {...partProps} />;
    case "large":
      return <LargePart {...partProps} />;
    case "small":
      return <SmallPart {...partProps} />;
    case "list":
      return <ListPart {...partProps} />;
    case "medium":
    default:
      return <MediumPart {...partProps} />;
  }
}

export const ContentCardNews01 = memo(ContentCardNews01Impl);
ContentCardNews01.displayName = "ContentCardNews01";

export default ContentCardNews01;
