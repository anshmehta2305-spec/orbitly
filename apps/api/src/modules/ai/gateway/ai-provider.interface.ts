export interface GenerateTextOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  responseFormat?: 'text' | 'json';
}

export interface GenerateImageOptions {
  model?: string;
  size?: '512x512' | '1024x1024';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:5';
}

export interface AiProviderResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  provider: string;
}

export interface AiImageResponse {
  url: string;
  prompt: string;
  model: string;
  provider: string;
}

export interface AiProvider {
  id: string;
  name: string;
  isAvailable(): boolean;
  generateText(prompt: string, options?: GenerateTextOptions): Promise<AiProviderResponse>;
  generateImage?(prompt: string, options?: GenerateImageOptions): Promise<AiImageResponse>;
}
