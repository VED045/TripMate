'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Send,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/AuthContext';
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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/dashboard';
  const { user, signOut } = useAuth();

  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [googleSetupError, setGoogleSetupError] = useState<string | null>(null);

  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    try {
      setIsLoading(true);
      if (user) {
        await supabase.auth.signOut();
      }
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      toast.success('Welcome back!');
      router.replace(redirectTo);
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      setIsLoading(true);
      if (user) {
        await supabase.auth.signOut();
      }
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}${redirectTo}` },
      });
      if (error) throw error;
      setMagicSent(true);
      toast.success('Magic link sent! Check your email.');
    } catch (err: any) {
      toast.error(err.message || 'Could not send magic link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setGoogleSetupError(null);
      if (user) {
        await supabase.auth.signOut();
      }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;

      if (data?.url) {
        // Probe if Google OAuth is enabled in this Supabase project
        try {
          const probe = await fetch(data.url, { method: 'GET' });
          if (!probe.ok) {
            const probeJson = await probe.json().catch(() => ({}));
            if (probeJson.msg?.includes('provider is not enabled') || probe.status === 400) {
              setGoogleSetupError(
                'Google Login is not enabled in your Supabase project (Authentication → Providers → Google). Please sign in using Email & Password or Magic Link below!'
              );
              toast.error('Google Sign-In is not enabled on this Supabase project.');
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // If probe fails with CORS, browser will navigate normally to Google accounts
        }

        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || 'Google login failed');
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
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Link
              href="/"
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)' }}
            >
              <TripMateMark className="w-7 h-7" />
            </Link>
          </div>
          <h1 className="text-3xl font-extrabold font-outfit text-[var(--text-primary)] tracking-tight">
            Welcome back to <span style={{ color: 'var(--accent)' }}>TripMate</span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Sign in to manage your trips and expenses
          </p>
        </div>

        {user && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold tracking-wider">Already signed in</span>
              <span className="font-bold text-[var(--text-primary)] truncate block font-mono">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-semibold hover:bg-[var(--surface-inset)] text-[var(--text-primary)] transition-all"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  toast.success('Signed out');
                  router.refresh();
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold hover:bg-rose-500/20 transition-all flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {magicSent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="raised-card p-8 text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-[var(--success-light)] flex items-center justify-center mx-auto">
              <Send className="w-8 h-8 text-[var(--success)]" />
            </div>
            <h2 className="text-lg font-bold font-outfit text-[var(--text-primary)]">Check your inbox!</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              We sent a magic link to <strong>{email}</strong>. Click it to sign in instantly.
            </p>
            <button
              onClick={() => setMagicSent(false)}
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              Try a different email
            </button>
          </motion.div>
        ) : (
          <div className="raised-card p-6 space-y-5">
            {/* Mode toggle */}
            <div className="flex gap-2 p-1 rounded-xl bg-[var(--surface-inset)]">
              {(['password', 'magic'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    mode === m
                      ? 'bg-[var(--surface-raised)] text-[var(--accent)] shadow-sm'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {m === 'password' ? '🔑 Password' : '✨ Magic Link'}
                </button>
              ))}
            </div>

            <form onSubmit={mode === 'password' ? handleEmailLogin : handleMagicLink} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="inset-field w-full pl-10 pr-4 py-2.5 text-sm"
                  />
                </div>
              </div>

              {/* Password (password mode only) */}
              {mode === 'password' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-mono">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-[10px] font-semibold text-[var(--accent)] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
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
              )}

              <button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #2b56ff, #163ecf)', boxShadow: '0 6px 20px rgba(43,86,255,0.35)' }}
              >
                {isLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <>
                    {mode === 'password' ? 'Sign In' : 'Send Magic Link'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <span className="relative px-3 bg-[var(--surface-raised)] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest font-mono">
                or continue with
              </span>
            </div>

            {/* Google */}
            <button
              id="login-google"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 border border-[var(--border)] bg-[var(--surface-raised)] hover:bg-[var(--surface-inset)] transition-all active:scale-[0.98] disabled:opacity-60 text-[var(--text-primary)]"
            >
              <GoogleIcon className="w-4 h-4" />
              Continue with Google
            </button>

            {googleSetupError && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-[var(--text-secondary)] space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Google Sign-In Notice</span>
                </div>
                <p className="leading-relaxed text-[11px]">
                  {googleSetupError}
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('magic');
                      setGoogleSetupError(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-semibold text-[var(--accent)] hover:underline"
                  >
                    ✨ Use Magic Link Instead
                  </button>
                </div>
              </div>
            )}

            {/* Sign up link */}
            <p className="text-center text-xs text-[var(--text-muted)]">
              New to TripMate?{' '}
              <Link href="/signup" className="font-bold text-[var(--accent)] hover:underline">
                Create account
              </Link>
            </p>
          </div>
        )}

        {/* Anonymous access note */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors inline-flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            Join existing trip without account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: 'var(--background)' }} />}>
      <LoginForm />
    </Suspense>
  );
}
