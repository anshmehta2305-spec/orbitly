import React from 'react';
import { MobilePostItem } from '../types/mobile';

interface PostCardProps {
  post: MobilePostItem;
  onTapManualPublish?: (post: MobilePostItem) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onTapManualPublish }) => {
  const isScheduled = post.status === 'SCHEDULED';
  const isPublished = post.status === 'PUBLISHED';
  const isFailed = post.status === 'FAILED';

  const dateFormatted = new Date(post.scheduledAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      style={{
        backgroundColor: '#12141f',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        border: '1px solid #232738',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: post.channel.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 12,
              fontWeight: 'bold',
            }}
          >
            {post.channel.provider.charAt(0)}
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{post.channel.accountName}</div>
            <div style={{ color: '#9ca3af', fontSize: 11 }}>{dateFormatted}</div>
          </div>
        </div>

        {/* Status Badge */}
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            padding: '3px 8px',
            borderRadius: 12,
            backgroundColor: isScheduled
              ? 'rgba(99, 102, 241, 0.15)'
              : isPublished
              ? 'rgba(16, 185, 129, 0.15)'
              : 'rgba(239, 68, 68, 0.15)',
            color: isScheduled ? '#818cf8' : isPublished ? '#34d399' : '#f87171',
          }}
        >
          {post.status}
        </span>
      </div>

      {/* Caption Content */}
      <p style={{ color: '#e5e7eb', fontSize: 13, lineHeight: '1.5', margin: '8px 0' }}>{post.content}</p>

      {/* Media Thumbnail if present */}
      {post.mediaUrls.length > 0 && (
        <div style={{ borderRadius: 12, overflow: 'hidden', maxHeight: 160, margin: '8px 0' }}>
          <img
            src={post.mediaUrls[0]}
            alt="Post attachment"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Manual Publishing Action if Required */}
      {post.requiresManualPublishing && (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            borderRadius: 12,
            backgroundColor: 'rgba(225, 48, 108, 0.12)',
            border: '1px solid rgba(225, 48, 108, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#f472b6', fontSize: 11, fontWeight: 600 }}>
            🔔 Manual Post Reminder (Personal Profile)
          </span>
          <button
            onClick={() => onTapManualPublish?.(post)}
            style={{
              backgroundColor: '#e1306c',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Open in App &rarr;
          </button>
        </div>
      )}

      {/* Error reason if failed */}
      {post.errorMessage && (
        <div style={{ color: '#ef4444', fontSize: 11, marginTop: 6, fontStyle: 'italic' }}>
          Error: {post.errorMessage}
        </div>
      )}
    </div>
  );
};
