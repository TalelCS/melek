"use client"
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, BellOff, X } from 'lucide-react';
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

  useEffect(() => {
    // Check if notifications are already enabled
    if (canSendNotifications()) {
      setNotificationsEnabled(true);
      onPermissionChange?.(true);
      return;
    }

    // Check if we should show the prompt
    const hasAsked = hasAskedForNotifications();
    const userPreference = getNotificationPreference();

    // Don't show if user already declined
    if (hasAsked && !userPreference) {
      return;
    }

    // Show prompt after 5 seconds if user hasn't been asked
    if (!hasAsked) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [onPermissionChange]);

  const handleEnable = async () => {
    setLoading(true);
    markNotificationsAsked();

    const permission = await requestNotificationPermission();

    if (permission === 'granted') {
      setNotificationsEnabled(true);
      saveNotificationPreference(true);
      setShowPrompt(false);
      onPermissionChange?.(true);

      // Send test notification
      setTimeout(() => {
        QueueNotifications.testNotification();
      }, 500);
    } else {
      saveNotificationPreference(false);
      setShowPrompt(false);
      onPermissionChange?.(false);
    }

    setLoading(false);
  };

  const handleDismiss = () => {
    markNotificationsAsked();
    saveNotificationPreference(false);
    setShowPrompt(false);
    onPermissionChange?.(false);
  };

  // Don't render anything if notifications already enabled
  if (notificationsEnabled) {
    return null;
  }

  // Don't render if prompt shouldn't be shown
  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom">
      <Alert className="bg-white shadow-2xl border-2 border-blue-300 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <Bell className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          
          <div className="flex-1">
            <AlertDescription>
              <p className="font-semibold text-slate-800 mb-2">
                🔔 Get Notified
              </p>
              <p className="text-sm text-slate-600 mb-3">
                We'll send you a notification when it's almost your turn, so you don't have to keep checking!
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleEnable}
                  disabled={loading}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Bell className="w-4 h-4 mr-1" />
                  {loading ? 'Enabling...' : 'Enable Notifications'}
                </Button>
                <Button
                  onClick={handleDismiss}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                >
                  Not Now
                </Button>
              </div>
            </AlertDescription>
          </div>

          <button
            onClick={handleDismiss}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </Alert>
    </div>
  );
}

/**
 * Simple toggle button for notification settings
 */
export function NotificationToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(canSendNotifications());
  }, []);

  const handleToggle = async () => {
    if (enabled) {
      // Can't really "disable" notifications once granted
      // Just update preference
      saveNotificationPreference(false);
      setEnabled(false);
    } else {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        saveNotificationPreference(true);
        setEnabled(true);
        QueueNotifications.testNotification();
      }
    }
  };

  return (
    <Button
      onClick={handleToggle}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      {enabled ? (
        <>
          <Bell className="w-4 h-4" />
          Notifications On
        </>
      ) : (
        <>
          <BellOff className="w-4 h-4" />
          Notifications Off
        </>
      )}
    </Button>
  );
}