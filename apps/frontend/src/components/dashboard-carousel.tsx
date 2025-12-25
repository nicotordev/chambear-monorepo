"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export interface DashboardCarouselProps {
  slides: React.ReactNode[];
}

export default function DashboardCarousel({ slides }: DashboardCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    containScroll: "trimSnaps",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi],
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi],
  );
  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi],
  );

  const onSelect = useCallback((api: NonNullable<typeof emblaApi>) => {
    setSelectedIndex(api.selectedScrollSnap());
    setPrevBtnDisabled(!api.canScrollPrev());
    setNextBtnDisabled(!api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect(emblaApi);
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", () => onSelect(emblaApi));
    emblaApi.on("reInit", () => {
      onSelect(emblaApi);
      setScrollSnaps(emblaApi.scrollSnapList());
    });
  }, [emblaApi, onSelect]);

  return (
    <div className="relative group">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4 py-1 select-none">
          {slides.map((slide, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: slides are static
              key={`slide-${index}`}
              className="pl-4 min-w-0 flex-[0_0_100%] sm:flex-[0_0_50%] md:flex-[0_0_33.333333%] lg:flex-[0_0_25%] xl:flex-[0_0_20%]"
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        type="button"
        onClick={scrollPrev}
        disabled={prevBtnDisabled}
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full",
          "bg-background/80 backdrop-blur-md border border-border/50 shadow-lg text-foreground",
          "hover:bg-background hover:scale-110 transition-all duration-300",
          "opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-2",
          "disabled:opacity-0 disabled:cursor-not-allowed",
        )}
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={scrollNext}
        disabled={nextBtnDisabled}
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full",
          "bg-background/80 backdrop-blur-md border border-border/50 shadow-lg text-foreground",
          "hover:bg-background hover:scale-110 transition-all duration-300",
          "opacity-0 group-hover:opacity-100 translate-x-4 group-hover:-translate-x-2",
          "disabled:opacity-0 disabled:cursor-not-allowed",
        )}
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Pagination Dots */}
      <div className="flex justify-center mt-6 space-x-2">
        {scrollSnaps.map((_, index) => (
          <button
            type="button"
            // biome-ignore lint/suspicious/noArrayIndexKey: simple dots
            key={index}
            onClick={() => scrollTo(index)}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              index === selectedIndex
                ? "w-8 bg-primary"
                : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50",
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
