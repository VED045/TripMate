'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  CreditCard,
  Save,
  Camera,
  Key,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState({
    display_name: '',
    phone: '',
    default_upi_id: '',
    upi_display_name: '',
    bio: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSent, setPasswordSent] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }
    if (user) {
      fetchProfile();
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile({
        display_name: data.display_name || '',
        phone: data.phone || '',
        default_upi_id: data.default_upi_id || '',
        upi_display_name: data.upi_display_name || '',
        bio: data.bio || '',
      });
    } else {
      // Pre-fill from user metadata
      setProfile(prev => ({
        ...prev,
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
      }));
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profile,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      toast.success('Profile saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    try {
      setIsChangingPassword(true);
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setPasswordSent(true);
      toast.success('Password reset email sent!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}>
          <Compass className="w-4 h-4 text-white animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)]"
        style={{ background: 'color-mix(in srgb, var(--surface) 92%, transparent)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/dashboard"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-inset)] transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-bold font-outfit text-[var(--text-primary)]">Account Settings</h1>
            <p className="text-[10px] text-[var(--text-muted)]">{user?.email}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-20">
        {/* Profile section */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="raised-card p-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-sm font-bold font-outfit text-[var(--text-primary)]">Personal Info</h2>
          </div>

          {/* Avatar placeholder */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}>
              {profile.display_name.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">
                {profile.display_name || 'Your Name'}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  id="account-display-name"
                  type="text"
                  value={profile.display_name}
                  onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))}
                  placeholder="Alex Kumar"
                  className="inset-field w-full pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                Phone (optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  id="account-phone"
                  type="tel"
                  value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="inset-field w-full pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                Bio (optional)
              </label>
              <textarea
                id="account-bio"
                value={profile.bio}
                onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                placeholder="Travel enthusiast 🌍"
                rows={2}
                className="inset-field w-full px-3.5 py-2.5 text-sm resize-none"
              />
            </div>
          </div>
        </motion.section>

        {/* UPI details */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="raised-card p-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold font-outfit text-[var(--text-primary)]">Payment Defaults</h2>
          </div>
          <p className="text-xs text-[var(--text-muted)] -mt-2">
            These defaults are applied when you join a new trip as a member.
          </p>

          <div className="space-y-3">
            {/* Default UPI ID */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                Default UPI ID
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  id="account-upi-id"
                  type="text"
                  value={profile.default_upi_id}
                  onChange={e => setProfile(p => ({ ...p, default_upi_id: e.target.value }))}
                  placeholder="yourname@upi"
                  className="inset-field w-full pl-10 pr-4 py-2.5 text-sm font-mono"
                />
              </div>
            </div>

            {/* UPI Display Name */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                UPI Display Name
              </label>
              <input
                id="account-upi-display-name"
                type="text"
                value={profile.upi_display_name}
                onChange={e => setProfile(p => ({ ...p, upi_display_name: e.target.value }))}
                placeholder="Alex Kumar"
                className="inset-field w-full px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>
        </motion.section>

        {/* Save button */}
        <button
          id="account-save"
          onClick={handleSaveProfile}
          disabled={isSaving}
          className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)', boxShadow: '0 4px 14px rgba(43,86,255,0.35)' }}
        >
          {isSaving ? (
            <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Profile
            </>
          )}
        </button>

        {/* Security section */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="raised-card p-5 space-y-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-bold font-outfit text-[var(--text-primary)]">Security</h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[var(--text-primary)]">Password</p>
              <p className="text-[10px] text-[var(--text-muted)]">Reset via email link</p>
            </div>
            {passwordSent ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                Email sent!
              </div>
            ) : (
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
              >
                {isChangingPassword ? 'Sending...' : 'Reset Password'}
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-[var(--border)]">
            <p className="text-[10px] text-[var(--text-muted)]">
              Signed in as <strong>{user?.email}</strong>
            </p>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
