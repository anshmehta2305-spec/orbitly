import { AiProvider, AiProviderResponse, GenerateTextOptions } from './ai-provider.interface';

export class GoogleProvider implements AiProvider {
  id = 'google';
  name = 'Google (Gemini 2.0 Flash / Pro)';

  isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  async generateText(prompt: string, options?: GenerateTextOptions): Promise<AiProviderResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const model = options?.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents = [{ role: 'user', parts: [{ text: prompt }] }];
    const generationConfig: any = {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens ?? 2000,
    };

    if (options?.responseFormat === 'json') {
      generationConfig.responseMimeType = 'application/json';
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Gemini API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const content = candidate?.content?.parts?.[0]?.text || '';
    const inputTokens = data.usageMetadata?.promptTokenCount || 0;
    const outputTokens = data.usageMetadata?.candidatesTokenCount || 0;

    return {
      content,
      inputTokens,
      outputTokens,
      model,
      provider: this.id,
    };
  }
}
