'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  MessageCircle,
  Repeat,
  Send,
  Share2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  BarChart2,
  Bookmark,
  Music,
  ArrowBigUp,
  ArrowBigDown,
  Pin,
  Flame,
} from 'lucide-react';

interface PlatformPreviewProps {
  provider: string; // 'BLUESKY' | 'MASTODON' | 'TELEGRAM' | 'DISCORD' | 'X_TWITTER' | 'LINKEDIN' | 'TIKTOK' | 'PINTEREST' | 'REDDIT'
  accountName: string;
  avatarUrl?: string;
  color?: string;
  content: string;
  mediaUrls: string[];
  thread?: string[];
  firstComment?: string;
  poll?: { options: string[]; durationMinutes: number };
  discordSettings?: { embedColor?: string; embedTitle?: string };
  tiktokSettings?: { coverTimestampSec?: number; privacyLevel?: string };
  pinterestSettings?: { boardName?: string; sourceUrl?: string; title?: string };
  redditSettings?: {
    subreddit?: string;
    title?: string;
    isNsfw?: boolean;
    isSpoiler?: boolean;
    flairText?: string;
  };
}

export function PlatformPreview({
  provider,
  accountName,
  avatarUrl,
  color = '#6366f1',
  content,
  mediaUrls = [],
  thread = [],
  firstComment,
  poll,
  discordSettings,
  tiktokSettings,
  pinterestSettings,
  redditSettings,
}: PlatformPreviewProps) {
  const text = content.trim() || 'Start typing to see live preview...';
  const safeName = accountName || 'Orbitly';
  const initial = safeName.replace('@', '').charAt(0).toUpperCase() || 'O';

  // Highlight links and hashtags in text
  const renderFormattedText = (rawText: string) => {
    const parts = rawText.split(/(\s+)/);
    return parts.map((part, index) => {
      if (part.startsWith('http://') || part.startsWith('https://')) {
        return (
          <span key={index} className="text-primary hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      if (part.startsWith('#')) {
        return (
          <span key={index} className="text-indigo-400 font-semibold cursor-pointer">
            {part}
          </span>
        );
      }
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-cyan-400 font-semibold cursor-pointer">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="w-full max-w-md mx-auto bg-card border border-border/80 rounded-3xl p-5 shadow-xl transition-all">
      {/* Header bar indicating preview target */}
      <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shadow-sm"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {provider.replace('_', ' ')} Preview
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          Original Layout
        </Badge>
      </div>

      {/* 1. BLUESKY STYLE (AT Protocol) */}
      {provider === 'BLUESKY' && (
        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-sm"
              style={{ backgroundColor: color }}
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-bold text-foreground truncate">{accountName}</span>
                <span className="text-muted-foreground text-[11px] truncate">· just now</span>
              </div>
              <div className="text-foreground/90 whitespace-pre-wrap break-words mt-1.5 leading-relaxed text-[13px]">
                {renderFormattedText(text)}
              </div>

              {/* Media attachments */}
              {mediaUrls.length > 0 && (
                <div className={`mt-3 grid gap-1.5 rounded-2xl overflow-hidden border border-border/60 ${
                  mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                }`}>
                  {mediaUrls.map((url, i) => (
                    <div key={i} className="aspect-video bg-secondary/80 relative overflow-hidden flex items-center justify-center">
                      <img src={url} alt={`Media ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Action Bar */}
              <div className="flex items-center justify-between text-muted-foreground pt-3 mt-3 border-t border-border/40 text-[11px]">
                <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer">
                  <MessageCircle className="w-3.5 h-3.5" /> 0
                </span>
                <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer">
                  <Repeat className="w-3.5 h-3.5" /> 0
                </span>
                <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer">
                  <Heart className="w-3.5 h-3.5" /> 0
                </span>
                <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer">
                  <Share2 className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Thread Continuation if present */}
          {thread.length > 0 && (
            <div className="pl-4 border-l-2 border-primary/30 space-y-3 mt-2 ml-4">
              {thread.map((item, idx) => (
                <div key={idx} className="pt-2 text-[12px] text-foreground/80">
                  <p className="text-[10px] uppercase font-bold text-primary tracking-wider mb-1">
                    Thread item #{idx + 2}
                  </p>
                  <p className="whitespace-pre-wrap">{item}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. MASTODON STYLE */}
      {provider === 'MASTODON' && (
        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 shadow-sm"
              style={{ backgroundColor: color }}
            >
              {initial}
            </div>
            <div className="truncate">
              <p className="font-bold text-foreground text-sm truncate">{accountName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{accountName}@mastodon.social</p>
            </div>
          </div>

          <div className="text-foreground/90 whitespace-pre-wrap break-words leading-relaxed text-[13px] pt-1">
            {renderFormattedText(text)}
          </div>

          {/* Poll Preview */}
          {poll && poll.options && poll.options.length > 0 && (
            <div className="p-3 rounded-2xl bg-secondary/50 border border-border/80 space-y-2 mt-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-primary" />
                <span>Poll ({poll.durationMinutes / 60}h remaining)</span>
              </p>
              {poll.options.map((option, i) => (
                <div key={i} className="h-7 px-3 rounded-lg bg-background border border-border/60 flex items-center justify-between text-xs font-medium">
                  <span>{option}</span>
                  <span className="text-muted-foreground text-[10px]">0%</span>
                </div>
              ))}
            </div>
          )}

          {/* Media attachments */}
          {mediaUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden border border-border/60 mt-2">
              {mediaUrls.map((url, i) => (
                <img key={i} src={url} alt={`Attachment ${i}`} className="w-full aspect-video object-cover" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. TELEGRAM STYLE */}
      {provider === 'TELEGRAM' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-cyan-950/20 px-3 py-1.5 rounded-xl border border-cyan-500/20 text-xs">
            <span className="font-bold text-cyan-400">{accountName}</span>
            <span className="text-[10px] text-cyan-300/70 font-mono">Channel Broadcast</span>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/70 border border-border/80 shadow-inner space-y-3">
            {mediaUrls.length > 0 && (
              <div className="rounded-xl overflow-hidden max-h-60 bg-black/40">
                <img src={mediaUrls[0]} alt="Telegram attachment" className="w-full object-cover" />
              </div>
            )}
            <div className="text-xs text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
              {renderFormattedText(text)}
            </div>
            <div className="flex justify-end text-[10px] text-muted-foreground font-mono">
              12:34 PM ✓✓
            </div>
          </div>
        </div>
      )}

      {/* 4. DISCORD STYLE */}
      {provider === 'DISCORD' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
              O
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-foreground">Orbitly Bot</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500 text-white font-bold uppercase">BOT</span>
                <span className="text-[10px] text-muted-foreground">Today at 12:34 PM</span>
              </div>
            </div>
          </div>

          {/* Discord Embed Box */}
          <div
            className="p-3.5 rounded-xl bg-secondary/50 border-l-4 border border-border/80 space-y-2 text-xs"
            style={{ borderLeftColor: discordSettings?.embedColor || '#5865f2' }}
          >
            {discordSettings?.embedTitle && (
              <h5 className="font-bold text-sm text-foreground">{discordSettings.embedTitle}</h5>
            )}
            <p className="text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
              {renderFormattedText(text)}
            </p>
            {mediaUrls.length > 0 && (
              <div className="rounded-lg overflow-hidden border border-border/60 max-h-48 mt-2">
                <img src={mediaUrls[0]} alt="Discord embed" className="w-full object-cover" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TIKTOK VIDEO PREVIEW */}
      {provider === 'TIKTOK' && (
        <div className="relative rounded-2xl overflow-hidden bg-black text-white aspect-[9/16] max-h-[460px] flex flex-col justify-between p-4 shadow-2xl border border-border/80">
          {/* Background image / video cover mockup */}
          {mediaUrls.length > 0 ? (
            <img
              src={mediaUrls[0]}
              alt="TikTok Cover"
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 via-zinc-900 to-black flex items-center justify-center">
              <span className="text-zinc-500 text-xs font-mono">Video Thumbnail Frame</span>
            </div>
          )}

          {/* Top badges */}
          <div className="relative z-10 flex items-center justify-between text-[11px] font-bold">
            <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20">
              Following | <span className="underline">For You</span>
            </span>
            {tiktokSettings?.coverTimestampSec !== undefined && (
              <span className="px-2 py-0.5 rounded-full bg-primary/80 backdrop-blur-md text-white text-[10px]">
                Cover: {tiktokSettings.coverTimestampSec}s
              </span>
            )}
          </div>

          {/* Right Action Sidebar */}
          <div className="relative z-10 self-end space-y-4 text-center">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Heart className="w-5 h-5 fill-white text-white" />
              </div>
              <span className="text-[10px] font-bold">24.5k</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-bold">812</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Bookmark className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-bold">3.2k</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-bold">1.4k</span>
            </div>
          </div>

          {/* Bottom metadata and caption */}
          <div className="relative z-10 space-y-2 pt-2 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 -mx-4 -mb-4">
            <p className="font-bold text-sm text-white drop-shadow-md">{accountName}</p>
            <p className="text-xs text-white/95 line-clamp-3 leading-relaxed drop-shadow">
              {renderFormattedText(text)}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-white/80">
              <Music className="w-3.5 h-3.5 animate-spin" />
              <span className="truncate">Original Sound - {accountName}</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. PINTEREST PIN PREVIEW */}
      {provider === 'PINTEREST' && (
        <div className="rounded-2xl overflow-hidden border border-border/80 bg-card shadow-lg space-y-3 p-3 max-w-sm mx-auto">
          {/* Media Frame with Save button */}
          <div className="relative rounded-2xl overflow-hidden bg-secondary/40 aspect-[2/3] max-h-72">
            {mediaUrls.length > 0 ? (
              <img src={mediaUrls[0]} alt="Pin media" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                <Pin className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs">Attach an image to preview Pin</span>
              </div>
            )}
            <div className="absolute top-3 right-3">
              <button className="px-3.5 py-1.5 rounded-full bg-[#e60023] hover:bg-[#ad081b] text-white font-extrabold text-xs shadow-md transition-all">
                Save
              </button>
            </div>
            {pinterestSettings?.sourceUrl && (
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-medium flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                <span className="truncate max-w-[140px]">{pinterestSettings.sourceUrl.replace(/^https?:\/\//, '')}</span>
              </div>
            )}
          </div>

          {/* Pin Details */}
          <div className="space-y-1.5 px-1">
            <h4 className="font-bold text-sm text-foreground leading-snug">
              {pinterestSettings?.title || text.slice(0, 45) || 'Original Pin Title'}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {text}
            </p>
            <div className="pt-2 flex items-center justify-between border-t border-border/50 text-[11px]">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                  style={{ backgroundColor: color }}
                >
                  {initial}
                </div>
                <span>{accountName}</span>
              </div>
              <span className="text-muted-foreground font-mono text-[10px]">
                {pinterestSettings?.boardName || '📍 In Default Board'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 7. REDDIT POST PREVIEW */}
      {provider === 'REDDIT' && (
        <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-md text-xs">
          {/* Subreddit & Metadata header */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <div className="w-5 h-5 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-[9px]">
              r/
            </div>
            <span className="font-bold text-foreground hover:underline cursor-pointer">
              r/{redditSettings?.subreddit?.replace(/^r\//, '') || 'technology'}
            </span>
            <span>•</span>
            <span>Posted by {accountName} 2 hr. ago</span>
          </div>

          {/* Badges (NSFW, Spoiler, Flair) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {redditSettings?.isNsfw && (
              <Badge variant="destructive" className="text-[9px] px-1.5 py-0 uppercase font-black">
                NSFW
              </Badge>
            )}
            {redditSettings?.isSpoiler && (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 uppercase font-bold">
                Spoiler
              </Badge>
            )}
            {redditSettings?.flairText && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                {redditSettings.flairText}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-sm text-foreground leading-snug">
            {redditSettings?.title || text.slice(0, 70) || 'Reddit Post Title'}
          </h3>

          {/* Content / Media */}
          <div className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {renderFormattedText(text)}
          </div>

          {mediaUrls.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-border/60 max-h-56 mt-2">
              <img src={mediaUrls[0]} alt="Reddit media" className="w-full object-cover" />
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 flex items-center gap-2 text-muted-foreground font-semibold text-[11px]">
            <div className="flex items-center gap-1 bg-secondary/60 rounded-full px-2 py-1">
              <ArrowBigUp className="w-4 h-4 hover:text-orange-500 cursor-pointer" />
              <span>142</span>
              <ArrowBigDown className="w-4 h-4 hover:text-blue-500 cursor-pointer" />
            </div>
            <div className="flex items-center gap-1 bg-secondary/60 rounded-full px-2.5 py-1">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>38 Comments</span>
            </div>
            <div className="flex items-center gap-1 bg-secondary/60 rounded-full px-2.5 py-1">
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </div>
          </div>
        </div>
      )}

      {/* 8. GENERIC / X / LINKEDIN STYLE */}
      {provider !== 'BLUESKY' &&
        provider !== 'MASTODON' &&
        provider !== 'TELEGRAM' &&
        provider !== 'DISCORD' &&
        provider !== 'TIKTOK' &&
        provider !== 'PINTEREST' &&
        provider !== 'REDDIT' && (
        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shrink-0"
              style={{ backgroundColor: color }}
            >
              {initial}
            </div>
            <div>
              <p className="font-bold text-foreground">{accountName}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{provider.toLowerCase()}</p>
            </div>
          </div>

          <div className="text-foreground/90 whitespace-pre-wrap break-words leading-relaxed text-[13px] pt-1">
            {renderFormattedText(text)}
          </div>

          {mediaUrls.length > 0 && (
            <div className="rounded-xl overflow-hidden border border-border/60 mt-2">
              <img src={mediaUrls[0]} alt="Media" className="w-full aspect-video object-cover" />
            </div>
          )}
        </div>
      )}

      {/* First Comment Preview if provided */}
      {firstComment && (
        <div className="mt-4 p-3 rounded-2xl bg-secondary/30 border border-dashed border-border text-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> First Comment Preview
          </span>
          <p className="text-muted-foreground whitespace-pre-wrap text-[11px]">{firstComment}</p>
        </div>
      )}
    </div>
  );
}
