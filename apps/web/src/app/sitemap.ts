import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://orbitly.app';
  const locales = ['en', 'hi', 'es', 'fr', 'de', 'pt', 'ar'];
  const routes = [
    '',
    '/features',
    '/pricing',
    '/integrations',
    '/blog',
    '/about',
    '/contact',
    '/changelog',
    '/docs',
    '/privacy',
    '/terms',
    '/cookies',
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of routes) {
      entries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' || route === '/pricing' ? 'weekly' : 'monthly',
        priority: route === '' ? 1.0 : route === '/pricing' || route === '/features' ? 0.9 : 0.7,
      });
    }
  }

  return entries;
}
