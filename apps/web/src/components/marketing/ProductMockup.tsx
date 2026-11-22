'use client';

import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Send,
  Image as ImageIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ProductMockup() {
  const [selectedChannel, setSelectedChannel] = useState<'x' | 'linkedin' | 'instagram'>('x');

  const channels = [
    { id: 'x', name: 'X / Twitter', color: '#6366F1', max: 280, count: 184 },
    { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2', max: 3000, count: 420 },
    { id: 'instagram', name: 'Instagram', color: '#E1306C', max: 2200, count: 260 },
  ];

  return (
    <div className="relative w-full max-w-5xl mx-auto rounded-3xl border border-white/10 bg-slate-950/80 p-3 sm:p-5 shadow-2xl backdrop-blur-2xl overflow-hidden group">
      {/* Subtle Cosmic Ambient Glow Behind Mockup */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Mock Window Top Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 mb-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 font-mono text-[11px] text-slate-500">app.orbitly.com/calendar</span>
        </div>
        <div className="flex items-center gap-2 font-semibold">
          <Badge variant="pulse" className="text-[10px] py-0 px-2">
            Auto-Sync Active
          </Badge>
          <span className="text-slate-300">UTC Timezone</span>
        </div>
      </div>

      {/* Main Grid: Left Calendar View, Right Embedded Composer Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Interactive Calendar View (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/60 rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold text-white">November 2026</h4>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <button className="p-1 hover:bg-white/5 rounded-lg">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1 hover:bg-white/5 rounded-lg">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid (Days of week) */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] mb-2 font-semibold text-slate-500">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Days with Post Pills */}
          <div className="grid grid-cols-7 gap-1.5 text-[11px]">
            {/* Row 1 */}
            <div className="h-16 p-1 rounded-xl bg-slate-800/20 border border-white/5 text-slate-500">17</div>
            <div className="h-16 p-1 rounded-xl bg-slate-800/40 border border-white/5 text-slate-400">
              <span>18</span>
              <div className="mt-1 p-1 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-[9px] text-indigo-300 truncate font-semibold">
                X: Product Launch 🚀
              </div>
            </div>
            <div className="h-16 p-1 rounded-xl bg-slate-800/20 border border-white/5 text-slate-400">19</div>
            <div className="h-16 p-1 rounded-xl bg-slate-800/40 border border-white/5 text-slate-400">
              <span>20</span>
              <div className="mt-1 p-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-[9px] text-cyan-300 truncate font-semibold">
                IG: Creator Reel ✨
              </div>
            </div>
            <div className="h-16 p-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-white font-bold ring-1 ring-indigo-500/40">
              <span className="flex items-center justify-between">
                <span>21</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              </span>
              <div className="mt-1 p-1 rounded-lg bg-indigo-600 text-[9px] text-white truncate font-bold shadow-sm">
                Multi-Post (3 Ch)
              </div>
            </div>
            <div className="h-16 p-1 rounded-xl bg-slate-800/20 border border-white/5 text-slate-500">22</div>
            <div className="h-16 p-1 rounded-xl bg-slate-800/40 border border-white/5 text-slate-400">
              <span>23</span>
              <div className="mt-1 p-1 rounded-lg bg-blue-500/20 border border-blue-500/40 text-[9px] text-blue-300 truncate font-semibold">
                LinkedIn: Case Study
              </div>
            </div>
          </div>

          {/* AI Best Time suggestion card */}
          <div className="mt-3 p-2.5 rounded-xl bg-gradient-to-r from-indigo-950/60 to-cyan-950/60 border border-indigo-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300">Best Time to Post Today:</span>
              <span className="font-bold text-white">16:30 UTC</span>
            </div>
            <Badge variant="success" className="text-[10px] py-0">
              +28% Engagement
            </Badge>
          </div>
        </div>

        {/* Right: Floating Composer Card (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-white/10 p-4 flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Multi-Post Composer</h4>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                Global Draft
              </Badge>
            </div>

            {/* Channel Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950/60 rounded-xl">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannel(ch.id as any)}
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all ${
                    selectedChannel === ch.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {ch.name.split('/')[0]}
                </button>
              ))}
            </div>

            {/* Composer Text Box */}
            <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5 space-y-2">
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                Excited to announce Orbitly is now live! 🪐 Experience unified social scheduling across 15+
                platforms with built-in AI copywriting. Plan once. Publish everywhere.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Optimized
                  </span>
                  <span>#ContentCreation</span>
                </div>
                <span className="font-mono text-slate-400">
                  {selectedChannel === 'x' ? '184 / 280' : '420 / 3000'}
                </span>
              </div>
            </div>

            {/* Media Attachment preview */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/40 border border-white/5 text-xs text-slate-300">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div className="truncate flex-1">
                <p className="text-[11px] font-semibold truncate">orbitly-banner-4k.png</p>
                <p className="text-[9px] text-slate-500">2.4 MB • 3840x2160</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Today at 16:30 UTC</span>
            </div>
            <button className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 hover:opacity-90">
              <Send className="w-3 h-3" />
              Schedule Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
