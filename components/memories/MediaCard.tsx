'use client';

import React from 'react';
import {
  Heart,
  Film,
  Download,
  Users
} from 'lucide-react';
import type { MediaWithDetails } from '@/types';

interface MediaCardProps {
  media: MediaWithDetails;
  onClick: () => void;
  onToggleFavorite?: (id: string, current: boolean) => void;
  onDownload?: (media: MediaWithDetails) => void;
}

export function MediaCard({
  media,
  onClick,
  onToggleFavorite,
  onDownload,
}: MediaCardProps) {
  const isVideo = media.media_type === 'video';
  const displayUrl = media.url || media.thumbnail_url || '';

  return (
    <div
      className="
        group relative
        aspect-square
        min-h-[160px]
        w-full
        rounded-2xl
        raised-card
        bg-[var(--surface-raised)]
        border border-[var(--border)]
        shadow-[var(--shadow-raised)]
        p-1.5
        cursor-pointer
        transition-all duration-300
        hover:scale-[1.02]
        hover:border-[var(--accent)]
        hover:shadow-[0_8px_24px_rgba(43,86,255,0.2)]
      "
    >
      <div className="w-full h-full rounded-xl overflow-hidden relative bg-[var(--surface-inset)] border border-[var(--border)]">
        {/* Media image or video preview */}
        {displayUrl ? (
          isVideo ? (
            <video
              src={displayUrl}
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onClick={onClick}
            />
          ) : (
            <img
              src={displayUrl}
              alt={media.filename || 'Trip memory'}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onClick={onClick}
            />
          )
        ) : (
          <div
            onClick={onClick}
            className="w-full h-full flex items-center justify-center bg-[var(--surface-inset)] text-[var(--text-muted)]"
          >
            {isVideo ? <Film className="w-8 h-8" /> : 'Photo'}
          </div>
        )}

        {/* Overlay gradient */}
        <div
          onClick={onClick}
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        />

        {/* Top badges: Video indicator or Uploader */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
          {isVideo && (
            <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white flex items-center gap-1 border border-white/10">
              <Film className="w-3 h-3 text-cyan-400" /> Video
            </span>
          )}
        </div>

        {/* Top right: Favorite Button */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(media.id, media.is_favorite);
            }}
            className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-transform hover:scale-110 ${media.is_favorite
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-black/40 text-white/80 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100'
              }`}
            title={media.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-3.5 h-3.5 ${media.is_favorite ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Bottom bar: Uploader name & download */}
        <div
          onClick={onClick}
          className="absolute bottom-0 left-0 right-0 p-2.5 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold text-white truncate font-outfit drop-shadow">
              {media.uploader?.name || media.filename || 'Memory'}
            </p>
          </div>

          {onDownload && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(media);
              }}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition-colors flex-shrink-0"
              title="Download original file"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
