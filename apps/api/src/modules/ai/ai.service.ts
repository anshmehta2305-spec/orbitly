import { Injectable, BadRequestException, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { prisma, AiGenerationType } from '@orbitly/db';
import {
  AI_FEATURE_CREDIT_COSTS,
  DEFAULT_PLAN_AI_ALLOWANCE,
  PlanTier,
  isSafePublicUrl,
  postWriterV1,
  rewriteV1,
  ideasV1,
  repurposeV1,
  hashtagsV1,
  altTextV1,
  brandVoiceV1,
  AiGeneratePostInput,
  AiRewriteInput,
  AiIdeasInput,
  AiRepurposeInput,
  AiHashtagsInput,
  AiAltTextInput,
  AiImageInput,
  BrandVoiceInput,
} from '@orbitly/shared';
import { AiGatewayService } from './gateway/gateway.service';

@Injectable()
export class AiService {
  constructor(private aiGateway: AiGatewayService) {}

  /**
   * Check and atomically deduct credits for a workspace
   */
  async deductCredits(workspaceId: string, userId: string, feature: string, cost: number): Promise<void> {
    let credit = await prisma.aiCredit.findUnique({
      where: { workspaceId },
    });

    if (!credit) {
      const now = new Date();
      const resetsAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      credit = await prisma.aiCredit.create({
        data: {
          workspaceId,
          balance: DEFAULT_PLAN_AI_ALLOWANCE[PlanTier.PRO],
          monthlyAllowance: DEFAULT_PLAN_AI_ALLOWANCE[PlanTier.PRO],
          resetsAt,
        },
      });
    }

    if (credit.balance < cost) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          error: 'Payment Required',
          message: `Insufficient AI credits. This operation requires ${cost} credits, but your workspace has ${credit.balance} remaining.`,
          balance: credit.balance,
          required: cost,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    await prisma.$transaction([
      prisma.aiCredit.update({
        where: { workspaceId },
        data: {
          balance: {
            decrement: cost,
          },
        },
      }),
      prisma.aiUsage.create({
        data: {
          workspaceId,
          userId,
          feature,
          provider: 'orbitly-ai',
          model: 'gateway',
          inputTokens: 0,
          outputTokens: 0,
          cost,
        },
      }),
    ]);
  }

  async getCredits(workspaceId: string) {
    let credit = await prisma.aiCredit.findUnique({
      where: { workspaceId },
    });

    if (!credit) {
      const now = new Date();
      const resetsAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      credit = await prisma.aiCredit.create({
        data: {
          workspaceId,
          balance: DEFAULT_PLAN_AI_ALLOWANCE[PlanTier.PRO],
          monthlyAllowance: DEFAULT_PLAN_AI_ALLOWANCE[PlanTier.PRO],
          resetsAt,
        },
      });
    }

    const recentUsage = await prisma.aiUsage.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      balance: credit.balance,
      monthlyAllowance: credit.monthlyAllowance,
      resetsAt: credit.resetsAt,
      recentUsage,
    };
  }

  async getHistory(workspaceId: string, limit = 20, offset = 0): Promise<any> {
    return prisma.aiGeneration.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });
  }

  // Brand Voice CRUD
  async getBrandVoices(workspaceId: string) {
    return prisma.brandVoice.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBrandVoice(workspaceId: string, input: BrandVoiceInput) {
    return prisma.brandVoice.create({
      data: {
        workspaceId,
        name: input.name,
        description: input.description,
        traits: input.traits,
        dos: input.dos,
        donts: input.donts,
        sampleTexts: input.sampleTexts || [],
        bannedWords: input.bannedWords || [],
        defaultLanguage: input.defaultLanguage || 'en',
        isDefault: input.isDefault ?? false,
      },
    });
  }

  async updateBrandVoice(workspaceId: string, id: string, input: Partial<BrandVoiceInput>) {
    const existing = await prisma.brandVoice.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) throw new NotFoundException('Brand voice not found');

    return prisma.brandVoice.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        traits: input.traits,
        dos: input.dos,
        donts: input.donts,
        sampleTexts: input.sampleTexts,
        bannedWords: input.bannedWords,
        defaultLanguage: input.defaultLanguage,
        isDefault: input.isDefault,
      },
    });
  }

  async deleteBrandVoice(workspaceId: string, id: string) {
    const existing = await prisma.brandVoice.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) throw new NotFoundException('Brand voice not found');

    return prisma.brandVoice.delete({ where: { id } });
  }

  async suggestBrandVoice(workspaceId: string, userId: string, samplePosts: string[]) {
    const cost = AI_FEATURE_CREDIT_COSTS.BRAND_VOICE;
    await this.deductCredits(workspaceId, userId, 'BRAND_VOICE', cost);

    const promptObj = brandVoiceV1.render({ samplePosts });
    const response = await this.aiGateway.generateText(promptObj.user, {
      systemPrompt: promptObj.system,
      responseFormat: 'json',
    });

    try {
      return JSON.parse(response.content);
    } catch {
      return {
        toneTraits: ['Clear', 'Direct', 'Professional'],
        dos: ['Be concise', 'Lead with value'],
        donts: ['Avoid jargon'],
        bannedWords: [],
      };
    }
  }

  // Post Writer
  async generatePost(workspaceId: string, userId: string, input: AiGeneratePostInput) {
    const cost = AI_FEATURE_CREDIT_COSTS.POST_WRITER;
    await this.deductCredits(workspaceId, userId, 'POST_WRITER', cost);

    let brandVoiceData: any = undefined;
    if (input.brandVoiceId) {
      brandVoiceData = await prisma.brandVoice.findFirst({
        where: { id: input.brandVoiceId, workspaceId },
      });
    }

    const promptObj = postWriterV1.render({
      topic: input.topic,
      channels: input.channels,
      tone: input.tone,
      emojiLevel: input.emojiLevel,
      includeHashtags: input.includeHashtags,
      brandVoice: brandVoiceData
        ? {
            name: brandVoiceData.name,
            traits: brandVoiceData.traits,
            dos: brandVoiceData.dos,
            donts: brandVoiceData.donts,
            bannedWords: brandVoiceData.bannedWords,
          }
        : undefined,
    });

    const response = await this.aiGateway.generateText(promptObj.user, {
      systemPrompt: promptObj.system,
      responseFormat: 'json',
    });

    let parsedOutput: any;
    try {
      parsedOutput = JSON.parse(response.content);
    } catch {
      parsedOutput = {
        variants: [
          {
            channel: input.channels[0] || 'GLOBAL',
            content: response.content,
            characterCount: response.content.length,
          },
        ],
      };
    }

    const record = await prisma.aiGeneration.create({
      data: {
        workspaceId,
        userId,
        type: AiGenerationType.TEXT,
        prompt: input.topic,
        output: parsedOutput,
        status: 'SUCCESS',
      },
    });

    return {
      generationId: record.id,
      ...parsedOutput,
    };
  }

  // Rewrite Tool
  async rewrite(workspaceId: string, userId: string, input: AiRewriteInput) {
    const cost = AI_FEATURE_CREDIT_COSTS.REWRITE;
    await this.deductCredits(workspaceId, userId, 'REWRITE', cost);

    const promptObj = rewriteV1.render({
      content: input.content,
      mode: input.mode,
      targetTone: input.targetTone,
      targetLanguage: input.targetLanguage,
    });

    const response = await this.aiGateway.generateText(promptObj.user, {
      systemPrompt: promptObj.system,
    });

    const rewritten = response.content.trim();

    await prisma.aiGeneration.create({
      data: {
        workspaceId,
        userId,
        type: AiGenerationType.TEXT,
        prompt: `${input.mode}: ${input.content.slice(0, 100)}`,
        output: { rewritten, mode: input.mode },
        status: 'SUCCESS',
      },
    });

    return { rewritten, mode: input.mode };
  }

  // Ideas Generator
  async generateIdeas(workspaceId: string, userId: string, input: AiIdeasInput) {
    const cost = AI_FEATURE_CREDIT_COSTS.IDEAS;
    await this.deductCredits(workspaceId, userId, 'IDEAS', cost);

    const promptObj = ideasV1.render(input);
    const response = await this.aiGateway.generateText(promptObj.user, {
      systemPrompt: promptObj.system,
      responseFormat: 'json',
    });

    let parsedOutput: any;
    try {
      parsedOutput = JSON.parse(response.content);
    } catch {
      parsedOutput = { ideas: [], thirtyDayCalendar: [] };
    }

    await prisma.aiGeneration.create({
      data: {
        workspaceId,
        userId,
        type: AiGenerationType.IDEAS,
        prompt: input.niche,
        output: parsedOutput,
        status: 'SUCCESS',
      },
    });

    return parsedOutput;
  }

  // Repurpose
  async repurpose(workspaceId: string, userId: string, input: AiRepurposeInput) {
    const cost = AI_FEATURE_CREDIT_COSTS.REPURPOSE;
    await this.deductCredits(workspaceId, userId, 'REPURPOSE', cost);

    let contentToProcess = input.sourceText || '';

    if (input.sourceUrl) {
      const urlCheck = isSafePublicUrl(input.sourceUrl);
      if (!urlCheck.safe) {
        throw new BadRequestException(
          `Target URL rejected: ${urlCheck.reason || 'Loopback, private IP, or non-HTTP URLs are blocked.'}`,
        );
      }
      try {
        const fetchRes = await fetch(input.sourceUrl, {
          headers: { 'User-Agent': 'Orbitly-Repurposer/1.0 (+https://orbitly.io)' },
        });
        if (fetchRes.ok) {
          const rawText = await fetchRes.text();
          contentToProcess = rawText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 4000);
        } else {
          throw new Error(`Failed to fetch URL (${fetchRes.status})`);
        }
      } catch (err: any) {
        throw new BadRequestException(`Could not retrieve content from URL: ${err.message}`);
      }
    }

    if (!contentToProcess.trim()) {
      throw new BadRequestException('Source text or reachable URL content is required for repurposing.');
    }

    const promptObj = repurposeV1.render({
      sourceText: contentToProcess,
      sourceUrl: input.sourceUrl,
      channels: input.channels,
    });

    const response = await this.aiGateway.generateText(promptObj.user, {
      systemPrompt: promptObj.system,
      responseFormat: 'json',
    });

    let parsedOutput: any;
    try {
      parsedOutput = JSON.parse(response.content);
    } catch {
      parsedOutput = { summary: response.content, thread: [], carouselSlides: [] };
    }

    await prisma.aiGeneration.create({
      data: {
        workspaceId,
        userId,
        type: AiGenerationType.REPURPOSE,
        prompt: input.sourceUrl || contentToProcess.slice(0, 100),
        output: parsedOutput,
        status: 'SUCCESS',
      },
    });

    return parsedOutput;
  }

  // Hashtags
  async generateHashtags(workspaceId: string, userId: string, input: AiHashtagsInput) {
    const cost = AI_FEATURE_CREDIT_COSTS.HASHTAGS;
    await this.deductCredits(workspaceId, userId, 'HASHTAGS', cost);

    const promptObj = hashtagsV1.render(input);
    const response = await this.aiGateway.generateText(promptObj.user, {
      systemPrompt: promptObj.system,
      responseFormat: 'json',
    });

    let parsedOutput: any;
    try {
      parsedOutput = JSON.parse(response.content);
    } catch {
      parsedOutput = { top: [], niche: [], trending: [] };
    }

    await prisma.aiGeneration.create({
      data: {
        workspaceId,
        userId,
        type: AiGenerationType.HASHTAGS,
        prompt: input.content.slice(0, 100),
        output: parsedOutput,
        status: 'SUCCESS',
      },
    });

    return parsedOutput;
  }

  // Alt Text
  async generateAltText(workspaceId: string, userId: string, input: AiAltTextInput) {
    const cost = AI_FEATURE_CREDIT_COSTS.ALT_TEXT;
    await this.deductCredits(workspaceId, userId, 'ALT_TEXT', cost);

    const promptObj = altTextV1.render(input);
    const response = await this.aiGateway.generateText(promptObj.user, {
      systemPrompt: promptObj.system,
      responseFormat: 'json',
    });

    let parsedOutput: any;
    try {
      parsedOutput = JSON.parse(response.content);
    } catch {
      parsedOutput = { altText: response.content };
    }

    await prisma.aiGeneration.create({
      data: {
        workspaceId,
        userId,
        type: AiGenerationType.ALT_TEXT,
        prompt: input.imageUrl || input.description || 'alt-text',
        output: parsedOutput,
        status: 'SUCCESS',
      },
    });

    return parsedOutput;
  }

  // Image Generation
  async generateImage(workspaceId: string, userId: string, input: AiImageInput) {
    const cost = AI_FEATURE_CREDIT_COSTS.IMAGE;
    await this.deductCredits(workspaceId, userId, 'IMAGE', cost);

    const imageRes = await this.aiGateway.generateImage(input.prompt, {
      aspectRatio: input.aspectRatio,
    });

    const record = await prisma.aiGeneration.create({
      data: {
        workspaceId,
        userId,
        type: AiGenerationType.IMAGE,
        prompt: input.prompt,
        output: imageRes as any,
        status: 'SUCCESS',
      },
    });

    return {
      generationId: record.id,
      ...imageRes,
    };
  }
}
