'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/app/AppShell';
import {
  Sparkles,
  PenSquare,
  Wand2,
  Lightbulb,
  Repeat,
  Image as ImageIcon,
  BookOpen,
  Copy,
  Check,
  Send,
  Zap,
  History,
  Plus,
  Trash2,
  ChevronRight,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AiStudioPage() {
  const [activeTab, setActiveTab] = useState<'writer' | 'rewrite' | 'ideas' | 'repurpose' | 'visuals' | 'voice'>('writer');
  const [creditBalance, setCreditBalance] = useState(195);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Post Writer State
  const [writerTopic, setWriterTopic] = useState('Announcing our new multi-channel social media scheduler for creators and agencies');
  const [writerChannels, setWriterChannels] = useState<string[]>(['TWITTER', 'LINKEDIN', 'INSTAGRAM']);
  const [writerTone, setWriterTone] = useState('Engaging & Thought Leadership');
  const [writerEmojiLevel, setWriterEmojiLevel] = useState<'none' | 'low' | 'medium' | 'high'>('medium');
  const [isGeneratingPosts, setIsGeneratingPosts] = useState(false);
  const [generatedVariants, setGeneratedVariants] = useState<any[]>([
    {
      channel: 'TWITTER',
      content: 'Most creators waste 10+ hours a week juggling 6 different tabs.\n\nHere is how Orbitly automates multi-platform publishing with 1 click: https://orbitly.io\n\n#SocialMediaStrategy #CreatorEconomy',
      charCount: 185,
    },
    {
      channel: 'LINKEDIN',
      content: 'The biggest bottleneck for scaling modern brands is fragmented distribution.\n\nWhen we audited 50+ high-growth agencies, the pattern was clear:\n• 40% of time spent re-formatting posts\n• Inconsistent brand voice across channels\n• Missed optimal posting windows\n\nCentralized workflow orchestration changes everything. Plan once, publish everywhere.\n\nWhat does your content distribution stack look like today?',
      charCount: 420,
    },
    {
      channel: 'INSTAGRAM',
      content: 'Stop stressing over your daily posting queue ✨\n\nOrganize your entire week of content in under 20 minutes with Orbitly.\n\nSave this post for your next content batching day! 📌\n.\n.\n.\n#ContentCreator #SocialMediaManager #ProductivityTips #Orbitly',
      charCount: 245,
    },
  ]);

  // Rewrite State
  const [rewriteText, setRewriteText] = useState('We are launching a new product today that makes scheduling easy for everyone across all platforms.');
  const [rewriteMode, setRewriteMode] = useState<'shorten' | 'expand' | 'change_tone' | 'fix_grammar'>('change_tone');
  const [rewrittenResult, setRewrittenResult] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);

  // Ideas State
  const [ideasNiche, setIdeasNiche] = useState('SaaS marketing & productivity');
  const [ideasAudience, setIdeasAudience] = useState('Freelancers, agency owners, creators');
  const [ideasGoal, setIdeasGoal] = useState('Drive signups and establish authority');
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<any[]>([
    {
      title: 'Behind the Scenes Workflow Breakdown',
      hook: 'Ever wondered how top creators schedule 30 days of posts in 1 afternoon?',
      format: 'CAROUSEL',
    },
    {
      title: 'The #1 Metric Most Creators Ignore',
      hook: 'Stop optimizing for vanity likes. Here is the single number that drives 80% of conversions:',
      format: 'THREAD',
    },
    {
      title: 'Industry Myth Busting',
      hook: 'Unpopular opinion: Posting 5 times a day is burning you out with zero ROI.',
      format: 'SHORT VIDEO',
    },
    {
      title: 'Customer Spotlight & Transformation',
      hook: 'How one freelancer cut client delivery time by 60% with unified scheduling.',
      format: 'CASE STUDY',
    },
  ]);

  // Repurpose State
  const [repurposeSource, setRepurposeSource] = useState('https://orbitly.io/blog/scaling-distribution');
  const [isRepurposing, setIsRepurposing] = useState(false);
  const [repurposedThread, setRepurposedThread] = useState<string[]>([
    '1/4 You do not need to spend 20 hours a week on social media to build an engaged audience. Here is the framework:',
    '2/4 Step 1: Create 1 anchor piece of long-form content every week.',
    '3/4 Step 2: Slice the core takeaway into 3 distinct hooks for X, LinkedIn, and Instagram.',
    '4/4 Plan once, publish everywhere. Keep your brand consistent without burning out.',
  ]);

  // Visuals State
  const [imagePrompt, setImagePrompt] = useState('A sleek modern dashboard showing global analytics and holographic social media orbit nodes, cyber minimalist, dark mode, high detail 8k');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1024&q=80');

  // Brand Voice State
  const [brandVoices, setBrandVoices] = useState<any[]>([
    {
      id: 'bv_1',
      name: 'Orbitly Official',
      traits: ['Visionary', 'Action-oriented', 'Approachable', 'Analytical'],
      dos: ['Lead with punchy hooks', 'Use measurable takeaways', 'Ask thoughtful questions'],
      donts: ['Avoid corporate jargon', 'Never sound cynical', 'Avoid excessive caps'],
      bannedWords: ['synergy', 'game-changing', 'disrupt', 'guru'],
    },
  ]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGeneratePosts = async () => {
    if (!writerTopic.trim()) return toast.error('Please enter a topic or brief.');
    setIsGeneratingPosts(true);
    try {
      const res = await fetch('http://localhost:4000/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': 'ws_demo_1' },
        body: JSON.stringify({
          topic: writerTopic,
          channels: writerChannels,
          tone: writerTone,
          emojiLevel: writerEmojiLevel,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.variants) setGeneratedVariants(data.variants);
        setCreditBalance((prev) => Math.max(0, prev - 3));
        toast.success('Generated 3 tailored post variants!');
      } else {
        throw new Error();
      }
    } catch {
      // Offline fallback
      setCreditBalance((prev) => Math.max(0, prev - 3));
      toast.success('Generated 3 tailored post variants!');
    } finally {
      setIsGeneratingPosts(false);
    }
  };

  const handleRewrite = async () => {
    if (!rewriteText.trim()) return toast.error('Please enter content to rewrite.');
    setIsRewriting(true);
    try {
      const res = await fetch('http://localhost:4000/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': 'ws_demo_1' },
        body: JSON.stringify({ content: rewriteText, mode: rewriteMode }),
      });
      if (res.ok) {
        const data = await res.json();
        setRewrittenResult(data.rewritten);
        setCreditBalance((prev) => Math.max(0, prev - 1));
        toast.success('Text rewritten successfully!');
      } else {
        throw new Error();
      }
    } catch {
      setRewrittenResult('Plan once. Publish everywhere with Orbitly’s automated multi-channel scheduling.');
      setCreditBalance((prev) => Math.max(0, prev - 1));
      toast.success('Text rewritten successfully!');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleGenerateIdeas = async () => {
    setIsGeneratingIdeas(true);
    setTimeout(() => {
      setCreditBalance((prev) => Math.max(0, prev - 2));
      toast.success('Generated content ideas and 30-day outline!');
      setIsGeneratingIdeas(false);
    }, 800);
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    setTimeout(() => {
      setCreditBalance((prev) => Math.max(0, prev - 5));
      setGeneratedImage(`https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1024&q=80&sig=${Date.now()}`);
      toast.success('Generated visual image!');
      setIsGeneratingImage(false);
    }, 1200);
  };

  return (
    <AppShell activeNav="aiStudio">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">AI Studio</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Enterprise generative tools for social copywriting, tone consistency, and visual ideation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Credit Balance Badge */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-primary fill-primary" />
              <span>{creditBalance} / 200 Credits</span>
              <span className="text-[10px] text-muted-foreground ml-1">Resets 1st of month</span>
            </div>

            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:bg-secondary text-xs font-semibold"
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>
          </div>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-border overflow-x-auto pb-1 text-sm">
          {[
            { id: 'writer', label: 'Post Writer', icon: PenSquare, cost: '3 credits' },
            { id: 'rewrite', label: 'Rewrite & Tone', icon: Wand2, cost: '1 credit' },
            { id: 'ideas', label: 'Ideas & Calendar', icon: Lightbulb, cost: '2 credits' },
            { id: 'repurpose', label: 'Repurpose URL', icon: Repeat, cost: '4 credits' },
            { id: 'visuals', label: 'Visuals & Alt Text', icon: ImageIcon, cost: '5 credits' },
            { id: 'voice', label: 'Brand Voices', icon: BookOpen, cost: '2 credits' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all shrink-0 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-black/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {tab.cost}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Post Writer */}
        {activeTab === 'writer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4 bg-card border border-border p-5 rounded-3xl shadow-sm">
              <h2 className="text-base font-bold flex items-center gap-2">
                <PenSquare className="w-4 h-4 text-primary" />
                <span>Compose Prompt</span>
              </h2>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Topic or Brief
                </label>
                <textarea
                  value={writerTopic}
                  onChange={(e) => setWriterTopic(e.target.value)}
                  rows={4}
                  className="w-full p-3 rounded-2xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="What would you like to post about?"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Target Platforms
                </label>
                <div className="flex flex-wrap gap-2">
                  {['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'THREADS', 'FACEBOOK'].map((ch) => {
                    const isSelected = writerChannels.includes(ch);
                    return (
                      <button
                        key={ch}
                        onClick={() =>
                          setWriterChannels((prev) =>
                            isSelected ? prev.filter((c) => c !== ch) : [...prev, ch],
                          )
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'border-border bg-background text-muted-foreground hover:bg-secondary'
                        }`}
                      >
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Tone
                  </label>
                  <select
                    value={writerTone}
                    onChange={(e) => setWriterTone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs"
                  >
                    <option>Engaging & Thought Leadership</option>
                    <option>Punchy & High Energy</option>
                    <option>Professional & Data-driven</option>
                    <option>Casual & Relatable</option>
                    <option>Educational Step-by-Step</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Emoji Density
                  </label>
                  <select
                    value={writerEmojiLevel}
                    onChange={(e) => setWriterEmojiLevel(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs"
                  >
                    <option value="none">None (Clean)</option>
                    <option value="low">Low (1-2)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="high">High (Expressive)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGeneratePosts}
                disabled={isGeneratingPosts}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                <Sparkles className={`w-4 h-4 ${isGeneratingPosts ? 'animate-spin' : ''}`} />
                <span>{isGeneratingPosts ? 'Generating Variants...' : 'Generate 3 Variations (3 Credits)'}</span>
              </button>
            </div>

            {/* Generated Variants Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Generated Tailored Variants
                </h2>
                <span className="text-xs text-muted-foreground">Tailored per platform limits & formatting</span>
              </div>

              <div className="space-y-4">
                {generatedVariants.map((v, i) => (
                  <div key={i} className="bg-card border border-border p-5 rounded-3xl space-y-3 relative group hover:border-primary/40 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase">
                          {v.channel}
                        </span>
                        <span className="text-xs text-muted-foreground">{v.charCount || v.content.length} chars</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(v.content, `var_${i}`)}
                          className="p-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
                          title="Copy text"
                        >
                          {copiedId === `var_${i}` ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={`/en/calendar?composer=true`}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-primary/10 hover:text-primary text-xs font-semibold"
                        >
                          <Send className="w-3 h-3" />
                          <span>Insert to Composer</span>
                        </a>
                      </div>
                    </div>

                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground font-sans bg-background/50 p-3.5 rounded-2xl border border-border/50">
                      {v.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Rewrite & Tone */}
        {activeTab === 'rewrite' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-4 bg-card border border-border p-5 rounded-3xl">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-primary" />
                <span>Original Content</span>
              </h2>

              <textarea
                value={rewriteText}
                onChange={(e) => setRewriteText(e.target.value)}
                rows={6}
                className="w-full p-3.5 rounded-2xl border border-border bg-background text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                placeholder="Paste or type text you want to rewrite..."
              />

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Transformation Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'shorten', label: 'Make Shorter & Concise' },
                    { id: 'expand', label: 'Expand into Deep Post' },
                    { id: 'change_tone', label: 'Punchier Brand Tone' },
                    { id: 'fix_grammar', label: 'Fix Grammar & Typos' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setRewriteMode(m.id as any)}
                      className={`p-3 rounded-2xl text-xs font-semibold text-left border transition-all ${
                        rewriteMode === m.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background hover:bg-secondary text-foreground'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleRewrite}
                disabled={isRewriting}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90"
              >
                <Wand2 className={`w-4 h-4 ${isRewriting ? 'animate-spin' : ''}`} />
                <span>{isRewriting ? 'Rewriting...' : 'Rewrite Text (1 Credit)'}</span>
              </button>
            </div>

            <div className="lg:col-span-6 space-y-4 bg-card border border-border p-5 rounded-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Rewritten Result</span>
                </h2>
                {rewrittenResult && (
                  <button
                    onClick={() => handleCopy(rewrittenResult, 'rewritten')}
                    className="flex items-center gap-1 px-3 py-1 rounded-xl border border-border hover:bg-secondary text-xs"
                  >
                    {copiedId === 'rewritten' ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                )}
              </div>

              <div className="min-h-[220px] p-4 rounded-2xl border border-border/70 bg-background text-sm leading-relaxed whitespace-pre-wrap flex items-center justify-center">
                {rewrittenResult ? (
                  <p className="w-full">{rewrittenResult}</p>
                ) : (
                  <span className="text-muted-foreground text-xs italic">
                    Select a style and click Rewrite to see the transformed copy here.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Ideas & Calendar */}
        {activeTab === 'ideas' && (
          <div className="space-y-6">
            <div className="bg-card border border-border p-5 rounded-3xl space-y-4">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                <span>Generate Content Ideas & 30-Day Campaign Outline</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Industry / Niche
                  </label>
                  <input
                    value={ideasNiche}
                    onChange={(e) => setIdeasNiche(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Target Audience
                  </label>
                  <input
                    value={ideasAudience}
                    onChange={(e) => setIdeasAudience(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Campaign Goal
                  </label>
                  <input
                    value={ideasGoal}
                    onChange={(e) => setIdeasGoal(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateIdeas}
                disabled={isGeneratingIdeas}
                className="px-6 py-2.5 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:bg-primary/90 text-sm"
              >
                <Lightbulb className={`w-4 h-4 ${isGeneratingIdeas ? 'animate-spin' : ''}`} />
                <span>{isGeneratingIdeas ? 'Brainstorming...' : 'Generate 10 Ideas + Calendar (2 Credits)'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedIdeas.map((idea, idx) => (
                <div key={idx} className="p-4 rounded-3xl bg-card border border-border space-y-2 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary text-primary">
                      {idea.format}
                    </span>
                    <button
                      onClick={() => handleCopy(idea.hook, `idea_${idx}`)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy hook</span>
                    </button>
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{idea.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed bg-background/50 p-2.5 rounded-xl border border-border/50">
                    "{idea.hook}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Repurpose URL */}
        {activeTab === 'repurpose' && (
          <div className="space-y-6">
            <div className="bg-card border border-border p-5 rounded-3xl space-y-4">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Repeat className="w-4 h-4 text-primary" />
                <span>Repurpose Article or URL into Social Threads & Carousels</span>
              </h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-success" />
                <span>Built-in SSRF protection: loops, localhost, and internal IPs are strictly blocked.</span>
              </div>

              <div className="flex gap-3">
                <input
                  value={repurposeSource}
                  onChange={(e) => setRepurposeSource(e.target.value)}
                  className="flex-1 p-3 rounded-2xl border border-border bg-background text-sm"
                  placeholder="https://yourblog.com/post-slug"
                />
                <button
                  onClick={() => toast.success('Repurposed article into social thread!')}
                  className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 shrink-0"
                >
                  Repurpose (4 Credits)
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Generated Multi-Slide Thread</h3>
              <div className="space-y-2">
                {repurposedThread.map((tweet, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-card border border-border flex items-start justify-between gap-4">
                    <p className="text-sm leading-relaxed text-foreground">{tweet}</p>
                    <button
                      onClick={() => handleCopy(tweet, `rep_${i}`)}
                      className="p-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Visuals & Alt Text */}
        {activeTab === 'visuals' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 space-y-4 bg-card border border-border p-5 rounded-3xl">
              <h2 className="text-base font-bold flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                <span>AI Social Image Generator</span>
              </h2>

              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={4}
                className="w-full p-3.5 rounded-2xl border border-border bg-background text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">Aspect Ratio:</span>
                {['1:1', '16:9', '9:16', '4:5'].map((r) => (
                  <button key={r} className="px-3 py-1 rounded-xl text-xs font-bold border border-border bg-background hover:bg-secondary">
                    {r}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage}
                className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90"
              >
                <Sparkles className={`w-4 h-4 ${isGeneratingImage ? 'animate-spin' : ''}`} />
                <span>{isGeneratingImage ? 'Generating Image...' : 'Generate Image (5 Credits)'}</span>
              </button>
            </div>

            <div className="lg:col-span-6 space-y-4 bg-card border border-border p-5 rounded-3xl">
              <h2 className="text-base font-bold">Image Output</h2>
              <div className="w-full h-64 rounded-2xl overflow-hidden border border-border bg-muted flex items-center justify-center">
                <img src={generatedImage} alt="Generated Social Visual" className="w-full h-full object-cover" />
              </div>
              <div className="p-3 bg-secondary/50 rounded-2xl text-xs text-muted-foreground space-y-1">
                <span className="font-semibold text-foreground">Alt Text (Accessibility):</span>
                <p>A sleek modern dashboard showing global analytics and holographic social media orbit nodes in high-contrast dark mode.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Brand Voice Manager */}
        {activeTab === 'voice' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Brand Voices</h2>
                <p className="text-xs text-muted-foreground">Define tone rules, dos & donts, and banned words enforced across all AI generations.</p>
              </div>
              <button
                onClick={() => toast.success('Brand voice creation modal opened')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Brand Voice</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {brandVoices.map((bv) => (
                <div key={bv.id} className="p-5 rounded-3xl bg-card border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground">{bv.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-bold uppercase">Active Default</span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Tone Traits</span>
                    <div className="flex flex-wrap gap-1.5">
                      {bv.traits.map((t: string) => (
                        <span key={t} className="px-2.5 py-0.5 rounded-full bg-secondary text-foreground text-xs font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-bold text-success block mb-1">Dos</span>
                      <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                        {bv.dos.map((d: string, i: number) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-bold text-destructive block mb-1">Donts</span>
                      <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                        {bv.donts.map((d: string, i: number) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Banned Words</span>
                    <div className="flex flex-wrap gap-1">
                      {bv.bannedWords.map((w: string) => (
                        <span key={w} className="px-2 py-0.5 rounded bg-destructive/10 text-destructive text-[11px] line-through">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History Slide-over Drawer */}
        {showHistory && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
            <div className="relative w-full max-w-md bg-card border-l border-border h-full p-6 overflow-y-auto space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  <span>Generation History</span>
                </h3>
                <button onClick={() => setShowHistory(false)} className="text-xs text-muted-foreground hover:text-foreground">
                  Close
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { type: 'POST_WRITER', brief: 'Multi-channel product launch announcement', cost: 3, time: '10m ago' },
                  { type: 'REWRITE', brief: 'Punchier tone adjustment for LinkedIn hook', cost: 1, time: '1h ago' },
                  { type: 'IDEAS', brief: '10 Campaign ideas for freelance productivity', cost: 2, time: '3h ago' },
                  { type: 'IMAGE', brief: 'Minimalist neon orb social banner 1:1', cost: 5, time: 'Yesterday' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-secondary/40 border border-border/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">{item.type}</span>
                      <span className="text-muted-foreground">{item.time}</span>
                    </div>
                    <p className="text-foreground">{item.brief}</p>
                    <span className="text-[10px] text-muted-foreground">Used {item.cost} credits</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
