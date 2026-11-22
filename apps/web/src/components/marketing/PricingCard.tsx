'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import Link from 'next/link';

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  popular?: boolean;
  features: string[];
  ctaText: string;
  ctaVariant?: 'default' | 'gradient' | 'outline';
}

export function PricingCard({
  plan,
  isAnnual,
  currency,
  currencySymbol,
  currencyMultiplier = 1,
  locale,
}: {
  plan: PricingPlan;
  isAnnual: boolean;
  currency: string;
  currencySymbol: string;
  currencyMultiplier?: number;
  locale: string;
}) {
  const basePrice = isAnnual ? plan.priceYearly : plan.priceMonthly;
  const calculatedPrice = Math.round(basePrice * currencyMultiplier);

  return (
    <Card
      className={`relative flex flex-col justify-between h-full rounded-3xl transition-all duration-300 ${
        plan.popular
          ? 'border-2 border-primary shadow-2xl shadow-primary/10 bg-card/90 ring-4 ring-primary/10'
          : 'border border-border bg-card/60 hover:border-primary/40 hover:shadow-lg'
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <Badge variant="default" className="bg-primary text-primary-foreground text-xs px-3 py-1 shadow-md font-semibold border-none">
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
        <CardDescription className="text-xs min-h-[32px] mt-1">{plan.tagline}</CardDescription>

        <div className="pt-4 flex items-baseline gap-1">
          <span className="text-3xl sm:text-4xl font-extrabold text-foreground">
            {calculatedPrice === 0 ? 'Free' : `${currencySymbol}${calculatedPrice}`}
          </span>
          {calculatedPrice > 0 && (
            <span className="text-xs text-muted-foreground font-medium">/ month</span>
          )}
        </div>
        {isAnnual && calculatedPrice > 0 && (
          <p className="text-[11px] text-emerald-500 font-semibold mt-1">Billed annually (Save 20%)</p>
        )}
      </CardHeader>

      <CardContent className="p-6 pt-0 flex-1 space-y-4">
        <div className="border-t border-border pt-4" />
        <ul className="space-y-2.5 text-xs">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-muted-foreground">
              <div className="p-0.5 rounded-full bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="leading-tight text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Link href={`/${locale}/signup`} className="w-full">
          <Button
            variant={plan.popular ? 'gradient' : 'outline'}
            className="w-full text-xs font-semibold py-2.5"
          >
            {plan.ctaText}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
