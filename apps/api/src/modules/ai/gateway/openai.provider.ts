import { AiProvider, AiProviderResponse, AiImageResponse, GenerateTextOptions, GenerateImageOptions } from './ai-provider.interface';

export class OpenAiProvider implements AiProvider {
  id = 'openai';
  name = 'OpenAI (GPT-4o)';

  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  async generateText(prompt: string, options?: GenerateTextOptions): Promise<AiProviderResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const model = options?.model || process.env.OPENAI_MODEL || 'gpt-4o';
    const messages = [];
    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
        response_format: options?.responseFormat === 'json' ? { type: 'json_object' } : undefined,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;

    return {
      content,
      inputTokens,
      outputTokens,
      model,
      provider: this.id,
    };
  }

  async generateImage(prompt: string, options?: GenerateImageOptions): Promise<AiImageResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || 'dall-e-3',
        prompt,
        n: 1,
        size: options?.size === '512x512' ? '1024x1024' : '1024x1024',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI DALL-E error (${res.status}): ${err}`);
    }

    const data = await res.json();
    return {
      url: data.data?.[0]?.url || '',
      prompt,
      model: 'dall-e-3',
      provider: this.id,
    };
  }
}
