'use client';

import React, { useState, useRef } from 'react';
import { QrCode, Copy, Share2, Smartphone, Edit3, Check, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { generateUpiQrUrl } from '@/lib/upi';
import type { Member } from '@/types';
import { toast } from 'sonner';
import { useActiveTrip } from '@/components/shared/ActiveTripContext';

interface MemberQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  tripName: string;
}

export function MemberQrModal({
  isOpen,
  onClose,
  member,
  tripName,
}: MemberQrModalProps) {
  const { refreshTrip } = useActiveTrip();
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [newUpiId, setNewUpiId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!member) return null;

  const upiId = isEditingUpi ? newUpiId : (member.upi_id || '');
  const autoQrUrl = upiId
    ? generateUpiQrUrl({ payeeUpiId: upiId, payeeName: member.name, amountRupees: 0, note: `Settlement for ${tripName}` })
    : '';

  // Use custom uploaded QR image if present, else fallback to auto-generated QR URL
  const qrDisplayUrl = member.qr_code_url || autoQrUrl;

  const handleCopyUpi = () => {
    if (upiId) {
      navigator.clipboard.writeText(upiId);
      toast.success('UPI ID copied to clipboard!');
    }
  };

  const handleSaveUpi = async () => {
    if (!newUpiId.trim()) return;
    try {
      setIsSaving(true);
      const res = await fetch('/api/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: member.id, upi_id: newUpiId.trim() }),
      });
      if (!res.ok) throw new Error('Failed to update UPI ID');
      toast.success('UPI ID updated!');
      setIsEditingUpi(false);
      refreshTrip();
    } catch {
      toast.error('Failed to save UPI ID');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WEBP)');
      return;
    }

    // Limit size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        setIsSaving(true);
        const res = await fetch('/api/members', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: member.id, qr_code_url: dataUrl }),
        });
        if (!res.ok) throw new Error('Failed to save QR code');
        toast.success('Personal QR code image uploaded!');
        refreshTrip();
      } catch {
        toast.error('Failed to upload QR code');
      } finally {
        setIsSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomQr = async () => {
    if (!confirm('Remove personal uploaded QR code image?')) return;
    try {
      setIsSaving(true);
      const res = await fetch('/api/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: member.id, qr_code_url: null }),
      });
      if (!res.ok) throw new Error('Failed to remove custom QR');
      toast.success('Reverted to auto-generated QR code.');
      refreshTrip();
    } catch {
      toast.error('Failed to remove custom QR');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    const msg = `Pay ${member.name}${upiId ? ` via UPI (${upiId})` : ''}\nTrip: ${tripName}`;
    try {
      if (navigator.share) {
        await navigator.share({ text: msg });
      } else {
        await navigator.clipboard.writeText(msg);
        toast.success('UPI details copied!');
      }
    } catch {}
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={`${member.name}'s Payment QR Code`}
      subtitle="Scan to pay directly via GPay, PhonePe, or Paytm"
    >
      <div className="p-5 space-y-4 flex flex-col items-center text-center">
        <Avatar name={member.name} color={member.color} size="lg" />
        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)] font-outfit">{member.name}</h3>
          
          {isEditingUpi ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                placeholder="e.g. name@upi or +91 9876543210"
                value={newUpiId}
                onChange={(e) => setNewUpiId(e.target.value)}
                className="inset-field px-3 py-1.5 text-xs font-mono text-[var(--text-primary)]"
                autoFocus
              />
              <button
                onClick={handleSaveUpi}
                disabled={isSaving}
                className="p-1.5 rounded-xl text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <p className="text-xs font-mono text-[var(--text-muted)]">{upiId || 'No UPI ID registered'}</p>
              <button
                onClick={() => { setNewUpiId(member.upi_id || ''); setIsEditingUpi(true); }}
                className="text-[11px] font-bold hover:underline flex items-center gap-0.5 ml-1"
                style={{ color: 'var(--accent)' }}
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />

        {qrDisplayUrl ? (
          <div className="raised-card p-4 space-y-3 bg-[var(--surface-raised)] border border-[var(--border)] max-w-xs w-full flex flex-col items-center">
            <div className="relative p-3 bg-white rounded-2xl shadow-md">
              {/* eslint-disable-next-html-element-suppress */}
              <img src={qrDisplayUrl} alt={`${member.name} Payment QR`} className="w-44 h-44 object-contain rounded-lg" />
              {member.qr_code_url && (
                <span className="absolute bottom-1 right-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-bold shadow">
                  Custom Uploaded
                </span>
              )}
            </div>

            <p className="text-[10px] text-[var(--text-muted)]">
              {member.qr_code_url ? 'Personal uploaded QR Code' : 'Auto-generated UPI QR Code'}
            </p>

            {/* Upload / Replace Actions */}
            <div className="flex gap-2 w-full pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> {member.qr_code_url ? 'Replace QR' : 'Upload QR'}
              </button>

              {member.qr_code_url && (
                <button
                  type="button"
                  onClick={handleRemoveCustomQr}
                  disabled={isSaving}
                  className="py-2 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors"
                  title="Remove uploaded image and revert to auto-generated QR"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex gap-2 w-full pt-1">
              {upiId && (
                <button
                  onClick={handleCopyUpi}
                  className="flex-1 py-2 px-3 rounded-xl inset-card text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[var(--surface-inset)]"
                >
                  <Copy className="w-3.5 h-3.5 text-[var(--accent)]" /> Copy UPI
                </button>
              )}
              <button
                onClick={handleShare}
                className="flex-1 py-2 px-3 rounded-xl inset-card text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[var(--surface-inset)]"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-500" /> Share
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl inset-card text-xs text-[var(--text-muted)] max-w-xs space-y-3 w-full">
            <p className="font-medium text-[var(--text-secondary)]">No QR Code available yet for {member.name}.</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 rounded-xl text-white text-xs font-bold shadow-md flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
              >
                <Upload className="w-4 h-4" /> Upload Personal QR Code Image
              </button>
              <button
                onClick={() => { setNewUpiId(''); setIsEditingUpi(true); }}
                className="w-full py-2 px-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] text-xs font-bold"
              >
                + Enter UPI ID to Auto-Generate
              </button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
