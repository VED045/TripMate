'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  UploadCloud, 
  Image as ImageIcon, 
  Film, 
  Check, 
  Users, 
  FolderPlus,
  Loader2,
  Sparkles,
  CheckCheck
} from 'lucide-react';
import type { Member, Album } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  members: Member[];
  albums: Album[];
  currentMemberId?: string;
  onSuccess: () => void;
}

export function UploadModal({
  isOpen,
  onClose,
  tripId,
  members,
  albums,
  currentMemberId,
  onSuccess,
}: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>(albums[0]?.id || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFilesSelected = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const newFiles = Array.from(selectedFiles);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleTagMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleTagEveryone = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map((m) => m.id));
      toast.success('Tagged everyone in the crew!');
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one photo or video');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      formData.append('trip_id', tripId);
      if (currentMemberId) formData.append('uploader_id', currentMemberId);
      if (selectedAlbumId) formData.append('album_ids', JSON.stringify([selectedAlbumId]));
      if (selectedMembers.length > 0) formData.append('tag_member_ids', JSON.stringify(selectedMembers));

      setUploadProgress(35);

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(85);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      setUploadProgress(100);
      toast.success(`${files.length} file(s) uploaded in original quality!`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload media');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg raised-card p-6 sm:p-7 space-y-5 my-8 border border-[var(--border)] relative text-left shadow-2xl"
        style={{ background: 'var(--surface-raised)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold font-outfit text-[var(--text-primary)]">
                Upload Trip Memories
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                High-res photos & videos saved to original quality vault
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[var(--surface-inset)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drop Zone */}
        <div>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="inset-card p-6 rounded-2xl bg-[var(--surface-inset)] border-2 border-dashed border-[var(--border)] hover:border-[#2b56ff] cursor-pointer transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#2b56ff]/10 border border-[#2b56ff]/20 flex items-center justify-center text-[#2b56ff] mx-auto mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-extrabold text-[var(--text-primary)] font-outfit">
              Click or drag photos & videos here
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">
              Supports JPG, PNG, HEIC, MP4, MOV (up to 50MB each)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        {/* Selected Files Queue */}
        {files.length > 0 && (
          <div>
            <label className="text-xs font-extrabold text-[var(--text-primary)] mb-2 block">
              Selected Files ({files.length})
            </label>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="inset-card p-1.5 w-20 h-20 rounded-2xl bg-[var(--surface-inset)] border border-[var(--border)] flex-shrink-0 relative overflow-hidden flex flex-col items-center justify-center"
                >
                  {file.type.startsWith('video/') ? (
                    <Film className="w-6 h-6 text-indigo-500 mb-1" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-[var(--accent)] mb-1" />
                  )}
                  <span className="text-[10px] font-semibold text-[var(--text-primary)] truncate w-full text-center px-1 font-mono">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-rose-500 text-white shadow-md hover:scale-110 transition-transform"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tag Members with "Tag Everyone" Button */}
        {members.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-[var(--text-primary)] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" /> Tag Crew Members
              </label>
              <button
                type="button"
                onClick={handleTagEveryone}
                className="text-[11px] font-extrabold text-[var(--accent)] hover:underline flex items-center gap-1 bg-[var(--accent-subtle)] px-2.5 py-1 rounded-full border border-[var(--border)] transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {selectedMembers.length === members.length ? 'Untag All' : 'Tag Everyone'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {members.map((m) => {
                const isTagged = selectedMembers.includes(m.id);
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => toggleTagMember(m.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                      isTagged
                        ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/40 shadow-sm scale-105"
                        : "bg-[var(--surface-inset)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: m.color || '#2b56ff' }}
                    />
                    <span>{m.name}</span>
                    {isTagged && <Check className="w-3 h-3 text-indigo-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Album Selector */}
        {albums.length > 0 && (
          <div>
            <label className="text-xs font-extrabold text-[var(--text-primary)] mb-1.5 block flex items-center gap-1.5">
              <FolderPlus className="w-3.5 h-3.5 text-[var(--accent)]" /> Add to Album
            </label>
            <select
              value={selectedAlbumId}
              onChange={(e) => setSelectedAlbumId(e.target.value)}
              className="w-full inset-field px-3.5 py-2.5 text-xs font-semibold text-[var(--text-primary)] bg-[var(--surface-inset)] border border-[var(--border)] rounded-xl focus:outline-none"
            >
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  📁 {album.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[var(--text-secondary)] font-semibold">
              <span>Uploading to cloud vault...</span>
              <span className="font-mono text-[var(--accent)] font-bold">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--surface-inset)] border border-[var(--border)] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading || files.length === 0}
          className="w-full py-3.5 rounded-2xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading {files.length} Item(s)...</span>
            </>
          ) : (
            `Upload ${files.length > 0 ? `${files.length} File(s) to Vault` : 'Files'}`
          )}
        </button>
      </motion.div>
    </div>
  );
}
