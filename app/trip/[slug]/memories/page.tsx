'use client';

import React, { useState, useEffect } from 'react';
import {
  Camera,
  UploadCloud,
  Heart,
  Film,
  Image as ImageIcon,
  Download,
  FolderPlus,
  Filter,
  Users,
  Sparkles,
  Loader2,
  Play
} from 'lucide-react';
import { useActiveTrip } from '@/components/shared/ActiveTripContext';
import { TripHeader } from '@/components/shared/TripHeader';
import { MediaCard } from '@/components/memories/MediaCard';
import { MediaViewer } from '@/components/memories/MediaViewer';
import { UploadModal } from '@/components/memories/UploadModal';
import { AlbumCard } from '@/components/memories/AlbumCard';
import { FeaturedMemoriesCarousel } from '@/components/memories/FeaturedMemoriesCarousel';
import { EmptyState } from '@/components/shared/EmptyState';
import { GridSkeleton } from '@/components/shared/SkeletonLoader';
import { FloatingActionButton } from '@/components/shared/FloatingActionButton';
import type { MediaWithDetails, Album } from '@/types';
import { toast } from 'sonner';

export default function MemoriesPage() {
  const { trip, members, currentMember, refreshTrip } = useActiveTrip();

  const [mediaList, setMediaList] = useState<MediaWithDetails[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'photos' | 'videos' | 'favorites' | 'albums'>('all');
  const [selectedTagMember, setSelectedTagMember] = useState<string>('all');
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const fetchMemories = async () => {
    if (!trip) return;
    try {
      setIsLoading(true);
      const [mRes, aRes] = await Promise.all([
        fetch(`/api/media?trip_id=${trip.id}`),
        fetch(`/api/albums?trip_id=${trip.id}`),
      ]);

      if (mRes.ok) {
        const mData = await mRes.json();
        setMediaList(mData);
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        setAlbums(aData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [trip?.id]);

  if (!trip) {
    return <div className="p-6"><GridSkeleton /></div>;
  }

  const handleToggleFavorite = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/media/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: !current }),
      });
      if (!res.ok) throw new Error('Failed to update favorite');

      setMediaList((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_favorite: !current } : m))
      );
      toast.success(!current ? 'Added to favorites' : 'Removed from favorites');
    } catch (err) {
      toast.error('Failed to update favorite');
    }
  };

  const handleDeleteMedia = async (id: string) => {
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete media');
      setMediaList((prev) => prev.filter((m) => m.id !== id));
      toast.success('Media removed from trip');
    } catch (err) {
      toast.error('Failed to delete media');
    }
  };

  const handleDownloadAll = async () => {
    if (mediaList.length === 0) return;
    try {
      setIsDownloadingAll(true);
      toast.info('Preparing all original files download links...');
      const res = await fetch(`/api/media/download?trip_id=${trip.id}`);
      if (!res.ok) throw new Error('Download failed');
      const data = await res.json();

      if (data.files && data.files.length > 0) {
        data.files.forEach((f: any, idx: number) => {
          setTimeout(() => {
            const a = document.createElement('a');
            a.href = f.url;
            a.download = f.filename;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }, idx * 300);
        });
        toast.success(`Triggered downloads for ${data.files.length} files`);
      }
    } catch (err) {
      toast.error('Failed to download vault files');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Filter media
  const filteredMedia = mediaList.filter((m) => {
    if (activeTab === 'photos' && m.media_type !== 'photo') return false;
    if (activeTab === 'videos' && m.media_type !== 'video') return false;
    if (activeTab === 'favorites' && !m.is_favorite) return false;
    if (selectedTagMember !== 'all') {
      const isTagged = m.tags?.some((t) => t.member_id === selectedTagMember);
      const isUploader = m.uploader_id === selectedTagMember;
      if (!isTagged && !isUploader) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#050711]">
      <TripHeader title="Trip Memories & Cloud Vault" subtitle="Original quality photos & 4K videos" />

      <main className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6 space-y-6">
        {/* Featured Auto-Sliding Carousel */}
        {mediaList.length > 0 && (
          <FeaturedMemoriesCarousel
            mediaList={mediaList}
            onOpenViewer={(idx) => setViewerIndex(idx)}
          />
        )}

        {/* Top Filter & Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-panel overflow-x-auto max-w-full scrollbar-none">
            {[
              { key: 'all', label: `All (${mediaList.length})`, icon: Sparkles },
              { key: 'photos', label: 'Photos', icon: ImageIcon },
              { key: 'videos', label: 'Videos', icon: Film },
              { key: 'favorites', label: 'Favorites', icon: Heart },
              { key: 'albums', label: `Albums (${albums.length})`, icon: FolderPlus },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${activeTab === key
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Tagged Member Filter */}
            {activeTab !== 'albums' && members.length > 0 && (
              <select
                value={selectedTagMember}
                onChange={(e) => setSelectedTagMember(e.target.value)}
                className="bg-[#0c1228] border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
              >
                <option value="all">Everyone&apos;s Media</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}&apos;s Media
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={handleDownloadAll}
              disabled={isDownloadingAll || mediaList.length === 0}
              className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Download Vault"
            >
              {isDownloadingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Download All</span>
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <UploadCloud className="w-4 h-4" /> Upload Media
            </button>
          </div>
        </div>

        {/* Content View: Albums or Media Grid */}
        {activeTab === 'albums' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {albums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onClick={() => {
                  toast.info(`Viewing album: ${album.name}`);
                  setActiveTab('all');
                }}
              />
            ))}
          </div>
        ) : (
          <div>
            {filteredMedia.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredMedia.map((item, idx) => (
                  <MediaCard
                    key={item.id}
                    media={item}
                    onClick={() => setViewerIndex(idx)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                emoji="📸"
                title="No media in this view"
                description="Upload original resolution trip photos and videos stored securely in the cloud."
                actionLabel="Upload Media"
                onAction={() => setIsUploadModalOpen(true)}
              />
            )}
          </div>
        )}
      </main>

      <FloatingActionButton
        onAddExpense={() => { }}
        onUploadMedia={() => setIsUploadModalOpen(true)}
        onSettleUp={() => { }}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        tripId={trip.id}
        members={members}
        albums={albums}
        currentMemberId={currentMember?.id}
        onSuccess={() => {
          fetchMemories();
          refreshTrip();
        }}
      />

      {viewerIndex !== null && (
        <MediaViewer
          isOpen={viewerIndex !== null}
          onClose={() => setViewerIndex(null)}
          mediaList={filteredMedia}
          initialIndex={viewerIndex}
          onToggleFavorite={handleToggleFavorite}
          onDeleteMedia={handleDeleteMedia}
        />
      )}
    </div>
  );
}
