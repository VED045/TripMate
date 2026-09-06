'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function PageWaveTransition() {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-end overflow-hidden"
        >
          {/* Wave Layer 1 */}
          <motion.svg
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full absolute inset-0 object-cover"
            viewBox="0 0 1440 600"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="trans-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#6366f1" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="trans-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
              </linearGradient>
            </defs>

            <path
              fill="url(#trans-grad-1)"
              d="M0,192L48,208C96,224,192,256,288,245.3C384,235,480,181,576,170.7C672,160,768,192,864,208C960,224,1056,224,1152,202.7C1248,181,1344,139,1392,117.3L1440,96L1440,600L1392,600C1344,600,1248,600,1152,600C1056,600,960,600,864,600C768,600,672,600,576,600C480,600,384,600,288,600C192,600,96,600,48,600L0,600Z"
            />
            <path
              fill="url(#trans-grad-2)"
              d="M0,320L48,298.7C96,277,192,235,288,229.3C384,224,480,256,576,261.3C672,267,768,245,864,224C960,203,1056,181,1152,192C1248,203,1344,245,1392,266.7L1440,288L1440,600L1392,600C1344,600,1248,600,1152,600C1056,600,960,600,864,600C768,600,672,600,576,600C480,600,384,600,288,600C192,600,96,600,48,600L0,600Z"
            />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
