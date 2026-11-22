import { Injectable, BadRequestException } from '@nestjs/common';
import { AiProvider, GenerateTextOptions, GenerateImageOptions, AiProviderResponse, AiImageResponse } from './ai-provider.interface';
import { MockAiProvider } from './mock.provider';
import { OpenAiProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { GoogleProvider } from './google.provider';

// Basic safety/moderation patterns
const BLOCKED_PATTERNS = [
  /hate\s+speech/i,
  /terroris/i,
  /self-harm/i,
  /suicide/i,
  /doxx/i,
  /harass/i,
  /impersonat(?:e|ing)\s+(?:bank|government|official)/i,
  /generate\s+(?:malware|phishing|ransomware)/i,
];

@Injectable()
export class AiGatewayService {
  private providers: Map<string, AiProvider> = new Map();
  private mockProvider = new MockAiProvider();

  constructor() {
    this.providers.set('mock', this.mockProvider);
    this.providers.set('openai', new OpenAiProvider());
    this.providers.set('anthropic', new AnthropicProvider());
    this.providers.set('google', new GoogleProvider());
  }

  getProvider(override?: string): AiProvider {
    const selectedId = override || process.env.AI_PROVIDER || 'mock';
    const provider = this.providers.get(selectedId.toLowerCase());

    if (provider && provider.isAvailable()) {
      return provider;
    }

    // Fallback to mock provider if configured provider lacks API credentials
    return this.mockProvider;
  }

  validateModeration(prompt: string): void {
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(prompt)) {
        throw new BadRequestException(
          'Your prompt violates Orbitly AI safety and acceptable use policies. Request blocked before credit deduction.',
        );
      }
    }
  }

  async generateText(prompt: string, options?: GenerateTextOptions, providerId?: string): Promise<AiProviderResponse> {
    this.validateModeration(prompt);
    const provider = this.getProvider(providerId);
    return provider.generateText(prompt, options);
  }

  async generateImage(prompt: string, options?: GenerateImageOptions, providerId?: string): Promise<AiImageResponse> {
    this.validateModeration(prompt);
    const provider = this.getProvider(providerId);
    if (!provider.generateImage) {
      return this.mockProvider.generateImage(prompt, options);
    }
    return provider.generateImage(prompt, options);
  }
}
