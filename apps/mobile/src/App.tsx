import React, { useState, useEffect } from 'react';
import { FeedScreen } from './screens/FeedScreen';
import { QuickComposerScreen } from './screens/QuickComposerScreen';
import { pushNotificationService } from './services/push-notifications';
import { PushNotificationPayload } from './types/mobile';

export default function App() {
  const [activeTab, setActiveTab] = useState<'feed' | 'compose' | 'notifications'>('feed');
  const [notificationsList, setNotificationsList] = useState<PushNotificationPayload[]>([
    {
      type: 'MANUAL_POST_REMINDER',
      title: 'Time to Post on Instagram',
      body: 'Your scheduled post for @sarah.designs is ready. Tap to copy caption and open Instagram.',
      data: {
        platform: 'INSTAGRAM',
        caption: 'Building the future of social publishing on mobile 🚀 #orbitly',
      },
    },
    {
      type: 'POST_PUBLISHED',
      title: 'Post Published Successfully',
      body: 'Your update went live on LinkedIn & Bluesky.',
      data: { channelName: 'LinkedIn (Sarah)' },
    },
    {
      type: 'APPROVAL_REQUESTED',
      title: 'Approval Requested',
      body: 'Devon submitted "Q4 Product Launch" for your review.',
      data: { postId: 'p_99' },
    },
  ]);

  useEffect(() => {
    // Register push notification token on mobile launch
    pushNotificationService.registerForPushNotifications();

    pushNotificationService.registerHandlers({
      onPostPublished: (payload) => setNotificationsList((prev) => [payload, ...prev]),
      onApprovalRequested: (payload) => setNotificationsList((prev) => [payload, ...prev]),
      onPostFailed: (payload) => setNotificationsList((prev) => [payload, ...prev]),
      onManualPostReminder: (payload) => setNotificationsList((prev) => [payload, ...prev]),
    });
  }, []);

  return (
    <div
      style={{
        backgroundColor: '#090a10',
        minHeight: '100vh',
        color: '#f3f4f6',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Mobile Bar */}
      <header
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1f2333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(9, 10, 16, 0.95)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🪐</span>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
            Orbitly Mobile
          </span>
        </div>
        <div style={{ fontSize: 11, padding: '4px 8px', borderRadius: 8, backgroundColor: '#1e293b', color: '#94a3b8' }}>
          Expo v1.0
        </div>
      </header>

      {/* Screen Body */}
      <main style={{ flex: 1, paddingBottom: 80 }}>
        {activeTab === 'feed' && <FeedScreen />}
        {activeTab === 'compose' && <QuickComposerScreen onPostSuccess={() => setActiveTab('feed')} />}
        {activeTab === 'notifications' && (
          <div style={{ padding: 16, maxWidth: 500, margin: '0 auto' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 16px 0' }}>Push Notifications</h2>
            {notificationsList.map((notif, idx) => {
              const badge = pushNotificationService.formatNotificationBadge(notif.type);
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#12141f',
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 10,
                    border: '1px solid #232738',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{notif.title}</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        backgroundColor: `${badge.color}20`,
                        color: badge.color,
                        padding: '2px 8px',
                        borderRadius: 10,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, lineHeight: 1.4 }}>{notif.body}</p>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Mobile Tab Bar */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#0d0f18',
          borderTop: '1px solid #1f2333',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '12px 0 16px 0',
          zIndex: 50,
        }}
      >
        <button
          onClick={() => setActiveTab('feed')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'feed' ? '#6366f1' : '#6b7280',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{ fontSize: 16 }}>🗓️</span>
          <span>Feed</span>
        </button>

        <button
          onClick={() => setActiveTab('compose')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'compose' ? '#6366f1' : '#6b7280',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{ fontSize: 16 }}>✍️</span>
          <span>Compose</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'notifications' ? '#6366f1' : '#6b7280',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{ fontSize: 16 }}>🔔</span>
          <span>Alerts</span>
        </button>
      </nav>
    </div>
  );
}
