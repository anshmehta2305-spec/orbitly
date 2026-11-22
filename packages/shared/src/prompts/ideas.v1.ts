export interface IdeasPromptInput {
  niche: string;
  audience: string;
  goal: string;
  isMonthlyPlan?: boolean;
}

export const ideasV1 = {
  version: '1.0.0',
  name: 'ideas_generator',
  system: `You are a viral social media strategist.
Generate actionable, high-converting post ideas or a 30-day content calendar.
Each idea must have a hook, angle, target channel recommendation, and suggested day.
Return strictly valid JSON.`,
  render(input: IdeasPromptInput) {
    return {
      system: this.system,
      user: JSON.stringify({
        niche: input.niche,
        audience: input.audience,
        goal: input.goal,
        count: input.isMonthlyPlan ? 30 : 10,
        type: input.isMonthlyPlan ? '30_day_calendar' : '10_ideas',
      }, null, 2),
    };
  },
};
