"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Img = { id: string; url: string; alt: string | null };

/**
 * Phones: swipeable full-width slider with dots.
 * Desktop: thumbnails on the left, large image with hover zoom.
 */
export function ProductGallery({ images, name, discount }: { images: Img[]; name: string; discount: number }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const scrollTo = (i: number) => {
    setActive(i);
    const el = scroller.current;
    if (el) el.scrollTo({ left: el.clientWidth * i, behavior: "smooth" });
  };

  return (
    <div className="-mx-4 sm:mx-0">
      {/* Mobile slider */}
      <div className="relative lg:hidden">
        <div
          ref={scroller}
          className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => {
            const el = e.currentTarget;
            setActive(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {images.map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={img.id + i} src={img.url} alt={img.alt ?? name} className="aspect-[4/5] w-full shrink-0 snap-center bg-muted object-cover" loading={i === 0 ? "eager" : "lazy"} />
          ))}
        </div>
        {discount > 0 && <span className="absolute top-3 left-3 rounded bg-sale px-2 py-1 text-xs font-semibold text-white">-{discount}%</span>}
        {images.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {images.map((img, i) => (
              <button key={img.id + i} onClick={() => scrollTo(i)} className={cn("h-1.5 rounded-full bg-white shadow transition-all", i === active ? "w-6" : "w-1.5 opacity-70")} aria-label={`Image ${i + 1}`} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden gap-4 lg:flex">
        {images.length > 1 && (
          <div className="flex w-20 shrink-0 flex-col gap-3">
            {images.map((img, i) => (
              <button
                key={img.id + i}
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                className={cn("overflow-hidden rounded-md border-2 transition", i === active ? "border-foreground" : "border-transparent opacity-70 hover:opacity-100")}
                aria-label={`Show image ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="aspect-[4/5] w-full bg-muted object-cover" />
              </button>
            ))}
          </div>
        )}
        <div
          className="relative flex-1 cursor-zoom-in overflow-hidden rounded-xl bg-muted"
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[active]?.url}
            alt={images[active]?.alt ?? name}
            className="aspect-[4/5] w-full object-cover transition-transform duration-200"
            style={zoom ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
            fetchPriority="high"
          />
          {discount > 0 && <span className="absolute top-4 left-4 rounded bg-sale px-2 py-1 text-xs font-semibold text-white">-{discount}%</span>}
        </div>
      </div>
    </div>
  );
}
