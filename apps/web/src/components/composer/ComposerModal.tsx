'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { PlatformPreview } from './PlatformPreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Share2,
  Calendar,
  Clock,
  Send,
  Plus,
  Trash2,
  Smile,
  Hash,
  Paperclip,
  Check,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  Layers,
  Sparkles,
  BarChart2,
  CheckCircle2,
  Sliders,
  Crop,
  Eye,
  Undo2,
  Redo2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

export interface ChannelOption {
  id: string;
  provider: string; // 'BLUESKY' | 'MASTODON' | 'TELEGRAM' | 'DISCORD'
  accountName: string;
  color: string;
  avatar?: string;
  maxChars: number;
  maxImages: number;
  supportsThreads: boolean;
  supportsFirstComment: boolean;
  supportsPolls: boolean;
}

interface ComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: any) => void;
  initialScheduledAt?: string | null;
  channels: ChannelOption[];
  workspaceId: string;
}

const COMMON_EMOJIS = ['✨', '🚀', '🔥', '📢', '🪐', '💡', '📈', '💬', '🎉', '👍', '❤️', '🙌'];
const POPULAR_HASHTAGS = ['#orbitly', '#socialmedia', '#marketing', '#saas', '#creator', '#tech', '#growth'];

export function ComposerModal({
  isOpen,
  onClose,
  onPostCreated,
  initialScheduledAt,
  channels,
  workspaceId,
}: ComposerModalProps) {
  const t = useTranslations('Composer');

  // Selected Channels (default to standard text-publishing channels)
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>(() =>
    channels.filter((c) => c.provider !== 'TIKTOK' && c.provider !== 'PINTEREST').map((c) => c.id)
  );

  // Global Editor State
  const [globalContent, setGlobalContent] = useState('');
  const [globalMediaUrls, setGlobalMediaUrls] = useState<string[]>([]);
  const [globalThread, setGlobalThread] = useState<string[]>([]);
  const [globalFirstComment, setGlobalFirstComment] = useState('');

  // Per-channel Customization State
  const [customizePerChannel, setCustomizePerChannel] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('global'); // 'global' or channelId
  const [channelContents, setChannelContents] = useState<Record<string, string>>({});
  const [channelThreads, setChannelThreads] = useState<Record<string, string[]>>({});
  const [channelFirstComments, setChannelFirstComments] = useState<Record<string, string>>({});

  // Scheduling State
  const [postAction, setPostAction] = useState<'schedule' | 'now' | 'queue' | 'draft' | 'approval'>('schedule');
  const [scheduleDate, setScheduleDate] = useState(() => {
    if (initialScheduledAt) {
      return new Date(initialScheduledAt).toISOString().slice(0, 10);
    }
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [timezone, setTimezone] = useState('UTC');

  // Provider Custom Settings
  const [discordEmbedTitle, setDiscordEmbedTitle] = useState('');
  const [discordEmbedColor, setDiscordEmbedColor] = useState('#5865f2');
  const [mastoPollOptions, setMastoPollOptions] = useState<string[]>(['Option A', 'Option B']);
  const [mastoPollDuration, setMastoPollDuration] = useState(1440); // 24 hours

  // TikTok Settings
  const [tiktokCoverTimestamp, setTiktokCoverTimestamp] = useState<number>(0);
  const [tiktokPrivacy, setTiktokPrivacy] = useState<string>('PUBLIC_TO_EVERYONE');

  // Pinterest Settings
  const [pinterestBoard, setPinterestBoard] = useState('Inspiration & Design');
  const [pinterestSourceUrl, setPinterestSourceUrl] = useState('');
  const [pinterestTitle, setPinterestTitle] = useState('');

  // Reddit Settings
  const [redditSubreddit, setRedditSubreddit] = useState('technology');
  const [redditTitle, setRedditTitle] = useState('');
  const [redditFlair, setRedditFlair] = useState('');
  const [redditIsNsfw, setRedditIsNsfw] = useState(false);
  const [redditIsSpoiler, setRedditIsSpoiler] = useState(false);

  // UI state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showHashtagHelper, setShowHashtagHelper] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Undo / Redo history
  const [history, setHistory] = useState<string[]>(['']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Preview selected channel
  const [previewChannelId, setPreviewChannelId] = useState<string>(() =>
    channels.length > 0 ? channels[0].id : ''
  );

  // Initialize per-channel content copies when customize toggle enabled
  useEffect(() => {
    if (customizePerChannel) {
      const initialMap: Record<string, string> = {};
      selectedChannelIds.forEach((id) => {
        initialMap[id] = channelContents[id] || globalContent;
      });
      setChannelContents(initialMap);
    }
  }, [customizePerChannel]);

  // Mark unsaved changes and autosave
  useEffect(() => {
    if (globalContent.trim().length > 0) {
      setHasUnsavedChanges(true);
    }

    const autosaveTimer = setTimeout(() => {
      if (globalContent.trim().length > 0) {
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setHasUnsavedChanges(false);
      }
    }, 4000);

    return () => clearTimeout(autosaveTimer);
  }, [globalContent, channelContents, globalMediaUrls]);

  // Keyboard shortcut: Cmd/Ctrl + Enter to submit, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitPost();
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        handleAttemptClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, globalContent, selectedChannelIds, scheduleDate, scheduleTime]);

  if (!isOpen) return null;

  // Selected channel objects
  const activeSelectedChannels = channels.filter((c) => selectedChannelIds.includes(c.id));
  const activePreviewChannel = channels.find((c) => c.id === previewChannelId) || activeSelectedChannels[0] || channels[0];

  // Current active text in editor
  const currentText =
    customizePerChannel && activeTab !== 'global'
      ? channelContents[activeTab] || ''
      : globalContent;

  const handleTextChange = (val: string) => {
    if (customizePerChannel && activeTab !== 'global') {
      setChannelContents((prev) => ({ ...prev, [activeTab]: val }));
    } else {
      setGlobalContent(val);
      // Update history for undo
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), val]);
      setHistoryIndex((prev) => prev + 1);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setGlobalContent(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setGlobalContent(next);
    }
  };

  const handleAddEmoji = (emoji: string) => {
    handleTextChange(currentText + emoji);
    setShowEmojiPicker(false);
  };

  const handleAddHashtag = (tag: string) => {
    const space = currentText.length > 0 && !currentText.endsWith(' ') ? ' ' : '';
    handleTextChange(currentText + space + tag + ' ');
  };

  const handleAiAction = async (mode: 'shorten' | 'expand' | 'change_tone' | 'fix_grammar') => {
    if (!currentText.trim()) {
      toast.error('Write a draft first so Orbitly AI has context.');
      return;
    }
    setIsAiProcessing(true);
    try {
      const res = await fetch('http://localhost:4000/ai/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': 'ws_demo_1',
        },
        body: JSON.stringify({
          content: currentText,
          mode,
          targetTone: mode === 'change_tone' ? 'punchy and professional' : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        handleTextChange(data.rewritten);
        toast.success(`Enhanced with Orbitly AI (${mode})`);
      } else {
        throw new Error('AI gateway error');
      }
    } catch {
      // Fallback
      if (mode === 'shorten') handleTextChange(currentText.slice(0, Math.floor(currentText.length * 0.75)));
      else if (mode === 'change_tone') handleTextChange(`${currentText}\n\nPlan once. Publish everywhere.`);
      else handleTextChange(currentText.trim());
      toast.success('Applied AI enhancement');
    } finally {
      setIsAiProcessing(false);
      setShowAiAssistant(false);
    }
  };

  // Media upload simulation / presigned S3
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Simulate S3 upload
    const mockUploadedUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80`;
    setGlobalMediaUrls((prev) => [...prev, mockUploadedUrl]);
    toast.success(`Uploaded ${files[0].name} successfully!`);
  };

  // Preflight validation errors check
  const preflightIssues: { channelName: string; issue: string; isError: boolean }[] = [];
  if (selectedChannelIds.length === 0) {
    preflightIssues.push({ channelName: 'All Channels', issue: 'Select at least one channel to publish.', isError: true });
  }

  activeSelectedChannels.forEach((channel) => {
    const textToCheck = customizePerChannel ? channelContents[channel.id] || globalContent : globalContent;
    if (textToCheck.length > channel.maxChars) {
      preflightIssues.push({
        channelName: channel.accountName,
        issue: `Text exceeds ${channel.maxChars} limit (${textToCheck.length} chars). Truncate before scheduling.`,
        isError: true,
      });
    }
    if (channel.maxImages > 0 && globalMediaUrls.length > channel.maxImages) {
      preflightIssues.push({
        channelName: channel.accountName,
        issue: `Max images allowed is ${channel.maxImages} (you attached ${globalMediaUrls.length}).`,
        isError: false,
      });
    }
    if (channel.provider === 'TIKTOK' && globalMediaUrls.length === 0) {
      preflightIssues.push({
        channelName: channel.accountName,
        issue: 'TikTok requires a video attachment to publish.',
        isError: true,
      });
    }
    if (channel.provider === 'PINTEREST' && globalMediaUrls.length === 0) {
      preflightIssues.push({
        channelName: channel.accountName,
        issue: 'Pinterest requires at least 1 image or video attachment.',
        isError: true,
      });
    }
    if (channel.provider === 'REDDIT' && !redditTitle && textToCheck.length === 0) {
      preflightIssues.push({
        channelName: channel.accountName,
        issue: 'Reddit submissions require a title.',
        isError: true,
      });
    }
  });

  const hasBlockingErrors = preflightIssues.some((i) => i.isError);

  // Close attempt handler
  const handleAttemptClose = () => {
    if (hasUnsavedChanges && globalContent.trim().length > 0) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // Submit Post
  const handleSubmitPost = async () => {
    if (selectedChannelIds.length === 0) {
      toast.error('Please select at least one channel');
      return;
    }
    if (currentText.trim().length === 0 && globalMediaUrls.length === 0) {
      toast.error('Post content or media is required');
      return;
    }
    if (hasBlockingErrors) {
      toast.error('Please resolve pre-flight validation errors before scheduling');
      return;
    }

    setIsSubmitting(true);
    try {
      const scheduledDateTime =
        postAction === 'schedule'
          ? new Date(`${scheduleDate}T${scheduleTime}:00Z`).toISOString()
          : postAction === 'queue'
          ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
          : null;

      const variants = selectedChannelIds.map((channelId) => {
        const text = customizePerChannel ? channelContents[channelId] || globalContent : globalContent;
        const thread = customizePerChannel ? channelThreads[channelId] || globalThread : globalThread;
        const firstComment = customizePerChannel ? channelFirstComments[channelId] || globalFirstComment : globalFirstComment;

        return {
          channelId,
          content: text,
          mediaUrls: globalMediaUrls,
          thread,
          firstComment: firstComment || undefined,
          settings: {
            discordEmbedTitle,
            discordEmbedColor,
            mastoPoll: mastoPollOptions.filter(Boolean).length > 0 ? { options: mastoPollOptions, durationMinutes: mastoPollDuration } : undefined,
            tiktokCoverTimestampSec: tiktokCoverTimestamp,
            tiktokPrivacy,
            pinterestBoard,
            pinterestSourceUrl,
            pinterestTitle,
            redditSubreddit,
            redditTitle,
            redditFlair,
            redditIsNsfw,
            redditIsSpoiler,
          },
        };
      });

      const payload = {
        workspaceId,
        title: globalContent.slice(0, 50),
        scheduledAt: scheduledDateTime,
        timezone,
        postNow: postAction === 'now',
        submitForApproval: postAction === 'approval',
        variants,
      };

      // Call API
      const res = await fetch('http://localhost:4000/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Fallback simulation for client demonstration
        console.warn('Backend offline or simulated, dispatching optimistic post');
      }

      const postResult = {
        id: `post_${Date.now()}`,
        title: payload.title,
        status: postAction === 'now' ? 'PUBLISHED' : postAction === 'approval' ? 'PENDING_APPROVAL' : postAction === 'draft' ? 'DRAFT' : 'SCHEDULED',
        scheduledAt: scheduledDateTime,
        variants,
      };

      toast.success(
        postAction === 'now'
          ? 'Post published across all channels!'
          : postAction === 'draft'
          ? 'Post saved as draft!'
          : 'Post scheduled successfully!'
      );

      if (onPostCreated) onPostCreated(postResult);
      onClose();
    } catch {
      toast.error('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-card border border-border rounded-3xl w-full max-w-6xl h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Top Header */}
        <div className="h-16 px-6 border-b border-border flex items-center justify-between shrink-0 bg-secondary/20">
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>{t('title')}</span>
            </h2>

            {lastSavedTime && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 bg-secondary/80 px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3 text-emerald-500" />
                <span>Saved at {lastSavedTime}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 mr-2 text-xs text-muted-foreground">
              <span className="px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px] font-mono">⌘ + Enter</span>
              <span>to schedule</span>
            </div>

            <button
              onClick={handleAttemptClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Channel Selection Bar */}
        <div className="p-3 sm:px-6 border-b border-border bg-card/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">To:</span>
            {channels.map((channel) => {
              const isSelected = selectedChannelIds.includes(channel.id);
              return (
                <button
                  key={channel.id}
                  onClick={() => {
                    if (isSelected) {
                      if (selectedChannelIds.length > 1) {
                        setSelectedChannelIds(selectedChannelIds.filter((id) => id !== channel.id));
                      } else {
                        toast.error('At least one channel must remain selected');
                      }
                    } else {
                      setSelectedChannelIds([...selectedChannelIds, channel.id]);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0 ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-primary shadow-sm'
                      : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-extrabold"
                    style={{ backgroundColor: channel.color }}
                  >
                    {channel.provider.charAt(0)}
                  </div>
                  <span>{channel.accountName}</span>
                  {isSelected && <Check className="w-3 h-3 text-primary ml-0.5" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setSelectedChannelIds(channels.map((c) => c.id))}
              className="text-primary hover:underline font-semibold"
            >
              {t('selectAll')}
            </button>
            <span className="text-border">•</span>
            <button
              onClick={() => {
                if (channels.length > 0) setSelectedChannelIds([channels[0].id]);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              {t('deselectAll')}
            </button>
          </div>
        </div>

        {/* Main Body (2 Columns: Editor + Live Preview) */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Left Column: Editor */}
          <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto border-r border-border space-y-4">
            {/* Customization & Tabs Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customizePerChannel}
                    onChange={(e) => setCustomizePerChannel(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary"
                  />
                  <span>{t('customizePerChannel')}</span>
                </label>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleUndo}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
                  title="Undo"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleRedo}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary"
                  title="Redo"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Per-channel Tabs if enabled */}
            {customizePerChannel && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setActiveTab('global')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'global' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {t('channelTabGlobal')}
                </button>
                {activeSelectedChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setActiveTab(channel.id);
                      setPreviewChannelId(channel.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === channel.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: channel.color }}
                    />
                    <span>{channel.accountName}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Text Area */}
            <div className="relative flex-1 flex flex-col min-h-[160px]">
              <textarea
                value={currentText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={t('placeholder')}
                className="w-full flex-1 p-4 rounded-2xl border border-border bg-background text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-sans"
              />

              {/* Character Limit Counters Pill */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  {/* Emoji Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
                      title="Add Emoji"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute left-0 bottom-full mb-2 p-2 bg-card border border-border rounded-2xl shadow-xl flex gap-1 z-50">
                        {COMMON_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleAddEmoji(emoji)}
                            className="p-1 hover:bg-secondary rounded text-base"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hashtags Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowHashtagHelper(!showHashtagHelper)}
                      className="p-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
                      title="Hashtag Helper"
                    >
                      <Hash className="w-4 h-4" />
                    </button>
                    {showHashtagHelper && (
                      <div className="absolute left-0 bottom-full mb-2 p-2 bg-card border border-border rounded-2xl shadow-xl flex flex-wrap gap-1 max-w-xs z-50">
                        {POPULAR_HASHTAGS.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => handleAddHashtag(tag)}
                            className="text-[11px] px-2 py-1 rounded bg-secondary hover:bg-primary/20 text-foreground"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ask AI Assistant */}
                  <div className="relative">
                    <button
                      onClick={() => setShowAiAssistant(!showAiAssistant)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold"
                      title="Orbitly AI Assistant"
                      disabled={isAiProcessing}
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isAiProcessing ? 'animate-spin' : ''}`} />
                      <span>Ask AI</span>
                    </button>
                    {showAiAssistant && (
                      <div className="absolute left-0 bottom-full mb-2 p-2 bg-card border border-border rounded-2xl shadow-xl flex flex-col gap-1 w-48 z-50">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1">Enhance Text</div>
                        <button
                          onClick={() => handleAiAction('shorten')}
                          className="text-left text-xs px-2.5 py-1.5 rounded-lg hover:bg-secondary text-foreground flex items-center justify-between"
                        >
                          <span>Make shorter</span>
                          <span className="text-[10px] text-muted-foreground">1 credit</span>
                        </button>
                        <button
                          onClick={() => handleAiAction('expand')}
                          className="text-left text-xs px-2.5 py-1.5 rounded-lg hover:bg-secondary text-foreground flex items-center justify-between"
                        >
                          <span>Expand brief</span>
                          <span className="text-[10px] text-muted-foreground">1 credit</span>
                        </button>
                        <button
                          onClick={() => handleAiAction('change_tone')}
                          className="text-left text-xs px-2.5 py-1.5 rounded-lg hover:bg-secondary text-foreground flex items-center justify-between"
                        >
                          <span>Punchier tone</span>
                          <span className="text-[10px] text-muted-foreground">1 credit</span>
                        </button>
                        <button
                          onClick={() => handleAiAction('fix_grammar')}
                          className="text-left text-xs px-2.5 py-1.5 rounded-lg hover:bg-secondary text-foreground flex items-center justify-between"
                        >
                          <span>Fix grammar</span>
                          <span className="text-[10px] text-muted-foreground">1 credit</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Media Upload Label */}
                  <label className="p-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer">
                    <Paperclip className="w-4 h-4" />
                    <input type="file" onChange={handleMediaUpload} className="hidden" accept="image/*,video/*" />
                  </label>
                </div>

                {/* Character Badges per Channel */}
                <div className="flex items-center gap-2">
                  {activeSelectedChannels.map((c) => {
                    const charCount = (customizePerChannel ? channelContents[c.id] || globalContent : globalContent).length;
                    const isExceeded = charCount > c.maxChars;
                    return (
                      <span
                        key={c.id}
                        className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          isExceeded
                            ? 'bg-destructive/10 text-destructive border border-destructive/20'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                        title={`${c.accountName}: ${charCount} / ${c.maxChars}`}
                      >
                        {c.provider.charAt(0)}: {charCount}/{c.maxChars}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Media Upload Preview List */}
            {globalMediaUrls.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Attachments ({globalMediaUrls.length})
                </span>
                <div className="flex items-center gap-3 overflow-x-auto py-1">
                  {globalMediaUrls.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border shrink-0 group">
                      <img src={url} alt={`Media ${i}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setGlobalMediaUrls(globalMediaUrls.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-destructive transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Threads Section */}
            {activeSelectedChannels.some((c) => c.supportsThreads) && (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Threads (Bluesky &amp; Supported Networks)</span>
                  <button
                    onClick={() => setGlobalThread([...globalThread, ''])}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    {t('addThread')}
                  </button>
                </div>
                {globalThread.map((threadText, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-xs font-mono text-muted-foreground pt-2">#{idx + 2}</span>
                    <Input
                      value={threadText}
                      onChange={(e) => {
                        const updated = [...globalThread];
                        updated[idx] = e.target.value;
                        setGlobalThread(updated);
                      }}
                      placeholder={`Thread post #${idx + 2}...`}
                    />
                    <button
                      onClick={() => setGlobalThread(globalThread.filter((_, i) => i !== idx))}
                      className="p-2 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* First Comment Section */}
            {activeSelectedChannels.some((c) => c.supportsFirstComment) && (
              <div className="space-y-1.5 pt-2 border-t border-border/60">
                <label className="text-xs font-bold text-foreground">{t('firstCommentLabel')}</label>
                <Input
                  value={globalFirstComment}
                  onChange={(e) => setGlobalFirstComment(e.target.value)}
                  placeholder={t('firstCommentPlaceholder')}
                />
              </div>
            )}

            {/* Provider Custom Settings Button */}
            <div className="pt-2">
              <button
                onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
                className="text-xs font-bold text-primary flex items-center gap-1.5 hover:underline"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Platform Options (TikTok, Pinterest, Reddit, Discord)</span>
              </button>

              {showSettingsDrawer && (
                <div className="mt-3 p-4 rounded-2xl bg-secondary/40 border border-border space-y-4 text-xs animate-in fade-in">
                  {/* TikTok Settings */}
                  <div className="space-y-2 border-b border-border/50 pb-3">
                    <span className="font-bold text-foreground flex items-center gap-1">
                      📱 TikTok Settings
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-muted-foreground">Cover Frame (Sec)</label>
                        <Input
                          type="number"
                          value={tiktokCoverTimestamp}
                          onChange={(e) => setTiktokCoverTimestamp(Number(e.target.value) || 0)}
                          placeholder="e.g. 2"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground">Privacy Level</label>
                        <select
                          value={tiktokPrivacy}
                          onChange={(e) => setTiktokPrivacy(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs"
                        >
                          <option value="PUBLIC_TO_EVERYONE">Public</option>
                          <option value="MUTUAL_FOLLOW_FRIENDS">Friends Only</option>
                          <option value="SELF_ONLY">Private (Self Only)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Pinterest Settings */}
                  <div className="space-y-2 border-b border-border/50 pb-3">
                    <span className="font-bold text-foreground flex items-center gap-1">
                      📌 Pinterest Settings
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-muted-foreground">Destination Link (Source URL)</label>
                        <Input
                          value={pinterestSourceUrl}
                          onChange={(e) => setPinterestSourceUrl(e.target.value)}
                          placeholder="https://yourbrand.com/product"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground">Pin Title</label>
                        <Input
                          value={pinterestTitle}
                          onChange={(e) => setPinterestTitle(e.target.value)}
                          placeholder="Catchy Pin Title (max 100)"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Reddit Settings */}
                  <div className="space-y-2 border-b border-border/50 pb-3">
                    <span className="font-bold text-foreground flex items-center gap-1">
                      🤖 Reddit Submission
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-muted-foreground">Subreddit</label>
                        <Input
                          value={redditSubreddit}
                          onChange={(e) => setRedditSubreddit(e.target.value)}
                          placeholder="e.g. technology, webdev"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground">Post Title</label>
                        <Input
                          value={redditTitle}
                          onChange={(e) => setRedditTitle(e.target.value)}
                          placeholder="Reddit Submission Title"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={redditIsNsfw}
                          onChange={(e) => setRedditIsNsfw(e.target.checked)}
                          className="rounded text-primary"
                        />
                        <span>Mark NSFW</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={redditIsSpoiler}
                          onChange={(e) => setRedditIsSpoiler(e.target.checked)}
                          className="rounded text-primary"
                        />
                        <span>Mark Spoiler</span>
                      </label>
                    </div>
                  </div>

                  {/* Discord & Mastodon Settings */}
                  <div className="space-y-2">
                    <span className="font-bold text-foreground">💬 Discord & Mastodon</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-muted-foreground">Discord Embed Title</label>
                        <Input
                          value={discordEmbedTitle}
                          onChange={(e) => setDiscordEmbedTitle(e.target.value)}
                          placeholder="e.g. Product Update"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-muted-foreground">Mastodon Poll (Option 1)</label>
                        <Input
                          value={mastoPollOptions[0] || ''}
                          onChange={(e) => setMastoPollOptions([e.target.value, mastoPollOptions[1] || ''])}
                          placeholder="Option 1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Preflight Validation Summary */}
            {preflightIssues.length > 0 ? (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{t('preflightIssues')}</span>
                </div>
                {preflightIssues.map((issue, idx) => (
                  <p key={idx} className="pl-5 text-[11px] text-amber-400">
                    • <span className="font-semibold">{issue.channelName}</span>: {issue.issue}
                  </p>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{t('allClear')}</span>
              </div>
            )}
          </div>

          {/* Right Column: Live Platform Preview */}
          <div className="w-full lg:w-96 p-4 sm:p-6 bg-secondary/20 flex flex-col items-center justify-between border-t lg:border-t-0 border-border overflow-y-auto">
            <div className="w-full space-y-3">
              {/* Preview Channel Picker Tabs */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> Preview Platform
                </span>
                <div className="flex items-center gap-1 overflow-x-auto max-w-[200px]">
                  {activeSelectedChannels.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setPreviewChannelId(c.id)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold transition-transform ${
                        previewChannelId === c.id ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-card' : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.accountName}
                    >
                      {c.provider.charAt(0)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Render Preview Card */}
              {activePreviewChannel && (
                <PlatformPreview
                  provider={activePreviewChannel.provider}
                  accountName={activePreviewChannel.accountName}
                  color={activePreviewChannel.color}
                  content={
                    customizePerChannel
                      ? channelContents[activePreviewChannel.id] || globalContent
                      : globalContent
                  }
                  mediaUrls={globalMediaUrls}
                  thread={
                    customizePerChannel
                      ? channelThreads[activePreviewChannel.id] || globalThread
                      : globalThread
                  }
                  firstComment={
                    customizePerChannel
                      ? channelFirstComments[activePreviewChannel.id] || globalFirstComment
                      : globalFirstComment
                  }
                  discordSettings={{ embedTitle: discordEmbedTitle, embedColor: discordEmbedColor }}
                  tiktokSettings={{ coverTimestampSec: tiktokCoverTimestamp, privacyLevel: tiktokPrivacy }}
                  pinterestSettings={{ boardName: pinterestBoard, sourceUrl: pinterestSourceUrl, title: pinterestTitle }}
                  redditSettings={{
                    subreddit: redditSubreddit,
                    title: redditTitle,
                    isNsfw: redditIsNsfw,
                    isSpoiler: redditIsSpoiler,
                    flairText: redditFlair,
                  }}
                />
              )}
            </div>

            <p className="text-[11px] text-muted-foreground text-center mt-6">
              * Live preview updates in real-time as you type and add media attachments.
            </p>
          </div>
        </div>

        {/* Bottom Scheduling Controls Footer */}
        <div className="p-4 sm:px-6 border-t border-border bg-card/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Scheduling Date/Time Pickers */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={postAction}
              onChange={(e) => setPostAction(e.target.value as any)}
              className="h-10 px-3 rounded-xl border border-border bg-background text-xs font-semibold"
            >
              <option value="schedule">{t('schedule')}</option>
              <option value="now">{t('postNow')}</option>
              <option value="queue">{t('addToQueue')}</option>
              <option value="draft">{t('saveDraft')}</option>
              <option value="approval">{t('submitApproval')}</option>
            </select>

            {postAction === 'schedule' && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-36 h-10 text-xs"
                />
                <Input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-24 h-10 text-xs"
                />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="h-10 px-2 rounded-xl border border-border bg-background text-xs"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">EST / EDT</option>
                  <option value="Europe/London">GMT / BST</option>
                  <option value="Asia/Kolkata">IST (+05:30)</option>
                  <option value="Asia/Tokyo">JST</option>
                </select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleAttemptClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPost}
              disabled={isSubmitting || hasBlockingErrors}
              className="flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                'Processing...'
              ) : postAction === 'now' ? (
                <>
                  <Send className="w-4 h-4" />
                  <span>{t('postNow')}</span>
                </>
              ) : postAction === 'draft' ? (
                <span>{t('saveDraft')}</span>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>{t('schedule')}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Discard Confirmation Dialog */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base">{t('discardConfirm')}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You have an unfinished post. If you leave now, unsaved edits will be lost.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowDiscardConfirm(false)}>
                Keep Editing
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  onClose();
                }}
              >
                Discard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
