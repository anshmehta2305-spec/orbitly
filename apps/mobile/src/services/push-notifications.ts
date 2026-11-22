import { PushNotificationPayload, PushNotificationType } from '../types/mobile';

export interface PushNotificationHandler {
  onPostPublished?: (payload: PushNotificationPayload) => void;
  onApprovalRequested?: (payload: PushNotificationPayload) => void;
  onPostFailed?: (payload: PushNotificationPayload) => void;
  onManualPostReminder?: (payload: PushNotificationPayload) => void;
}

export class MobilePushNotificationService {
  private handlers: PushNotificationHandler = {};
  private registeredPushToken: string | null = null;

  registerHandlers(handlers: PushNotificationHandler) {
    this.handlers = { ...this.handlers, ...handlers };
  }

  async registerForPushNotifications(): Promise<string> {
    // In production with Expo:
    // const { status } = await Notifications.requestPermissionsAsync();
    // const token = (await Notifications.getExpoPushTokenAsync()).data;
    const mockExpoToken = `ExponentPushToken[orbitly_device_${Date.now()}]`;
    this.registeredPushToken = mockExpoToken;
    console.log(`📱 [Mobile Push] Registered Expo push token: ${mockExpoToken}`);
    return mockExpoToken;
  }

  getRegisteredToken(): string | null {
    return this.registeredPushToken;
  }

  handleIncomingNotification(payload: PushNotificationPayload): {
    routedTo: PushNotificationType;
    actionRequired: boolean;
  } {
    console.log(`🔔 [Mobile Push Received] Type: ${payload.type} | Title: ${payload.title}`);

    switch (payload.type) {
      case 'POST_PUBLISHED':
        this.handlers.onPostPublished?.(payload);
        return { routedTo: 'POST_PUBLISHED', actionRequired: false };

      case 'APPROVAL_REQUESTED':
        this.handlers.onApprovalRequested?.(payload);
        return { routedTo: 'APPROVAL_REQUESTED', actionRequired: true };

      case 'POST_FAILED':
        this.handlers.onPostFailed?.(payload);
        return { routedTo: 'POST_FAILED', actionRequired: true };

      case 'MANUAL_POST_REMINDER':
        this.handlers.onManualPostReminder?.(payload);
        return { routedTo: 'MANUAL_POST_REMINDER', actionRequired: true };

      default:
        return { routedTo: payload.type, actionRequired: false };
    }
  }

  formatNotificationBadge(type: PushNotificationType): { color: string; label: string } {
    switch (type) {
      case 'POST_PUBLISHED':
        return { color: '#10b981', label: 'Published' };
      case 'APPROVAL_REQUESTED':
        return { color: '#f59e0b', label: 'Review Needed' };
      case 'POST_FAILED':
        return { color: '#ef4444', label: 'Failed Alert' };
      case 'MANUAL_POST_REMINDER':
        return { color: '#e1306c', label: 'Manual Post' };
    }
  }
}

export const pushNotificationService = new MobilePushNotificationService();
