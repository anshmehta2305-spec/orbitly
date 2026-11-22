export interface BrandVoicePromptInput {
  samplePosts: string[];
}

export const brandVoiceV1 = {
  version: '1.0.0',
  name: 'brand_voice_extractor',
  system: `You are a branding consultant and linguistic analyst.
Analyze the provided sample posts and distill a Brand Voice persona profile:
- 3 to 5 key tone traits (e.g., "Witty", "Direct", "Optimistic")
- 3 to 5 clear Dos (how to write)
- 3 to 5 clear Don'ts (what to avoid)
- Suggested banned words/clichés
Return strictly valid JSON conforming to the schema.`,
  render(input: BrandVoicePromptInput) {
    return {
      system: this.system,
      user: JSON.stringify({
        samplePosts: input.samplePosts,
      }, null, 2),
    };
  },
};
