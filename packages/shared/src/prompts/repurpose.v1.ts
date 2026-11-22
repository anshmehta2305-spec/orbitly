export interface RepurposePromptInput {
  sourceText: string;
  sourceUrl?: string;
  channels: string[];
}

export const repurposeV1 = {
  version: '1.0.0',
  name: 'repurpose',
  system: `You are a cross-platform content repurposing engine.
Extract the core insights, key takeaways, and memorable quotes from the input article or transcript.
Generate platform-native posts for each requested channel and always attribute the source URL.
Return strictly valid JSON.`,
  render(input: RepurposePromptInput) {
    return {
      system: this.system,
      user: JSON.stringify({
        sourceText: input.sourceText.slice(0, 10000), // Cap input text safely
        sourceUrl: input.sourceUrl,
        channels: input.channels,
      }, null, 2),
    };
  },
};
