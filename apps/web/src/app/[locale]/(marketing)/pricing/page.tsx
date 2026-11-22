'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { PricingCard, PricingPlan } from '@/components/marketing/PricingCard';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { CtaBanner } from '@/components/marketing/CtaBanner';
import { Check, Minus } from 'lucide-react';
import { PLAN_SPECS, PlanTier, SupportedCurrency } from '@orbitly/shared';

export default function PricingPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [isAnnual, setIsAnnual] = useState(true);
  const [currency, setCurrency] = useState<SupportedCurrency>('USD');

  const currencySymbols: Record<SupportedCurrency, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
  };

  const freeSpec = PLAN_SPECS[PlanTier.FREE];
  const proSpec = PLAN_SPECS[PlanTier.PRO];
  const teamSpec = PLAN_SPECS[PlanTier.TEAM];
  const agencySpec = PLAN_SPECS[PlanTier.AGENCY];

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: freeSpec.name,
      tagline: freeSpec.tagline,
      priceMonthly: freeSpec.prices[currency].monthly,
      priceYearly: freeSpec.prices[currency].annual,
      features: [
        `${freeSpec.limits.channels} connected social channels`,
        `${freeSpec.limits.postsPerMonth} scheduled posts per month`,
        `${freeSpec.limits.seats} workspace user`,
        `${freeSpec.limits.aiCredits} AI Studio credits`,
        `${freeSpec.limits.analyticsRetentionDays}-day analytics history`,
        'Basic media library',
      ],
      ctaText: 'Get Started Free',
    },
    {
      id: 'pro',
      name: proSpec.name,
      tagline: proSpec.tagline,
      priceMonthly: proSpec.prices[currency].monthly,
      priceYearly: proSpec.prices[currency].annual,
      popular: true,
      features: [
        `${proSpec.limits.channels} connected social channels`,
        `${proSpec.limits.postsPerMonth} scheduled posts per month`,
        `${proSpec.limits.seats} workspace members`,
        `${proSpec.limits.aiCredits} AI Studio credits`,
        `${proSpec.limits.analyticsRetentionDays}-day analytics history`,
        'Best time to post AI engine',
        'Thread & Carousel builders',
        'First-comment automation',
      ],
      ctaText: 'Start 14-Day Free Trial',
    },
    {
      id: 'team',
      name: teamSpec.name,
      tagline: teamSpec.tagline,
      priceMonthly: teamSpec.prices[currency].monthly,
      priceYearly: teamSpec.prices[currency].annual,
      features: [
        `${teamSpec.limits.channels} connected social channels`,
        `${teamSpec.limits.postsPerMonth.toLocaleString()} scheduled posts per month`,
        `${teamSpec.limits.seats} workspace members`,
        `${teamSpec.limits.aiCredits.toLocaleString()} AI Studio credits`,
        `${teamSpec.limits.analyticsRetentionDays}-day analytics history`,
        'Multi-stage approval workflow',
        'Public client approval links',
        'White-label calendar branding',
        'Evergreen recycling rules',
      ],
      ctaText: 'Try Team Free',
    },
    {
      id: 'agency',
      name: agencySpec.name,
      tagline: agencySpec.tagline,
      priceMonthly: agencySpec.prices[currency].monthly,
      priceYearly: agencySpec.prices[currency].annual,
      features: [
        `${agencySpec.limits.channels} connected social channels`,
        `${agencySpec.limits.postsPerMonth.toLocaleString()} scheduled posts per month`,
        `${agencySpec.limits.seats} workspace members`,
        `${agencySpec.limits.aiCredits.toLocaleString()} AI Studio credits`,
        'Unlimited analytics history',
        'Custom domain client portal',
        'Public REST API & Webhooks',
        'MCP Server for AI Agents',
        'Dedicated 24/7 SLA Support',
      ],
      ctaText: 'Contact Agency Sales',
    },
  ];

  const comparisonRows = [
    { feature: 'Connected Social Accounts', free: `${freeSpec.limits.channels}`, pro: `${proSpec.limits.channels}`, team: `${teamSpec.limits.channels}`, agency: `${agencySpec.limits.channels}` },
    { feature: 'Scheduled Posts / Month', free: `${freeSpec.limits.postsPerMonth}`, pro: `${proSpec.limits.postsPerMonth}`, team: `${teamSpec.limits.postsPerMonth.toLocaleString()}`, agency: `${agencySpec.limits.postsPerMonth.toLocaleString()}` },
    { feature: 'Team Members / Seats', free: `${freeSpec.limits.seats}`, pro: `${proSpec.limits.seats}`, team: `${teamSpec.limits.seats}`, agency: `${agencySpec.limits.seats}` },
    { feature: 'AI Tone & Studio Credits', free: `${freeSpec.limits.aiCredits}`, pro: `${proSpec.limits.aiCredits}`, team: `${teamSpec.limits.aiCredits.toLocaleString()}`, agency: `${agencySpec.limits.aiCredits.toLocaleString()}` },
    { feature: 'Historical Analytics', free: `${freeSpec.limits.analyticsRetentionDays} Days`, pro: `${proSpec.limits.analyticsRetentionDays} Days`, team: `${teamSpec.limits.analyticsRetentionDays} Days`, agency: 'Unlimited' },
    { feature: 'API Requests / Min', free: `${freeSpec.limits.apiRequestsPerMin}`, pro: `${proSpec.limits.apiRequestsPerMin}`, team: `${teamSpec.limits.apiRequestsPerMin}`, agency: `${agencySpec.limits.apiRequestsPerMin}` },
    { feature: 'Best Time to Post AI Engine', free: false, pro: true, team: true, agency: true },
    { feature: 'First Comment Support', free: false, pro: true, team: true, agency: true },
    { feature: 'Thread & Carousel Builder', free: false, pro: true, team: true, agency: true },
    { feature: 'Approval Workflows & RBAC', free: false, pro: false, team: true, agency: true },
    { feature: 'Public Client Approval Link', free: false, pro: false, team: true, agency: true },
    { feature: 'White-Label Branding', free: freeSpec.limits.whiteLabel, pro: proSpec.limits.whiteLabel, team: teamSpec.limits.whiteLabel, agency: agencySpec.limits.whiteLabel },
    { feature: 'Custom Domain Client Portal', free: false, pro: false, team: false, agency: true },
    { feature: 'Public REST API & MCP Server', free: false, pro: false, team: false, agency: true },
    { feature: 'Priority Email & Chat Support', free: false, pro: 'Standard', team: 'Priority', agency: 'Dedicated SLA' },
  ];

  const pricingFaq = [
    {
      q: 'Can I cancel or switch my plan at any time?',
      a: 'Yes, you can upgrade, downgrade, or cancel your subscription at any time directly from your workspace billing settings. When upgrading, prorated credit is automatically applied.',
    },
    {
      q: 'Do you offer a free trial for paid plans?',
      a: 'Yes! Pro and Team plans include a full 14-day free trial with zero upfront charge. You can cancel before the trial ends with one click.',
    },
    {
      q: 'Which payment methods do you accept?',
      a: 'We accept all major global credit cards (Visa, Mastercard, Amex, UnionPay) via Stripe, plus UPI, NetBanking, and Indian cards via Razorpay.',
    },
    {
      q: 'What happens if I exceed my monthly post limit?',
      a: 'You will receive an in-app notice when you reach 90% of your tier limit. You can either upgrade to the next tier or purchase a post top-up bundle without interrupting existing schedules.',
    },
  ];

  return (
    <div>
      {/* Header */}
      <Section className="pt-12 pb-16 bg-gradient-to-b from-primary/10 via-background to-background text-center">
        <Container className="space-y-4">
          <Badge variant="pulse">Fair & Transparent Pricing</Badge>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">
            Pick the Perfect Orbitly Plan
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            All plans include core multi-network scheduling, high-resolution media uploads, and 24/7 publishing queue reliability.
          </p>

          {/* Currency Selector + Monthly/Annual Toggle */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-muted-foreground">Currency:</span>
              <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl">
                {(['USD', 'EUR', 'GBP', 'INR'] as const).map((curr) => (
                  <button
                    key={curr}
                    onClick={() => setCurrency(curr)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      currency === curr ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <button
                type="button"
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-12 h-6 rounded-full bg-secondary p-1 border border-border relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-primary transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-xs font-semibold ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                Annual <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-bold">20% Off</span>
              </span>
            </div>
          </div>
        </Container>
      </Section>

      {/* Pricing Cards Grid */}
      <Section className="pt-0">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                isAnnual={isAnnual}
                currency={currency}
                currencySymbol={currencySymbols[currency]}
                currencyMultiplier={1}
                locale={locale}
              />
            ))}
          </div>
        </Container>
      </Section>

      {/* Full Feature Comparison Table */}
      <Section className="bg-secondary/20">
        <Container className="max-w-6xl">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Full Plan Feature Comparison</h2>
            <p className="text-xs text-muted-foreground">Detailed breakdown of features across all 4 tiers.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card/60">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-secondary/50 font-bold text-foreground">
                  <th className="p-4">Platform Feature</th>
                  <th className="p-4 text-center">Free</th>
                  <th className="p-4 text-center">Pro</th>
                  <th className="p-4 text-center text-primary">Team</th>
                  <th className="p-4 text-center">Agency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comparisonRows.map((row, i) => (
                  <tr key={i} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-4 font-medium text-foreground">{row.feature}</td>
                    <td className="p-4 text-center text-muted-foreground">
                      {typeof row.free === 'boolean' ? (
                        row.free ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <Minus className="w-4 h-4 text-muted/50 mx-auto" />
                        )
                      ) : (
                        row.free
                      )}
                    </td>
                    <td className="p-4 text-center text-muted-foreground">
                      {typeof row.pro === 'boolean' ? (
                        row.pro ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <Minus className="w-4 h-4 text-muted/50 mx-auto" />
                        )
                      ) : (
                        row.pro
                      )}
                    </td>
                    <td className="p-4 text-center text-primary font-semibold">
                      {typeof row.team === 'boolean' ? (
                        row.team ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <Minus className="w-4 h-4 text-muted/50 mx-auto" />
                        )
                      ) : (
                        row.team
                      )}
                    </td>
                    <td className="p-4 text-center text-muted-foreground font-semibold">
                      {typeof row.agency === 'boolean' ? (
                        row.agency ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <Minus className="w-4 h-4 text-muted/50 mx-auto" />
                        )
                      ) : (
                        row.agency
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </Section>

      {/* Pricing FAQ */}
      <Section>
        <Container className="max-w-4xl">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Billing & Subscription Questions</h2>
          </div>
          <Accordion className="space-y-2">
            {pricingFaq.map((item, index) => (
              <AccordionItem key={index} title={item.q} defaultOpen={index === 0}>
                {item.a}
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </Section>

      {/* CTA */}
      <Section className="pt-0 pb-20">
        <Container>
          <CtaBanner locale={locale} />
        </Container>
      </Section>
    </div>
  );
}
