"use client";
import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Briefcase, ExternalLink, Loader2, ChevronRight, ChevronLeft, X, MapPin, Calendar, Users, Target } from "lucide-react";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  status: "completed" | "ongoing" | "upcoming";
  link?: string;
  fullDescription?: string;
  location?: string;
  year?: string;
  team?: string;
  goals?: string[];
  gallery?: string[];
}

interface BusinessProjectsSectionProps {
  projects: Project[];
  isPreview?: boolean;
  onSeeAll?: () => void;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  completed: { label: "Tamamlandı", variant: "default" },
  ongoing: { label: "Devam Ediyor", variant: "secondary" },
  upcoming: { label: "Yakında", variant: "outline" },
};

const ITEMS_PER_PAGE = 12;
const PREVIEW_COUNT = 5;

// Layout patterns for lg screens based on item count in each batch of 5
const getLgPattern = (indexInBatch: number, batchSize: number): string => {
  switch (batchSize) {
    case 1:
      return "lg:col-span-3 lg:row-span-2";
    case 2:
      return indexInBatch === 0 ? "lg:col-span-2 lg:row-span-1" : "lg:col-span-1 lg:row-span-1";
    case 3:
      if (indexInBatch === 2) return "lg:col-span-2 lg:row-span-2";
      return "lg:col-span-1 lg:row-span-1";
    case 4:
      if (indexInBatch === 0) return "lg:col-span-1 lg:row-span-2";
      if (indexInBatch === 1 || indexInBatch === 2) return "lg:col-span-1 lg:row-span-1";
      return "lg:col-span-2 lg:row-span-1";
    case 5:
    default:
      if (indexInBatch === 0) return "lg:col-span-2 lg:row-span-1";
      return "lg:col-span-1 lg:row-span-1";
  }
};

const getMdPattern = (index: number): string => {
  const shouldBeWide = index % 5 === 0 || index % 7 === 0;
  return shouldBeWide ? "md:col-span-2 md:row-span-1" : "md:col-span-1 md:row-span-1";
};

export function BusinessProjectsSection({ projects, isPreview = false, onSeeAll }: BusinessProjectsSectionProps) {
  const [visibleCount, setVisibleCount] = useState(isPreview ? PREVIEW_COUNT : ITEMS_PER_PAGE);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  const displayProjects = isPreview ? projects.slice(0, PREVIEW_COUNT) : projects.slice(0, visibleCount);
  const hasMore = !isPreview && visibleCount < projects.length;
  const selectedProject = selectedIndex !== null ? projects[selectedIndex] : null;

  const handleProjectClick = (projectId: string) => {
    const index = projects.findIndex(p => p.id === projectId);
    setSelectedIndex(index);
  };

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < projects.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleClose = () => {
    setSelectedIndex(null);
  };

  const loadMore = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, projects.length));
  }, [projects.length]);

  const { loadMoreRef, isLoading } = useInfiniteScroll(loadMore, hasMore, {
    rootMargin: "200px"
  });

  const getPatternClass = (index: number, totalVisible: number): string => {
    const batchIndex = Math.floor(index / 5);
    const indexInBatch = index % 5;
    const batchStart = batchIndex * 5;
    const batchEnd = Math.min(batchStart + 5, totalVisible);
    const batchSize = batchEnd - batchStart;
    const mobileClass = "col-span-1 row-span-1";
    const mdClass = getMdPattern(index);
    const lgClass = getLgPattern(indexInBatch, batchSize);
    return `${mobileClass} ${mdClass} ${lgClass}`;
  };

  return (
    <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Projelerimiz
        </h2>
        <span className="text-sm text-muted-foreground">
          {displayProjects.length} / {projects.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[180px] gap-4">
        {displayProjects.map((project, index) => (
          <div 
            key={project.id}
            onClick={() => handleProjectClick(project.id)}
            className={`group relative rounded-xl overflow-hidden cursor-pointer ${getPatternClass(index, displayProjects.length)}`}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: `url(${project.image})` }}
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
            
            {/* Status Badge - Top Right */}
            <Badge 
              variant={statusLabels[project.status].variant} 
              className="absolute top-3 right-3 text-xs backdrop-blur-sm bg-background/20"
            >
              {statusLabels[project.status].label}
            </Badge>
            
            {/* Category Badge - Top Left */}
            <span className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white">
              {project.category}
            </span>
            
            {/* Content - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h3 className="font-bold text-base mb-1 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                {project.title}
              </h3>
              <p className="text-xs text-white/80 line-clamp-2 mb-2 group-hover:text-white/90 transition-colors">
                {project.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Project Detail Popup */}
      <Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-card border-border max-h-[90vh] overflow-y-auto">
          {selectedProject && (
            <>
              {/* Header with Image */}
              <div className="relative h-48 md:h-64">
                <img 
                  src={selectedProject.image} 
                  alt={selectedProject.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* Navigation Buttons */}
                <div className="absolute top-1/2 -translate-y-1/2 left-2 right-2 flex justify-between pointer-events-none">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                    disabled={selectedIndex === 0}
                    className="pointer-events-auto rounded-full bg-black/50 hover:bg-black/70 text-white border-0 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    disabled={selectedIndex === projects.length - 1}
                    className="pointer-events-auto rounded-full bg-black/50 hover:bg-black/70 text-white border-0 disabled:opacity-30"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>

                {/* Project Counter */}
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm">
                  {selectedIndex! + 1} / {projects.length}
                </div>

                {/* Title Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={statusLabels[selectedProject.status].variant}>
                      {statusLabels[selectedProject.status].label}
                    </Badge>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white">
                      {selectedProject.category}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">{selectedProject.title}</h3>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Meta Info */}
                <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
                  {selectedProject.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-primary" />
                      {selectedProject.location}
                    </span>
                  )}
                  {selectedProject.year && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-primary" />
                      {selectedProject.year}
                    </span>
                  )}
                  {selectedProject.team && (
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-primary" />
                      {selectedProject.team}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Proje Hakkında</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedProject.fullDescription || selectedProject.description}
                  </p>
                </div>

                {/* Goals */}
                {selectedProject.goals && selectedProject.goals.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Hedefler
                    </h4>
                    <ul className="space-y-2">
                      {selectedProject.goals.map((goal, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Gallery */}
                {selectedProject.gallery && selectedProject.gallery.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Galeri</h4>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                      {selectedProject.gallery.map((img, idx) => (
                        <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                          <img src={img} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* External Link */}
                {selectedProject.link && (
                  <div className="mt-6 pt-4 border-t border-border">
                    <a 
                      href={selectedProject.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                    >
                      Projeyi Ziyaret Et <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview: See All Button */}
      {isPreview && projects.length > PREVIEW_COUNT && onSeeAll && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={onSeeAll} className="gap-2">
            Tüm Projeleri Gör ({projects.length})
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Full view: Infinite scroll trigger */}
      {!isPreview && (
        <div ref={loadMoreRef} className="h-10 flex items-center justify-center mt-4">
          {isLoading && (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>
      )}
    </section>
  );
}
