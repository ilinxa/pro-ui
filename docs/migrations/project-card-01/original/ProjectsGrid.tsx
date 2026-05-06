"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";

import { Loader2 } from "lucide-react";
import { Project } from "@/types/projectsType";
import { allProjects, categories } from "@/data/projectsData";
import ProjectCard from "./ProjectCard";



const ITEMS_PER_PAGE = 6;

const ProjectsGrid = () => {
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const filteredProjects = selectedCategory === "Tümü"
    ? allProjects
    : allProjects.filter((p) => p.category === selectedCategory);

  // Reset when category changes
  useEffect(() => {
    setPage(1);
    setDisplayedProjects(filteredProjects.slice(0, ITEMS_PER_PAGE));
    setHasMore(filteredProjects.length > ITEMS_PER_PAGE);
  }, [selectedCategory]);

  // Load more projects
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;

    setLoading(true);
    // Simulate network delay
    setTimeout(() => {
      const nextPage = page + 1;
      const startIndex = (nextPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const newProjects = filteredProjects.slice(0, endIndex);

      setDisplayedProjects(newProjects);
      setPage(nextPage);
      setHasMore(endIndex < filteredProjects.length);
      setLoading(false);
    }, 500);
  }, [page, loading, hasMore, filteredProjects]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loadMore, hasMore, loading]);

  return (
    <section className="py-16 bg-background flex flex-col items-center">
      <div className="container px-4">
        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-accent text-accent-foreground shadow-glow"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedProjects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>

        {/* Loading / Load More */}
        <div ref={loadMoreRef} className="flex justify-center py-12">
          {loading && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Yükleniyor...</span>
            </div>
          )}
          {!hasMore && displayedProjects.length > 0 && (
            <p className="text-muted-foreground text-sm">
              Tüm projeler gösteriliyor
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProjectsGrid;
