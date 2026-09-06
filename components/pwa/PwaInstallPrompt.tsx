'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 md:bottom-8 left-4 right-4 md:left-auto md:right-8 max-w-sm z-50 p-4 rounded-2xl bg-slate-900/95 border border-cyan-500/40 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white">Install TripMate App</h4>
          <p className="text-[11px] text-slate-400">Offline access & faster launches</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-cyan-500/20"
        >
          Install
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="p-1 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
