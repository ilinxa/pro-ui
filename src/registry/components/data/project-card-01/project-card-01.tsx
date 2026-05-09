"use client";

import { memo, useId, useMemo, type MouseEvent } from "react";
import {
  DEFAULT_PROJECT_CARD_LABELS,
  type ProjectCard01Labels,
  type ProjectCard01Props,
  type ProjectCardItem,
} from "./types";
import { ProjectCardGrid } from "./parts/grid";
import { ProjectCardFeature } from "./parts/feature";

function ProjectCard01Inner({
  project,
  variant,
  href,
  getHref,
  onClick,
  onClickArgs,
  linkComponent = "a",
  categoryStyles,
  labels: labelsProp,
  titleClassName,
  imageClassName,
  className,
  ariaLabel,
  actions,
  loading = "lazy",
}: ProjectCard01Props) {
  const titleId = useId();

  // Resolve onClick — prefers `onClickArgs` (object shape, v0.2-bound).
  // F-cross-12 transition; positional `onClick` still works with a dev-only
  // console.warn. Pass the resolved positional-shape wrapper to parts.
  const resolvedOnClick = onClickArgs
    ? (proj: ProjectCardItem, mouseEvent: MouseEvent) =>
        onClickArgs({ project: proj, mouseEvent })
    : onClick
      ? (() => {
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              "[project-card-01] `onClick` positional signature `(project, mouseEvent)` is @deprecated. Use `onClickArgs({ project, mouseEvent })` for the object-shape signature; v0.2 will remove the positional shape.",
            );
          }
          return onClick;
        })()
      : undefined;

  const labels = useMemo<Required<ProjectCard01Labels>>(
    () => ({ ...DEFAULT_PROJECT_CARD_LABELS, ...labelsProp }),
    [labelsProp],
  );

  // href precedence: getHref > href > project.href > '#'
  const resolvedHref =
    (getHref ? getHref(project) : undefined) ?? href ?? project.href ?? "#";

  const categoryStyle = categoryStyles?.[project.category];
  const featured = project.featured === true;

  const sharedProps = {
    project,
    status: project.status,
    featured,
    labels,
    categoryStyle,
    href: resolvedHref,
    linkComponent,
    onClick: resolvedOnClick,
    ariaLabel,
    titleId,
    titleClassName,
    imageClassName,
    className,
    actions,
    loading,
  };

  if (variant === "feature") {
    return <ProjectCardFeature {...sharedProps} />;
  }

  return <ProjectCardGrid {...sharedProps} />;
}

export const ProjectCard01 = memo(ProjectCard01Inner);
ProjectCard01.displayName = "ProjectCard01";

export default ProjectCard01;
