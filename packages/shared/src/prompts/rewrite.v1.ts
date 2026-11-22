export type RewriteMode =
  | 'shorten'
  | 'expand'
  | 'change_tone'
  | 'fix_grammar'
  | 'translate'
  | 'make_thread';

export interface RewritePromptInput {
  content: string;
  mode: RewriteMode;
  targetTone?: string;
  targetLanguage?: string;
}

export const rewriteV1 = {
  version: '1.0.0',
  name: 'rewrite',
  system: `You are an expert social media copy editor.
Rewrite the provided post according to the specified mode.
If 'make_thread', break the thought down into a compelling multi-part numbered thread.
Return strictly valid JSON with the revised text or thread items.`,
  render(input: RewritePromptInput) {
    return {
      system: this.system,
      user: JSON.stringify({
        content: input.content,
        mode: input.mode,
        targetTone: input.targetTone,
        targetLanguage: input.targetLanguage,
      }, null, 2),
    };
  },
};
