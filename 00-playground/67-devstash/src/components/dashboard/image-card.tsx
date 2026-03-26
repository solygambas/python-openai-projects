"use client";

import { useState } from "react";

interface ImageCardProps {
  id: string;
  title: string;
  onClick?: () => void;
}

export function ImageCard({ id, title, onClick }: ImageCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Use the download proxy for R2 authentication
  const imageUrl = `/api/download/${id}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full aspect-video rounded-lg overflow-hidden border border-border/50 hover:border-border bg-secondary/20 cursor-pointer"
    >
      {/* Loading skeleton */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-secondary animate-pulse" />
      )}

      {/* Image with hover zoom effect */}
      <img
        src={imageUrl}
        alt={title}
        loading="lazy"
        onLoad={() => setImageLoaded(true)}
        className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
      />

      {/* Overlay with title on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-sm font-medium text-white truncate">{title}</p>
        </div>
      </div>
    </button>
  );
}
