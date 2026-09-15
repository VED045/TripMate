import { cn } from '@/lib/utils';

// =============================================================================
// PROGRESS BAR
// =============================================================================

interface ProgressBarProps {
  value: number; // 0–100
  max?: number;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'accent' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
}

const heightMap = { xs: 'h-1', sm: 'h-1.5', md: 'h-2' };
const variantMap = {
  accent: 'from-[var(--accent)] to-[var(--accent-light)]',
  success: 'from-emerald-500 to-teal-400',
  warning: 'from-amber-500 to-yellow-400',
  danger: 'from-rose-500 to-red-400',
};

export function ProgressBar({
  value,
  max = 100,
  size = 'sm',
  variant = 'accent',
  showLabel = false,
  label,
  className,
  animated = false,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-[var(--text-muted)]">{label}</span>}
          {showLabel && (
            <span className="text-xs font-semibold text-[var(--text-secondary)] ml-auto">
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}
      <div className={cn('progress-track w-full', heightMap[size])}>
        <div
          className={cn(
            'progress-fill h-full bg-gradient-to-r',
            variantMap[variant],
            animated && 'animate-pulse-subtle'
          )}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemax={max}
          aria-valuemin={0}
        />
      </div>
    </div>
  );
}
