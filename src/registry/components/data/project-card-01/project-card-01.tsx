"use client";

import { memo, useId, useMemo } from "react";
import {
  DEFAULT_PROJECT_CARD_LABELS,
  type ProjectCard01Labels,
  type ProjectCard01Props,
} from "./types";
import { ProjectCardGrid } from "./parts/grid";
import { ProjectCardFeature } from "./parts/feature";

function ProjectCard01Inner({
  project,
  variant,
  href,
  getHref,
  onClick,
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
    onClick,
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
