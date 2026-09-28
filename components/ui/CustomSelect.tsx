'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string | null;
  isCreator?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  className = '',
  buttonClassName = '',
  menuClassName = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent | PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          'w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-inset)] transition-all shadow-sm active:scale-95 cursor-pointer select-none',
          buttonClassName
        )}
      >
        <div className="flex items-center gap-1.5 truncate min-w-0">
          {selectedOption?.isCreator ? (
            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
          ) : selectedOption?.color ? (
            <span className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-black/10 dark:ring-white/10" style={{ backgroundColor: selectedOption.color }} />
          ) : null}
          {selectedOption?.icon}
          <span className="truncate">{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown className={cn('w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 transition-transform duration-200', isOpen && 'rotate-180 text-[#2b56ff]')} />
      </button>

      {/* Styled Floating Neumorphic Menu List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute right-0 top-full z-50 mt-1.5 max-h-64 overflow-y-auto rounded-2xl raised-card bg-[var(--surface-raised)] border border-[var(--border)] p-1.5 shadow-2xl space-y-0.5 scrollbar-none min-w-[180px] w-max max-w-[calc(100vw-32px)]',
              menuClassName
            )}
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all text-left cursor-pointer',
                    isSelected
                      ? 'bg-[#2b56ff] text-white shadow-md shadow-[#2b56ff]/20'
                      : 'text-[var(--text-primary)] hover:bg-[var(--surface-inset)] font-bold'
                  )}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    {opt.isCreator ? (
                      <Crown className={cn('w-3.5 h-3.5 shrink-0', isSelected ? 'text-amber-300 fill-amber-300' : 'text-amber-500 fill-amber-500')} />
                    ) : opt.color ? (
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                    ) : null}
                    {opt.icon}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
