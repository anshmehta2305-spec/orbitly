import React, { useState } from 'react';
import { MobilePostItem } from '../types/mobile';
import { notificationPostingService } from '../services/notification-based-posting';
import { mobileApi } from '../api/client';

interface ManualPublishModalProps {
  post: MobilePostItem | null;
  onClose: () => void;
  onPostMarkedDone?: (postId: string) => void;
}

export const ManualPublishModal: React.FC<ManualPublishModalProps> = ({
  post,
  onClose,
  onPostMarkedDone,
}) => {
  const [copied, setCopied] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!post) return null;

  const platform = (post.channel.provider === 'TIKTOK' ? 'TIKTOK' : 'INSTAGRAM') as 'INSTAGRAM' | 'TIKTOK';
  const platformName = platform === 'TIKTOK' ? 'TikTok' : 'Instagram';
  const brandColor = platform === 'TIKTOK' ? '#000000' : '#e1306c';

  const handleCopyAndLaunch = async () => {
    // 1. Copy caption to clipboard
    await notificationPostingService.copyCaptionToClipboard(post.content);
    setCopied(true);

    // 2. Launch target native application
    const result = await notificationPostingService.prepareAndLaunchManualPublish({
      postVariantId: post.id,
      platform,
      accountHandle: post.channel.accountName,
      caption: post.content,
      mediaUrl: post.mediaUrls[0] || '',
      scheduledAt: post.scheduledAt,
    });

    setLaunched(true);
  };

  const handleMarkAsPublished = async () => {
    setIsSubmitting(true);
    await mobileApi.confirmManualPostPublished(post.id);
    setIsSubmitting(false);
    onPostMarkedDone?.(post.id);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 999,
      }}
    >
      <div
        style={{
          backgroundColor: '#12141f',
          borderRadius: 24,
          padding: 24,
          maxWidth: 420,
          width: '100%',
          border: '1px solid #232738',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
            Post to {platformName} (2 Taps)
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* Media Preview */}
        {post.mediaUrls.length > 0 && (
          <div style={{ borderRadius: 16, overflow: 'hidden', height: 160, marginBottom: 16 }}>
            <img
              src={post.mediaUrls[0]}
              alt="Media"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Caption Box */}
        <div
          style={{
            backgroundColor: '#090a10',
            border: '1px solid #1f2333',
            borderRadius: 14,
            padding: 12,
            fontSize: 12,
            lineHeight: 1.5,
            color: '#d1d5db',
            maxHeight: 100,
            overflowY: 'auto',
            marginBottom: 20,
          }}
        >
          {post.content}
        </div>

        {/* Step 1: Copy Caption & Open App */}
        <button
          onClick={handleCopyAndLaunch}
          style={{
            width: '100%',
            backgroundColor: brandColor,
            color: '#fff',
            border: 'none',
            padding: '14px 16px',
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <span>{copied ? '✅ Caption Copied!' : '📋 Tap 1: Copy Caption & Open App'}</span>
        </button>

        {/* Step 2: Confirm Published */}
        <button
          onClick={handleMarkAsPublished}
          disabled={isSubmitting}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            color: '#9ca3af',
            border: '1px solid #232738',
            padding: '12px 16px',
            borderRadius: 14,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {isSubmitting ? 'Confirming...' : 'Tap 2: Mark as Published in Orbitly'}
        </button>
      </div>
    </div>
  );
};
