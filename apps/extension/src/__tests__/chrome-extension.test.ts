import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractWebpageMetadata, formatDefaultCaption } from '../extractor';

describe('Chrome Extension (MV3) Metadata Extractor', () => {
  function createMockDocument(html: string) {
    // Basic mock of DOM queries
    return {
      title: 'Fallback Document Title',
      querySelector: (selector: string) => {
        if (selector === 'meta[property="og:title"]') {
          const match = html.match(/<meta property="og:title" content="([^"]+)"/);
          return match ? { getAttribute: () => match[1] } : null;
        }
        if (selector === 'meta[name="twitter:title"]') {
          const match = html.match(/<meta name="twitter:title" content="([^"]+)"/);
          return match ? { getAttribute: () => match[1] } : null;
        }
        if (selector === 'meta[property="og:description"]') {
          const match = html.match(/<meta property="og:description" content="([^"]+)"/);
          return match ? { getAttribute: () => match[1] } : null;
        }
        if (selector === 'meta[name="description"]') {
          const match = html.match(/<meta name="description" content="([^"]+)"/);
          return match ? { getAttribute: () => match[1] } : null;
        }
        if (selector === 'meta[property="og:image"]') {
          const match = html.match(/<meta property="og:image" content="([^"]+)"/);
          return match ? { getAttribute: () => match[1] } : null;
        }
        if (selector === 'meta[name="twitter:image"]') {
          const match = html.match(/<meta name="twitter:image" content="([^"]+)"/);
          return match ? { getAttribute: () => match[1] } : null;
        }
        if (selector === 'link[rel="canonical"]') {
          const match = html.match(/<link rel="canonical" href="([^"]+)"/);
          return match ? { getAttribute: () => match[1] } : null;
        }
        if (selector === 'meta[property="og:url"]') {
          const match = html.match(/<meta property="og:url" content="([^"]+)"/);
          return match ? { getAttribute: () => match[1] } : null;
        }
        if (selector === 'meta[property="og:site_name"]') {
          const match = html.match(/<meta property="og:site_name" content="([^"]+)"/);
          return match ? { getAttribute: () => match[1] } : null;
        }
        return null;
      },
    } as any;
  }

  it('should extract Open Graph tags when present', () => {
    const html = `
      <meta property="og:title" content="The Future of Social Automation in 2026" />
      <meta property="og:description" content="Deep dive into multi-channel orchestration and AI workflows." />
      <meta property="og:image" content="https://cdn.example.com/cover.jpg" />
      <link rel="canonical" href="https://example.com/blog/future-2026" />
      <meta property="og:site_name" content="TechDispatch" />
    `;

    const mockDoc = createMockDocument(html);
    const meta = extractWebpageMetadata(mockDoc, 'https://example.com/blog/future-2026?utm_source=twitter');

    expect(meta.title).toBe('The Future of Social Automation in 2026');
    expect(meta.description).toBe('Deep dive into multi-channel orchestration and AI workflows.');
    expect(meta.ogImage).toBe('https://cdn.example.com/cover.jpg');
    expect(meta.canonicalUrl).toBe('https://example.com/blog/future-2026');
    expect(meta.siteName).toBe('TechDispatch');
  });

  it('should fallback to document.title, meta description, and window location when OG tags are absent', () => {
    const html = `
      <meta name="description" content="Standard SEO meta description text." />
    `;

    const mockDoc = createMockDocument(html);
    const meta = extractWebpageMetadata(mockDoc, 'https://simple-blog.org/article-1');

    expect(meta.title).toBe('Fallback Document Title');
    expect(meta.description).toBe('Standard SEO meta description text.');
    expect(meta.ogImage).toBeUndefined();
    expect(meta.canonicalUrl).toBe('https://simple-blog.org/article-1');
  });

  it('should resolve relative canonical URL with fallback URL origin', () => {
    const html = `
      <link rel="canonical" href="/posts/deep-work" />
    `;

    const mockDoc = createMockDocument(html);
    const meta = extractWebpageMetadata(mockDoc, 'https://myjournal.dev/posts/deep-work?ref=rss');

    expect(meta.canonicalUrl).toBe('https://myjournal.dev/posts/deep-work');
  });

  it('should format default social caption with title and canonical link', () => {
    const caption = formatDefaultCaption({
      title: 'Building Orbitly: From Idea to Scale',
      description: 'Case study on building a world-class social publishing platform.',
      canonicalUrl: 'https://orbitly.io/blog/case-study',
    });

    expect(caption).toContain('Building Orbitly: From Idea to Scale');
    expect(caption).toContain('https://orbitly.io/blog/case-study');
  });
});
