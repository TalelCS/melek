// lib/notifications.ts

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }
  
    if (Notification.permission === 'granted') {
      return 'granted';
    }
  
    if (Notification.permission === 'denied') {
      return 'denied';
    }
  
    // Request permission
    const permission = await Notification.requestPermission();
    return permission;
  }
  
  /**
   * Check if notifications are supported and granted
   */
  export function canSendNotifications(): boolean {
    return (
      'Notification' in window &&
      Notification.permission === 'granted'
    );
  }
  
  /**
   * Send a local notification
   */
  export function sendNotification(
    title: string,
    options?: {
      body?: string;
      icon?: string;
      badge?: string;
      tag?: string;
      requireInteraction?: boolean;
      silent?: boolean;
      vibrate?: number[];
      data?: any;
    }
  ) {
    if (!canSendNotifications()) {
      console.warn('Cannot send notification - permission not granted');
      return null;
    }
  
    const defaultOptions = {
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      ...options,
    };
  
    try {
      const notification = new Notification(title, defaultOptions);
      
      // Auto-close after 10 seconds if not require interaction
      if (!defaultOptions.requireInteraction) {
        setTimeout(() => notification.close(), 10000);
      }
  
      return notification;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return null;
    }
  }
  
  /**
   * Queue-specific notification helpers
   */
  export const QueueNotifications = {
    /**
     * Notify user they're next in line
     */
    notifyNext: (userName: string, position: number) => {
      return sendNotification(
        "🎉 You're Next!",
        {
          body: `Hi ${userName}! You're #${position}. Please come to the shop now.`,
          requireInteraction: true,
          tag: 'queue-next',
          vibrate: [200, 100, 200, 100, 200],
          data: { type: 'next', position },
        }
      );
    },
  
    /**
     * Notify user they're almost next (1-2 people ahead)
     */
    notifyAlmostNext: (userName: string, position: number, peopleAhead: number) => {
      return sendNotification(
        '⏰ Almost Your Turn',
        {
          body: `Hi ${userName}! ${peopleAhead} ${peopleAhead === 1 ? 'person' : 'people'} ahead of you. Please come to the shop in ~15 minutes.`,
          requireInteraction: false,
          tag: 'queue-almost',
          data: { type: 'almost-next', position, peopleAhead },
        }
      );
    },
  
    /**
     * Notify user when queue opens
     */
    notifyQueueOpen: () => {
      return sendNotification(
        '🟢 Queue is Open',
        {
          body: 'The barber queue is now open. Join now!',
          requireInteraction: false,
          tag: 'queue-status',
          data: { type: 'queue-open' },
        }
      );
    },
  
    /**
     * Notify user they've been skipped
     */
    notifySkipped: (userName: string, newPosition: number) => {
      return sendNotification(
        '⚠️ Position Changed',
        {
          body: `Hi ${userName}, you've been moved to position #${newPosition}. Please come to the shop.`,
          requireInteraction: true,
          tag: 'queue-skip',
          vibrate: [300, 100, 300],
          data: { type: 'skipped', position: newPosition },
        }
      );
    },
  
    /**
     * Test notification
     */
    testNotification: () => {
      return sendNotification(
        '✅ Notifications Enabled',
        {
          body: 'You will receive updates about your queue position.',
          requireInteraction: false,
          tag: 'test',
          data: { type: 'test' },
        }
      );
    },
  };
  
  /**
   * Save notification preference to localStorage
   */
  export function saveNotificationPreference(enabled: boolean) {
    localStorage.setItem('notifications-enabled', enabled ? 'true' : 'false');
  }
  
  /**
   * Get notification preference from localStorage
   */
  export function getNotificationPreference(): boolean {
    const pref = localStorage.getItem('notifications-enabled');
    return pref === 'true';
  }
  
  /**
   * Check if user has been asked for notification permission before
   */
  export function hasAskedForNotifications(): boolean {
    return localStorage.getItem('notifications-asked') === 'true';
  }
  
  /**
   * Mark that we've asked for notifications
   */
  export function markNotificationsAsked() {
    localStorage.setItem('notifications-asked', 'true');
  }