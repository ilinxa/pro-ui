import { useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Card } from "@/components/ui/card";
import { Story } from "./types";
import { StoryThumbnail } from "./StoryThumbnail";
import { StoryViewer } from "./StoryViewer";


const mockStories: Story[] = [
  {
    id: "1",
    userId: "u1",
    username: "mehmet",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100",
    hasUnread: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    items: [
      { id: "1-1", type: "image", src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800" },
      { id: "1-2", type: "image", src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800" },
    ]
  },
  {
    id: "2",
    userId: "u2",
    username: "ayse",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
    hasUnread: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60),
    items: [
      { id: "2-1", type: "image", src: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800" },
    ]
  },
  {
    id: "3",
    userId: "u3",
    username: "ali",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100",
    hasUnread: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 90),
    items: [
      { id: "3-1", type: "image", src: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800" },
      { id: "3-2", type: "image", src: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800" },
      { id: "3-3", type: "image", src: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800" },
    ]
  },
  {
    id: "4",
    userId: "u4",
    username: "fatma",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100",
    hasUnread: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 120),
    items: [
      { id: "4-1", type: "image", src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800" },
    ]
  },
  {
    id: "5",
    userId: "u5",
    username: "mustafa",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100",
    hasUnread: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 150),
    items: [
      { id: "5-1", type: "image", src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800" },
      { id: "5-2", type: "image", src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800" },
    ]
  },
  {
    id: "6",
    userId: "u6",
    username: "zeynep",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100",
    hasUnread: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 180),
    items: [
      { id: "6-1", type: "image", src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800" },
    ]
  },
  {
    id: "7",
    userId: "u7",
    username: "emre",
    avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100",
    hasUnread: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 200),
    items: [
      { id: "7-1", type: "image", src: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800" },
      { id: "7-2", type: "image", src: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800" },
    ]
  },
];

export function StoriesSection() {
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [stories, setStories] = useState(mockStories);

  const openStory = (index: number) => {
    setSelectedStoryIndex(index);
    setViewerOpen(true);
  };

  const handleStoryViewed = (storyId: string) => {
    setStories(prev => prev.map(story => 
      story.id === storyId ? { ...story, hasUnread: false } : story
    ));
  };

  return (
    <>
      <Card className="p-4 relative overflow-hidden">
        {/* Fade Effects */}
        <div className="absolute left-4 top-0 bottom-0 w-8 bg-linear-to-r from-card to-transparent z-10 pointer-events-none" />
        <div className="absolute right-4 top-0 bottom-0 w-8 bg-linear-to-l from-card to-transparent z-10 pointer-events-none" />

        {/* Stories Container - Embla Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3 px-2">
            {/* Add Story */}
            <div className="shrink-0">
              <StoryThumbnail 
                isAddStory 
                userAvatar="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100"
                onClick={() => console.log("Add story clicked")}
              />
            </div>

            {/* Story Items */}
            {stories.map((story, index) => (
              <div key={story.id} className="shrink-0">
                <StoryThumbnail
                  story={story}
                  onClick={() => openStory(index)}
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Story Viewer Modal */}
      <StoryViewer
        stories={stories}
        initialStoryIndex={selectedStoryIndex}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        onStoryViewed={handleStoryViewed}
      />
    </>
  );
}
