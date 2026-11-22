export interface PostWriterPromptInput {
  topic: string;
  channels: string[];
  tone?: string;
  emojiLevel?: 'none' | 'low' | 'medium' | 'high';
  includeHashtags?: boolean;
  brandVoice?: {
    name?: string;
    traits?: string[];
    dos?: string[];
    donts?: string[];
    bannedWords?: string[];
  };
}

export const postWriterV1 = {
  version: '1.0.0',
  name: 'post_writer',
  system: `You are Orbitly's expert social media copywriter.
Generate 3 distinct variations of social posts based on the provided brief.
For each variation, create a version tailored for each requested channel (respecting character limits, formatting, and hashtag culture).
Strictly obey the provided Brand Voice rules and never include banned words.
Return strictly valid JSON conforming to the schema.`,
  render(input: PostWriterPromptInput) {
    return {
      system: this.system,
      user: JSON.stringify({
        topic: input.topic,
        channels: input.channels,
        tone: input.tone || 'engaging and professional',
        emojiLevel: input.emojiLevel || 'medium',
        includeHashtags: input.includeHashtags ?? true,
        brandVoice: input.brandVoice || {},
      }, null, 2),
    };
  },
};
