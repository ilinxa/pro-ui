"use client";

import type { ElementType, MouseEvent, ReactNode } from "react";
import { Building2, Star } from "lucide-react";
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

interface FeaturePartProps {
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

export function ProjectCardFeature({
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
}: FeaturePartProps) {
  const statusEntry = PROJECT_STATUS_CONFIG[status];
  const CategoryIcon = categoryStyle?.icon ?? Building2;
  const hasActions = actions != null;

  const handleClick = onClick
    ? (e: MouseEvent<HTMLAnchorElement>) => onClick(project, e)
    : undefined;

  return (
    <article
      className={cn(
        "relative group rounded-xl overflow-hidden cursor-pointer h-full",
        featured && "ring-2 ring-primary ring-inset",
        className,
      )}
    >
      {/* Background image (uses <img> for alt + lazy + error semantics) */}
      {project.image ? (
        <img
          src={project.image}
          alt={project.imageAlt ?? project.title}
          loading={loading}
          className={cn(
            "absolute inset-0 w-full h-full object-cover motion-safe:group-hover:scale-110 transition-transform duration-500",
            imageClassName,
          )}
        />
      ) : (
        <ImageFallback className={cn("absolute inset-0", imageClassName)} />
      )}

      {/* Neutral-darken gradient overlay (NOT primary-tinted; differs from grid deliberately) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent opacity-80 motion-safe:group-hover:opacity-90 transition-opacity duration-300"
      />

      {/* Top-left cluster: category (always) + status (only when actions yielded top-right) */}
      <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
        <span
          className={cn(
            "inline-flex items-center text-xs px-2 py-1 rounded-full backdrop-blur-sm",
            categoryStyle?.className ?? "bg-white/20 text-white",
          )}
        >
          <CategoryIcon aria-hidden="true" className="w-3 h-3 mr-1" />
          {project.category}
        </span>
        {hasActions && (
          <span
            className={cn(
              "inline-flex items-center text-xs px-2.5 py-1 rounded-full backdrop-blur-sm",
              statusEntry.className,
            )}
          >
            {labels[status]}
          </span>
        )}
      </div>

      {/* Top-right: actions (when supplied) OR status pill */}
      {hasActions ? (
        <div className="absolute top-3 right-3 z-10 flex gap-1.5">
          {actions}
        </div>
      ) : (
        <span
          className={cn(
            "absolute top-3 right-3 inline-flex items-center text-xs px-2.5 py-1 rounded-full backdrop-blur-sm",
            statusEntry.className,
          )}
        >
          {labels[status]}
        </span>
      )}

      {/* Link overlay — covers whole article */}
      <LinkComponent
        href={href}
        aria-labelledby={ariaLabel ? undefined : titleId}
        aria-label={ariaLabel}
        onClick={handleClick}
        className="absolute inset-0 z-0 rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none"
      />

      {/* Bottom content block (white-on-dark, no meta row by design) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3
          id={titleId}
          className={cn(
            "font-bold text-base mb-1 text-white motion-safe:group-hover:text-primary transition-colors duration-300 line-clamp-2",
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
        <p className="text-xs text-white/80 line-clamp-2 motion-safe:group-hover:text-white/90 transition-colors">
          {project.description}
        </p>
      </div>
    </article>
  );
}
