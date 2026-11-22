import { z } from 'zod';

export const AiGeneratePostSchema = z.object({
  topic: z.string().min(3, 'Topic or brief must be at least 3 characters').max(2000),
  channels: z.array(z.string()).min(1, 'Select at least one target channel'),
  tone: z.string().optional(),
  emojiLevel: z.enum(['none', 'low', 'medium', 'high']).default('medium'),
  includeHashtags: z.boolean().default(true),
  brandVoiceId: z.string().optional(),
  labelAiGenerated: z.boolean().default(false),
});

export type AiGeneratePostInput = z.infer<typeof AiGeneratePostSchema>;

export const AiRewriteSchema = z.object({
  content: z.string().min(1, 'Content required').max(5000),
  mode: z.enum(['shorten', 'expand', 'change_tone', 'fix_grammar', 'translate', 'make_thread']),
  targetTone: z.string().optional(),
  targetLanguage: z.string().optional(),
});

export type AiRewriteInput = z.infer<typeof AiRewriteSchema>;

export const AiIdeasSchema = z.object({
  niche: z.string().min(2, 'Niche is required').max(200),
  audience: z.string().min(2, 'Audience is required').max(200),
  goal: z.string().min(2, 'Goal is required').max(200),
  isMonthlyPlan: z.boolean().default(false),
});

export type AiIdeasInput = z.infer<typeof AiIdeasSchema>;

export const AiRepurposeSchema = z.object({
  sourceText: z.string().optional(),
  sourceUrl: z.string().url('Must be a valid URL').optional(),
  channels: z.array(z.string()).min(1, 'Select at least one target channel'),
});

export type AiRepurposeInput = z.infer<typeof AiRepurposeSchema>;

export const AiHashtagsSchema = z.object({
  content: z.string().min(3).max(3000),
  count: z.number().int().min(1).max(30).default(10),
});

export type AiHashtagsInput = z.infer<typeof AiHashtagsSchema>;

export const AiAltTextSchema = z.object({
  imageUrl: z.string().url().optional(),
  description: z.string().optional(),
});

export type AiAltTextInput = z.infer<typeof AiAltTextSchema>;

export const AiImageSchema = z.object({
  prompt: z.string().min(3, 'Image prompt required').max(1000),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:5']).default('1:1'),
});

export type AiImageInput = z.infer<typeof AiImageSchema>;

export const BrandVoiceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(1000).optional(),
  traits: z.array(z.string()).default([]),
  dos: z.array(z.string()).default([]),
  donts: z.array(z.string()).default([]),
  sampleTexts: z.array(z.string()).default([]),
  bannedWords: z.array(z.string()).default([]),
  defaultLanguage: z.string().default('en'),
  isDefault: z.boolean().default(true),
});

export type BrandVoiceInput = z.infer<typeof BrandVoiceSchema>;

export const BrandVoiceSuggestSchema = z.object({
  samplePosts: z.array(z.string().min(5)).min(1, 'Provide at least 1 sample post'),
});

export type BrandVoiceSuggestInput = z.infer<typeof BrandVoiceSuggestSchema>;
