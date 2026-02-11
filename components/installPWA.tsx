"use client"
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | null>(null);

  useEffect(() => {
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) setPlatform('ios');
    else if (isAndroid) setPlatform('android');
    else setPlatform('desktop');

    const dismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome !== 'accepted') {
      sessionStorage.setItem('pwa-install-dismissed', 'true');
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-install-dismissed', 'true');
    setShowIOSInstructions(false);
    setDeferredPrompt(null);
  };

  if (isInstalled) return null;

  /* ── iOS: Full-screen modal overlay ── */
  if (showIOSInstructions && platform === 'ios') {
    return (
      <div
        className="fixed z-[9999] flex items-center justify-center p-6"
        style={{
          /* Escape body's safe-area padding-bottom from global.css
             by using explicit coords + negative bottom margin */
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          marginTop: `calc(-1 * env(safe-area-inset-top, 0px))`,
          marginBottom: `calc(-1 * env(safe-area-inset-bottom, 0px))`,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleDismiss();
        }}
      >
        <div
          className="relative w-full max-w-sm rounded-3xl p-6 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="mb-6 pr-8">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mb-3">
              <Download className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white leading-tight">
              Installer l'application
            </h3>
            <p className="text-sm text-white/50 mt-1">
              Accès rapide depuis votre écran d'accueil
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-6">
            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >
                1
              </div>
              <div className="pt-0.5">
                <p className="font-semibold text-white text-sm">Appuyez sur Partager</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Share className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-xs text-white/40">En bas de Safari</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="ml-4 w-px h-3 bg-white/10" />

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >
                2
              </div>
              <div className="pt-0.5">
                <p className="font-semibold text-white text-sm">
                  Faites défiler et appuyez sur<br />
                  <span className="text-amber-400">"Sur l'écran d'accueil"</span>
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Plus className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-xs text-white/40">Cherchez cette icône</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="ml-4 w-px h-3 bg-white/10" />

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >
                3
              </div>
              <div className="pt-0.5">
                <p className="font-semibold text-white text-sm">Appuyez sur "Ajouter"</p>
                <p className="text-xs text-white/40 mt-1">
                  L'app apparaîtra sur votre écran d'accueil
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleDismiss}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.35)',
            }}
          >
            Compris !
          </button>
        </div>
      </div>
    );
  }

  /* ── Android: floating button ── */
  if (platform === 'android' && deferredPrompt) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleAndroidInstall}
          size="lg"
          className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400 shadow-lg font-semibold"
        >
          <Download className="w-5 h-5 mr-2" />
          Installer l'app
        </Button>
      </div>
    );
  }

  /* ── iOS: inline banner (before modal opens) ── */
  if (platform === 'ios') {
    return (
      <div
        className="mx-4 mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.14)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
            <Download className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-white/80 text-sm leading-snug">
            Installer pour une meilleure expérience
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowIOSInstructions(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-black transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            Comment ?
          </button>
          <button
            onClick={handleDismiss}
            className="text-white/30 hover:text-white/60 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}