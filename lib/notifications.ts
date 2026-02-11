// lib/notifications.ts

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Ce navigateur ne supporte pas les notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';

  return await Notification.requestPermission();
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
    console.warn('Impossible d\'envoyer une notification — permission non accordée');
    return null;
  }

  const defaultOptions = {
    icon: '/client-icons/icon-192x192.png',
    badge: '/client-icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    ...options,
  };

  try {
    const notification = new Notification(title, defaultOptions);

    if (!defaultOptions.requireInteraction) {
      setTimeout(() => notification.close(), 10000);
    }

    return notification;
  } catch (error) {
    console.error('Échec de l\'envoi de la notification:', error);
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
  notifyNext: (userName: string, ticketNumber: number) => {
    return sendNotification(
      '🎉 C\'est votre tour !',
      {
        body: `${userName}, vous êtes le numéro #${ticketNumber}. Veuillez vous présenter au salon maintenant.`,
        requireInteraction: true,
        tag: 'queue-next',
        vibrate: [200, 100, 200, 100, 200],
        data: { type: 'next', ticketNumber },
      }
    );
  },

  /**
   * Notify user they're almost next (1-2 people ahead)
   */
  notifyAlmostNext: (userName: string, ticketNumber: number, peopleAhead: number) => {
    return sendNotification(
      '⏰ Votre tour approche',
      {
        body: `${userName}, il reste ${peopleAhead} personne${peopleAhead > 1 ? 's' : ''} avant vous. Dirigez-vous vers le salon dans ~15 minutes.`,
        requireInteraction: false,
        tag: 'queue-almost',
        vibrate: [200, 100, 200],
        data: { type: 'almost-next', ticketNumber, peopleAhead },
      }
    );
  },

  /**
   * Notify user when queue opens
   */
  notifyQueueOpen: () => {
    return sendNotification(
      '🟢 File d\'attente ouverte',
      {
        body: 'La file d\'attente de Melek Coiff est maintenant ouverte. Rejoignez-la dès maintenant !',
        requireInteraction: false,
        tag: 'queue-status',
        data: { type: 'queue-open' },
      }
    );
  },

  /**
   * Notify user they've been skipped / repositioned
   */
  notifySkipped: (userName: string, newTicketNumber: number) => {
    return sendNotification(
      '⚠️ Position modifiée',
      {
        body: `${userName}, vous avez été repositionné au numéro #${newTicketNumber}. Veuillez vous présenter au salon.`,
        requireInteraction: true,
        tag: 'queue-skip',
        vibrate: [300, 100, 300],
        data: { type: 'skipped', ticketNumber: newTicketNumber },
      }
    );
  },

  /**
   * Notify user they were removed (no-show)
   */
  notifyNoShow: () => {
    return sendNotification(
      '⚠️ Absence signalée — Melek Coiff',
      {
        body: 'Vous avez été marqué comme absent après 3 reports. Parlez au coiffeur si c\'était une erreur.',
        requireInteraction: true,
        tag: 'queue-no-show',
        vibrate: [300, 100, 300],
        data: { type: 'no-show' },
      }
    );
  },

  /**
   * Notify user they were removed by admin
   */
  notifyRemovedByAdmin: (reason: string) => {
    return sendNotification(
      '⚠️ Retiré de la file — Melek Coiff',
      {
        body: `Vous avez été retiré de la file. Raison : ${reason}`,
        requireInteraction: true,
        tag: 'queue-removed',
        vibrate: [300, 100, 300],
        data: { type: 'removed-by-admin', reason },
      }
    );
  },

  /**
   * Confirmation notification after enabling
   */
  testNotification: () => {
    return sendNotification(
      '✅ Notifications activées',
      {
        body: 'Vous recevrez des mises à jour sur votre position dans la file d\'attente.',
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
  return localStorage.getItem('notifications-enabled') === 'true';
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