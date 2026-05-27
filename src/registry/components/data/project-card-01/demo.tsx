"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SwipeTabsList } from "@/components/site/swipe-tabs-list";
import { ProjectCard01 } from "./project-card-01";
import {
  dummyCategoryStyles,
  dummyProjects,
  dummyTrCategoryStyles,
  dummyTrLabels,
  dummyTrProjects,
} from "./dummy-data";
import type { ProjectCardItem } from "./types";

const HREF_BASE = "/projects";

function makeHref(project: ProjectCardItem) {
  return `${HREF_BASE}/${project.id}`;
}

function ActionsCluster({
  projectId,
  saved,
  onToggle,
}: {
  projectId: string;
  saved: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex gap-1.5">
      <Button
        variant="secondary"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle(projectId);
        }}
        aria-label={saved ? "Remove from saved projects" : "Save project"}
      >
        {saved ? (
          <BookmarkCheck aria-hidden="true" className="size-4" />
        ) : (
          <Bookmark aria-hidden="true" className="size-4" />
        )}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        aria-label="Share project"
      >
        <Share2 aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}

const featuredProject = dummyProjects.find((p) => p.featured)!;
const ongoingProject = dummyProjects.find(
  (p) => p.status === "ongoing" && !p.featured,
)!;

/**
 * Bento-pattern className per index-within-batch-of-5 (mirrors kasder
 * `getLgPattern`). Inline preview of what `bento-grid-01` will eventually own.
 */
function bentoClassFor(index: number, batchSize: number): string {
  const indexInBatch = index % 5;
  switch (batchSize) {
    case 1:
      return "lg:col-span-3 lg:row-span-2";
    case 2:
      return indexInBatch === 0
        ? "lg:col-span-2 lg:row-span-1"
        : "lg:col-span-1 lg:row-span-1";
    case 3:
      if (indexInBatch === 2) return "lg:col-span-2 lg:row-span-2";
      return "lg:col-span-1 lg:row-span-1";
    case 4:
      if (indexInBatch === 0) return "lg:col-span-1 lg:row-span-2";
      if (indexInBatch < 3) return "lg:col-span-1 lg:row-span-1";
      return "lg:col-span-2 lg:row-span-1";
    case 5:
    default:
      if (indexInBatch === 0) return "lg:col-span-2 lg:row-span-1";
      return "lg:col-span-1 lg:row-span-1";
  }
}

