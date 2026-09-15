'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// BOTTOM SHEET — mobile-first modal that slides up from the bottom
// On desktop it renders as a centered dialog
// =============================================================================

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
  showHandle?: boolean;
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className,
  maxHeight = '90dvh',
  showHandle = true,
}: BottomSheetProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet — slides up on mobile, scales in on desktop */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'md:relative md:bottom-auto md:left-auto md:right-auto',
              'md:fixed md:inset-0 md:flex md:items-center md:justify-center',
              'md:z-50'
            )}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {/* On desktop: re-wrap as modal */}
            <div className={cn(
              'w-full bg-[var(--surface)] rounded-t-3xl md:rounded-3xl',
              'border border-[var(--border)] shadow-[var(--shadow-modal)]',
              'overflow-hidden flex flex-col',
              'md:max-w-lg md:w-full md:mx-4',
              className
            )}
              style={{ maxHeight }}
            >
              {/* Handle */}
              {showHandle && (
                <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
                  <div className="w-10 h-1 bg-[var(--border-strong)] rounded-full" />
                </div>
              )}

              {/* Header */}
              {(title || subtitle) && (
                <div className="flex items-start justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
                  <div>
                    {title && (
                      <h2 className="text-base font-bold text-[var(--text-primary)] font-outfit leading-tight">
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-inset)] transition-colors ml-3 flex-shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Content — scrollable */}
              <div className="overflow-y-auto flex-1 overscroll-contain">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
