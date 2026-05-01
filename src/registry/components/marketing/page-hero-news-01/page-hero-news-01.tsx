"use client";

import { memo, useId } from "react";
import { cn } from "@/lib/utils";
import type {
  PageHeroDensity,
  PageHeroHeadingLevel,
  PageHeroNewsProps,
} from "./types";

const DENSITY_CLASS: Record<PageHeroDensity, string> = {
  compact: "min-h-[40vh]",
  default: "min-h-[70vh]",
  full: "min-h-screen",
};

/**
 * PageHeroNews01 — full-bleed gradient hero band with badge / title /
 * highlight / description / children slot. Reveal animation uses the
 * existing pro-ui `reveal-up` keyframe (no framer-motion peer dep) with
 * 60ms staggered delays per the project's Motion mandate.
 *
 * Pair with the exported `HeroStats` sub-component for the typical
 * icon-circle + value + label triplet inside `children`.
 */
function PageHeroNews01Impl(props: PageHeroNewsProps) {
  const {
    title,
    titleSlot,
    titleHighlight,
    badge,
    badgeIcon: BadgeIcon,
    description,
    children,
    density = "default",
    headingAs = "h1",
    disableReveal = false,
    className,
  } = props;

  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const HeadingTag = headingAs as PageHeroHeadingLevel;

  const revealClass = disableReveal ? "" : "reveal-up";

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        DENSITY_CLASS[density],
        className,
      )}
    >
      {/* Gradient background + subtle noise overlay */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-linear-to-br from-primary via-primary/95 to-primary/80" />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')]"
        />
      </div>

      {/* Content stack */}
      <div className="container relative z-10 mx-auto max-w-4xl px-4 py-24 text-center">
        {badge ? (
          <span
            className={cn(
              "mb-6 inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-2 text-sm font-medium text-accent",
              revealClass,
            )}
            style={disableReveal ? undefined : { animationDelay: "0ms" }}
          >
            {BadgeIcon ? <BadgeIcon className="h-4 w-4" aria-hidden="true" /> : null}
            {badge}
          </span>
        ) : null}

        {titleSlot ? (
          <div
            className={revealClass}
            style={disableReveal ? undefined : { animationDelay: "60ms" }}
          >
            {titleSlot}
          </div>
        ) : (
          <HeadingTag
            id={titleId}
            className={cn(
              "mb-6 font-bold text-4xl text-white md:text-5xl lg:text-6xl",
              revealClass,
            )}
            style={disableReveal ? undefined : { animationDelay: "60ms" }}
          >
            {title}
            {titleHighlight ? (
              <span className="block text-accent">{titleHighlight}</span>
            ) : null}
          </HeadingTag>
        )}

        {description ? (
          <p
            className={cn(
              "mx-auto max-w-3xl text-lg text-white/80 md:text-xl",
              revealClass,
            )}
            style={disableReveal ? undefined : { animationDelay: "120ms" }}
          >
            {description}
          </p>
        ) : null}

        {children ? (
          <div
            className={cn("mt-10", revealClass)}
            style={disableReveal ? undefined : { animationDelay: "180ms" }}
          >
            {children}
          </div>
        ) : null}
      </div>

      {/* Bottom wave — fills with the page background so the section transitions cleanly */}
      <div aria-hidden="true" className="absolute -bottom-px left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="fill-background"
        >
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" />
        </svg>
      </div>
    </section>
  );
}

export const PageHeroNews01 = memo(PageHeroNews01Impl);
PageHeroNews01.displayName = "PageHeroNews01";

export default PageHeroNews01;
export { HeroStats } from "./parts/hero-stats";
