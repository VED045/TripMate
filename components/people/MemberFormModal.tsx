'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, Smartphone, Check, Phone, Contact } from 'lucide-react';
import { toast } from 'sonner';
import { pickPhoneContacts, parseVcfContent } from '@/lib/contacts';
import { CustomSelect } from '@/components/ui/CustomSelect';
import type { Member } from '@/types';

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  memberToEdit?: Member | null;
  onSuccess: () => void;
}

const MEMBER_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316', 
  '#10b981', '#06b6d4', '#eab308', '#ef4444', 
  '#84cc16', '#f43f5e', '#14b8a6', '#a855f7'
];

export function MemberFormModal({
  isOpen,
  onClose,
  tripId,
  memberToEdit,
  onSuccess,
}: MemberFormModalProps) {
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('member');
  const [selectedColor, setSelectedColor] = useState(MEMBER_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const vcfInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (memberToEdit) {
        setName(memberToEdit.name || '');
        setUpiId(memberToEdit.upi_id || '');
        setPhone(memberToEdit.phone || '');
        setSelectedColor(memberToEdit.color || MEMBER_COLORS[0]);
      } else {
        setName('');
        setUpiId('');
        setPhone('');
        setSelectedColor(MEMBER_COLORS[0]);
      }
    }
  }, [isOpen, memberToEdit]);

  if (!isOpen) return null;

  const handlePickContact = async () => {
    try {
      const results = await pickPhoneContacts();
      if (results.length > 0) {
        const picked = results[0];
        if (picked.name) setName(picked.name);
        if (picked.phone) setPhone(picked.phone);
        toast.success(`Imported ${picked.name} from contacts!`);
        return;
      }
      // If Web Contacts API not supported, trigger VCF picker
      vcfInputRef.current?.click();
    } catch (e) {
      vcfInputRef.current?.click();
    }
  };

  const handleVcfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const parsed = parseVcfContent(text);
      if (parsed.length > 0) {
        const picked = parsed[0];
        if (picked.name) setName(picked.name);
        if (picked.phone) setPhone(picked.phone);
        toast.success(`Imported ${picked.name} from contact file!`);
      } else {
        toast.error('Could not read contacts from file');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      setIsSubmitting(true);
      const isEditing = Boolean(memberToEdit?.id);
      const url = '/api/members';
      const method = isEditing ? 'PATCH' : 'POST';

      const payload = isEditing
        ? {
            id: memberToEdit!.id,
            name: name.trim(),
            upi_id: upiId.trim() || null,
            phone: phone.trim() || null,
            color: selectedColor,
          }
        : {
            trip_id: tripId,
            name: name.trim(),
            upi_id: upiId.trim() || undefined,
            phone: phone.trim() || undefined,
            color: selectedColor,
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save member');
      }

      toast.success(isEditing ? 'Member updated!' : `${name.trim()} added to the crew!`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Error saving member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <input
        type="file"
        ref={vcfInputRef}
        onChange={handleVcfUpload}
        accept=".vcf,text/vcard"
        className="hidden"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md raised-card p-6 relative my-8 bg-[var(--surface-raised)] border border-[var(--border)] shadow-[var(--shadow-modal)]"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
            >
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold font-outfit text-[var(--text-primary)]">
                {memberToEdit ? 'Edit Crew Member' : 'Add Crew Member'}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {memberToEdit ? 'Update member details & contact' : 'Invite a friend to split & share'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--surface-inset)] hover:bg-[var(--border)] text-[var(--text-muted)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Import from Contacts Trigger */}
        {!memberToEdit && (
          <div className="pt-4">
            <button
              type="button"
              onClick={handlePickContact}
              className="w-full py-2.5 px-3 rounded-xl inset-card bg-[var(--surface-inset)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-inner font-outfit"
            >
              <Contact className="w-4 h-4 text-[#2b56ff]" /> Import from Phone Contacts / VCF 📱
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] mb-1.5 block">Name</label>
            <input
              type="text"
              placeholder="e.g. Alex"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full inset-field px-3.5 py-2.5 text-xs font-semibold text-[var(--text-primary)]"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] mb-1.5 block">
              Phone Number (For direct WhatsApp chats)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                placeholder="e.g. +91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full inset-field pl-9 pr-3.5 py-2.5 text-xs font-mono font-bold text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] mb-1.5 block">
              UPI ID (Optional for fast settlements)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                <Smartphone className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="e.g. name@okhdfcbank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full inset-field pl-9 pr-3.5 py-2.5 text-xs font-mono font-bold text-[var(--text-primary)]"
              />
            </div>
          </div>

          {/* Crew Role Dropdown */}
          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] mb-1.5 block">
              Crew Role / Badge
            </label>
            <CustomSelect
              value={role}
              onChange={setRole}
              options={[
                { value: 'member', label: '👤 Crew Member' },
                { value: 'co_pilot', label: '🚀 Trip Co-pilot' },
                { value: 'banker', label: '💰 Accountant / Banker' },
                { value: 'driver', label: '🚗 Primary Driver' },
                { value: 'navigator', label: '🗺️ Navigator / Guide' },
                { value: 'photographer', label: '📸 Photographer' },
              ]}
              className="w-full"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-xs font-bold text-[var(--text-secondary)] mb-2 block">Avatar Color</label>
            <div className="flex flex-wrap gap-2">
              {MEMBER_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm"
                  style={{ backgroundColor: c }}
                >
                  {selectedColor === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)', boxShadow: '0 4px 14px rgba(43,86,255,0.35)' }}
          >
            {isSubmitting ? 'Saving...' : memberToEdit ? 'Update Member Details' : 'Add to Trip'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
