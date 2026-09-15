'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// BUTTON COMPONENT — tactile, accessible, multiple variants
// =============================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const sizes = {
    xs: 'h-7 px-2.5 text-xs gap-1 rounded-lg',
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-xl',
    md: 'h-10 px-4 text-sm gap-2 rounded-xl',
    lg: 'h-12 px-6 text-sm gap-2 rounded-2xl',
  };

  const variants = {
    primary: 'bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-white shadow-sm active:scale-[0.98]',
    secondary: 'bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-inset)] shadow-[var(--shadow-raised)] active:shadow-[var(--shadow-inset)] active:scale-[0.98]',
    ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)]',
    danger: 'bg-[var(--danger)] hover:opacity-90 text-white shadow-sm active:scale-[0.98]',
    success: 'bg-[var(--success)] hover:opacity-90 text-white shadow-sm active:scale-[0.98]',
    outline: 'border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-subtle)] active:scale-[0.98]',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-150 cursor-pointer select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
        sizes[size],
        variants[variant],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : leftIcon ? (
        <span className="flex-shrink-0">{leftIcon}</span>
      ) : null}
      {children && <span className="truncate">{children}</span>}
      {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
}

// Gradient button (for primary CTAs)
interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  gradient?: 'indigo' | 'rose' | 'emerald' | 'cyan' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export function GradientButton({
  gradient = 'indigo',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: GradientButtonProps) {
  const gradients = {
    indigo: 'from-indigo-500 to-purple-600 shadow-indigo-500/25',
    rose: 'from-rose-500 to-pink-600 shadow-rose-500/25',
    emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/20',
    cyan: 'from-cyan-500 to-indigo-500 shadow-cyan-500/20',
    amber: 'from-amber-500 to-orange-500 shadow-amber-500/20',
  };
  const sizes = {
    sm: 'h-8 px-3 text-xs rounded-xl gap-1.5',
    md: 'h-10 px-5 text-sm rounded-xl gap-2',
    lg: 'h-12 px-6 text-sm rounded-2xl gap-2',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-bold text-white shadow-lg',
        'bg-gradient-to-r hover:opacity-90 active:scale-[0.98] transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
        gradients[gradient],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// Icon-only button
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'xs' | 'sm' | 'md';
  variant?: 'ghost' | 'raised' | 'outline';
}
export function IconButton({ size = 'sm', variant = 'ghost', className, children, ...props }: IconButtonProps) {
  const sizes = { xs: 'w-7 h-7 rounded-lg', sm: 'w-8 h-8 rounded-xl', md: 'w-10 h-10 rounded-xl' };
  const variants = {
    ghost: 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-inset)]',
    raised: 'bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)] shadow-[var(--shadow-raised)] hover:shadow-[var(--shadow-card-hover)] active:shadow-[var(--shadow-inset)]',
    outline: 'border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-inset)]',
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center flex-shrink-0 transition-all duration-150 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
        sizes[size], variants[variant], className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
