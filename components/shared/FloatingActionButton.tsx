'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Wallet, 
  Camera, 
  HandCoins, 
  Sparkles,
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FABProps {
  onAddExpense: () => void;
  onUploadMedia: () => void;
  onSettleUp: () => void;
  onAddTimeline?: () => void;
}

export function FloatingActionButton({
  onAddExpense,
  onUploadMedia,
  onSettleUp,
  onAddTimeline,
}: FABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: 'Add Expense',
      icon: Wallet,
      color: 'from-pink-500 to-rose-500 shadow-pink-500/25',
      onClick: () => {
        setIsOpen(false);
        onAddExpense();
      },
    },
    {
      label: 'Upload Media',
      icon: Camera,
      color: 'from-cyan-500 to-blue-500 shadow-cyan-500/25',
      onClick: () => {
        setIsOpen(false);
        onUploadMedia();
      },
    },
    {
      label: 'Settle Up',
      icon: HandCoins,
      color: 'from-emerald-500 to-teal-500 shadow-emerald-500/25',
      onClick: () => {
        setIsOpen(false);
        onSettleUp();
      },
    },
    ...(onAddTimeline ? [{
      label: 'Add Moment',
      icon: Sparkles,
      color: 'from-amber-500 to-orange-500 shadow-amber-500/25',
      onClick: () => {
        setIsOpen(false);
        onAddTimeline();
      },
    }] : []),
  ];

  return (
    <div className="fixed bottom-20 md:bottom-8 right-5 z-40">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
            />

            {/* Action Buttons */}
            <motion.div 
              className="absolute bottom-16 right-0 z-40 flex flex-col items-end gap-3 pointer-events-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              {actions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={action.onClick}
                    className="flex items-center gap-3 group"
                  >
                    <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-slate-200 text-xs font-medium border border-white/10 shadow-lg group-hover:text-white transition-colors">
                      {action.label}
                    </span>
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${action.color} flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <button
        id="global-fab-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close quick actions menu" : "Open quick actions menu"}
        aria-expanded={isOpen}
        className={`relative z-40 w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-2xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-transform duration-200`}
      >
        <motion.div
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus className="w-7 h-7" />
        </motion.div>
      </button>
    </div>
  );
}
