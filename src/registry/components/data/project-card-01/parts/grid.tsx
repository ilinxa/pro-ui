"use client";

import type { ElementType, MouseEvent, ReactNode } from "react";
import { ArrowRight, Building2, Calendar, MapPin, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ProjectCard01Labels,
  ProjectCardItem,
  ProjectCategoryStyle,
} from "../types";
import {
  PROJECT_STATUS_CONFIG,
  type ProjectStatus,
} from "../lib/project-status";
import { ImageFallback } from "../lib/image-fallback";

interface GridPartProps {
  project: ProjectCardItem;
  status: ProjectStatus;
  featured: boolean;
  labels: Required<ProjectCard01Labels>;
  categoryStyle?: ProjectCategoryStyle;
  href: string;
  linkComponent: ElementType;
  onClick?: (project: ProjectCardItem, mouseEvent: MouseEvent) => void;
  ariaLabel?: string;
  titleId: string;
  titleClassName?: string;
  imageClassName?: string;
  className?: string;
  actions?: ReactNode;
  loading: "lazy" | "eager";
}

export function ProjectCardGrid({
  project,
  status,
  featured,
  labels,
  categoryStyle,
  href,
  linkComponent: LinkComponent,
  onClick,
  ariaLabel,
  titleId,
  titleClassName,
  imageClassName,
  className,
  actions,
  loading,
}: GridPartProps) {
  const statusEntry = PROJECT_STATUS_CONFIG[status];
  const CategoryIcon = categoryStyle?.icon ?? Building2;
  const hasActions = actions != null;
  const hasMeta = project.location != null || project.year != null;

  const handleClick = onClick
    ? (e: MouseEvent<HTMLAnchorElement>) => onClick(project, e)
    : undefined;

  return (
    <article
      className={cn(
        "relative group bg-card rounded-2xl overflow-hidden shadow-sm motion-safe:hover:shadow-xl motion-safe:hover:-translate-y-2 transition-all duration-500 border border-border h-full flex flex-col",
        featured && "border-t-4 border-t-primary",
        className,
      )}
    >
      {/* Image area */}
      <div className="relative aspect-16/10 overflow-hidden">
        {project.image ? (
          <img
            src={project.image}
            alt={project.imageAlt ?? project.title}
            loading={loading}
            className={cn(
              "w-full h-full object-cover motion-safe:group-hover:scale-110 transition-transform duration-700",
              imageClassName,
            )}
          />
        ) : (
          <ImageFallback className={imageClassName} />
        )}

        {/* Subtle dark gradient overlay for badge legibility (replaces source's aggressive lime tint that competed with image content) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-black/60 via-black/15 to-transparent motion-safe:group-hover:from-black/70 transition-all duration-300"
        />

        {/* Status pill — top-left (always) */}
        <span
          className={cn(
            "absolute top-4 left-4 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium",
            statusEntry.className,
          )}
        >
          {labels[status]}
        </span>

        {/* Category pill — top-right OR bottom-right when actions yields top */}
        <span
          className={cn(
            "absolute inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm",
            hasActions ? "bottom-4 right-4" : "top-4 right-4",
            categoryStyle?.className ?? "bg-white/20 text-white",
          )}
        >
          <CategoryIcon aria-hidden="true" className="w-3 h-3 mr-1.5" />
          {project.category}
        </span>

        {/* Actions slot — top-right, above link overlay */}
        {hasActions && (
          <div className="absolute top-4 right-4 z-10 flex gap-1.5">
            {actions}
          </div>
        )}

        {/* Hover-reveal "View details" CTA — center, decorative (clicks pass through to link) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 motion-safe:group-hover:opacity-100 transition-opacity duration-300"
        >
          <span className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium shadow-md">
            {labels.viewDetails}
            <ArrowRight className="w-4 h-4 motion-safe:group-hover:translate-x-1 transition-transform rtl:rotate-180" />
          </span>
        </div>
      </div>

      {/* Link overlay — covers whole article, transparent, on top of content */}
      <LinkComponent
        href={href}
        aria-labelledby={ariaLabel ? undefined : titleId}
        aria-label={ariaLabel}
        onClick={handleClick}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none"
      />

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col">
        <h3
          id={titleId}
          className={cn(
            "text-xl font-semibold text-foreground mb-3 motion-safe:group-hover:text-primary transition-colors line-clamp-2",
            titleClassName,
          )}
        >
          {featured && (
            <Star
              aria-hidden="true"
              className="inline w-4 h-4 fill-primary text-primary mr-1.5 align-baseline"
            />
          )}
          {project.title}
          {featured && (
            <span className="sr-only"> ({labels.featuredAriaLabel})</span>
          )}
        </h3>

        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {project.description}
        </p>

        {hasMeta && (
          <ul
            role="list"
            className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-auto"
          >
            {project.location != null && (
              <li className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="w-4 h-4 text-muted-foreground/70" />
                <span>{project.location}</span>
              </li>
            )}
            {project.year != null && (
              <li className="inline-flex items-center gap-1.5">
                <Calendar aria-hidden="true" className="w-4 h-4 text-muted-foreground/70" />
                <span>{project.year}</span>
              </li>
            )}
          </ul>
        )}
      </div>
    </article>
  );
}
