'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, CheckCircle2, CreditCard, Mail, Moon,
  Phone, Save, ShieldCheck, Sun, User,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTheme } from '@/components/shared/ThemeContext';
import { LocalAiSettings } from '@/components/ai/LocalAiSettings';
import { toast } from 'sonner';
import { TripMateMark } from '@/components/shared/TripMateMark';

type Profile = {
  display_name: string;
  phone: string;
  default_upi_id: string;
  upi_display_name: string;
  bio: string;
};

const EMPTY_PROFILE: Profile = {
  display_name: '', phone: '', default_upi_id: '', upi_display_name: '', bio: '',
};

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSent, setPasswordSent] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/account/profile', { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not load your profile');
      const { profile: savedProfile } = await response.json();
      setProfile({ ...EMPTY_PROFILE, ...savedProfile });
    } catch {
      setProfile({
        ...EMPTY_PROFILE,
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
      });
      toast.error('Could not load saved profile details. You can still save them again.');
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }
    if (user) queueMicrotask(() => void fetchProfile());
  }, [authLoading, fetchProfile, router, user]);

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Failed to save profile');
      setProfile({ ...EMPTY_PROFILE, ...result.profile });
      toast.success('Profile and preferences saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    try {
      setIsChangingPassword(true);
      const response = await fetch('/api/account/password-reset', { method: 'POST' });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Failed to send reset email');
      setPasswordSent(true);
      toast.success('Password reset email sent');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reset email');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><TripMateMark className="w-7 h-7 text-[var(--accent)] animate-pulse" /></div>;

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="sticky top-0 z-30 border-b border-[var(--border)]" style={{ background: 'color-mix(in srgb, var(--surface) 92%, transparent)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/dashboard" aria-label="Back to dashboard" className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-inset)] transition-all"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="text-base font-bold font-outfit text-[var(--text-primary)]">Profile & preferences</h1>
            <p className="text-[10px] text-[var(--text-muted)]">One place for your account, appearance, and private AI</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-20">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="raised-card p-5 space-y-4">
          <div className="flex items-center gap-2"><User className="w-4 h-4 text-[var(--accent)]" /><h2 className="text-sm font-bold font-outfit text-[var(--text-primary)]">About you</h2></div>
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-[var(--surface-inset)]">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}>{profile.display_name.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}</div>
            <div><p className="text-sm font-bold text-[var(--text-primary)]">{profile.display_name || 'Your profile'}</p><p className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Mail className="w-3 h-3" />{user?.email}</p></div>
          </div>
          <Field label="Display name" icon={<User className="w-4 h-4" />} value={profile.display_name} placeholder="Alex Kumar" onChange={display_name => setProfile(current => ({ ...current, display_name }))} />
          <Field label="Phone (optional)" icon={<Phone className="w-4 h-4" />} value={profile.phone} placeholder="+91 98765 43210" type="tel" onChange={phone => setProfile(current => ({ ...current, phone }))} />
          <label className="block space-y-1.5"><span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">Bio (optional)</span><textarea value={profile.bio} maxLength={280} onChange={event => setProfile(current => ({ ...current, bio: event.target.value }))} placeholder="Travel enthusiast 🌍" rows={2} className="inset-field w-full px-3.5 py-2.5 text-sm resize-none" /></label>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="raised-card p-5 space-y-4">
          <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-emerald-600" /><h2 className="text-sm font-bold font-outfit text-[var(--text-primary)]">Payment defaults</h2></div>
          <p className="text-xs text-[var(--text-muted)] -mt-2">Used to prefill your payment details when you join a new trip. A trip can still have its own payment profile.</p>
          <Field label="Default UPI ID" icon={<CreditCard className="w-4 h-4" />} value={profile.default_upi_id} placeholder="yourname@upi" mono onChange={default_upi_id => setProfile(current => ({ ...current, default_upi_id }))} />
          <Field label="UPI display name" value={profile.upi_display_name} placeholder="Alex Kumar" onChange={upi_display_name => setProfile(current => ({ ...current, upi_display_name }))} />
        </motion.section>

        <button id="account-save" onClick={handleSaveProfile} disabled={isSaving} className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)', boxShadow: '0 4px 14px rgba(43,86,255,0.35)' }}>{isSaving ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <><Save className="w-4 h-4" />Save profile</>}</button>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="raised-card p-5 space-y-4">
          <div className="flex items-center gap-2"><Sun className="w-4 h-4 text-amber-500" /><h2 className="text-sm font-bold font-outfit text-[var(--text-primary)]">Appearance</h2></div>
          <p className="text-xs text-[var(--text-muted)] -mt-2">Light is the default, regardless of your device setting.</p>
          <div className="grid grid-cols-2 gap-2">
            {(['light', 'dark'] as const).map(option => <button key={option} onClick={() => { if (theme !== option) toggleTheme(); }} className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${theme === option ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-inset)]'}`}>{option === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}{option === 'light' ? 'Light' : 'Dark'}</button>)}
          </div>
        </motion.section>

        <LocalAiSettings />

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="raised-card p-5 space-y-3">
          <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-amber-600" /><h2 className="text-sm font-bold font-outfit text-[var(--text-primary)]">Security</h2></div>
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold text-[var(--text-primary)]">Password</p><p className="text-[10px] text-[var(--text-muted)]">We will email a secure reset link.</p></div>{passwordSent ? <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><CheckCircle2 className="w-4 h-4" />Email sent</span> : <button onClick={handleChangePassword} disabled={isChangingPassword} className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">{isChangingPassword ? 'Sending...' : 'Reset password'}</button>}</div>
        </motion.section>
      </main>
    </div>
  );
}

function Field({ label, icon, value, placeholder, type = 'text', mono = false, onChange }: { label: string; icon?: React.ReactNode; value: string; placeholder: string; type?: string; mono?: boolean; onChange: (value: string) => void }) {
  return <label className="block space-y-1.5"><span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">{label}</span><div className="relative">{icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">{icon}</span>}<input type={type} value={value} maxLength={type === 'tel' ? 32 : 120} onChange={event => onChange(event.target.value)} placeholder={placeholder} className={`inset-field w-full ${icon ? 'pl-10' : 'px-3.5'} pr-4 py-2.5 text-sm ${mono ? 'font-mono' : ''}`} /></div></label>;
}
