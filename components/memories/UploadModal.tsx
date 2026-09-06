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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[#0c1228] border border-white/10 rounded-3xl p-6 shadow-2xl relative my-8"
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-outfit text-white">Upload Trip Memories</h2>
              <p className="text-xs text-slate-400">High-res photos & videos saved in the cloud</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop Zone */}
        <div className="mt-5">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border-2 border-dashed border-white/15 hover:border-cyan-400/50 cursor-pointer transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white">Click or drag photos & videos here</p>
            <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, HEIC, MP4, MOV (up to 50MB each)</p>
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
          <div className="mt-4">
            <label className="text-xs font-semibold text-slate-300 mb-2 block">
              Selected Files ({files.length})
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="relative group w-20 h-20 rounded-2xl bg-slate-800 border border-white/10 flex-shrink-0 overflow-hidden flex flex-col items-center justify-center p-1"
                >
                  {file.type.startsWith('video/') ? (
                    <Film className="w-6 h-6 text-indigo-400 mb-1" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-cyan-400 mb-1" />
                  )}
                  <span className="text-[9px] text-slate-300 truncate w-full text-center px-1">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-red-500 text-white shadow-md hover:scale-110 transition-transform"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tag Members with "Tag Everyone" Button */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" /> Tag People
            </label>
            <button
              type="button"
              onClick={handleTagEveryone}
              className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20"
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isTagged
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'bg-white/[0.04] text-slate-400 border border-white/5 hover:text-white'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: m.color || '#6366f1' }}
                  />
                  <span>{m.name}</span>
                  {isTagged && <Check className="w-3 h-3 text-cyan-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Album Selector */}
        {albums.length > 0 && (
          <div className="mt-4">
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block flex items-center gap-1.5">
              <FolderPlus className="w-3.5 h-3.5 text-cyan-400" /> Add to Album
            </label>
            <select
              value={selectedAlbumId}
              onChange={(e) => setSelectedAlbumId(e.target.value)}
              className="w-full bg-[#0a0f24] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
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
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Uploading to cloud vault...</span>
              <span className="font-mono text-cyan-400 font-bold">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading || files.length === 0}
          className="w-full mt-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
