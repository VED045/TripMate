'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// BADGE / STATUS BADGE
// =============================================================================

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'pending' | 'partial' | 'settled' | 'rejected' | 'disputed' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'xs' | 'sm';
  dot?: boolean;
}

export function Badge({ variant = 'default', size = 'sm', dot = false, className, children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[var(--surface-inset)] text-[var(--text-secondary)] border-[var(--border)]',
    pending: 'status-pending',
    partial: 'status-partial',
    settled: 'status-settled',
    rejected: 'status-rejected',
    disputed: 'bg-[var(--warning-light)] text-[var(--warning)] border-[color-mix(in_srgb,var(--warning)_30%,transparent)]',
    success: 'bg-[var(--success-light)] text-[var(--success)] border-[color-mix(in_srgb,var(--success)_30%,transparent)]',
    warning: 'bg-[var(--warning-light)] text-[var(--warning)] border-[color-mix(in_srgb,var(--warning)_30%,transparent)]',
    danger: 'bg-[var(--danger-light)] text-[var(--danger)] border-[color-mix(in_srgb,var(--danger)_30%,transparent)]',
    info: 'bg-[var(--info-light)] text-[var(--info)] border-[color-mix(in_srgb,var(--info)_30%,transparent)]',
  };
  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5 rounded-md',
    sm: 'text-[11px] px-2 py-0.5 rounded-lg',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-semibold border',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />}
      {children}
    </span>
  );
}

// Payment status badge specifically
interface StatusBadgeProps {
  status: 'pending' | 'partial' | 'settled' | 'rejected' | 'verified' | 'proof_submitted';
  size?: 'xs' | 'sm';
}
const statusConfig = {
  pending: { label: 'Pending', variant: 'pending' as const },
  partial: { label: 'Partial', variant: 'partial' as const },
  settled: { label: 'Settled', variant: 'settled' as const },
  verified: { label: 'Verified', variant: 'settled' as const },
  rejected: { label: 'Rejected', variant: 'rejected' as const },
  proof_submitted: { label: 'Proof Sent', variant: 'info' as const },
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'default' as const };
  return (
    <Badge variant={config.variant} size={size} dot>
      {config.label}
    </Badge>
  );
}
