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
      overflow-hidden
      bg-slate-900
      border border-white/10
      shadow-lg
      cursor-pointer
      transition-all duration-300
      hover:scale-[1.02]
      hover:border-cyan-500/40
    "
    >

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
          className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500"
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
            ? 'bg-rose-500/90 text-white shadow-lg shadow-rose-500/30'
            : 'bg-black/50 text-white/70 hover:text-white border border-white/10'
            }`}
        >
          <Heart className={`w-3.5 h-3.5 ${media.is_favorite ? 'fill-white' : ''}`} />
        </button>
      )}

      {/* Bottom bar on hover: Uploader + Tags */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {media.uploader && (
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: media.uploader.color || '#6366f1' }}
            />
            <span className="text-[10px] text-slate-200 font-medium truncate max-w-[80px]">
              {media.uploader.name}
            </span>
          </div>
        )}

        {media.tags && media.tags.length > 0 && (
          <div className="flex -space-x-1.5 overflow-hidden">
            {media.tags.slice(0, 3).map((tag, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full border border-slate-900 flex items-center justify-center text-[8px] font-bold text-white shadow-sm"
                style={{ backgroundColor: tag.member?.color || '#6366f1' }}
                title={tag.member?.name}
              >
                {tag.member?.name?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
