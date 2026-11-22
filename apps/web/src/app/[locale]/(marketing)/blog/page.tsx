import React from 'react';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { sampleArticles } from '@/lib/blog-data';
import { Clock, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div>
      <Section className="pt-12 pb-16 bg-gradient-to-b from-primary/10 via-background to-background text-center">
        <Container className="space-y-4">
          <Badge variant="pulse">Editorial & Insights</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">
            The Orbitly Blog
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Actionable strategies, product engineering breakdowns, and social media scheduling playbooks from our team.
          </p>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container className="max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {sampleArticles.map((article) => (
              <Card
                key={article.slug}
                className="p-6 rounded-3xl border border-border bg-card/60 hover:border-primary/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-3">
                    <span className="font-semibold text-primary">{article.category}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {article.readTime}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">
                    <Link href={`/${locale}/blog/${article.slug}`}>{article.title}</Link>
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-6">
                    {article.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                      {article.author.avatarInitial}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{article.author.name}</p>
                      <p className="text-[10px] text-muted-foreground">{article.publishedAt}</p>
                    </div>
                  </div>
                  <Link
                    href={`/${locale}/blog/${article.slug}`}
                    className="text-primary hover:translate-x-1 transition-transform"
                    aria-label={`Read ${article.title}`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
    </div>
  );
}
