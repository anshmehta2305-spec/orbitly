export interface WebpageMetadata {
  title: string;
  description: string;
  ogImage?: string;
  canonicalUrl: string;
  siteName?: string;
  favIcon?: string;
}

/**
 * Extracts Open Graph, Twitter Cards, canonical metadata from the active webpage DOM
 */
export function extractWebpageMetadata(doc: Document, fallbackUrl: string): WebpageMetadata {
  // Title
  const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
  const twitterTitle = doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
  const title = (ogTitle || twitterTitle || doc.title || 'Untitled Webpage').trim();

  // Description
  const ogDesc = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');
  const twitterDesc = doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content');
  const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content');
  const description = (ogDesc || twitterDesc || metaDesc || '').trim();

  // OG Image
  const ogImage =
    doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
    undefined;

  // Canonical URL
  const canonicalHref = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
  const ogUrl = doc.querySelector('meta[property="og:url"]')?.getAttribute('content');
  let canonicalUrl = canonicalHref || ogUrl || fallbackUrl;

  // Resolve relative URLs to absolute if needed
  if (canonicalUrl.startsWith('/') && fallbackUrl) {
    try {
      const parsed = new URL(fallbackUrl);
      canonicalUrl = `${parsed.origin}${canonicalUrl}`;
    } catch {
      // Fallback as-is
    }
  }

  // Site name
  const siteName =
    doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') ||
    undefined;

  // Favicon
  const favIcon =
    doc.querySelector('link[rel="icon"]')?.getAttribute('href') ||
    doc.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
    undefined;

  return {
    title,
    description,
    ogImage,
    canonicalUrl,
    siteName,
    favIcon,
  };
}

/**
 * Formats a default social caption given extracted page metadata
 */
export function formatDefaultCaption(metadata: WebpageMetadata): string {
  const parts: string[] = [];
  if (metadata.title) parts.push(metadata.title);
  if (metadata.canonicalUrl) parts.push(metadata.canonicalUrl);
  return parts.join('\n\n');
}
