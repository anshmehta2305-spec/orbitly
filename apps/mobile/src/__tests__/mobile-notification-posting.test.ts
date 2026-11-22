import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationPostingService } from '../services/notification-based-posting';
import { pushNotificationService } from '../services/push-notifications';
import { mobileApi } from '../api/client';
import { PushNotificationPayload } from '../types/mobile';

describe('Increment 3: Mobile Apps & Notification-Based Posting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // 1. 2-TAP NOTIFICATION-BASED POSTING
  // ==========================================
  describe('NotificationBasedPostingService', () => {
    it('copies caption and hashtags to the device clipboard', async () => {
      const caption = 'Launching Orbitly Mobile! 🚀 #orbitly #saas #reactnative';
      const copied = await notificationPostingService.copyCaptionToClipboard(caption);

      expect(copied).toBe(true);
      expect(notificationPostingService.getClipboardContent()).toBe(caption);
    });

    it('returns valid native URI scheme deep link for Instagram', () => {
      const { deepLink, fallbackUrl, platformName } =
        notificationPostingService.getNativeDeepLink('INSTAGRAM');

      expect(deepLink).toBe('instagram://camera');
      expect(fallbackUrl).toBe('https://instagram.com');
      expect(platformName).toBe('Instagram');
    });

    it('returns valid native URI scheme deep link for TikTok', () => {
      const { deepLink, fallbackUrl, platformName } =
        notificationPostingService.getNativeDeepLink('TIKTOK');

      expect(deepLink).toBe('snssdk1233://feed');
      expect(fallbackUrl).toBe('https://www.tiktok.com');
      expect(platformName).toBe('TikTok');
    });

    it('executes 2-tap manual publish workflow seamlessly', async () => {
      const result = await notificationPostingService.prepareAndLaunchManualPublish({
        postVariantId: 'pv_insta_1',
        platform: 'INSTAGRAM',
        accountHandle: '@sarah.designs',
        caption: 'Behind the scenes at Orbitly! #design #ui',
        mediaUrl: 'https://cdn.orbitly.app/images/sample.jpg',
        scheduledAt: new Date().toISOString(),
      });

      expect(result.captionCopied).toBe(true);
      expect(result.deepLink).toBe('instagram://camera');
      expect(result.platformName).toBe('Instagram');
      expect(notificationPostingService.getClipboardContent()).toContain('Behind the scenes');
    });
  });

  // ==========================================
  // 2. EXPO PUSH NOTIFICATIONS
  // ==========================================
  describe('MobilePushNotificationService', () => {
    it('registers device and generates Expo push token', async () => {
      const token = await pushNotificationService.registerForPushNotifications();
      expect(token).toContain('ExponentPushToken[');
      expect(pushNotificationService.getRegisteredToken()).toBe(token);
    });

    it('routes POST_PUBLISHED notification to registered listener', () => {
      const onPublished = vi.fn();
      pushNotificationService.registerHandlers({ onPostPublished: onPublished });

      const payload: PushNotificationPayload = {
        type: 'POST_PUBLISHED',
        title: 'Post Published!',
        body: 'Your update went live on LinkedIn.',
        data: { channelName: 'LinkedIn' },
      };

      const result = pushNotificationService.handleIncomingNotification(payload);
      expect(result.routedTo).toBe('POST_PUBLISHED');
      expect(result.actionRequired).toBe(false);
      expect(onPublished).toHaveBeenCalledWith(payload);
    });

    it('routes APPROVAL_REQUESTED notification with actionRequired flag', () => {
      const onApproval = vi.fn();
      pushNotificationService.registerHandlers({ onApprovalRequested: onApproval });

      const payload: PushNotificationPayload = {
        type: 'APPROVAL_REQUESTED',
        title: 'Approval Required',
        body: 'Devon submitted a draft for review.',
        data: { postId: 'p_123' },
      };

      const result = pushNotificationService.handleIncomingNotification(payload);
      expect(result.routedTo).toBe('APPROVAL_REQUESTED');
      expect(result.actionRequired).toBe(true);
      expect(onApproval).toHaveBeenCalledWith(payload);
    });

    it('routes POST_FAILED alert with actionRequired flag', () => {
      const onFailed = vi.fn();
      pushNotificationService.registerHandlers({ onPostFailed: onFailed });

      const payload: PushNotificationPayload = {
        type: 'POST_FAILED',
        title: 'Publish Failed',
        body: 'Twitter API Rate limit reached.',
        data: { errorReason: 'Rate limit (429)' },
      };

      const result = pushNotificationService.handleIncomingNotification(payload);
      expect(result.routedTo).toBe('POST_FAILED');
      expect(result.actionRequired).toBe(true);
      expect(onFailed).toHaveBeenCalledWith(payload);
    });

    it('routes MANUAL_POST_REMINDER notification with actionRequired flag', () => {
      const onReminder = vi.fn();
      pushNotificationService.registerHandlers({ onManualPostReminder: onReminder });

      const payload: PushNotificationPayload = {
        type: 'MANUAL_POST_REMINDER',
        title: 'Time to Post on Instagram',
        body: 'Tap to copy caption and open Instagram.',
        data: {
          platform: 'INSTAGRAM',
          caption: 'My manual post caption',
        },
      };

      const result = pushNotificationService.handleIncomingNotification(payload);
      expect(result.routedTo).toBe('MANUAL_POST_REMINDER');
      expect(result.actionRequired).toBe(true);
      expect(onReminder).toHaveBeenCalledWith(payload);
    });
  });

  // ==========================================
  // 3. MOBILE API FEED CLIENT
  // ==========================================
  describe('MobileApiClient', () => {
    it('returns upcoming posts with manual publishing tags', async () => {
      const upcoming = await mobileApi.getFeed('upcoming');
      expect(upcoming.length).toBeGreaterThan(0);

      const manualPost = upcoming.find((p) => p.requiresManualPublishing);
      expect(manualPost).toBeDefined();
      expect(manualPost?.channel.provider).toBe('INSTAGRAM');
    });

    it('returns recent activity with published and failed items', async () => {
      const recent = await mobileApi.getFeed('recent');
      expect(recent.length).toBeGreaterThan(0);

      const published = recent.find((p) => p.status === 'PUBLISHED');
      const failed = recent.find((p) => p.status === 'FAILED');

      expect(published).toBeDefined();
      expect(failed).toBeDefined();
      expect(failed?.errorMessage).toContain('Rate limit');
    });
  });
});
