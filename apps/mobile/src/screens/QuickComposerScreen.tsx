import React, { useState } from 'react';
import { mobileApi } from '../api/client';

export const QuickComposerScreen: React.FC<{ onPostSuccess?: () => void }> = ({ onPostSuccess }) => {
  const [content, setContent] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['c1', 'c2']);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduledSuccess, setScheduledSuccess] = useState(false);

  const channelsList = [
    { id: 'c1', name: 'LinkedIn (Sarah)', color: '#0a66c2', provider: 'L' },
    { id: 'c2', name: 'Bluesky (@sarah)', color: '#0284c7', provider: 'B' },
    { id: 'c3', name: 'Instagram (@sarah.designs)', color: '#e1306c', provider: 'I' },
    { id: 'c4', name: 'TikTok (@sarah_creatives)', color: '#000000', provider: 'T' },
  ];

  const toggleChannel = (id: string) => {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePickFromGallery = () => {
    // In Expo: await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All })
    const sample = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600';
    setMediaUrl(sample);
  };

  const handleTakePhoto = () => {
    // In Expo: await ImagePicker.launchCameraAsync()
    const sample = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600';
    setMediaUrl(sample);
  };

  const handleSubmit = async (publishNow: boolean) => {
    if (!content.trim() && !mediaUrl) return;
    setIsSubmitting(true);

    try {
      await mobileApi.quickPublish({
        content,
        channelIds: selectedChannels,
        mediaUrls: mediaUrl ? [mediaUrl] : [],
        publishNow,
      });

      setScheduledSuccess(true);
      setTimeout(() => {
        setContent('');
        setMediaUrl(null);
        setScheduledSuccess(false);
        onPostSuccess?.();
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 500, margin: '0 auto', color: '#fff' }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 16px 0' }}>Quick Composer</h2>

      {/* Target Channel Selector Chips */}
      <div style={{ marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>
          Select Channels
        </span>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {channelsList.map((ch) => {
            const isSelected = selectedChannels.includes(ch.id);
            return (
              <button
                key={ch.id}
                onClick={() => toggleChannel(ch.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSelected ? `2px solid ${ch.color}` : '1px solid #232738',
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.2)' : '#12141f',
                  color: isSelected ? '#fff' : '#9ca3af',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: ch.color,
                  }}
                />
                <span>{ch.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor Box */}
      <div
        style={{
          backgroundColor: '#12141f',
          border: '1px solid #232738',
          borderRadius: 20,
          padding: 16,
          marginBottom: 14,
        }}
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening? Compose once for all platforms..."
          style={{
            width: '100%',
            height: 120,
            backgroundColor: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: 14,
            lineHeight: 1.6,
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />

        {/* Media Thumbnail */}
        {mediaUrl && (
          <div style={{ position: 'relative', marginTop: 8, borderRadius: 12, overflow: 'hidden', height: 120 }}>
            <img src={mediaUrl} alt="Attached" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              onClick={() => setMediaUrl(null)}
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 24,
                height: 24,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Controls Bar: Camera, Photo, Char Count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleTakePhoto}
              style={{
                backgroundColor: '#1f2333',
                border: 'none',
                color: '#818cf8',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              📸 Camera
            </button>
            <button
              onClick={handlePickFromGallery}
              style={{
                backgroundColor: '#1f2333',
                border: 'none',
                color: '#818cf8',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              🖼️ Gallery
            </button>
          </div>

          <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>
            {content.length} chars
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting || selectedChannels.length === 0}
          style={{
            flex: 1,
            backgroundColor: '#6366f1',
            color: '#fff',
            border: 'none',
            padding: 14,
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            opacity: selectedChannels.length === 0 ? 0.5 : 1,
          }}
        >
          {isSubmitting ? 'Scheduling...' : scheduledSuccess ? '✅ Scheduled!' : '🗓️ Schedule (Tomorrow 10am)'}
        </button>
        <button
          onClick={() => handleSubmit(true)}
          disabled={isSubmitting || selectedChannels.length === 0}
          style={{
            backgroundColor: '#1f2333',
            color: '#fff',
            border: '1px solid #2e334d',
            padding: '14px 18px',
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          🚀 Publish Now
        </button>
      </div>
    </div>
  );
};
