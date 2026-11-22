export interface HashtagsPromptInput {
  content: string;
  count?: number;
}

export const hashtagsV1 = {
  version: '1.0.0',
  name: 'hashtags_generator',
  system: `You are an SEO and social algorithm analyst.
Analyze the post content and extract trending, niche, and high-relevance hashtags and SEO keywords.
Return strictly valid JSON.`,
  render(input: HashtagsPromptInput) {
    return {
      system: this.system,
      user: JSON.stringify({
        content: input.content,
        count: input.count || 10,
      }, null, 2),
    };
  },
};
