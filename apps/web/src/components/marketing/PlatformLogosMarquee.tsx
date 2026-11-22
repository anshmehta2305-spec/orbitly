import React from 'react';
import { Marquee } from '@/components/ui/marquee';

export function PlatformLogosMarquee() {
  const platforms = [
    { name: 'X / Twitter', tag: 'Microblogging' },
    { name: 'LinkedIn', tag: 'Professional' },
    { name: 'Instagram', tag: 'Visual & Reels' },
    { name: 'Facebook', tag: 'Pages' },
    { name: 'Threads', tag: 'Conversations' },
    { name: 'TikTok', tag: 'Short Video' },
    { name: 'YouTube', tag: 'Video & Shorts' },
    { name: 'Pinterest', tag: 'Pins' },
    { name: 'Reddit', tag: 'Communities' },
    { name: 'Bluesky', tag: 'AT Protocol' },
    { name: 'Mastodon', tag: 'Fediverse' },
    { name: 'Telegram', tag: 'Broadcasts' },
    { name: 'Discord', tag: 'Announcements' },
    { name: 'Slack', tag: 'Workspaces' },
    { name: 'Medium', tag: 'Long-form' },
  ];

  return (
    <div className="w-full py-8 border-y border-border/60 bg-card/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 text-center mb-5">
        <p className="text-xs uppercase font-extrabold tracking-widest text-muted-foreground">
          Seamless Native Publishing Across All 15+ Global Platforms
        </p>
      </div>

      <Marquee pauseOnHover={true} className="[--duration:30s]">
        {platforms.map((p) => (
          <div
            key={p.name}
            className="flex items-center gap-2.5 px-5 py-2 rounded-xl border border-border bg-card/50 text-foreground text-xs font-bold hover:border-primary/40 hover:bg-secondary transition-all cursor-default shrink-0 shadow-sm"
          >
            <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-extrabold">
              {p.name.charAt(0)}
            </div>
            <span>{p.name}</span>
            <span className="text-[10px] text-muted-foreground font-normal">({p.tag})</span>
          </div>
        ))}
      </Marquee>
    </div>
  );
}