export default function ProjectCard01Demo() {
  const [saved, setSaved] = useState<Set<string>>(() => new Set());

  const toggleSaved = (id: string) =>
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  // Bento layout: process projects in batches of 5
  const bentoBatches: { items: ProjectCardItem[]; batchSize: number }[] = [];
  for (let i = 0; i < dummyProjects.length; i += 5) {
    const batch = dummyProjects.slice(i, i + 5);
    bentoBatches.push({ items: batch, batchSize: batch.length });
  }

  return (
    <Tabs defaultValue="grid" className="w-full">
      <SwipeTabsList>
        <TabsTrigger value="grid">Grid</TabsTrigger>
        <TabsTrigger value="feature">Feature (bento)</TabsTrigger>
        <TabsTrigger value="featured">Featured</TabsTrigger>
        <TabsTrigger value="localized">Localized (TR)</TabsTrigger>
        <TabsTrigger value="actions">Actions slot</TabsTrigger>
      </SwipeTabsList>

      {/* 1. Grid — vertical image-on-top, 1/2/3-col responsive */}
      <TabsContent value="grid" className="mt-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Grid variant — vertical image-on-top, hover-reveal &quot;View
          details&quot; CTA, lift-on-hover. Compose with{" "}
          <code className="text-xs px-1.5 py-0.5 rounded bg-muted">
            grid-layout-news-01
          </code>{" "}
          for the public projects-page assembly (see usage notes).
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dummyProjects.map((project) => (
            <ProjectCard01
              key={project.id}
              project={project}
              variant="grid"
              href={makeHref(project)}
              categoryStyles={dummyCategoryStyles}
            />
          ))}
        </div>
      </TabsContent>

      {/* 2. Feature (bento) — full-bleed background, no hover-CTA */}
      <TabsContent value="feature" className="mt-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Feature variant — full-bleed image background, white-on-dark text,
          no hover-CTA. Designed to live inside{" "}
          <code className="text-xs px-1.5 py-0.5 rounded bg-muted">
            bento-grid-01
          </code>{" "}
          (deferred). Until that ships, the consumer drives sizing via
          inline <code className="text-xs px-1.5 py-0.5 rounded bg-muted">
            lg:col-span-X lg:row-span-Y
          </code>{" "}
          on the card&apos;s <code className="text-xs px-1.5 py-0.5 rounded bg-muted">
            className
          </code>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[180px] gap-4">
          {bentoBatches.flatMap(({ items, batchSize }) =>
            items.map((project, indexInBatch) => (
              <ProjectCard01
                key={project.id}
                project={project}
                variant="feature"
                href={makeHref(project)}
                categoryStyles={dummyCategoryStyles}
                className={bentoClassFor(indexInBatch, batchSize)}
              />
            )),
          )}
        </div>
      </TabsContent>

      {/* 3. Featured — grid + feature side-by-side comparison */}
      <TabsContent value="featured" className="mt-6">
        <div className="space-y-8">
          <div>
            <p className="mb-3 text-sm text-muted-foreground">
              Grid variant — top accent border + star prefix on title.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <ProjectCard01
                project={featuredProject}
                variant="grid"
                href={makeHref(featuredProject)}
                categoryStyles={dummyCategoryStyles}
              />
              <ProjectCard01
                project={ongoingProject}
                variant="grid"
                href={makeHref(ongoingProject)}
                categoryStyles={dummyCategoryStyles}
              />
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm text-muted-foreground">
              Feature variant — inset ring + star prefix on title.
            </p>
            <div className="grid md:grid-cols-2 gap-4 auto-rows-[220px]">
              <ProjectCard01
                project={featuredProject}
                variant="feature"
                href={makeHref(featuredProject)}
                categoryStyles={dummyCategoryStyles}
              />
              <ProjectCard01
                project={ongoingProject}
                variant="feature"
                href={makeHref(ongoingProject)}
                categoryStyles={dummyCategoryStyles}
              />
            </div>
          </div>
        </div>
      </TabsContent>

      {/* 4. Localized (TR) */}
      <TabsContent value="localized" className="mt-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Turkish project data + labels + category-style map. Mirrors kasder
          defaults end-to-end; proves the full i18n surface.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dummyTrProjects.map((project) => (
            <ProjectCard01
              key={project.id}
              project={project}
              variant="grid"
              href={makeHref(project)}
              categoryStyles={dummyTrCategoryStyles}
              labels={dummyTrLabels}
            />
          ))}
        </div>
      </TabsContent>

      {/* 5. Actions slot + custom href */}
      <TabsContent value="actions" className="mt-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Action buttons stop propagation — clicks on Save / Share don&apos;t
            navigate. The rest of the card surface still does. Custom{" "}
            <code className="text-xs px-1.5 py-0.5 rounded bg-muted">
              getHref
            </code>{" "}
            routes via{" "}
            <code className="text-xs px-1.5 py-0.5 rounded bg-muted">
              /portfolio/{"{id}"}
            </code>{" "}
            instead of the default{" "}
            <code className="text-xs px-1.5 py-0.5 rounded bg-muted">
              /projects/{"{id}"}
            </code>
            . Currently saved:{" "}
            <span className="font-mono text-xs">
              {saved.size > 0 ? Array.from(saved).join(", ") : "(none)"}
            </span>
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dummyProjects.slice(0, 3).map((project) => (
              <ProjectCard01
                key={project.id}
                project={project}
                variant="grid"
                getHref={(p) => `/portfolio/${p.id}`}
                categoryStyles={dummyCategoryStyles}
                actions={
                  <ActionsCluster
                    projectId={project.id}
                    saved={saved.has(project.id)}
                    onToggle={toggleSaved}
                  />
                }
              />
            ))}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
