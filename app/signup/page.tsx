'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { TripMateMark } from '@/components/shared/TripMateMark';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="16" height="16">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [googleSetupError, setGoogleSetupError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !displayName.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: displayName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setVerificationSent(true);
      toast.success('Account created! Check your email to verify.');
    } catch (err: any) {
      toast.error(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true);
      setGoogleSetupError(null);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;

      if (data?.url) {
        try {
          const probe = await fetch(data.url, { method: 'GET' });
          if (!probe.ok) {
            const probeJson = await probe.json().catch(() => ({}));
            if (probeJson.msg?.includes('provider is not enabled') || probe.status === 400) {
              setGoogleSetupError(
                'Google Sign-Up is not enabled in this Supabase project (Authentication → Providers → Google). Please fill in the email form below to sign up instantly!'
              );
              toast.error('Google Sign-Up is not enabled in your Supabase project');
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // If probe fails due to CORS or redirect, proceed with browser redirect
        }

        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || 'Google signup failed');
      setIsLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'var(--background)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="raised-card p-8 text-center space-y-4 max-w-md w-full"
        >
          <div className="text-4xl">📧</div>
          <h2 className="text-xl font-bold font-outfit text-[var(--text-primary)]">Verify your email</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            We sent a verification link to <strong>{email}</strong>. Click it to activate your account.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Already verified?{' '}
            <Link href="/login" className="text-[var(--accent)] font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    );
  }

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
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
            >
              <TripMateMark className="w-7 h-7" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold font-outfit text-[var(--text-primary)] tracking-tight">
            Join <span style={{ color: 'var(--accent)' }}>TripMate</span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Create your account and start organizing trips
          </p>
        </div>

        <div className="raised-card p-6 space-y-4">
          {/* Google notice if unconfigured in Supabase */}
          {googleSetupError && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-200">
                <span>⚠️</span>
                <span>Google Sign-Up Notice</span>
              </div>
              <p>{googleSetupError}</p>
            </div>
          )}

          {/* Google first */}
          <button
            id="signup-google"
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 border border-[var(--border)] bg-[var(--surface-raised)] hover:bg-[var(--surface-inset)] transition-all active:scale-[0.98] disabled:opacity-60 text-[var(--text-primary)]"
          >
            <GoogleIcon className="w-4 h-4" />
            Sign up with Google
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <span className="relative px-3 bg-[var(--surface-raised)] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest font-mono">
              or with email
            </span>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  id="signup-name"
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Alex Kumar"
                  required
                  className="inset-field w-full pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="inset-field w-full pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  className="inset-field w-full pl-10 pr-10 py-2.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  id="signup-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  required
                  className="inset-field w-full pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
            </div>

            <button
              id="signup-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)', boxShadow: '0 6px 20px rgba(43,86,255,0.35)' }}
            >
              {isLoading ? (
                <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[var(--text-muted)]">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-[var(--accent)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
