'use client';

import React from 'react';
import { OrbitlyLogo } from '@/components/brand/Logo';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import Link from 'next/link';

export function Footer({ locale }: { locale: string }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card/40 backdrop-blur-lg pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-border">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <OrbitlyLogo size={36} />
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Plan once. Publish everywhere. The premier cross-network social media scheduling and analytics
              platform designed for modern creators, agencies, and businesses.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {/* Neutral Monochrome Social Icons */}
              {['X', 'LinkedIn', 'Instagram', 'GitHub', 'Discord'].map((platform) => (
                <div
                  key={platform}
                  className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
                  title={`Orbitly on ${platform}`}
                >
                  {platform.charAt(0)}
                </div>
              ))}
            </div>
          </div>

          {/* Product Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Product</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href={`/${locale}/features`} className="hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/pricing`} className="hover:text-foreground transition-colors">
                  Pricing & Tiers
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/integrations`} className="hover:text-foreground transition-colors">
                  Integrations
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/changelog`} className="hover:text-foreground transition-colors">
                  Changelog
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/docs`} className="hover:text-foreground transition-colors">
                  API & Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Company</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href={`/${locale}/about`} className="hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/blog`} className="hover:text-foreground transition-colors">
                  Blog & Insights
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="hover:text-foreground transition-colors">
                  Contact Support
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/60 cursor-not-allowed">
                  Careers <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">Hiring</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Legal Col */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Legal & Privacy</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href={`/${locale}/privacy`} className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/cookies`} className="hover:text-foreground transition-colors">
                  Cookie Preferences
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/design-system`} className="hover:text-primary transition-colors font-medium">
                  Design System (Dev)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {currentYear} Orbitly SaaS Inc. Plan once. Publish everywhere. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <LanguageSwitcher currentLocale={locale} />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
