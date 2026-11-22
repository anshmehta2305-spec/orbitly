'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Sparkles,
  Share2,
  Calendar,
  Send,
  X,
  Check,
  ArrowRight,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface GuidedFirstPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostScheduled?: () => void;
}

export function GuidedFirstPostModal({
  isOpen,
  onClose,
  onPostScheduled,
}: GuidedFirstPostModalProps) {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';

  const [selectedChannels, setSelectedChannels] = useState<string[]>(['linkedin']);
  const [content, setContent] = useState(
    "🚀 Excited to announce our new launch! We are officially live on Orbitly: one unified command center to plan once and publish everywhere. Check it out: https://orbitly.app #launch #socialmedia #creators"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const recommendedProviders = [
    {
      id: 'linkedin',
      name: 'LinkedIn',
      badge: 'Recommended First (High Reach)',
      popular: true,
      easiest: true,
    },
    {
      id: 'x',
      name: 'X (Twitter)',
      badge: 'Instant OAuth Connect',
      popular: true,
      easiest: true,
    },
    {
      id: 'bluesky',
      name: 'Bluesky',
      badge: 'Zero Review Required',
      popular: false,
      easiest: true,
    },
    {
      id: 'instagram',
      name: 'Instagram',
      badge: 'Needs Meta Business Page',
      popular: true,
      easiest: false,
    },
  ];

  const handleToggleChannel = (id: string) => {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleScheduleSample = async () => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsSubmitting(false);

    toast.success('🎉 Your first post has been scheduled for tomorrow at 10:00 AM!');
    if (onPostScheduled) onPostScheduled();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2">
          <Badge variant="pulse" className="text-primary border-primary/30">
            Guided 10-Minute Activation
          </Badge>
          <h2 className="text-2xl font-black text-foreground">
            Schedule Your Very First Post
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We pre-filled a high-converting launch draft for you. Pick your favorite channels below and schedule it in one click!
          </p>
        </div>

        {/* Channel Selection (Recommending easiest providers first) */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-primary" />
            1. Select Target Social Channels
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {recommendedProviders.map((prov) => {
              const isSelected = selectedChannels.includes(prov.id);
              return (
                <button
                  key={prov.id}
                  type="button"
                  onClick={() => handleToggleChannel(prov.id)}
                  className={`p-3 rounded-2xl border text-left transition-all relative ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                      : 'border-border bg-secondary/30 hover:border-border/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">{prov.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground block mt-1 line-clamp-1">
                    {prov.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Draft Editor */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              2. Review Sample Launch Copy
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {content.length} chars
            </span>
          </label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-secondary/40 border border-border rounded-2xl p-3.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary leading-relaxed resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push(`/${locale}/calendar?composer=true`);
            }}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold"
          >
            Open in Full Composer &rarr;
          </button>

          <Button
            variant="default"
            size="sm"
            disabled={isSubmitting || selectedChannels.length === 0}
            onClick={handleScheduleSample}
            className="w-full sm:w-auto font-bold gap-2 shadow-lg shadow-primary/20"
          >
            <Calendar className="w-4 h-4" /> Schedule for Tomorrow 10:00 AM
          </Button>
        </div>
      </div>
    </div>
  );
}
