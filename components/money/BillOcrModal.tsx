'use client';

import React, { useState } from 'react';
import { Camera, Upload, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GradientButton } from '@/components/ui/Button';
import { scanReceiptImage, type OcrResult } from '@/lib/ai/ocrScanner';
import type { Member, ItemFormRow } from '@/types';
import { toast } from 'sonner';

interface BillOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onApplyOcr: (result: OcrResult) => void;
}

export function BillOcrModal({
  isOpen,
  onClose,
  members,
  onApplyOcr,
}: BillOcrModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setOcrResult(null);

    try {
      setIsScanning(true);
      toast.info('Scanning receipt with AI OCR...');
      const result = await scanReceiptImage(file);
      setOcrResult(result);
      if (result.items.length > 0) {
        toast.success(`Extracted ${result.items.length} items from receipt!`);
      } else {
        toast.warning('Scanned text, but could not detect line items automatically. You can add them manually.');
      }
    } catch (err) {
      console.error(err);
      toast.error('OCR scan failed. You can enter details manually.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirm = () => {
    if (ocrResult) {
      // Auto assign all active members to extracted items if unassigned
      const updatedItems = ocrResult.items.map(item => ({
        ...item,
        assignments: item.assignments.length > 0
          ? item.assignments
          : members.map(m => ({ memberId: m.id, quantity: item.quantity / (members.length || 1) }))
      }));

      onApplyOcr({ ...ocrResult, items: updatedItems });
      toast.success('Applied OCR items to expense!');
      onClose();
      setImagePreview(null);
      setOcrResult(null);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Scan Bill / Receipt (AI OCR)"
      subtitle="Upload or capture restaurant & hotel bills"
    >
      <div className="p-5 space-y-4">
        {/* File upload container */}
        {!imagePreview && (
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[var(--border-strong)] rounded-2xl bg-[var(--surface-inset)] cursor-pointer hover:border-[var(--accent)] transition-all">
            <Camera className="w-8 h-8 text-[var(--accent)] mb-2" />
            <span className="text-xs font-bold text-[var(--text-primary)]">Take Photo or Upload Receipt</span>
            <span className="text-[10px] text-[var(--text-muted)] mt-1">Supports PNG, JPG, WEBP</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        )}

        {/* Image preview + Scanning indicator */}
        {imagePreview && (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] max-h-48 flex justify-center bg-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Receipt preview" className="object-contain max-h-48" />
              {isScanning && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                  <span className="text-xs font-bold font-mono">Running OCR Scanner...</span>
                </div>
              )}
            </div>

            <label className="block text-center text-xs font-semibold text-[var(--accent)] cursor-pointer hover:underline">
              Change image
              <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            </label>
          </div>
        )}

        {/* OCR Result Preview */}
        {ocrResult && (
          <div className="raised-card p-4 space-y-3 bg-[var(--surface-raised)] border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold font-outfit text-[var(--text-primary)]">
                  {ocrResult.merchant || 'Extracted Receipt Details'}
                </h4>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Subtotal: ₹{ocrResult.subtotal.toFixed(2)} · GST: {ocrResult.gstPercent}% · Total: ₹{ocrResult.total.toFixed(2)}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--success-light)] text-[var(--success)]">
                {ocrResult.items.length} items
              </span>
            </div>

            {/* Extracted items */}
            {ocrResult.items.length > 0 ? (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {ocrResult.items.map((item, idx) => (
                  <div key={idx} className="inset-card p-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--text-primary)]">{item.name}</span>
                    <span className="font-mono text-[var(--text-secondary)]">
                      {item.quantity} × ₹{item.unitPriceRupees} = ₹{(item.quantity * item.unitPriceRupees).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[var(--pending-bg)] text-xs text-[var(--warning)] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>No distinct items extracted. Total amount can still be applied.</span>
              </div>
            )}

            <GradientButton
              gradient="emerald"
              size="md"
              fullWidth
              onClick={handleConfirm}
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply Extracted Items to Expense
            </GradientButton>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
