'use client';

import React, { useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';


export function PwaInstallButton() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setDeferredPrompt(event);
        };

        window.addEventListener(
            'beforeinstallprompt',
            handleBeforeInstallPrompt
        );

        const checkInstalled = () => {
            const standalone =
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true;

            setIsInstalled(standalone);
        };

        checkInstalled();

        return () => {
            window.removeEventListener(
                'beforeinstallprompt',
                handleBeforeInstallPrompt
            );
        };
    }, []);

    const handleInstall = async () => {
        // Already installed → check for latest service worker
        if (isInstalled) {
            setIsUpdating(true);

            try {
                if ('serviceWorker' in navigator) {
                    const registration =
                        await navigator.serviceWorker.getRegistration();

                    if (registration) {
                        await registration.update();
                    }
                }

                window.location.reload();
            } catch (error) {
                console.error('PWA update failed:', error);
            } finally {
                setIsUpdating(false);
            }

            return;
        }

        // Native install prompt
        if (deferredPrompt) {
            deferredPrompt.prompt();

            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setIsInstalled(true);
            }

            return;
        }

        // Fallback for browsers that don't expose install prompt
        alert(
            'To install TripMate, open your browser menu and select "Install App" or "Add to Home Screen".'
        );
    };

    return (
        <button
            type="button"
            onClick={handleInstall}
            disabled={isUpdating}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
        >
            {isInstalled ? (
                <RefreshCw
                    className={`w-5 h-5 text-cyan-400 ${isUpdating ? 'animate-spin' : ''
                        }`}
                />
            ) : (
                <Download className="w-5 h-5 text-cyan-400" />
            )}

            <span className="text-sm font-semibold">
                {isInstalled
                    ? isUpdating
                        ? 'Updating App...'
                        : 'Get Latest App'
                    : 'Download App'}
            </span>
        </button>
    );
}