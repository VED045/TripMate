'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// CARD COMPONENTS
// =============================================================================

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'raised' | 'inset' | 'glass' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ variant = 'raised', padding = 'md', className, children, ...props }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4 md:p-5',
    lg: 'p-5 md:p-6',
  };
  const variants = {
    raised: 'raised-card',
    inset: 'inset-card',
    glass: 'glass-panel',
    flat: 'bg-[var(--surface)] border border-[var(--border)] rounded-2xl',
  };
  return (
    <div className={cn(variants[variant], paddings[padding], className)} {...props}>
      {children}
    </div>
  );
}

export function RaisedCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Card variant="raised" className={className} {...props}>{children}</Card>;
}

export function InsetCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <Card variant="inset" className={className} {...props}>{children}</Card>;
}

// =============================================================================
// SECTION HEADER
// =============================================================================
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}
export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)}>
      <div>
        <h3 className="text-sm font-bold text-[var(--text-primary)] font-outfit">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
