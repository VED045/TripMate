'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { TripMateMark } from '@/components/shared/TripMateMark';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success('Password reset email sent!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: 'var(--background)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
            >
              <TripMateMark className="w-7 h-7" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold font-outfit text-[var(--text-primary)]">
            Reset your password
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Enter your email and we'll send a reset link
          </p>
        </div>

        {sent ? (
          <div className="raised-card p-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-[var(--success)] mx-auto" />
            <h2 className="font-bold text-lg font-outfit text-[var(--text-primary)]">Email sent!</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Check <strong>{email}</strong> for a password reset link.
            </p>
            <Link href="/login" className="text-xs font-bold text-[var(--accent)] hover:underline block">
              Back to sign in →
            </Link>
          </div>
        ) : (
          <div className="raised-card p-6 space-y-4">
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="inset-field w-full pl-10 pr-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
              >
                {isLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Back to sign in
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
