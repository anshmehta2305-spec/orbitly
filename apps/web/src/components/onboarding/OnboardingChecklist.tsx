'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  X,
  Share2,
  PenSquare,
  Calendar,
  Users,
  Trophy,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface OnboardingStepItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: any;
  isCompleted: boolean;
}

export function OnboardingChecklist({
  onOpenGuidedPost,
}: {
  onOpenGuidedPost?: () => void;
}) {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [dismissed, setDismissed] = useState(false);
  const [steps, setSteps] = useState<OnboardingStepItem[]>([
    {
      id: 'connect_channel',
      title: 'Connect your first social channel',
      description: 'Link your LinkedIn, X, Bluesky, or Instagram in 60s.',
      href: `/${locale}/channels`,
      icon: Share2,
      isCompleted: true,
    },
    {
      id: 'create_post',
      title: 'Draft your first cross-platform post',
      description: 'Create a post tailored for multiple channels.',
      href: `/${locale}/calendar?composer=true`,
      icon: PenSquare,
      isCompleted: false,
    },
    {
      id: 'schedule_post',
      title: 'Schedule for optimal engagement',
      description: 'Pick an exact time or let the AI Best Time engine decide.',
      href: `/${locale}/calendar`,
      icon: Calendar,
      isCompleted: false,
    },
    {
      id: 'try_ai',
      title: 'Generate copy with AI Studio',
      description: 'Craft viral hooks and hashtags tailored to your tone.',
      href: `/${locale}/ai`,
      icon: Sparkles,
      isCompleted: false,
    },
    {
      id: 'invite_teammate',
      title: 'Invite a team member or client',
      description: 'Collaborate with review stages and live share links.',
      href: `/${locale}/team`,
      icon: Users,
      isCompleted: false,
    },
  ]);

  useEffect(() => {
    const isDismissed = localStorage.getItem('orbitly_onboarding_dismissed');
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  const completedCount = steps.filter((s) => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const handleDismiss = () => {
    localStorage.setItem('orbitly_onboarding_dismissed', 'true');
    setDismissed(true);
    toast.info('Onboarding checklist hidden. You can view tasks in Help Center anytime.');
  };

  const handleToggleComplete = (id: string) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const next = !s.isCompleted;
          if (next) toast.success(`Milestone completed: ${s.title}`);
          return { ...s, isCompleted: next };
        }
        return s;
      })
    );
  };

  if (dismissed) return null;

  return (
    <div className="p-6 rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            {progressPercent === 100 ? <Trophy className="w-5 h-5 text-amber-400" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
              Getting Started Checklist
              <Badge variant="outline" className="text-[10px] font-mono text-primary border-primary/30">
                {completedCount} / {steps.length} Completed
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
              Complete these 5 quick milestones to supercharge your social publishing workflow.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenGuidedPost && progressPercent < 100 && (
            <Button
              variant="default"
              size="sm"
              onClick={onOpenGuidedPost}
              className="hidden sm:flex text-xs font-bold gap-1.5 shadow-sm shadow-primary/20"
            >
              <PenSquare className="w-3.5 h-3.5" /> 1-Click First Post
            </Button>
          )}
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Dismiss checklist"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
          <span>Activation Progress</span>
          <span className="font-mono text-foreground font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-indigo-400 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                step.isCompleted
                  ? 'border-border/40 bg-secondary/20 opacity-80'
                  : 'border-border bg-card/60 hover:border-primary/40 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  onClick={() => handleToggleComplete(step.id)}
                  className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                >
                  {step.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </button>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-bold truncate ${
                      step.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-1">
                    {step.description}
                  </p>
                </div>
              </div>

              <Link href={step.href}>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary font-semibold gap-1">
                  Start <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
