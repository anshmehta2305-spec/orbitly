import { AiProvider, AiProviderResponse, GenerateTextOptions } from './ai-provider.interface';

export class AnthropicProvider implements AiProvider {
  id = 'anthropic';
  name = 'Anthropic (Claude 3.5 Sonnet)';

  isAvailable(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  async generateText(prompt: string, options?: GenerateTextOptions): Promise<AiProviderResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const model = options?.model || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: options?.maxTokens ?? 2000,
        temperature: options?.temperature ?? 0.7,
        system: options?.systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const content = data.content?.[0]?.text || '';
    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;

    return {
      content,
      inputTokens,
      outputTokens,
      model,
      provider: this.id,
    };
  }
}
