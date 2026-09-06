'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Heart, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Play, 
  Pause,
  Maximize2,
  Calendar,
  Users
} from 'lucide-react';
import type { MediaWithDetails } from '@/types';
import { toast } from 'sonner';

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  mediaList: MediaWithDetails[];
  initialIndex: number;
  onToggleFavorite?: (id: string, current: boolean) => void;
  onDeleteMedia?: (id: string) => void;
}

export function MediaViewer({
  isOpen,
  onClose,
  mediaList,
  initialIndex,
  onToggleFavorite,
  onDeleteMedia,
}: MediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlayingSlideshow, setIsPlayingSlideshow] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const currentMedia = mediaList[currentIndex];

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % mediaList.length);
  }, [mediaList.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
  }, [mediaList.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Slideshow timer
  useEffect(() => {
    if (!isPlayingSlideshow || !isOpen) return;
    const interval = setInterval(handleNext, 3500);
    return () => clearInterval(interval);
  }, [isPlayingSlideshow, isOpen, handleNext]);

  if (!isOpen || !currentMedia) return null;

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/media/download?id=${currentMedia.id}`);
      if (!res.ok) throw new Error('Failed to get download URL');
      const data = await res.json();
      
      const link = document.createElement('a');
      link.href = data.url;
      link.download = data.filename || 'trip-memory';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started in original quality');
    } catch (err) {
      toast.error('Failed to download image');
    }
  };

  const isVideo = currentMedia.media_type === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl">
      {/* Top Action Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3 text-white">
          <span className="text-sm font-medium text-slate-300">
            {currentIndex + 1} / {mediaList.length}
          </span>
          {currentMedia.uploader && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-xs">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: currentMedia.uploader.color || '#6366f1' }}
              />
              <span>{currentMedia.uploader.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Slideshow button */}
          <button
            onClick={() => setIsPlayingSlideshow(!isPlayingSlideshow)}
            className={`p-2 rounded-xl backdrop-blur-md transition-colors ${
              isPlayingSlideshow ? 'bg-cyan-500 text-white' : 'bg-white/10 text-slate-200 hover:text-white'
            }`}
            title={isPlayingSlideshow ? 'Pause Slideshow' : 'Play Slideshow'}
          >
            {isPlayingSlideshow ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Download button */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors"
            title="Download Original Quality"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Favorite button */}
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(currentMedia.id, currentMedia.is_favorite)}
              className={`p-2 rounded-xl transition-colors ${
                currentMedia.is_favorite ? 'bg-rose-500 text-white' : 'bg-white/10 text-slate-200 hover:text-white'
              }`}
              title="Favorite"
            >
              <Heart className={`w-4 h-4 ${currentMedia.is_favorite ? 'fill-white' : ''}`} />
            </button>
          )}

          {/* Delete button */}
          {onDeleteMedia && (
            <button
              onClick={() => {
                if (confirm('Delete this photo permanently?')) {
                  onDeleteMedia(currentMedia.id);
                  if (mediaList.length > 1) {
                    handleNext();
                  } else {
                    onClose();
                  }
                }
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-slate-200 hover:text-white transition-colors"
              title="Delete Photo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12 select-none">
        {isVideo ? (
          <video
            src={currentMedia.url || ''}
            controls
            autoPlay
            className="max-h-[85vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain"
          />
        ) : (
          <motion.img
            key={currentMedia.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            src={currentMedia.url || currentMedia.thumbnail_url || ''}
            alt={currentMedia.filename || 'Trip photo'}
            className="max-h-[85vh] max-w-[90vw] rounded-2xl shadow-2xl object-contain"
          />
        )}

        {/* Previous Button */}
        {mediaList.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all hover:scale-110 border border-white/10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button */}
        {mediaList.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md transition-all hover:scale-110 border border-white/10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom info tags */}
      {currentMedia.tags && currentMedia.tags.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs text-slate-300">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>Tagged:</span>
          {currentMedia.tags.map((t, idx) => (
            <span key={idx} className="font-semibold text-white">
              {t.member?.name}
              {idx < currentMedia.tags.length - 1 ? ',' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
