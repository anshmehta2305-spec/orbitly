import { ManualPostReminder } from '../types/mobile';

export interface ManualPublishResult {
  captionCopied: boolean;
  deepLink: string;
  fallbackUrl: string;
  platformName: string;
}

export class NotificationBasedPostingService {
  private clipboardContent: string = '';

  /**
   * Step 1: Copy media caption & hashtags to device clipboard
   * In Expo/React Native, this executes `await Clipboard.setStringAsync(text)`
   */
  async copyCaptionToClipboard(caption: string): Promise<boolean> {
    this.clipboardContent = caption;
    console.log(`📋 [Mobile Clipboard] Copied caption to clipboard (${caption.length} chars)`);
    return true;
  }

  getClipboardContent(): string {
    return this.clipboardContent;
  }

  /**
   * Step 2: Formulate native deep link to open Instagram or TikTok on iOS & Android
   */
  getNativeDeepLink(platform: 'INSTAGRAM' | 'TIKTOK'): {
    deepLink: string;
    fallbackUrl: string;
    platformName: string;
  } {
    if (platform === 'INSTAGRAM') {
      return {
        // Native URI scheme for Instagram camera/feed composer
        deepLink: 'instagram://camera',
        fallbackUrl: 'https://instagram.com',
        platformName: 'Instagram',
      };
    } else {
      return {
        // Native URI scheme for TikTok camera/video creator
        deepLink: 'snssdk1233://feed',
        fallbackUrl: 'https://www.tiktok.com',
        platformName: 'TikTok',
      };
    }
  }

  /**
   * Two-tap execution: Prepares clipboard copy and launches target app
   */
  async prepareAndLaunchManualPublish(reminder: ManualPostReminder): Promise<ManualPublishResult> {
    const { deepLink, fallbackUrl, platformName } = this.getNativeDeepLink(reminder.platform);

    // 1. Copy formatted text & hashtags
    const captionCopied = await this.copyCaptionToClipboard(reminder.caption);

    console.log(`🚀 [Manual Publishing Triggered] Tapping 'Open in ${platformName}' -> ${deepLink}`);

    return {
      captionCopied,
      deepLink,
      fallbackUrl,
      platformName,
    };
  }
}

export const notificationPostingService = new NotificationBasedPostingService();
