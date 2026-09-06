'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Sparkles, 
  Maximize2,
  Heart,
  Users,
  Film
} from 'lucide-react';
import type { MediaWithDetails } from '@/types';

interface FeaturedMemoriesCarouselProps {
  mediaList: MediaWithDetails[];
  onOpenViewer: (index: number) => void;
}

export function FeaturedMemoriesCarousel({ mediaList, onOpenViewer }: FeaturedMemoriesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const featured = mediaList.slice(0, 10);

  useEffect(() => {
    if (!isPlaying || featured.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlaying, featured.length]);

  if (featured.length === 0) return null;

  const current = featured[currentIndex];
  const isVideo = current.media_type === 'video';
  const displayUrl = current.url || current.thumbnail_url || '';

  return (
    <div className="relative w-full aspect-[21/9] min-h-[220px] max-h-[400px] rounded-3xl overflow-hidden glass-panel border border-white/[0.1] shadow-2xl group select-none">
      {/* Background Image / Video with motion transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 cursor-pointer"
          onClick={() => onOpenViewer(currentIndex)}
        >
          {isVideo ? (
            <video
              src={displayUrl}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={displayUrl}
              alt={current.filename || 'Featured trip memory'}
              className="w-full h-full object-cover"
            />
          )}

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* Top Banner Tag */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-xs font-bold text-cyan-300 flex items-center gap-1.5 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Featured Moments
        </span>
        {isVideo && (
          <span className="px-2.5 py-1 rounded-full bg-rose-500/80 backdrop-blur-xl text-white text-[10px] font-bold flex items-center gap-1">
            <Film className="w-3 h-3" /> Video Clip
          </span>
        )}
      </div>

      {/* Controls: Play/Pause, Lightbox */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying(!isPlaying);
          }}
          className="p-2 rounded-2xl bg-black/50 hover:bg-black/80 backdrop-blur-xl border border-white/10 text-white transition-colors"
          title={isPlaying ? 'Pause Auto-slide' : 'Play Auto-slide'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          onClick={() => onOpenViewer(currentIndex)}
          className="p-2 rounded-2xl bg-black/50 hover:bg-black/80 backdrop-blur-xl border border-white/10 text-white transition-colors"
          title="Full-Screen Lightbox"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between pointer-events-none">
        <div className="space-y-1">
          {current.uploader && (
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 w-fit">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: current.uploader.color || '#6366f1' }}
              />
              <span className="text-xs font-semibold text-slate-200">
                Uploaded by {current.uploader.name}
              </span>
            </div>
          )}

          {current.tags && current.tags.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10 w-fit">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>With: {current.tags.map((t) => t.member?.name).join(', ')}</span>
            </div>
          )}
        </div>

        {/* Indicator dots */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {featured.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentIndex === idx ? 'w-6 bg-cyan-400 shadow-md shadow-cyan-400/50' : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Previous / Next Buttons */}
      {featured.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev - 1 + featured.length) % featured.length);
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev + 1) % featured.length);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
