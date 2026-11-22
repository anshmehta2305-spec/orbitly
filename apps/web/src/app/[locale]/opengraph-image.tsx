import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Orbitly — Plan once. Publish everywhere.';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0B0F19',
          backgroundImage:
            'radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.25) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.25) 0%, transparent 50%)',
          color: '#F8FAFC',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <svg width="72" height="72" viewBox="0 0 48 48" fill="none">
            <ellipse cx="24" cy="24" rx="21" ry="9" transform="rotate(-28 24 24)" stroke="#6366F1" strokeWidth="3" />
            <path d="M7 28 C 12 12, 36 8, 41 20 C 43 25, 39 36, 26 40" stroke="#06B6D4" strokeWidth="3.5" fill="none" />
            <circle cx="24" cy="24" r="7" fill="#6366F1" />
            <circle cx="24" cy="24" r="3" fill="#FFFFFF" />
            <circle cx="39" cy="18" r="4" fill="#06B6D4" />
          </svg>
          <span style={{ fontSize: '64px', fontWeight: 800, letterSpacing: '-0.03em' }}>
            Orbitly
          </span>
        </div>

        <div
          style={{
            fontSize: '38px',
            fontWeight: 700,
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.25,
            marginBottom: '20px',
          }}
        >
          Plan once. Publish everywhere.
        </div>

        <div
          style={{
            fontSize: '22px',
            color: '#94A3B8',
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          Unified social media scheduling, AI tone studio, and multi-workspace analytics.
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
