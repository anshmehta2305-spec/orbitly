export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedAt: string;
  author: {
    name: string;
    role: string;
    avatarInitial: string;
  };
}

export const sampleArticles: BlogArticle[] = [
  {
    slug: 'scaling-multi-platform-social-strategy-2026',
    title: 'How High-Growth Teams Scale Multi-Platform Social in 2026',
    excerpt:
      'Learn the tactical principles behind planning once and publishing across 15+ networks without burning out your editorial team.',
    category: 'Strategy',
    readTime: '6 min read',
    publishedAt: 'November 20, 2026',
    author: {
      name: 'Sarah Miller',
      role: 'Head of Content, Orbitly',
      avatarInitial: 'S',
    },
  },
  {
    slug: 'ai-tone-repurposing-guide',
    title: 'The Blueprint to Repurposing Blog Articles into Viral Social Threads',
    excerpt:
      'A deep dive into transforming long-form engineering essays into high-engagement LinkedIn posts, X threads, and Instagram carousels.',
    category: 'AI & Automation',
    readTime: '8 min read',
    publishedAt: 'November 15, 2026',
    author: {
      name: 'Alex Rivera',
      role: 'Growth Lead, Orbitly',
      avatarInitial: 'A',
    },
  },
  {
    slug: 'optimizing-best-time-to-post-utc',
    title: 'Understanding Global Publishing Timezones & Queue Engines',
    excerpt:
      'Why storing scheduling records strictly in UTC while calculating audience engagement in local time zones solves multi-region publishing.',
    category: 'Engineering',
    readTime: '5 min read',
    publishedAt: 'November 10, 2026',
    author: {
      name: 'David Chen',
      role: 'Principal Engineer, Orbitly',
      avatarInitial: 'D',
    },
  },
];
