import { PlanTier } from '../types';

export interface PlanLimits {
  channels: number;
  postsPerMonth: number;
  seats: number;
  aiCredits: number;
  automations: number;
  workspaces: number;
  apiRequestsPerMin: number;
  whiteLabel: boolean;
  analyticsRetentionDays: number;
}

export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'INR';

export interface CurrencyPrice {
  monthly: number;
  annual: number; // per month billed annually
}

export interface PlanSpecification {
  key: PlanTier;
  name: string;
  tagline: string;
  popular?: boolean;
  trialDays: number;
  limits: PlanLimits;
  prices: Record<SupportedCurrency, CurrencyPrice>;
  stripePriceIds?: {
    monthly?: string;
    annual?: string;
  };
  razorpayPlanIds?: {
    monthly?: string;
    annual?: string;
  };
}

export const PLAN_SPECS: Record<PlanTier, PlanSpecification> = {
  [PlanTier.FREE]: {
    key: PlanTier.FREE,
    name: 'Free',
    tagline: 'Ideal for solo creators testing cross-channel publishing.',
    trialDays: 0,
    limits: {
      channels: 3,
      postsPerMonth: 30,
      seats: 1,
      aiCredits: 20,
      automations: 1,
      workspaces: 1,
      apiRequestsPerMin: 60,
      whiteLabel: false,
      analyticsRetentionDays: 30,
    },
    prices: {
      USD: { monthly: 0, annual: 0 },
      EUR: { monthly: 0, annual: 0 },
      GBP: { monthly: 0, annual: 0 },
      INR: { monthly: 0, annual: 0 },
    },
  },
  [PlanTier.PRO]: {
    key: PlanTier.PRO,
    name: 'Pro',
    tagline: 'Built for active creators and freelancers scaling their reach.',
    popular: true,
    trialDays: 14,
    limits: {
      channels: 10,
      postsPerMonth: 300,
      seats: 3,
      aiCredits: 200,
      automations: 5,
      workspaces: 1,
      apiRequestsPerMin: 300,
      whiteLabel: false,
      analyticsRetentionDays: 180,
    },
    prices: {
      USD: { monthly: 24, annual: 19 },
      EUR: { monthly: 22, annual: 18 },
      GBP: { monthly: 19, annual: 15 },
      INR: { monthly: 1999, annual: 1599 },
    },
    stripePriceIds: {
      monthly: 'price_pro_monthly',
      annual: 'price_pro_annual',
    },
    razorpayPlanIds: {
      monthly: 'plan_pro_inr_monthly',
      annual: 'plan_pro_inr_annual',
    },
  },
  [PlanTier.TEAM]: {
    key: PlanTier.TEAM,
    name: 'Team',
    tagline: 'For collaborative teams, startups, and expanding brands.',
    trialDays: 14,
    limits: {
      channels: 25,
      postsPerMonth: 1000,
      seats: 10,
      aiCredits: 1000,
      automations: 25,
      workspaces: 5,
      apiRequestsPerMin: 1200,
      whiteLabel: true,
      analyticsRetentionDays: 365,
    },
    prices: {
      USD: { monthly: 69, annual: 55 },
      EUR: { monthly: 64, annual: 51 },
      GBP: { monthly: 55, annual: 44 },
      INR: { monthly: 5499, annual: 4399 },
    },
    stripePriceIds: {
      monthly: 'price_team_monthly',
      annual: 'price_team_annual',
    },
    razorpayPlanIds: {
      monthly: 'plan_team_inr_monthly',
      annual: 'plan_team_inr_annual',
    },
  },
  [PlanTier.AGENCY]: {
    key: PlanTier.AGENCY,
    name: 'Agency',
    tagline: 'Multi-brand publishing at scale with client portals and white-labeling.',
    trialDays: 14,
    limits: {
      channels: 100,
      postsPerMonth: 10000,
      seats: 50,
      aiCredits: 5000,
      automations: 100,
      workspaces: 25,
      apiRequestsPerMin: 3000,
      whiteLabel: true,
      analyticsRetentionDays: 730,
    },
    prices: {
      USD: { monthly: 199, annual: 159 },
      EUR: { monthly: 185, annual: 148 },
      GBP: { monthly: 159, annual: 127 },
      INR: { monthly: 15999, annual: 12799 },
    },
    stripePriceIds: {
      monthly: 'price_agency_monthly',
      annual: 'price_agency_annual',
    },
    razorpayPlanIds: {
      monthly: 'plan_agency_inr_monthly',
      annual: 'plan_agency_inr_annual',
    },
  },
};
