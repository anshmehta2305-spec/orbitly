'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TourStep {
  title: string;
  description: string;
  target: string;
}

export function ProductTour() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const steps: TourStep[] = [
    {
      title: 'Unified Dashboard Overview',
      description: 'Your flight control deck: monitor cross-channel reach, active posting queues, and approval requests in real time.',
      target: 'Overview',
    },
    {
      title: 'Multi-Channel Calendar & Queues',
      description: 'Plan weeks in advance. Drag-and-drop posts between dates, preview multi-image carousels, and use AI Best Time.',
      target: 'Calendar',
    },
    {
      title: 'Channels & Provider Plugins',
      description: 'Connect LinkedIn, X, Bluesky, Instagram, and YouTube via official OAuth with automatic token health verification.',
      target: 'Channels',
    },
    {
      title: 'AI Studio & Brand Voices',
      description: 'Supercharge copywriting. Repurpose long blog URLs or transcripts into threads tailored to your brand voice.',
      target: 'AI Studio',
    },
  ];

  useEffect(() => {
    const isCompleted = localStorage.getItem('orbitly_tour_completed');
    if (!isCompleted) {
      // Start tour on first visit
      setActiveStep(0);
    }
  }, []);

  const handleSkip = () => {
    localStorage.setItem('orbitly_tour_completed', 'true');
    setActiveStep(null);
  };

  const handleNext = () => {
    if (activeStep !== null) {
      if (activeStep < steps.length - 1) {
        setActiveStep(activeStep + 1);
      } else {
        handleSkip();
      }
    }
  };

  const handlePrev = () => {
    if (activeStep !== null && activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  if (activeStep === null) return null;

  const current = steps[activeStep];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Orbitly Product Tour"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-card border border-primary/30 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-primary text-white text-[10px] font-bold px-2 py-0.5">
            Tour: Step {activeStep + 1} of {steps.length}
          </Badge>
          <span className="text-[11px] font-semibold text-muted-foreground">{current.target}</span>
        </div>
        <button
          onClick={handleSkip}
          className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
          aria-label="Close tour"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-extrabold text-foreground">{current.title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{current.description}</p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <button
          onClick={handleSkip}
          className="text-xs text-muted-foreground hover:text-foreground font-semibold"
        >
          Skip tour
        </button>

        <div className="flex items-center gap-2">
          {activeStep > 0 && (
            <Button variant="outline" size="sm" onClick={handlePrev} className="h-7 px-2.5 text-xs">
              <ArrowLeft className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={handleNext}
            className="h-7 px-3 text-xs font-bold gap-1 shadow-sm shadow-primary/20"
          >
            {activeStep === steps.length - 1 ? (
              <>
                Done <Check className="w-3 h-3" />
              </>
            ) : (
              <>
                Next <ArrowRight className="w-3 h-3" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
