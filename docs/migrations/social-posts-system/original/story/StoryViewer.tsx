// "use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import type { Story} from "./types";

interface StoryViewerProps {
  stories: Story[];
  initialStoryIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onStoryViewed?: (storyId: string) => void;
}

export function StoryViewer({ stories, initialStoryIndex, isOpen, onClose, onStoryViewed }: StoryViewerProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const currentStory = stories[currentStoryIndex];
  const currentItem = currentStory?.items[currentItemIndex];
  const itemDuration = (currentItem?.duration || 5) * 1000;

  const goToNextItem = useCallback(() => {
    if (currentItemIndex < currentStory.items.length - 1) {
      setCurrentItemIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setCurrentItemIndex(0);
      setProgress(0);
      onStoryViewed?.(currentStory.id);
    } else {
      onStoryViewed?.(currentStory.id);
      onClose();
    }
  }, [currentItemIndex, currentStory, currentStoryIndex, stories.length, onClose, onStoryViewed]);

  const goToPrevItem = useCallback(() => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      const prevStory = stories[currentStoryIndex - 1];
      setCurrentItemIndex(prevStory.items.length - 1);
      setProgress(0);
    }
  }, [currentItemIndex, currentStoryIndex, stories]);

  const goToNextStory = useCallback(() => {
    if (currentStoryIndex < stories.length - 1) {
      onStoryViewed?.(currentStory.id);
      setCurrentStoryIndex(prev => prev + 1);
      setCurrentItemIndex(0);
      setProgress(0);
    } else {
      onStoryViewed?.(currentStory.id);
      onClose();
    }
  }, [currentStoryIndex, stories.length, currentStory, onClose, onStoryViewed]);

  const goToPrevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setCurrentItemIndex(0);
      setProgress(0);
    }
  }, [currentStoryIndex]);

  // Progress timer
  useEffect(() => {
    if (!isOpen || isPaused || !currentItem) return;

    const startTime = Date.now();
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / itemDuration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        goToNextItem();
      }
    };

    progressInterval.current = setInterval(updateProgress, 50);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isOpen, isPaused, currentItem, currentItemIndex, currentStoryIndex, itemDuration, goToNextItem]);

  // Reset on story change
  useEffect(() => {
    setCurrentStoryIndex(initialStoryIndex);
    setCurrentItemIndex(0);
    setProgress(0);
  }, [initialStoryIndex, isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          goToPrevItem();
          break;
        case "ArrowRight":
          goToNextItem();
          break;
        case "Escape":
          onClose();
          break;
        case " ":
          e.preventDefault();
          setIsPaused(p => !p);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goToNextItem, goToPrevItem, onClose]);

  // Handle video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  }, [isPaused, isMuted, currentItem]);

  if (!isOpen || !currentStory || !currentItem) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
        onClick={onClose}
      >
        {/* Navigation Arrows - Desktop */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white hidden md:flex"
          onClick={(e) => {
            e.stopPropagation();
            goToPrevStory();
          }}
          disabled={currentStoryIndex === 0}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white hidden md:flex"
          onClick={(e) => {
            e.stopPropagation();
            goToNextStory();
          }}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>

        {/* Story Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full h-full md:w-100 md:h-175 md:rounded-2xl overflow-hidden bg-black"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress Bars */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
            {currentStory.items.map((_, idx) => (
              <div key={idx} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-100"
                  style={{
                    width: idx < currentItemIndex ? "100%" : idx === currentItemIndex ? `${progress}%` : "0%"
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-4 left-0 right-0 z-20 flex items-center justify-between px-4 pt-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-white">
                <AvatarImage src={currentStory.avatar} />
                <AvatarFallback>{currentStory.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-semibold text-sm">{currentStory.username}</p>
                <p className="text-white/60 text-xs">
                  {new Date(currentStory.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsPaused(p => !p)}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>

              {currentItem.type === "video" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsMuted(m => !m)}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center">
            {currentItem.type === "image" ? (
              <img
                src={currentItem.src}
                alt="Story"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={videoRef}
                src={currentItem.src}
                className="w-full h-full object-cover"
                autoPlay
                muted={isMuted}
                playsInline
                loop={false}
              />
            )}
          </div>

          {/* Touch Navigation Areas */}
          <div className="absolute inset-0 z-10 flex">
            <div
              className="w-1/3 h-full cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevItem();
              }}
            />
            <div
              className="w-1/3 h-full cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(p => !p);
              }}
            />
            <div
              className="w-1/3 h-full cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                goToNextItem();
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
