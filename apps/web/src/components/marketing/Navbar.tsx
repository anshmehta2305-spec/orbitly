'use client';

import React, { useState, useEffect } from 'react';
import { OrbitlyLogo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import {
  Calendar,
  PenSquare,
  Sparkles,
  Users,
  BarChart3,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import Link from 'next/link';

export function Navbar({ locale }: { locale: string }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const featureItems = [
    {
      title: 'Unified Calendar',
      desc: 'Plan, reschedule, and visualize cross-channel content in one interactive view.',
      icon: Calendar,
      href: `/${locale}/features#calendar`,
    },
    {
      title: 'Multi-Platform Composer',
      desc: 'Compose a global draft with per-network customizations and live previews.',
      icon: PenSquare,
      href: `/${locale}/features#composer`,
    },
    {
      title: 'AI Tone & Content Studio',
      desc: 'Repurpose articles, generate hashtags, and rewrite copy to match platform tone.',
      icon: Sparkles,
      href: `/${locale}/features#ai`,
    },
    {
      title: 'Team & Approval Workflows',
      desc: 'Multi-tenant workspaces, customizable permissions, comments and sign-offs.',
      icon: Users,
      href: `/${locale}/features#team`,
    },
    {
      title: 'Cross-Network Analytics',
      desc: 'Aggregated engagement, impression metrics, date filtering, and PDF exports.',
      icon: BarChart3,
      href: `/${locale}/features#analytics`,
    },
    {
      title: 'Client Sharing & White-Label',
      desc: 'Provide read-only review links with your custom domain and agency branding.',
      icon: Layers,
      href: `/${locale}/features#client-sharing`,
    },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href={`/${locale}`} className="transition-transform hover:scale-105">
          <OrbitlyLogo size={36} />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-muted-foreground">
          {/* Features with Mega-Menu dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setFeaturesOpen(true)}
            onMouseLeave={() => setFeaturesOpen(false)}
          >
            <button className="flex items-center gap-1 hover:text-foreground transition-colors py-2">
              <span>Features</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  featuresOpen ? 'rotate-180 text-primary' : ''
                }`}
              />
            </button>

            {featuresOpen && (
              <div className="absolute top-full -left-20 w-[640px] bg-card/95 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl p-6 grid grid-cols-2 gap-4 z-50 animate-in fade-in-50 zoom-in-95 duration-200">
                {featureItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-colors group"
                    >
                      <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <Link href={`/${locale}/pricing`} className="hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href={`/${locale}/integrations`} className="hover:text-foreground transition-colors">
            Integrations
          </Link>
          <Link href={`/${locale}/blog`} className="hover:text-foreground transition-colors">
            Blog
          </Link>
          <Link href={`/${locale}/about`} className="hover:text-foreground transition-colors">
            About
          </Link>
        </nav>

        {/* Desktop Right Controls */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher currentLocale={locale} />
          <ThemeToggle />
          <Link href={`/${locale}/login`}>
            <Button variant="ghost" size="sm" className="font-semibold text-xs">
              Sign In
            </Button>
          </Link>
          <Link href={`/${locale}/signup`}>
            <Button variant="gradient" size="sm" className="font-semibold text-xs shadow-md shadow-indigo-500/20">
              Get Started Free
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-border text-foreground hover:bg-secondary"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card/95 backdrop-blur-2xl p-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product</p>
            <div className="grid grid-cols-1 gap-1">
              <Link
                href={`/${locale}/features`}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm font-semibold hover:text-primary"
              >
                Features Overview
              </Link>
              <Link
                href={`/${locale}/pricing`}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm font-semibold hover:text-primary"
              >
                Pricing Plans
              </Link>
              <Link
                href={`/${locale}/integrations`}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm font-semibold hover:text-primary"
              >
                Supported Networks
              </Link>
              <Link
                href={`/${locale}/blog`}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm font-semibold hover:text-primary"
              >
                Blog & Guides
              </Link>
              <Link
                href={`/${locale}/about`}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-sm font-semibold hover:text-primary"
              >
                About Orbitly
              </Link>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex flex-col gap-3">
            <LanguageSwitcher currentLocale={locale} />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link href={`/${locale}/login`} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full text-xs">
                  Sign In
                </Button>
              </Link>
              <Link href={`/${locale}/signup`} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="gradient" className="w-full text-xs">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
