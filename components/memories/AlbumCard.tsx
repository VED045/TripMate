'use client';

import React from 'react';
import { Folder, Image as ImageIcon, ChevronRight } from 'lucide-react';
import type { Album } from '@/types';

interface AlbumCardProps {
  album: Album & { media_count?: number; preview_thumbnails?: string[] };
  onClick: () => void;
}

export function AlbumCard({ album, onClick }: AlbumCardProps) {
  const count = album.media_count || 0;
  const thumbnails = album.preview_thumbnails || [];

  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 p-4 cursor-pointer transition-all duration-300 hover:border-cyan-500/40 hover:-translate-y-0.5"
    >
      {/* Thumbnail Stack Preview */}
      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-white/10 mb-3 relative flex items-center justify-center">
        {thumbnails.length > 0 ? (
          <div className="grid grid-cols-2 w-full h-full gap-0.5">
            {thumbnails.slice(0, 4).map((thumb, idx) => (
              <img
                key={idx}
                src={thumb}
                alt="Album preview"
                className="w-full h-full object-cover"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500">
            <Folder className="w-8 h-8 mb-1 text-slate-600 group-hover:text-cyan-400 transition-colors" />
            <span className="text-[11px]">Empty Album</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-sm text-white group-hover:text-cyan-300 transition-colors">
            {album.name}
          </h4>
          <p className="text-[11px] text-slate-400">
            {count} {count === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div className="p-1.5 rounded-lg bg-white/[0.04] text-slate-400 group-hover:text-white group-hover:bg-cyan-500/20 transition-all">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
