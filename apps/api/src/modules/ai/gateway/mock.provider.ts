import { AiProvider, AiProviderResponse, AiImageResponse, GenerateTextOptions, GenerateImageOptions } from './ai-provider.interface';

export class MockAiProvider implements AiProvider {
  id = 'mock';
  name = 'Orbitly Mock AI Engine';

  isAvailable(): boolean {
    return true;
  }

  async generateText(prompt: string, options?: GenerateTextOptions): Promise<AiProviderResponse> {
    const inputTokens = Math.max(15, Math.round(prompt.length / 4));
    let content = '';

    // Detect prompt type to output structured JSON or formatted text
    if (prompt.includes('Brand Voice Extractor') || prompt.includes('"toneTraits"')) {
      content = JSON.stringify({
        toneTraits: ['Visionary', 'Action-oriented', 'Approachable', 'Analytical'],
        dos: [
          'Lead with strong punchy hooks',
          'Use real-world numbers and measurable takeaways',
          'Ask thoughtful discussion-provoking questions',
        ],
        donts: [
          'Avoid meaningless corporate jargon or buzzwords',
          'Never sound pessimistic or dismissive',
          'Avoid excessive emojis or all-caps shouting',
        ],
        bannedWords: ['synergy', 'game-changing', 'disrupt', 'guru', 'ninja'],
        recommendedCadence: '1-2 times daily during peak timezone hours',
      });
    } else if (prompt.includes('Post Writer') || prompt.includes('3 tailored variants')) {
      content = JSON.stringify({
        variants: [
          {
            channel: 'TWITTER',
            content:
              'Most creators waste 10+ hours a week juggling 6 different tabs.\n\nHere is how Orbitly automates multi-platform publishing with 1 click: https://orbitly.io\n\n#SocialMediaStrategy #CreatorEconomy',
            characterCount: 185,
            suggestedMedia: 'Infographic showing workflow before vs after',
            estimatedEngagementRate: '3.8%',
          },
          {
            channel: 'LINKEDIN',
            content:
              'The biggest bottleneck for scaling modern brands is fragmented distribution.\n\nWhen we audited 50+ high-growth agencies, the pattern was clear:\n• 40% of time spent re-formatting posts\n• Inconsistent brand voice across channels\n• Missed optimal posting windows\n\nCentralized workflow orchestration changes everything. Plan once, publish everywhere.\n\nWhat does your content distribution stack look like today?',
            characterCount: 420,
            suggestedMedia: 'Carousel presentation or team photo',
            estimatedEngagementRate: '5.2%',
          },
          {
            channel: 'INSTAGRAM',
            content:
              'Stop stressing over your daily posting queue ✨\n\nOrganize your entire week of content in under 20 minutes with Orbitly.\n\nSave this post for your next content batching day! 📌\n.\n.\n.\n#ContentCreator #SocialMediaManager #ProductivityTips #Orbitly',
            characterCount: 245,
            suggestedMedia: 'High-contrast vertical reel cover or carousel grid',
            estimatedEngagementRate: '6.4%',
          },
        ],
      });
    } else if (prompt.includes('Rewrite Tool') || prompt.includes('action:')) {
      content =
        'Tired of posting in 10 different places manually? Orbitly lets you plan once and publish everywhere in seconds. 🚀';
    } else if (prompt.includes('Idea Generator') || prompt.includes('"ideas"') || prompt.includes('30-day')) {
      content = JSON.stringify({
        ideas: [
          {
            title: 'Behind the Scenes Workflow Breakdown',
            hook: 'Ever wondered how top creators schedule 30 days of posts in 1 afternoon?',
            format: 'CAROUSEL',
            suggestedChannels: ['LINKEDIN', 'INSTAGRAM'],
          },
          {
            title: 'The #1 Metric Most Creators Ignore',
            hook: 'Stop optimizing for likes. Here is the single number that drives 80% of conversions:',
            format: 'THREAD',
            suggestedChannels: ['TWITTER', 'THREADS'],
          },
          {
            title: 'Industry Myth Busting',
            hook: 'Unpopular opinion: Posting 5 times a day is burning you out with zero ROI.',
            format: 'SHORT_FORM_VIDEO',
            suggestedChannels: ['TIKTOK', 'YOUTUBE'],
          },
          {
            title: 'Customer Spotlight & Transformation',
            hook: 'How one freelancer cut client delivery time by 60% with unified scheduling.',
            format: 'IMAGE_POST',
            suggestedChannels: ['LINKEDIN', 'FACEBOOK'],
          },
          {
            title: 'Tool Stack Comparison Guide',
            hook: 'We spent $1,200 testing social media tools so you don’t have to.',
            format: 'THREAD',
            suggestedChannels: ['TWITTER', 'BLUESKY'],
          },
        ],
        thirtyDayCalendar: [
          { day: 1, theme: 'Vision & Kickoff', format: 'Thought Leadership Post' },
          { day: 3, theme: 'Actionable Tip', format: 'Step-by-step Carousel' },
          { day: 5, theme: 'Discussion Poll', format: 'Interactive Poll / Question' },
          { day: 8, theme: 'Case Study', format: 'Before & After Deep Dive' },
          { day: 10, theme: 'Meme / Relatable Humor', format: 'Visual Card' },
          { day: 12, theme: 'Product Feature Highlight', format: '1-min Demo Video' },
        ],
      });
    } else if (prompt.includes('Content Repurposing') || prompt.includes('"thread"')) {
      content = JSON.stringify({
        summary:
          'Unified scheduling platforms eliminate context switching and streamline multi-channel distribution for modern creators and teams.',
        thread: [
          '1/5 You do not need to spend 20 hours a week on social media to build an engaged audience. Here is the framework:',
          '2/5 Step 1: Create 1 anchor piece of long-form content every week.',
          '3/5 Step 2: Slice the core takeaway into 3 distinct hooks for X, LinkedIn, and Instagram.',
          '4/5 Step 3: Schedule the variants into your weekly posting slots in one session.',
          '5/5 Plan once, publish everywhere. Keep your brand consistent without burning out.',
        ],
        carouselSlides: [
          { slide: 1, headline: 'The Multi-Platform Playbook', body: 'How to scale reach without 10x effort' },
          { slide: 2, headline: 'The Bottleneck', body: 'Manual publishing creates friction and delays' },
          { slide: 3, headline: 'The Fix', body: 'Centralized queue and automated scheduling' },
          { slide: 4, headline: 'Key Takeaway', body: 'Consistency beats intensity every single time' },
        ],
        newsletterSnippet:
          'Struggling with multi-platform posting? In this week’s breakdown, we share the 3-step distribution engine used by top agency teams to stay consistent without working weekends.',
      });
    } else if (prompt.includes('Hashtag Generator') || prompt.includes('"top"')) {
      content = JSON.stringify({
        top: ['#SocialMediaStrategy', '#ContentMarketing', '#DigitalMarketing', '#MarketingTips'],
        niche: ['#SocialMediaWorkflow', '#BatchContentCreation', '#SocialMediaAutomation', '#AgencyProductivity'],
        trending: ['#CreatorEconomy2026', '#BuildInPublic', '#AIToolsForBusiness'],
      });
    } else if (prompt.includes('Alt Text Generator') || prompt.includes('"altText"')) {
      content = JSON.stringify({
        altText:
          'A modern clean dashboard interface showing a weekly social media calendar with scheduled posts across Twitter, LinkedIn, and Instagram, highlighted with color-coded status badges.',
        context: 'Accessibility description for social media schedule preview image.',
      });
    } else {
      content = `Orbitly AI generated response:\n\nPlan once. Publish everywhere with automated multi-channel scheduling and precision analytics.`;
    }

    const outputTokens = Math.max(25, Math.round(content.length / 4));

    return {
      content,
      inputTokens,
      outputTokens,
      model: options?.model || 'orbitly-mock-v1',
      provider: this.id,
    };
  }

  async generateImage(prompt: string, options?: GenerateImageOptions): Promise<AiImageResponse> {
    const randomSeed = Math.floor(Math.random() * 10000);
    return {
      url: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1024&q=80&sig=${randomSeed}`,
      prompt,
      model: options?.model || 'orbitly-image-v1',
      provider: this.id,
    };
  }
}
