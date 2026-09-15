'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  User,
  QrCode,
  Copy,
  Share2,
  Check,
  Edit3,
  Smartphone,
  ShieldCheck,
  Wallet,
  ArrowRight,
  HandCoins,
  Sparkles,
  Upload,
  Trash2,
  Image as ImageIcon,
  Crown,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { useActiveTrip } from '@/components/shared/ActiveTripContext';
import { TripHeader } from '@/components/shared/TripHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatRupees } from '@/lib/currency';
import { generateUpiDeepLink, generateUpiQrUrl, validateUpiId } from '@/lib/upi';
import { formatWhatsAppUrl } from '@/lib/contacts';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SettleUpModal } from '@/components/money/SettleUpModal';
import type { SimplifiedDebt, Member } from '@/types';

const COLOR_PALETTE = [
  '#2b56ff', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

export default function ProfilePage() {
  const { trip, members, currentMember, refreshTrip } = useActiveTrip();

  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [customAmountRupees, setCustomAmountRupees] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [simplifiedDebts, setSimplifiedDebts] = useState<SimplifiedDebt[]>([]);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [selectedDebtForSettle, setSelectedDebtForSettle] = useState<SimplifiedDebt | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentMember) {
      setName(currentMember.name || '');
      setUpiId(currentMember.upi_id || '');
      setPhone(currentMember.phone || '');
      setSelectedColor(currentMember.color || COLOR_PALETTE[0]);
    }
  }, [currentMember]);

  useEffect(() => {
    if (!trip) return;
    fetch(`/api/settlements?trip_id=${trip.id}`)
      .then(res => res.json())
      .then(data => {
        setSimplifiedDebts(data.simplifiedDebts || []);
      })
      .catch(console.error);
  }, [trip]);

  if (!trip || !currentMember) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" style={{ background: 'var(--background)' }}>
        <p className="text-sm text-[var(--text-muted)]">Loading profile...</p>
      </div>
    );
  }

  const isCreator = Boolean(
    currentMember.is_admin ||
    (trip.created_by && currentMember.id === trip.created_by) ||
    (members.length > 0 && members[0]?.id === currentMember.id)
  );

  const testAmountNumber = parseFloat(customAmountRupees || '0');

  const upiDeepLink = upiId
    ? generateUpiDeepLink({
        payeeUpiId: upiId,
        payeeName: currentMember.name,
        amountRupees: testAmountNumber > 0 ? testAmountNumber : undefined,
        note: `Settlement for ${trip.name}`,
      })
    : '';

  const autoQrUrl = upiId
    ? generateUpiQrUrl({
        payeeUpiId: upiId,
        payeeName: currentMember.name,
        amountRupees: testAmountNumber > 0 ? testAmountNumber : undefined,
        note: `Settlement for ${trip.name}`,
      })
    : '';

  const activeQrCodeUrl = currentMember.qr_code_url || autoQrUrl;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    if (upiId.trim()) {
      const validation = validateUpiId(upiId.trim());
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid UPI ID format');
        return;
      }
    }

    try {
      setIsSaving(true);
      const res = await fetch('/api/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentMember.id,
          name: name.trim(),
          upi_id: upiId.trim() || null,
          phone: phone.trim() || null,
          color: selectedColor,
        }),
      });

      if (!res.ok) throw new Error('Failed to update profile');

      toast.success('Profile details updated successfully!');
      refreshTrip();
    } catch {
      toast.error('Could not save profile settings');
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
          body: JSON.stringify({ id: currentMember.id, qr_code_url: dataUrl }),
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
        body: JSON.stringify({ id: currentMember.id, qr_code_url: null }),
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

  const handleCopyUpi = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    toast.success('UPI ID copied to clipboard!');
  };

  const handleShareQr = async () => {
    const shareText = `Pay ${currentMember.name}${upiId ? ` via UPI (${upiId})` : ''}${testAmountNumber > 0 ? ` for amount ₹${testAmountNumber}` : ''}\nTrip: ${trip.name}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${currentMember.name}'s UPI QR`, text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success('UPI payment details copied!');
      }
    } catch {}
  };

  const handleRemindMemberOnWhatsApp = async (payerMember: Member | undefined, debtAmountRupees: number) => {
    if (!payerMember) return;

    const reminderMessage = `Hi ${payerMember.name} 👋, kindly settle your pending payment of ₹${debtAmountRupees.toFixed(2)} for ${trip.name}.${currentMember.upi_id ? `\nMy UPI ID is: ${currentMember.upi_id}` : ''}`;

    let targetPhone = payerMember.phone;
    if (!targetPhone) {
      const entered = prompt(
        `Enter ${payerMember.name}'s phone number to open their direct WhatsApp chat:`,
        ''
      );
      if (entered && entered.trim()) {
        targetPhone = entered.trim();
        try {
          await fetch('/api/members', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: payerMember.id, phone: targetPhone }),
          });
          toast.success(`Saved ${payerMember.name}'s phone number!`);
          refreshTrip();
        } catch (e) {
          // continue
        }
      }
    }

    const whatsappUrl = formatWhatsAppUrl(targetPhone, reminderMessage);
    window.open(whatsappUrl, '_blank');
  };

  // Debts related to current member
  const myDebtsOwedByMe = simplifiedDebts.filter(d => (d.from_member_id || d.fromMemberId) === currentMember.id);
  const myDebtsOwedToMe = simplifiedDebts.filter(d => (d.to_member_id || d.toMemberId) === currentMember.id);

  const totalOwedByMePaise = myDebtsOwedByMe.reduce((acc, d) => acc + (d.amount_paise || d.amountPaise || 0), 0);
  const totalOwedToMePaise = myDebtsOwedToMe.reduce((acc, d) => acc + (d.amount_paise || d.amountPaise || 0), 0);
  const netBalancePaise = totalOwedToMePaise - totalOwedByMePaise;

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--background)' }}>
      <TripHeader title="My Profile" subtitle="Manage your personal details & UPI QR Code" />

      <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-6 space-y-6 pb-nav">

        {/* User Card */}
        <div className="raised-card p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
          <Avatar name={currentMember.name} color={selectedColor} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-extrabold font-outfit text-[var(--text-primary)] truncate">
                {currentMember.name}
              </h2>
              {isCreator ? (
                <Badge variant="info" size="xs">
                  <ShieldCheck className="w-3 h-3 mr-0.5" /> Creator
                </Badge>
              ) : (
                <Badge variant="default" size="xs">Member</Badge>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] font-mono">
              Trip: {trip.name} {phone ? `• 📱 ${phone}` : ''}
            </p>
            {upiId ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold font-mono mt-1 flex items-center justify-center sm:justify-start gap-1">
                <QrCode className="w-3.5 h-3.5" /> {upiId}
              </p>
            ) : (
              <p className="text-xs text-amber-500 font-medium mt-1">
                ⚠️ No UPI ID added yet. Upload your personal QR code or add your UPI ID below!
              </p>
            )}
          </div>
          {isCreator && (
            <Link
              href={`/trip/${trip.slug}/settings`}
              className="px-3.5 py-2 rounded-xl bg-[var(--surface-inset)] border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
            >
              Trip Settings <ArrowRight className="w-3.5 h-3.5" />
            </Link>
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

        {/* Edit Profile & UPI Details */}
        <form onSubmit={handleSaveProfile} className="raised-card p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="text-sm font-extrabold font-outfit uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[var(--accent)]" /> Profile & Contact Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Your Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full inset-field px-3.5 py-2.5 text-xs font-semibold text-[var(--text-primary)]"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full inset-field px-3.5 py-2.5 text-xs font-mono font-semibold text-[var(--text-primary)]"
              />
            </div>

            {/* UPI ID */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Your UPI ID (VPA)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="e.g. name@okicici"
                className="w-full inset-field px-3.5 py-2.5 text-xs font-mono font-semibold text-[var(--text-primary)]"
              />
            </div>
          </div>

          {/* Color theme selection */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
              Your Member Accent Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PALETTE.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={cn(
                    'w-7 h-7 rounded-full transition-transform flex items-center justify-center',
                    selectedColor === c ? 'scale-110 ring-2 ring-offset-2 ring-[var(--accent)]' : 'hover:scale-105'
                  )}
                  style={{ background: c }}
                >
                  {selectedColor === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
            >
              {isSaving ? 'Saving Changes...' : 'Save Profile Details'}
            </button>
          </div>
        </form>

        {/* Personal QR Code Manager Card */}
        <div className="raised-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="text-sm font-extrabold font-outfit uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[var(--accent)]" /> Personal Payment QR Code
            </h3>
            {currentMember.qr_code_url ? (
              <Badge variant="success" size="xs">Personal Uploaded QR</Badge>
            ) : upiId ? (
              <Badge variant="info" size="xs">Auto-Generated QR</Badge>
            ) : (
              <Badge variant="default" size="xs">Not Configured</Badge>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* QR Image Box */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-lg flex flex-col items-center flex-shrink-0 relative">
              {activeQrCodeUrl ? (
                /* eslint-disable-next-html-element-suppress */
                <img
                  src={activeQrCodeUrl}
                  alt="Personal Payment QR Code"
                  className="w-48 h-48 object-contain rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 rounded-lg bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                  <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-xs font-semibold">No QR Code Uploaded</p>
                </div>
              )}
              <div className="mt-2 text-center">
                <p className="text-xs font-bold text-slate-800 font-outfit">{currentMember.name}</p>
                {upiId && <p className="text-[10px] font-mono text-slate-500">{upiId}</p>}
                {testAmountNumber > 0 && (
                  <p className="text-xs font-extrabold text-indigo-600 font-outfit mt-0.5">
                    ₹{testAmountNumber.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            {/* Upload & Action Controls */}
            <div className="flex-1 space-y-4 w-full">
              <div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] font-outfit mb-1">
                  Upload Your Personal QR Code Screenshot
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Upload a screenshot of your Paytm, GPay, or PhonePe QR code so companions scan your exact personal QR image directly.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                  className="py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  <Upload className="w-4 h-4" />
                  <span>{currentMember.qr_code_url ? 'Replace Personal QR Image' : 'Upload Personal QR Image'}</span>
                </button>

                {currentMember.qr_code_url && (
                  <button
                    type="button"
                    onClick={handleRemoveCustomQr}
                    disabled={isSaving}
                    className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors flex items-center gap-1.5"
                    title="Remove uploaded screenshot and revert to auto-generated UPI QR"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Revert to Auto-QR
                  </button>
                )}
              </div>

              {/* Dynamic Custom Amount Generator */}
              <div className="pt-2 border-t border-[var(--border)]">
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Test / Scan with Custom Amount (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--text-muted)]">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={customAmountRupees}
                    onChange={e => setCustomAmountRupees(e.target.value)}
                    placeholder="e.g. 500 (leave empty for open amount)"
                    className="w-full inset-field pl-8 pr-3.5 py-2 text-xs font-bold text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {upiId && (
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="py-2.5 px-3 rounded-xl bg-[var(--surface-inset)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-[var(--accent)]" /> Copy UPI ID
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleShareQr}
                  className="py-2.5 px-3 rounded-xl bg-[var(--surface-inset)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-500" /> Share QR Details
                </button>

                {upiDeepLink && (
                  <a
                    href={upiDeepLink}
                    target="_blank"
                    rel="noreferrer"
                    className="sm:col-span-2 py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Smartphone className="w-4 h-4" /> Open Payment in GPay / PhonePe / Paytm
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* My Settlement Debts & Receivables Section */}
        <div className="raised-card p-5 sm:p-6 space-y-5 border border-[var(--border)]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h3 className="text-sm font-extrabold font-outfit uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-emerald-500" /> My Debts & Settlements
            </h3>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--surface-inset)] text-[var(--text-secondary)] border border-[var(--border)] font-mono">
              {myDebtsOwedByMe.length + myDebtsOwedToMe.length} Pending
            </span>
          </div>

          {/* Net Summary Hero Banner */}
          {myDebtsOwedByMe.length > 0 || myDebtsOwedToMe.length > 0 ? (
            <div className="inset-card bg-[var(--surface-inset)] border border-[var(--border)] p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-inner">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold shadow-md ${
                  netBalancePaise > 0
                    ? 'bg-emerald-500'
                    : netBalancePaise < 0
                    ? 'bg-rose-500'
                    : 'bg-indigo-500'
                }`}>
                  {netBalancePaise > 0 ? (
                    <ArrowDownLeft className="w-5 h-5 text-white" />
                  ) : netBalancePaise < 0 ? (
                    <ArrowUpRight className="w-5 h-5 text-white" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] font-mono">
                    Net Standing Position
                  </p>
                  <p className={`text-base font-extrabold font-outfit mt-0.5 ${
                    netBalancePaise > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : netBalancePaise < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-[var(--text-primary)]'
                  }`}>
                    {netBalancePaise > 0
                      ? `Net Receivable +${formatRupees(netBalancePaise)}`
                      : netBalancePaise < 0
                      ? `Net Payable -${formatRupees(Math.abs(netBalancePaise))}`
                      : 'Balanced Out (₹0.00)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold font-mono self-end sm:self-center bg-[var(--surface-raised)] px-3.5 py-2 rounded-xl border border-[var(--border)] shadow-sm">
                <div className="text-right">
                  <span className="block text-[9px] font-extrabold text-rose-500 uppercase tracking-wider">Owed By You</span>
                  <span className="text-rose-600 dark:text-rose-400 text-xs font-black">{formatRupees(totalOwedByMePaise)}</span>
                </div>
                <div className="h-6 w-px bg-[var(--border)]" />
                <div className="text-right">
                  <span className="block text-[9px] font-extrabold text-emerald-500 uppercase tracking-wider">Owed To You</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-black">{formatRupees(totalOwedToMePaise)}</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Cards List */}
          {myDebtsOwedByMe.length === 0 && myDebtsOwedToMe.length === 0 ? (
            <div className="py-8 px-4 text-center rounded-2xl bg-[var(--surface-inset)] border border-[var(--border)] space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-extrabold font-outfit text-[var(--text-primary)]">
                All Settled Up! 🎉
              </h4>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                You have zero active debts or pending collections for this trip. Everything is balanced!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Debts I Owe Section */}
              {myDebtsOwedByMe.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold font-outfit text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Debts You Need to Settle ({myDebtsOwedByMe.length})
                    </span>
                  </div>

                  {myDebtsOwedByMe.map(debt => {
                    const payee = members.find(m => m.id === (debt.to_member_id || debt.toMemberId));
                    const isPayeeCreator = payee && Boolean(
                      payee.is_admin ||
                      (trip.created_by && payee.id === trip.created_by) ||
                      (members.length > 0 && members[0]?.id === payee.id)
                    );
                    const debtAmountPaise = debt.amount_paise || debt.amountPaise || 0;
                    const debtAmountRupees = debtAmountPaise / 100;

                    const payeeUpiDeepLink = payee?.upi_id
                      ? generateUpiDeepLink({
                          payeeUpiId: payee.upi_id,
                          payeeName: payee.name,
                          amountRupees: debtAmountRupees,
                          note: `Settlement to ${payee.name} for ${trip.name}`,
                        })
                      : '';

                    return (
                      <div
                        key={`${debt.from_member_id}-${debt.to_member_id}`}
                        className="p-4 rounded-2xl bg-[var(--surface-inset)] border border-rose-500/20 hover:border-rose-500/40 transition-all shadow-sm space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative">
                              <Avatar name={payee?.name || 'Member'} color={payee?.color} size="md" />
                              {isPayeeCreator && (
                                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500 absolute -top-1 -right-1 drop-shadow-sm" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-extrabold text-[var(--text-primary)] font-outfit truncate">
                                  {payee?.name || 'Companion'}
                                </p>
                                {isPayeeCreator && (
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    Creator
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[var(--text-muted)] font-mono truncate mt-0.5">
                                {payee?.upi_id ? `UPI: ${payee.upi_id}` : 'No UPI ID provided'}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">You Owe</p>
                            <p className="text-base font-extrabold text-rose-600 dark:text-rose-400 font-outfit">
                              {formatRupees(debtAmountPaise)}
                            </p>
                          </div>
                        </div>

                        {/* Action Toolbar */}
                        <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)] flex-wrap sm:flex-nowrap">
                          {payeeUpiDeepLink && (
                            <a
                              href={payeeUpiDeepLink}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-sm hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5 min-w-[120px]"
                            >
                              <Smartphone className="w-3.5 h-3.5" /> 1-Tap Pay UPI
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDebtForSettle(debt);
                              setIsSettleModalOpen(true);
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs shadow-sm hover:bg-[#2b56ff] hover:text-white transition-all flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" /> Record Settlement
                          </button>

                          {payee?.upi_id && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(payee.upi_id!);
                                toast.success(`Copied ${payee.name}'s UPI ID!`);
                              }}
                              className="p-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                              title="Copy Payee UPI ID"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Debts Owed To Me Section */}
              {myDebtsOwedToMe.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold font-outfit text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Money Owed to You ({myDebtsOwedToMe.length})
                    </span>
                  </div>

                  {myDebtsOwedToMe.map(debt => {
                    const payer = members.find(m => m.id === (debt.from_member_id || debt.fromMemberId));
                    const isPayerCreator = payer && Boolean(
                      payer.is_admin ||
                      (trip.created_by && payer.id === trip.created_by) ||
                      (members.length > 0 && members[0]?.id === payer.id)
                    );
                    const debtAmountPaise = debt.amount_paise || debt.amountPaise || 0;
                    const debtAmountRupees = debtAmountPaise / 100;

                    const reminderMessage = `Hi ${payer?.name || 'there'} 👋, kindly settle your pending payment of ₹${debtAmountRupees.toFixed(2)} for ${trip.name}.${currentMember.upi_id ? `\nMy UPI ID is: ${currentMember.upi_id}` : ''}`;
                    const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(reminderMessage)}`;

                    return (
                      <div
                        key={`${debt.from_member_id}-${debt.to_member_id}`}
                        className="p-4 rounded-2xl bg-[var(--surface-inset)] border border-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-sm space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative">
                              <Avatar name={payer?.name || 'Member'} color={payer?.color} size="md" />
                              {isPayerCreator && (
                                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500 absolute -top-1 -right-1 drop-shadow-sm" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-extrabold text-[var(--text-primary)] font-outfit truncate">
                                  {payer?.name || 'Companion'}
                                </p>
                                {isPayerCreator && (
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    Creator
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[var(--text-muted)] font-mono truncate mt-0.5">
                                {payer?.phone ? `📱 ${payer.phone}` : `Awaiting payment from ${payer?.name}`}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Owes You</p>
                            <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-outfit">
                              +{formatRupees(debtAmountPaise)}
                            </p>
                          </div>
                        </div>

                        {/* Action Toolbar */}
                        <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)] flex-wrap sm:flex-nowrap">
                          <button
                            type="button"
                            onClick={() => handleRemindMemberOnWhatsApp(payer, debtAmountRupees)}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5 min-w-[130px]"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Remind on WhatsApp
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDebtForSettle(debt);
                              setIsSettleModalOpen(true);
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] font-bold text-xs shadow-sm hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" /> Mark Received
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Settle Up Modal */}
      {isSettleModalOpen && (
        <SettleUpModal
          isOpen={isSettleModalOpen}
          onClose={() => {
            setIsSettleModalOpen(false);
            setSelectedDebtForSettle(null);
          }}
          tripId={trip.id}
          tripName={trip.name}
          members={members}
          simplifiedDebts={simplifiedDebts}
          currentMemberId={currentMember.id}
          initialDebt={selectedDebtForSettle}
          onSuccess={() => {
            refreshTrip();
            fetch(`/api/settlements?trip_id=${trip.id}`)
              .then(res => res.json())
              .then(d => setSimplifiedDebts(d.simplifiedDebts || []));
          }}
        />
      )}
    </div>
  );
}
