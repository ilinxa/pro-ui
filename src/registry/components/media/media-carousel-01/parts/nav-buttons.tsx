"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavButtonsProps {
  scrollPrev: () => void;
  scrollNext: () => void;
  labels: { previousSlide: string; nextSlide: string };
}

export function NavButtons({ scrollPrev, scrollNext, labels }: NavButtonsProps) {
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-1/2 left-2 z-10 h-8 w-8 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100 rtl:rotate-180"
        onClick={scrollPrev}
        aria-label={labels.previousSlide}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-1/2 right-2 z-10 h-8 w-8 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100 rtl:rotate-180"
        onClick={scrollNext}
        aria-label={labels.nextSlide}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </>
  );
}
