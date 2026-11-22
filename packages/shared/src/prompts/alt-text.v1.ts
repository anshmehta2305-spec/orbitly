export interface AltTextPromptInput {
  imageUrl?: string;
  description?: string;
}

export const altTextV1 = {
  version: '1.0.0',
  name: 'alt_text_generator',
  system: `You are an accessibility specialist.
Generate concise, descriptive, and WCAG-compliant alt text for the provided image description.
Focus on object, setting, text in image, and key emotions without fluff or buzzwords.
Return strictly valid JSON.`,
  render(input: AltTextPromptInput) {
    return {
      system: this.system,
      user: JSON.stringify(input, null, 2),
    };
  },
};
