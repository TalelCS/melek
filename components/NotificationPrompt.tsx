"use client"
import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X, Sparkles } from 'lucide-react';
import {
  requestNotificationPermission,
  canSendNotifications,
  QueueNotifications,
  saveNotificationPreference,
  getNotificationPreference,
  hasAskedForNotifications,
  markNotificationsAsked,
} from '@/lib/notifications';

interface NotificationPromptProps {
  userName?: string;
  onPermissionChange?: (granted: boolean) => void;
}

export default function NotificationPrompt({ userName, onPermissionChange }: NotificationPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false); // controls CSS enter animation

  useEffect(() => {
    if (canSendNotifications()) {
      setNotificationsEnabled(true);
      onPermissionChange?.(true);
      return;
    }

    const hasAsked = hasAskedForNotifications();
    const userPreference = getNotificationPreference();

    if (hasAsked && !userPreference) return;

    if (!hasAsked) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
        // Small extra delay so the CSS transition fires after mount
        requestAnimationFrame(() => setTimeout(() => setVisible(true), 30));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [onPermissionChange]);

  const handleDismissAnimated = (cb: () => void) => {
    setVisible(false);
    setTimeout(cb, 300); // wait for slide-out before unmounting
  };

  const handleEnable = async () => {
    setLoading(true);
    markNotificationsAsked();

    const permission = await requestNotificationPermission();

    if (permission === 'granted') {
      setNotificationsEnabled(true);
      saveNotificationPreference(true);
      onPermissionChange?.(true);
      handleDismissAnimated(() => {
        setShowPrompt(false);
        setTimeout(() => QueueNotifications.testNotification(), 200);
      });
    } else {
      saveNotificationPreference(false);
      onPermissionChange?.(false);
      handleDismissAnimated(() => setShowPrompt(false));
    }

    setLoading(false);
  };

  const handleDismiss = () => {
    markNotificationsAsked();
    saveNotificationPreference(false);
    onPermissionChange?.(false);
    handleDismissAnimated(() => setShowPrompt(false));
  };

  if (notificationsEnabled || !showPrompt) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4"
      style={{
        paddingBottom: `calc(1rem + env(safe-area-inset-bottom, 0px))`,
        /* Escape body safe-area padding same approach as InstallPWA */
        marginBottom: `calc(-1 * env(safe-area-inset-bottom, 0px))`,
      }}
    >
      <div
        className="max-w-sm mx-auto rounded-3xl overflow-hidden"
        style={{
          /* Slide-up + fade entrance */
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255,255,255,0.04) inset',
        }}
      >
        {/* Amber accent bar at top */}
        <div
          className="h-0.5 w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #f59e0b 40%, #d97706 60%, transparent)' }}
        />

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              {/* Icon with pulse ring */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(217,119,6,0.15))',
                    border: '1px solid rgba(245,158,11,0.35)',
                  }}
                >
                  <Bell className="w-5 h-5 text-amber-400" />
                </div>
                {/* Pulse dot */}
                <span
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                  style={{
                    background: '#f59e0b',
                    borderColor: 'rgba(11,17,32,0.8)',
                    animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
                  }}
                />
              </div>

              <div>
                <p className="text-white font-semibold text-sm leading-tight">
                  Activer les notifications
                </p>
                <p className="text-white/40 text-xs mt-0.5">
                  Ne ratez pas votre tour
                </p>
              </div>
            </div>

            {/* Close */}
            <button
              onClick={handleDismiss}
              disabled={loading}
              className="w-7 h-7 flex items-center justify-center rounded-full text-white/30 hover:text-white/70 hover:bg-white/10 transition-all flex-shrink-0 -mt-0.5 -mr-0.5"
              aria-label="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body */}
          <p className="text-white/60 text-sm leading-relaxed mb-5">
            On vous avertira dès que votre tour approche —{' '}
            <span className="text-white/80">plus besoin de vérifier constamment.</span>
          </p>

          {/* Actions */}
          <div className="flex gap-2.5">
            {/* Primary CTA */}
            <button
              onClick={handleEnable}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-sm font-semibold text-black transition-all active:scale-95 disabled:opacity-60"
              style={{
                background: loading
                  ? 'rgba(245,158,11,0.5)'
                  : 'linear-gradient(135deg, #f59e0b, #d97706)',
                boxShadow: loading ? 'none' : '0 4px 18px rgba(245, 158, 11, 0.30)',
              }}
            >
              {loading ? (
                <>
                  {/* Spinner */}
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Activation…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Activer
                </>
              )}
            </button>

            {/* Secondary */}
            <button
              onClick={handleDismiss}
              disabled={loading}
              className="py-2.5 px-4 rounded-2xl text-sm font-medium text-white/50 hover:text-white/80 transition-all active:scale-95 disabled:opacity-40"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   NotificationToggle — settings row button
───────────────────────────────────────────── */
export function NotificationToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEnabled(canSendNotifications());
  }, []);

  const handleToggle = async () => {
    if (enabled) {
      saveNotificationPreference(false);
      setEnabled(false);
      return;
    }

    setLoading(true);
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      saveNotificationPreference(true);
      setEnabled(true);
      QueueNotifications.testNotification();
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
      style={
        enabled
          ? {
              background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(217,119,6,0.10))',
              border: '1px solid rgba(245,158,11,0.30)',
              color: '#fbbf24',
            }
          : {
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.45)',
            }
      }
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
      ) : enabled ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      {loading ? 'Chargement…' : enabled ? 'Notifications activées' : 'Notifications désactivées'}
    </button>
  );
}