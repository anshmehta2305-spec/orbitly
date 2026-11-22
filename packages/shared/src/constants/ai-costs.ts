import { PlanTier } from '../types';

export const AI_FEATURE_CREDIT_COSTS: Record<string, number> = {
  POST_WRITER: 3,
  REWRITE: 1,
  IDEAS: 2,
  REPURPOSE: 4,
  HASHTAGS: 1,
  ALT_TEXT: 1,
  IMAGE: 5,
  BRAND_VOICE: 2,
};

export const DEFAULT_PLAN_AI_ALLOWANCE: Record<PlanTier, number> = {
  [PlanTier.FREE]: 20,
  [PlanTier.PRO]: 200,
  [PlanTier.TEAM]: 1000,
  [PlanTier.AGENCY]: 5000,
};
