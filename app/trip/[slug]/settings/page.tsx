'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Palette,
  Bell,
  Users,
  Download,
  LogOut,
  ChevronRight,
  Check,
  Trash2,
  Edit3,
  ShieldAlert,
} from 'lucide-react';
import { useActiveTrip } from '@/components/shared/ActiveTripContext';
import { TripHeader } from '@/components/shared/TripHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { GradientButton } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Theme = 'light' | 'dark' | 'system';

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'light', label: 'Light', icon: Sun, desc: 'Soft neumorphic light mode' },
  { value: 'dark', label: 'Dark', icon: Moon, desc: 'Midnight dark mode' },
  { value: 'system', label: 'System', icon: Monitor, desc: 'Follow device preference' },
];

export default function SettingsPage() {
  const { trip, members, currentMember, refreshTrip } = useActiveTrip();
  const [theme, setTheme] = useState<Theme>('system');
  const [tripName, setTripName] = useState(trip?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Read saved theme
  useEffect(() => {
    const saved = localStorage.getItem('tripmate_theme') as Theme | null;
    if (saved) setTheme(saved);
    if (trip?.name) setTripName(trip.name);
  }, [trip?.name]);

  const applyTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('tripmate_theme', t);

    const root = document.documentElement;
    if (t === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', t);
    }
    toast.success(`Switched to ${t} mode`);
  };

  const handleSaveTripName = async () => {
    if (!trip || !tripName.trim()) return;
    try {
      setIsSaving(true);
      const res = await fetch(`/api/trips/${trip.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tripName.trim() }),
      });
      if (!res.ok) throw new Error('Failed to update trip name');
      toast.success('Trip name updated!');
      setIsEditingName(false);
      refreshTrip();
    } catch {
      toast.error('Failed to update trip name');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (!trip) return;
    window.location.href = `/api/export?trip_id=${trip.id}&format=csv`;
  };

  const handleExportZip = () => {
    if (!trip) return;
    window.location.href = `/api/export?trip_id=${trip.id}&format=zip`;
  };

  const [whatsappLink, setWhatsappLink] = useState(trip?.whatsapp_link || '');
  const [isEditingWa, setIsEditingWa] = useState(false);

  const handleSaveWaLink = async () => {
    if (!trip) return;
    try {
      setIsSaving(true);
      const res = await fetch(`/api/trips/${trip.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp_link: whatsappLink.trim() }),
      });
      if (!res.ok) throw new Error('Failed to update WhatsApp link');
      toast.success('WhatsApp group link saved!');
      setIsEditingWa(false);
      refreshTrip();
    } catch {
      toast.error('Failed to update WhatsApp link');
    } finally {
      setIsSaving(false);
    }
  };

  if (!trip) return null;

  const isCreator = Boolean(
    currentMember?.is_admin ||
    (trip.created_by && currentMember?.id === trip.created_by) ||
    (members.length > 0 && members[0]?.id === currentMember?.id)
  );

  if (!isCreator) {
    return (
      <div className="flex-1 flex flex-col" style={{ background: 'var(--background)' }}>
        <TripHeader title="Access Restricted" subtitle="Settings are reserved for the trip creator" />
        <div className="max-w-md mx-auto w-full px-4 py-12 text-center space-y-4">
          <div className="raised-card p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold font-outfit text-[var(--text-primary)]">
                Creator Only Settings
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                Only the trip creator can modify trip settings. You can view & edit your personal profile and UPI QR code on your Profile page!
              </p>
            </div>
            <Link
              href={`/trip/${trip.slug}/profile`}
              className="block w-full py-3 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
            >
              Go to My Profile & UPI QR Code
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col" style={{ background: 'var(--background)' }}>
      <TripHeader title="Settings" subtitle="Preferences & trip management" />

      <div className="max-w-2xl mx-auto w-full px-4 md:px-6 py-5 space-y-5 pb-nav">

        {/* Trip Info */}
        <section className="raised-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-sm font-bold font-outfit text-[var(--text-primary)]">Trip Details</h2>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-1.5">
              Trip Name
            </label>
            {isEditingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tripName}
                  onChange={e => setTripName(e.target.value)}
                  className="flex-1 inset-field px-3 py-2 text-sm"
                  autoFocus
                />
                <button
                  onClick={handleSaveTripName}
                  disabled={isSaving}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-white transition-all"
                  style={{ background: 'var(--success)' }}
                >
                  {isSaving ? '...' : 'Save'}
                </button>
                <button
                  onClick={() => { setIsEditingName(false); setTripName(trip.name); }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--surface-inset)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[var(--text-primary)]">{trip.name}</span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* WhatsApp Group Link */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-1.5">
              WhatsApp Group Link
            </label>
            {isEditingWa ? (
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://chat.whatsapp.com/..."
                  value={whatsappLink}
                  onChange={e => setWhatsappLink(e.target.value)}
                  className="flex-1 inset-field px-3 py-2 text-xs font-mono"
                  autoFocus
                />
                <button
                  onClick={handleSaveWaLink}
                  disabled={isSaving}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-white transition-all"
                  style={{ background: 'var(--success)' }}
                >
                  Save
                </button>
                <button
                  onClick={() => { setIsEditingWa(false); setWhatsappLink(trip.whatsapp_link || ''); }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--surface-inset)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[var(--text-secondary)] truncate max-w-[280px]">
                  {trip.whatsapp_link || 'No WhatsApp link configured'}
                </span>
                <button
                  onClick={() => setIsEditingWa(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline"
                >
                  <Edit3 className="w-3 h-3" />
                  {trip.whatsapp_link ? 'Edit' : 'Add Link'}
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-1.5">
              Trip Slug
            </label>
            <p className="text-sm font-mono text-[var(--text-secondary)]">{trip.slug}</p>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-1.5">
              Currency
            </label>
            <p className="text-sm text-[var(--text-primary)]">{trip.currency || 'INR'} — Indian Rupees (₹)</p>
          </div>
        </section>

        {/* Appearance */}
        <section className="raised-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-sm font-bold font-outfit text-[var(--text-primary)]">Appearance</h2>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map(({ value, label, icon: Icon, desc }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  onClick={() => applyTheme(value)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-2xl border text-center transition-all',
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                      : 'border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-inset)]'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center',
                    active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                  )}
                    style={active ? { background: 'var(--accent-subtle)' } : { background: 'var(--surface-inset)' }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={cn('text-xs font-bold', active ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]')}>
                      {label}
                    </p>
                    <p className="text-[9px] text-[var(--text-muted)] hidden sm:block">{desc}</p>
                  </div>
                  {active && <Check className="w-3 h-3 text-[var(--accent)]" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* Members */}
        <section className="raised-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-sm font-bold font-outfit text-[var(--text-primary)]">Crew Members</h2>
          </div>

          <div className="space-y-2">
            {members.map(m => (
              <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: 'var(--surface-inset)' }}>
                <div className="flex items-center gap-2.5">
                  <Avatar name={m.name} color={m.color} size="sm" />
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)]">{m.name}</p>
                    {m.upi_id && <p className="text-[10px] font-mono text-[var(--text-muted)]">{m.upi_id}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.id === currentMember?.id && <Badge variant="info" size="xs">You</Badge>}
                  {m.is_admin && <Badge variant="warning" size="xs">Admin</Badge>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Data Export */}
        <section className="raised-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-sm font-bold font-outfit text-[var(--text-primary)]">Export Data</h2>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-inset)] transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">Export CSV</p>
                <p className="text-[10px] text-[var(--text-muted)]">Spreadsheet of all expenses</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
            </button>

            <button
              onClick={handleExportZip}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--surface-inset)] transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">Export Full Archive</p>
                <p className="text-[10px] text-[var(--text-muted)]">ZIP with photos, CSV, and report</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
          </div>
        </section>

        {/* Danger zone */}
        <section className="raised-card p-5 space-y-3" style={{ borderTop: '2px solid var(--danger)' }}>
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-[var(--danger)]" />
            <h2 className="text-sm font-bold font-outfit" style={{ color: 'var(--danger)' }}>Danger Zone</h2>
          </div>
          <p className="text-xs text-[var(--text-muted)]">These actions are irreversible. Please proceed carefully.</p>
          <button
            onClick={() => {
              if (confirm('Are you sure? This will permanently delete all expenses and cannot be undone.')) {
                toast.error('This action is not yet implemented.');
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete All Expenses (Permanent)
          </button>
        </section>
      </div>
    </div>
  );
}
