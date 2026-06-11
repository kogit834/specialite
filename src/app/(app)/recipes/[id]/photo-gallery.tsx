"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Photo = { id: string; url: string; caption: string | null; taken_on: string | null };

export function PhotoGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [current, setCurrent] = useState(0);

  return (
    <div className="relative aspect-square bg-muted">
      <Image
        src={photos[current].url}
        alt={title}
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />
      {photos.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + photos.length) % photos.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % photos.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full ${i === current ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
      {photos[current].caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
          {photos[current].caption}
        </div>
      )}
    </div>
  );
}
