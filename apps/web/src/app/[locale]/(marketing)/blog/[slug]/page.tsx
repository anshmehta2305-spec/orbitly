import React from 'react';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { sampleArticles, BlogArticle } from '@/lib/blog-data';
import { Clock, Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const article = sampleArticles.find((a: BlogArticle) => a.slug === slug);

  if (!article) {
    notFound();
  }

  return (
    <article className="py-12 sm:py-20">
      <Container className="max-w-4xl">
        <Link
          href={`/${locale}/blog`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Articles</span>
        </Link>

        {/* Article Header */}
        <header className="space-y-4 border-b border-border pb-8">
          <Badge variant="pulse">{article.category}</Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center">
                {article.author.avatarInitial}
              </div>
              <span className="font-semibold text-foreground">{article.author.name}</span>
            </div>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {article.publishedAt}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.readTime}
            </span>
          </div>
        </header>

        {/* Article Body */}
        <div className="py-10 space-y-6 text-sm text-foreground/90 leading-relaxed font-sans">
          <p className="text-base font-medium text-muted-foreground leading-relaxed">
            {article.excerpt}
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">The Challenge of Modern Social Publishing</h2>
          <p>
            Operating across multiple social channels used to mean opening 8 browser tabs, manually resizing
            images, formatting custom line-breaks for LinkedIn, checking character counters for X, and queuing
            videos individually for TikTok and Reels.
          </p>

          <h2 className="text-xl font-bold text-foreground pt-4">The "Plan Once, Publish Everywhere" Paradigm</h2>
          <p>
            With Orbitly's unified architecture, modern marketing teams start with a core narrative thesis. The
            system uses smart platform adapters to conform media aspect ratios, generate relevant hashtags, and
            queue posts for peak timezone engagement.
          </p>

          <div className="p-6 rounded-2xl bg-secondary/40 border border-border my-6 space-y-2">
            <h4 className="font-bold text-primary text-xs uppercase tracking-wider">Key Takeaway</h4>
            <p className="text-xs text-muted-foreground">
              Always decouple content creation from publishing scheduling. Crafting high-quality thoughts requires
              deep focus, while scheduling should be an automated, queue-driven workflow.
            </p>
          </div>

          <h2 className="text-xl font-bold text-foreground pt-4">Summary & Next Steps</h2>
          <p>
            Try implementing this workflow with your team using Orbitly's collaborative calendar and AI Studio.
          </p>
        </div>

        {/* Author Box */}
        <div className="p-6 rounded-3xl border border-border bg-card/60 flex items-center gap-4 mt-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white font-bold flex items-center justify-center text-lg shrink-0">
            {article.author.avatarInitial}
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">{article.author.name}</h4>
            <p className="text-xs text-muted-foreground">{article.author.role}</p>
          </div>
        </div>
      </Container>
    </article>
  );
}
