import React, { useState, useEffect } from 'react';
import { MobilePostItem } from '../types/mobile';
import { mobileApi } from '../api/client';
import { PostCard } from '../components/PostCard';
import { ManualPublishModal } from './ManualPublishModal';

export const FeedScreen: React.FC = () => {
  const [tab, setTab] = useState<'upcoming' | 'recent'>('upcoming');
  const [posts, setPosts] = useState<MobilePostItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedManualPost, setSelectedManualPost] = useState<MobilePostItem | null>(null);

  const loadFeed = async (selectedTab: 'upcoming' | 'recent') => {
    setLoading(true);
    try {
      const items = await mobileApi.getFeed(selectedTab);
      setPosts(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed(tab);
  }, [tab]);

  const handlePostMarkedDone = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: 'PUBLISHED', requiresManualPublishing: false } : p))
    );
  };

  return (
    <div style={{ padding: 16, maxWidth: 500, margin: '0 auto', color: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Publishing Feed</h2>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>Workspace: Sarah Creatives (Mobile)</span>
        </div>
        <button
          onClick={() => loadFeed(tab)}
          style={{
            backgroundColor: '#1f2333',
            border: 'none',
            color: '#818cf8',
            fontSize: 12,
            padding: '6px 12px',
            borderRadius: 10,
            cursor: 'pointer',
          }}
        >
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          backgroundColor: '#12141f',
          padding: 4,
          borderRadius: 14,
          marginBottom: 16,
          border: '1px solid #232738',
        }}
      >
        <button
          onClick={() => setTab('upcoming')}
          style={{
            flex: 1,
            padding: '10px 0',
            border: 'none',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: tab === 'upcoming' ? '#6366f1' : 'transparent',
            color: tab === 'upcoming' ? '#fff' : '#9ca3af',
            transition: 'all 0.2s',
          }}
        >
          Upcoming ({tab === 'upcoming' ? posts.length : '...'})
        </button>
        <button
          onClick={() => setTab('recent')}
          style={{
            flex: 1,
            padding: '10px 0',
            border: 'none',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: tab === 'recent' ? '#6366f1' : 'transparent',
            color: tab === 'recent' ? '#fff' : '#9ca3af',
            transition: 'all 0.2s',
          }}
        >
          Recent Activity
        </button>
      </div>

      {/* Post List */}
      <div>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onTapManualPublish={(p) => setSelectedManualPost(p)}
          />
        ))}
      </div>

      {/* Manual Publish 2-tap Assistant Modal */}
      <ManualPublishModal
        post={selectedManualPost}
        onClose={() => setSelectedManualPost(null)}
        onPostMarkedDone={handlePostMarkedDone}
      />
    </div>
  );
};
