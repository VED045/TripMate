'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  Users, 
  UserPlus, 
  Smartphone, 
  Phone,
  ArrowLeft, 
  ArrowRight, 
  Sparkles,
  Trash2,
  CheckCircle2,
  Check,
  Crown,
  CreditCard,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { pickPhoneContacts, parseVcfContent } from '@/lib/contacts';
import { cn } from '@/lib/utils';

const MEMBER_COLORS = [
  '#2b56ff', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', 
  '#14b8a6', '#f43f5e', '#a855f7', '#3b82f6'
];

export default function CreateTripPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const vcfInputRef = useRef<HTMLInputElement>(null);
  const [targetMemberIdxForVcf, setTargetMemberIdxForVcf] = useState<number | null>(null);

  const [tripData, setTripData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
  });

  const [members, setMembers] = useState([
    { name: 'You (Leader)', upi_id: '', phone: '', color: MEMBER_COLORS[0] },
    { name: '', upi_id: '', phone: '', color: MEMBER_COLORS[1] },
    { name: '', upi_id: '', phone: '', color: MEMBER_COLORS[2] },
  ]);

  const addMember = () => {
    const nextColor = MEMBER_COLORS[members.length % MEMBER_COLORS.length];
    setMembers((m) => [...m, { name: '', upi_id: '', phone: '', color: nextColor }]);
  };

  const handleBulkPickContacts = async () => {
    setTargetMemberIdxForVcf(null);
    try {
      const picked = await pickPhoneContacts();
      if (picked.length > 0) {
        setMembers((existing) => {
          const filtered = existing.filter((m) => m.name.trim() && m.name !== 'You (Leader)');
          const leaderMember = existing.find(m => m.name === 'You (Leader)') || existing[0];
          const leaderList = leaderMember ? [leaderMember] : [];
          
          const newEntries = picked.map((p, idx) => ({
            name: p.name,
            upi_id: '',
            phone: p.phone || '',
            color: MEMBER_COLORS[(leaderList.length + filtered.length + idx) % MEMBER_COLORS.length],
          }));
          return [...leaderList, ...filtered, ...newEntries];
        });
        toast.success(`Imported ${picked.length} contact(s) into crew!`);
        return;
      }
      vcfInputRef.current?.click();
    } catch {
      vcfInputRef.current?.click();
    }
  };

  const handlePickContactForMember = async (index: number) => {
    setTargetMemberIdxForVcf(index);
    try {
      const picked = await pickPhoneContacts();
      if (picked.length > 0) {
        const firstContact = picked[0];
        setMembers((prev) =>
          prev.map((m, i) =>
            i === index
              ? {
                  ...m,
                  name: firstContact.name || m.name,
                  phone: firstContact.phone || m.phone,
                }
              : m
          )
        );

        if (picked.length > 1) {
          const extraMembers = picked.slice(1).map((p, idx) => ({
            name: p.name,
            upi_id: '',
            phone: p.phone || '',
            color: MEMBER_COLORS[(members.length + idx) % MEMBER_COLORS.length],
          }));
          setMembers((prev) => [...prev, ...extraMembers]);
        }
        toast.success(`Loaded contact ${firstContact.name}!`);
        return;
      }
      vcfInputRef.current?.click();
    } catch {
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
        if (targetMemberIdxForVcf !== null) {
          const first = parsed[0];
          setMembers((prev) =>
            prev.map((m, i) =>
              i === targetMemberIdxForVcf
                ? { ...m, name: first.name || m.name, phone: first.phone || m.phone }
                : m
            )
          );
          if (parsed.length > 1) {
            const extra = parsed.slice(1).map((p, idx) => ({
              name: p.name,
              upi_id: '',
              phone: p.phone || '',
              color: MEMBER_COLORS[(members.length + idx) % MEMBER_COLORS.length],
            }));
            setMembers((prev) => [...prev, ...extra]);
          }
        } else {
          setMembers((existing) => {
            const newEntries = parsed.map((p, idx) => ({
              name: p.name,
              upi_id: '',
              phone: p.phone || '',
              color: MEMBER_COLORS[(existing.length + idx) % MEMBER_COLORS.length],
            }));
            return [...existing, ...newEntries];
          });
        }
        toast.success(`Imported ${parsed.length} contact(s) from VCF file!`);
      } else {
        toast.error('Could not parse contact file');
      }
    };
    reader.readAsText(file);
    setTargetMemberIdxForVcf(null);
  };

  const removeMember = (index: number) => {
    if (members.length <= 1) {
      toast.error('You need at least one crew member');
      return;
    }
    setMembers((m) => m.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, key: string, value: string) => {
    setMembers((m) =>
      m.map((mem, i) => (i === index ? { ...mem, [key]: value } : mem))
    );
  };

  const handleNextStep = () => {
    if (!tripData.name.trim()) {
      toast.error('Please enter your trip name');
      return;
    }
    setStep(2);
  };

  const handleCreate = async () => {
    const validMembers = members.filter((m) => m.name.trim());
    if (validMembers.length === 0) {
      toast.error('Please add at least one member name');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip: tripData, members: validMembers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create trip');

      localStorage.setItem('tripmate_last_trip', data.slug);
      toast.success('Trip created successfully! Welcome to TripMate 🎉');
      router.push(`/trip/${data.slug}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Hidden VCF File Input */}
      <input
        type="file"
        ref={vcfInputRef}
        onChange={handleVcfUpload}
        accept=".vcf,text/vcard"
        className="hidden"
      />

      {/* Top Header */}
      <header className="relative z-30 max-w-4xl mx-auto w-full px-6 py-5 flex items-center justify-between border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold">Back to Home</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}>
            <Compass className="w-4 h-4 text-white" />
          </div>
          <span className="font-outfit font-extrabold text-base text-[var(--text-primary)]">
            Trip<span style={{ color: 'var(--accent)' }}>Mate</span> Setup
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-20 flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col justify-center">
        
        {/* Onboarding Stepper Indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-extrabold font-outfit transition-all",
            step === 1
              ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-muted)]"
          )}>
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
            <span>Trip Details</span>
          </div>

          <div className="w-8 h-[2px] bg-[var(--border)]" />

          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-extrabold font-outfit transition-all",
            step === 2
              ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-muted)]"
          )}>
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
            <span>Crew & Contacts</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="raised-card p-6 sm:p-8 space-y-6 border border-[var(--border)]"
            >
              <div>
                <span className="text-[10px] font-extrabold font-mono uppercase tracking-widest text-[var(--accent)] flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> Step 1 of 2
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-outfit text-[var(--text-primary)] tracking-tight">
                  Where are you heading? ✈️
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Name your trip adventure and select travel dates.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-extrabold text-[var(--text-primary)] mb-1.5 block">
                    Trip Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[var(--accent)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Diveagar Weekend Getaway 🏖️"
                      value={tripData.name}
                      onChange={(e) => setTripData({ ...tripData, name: e.target.value })}
                      className="w-full inset-field pl-10 pr-4 py-3 text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-[var(--text-primary)] mb-1.5 block">
                    Description / Vibe (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Beach resort, seafood shacks, coastal bikes & bonfire night!"
                    value={tripData.description}
                    onChange={(e) => setTripData({ ...tripData, description: e.target.value })}
                    className="w-full inset-field px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-extrabold text-[var(--text-primary)] mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" /> Start Date
                    </label>
                    <input
                      type="date"
                      value={tripData.start_date}
                      onChange={(e) => setTripData({ ...tripData, start_date: e.target.value })}
                      className="w-full inset-field px-3 py-2.5 text-xs font-mono font-semibold text-[var(--text-primary)]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-[var(--text-primary)] mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" /> End Date
                    </label>
                    <input
                      type="date"
                      value={tripData.end_date}
                      onChange={(e) => setTripData({ ...tripData, end_date: e.target.value })}
                      className="w-full inset-field px-3 py-2.5 text-xs font-mono font-semibold text-[var(--text-primary)]"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
              >
                <span>Continue to Crew Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="raised-card p-6 sm:p-8 space-y-6 border border-[var(--border)]"
            >
              <div>
                <span className="text-[10px] font-extrabold font-mono uppercase tracking-widest text-[var(--accent)] flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5" /> Step 2 of 2
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-outfit text-[var(--text-primary)] tracking-tight">
                  Assemble the Crew 👥
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Add trip companions with their phone numbers for WhatsApp pings & UPI handles for instant settlements.
                </p>
              </div>

              {/* Bulk Phone Contacts Import Banner */}
              <div className="inset-card p-3.5 rounded-2xl bg-[var(--surface-inset)] border border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[var(--text-primary)] font-outfit">
                      Import Contacts from Phone
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Pick directly from contacts or upload a .vcf file
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBulkPickContacts}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-cyan-500 text-white font-bold text-xs shadow-md hover:bg-cyan-600 transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
                >
                  <Smartphone className="w-4 h-4" /> Import Contacts 📱
                </button>
              </div>

              {/* Members Input List */}
              <div className="space-y-4 max-h-[48vh] overflow-y-auto pr-1">
                {members.map((member, idx) => (
                  <div
                    key={idx}
                    className="inset-card p-4 rounded-2xl bg-[var(--surface-inset)] border border-[var(--border)] space-y-3 relative transition-all hover:border-[var(--accent)]/40"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Avatar Color Circle */}
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0 relative"
                          style={{ backgroundColor: member.color || MEMBER_COLORS[idx % MEMBER_COLORS.length] }}
                        >
                          {member.name ? member.name[0]?.toUpperCase() : (idx + 1)}
                          {idx === 0 && (
                            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 absolute -top-1.5 -right-1.5 drop-shadow-sm" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                              Member {idx + 1} {idx === 0 && '• Trip Leader 👑'}
                            </span>
                          </div>
                          <input
                            type="text"
                            placeholder={idx === 0 ? "Your Name (Trip Leader)" : `Crew Member ${idx + 1} Name`}
                            value={member.name}
                            onChange={(e) => updateMember(idx, 'name', e.target.value)}
                            className="w-full inset-field px-3 py-2 text-xs font-extrabold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Per-Member Quick Phone Contact Picker */}
                        <button
                          type="button"
                          onClick={() => handlePickContactForMember(idx)}
                          className="p-2 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 transition-colors flex items-center gap-1 text-[11px] font-bold"
                          title="Pick contact from phone for this member"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-cyan-500" />
                          <span className="hidden sm:inline">Pick</span>
                        </button>

                        {members.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMember(idx)}
                            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Remove member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">
                          Phone Number (for WhatsApp & Location Pings)
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            placeholder="e.g. +91 9876543210"
                            value={member.phone || ''}
                            onChange={(e) => updateMember(idx, 'phone', e.target.value)}
                            className="w-full inset-field pl-8 pr-3 py-2 text-xs font-mono font-semibold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">
                          UPI ID (for 1-tap QR settlements)
                        </label>
                        <div className="relative">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="e.g. name@okicici"
                            value={member.upi_id || ''}
                            onChange={(e) => updateMember(idx, 'upi_id', e.target.value)}
                            className="w-full inset-field pl-8 pr-3 py-2 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 placeholder:text-[var(--text-muted)]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addMember}
                className="w-full py-2.5 rounded-xl bg-[var(--surface-inset)] hover:bg-[var(--surface-raised)] border border-dashed border-[var(--border)] text-xs font-bold text-[var(--accent)] flex items-center justify-center gap-2 transition-colors"
              >
                <UserPlus className="w-4 h-4" /> Add Another Crew Member
              </button>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-2xl bg-[var(--surface-inset)] hover:bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-2xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
                >
                  {loading ? 'Creating Trip OS...' : '🚀 Launch Trip OS'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
