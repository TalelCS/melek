"use client"
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Share, Plus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

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
      console.log('✅ PWA installed successfully');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('✅ User accepted install');
    } else {
      console.log('❌ User dismissed install');
    }
    
    setDeferredPrompt(null);
  };

  const handleIOSInstall = () => {
    setShowIOSInstructions(true);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-install-dismissed', 'true');
    setShowIOSInstructions(false);
    setDeferredPrompt(null);
  };

  if (isInstalled) return null;

  if (showIOSInstructions && platform === 'ios') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Install App</h3>
            <button
              onClick={handleDismiss}
              className="text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4 text-white/90">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium mb-1">Tap the Share button</p>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Share className="w-4 h-4" />
                  <span>At the bottom of Safari</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium mb-1">Scroll and tap "Add to Home Screen"</p>
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Plus className="w-4 h-4" />
                  <span>Look for this icon</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium mb-1">Tap "Add"</p>
                <p className="text-sm text-white/70">App will appear on your home screen</p>
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleDismiss}
            className="w-full mt-6 bg-white/20 hover:bg-white/30 border border-white/30"
          >
            Got it!
          </Button>
        </div>
      </div>
    );
  }

  if (platform === 'android' && deferredPrompt) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={handleAndroidInstall}
          size="lg"
          className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400 shadow-lg font-semibold"
        >
          <Download className="w-5 h-5 mr-2" />
          Install App
        </Button>
      </div>
    );
  }

  if (platform === 'ios') {
    return (
      <Alert className="mx-4 mb-4 bg-white/10 backdrop-blur-md border border-white/20">
        <Download className="h-4 w-4 text-amber-400" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-white/90 text-sm">
            Install app for better experience
          </span>
          <Button
            onClick={handleIOSInstall}
            size="sm"
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold ml-2"
          >
            How?
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}