"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Banner } from "@/types";

/**
 * Home hero slider. Auto-advances every 6s, pauses on hover, swipeable on phones.
 * Text is real HTML (not baked into the image) so it is readable by search engines.
 */
export function HeroSlider({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = banners.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(t);
  }, [paused, count]);

  if (!count) return null;

  return (
    <section
      className="relative overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
        {banners.map((b, i) => (
          <div key={b.id} className="relative w-full shrink-0" aria-hidden={i !== index} role="group" aria-roledescription="slide">
            <picture>
              {b.mobileImage && <source media="(max-width: 767px)" srcSet={b.mobileImage} />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.image}
                alt={b.title}
                className="aspect-[4/5] w-full object-cover md:aspect-[5/2]"
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
              />
            </picture>
            {/* Scrim keeps the text readable over any banner image */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-transparent md:bg-gradient-to-r md:from-black/55 md:via-black/20" />
            <div className="absolute inset-0 flex items-start md:items-center">
              <div className="container-page">
                <div className="max-w-md pt-10 text-white md:max-w-sm md:pt-0">
                  {i === 0 ? (
                    <h1 className="text-3xl leading-tight font-semibold drop-shadow-sm sm:text-4xl lg:text-5xl">{b.title}</h1>
                  ) : (
                    <h2 className="text-3xl leading-tight font-semibold drop-shadow-sm sm:text-4xl lg:text-5xl">{b.title}</h2>
                  )}
                  {b.subtitle && <p className="mt-3 text-sm text-white/85 sm:text-base">{b.subtitle}</p>}
                  {b.link && (
                    <Link
                      href={b.link}
                      tabIndex={i === index ? 0 : -1}
                      className="mt-6 inline-flex h-12 items-center rounded-md bg-white px-7 text-sm font-semibold tracking-wide text-black uppercase transition hover:bg-white/90"
                    >
                      {b.buttonText || "Shop now"}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button onClick={() => go(index - 1)} className="absolute top-1/2 left-3 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-black backdrop-blur transition hover:bg-white md:flex" aria-label="Previous slide">
            <ChevronLeft className="size-5" />
          </button>
          <button onClick={() => go(index + 1)} className="absolute top-1/2 right-3 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-black backdrop-blur transition hover:bg-white md:flex" aria-label="Next slide">
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => go(i)}
                className={cn("h-1.5 rounded-full bg-white transition-all", i === index ? "w-8" : "w-1.5 opacity-60")}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
